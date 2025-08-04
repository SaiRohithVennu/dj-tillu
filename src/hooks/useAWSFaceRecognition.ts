import { useState, useEffect, useRef } from 'react';
import { awsRekognition } from '../utils/awsRekognition';

interface VIPPerson {
  id: string;
  name: string;
  role: string;
  imageFile?: File;
  imageUrl?: string;
  recognitionCount: number;
  lastSeen?: Date;
}

interface UseAWSFaceRecognitionProps {
  videoElement: HTMLVideoElement | null;
  vipPeople: VIPPerson[];
  eventId: string;
  enabled: boolean;
  onVIPRecognized: (person: VIPPerson) => void;
}

export const useAWSFaceRecognition = ({
  videoElement,
  vipPeople,
  eventId,
  enabled,
  onVIPRecognized
}: UseAWSFaceRecognitionProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recognizedPeople, setRecognizedPeople] = useState<VIPPerson[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [crowdAnalysis, setCrowdAnalysis] = useState({
    faceCount: 0,
    emotions: [] as string[],
    averageAge: 0,
    dominantEmotion: 'neutral'
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const initializationRef = useRef<boolean>(false);

  // Initialize AWS Rekognition
  useEffect(() => {
    const initialize = async () => {
      if (initializationRef.current || !vipPeople.length) return;
      
      initializationRef.current = true;
      setError(null);

      try {
        console.log('🔧 Initializing AWS Rekognition...');
        
        // Add more detailed logging
        console.log('🔍 AWS Environment Check:', {
          hasAccessKey: !!import.meta.env.VITE_AWS_ACCESS_KEY_ID,
          hasSecretKey: !!import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
          region: import.meta.env.VITE_AWS_REGION,
          eventId,
          vipCount: vipPeople.length
        });
        
        // Initialize S3 bucket
        const bucketReady = await awsRekognition.initializeBucket();
        if (!bucketReady) {
          throw new Error('Failed to initialize S3 bucket - Check AWS credentials, permissions, and CORS policy');
        }

        // Create collection for this event
        const collectionReady = await awsRekognition.createCollection(eventId);
        if (!collectionReady) {
          throw new Error('Failed to create Rekognition collection - Check AWS Rekognition permissions and service availability');
        }

        // Index VIP faces
        const facesIndexed = await awsRekognition.indexVIPFaces(eventId, vipPeople);
        if (!facesIndexed) {
          throw new Error('Failed to index VIP faces - Check if photos are valid and S3 upload permissions');
        }

        setIsInitialized(true);
        console.log('✅ AWS Rekognition initialized successfully');

      } catch (error: any) {
        console.error('❌ AWS Rekognition initialization failed:', {
          message: error.message,
          stack: error.stack,
          code: error.code,
          name: error.name
        });
        
        // Provide user-friendly error messages
        if (error.message.includes('CORS')) {
          setError(`CORS Configuration Issue: ${error.message}`);
        } else if (error.message.includes('Credentials')) {
          setError(`AWS Credentials Issue: ${error.message}`);
        } else {
          setError(`AWS Service Error: ${error.message}`);
        }
        setIsInitialized(false);
      }
    };

    if (vipPeople.length > 0) {
      initialize();
    }
  }, [vipPeople, eventId]);

  // Main recognition loop
  useEffect(() => {
    if (!enabled || !isInitialized || !videoElement) {
      return;
    }

    const runRecognition = async () => {
      if (isAnalyzing) return;

      setIsAnalyzing(true);
      setError(null);

      try {
        // Run face recognition for VIPs
        const matches = await awsRekognition.recognizeFaces(eventId, videoElement);
        
        // Run general crowd analysis
        const analysis = await awsRekognition.detectFacesAndEmotions(videoElement);
        
        // Update crowd analysis
        setCrowdAnalysis({
          faceCount: analysis.faceCount,
          emotions: analysis.emotions,
          averageAge: analysis.averageAge,
          dominantEmotion: analysis.emotions.length > 0 ? 
            analysis.emotions.reduce((a, b, i, arr) => 
              arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
            ).toLowerCase() : 'neutral'
        });

        // Process VIP matches
        for (const match of matches) {
          if (match.confidence > 75) { // High confidence threshold
            const vipPerson = vipPeople.find(p => p.id === match.personName);
            if (vipPerson) {
              const updatedPerson = {
                ...vipPerson,
                recognitionCount: (vipPerson.recognitionCount || 0) + 1,
                lastSeen: new Date()
              };

              setRecognizedPeople(prev => {
                const existing = prev.find(p => p.id === vipPerson.id);
                if (existing) {
                  return prev.map(p => p.id === vipPerson.id ? updatedPerson : p);
                } else {
                  return [...prev, updatedPerson];
                }
              });

              // Trigger recognition callback
              onVIPRecognized(updatedPerson);
              
              console.log(`🎯 AWS Rekognition: ${vipPerson.name} recognized with ${match.confidence.toFixed(1)}% confidence`);
            }
          }
        }

        setLastAnalysis(new Date());

      } catch (error: any) {
        console.error('❌ AWS face recognition error:', error);
        setError(error.message);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Run recognition every 2 seconds
    intervalRef.current = setInterval(runRecognition, 2000);
    
    // Run immediately
    runRecognition();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, isInitialized, videoElement, eventId, vipPeople, isAnalyzing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitialized) {
        awsRekognition.deleteCollection(eventId);
      }
    };
  }, [eventId, isInitialized]);

  return {
    isInitialized,
    isAnalyzing,
    recognizedPeople,
    lastAnalysis,
    error,
    crowdAnalysis
  };
};