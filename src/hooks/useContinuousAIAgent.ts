import { useState, useEffect, useRef } from 'react';
import { Track } from '../data/tracks';
import { ContinuousAIVideoAgent } from '../utils/continuousAIAgent';

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
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [agentStatus, setAgentStatus] = useState<any>({});

  const aiAgentRef = useRef<ContinuousAIVideoAgent | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Initialize AI agent
  useEffect(() => {
    const openAIKey = import.meta.env.VITE_OPENAI_API_KEY;
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!openAIKey || !geminiKey) {
      setError('Missing API keys. Please check your environment variables.');
      return;
    }

    aiAgentRef.current = new ContinuousAIVideoAgent(openAIKey, geminiKey);
    console.log('🤖 Continuous AI Agent initialized');
  }, []);

  // Main AI loop
  useEffect(() => {
    if (!isActive || !enabled || !videoElement || !aiAgentRef.current) {
      return;
    }

    const runAIAnalysis = async () => {
      if (isAnalyzing) return;

      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await aiAgentRef.current!.analyzeVideoAndRespond(videoElement);
        
        if (response) {
          setLastResponse(response);
          setResponseHistory(prev => [...prev.slice(-9), response]);

          // Execute AI decisions
          if (response.shouldSpeak && response.message) {
            console.log('🎤 AI Agent triggered announcement:', response.message);
            onAnnouncement(response.message);
            
            // Add to conversation history
            setConversationHistory(prev => [
              ...prev.slice(-9),
              `${new Date().toLocaleTimeString()}: ${response.message}`
            ]);
          }

          if (response.shouldChangeMusic && response.suggestedMusicStyle && tracks.length > 0) {
            const suggestedTrack = findTrackBySuggestion(response.suggestedMusicStyle);
            if (suggestedTrack && suggestedTrack.id !== currentTrack?.id) {
              console.log('🎵 AI Agent suggested track change:', suggestedTrack.title);
              setTimeout(() => {
                onTrackChange(suggestedTrack);
              }, 3000); // Wait for announcement to finish
            }
          }
        }

        // Update agent status
        if (aiAgentRef.current) {
          setAgentStatus(aiAgentRef.current.getStatus());
        }

      } catch (error: any) {
        console.error('🤖 AI Agent error:', error);
        setError(error.message);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Run analysis every 4 seconds for natural interaction
    intervalRef.current = setInterval(runAIAnalysis, 4000);
    
    // Run initial analysis after 2 seconds
    setTimeout(runAIAnalysis, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, enabled, videoElement, currentTrack, isPlaying, tracks]);

  // Find track based on AI suggestion
  const findTrackBySuggestion = (suggestion: string): Track | null => {
    const suggestionLower = suggestion.toLowerCase();
    
    // Try to match by genre first
    let matchedTrack = tracks.find(track => 
      track.genre.toLowerCase().includes(suggestionLower)
    );

    // Try to match by title or artist
    if (!matchedTrack) {
      matchedTrack = tracks.find(track => 
        track.title.toLowerCase().includes(suggestionLower) ||
        track.artist.toLowerCase().includes(suggestionLower)
      );
    }

    // Try to match by BPM range for energy descriptions
    if (!matchedTrack) {
      if (suggestionLower.includes('high energy') || suggestionLower.includes('fast')) {
        matchedTrack = tracks.find(track => track.bpm > 140);
      } else if (suggestionLower.includes('slow') || suggestionLower.includes('chill')) {
        matchedTrack = tracks.find(track => track.bpm < 120);
      }
    }

    // Random fallback
    if (!matchedTrack && tracks.length > 0) {
      matchedTrack = tracks[Math.floor(Math.random() * tracks.length)];
    }

    return matchedTrack || null;
  };

  const startAgent = () => {
    if (!aiAgentRef.current) {
      setError('AI Agent not initialized');
      return;
    }

    setIsActive(true);
    aiAgentRef.current.start(eventContext);
    setConversationHistory([]);
    setResponseHistory([]);
    console.log('🤖 Continuous AI Video Agent started');
  };

  const stopAgent = () => {
    setIsActive(false);
    if (aiAgentRef.current) {
      aiAgentRef.current.stop();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    console.log('🤖 Continuous AI Video Agent stopped');
  };

  const forceAnalysis = async () => {
    if (!videoElement || !aiAgentRef.current || isAnalyzing) {
      console.log('🤖 Cannot force analysis - not ready or already analyzing');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await aiAgentRef.current.forceAnalysis(videoElement);
      if (response) {
        setLastResponse(response);
        console.log('🤖 Forced analysis complete:', response);
      }
    } catch (error: any) {
      console.error('🤖 Forced analysis error:', error);
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
    conversationHistory
  };
};