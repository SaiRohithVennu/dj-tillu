import { useState, useEffect, useRef } from 'react';

interface VIPPerson {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
  customGreeting?: string;
}

interface EventDetails {
  name: string;
  type: string;
  duration: number;
  aiPersonality: string;
}

interface RecognizedPerson {
  name: string;
  confidence: number;
  timestamp: number;
}

interface UseContinuousAIAgentProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  vipPeople: VIPPerson[];
  eventDetails: EventDetails;
  onAnnouncement: (text: string, priority: 'high' | 'medium' | 'low') => void;
  enabled: boolean;
}

export const useContinuousAIAgent = ({
  videoRef,
  vipPeople,
  eventDetails,
  onAnnouncement,
  enabled
}: UseContinuousAIAgentProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastActivity, setLastActivity] = useState<string>('');
  const [recognizedPeople, setRecognizedPeople] = useState<RecognizedPerson[]>([]);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'active' | 'analyzing'>('idle');
  const [stats, setStats] = useState({
    totalAnnouncements: 0,
    lastAnnouncementTime: null as string | null
  });

  const analysisIntervalRef = useRef<NodeJS.Timeout>();
  const lastAnalysisTime = useRef<number>(0);

  // Start the AI agent
  const startAgent = () => {
    if (!enabled) return;
    
    setIsRunning(true);
    setAgentStatus('active');
    console.log('🤖 Continuous AI Agent started');
  };

  // Stop the AI agent
  const stopAgent = () => {
    setIsRunning(false);
    setAgentStatus('idle');
    
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }
    
    console.log('🤖 Continuous AI Agent stopped');
  };

  // Analyze video frame with OpenAI
  const analyzeVideoFrame = async (): Promise<void> => {
    if (!videoRef.current || !isRunning) return;

    const now = Date.now();
    if (now - lastAnalysisTime.current < 5000) return; // Analyze every 5 seconds

    lastAnalysisTime.current = now;
    setAgentStatus('analyzing');

    try {
      // Capture frame from video
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      // Create analysis prompt for OpenAI
      const vipNames = vipPeople.map(p => `${p.name} (${p.role})`).join(', ');
      
      const analysisPrompt = `You are an AI event host watching a live video feed at "${eventDetails.name}" (${eventDetails.type}). 

ANALYZE THIS SCENE:
1. Count visible people
2. Describe what's happening (talking, dancing, presenting, etc.)
3. Look for these VIP people: ${vipNames || 'none specified'}
4. Determine if you should make an announcement

EVENT CONTEXT:
- Event: ${eventDetails.name}
- Type: ${eventDetails.type}
- AI Personality: ${eventDetails.aiPersonality}
- VIPs to recognize: ${vipNames}

RESPOND IN THIS FORMAT:
People: [number]
Activity: [what people are doing]
VIP_Spotted: [name if you see them, or "none"]
Should_Announce: [yes/no]
Announcement: [what to say, or "none"]
Priority: [high/medium/low]

Example: "People: 3, Activity: having conversation, VIP_Spotted: Sarah Johnson, Should_Announce: yes, Announcement: Welcome our amazing CEO Sarah! Great to see you here!, Priority: high"`;

      // Call OpenAI Vision API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: analysisPrompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const analysisResult = data.choices[0].message.content;

      // Parse the analysis
      const peopleMatch = analysisResult.match(/People:\s*(\d+)/i);
      const activityMatch = analysisResult.match(/Activity:\s*([^\n,]+)/i);
      const vipMatch = analysisResult.match(/VIP_Spotted:\s*([^\n,]+)/i);
      const shouldAnnounceMatch = analysisResult.match(/Should_Announce:\s*(yes|no)/i);
      const announcementMatch = analysisResult.match(/Announcement:\s*([^\n]+)/i);
      const priorityMatch = analysisResult.match(/Priority:\s*(high|medium|low)/i);

      const peopleCount = peopleMatch ? parseInt(peopleMatch[1]) : 0;
      const activity = activityMatch?.[1]?.trim() || 'general activity';
      const vipSpotted = vipMatch?.[1]?.trim();
      const shouldAnnounce = shouldAnnounceMatch?.[1] === 'yes';
      const announcement = announcementMatch?.[1]?.trim();
      const priority = (priorityMatch?.[1] as 'high' | 'medium' | 'low') || 'medium';

      setLastActivity(activity);

      // Handle VIP recognition
      if (vipSpotted && vipSpotted !== 'none') {
        const recognizedPerson: RecognizedPerson = {
          name: vipSpotted,
          confidence: 85, // Simulated confidence
          timestamp: now
        };

        setRecognizedPeople(prev => {
          const existing = prev.find(p => p.name === vipSpotted);
          if (!existing) {
            return [...prev, recognizedPerson];
          }
          return prev;
        });

        console.log('🎯 VIP Recognized:', vipSpotted);
      }

      // Handle announcements
      if (shouldAnnounce && announcement && announcement !== 'none') {
        onAnnouncement(announcement, priority);
        
        setStats(prev => ({
          totalAnnouncements: prev.totalAnnouncements + 1,
          lastAnnouncementTime: new Date().toLocaleTimeString()
        }));

        console.log('🎤 AI Announcement:', announcement);
      }

      setAgentStatus('active');

    } catch (error) {
      console.error('🤖 AI Agent analysis error:', error);
      setAgentStatus('active'); // Continue running despite errors
    }
  };

  // Main analysis loop
  useEffect(() => {
    if (!isRunning || !enabled) return;

    analysisIntervalRef.current = setInterval(analyzeVideoFrame, 2000);

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [isRunning, enabled, vipPeople, eventDetails]);

  return {
    startAgent,
    stopAgent,
    isRunning,
    lastActivity,
    recognizedPeople,
    agentStatus,
    stats
  };
};