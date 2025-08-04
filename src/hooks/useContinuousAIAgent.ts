import { useState, useEffect, useRef } from 'react';
import { ContinuousAIVideoAgent } from '../utils/continuousAIAgent';
import { Track } from '../data/tracks';

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

interface UseContinuousAIAgentProps {
  videoElement: HTMLVideoElement | null;
  eventContext: EventContext;
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onAnnouncement: (message: string) => void;
  onTrackChange: (track: Track) => void;
  enabled: boolean;
}

export const useContinuousAIAgent = ({
  videoElement,
  eventContext,
  tracks,
  currentTrack,
  isPlaying,
  onAnnouncement,
  onTrackChange,
  enabled
}: UseContinuousAIAgentProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [responseHistory, setResponseHistory] = useState<any[]>([]);
  const [agentStatus, setAgentStatus] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const agentRef = useRef<ContinuousAIVideoAgent | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Initialize the AI agent
  useEffect(() => {
    const openAIKey = import.meta.env.VITE_OPENAI_API_KEY;
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!openAIKey || !geminiKey) {
      setError('Missing API keys. Please add VITE_OPENAI_API_KEY and VITE_GEMINI_API_KEY to your .env file');
      return;
    }

    agentRef.current = new ContinuousAIVideoAgent(openAIKey, geminiKey);
    console.log('🤖 Continuous AI Agent initialized');
  }, []);

  // Start the agent
  const startAgent = () => {
    if (!agentRef.current || !videoElement) {
      setError('Agent not ready or video not available');
      return;
    }

    agentRef.current.start(eventContext);
    setIsActive(true);
    setError(null);
    
    console.log('🎥 Starting continuous AI video agent...');
    
    // Welcome message
    const welcomeMessage = `Hello everyone! I'm your AI host for ${eventContext.eventName}. I can see you through the camera and I'm here to make this ${eventContext.eventType} amazing!`;
    setTimeout(() => {
      onAnnouncement(welcomeMessage);
    }, 2000);
  };

  // Stop the agent
  const stopAgent = () => {
    if (agentRef.current) {
      agentRef.current.stop();
    }
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    console.log('🤖 Continuous AI Agent stopped');
  };

  // Main analysis loop
  useEffect(() => {
    if (!isActive || !enabled || !videoElement || !agentRef.current) {
      return;
    }

    const runContinuousAnalysis = async () => {
      if (isAnalyzing) return;

      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await agentRef.current!.analyzeVideoAndRespond(videoElement);
        
        if (response) {
          setLastResponse(response);
          setResponseHistory(prev => [...prev.slice(-9), response]);

          // Execute AI decisions
          if (response.shouldSpeak && response.message) {
            console.log('🎤 AI Agent speaking:', response.message);
            setTimeout(() => {
              onAnnouncement(response.message!);
            }, 500);
          }

          if (response.shouldChangeMusic && response.suggestedMusicStyle && tracks.length > 0) {
            const suggestedTrack = findTrackByStyle(response.suggestedMusicStyle);
            if (suggestedTrack && suggestedTrack.id !== currentTrack?.id) {
              console.log('🎵 AI Agent changing music:', suggestedTrack.title);
              setTimeout(() => {
                onTrackChange(suggestedTrack);
              }, 3000);
            }
          }

          // Update status
          setAgentStatus(agentRef.current!.getStatus());
        }

      } catch (error: any) {
        console.error('🤖 Continuous AI analysis error:', error);
        setError(error.message);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Run analysis every 3-5 seconds (like ChatGPT video)
    const randomInterval = 3000 + Math.random() * 2000;
    intervalRef.current = setInterval(runContinuousAnalysis, randomInterval);

    // Run initial analysis after 3 seconds
    setTimeout(runContinuousAnalysis, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, enabled, videoElement, eventContext, tracks, currentTrack, isAnalyzing]);

  // Find track by AI suggestion
  const findTrackByStyle = (style: string): Track | null => {
    const styleLower = style.toLowerCase();
    
    // Try to match by genre
    let matchedTrack = tracks.find(track => 
      track.genre.toLowerCase().includes(styleLower)
    );

    // Try to match by energy level
    if (!matchedTrack) {
      if (styleLower.includes('high energy') || styleLower.includes('upbeat')) {
        matchedTrack = tracks.find(track => track.bpm > 130);
      } else if (styleLower.includes('chill') || styleLower.includes('slow')) {
        matchedTrack = tracks.find(track => track.bpm < 120);
      }
    }

    // Random fallback
    if (!matchedTrack && tracks.length > 0) {
      matchedTrack = tracks[Math.floor(Math.random() * tracks.length)];
    }

    return matchedTrack || null;
  };

  // Force analysis (for testing)
  const forceAnalysis = async () => {
    if (!agentRef.current || !videoElement || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const response = await agentRef.current.forceAnalysis(videoElement);
      if (response) {
        setLastResponse(response);
        console.log('🔍 Forced analysis result:', response);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isActive,
    startAgent,
    stopAgent,
    isAnalyzing,
    lastResponse,
    responseHistory,
    agentStatus,
    error,
    forceAnalysis,
    conversationHistory: agentRef.current?.getConversationSummary() || []
  };
};