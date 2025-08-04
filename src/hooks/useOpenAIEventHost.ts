import { useState, useEffect, useRef } from 'react';
import { Track } from '../data/tracks';
import { openAIEventHost } from '../utils/openAIEventHost';

interface VIPPerson {
  id: string;
  name: string;
  role: string;
  imageFile?: File;
  imageUrl?: string;
  greeting?: string;
  recognitionCount: number;
  lastSeen?: Date;
}

interface EventContext {
  eventName: string;
  eventType: 'birthday' | 'corporate' | 'wedding' | 'party' | 'conference';
  duration: number;
  aiPersonality: 'humorous' | 'formal' | 'energetic' | 'professional';
  vipPeople: VIPPerson[];
  startTime: Date;
}

interface AIDecision {
  shouldAnnounce: boolean;
  announcement?: string;
  shouldChangeMusic: boolean;
  suggestedTrack?: string;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface UseOpenAIEventHostProps {
  eventContext: EventContext;
  recognizedVIPs: VIPPerson[];
  crowdSize: number;
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onAnnouncement: (message: string) => void;
  onTrackChange: (track: Track) => void;
  enabled: boolean;
}

export const useOpenAIEventHost = ({
  eventContext,
  recognizedVIPs,
  crowdSize,
  tracks,
  currentTrack,
  isPlaying,
  onAnnouncement,
  onTrackChange,
  enabled
}: UseOpenAIEventHostProps) => {
  const [isActive, setIsActive] = useState(false);
  const [lastDecision, setLastDecision] = useState<AIDecision | null>(null);
  const [decisionHistory, setDecisionHistory] = useState<AIDecision[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [lastVIPAnnouncements, setLastVIPAnnouncements] = useState<Map<string, number>>(new Map());

  const intervalRef = useRef<NodeJS.Timeout>();
  const lastDecisionTime = useRef<number>(0);

  // Start AI hosting
  const startAI = () => {
    if (!enabled) return;
    
    setIsActive(true);
    openAIEventHost.resetHistory();
    console.log('🧠 OpenAI Event Host started');
    
    // Initial welcome announcement
    const welcomeMessage = generateWelcomeMessage();
    triggerAnnouncement(welcomeMessage, 'high');
  };

  // Stop AI hosting
  const stopAI = () => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    console.log('🧠 OpenAI Event Host stopped');
  };

  // Generate welcome message
  const generateWelcomeMessage = (): string => {
    const { eventName, eventType, aiPersonality } = eventContext;
    
    const welcomeMessages = {
      humorous: `🎉 Welcome to ${eventName}! I'm your AI host and I promise to keep things fun and only slightly embarrassing!`,
      formal: `Good evening and welcome to ${eventName}. It is our pleasure to host this distinguished gathering.`,
      energetic: `WELCOME TO ${eventName.toUpperCase()}! Are you ready for an AMAZING time? Let's get this party STARTED!`,
      professional: `Welcome to ${eventName}. Thank you for joining us for this important ${eventType} event.`
    };

    return welcomeMessages[aiPersonality] || `Welcome to ${eventName}!`;
  };

  // Trigger announcement with priority
  const triggerAnnouncement = (message: string, priority: 'high' | 'medium' | 'low' = 'medium') => {
    // Dispatch event for voice system
    window.dispatchEvent(new CustomEvent('aiAnnouncement', {
      detail: { 
        message, 
        priority,
        emotion: getEmotionFromPersonality(eventContext.aiPersonality)
      }
    }));
    
    // Also call the callback for immediate display
    onAnnouncement(message);
  };

  // Get emotion from AI personality
  const getEmotionFromPersonality = (personality: string): string => {
    switch (personality) {
      case 'humorous': return 'welcoming';
      case 'formal': return 'professional';
      case 'energetic': return 'excited';
      case 'professional': return 'professional';
      default: return 'welcoming';
    }
  };

  // Handle immediate VIP announcement
  const handleImmediateVIPAnnouncement = (vip: VIPPerson) => {
    const now = Date.now();
    const lastAnnouncement = lastVIPAnnouncements.get(vip.id) || 0;
    
    // Only announce if not announced in last 5 minutes
    if (now - lastAnnouncement > 300000) {
      const greeting = generateVIPGreeting(vip);
      triggerAnnouncement(greeting, 'high');
      
      setLastVIPAnnouncements(prev => new Map(prev.set(vip.id, now)));
      console.log(`🌟 VIP Announcement: ${vip.name}`);
    }
  };

  // Generate VIP greeting
  const generateVIPGreeting = (vip: VIPPerson): string => {
    if (vip.greeting) {
      return vip.greeting;
    }

    const { aiPersonality } = eventContext;
    
    const greetings = {
      humorous: `Look who's here! Our amazing ${vip.role.toLowerCase()} ${vip.name} has arrived! Let's give them a warm welcome!`,
      formal: `Please join me in welcoming our distinguished ${vip.role.toLowerCase()}, ${vip.name}.`,
      energetic: `${vip.role.toUpperCase()} ALERT! ${vip.name} is HERE! Let's show them some ENERGY!`,
      professional: `We welcome our ${vip.role.toLowerCase()}, ${vip.name}. Thank you for joining us today.`
    };

    return greetings[aiPersonality] || `Welcome ${vip.name}!`;
  };

  // Main AI decision loop
  useEffect(() => {
    if (!isActive || !enabled) return;

    const makeAIDecision = async () => {
      const now = Date.now();
      const timeSinceLastDecision = now - lastDecisionTime.current;
      
      // Make decisions every 15 seconds
      if (timeSinceLastDecision < 15000) return;

      setIsThinking(true);
      
      try {
        // Create crowd analysis
        const crowdAnalysis = {
          faceCount: crowdSize,
          recognizedVIPs,
          newArrivals: recognizedVIPs.filter(vip => {
            const lastSeen = vip.lastSeen?.getTime() || 0;
            return now - lastSeen < 30000; // New if seen in last 30 seconds
          }),
          crowdChange: crowdSize > 20 ? 'increasing' : crowdSize < 10 ? 'decreasing' : 'stable' as const
        };

        // Make AI decision
        const decision = await openAIEventHost.makeEventDecision(
          eventContext,
          crowdAnalysis,
          currentTrack?.title || null,
          isPlaying
        );

        setLastDecision(decision);
        setDecisionHistory(prev => [...prev.slice(-9), decision]);
        lastDecisionTime.current = now;

        // Execute AI decision
        if (decision.shouldAnnounce && decision.announcement) {
          triggerAnnouncement(decision.announcement, decision.priority);
        }

        if (decision.shouldChangeMusic && decision.suggestedTrack && tracks.length > 0) {
          // Find track matching suggestion
          const suggestedTrack = tracks.find(track => 
            track.genre.toLowerCase().includes(decision.suggestedTrack!.toLowerCase()) ||
            track.title.toLowerCase().includes(decision.suggestedTrack!.toLowerCase())
          );

          if (suggestedTrack && suggestedTrack.id !== currentTrack?.id) {
            onTrackChange(suggestedTrack);
          }
        }

        console.log('🧠 AI Decision:', decision);

      } catch (error) {
        console.error('🧠 AI decision error:', error);
      } finally {
        setIsThinking(false);
      }
    };

    // Run decision loop every 5 seconds (but only decide every 15 seconds)
    intervalRef.current = setInterval(makeAIDecision, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, enabled, eventContext, recognizedVIPs, crowdSize, currentTrack, isPlaying]);

  return {
    isActive,
    startAI,
    stopAI,
    lastDecision,
    decisionHistory,
    isThinking,
    handleImmediateVIPAnnouncement
  };
};