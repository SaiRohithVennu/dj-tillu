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
              
              console.log(`🎯 VIP RECOGNIZED: ${vipPerson.name} (${vipPerson.role}) detected with ${match.confidence.toFixed(1)}% confidence!`);
              
              // Trigger personalized announcement (only once per 2 minutes per person)
              const now = Date.now();
              const lastAnnouncementKey = `last_announcement_${vipPerson.id}`;
              const lastAnnouncementTime = parseInt(localStorage.getItem(lastAnnouncementKey) || '0');
              
              if (now - lastAnnouncementTime > 120000) { // 2 minutes
                localStorage.setItem(lastAnnouncementKey, now.toString());
                
                // Generate personalized announcement based on role and context
                const personalizedAnnouncement = generatePersonalizedAnnouncement(vipPerson, match.confidence);
                
                // Trigger the announcement through the voice system
                if (window.triggerPersonAnnouncement) {
                  window.triggerPersonAnnouncement(vipPerson.name, personalizedAnnouncement);
                }
                
                // Show browser notification for successful recognition
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification(`🎯 VIP Detected!`, {
                    body: personalizedAnnouncement,
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

  // Generate personalized announcements based on role and context
  const generatePersonalizedAnnouncement = (person: VIPPerson, confidence: number): string => {
    const timeOfDay = new Date().getHours();
    const isEvening = timeOfDay >= 18;
    const isMorning = timeOfDay >= 6 && timeOfDay < 12;
    
    const roleBasedAnnouncements = {
      'CEO': [
        `Ladies and gentlemen, our CEO ${person.name} has just arrived! Welcome to the party, boss!`,
        `The big boss is here! Everyone give a warm welcome to ${person.name}!`,
        `CEO in the house! ${person.name}, great to see you joining us!`,
        `Our fearless leader ${person.name} has entered the building! Welcome!`
      ],
      'Manager': [
        `Our amazing manager ${person.name} just walked in! Welcome to the celebration!`,
        `Manager alert! ${person.name} is here to join the fun!`,
        `Great to see our manager ${person.name} taking time to celebrate with us!`,
        `${person.name} our fantastic manager has arrived! Welcome!`
      ],
      'Intern': [
        `Our superstar intern ${person.name} is here! Welcome to the party!`,
        `Intern power! ${person.name} has joined us! Great to see you!`,
        `Our amazing intern ${person.name} just arrived! Welcome!`,
        `${person.name} our talented intern is here! Let's give them a warm welcome!`
      ],
      'Birthday Person': [
        `The birthday star has arrived! Everyone, please welcome ${person.name}!`,
        `It's the birthday legend! ${person.name} is here! Let's celebrate!`,
        `The guest of honor has entered! Happy birthday ${person.name}!`,
        `Birthday royalty in the house! ${person.name}, this party is for you!`
      ],
      'Guest Speaker': [
        `Our distinguished guest speaker ${person.name} has arrived! Welcome!`,
        `Speaker alert! ${person.name} is here! Thank you for joining us!`,
        `Our keynote speaker ${person.name} just walked in! Great to see you!`,
        `${person.name} our featured speaker has arrived! Welcome to the event!`
      ],
      'VIP Guest': [
        `VIP alert! ${person.name} has graced us with their presence!`,
        `Our special guest ${person.name} is here! Welcome!`,
        `VIP in the house! Everyone welcome ${person.name}!`,
        `Our honored guest ${person.name} has arrived! Great to see you!`
      ]
    };
    
    // Get role-specific announcements or use generic VIP
    const announcements = roleBasedAnnouncements[person.role as keyof typeof roleBasedAnnouncements] || 
                         roleBasedAnnouncements['VIP Guest'];
    
    // Add time-based context
    const timeContext = isMorning ? ' Good morning!' : 
                       isEvening ? ' Perfect timing for the evening!' : 
                       ' Great timing!';
    
    const selectedAnnouncement = announcements[Math.floor(Math.random() * announcements.length)];
    
    return selectedAnnouncement + timeContext;
  };
  return {
    isInitialized,
    isAnalyzing,
    recognizedPeople,
    lastAnalysis,
    error,
    crowdAnalysis,
    generatePersonalizedAnnouncement
  };
};