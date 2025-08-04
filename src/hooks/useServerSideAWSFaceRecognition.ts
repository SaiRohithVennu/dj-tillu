import { useState, useEffect, useRef } from 'react';
import { serverSideAWS, VIPPerson, FaceMatch, CrowdAnalysis } from '../utils/serverSideAWS';

interface UseServerSideAWSFaceRecognitionProps {
  videoElement: HTMLVideoElement | null;
  vipPeople: VIPPerson[];
  eventId: string;
  enabled: boolean;
  onVIPRecognized: (person: VIPPerson) => void;
}

export const useServerSideAWSFaceRecognition = ({
  videoElement,
  vipPeople,
  eventId,
  enabled,
  onVIPRecognized
}: UseServerSideAWSFaceRecognitionProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recognizedPeople, setRecognizedPeople] = useState<VIPPerson[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [crowdAnalysis, setCrowdAnalysis] = useState<CrowdAnalysis>({
    faceCount: 0,
    emotions: [],
    averageAge: 0,
    dominantEmotion: 'neutral'
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const initializationRef = useRef<boolean>(false);

  // Initialize server-side AWS services
  useEffect(() => {
    const initialize = async () => {
      if (initializationRef.current || !vipPeople.length || !enabled) return;
      
      initializationRef.current = true;
      setError(null);

      try {
        console.log('🔧 Initializing server-side AWS services...');
        
        const result = await serverSideAWS.initializeEvent(eventId, vipPeople);
        
        if (result.success) {
          setIsInitialized(true);
          console.log(`✅ Server-side AWS initialized: ${result.vipCount} VIPs indexed`);
        } else {
          throw new Error(result.message);
        }

      } catch (error: any) {
        console.error('❌ Server-side AWS initialization failed:', error);
        setError(`Initialization failed: ${error.message}`);
        setIsInitialized(false);
      }
    };

    if (vipPeople.length > 0 && enabled) {
      initialize();
    }
  }, [vipPeople, eventId, enabled]);

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
        const result = await serverSideAWS.recognizeFaces(eventId, videoElement);
        
        // Update crowd analysis
        setCrowdAnalysis(result.crowdAnalysis);

        // Process VIP matches
        for (const match of result.matches) {
          if (match.confidence > 75) {
            const vipPerson = vipPeople.find(p => p.id === match.personId);
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
              
              console.log(`🎯 FACE RECOGNIZED: ${vipPerson.name} detected with ${match.confidence.toFixed(1)}% confidence!`);
              
              // Trigger personalized announcement (only once per 5 minutes per person)
              const now = Date.now();
              const lastAnnouncementKey = `last_announcement_${vipPerson.id}`;
              const lastAnnouncementTime = parseInt(localStorage.getItem(lastAnnouncementKey) || '0');
              
              if (now - lastAnnouncementTime > 300000) { // 5 minutes
                localStorage.setItem(lastAnnouncementKey, now.toString());
                
                // Show browser notification for successful recognition
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification(`🎯 VIP Detected!`, {
                    body: `${vipPerson.name} (${vipPerson.role}) recognized with ${match.confidence.toFixed(1)}% confidence`,
                    icon: vipPerson.imageUrl
                  });
                }
              }
            }
          }
        }

        setLastAnalysis(new Date());

      } catch (error: any) {
        console.error('❌ Server-side face recognition error:', error);
        setError(`Recognition error: ${error.message}`);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Run recognition every 3 seconds (less frequent to reduce server load)
    intervalRef.current = setInterval(runRecognition, 3000);
    
    // Run immediately after 2 seconds
    setTimeout(runRecognition, 2000);

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
        serverSideAWS.cleanupEvent(eventId);
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