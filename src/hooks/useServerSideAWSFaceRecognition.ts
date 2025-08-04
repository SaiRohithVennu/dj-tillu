import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseStorage';

interface FaceRecognitionResult {
  faceId: string;
  confidence: number;
  boundingBox: {
    width: number;
    height: number;
    left: number;
    top: number;
  };
  personName?: string;
  personRole?: string;
}

interface CrowdAnalytics {
  totalFaces: number;
  averageAge?: number;
  genderDistribution?: {
    male: number;
    female: number;
  };
  emotions?: {
    happy: number;
    sad: number;
    angry: number;
    surprised: number;
    disgusted: number;
    fearful: number;
    calm: number;
  };
}

interface VIPRecognition {
  personId: string;
  name: string;
  role: string;
  confidence: number;
  recognitionCount: number;
  lastSeen: number;
  shouldAnnounce: boolean;
}

export const useServerSideAWSFaceRecognition = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedFaces, setRecognizedFaces] = useState<FaceRecognitionResult[]>([]);
  const [crowdAnalytics, setCrowdAnalytics] = useState<CrowdAnalytics>({ totalFaces: 0 });
  const [vipRecognitions, setVipRecognitions] = useState<VIPRecognition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState<string>('');

  // Initialize AWS Rekognition collection
  const initializeCollection = useCallback(async (eventId: string, vipPeople: any[]) => {
    try {
      setIsProcessing(true);
      setError(null);

      const newCollectionId = `event-${eventId}-${Date.now()}`;
      
      console.log('🔧 Initializing AWS Rekognition collection:', newCollectionId);
      console.log('👥 VIP People to index:', vipPeople.length);

      // Call Supabase Edge Function to initialize collection
      const { data, error: functionError } = await supabase.functions.invoke('aws-face-recognition', {
        body: {
          action: 'initialize',
          collectionId: newCollectionId,
          vipPeople: vipPeople.map(person => ({
            id: person.id,
            name: person.name,
            role: person.role,
            imageFile: person.imageFile ? await fileToBase64(person.imageFile) : null
          }))
        }
      });

      if (functionError) {
        throw new Error(`Failed to initialize collection: ${functionError.message}`);
      }

      if (data?.success) {
        setCollectionId(newCollectionId);
        setIsInitialized(true);
        console.log('✅ AWS Rekognition collection initialized successfully');
        console.log('📊 Indexed faces:', data.indexedFaces || 0);
      } else {
        throw new Error(data?.error || 'Unknown error during initialization');
      }

    } catch (err) {
      console.error('❌ Failed to initialize AWS Rekognition:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize face recognition');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Process video frame for face recognition
  const processFrame = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!isInitialized || isProcessing || !collectionId) {
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Capture frame from video
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0);

      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      const base64Data = imageData.split(',')[1];

      // Call Supabase Edge Function for face recognition
      const { data, error: functionError } = await supabase.functions.invoke('aws-face-recognition', {
        body: {
          action: 'recognize',
          collectionId,
          imageData: base64Data
        }
      });

      if (functionError) {
        throw new Error(`Recognition failed: ${functionError.message}`);
      }

      if (data?.success) {
        // Update recognized faces
        setRecognizedFaces(data.faces || []);
        
        // Update crowd analytics
        setCrowdAnalytics({
          totalFaces: data.totalFaces || 0,
          averageAge: data.averageAge,
          genderDistribution: data.genderDistribution,
          emotions: data.emotions
        });

        // Process VIP recognitions
        if (data.vipMatches && data.vipMatches.length > 0) {
          const currentTime = Date.now();
          
          setVipRecognitions(prev => {
            const updated = [...prev];
            
            data.vipMatches.forEach((match: any) => {
              const existingIndex = updated.findIndex(v => v.personId === match.personId);
              
              if (existingIndex >= 0) {
                // Update existing recognition
                const existing = updated[existingIndex];
                const timeSinceLastSeen = currentTime - existing.lastSeen;
                
                updated[existingIndex] = {
                  ...existing,
                  confidence: match.confidence,
                  recognitionCount: existing.recognitionCount + 1,
                  lastSeen: currentTime,
                  // Only announce if it's been more than 5 minutes since last announcement
                  shouldAnnounce: timeSinceLastSeen > 5 * 60 * 1000
                };
              } else {
                // New recognition
                updated.push({
                  personId: match.personId,
                  name: match.name,
                  role: match.role,
                  confidence: match.confidence,
                  recognitionCount: 1,
                  lastSeen: currentTime,
                  shouldAnnounce: true
                });
              }
            });
            
            return updated;
          });
        }

        console.log('🎯 Face recognition completed:', {
          totalFaces: data.totalFaces,
          vipMatches: data.vipMatches?.length || 0
        });

      } else {
        console.warn('⚠️ Face recognition returned no data');
      }

    } catch (err) {
      console.error('❌ Face recognition error:', err);
      setError(err instanceof Error ? err.message : 'Face recognition failed');
    } finally {
      setIsProcessing(false);
    }
  }, [isInitialized, isProcessing, collectionId]);

  // Mark VIP as announced (to prevent spam)
  const markVIPAsAnnounced = useCallback((personId: string) => {
    setVipRecognitions(prev =>
      prev.map(vip =>
        vip.personId === personId
          ? { ...vip, shouldAnnounce: false }
          : vip
      )
    );
  }, []);

  // Get VIPs that should be announced
  const getVIPsToAnnounce = useCallback(() => {
    return vipRecognitions.filter(vip => vip.shouldAnnounce && vip.confidence > 0.75);
  }, [vipRecognitions]);

  // Cleanup collection when component unmounts
  const cleanup = useCallback(async () => {
    if (collectionId) {
      try {
        await supabase.functions.invoke('aws-face-recognition', {
          body: {
            action: 'cleanup',
            collectionId
          }
        });
        console.log('🧹 AWS Rekognition collection cleaned up');
      } catch (err) {
        console.error('❌ Failed to cleanup collection:', err);
      }
    }
  }, [collectionId]);

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };
      reader.onerror = error => reject(error);
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    // State
    isInitialized,
    isProcessing,
    recognizedFaces,
    crowdAnalytics,
    vipRecognitions,
    error,
    collectionId,
    
    // Actions
    initializeCollection,
    processFrame,
    markVIPAsAnnounced,
    getVIPsToAnnounce,
    cleanup
  };
};