import { useState, useEffect, useRef } from 'react';
import { openAIEventHost } from '../utils/openAIEventHost';
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
  const [lastDecision, setLastDecision] = useState<any>(null);
  const [decisionHistory, setDecisionHistory] = useState<any[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [lastCrowdSize, setLastCrowdSize] = useState(0);
  const [lastRecognizedVIPs, setLastRecognizedVIPs] = useState<VIPPerson[]>([]);

  const intervalRef = useRef<NodeJS.Timeout>();
  const lastProcessedVIPs = useRef<Set<string>>(new Set());

  // Detect new VIP arrivals
  const detectNewArrivals = (): VIPPerson[] => {
    const currentVIPIds = new Set(recognizedVIPs.map(vip => vip.id));
    const newArrivals: VIPPerson[] = [];

    recognizedVIPs.forEach(vip => {
      if (!lastProcessedVIPs.current.has(vip.id)) {
        newArrivals.push(vip);
        lastProcessedVIPs.current.add(vip.id);
        console.log(`🆕 New VIP arrival detected: ${vip.name}`);
      }
    });

    return newArrivals;
  };

  // Determine crowd change trend
  const getCrowdChange = (): 'increasing' | 'decreasing' | 'stable' => {
    const difference = crowdSize - lastCrowdSize;
    if (difference > 2) return 'increasing';
    if (difference < -2) return 'decreasing';
    return 'stable';
  };

  // Main AI decision loop
  const makeAIDecision = async () => {
    if (!enabled || !isActive || isThinking) return;

    setIsThinking(true);

    try {
      const newArrivals = detectNewArrivals();
      const crowdChange = getCrowdChange();

      // Only make decisions if something significant happened
      const shouldMakeDecision = 
        newArrivals.length > 0 || 
        Math.abs(crowdSize - lastCrowdSize) > 3 ||
        (!isPlaying && tracks.length > 0);

      if (!shouldMakeDecision) {
        console.log('🧠 OpenAI: No significant changes, skipping decision');
        setIsThinking(false);
        return;
      }

      const crowdAnalysis = {
        faceCount: crowdSize,
        recognizedVIPs,
        newArrivals,
        crowdChange
      };

      console.log('🧠 OpenAI: Analyzing situation...', {
        newArrivals: newArrivals.length,
        crowdSize,
        crowdChange,
        currentTrack: currentTrack?.title
      });

      const decision = await openAIEventHost.makeEventDecision(
        eventContext,
        crowdAnalysis,
        currentTrack?.title || null,
        isPlaying
      );

      setLastDecision(decision);
      setDecisionHistory(prev => [...prev.slice(-9), decision]);

      console.log('🧠 OpenAI Decision:', decision);

      // Execute AI decisions
      if (decision.shouldAnnounce && decision.announcement) {
        console.log('🎤 AI triggered announcement:', decision.announcement);
        setTimeout(() => {
          onAnnouncement(decision.announcement!);
        }, 1000);
      }

      if (decision.shouldChangeMusic && decision.suggestedTrack && tracks.length > 0) {
        const suggestedTrack = findTrackBySuggestion(decision.suggestedTrack);
        if (suggestedTrack && suggestedTrack.id !== currentTrack?.id) {
          console.log('🎵 AI suggested track change:', suggestedTrack.title);
          setTimeout(() => {
            onTrackChange(suggestedTrack);
          }, 3000); // Wait for announcement to finish
        }
      }

      // Update tracking variables
      setLastCrowdSize(crowdSize);
      setLastRecognizedVIPs([...recognizedVIPs]);

    } catch (error) {
      console.error('🧠 AI decision error:', error);
    } finally {
      setIsThinking(false);
    }
  };

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

  // Start the AI event host
  const startAI = () => {
    setIsActive(true);
    openAIEventHost.resetHistory();
    lastProcessedVIPs.current.clear();
    console.log('🧠 OpenAI Event Host activated');
  };

  // Stop the AI event host
  const stopAI = () => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    console.log('🧠 OpenAI Event Host deactivated');
  };

  // Main AI loop
  useEffect(() => {
    if (!isActive || !enabled) return;

    // Run AI decision making every 15 seconds
    intervalRef.current = setInterval(makeAIDecision, 15000);

    // Run initial decision after 5 seconds
    setTimeout(makeAIDecision, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, enabled, recognizedVIPs, crowdSize, currentTrack, isPlaying]);

  // Immediate VIP announcement for high-priority arrivals
  const handleImmediateVIPAnnouncement = async (vip: VIPPerson) => {
    if (!enabled || !isActive) return;

    const lastAnnouncement = this.lastVIPAnnouncements.get(vip.id) || 0;
    const timeSinceLastAnnouncement = Date.now() - lastAnnouncement;

    // Only announce if it's been more than 5 minutes
    if (timeSinceLastAnnouncement < 300000) {
      console.log(`🧠 Skipping immediate announcement for ${vip.name} - too recent`);
      return;
    }

    try {
      setIsThinking(true);
      const personalizedGreeting = await openAIEventHost.generatePersonalizedGreeting(
        vip,
        eventContext,
        crowdSize
      );

      console.log(`🎤 AI generated personalized greeting for ${vip.name}:`, personalizedGreeting);
      
      setTimeout(() => {
        onAnnouncement(personalizedGreeting);
      }, 2000);

      this.lastVIPAnnouncements.set(vip.id, Date.now());

    } catch (error) {
      console.error('Error generating immediate VIP announcement:', error);
    } finally {
      setIsThinking(false);
    }
  };

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