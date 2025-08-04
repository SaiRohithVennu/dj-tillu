import { useState, useEffect, useRef } from 'react';

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

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just the base64 data
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Initialize server-side AWS face recognition
  useEffect(() => {
    const initialize = async () => {
      if (initializationRef.current || !vipPeople.length || !enabled) return;
      
      initializationRef.current = true;
      setError(null);

      try {
        console.log('🔧 Initializing server-side AWS face recognition...');
        
        // Convert VIP photos to base64 for server processing
        const vipData = await Promise.all(vipPeople.map(async (person) => ({
          id: person.id,
          name: person.name,
          role: person.role,
          imageData: person.imageFile ? await fileToBase64(person.imageFile) : null
        })));

        // Call Supabase Edge Function to initialize AWS services
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/aws-face-recognition`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'initialize',
            eventId,
            vipPeople: vipData.filter(person => person.imageData) // Only include people with photos
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          setIsInitialized(true);
          console.log('✅ Server-side AWS face recognition initialized successfully');
          console.log(`📊 Indexed ${result.vipCount} VIP faces`);
        } else {
          throw new Error(result.error || 'Initialization failed');
        }

      } catch (error: any) {
        console.error('❌ Server-side AWS initialization failed:', error);
        setError(error.message);
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
        // Capture current video frame
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');

        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        ctx.drawImage(videoElement, 0, 0);
        
        // Convert to base64
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

        // Call server-side recognition
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/aws-face-recognition`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'recognize',
            eventId,
            imageData: imageBase64
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Recognition error: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          // Update crowd analysis
          setCrowdAnalysis(result.crowdAnalysis);

          // Process VIP matches
          for (const match of result.matches) {
            if (match.confidence > 75) { // High confidence threshold
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
                
                console.log(`🎯 Server-side AWS: ${vipPerson.name} recognized with ${match.confidence.toFixed(1)}% confidence`);
              }
            }
          }

          setLastAnalysis(new Date());
        }

      } catch (error: any) {
        console.error('❌ Server-side face recognition error:', error);
        setError(error.message);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Run recognition every 3 seconds
    intervalRef.current = setInterval(runRecognition, 3000);
    
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
        // Call cleanup endpoint
        const cleanup = async () => {
          try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            await fetch(`${supabaseUrl}/functions/v1/aws-face-recognition`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'cleanup',
                eventId
              })
            });
          } catch (error) {
            console.warn('Cleanup error:', error);
          }
        };
        cleanup();
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