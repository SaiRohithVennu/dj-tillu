import { useState, useEffect, useRef } from 'react';
import { serverSideAWS } from '../utils/serverSideAWS';

interface VIPPerson {
  id: string;
  name: string;
  role: string;
  imageFile?: File;
  imageUrl?: string;
  recognitionCount: number;
  lastSeen?: Date;
}

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
  const [isEnabled, setIsEnabled] = useState(false);
  const [status, setStatus] = useState<string>('disabled');
  const [recognitionResults, setRecognitionResults] = useState<VIPPerson[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout>();
  const initializationRef = useRef<boolean>(false);

  // Initialize AWS services when VIP people are available
  useEffect(() => {
    const initialize = async () => {
      if (initializationRef.current || !vipPeople.length || !isEnabled) return;
      
      initializationRef.current = true;
      setStatus('initializing');
      setError(null);

      try {
        console.log('🔧 Initializing server-side AWS services for', vipPeople.length, 'VIP people...');
        
        // Log VIP people being indexed
        vipPeople.forEach(person => {
          console.log(`👤 Indexing VIP: ${person.name} (${person.role}) - Has photo: ${!!person.imageFile}`);
        });

        const result = await serverSideAWS.initializeEvent(eventId, vipPeople);
        
        if (result.success) {
          setIsInitialized(true);
          setStatus('active');
          console.log('✅ Server-side AWS initialized successfully!');
        } else {
          throw new Error(result.message || 'AWS initialization failed');
        }

      } catch (error: any) {
        console.error('❌ Server-side AWS initialization failed:', error);
        setError(error.message);
        setStatus('error');
        setIsInitialized(false);
      }
    };

    if (vipPeople.length > 0 && isEnabled) {
      initialize();
    } else if (vipPeople.length === 0) {
      setStatus('disabled');
      setIsInitialized(false);
      initializationRef.current = false;
    }
  }, [vipPeople, eventId, isEnabled]);

  // Main recognition loop
  useEffect(() => {
    if (!isEnabled || !isInitialized || !videoElement) {
      return;
    }

    const runRecognition = async () => {
      try {
        const result = await serverSideAWS.recognizeFaces(eventId, videoElement);
        
        // Process recognition results
        for (const match of result.matches) {
          if (match.confidence > 75) {
            const vipPerson = vipPeople.find(p => p.id === match.personId);
            if (vipPerson) {
              const updatedPerson = {
                ...vipPerson,
                recognitionCount: (vipPerson.recognitionCount || 0) + 1,
                lastSeen: new Date()
              };

              setRecognitionResults(prev => {
                const existing = prev.find(p => p.id === vipPerson.id);
                if (existing) {
                  return prev.map(p => p.id === vipPerson.id ? updatedPerson : p);
                } else {
                  return [...prev, updatedPerson];
                }
              });

              // Trigger recognition callback
              onVIPRecognized(updatedPerson);
              
              console.log(`🎯 🎉 VIP RECOGNIZED: ${vipPerson.name} (${match.confidence.toFixed(1)}% confidence)`);
            }
          }
        }

      } catch (error: any) {
        console.error('❌ Face recognition error:', error);
        setError(error.message);
      }
    };

    // Run recognition every 3 seconds
    intervalRef.current = setInterval(runRecognition, 3000);
    
    // Run initial recognition after 2 seconds
    setTimeout(runRecognition, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isEnabled, isInitialized, videoElement, eventId, vipPeople]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitialized) {
        serverSideAWS.cleanupEvent(eventId);
      }
    };
  }, [eventId, isInitialized]);

  const toggleEnabled = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    
    if (!newEnabled) {
      setStatus('disabled');
      setIsInitialized(false);
      initializationRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } else if (vipPeople.length > 0) {
      setStatus('initializing');
      initializationRef.current = false; // Allow re-initialization
    }
    
    console.log(`🎯 Face Recognition: ${newEnabled ? 'Enabled' : 'Disabled'}`);
  };

  return {
    isEnabled,
    toggleEnabled,
    status,
    recognitionResults,
    error,
    isInitialized
  };
};