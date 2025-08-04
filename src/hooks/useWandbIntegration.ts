import { useEffect, useRef } from 'react';
import { djLogger } from '../utils/wandbLogger';
import { Track } from '../data/tracks';

interface UseWandbIntegrationProps {
  mood: string;
  energy: number;
  crowdSize: number;
  confidence: number;
  currentTrack: Track | null;
  isPlaying: boolean;
  isAIActive: boolean;
}

export const useWandbIntegration = ({
  mood,
  energy,
  crowdSize,
  confidence,
  currentTrack,
  isPlaying,
  isAIActive
}: UseWandbIntegrationProps) => {
  const lastMoodRef = useRef<string>('');
  const lastTrackRef = useRef<string>('');
  const lastEnergyRef = useRef<number>(0);
  const initializationRef = useRef<boolean>(false);

  // Initialize wandb on mount
  useEffect(() => {
    if (!initializationRef.current) {
      console.log('🚀 Initializing wandb integration...');
      djLogger.initialize();
      initializationRef.current = true;
    }

    // Cleanup on unmount
    return () => {
      if (initializationRef.current) {
        djLogger.finish();
      }
    };
  }, []);

  // Track mood changes
  useEffect(() => {
    if (mood && mood !== lastMoodRef.current && lastMoodRef.current !== '') {
      const energyChange = energy - lastEnergyRef.current;
      
      console.log(`🎭 Mood transition detected: ${lastMoodRef.current} → ${mood}`);
      djLogger.logMoodTransition(
        lastMoodRef.current,
        mood,
        energyChange,
        isAIActive
      );
    }
    
    lastMoodRef.current = mood;
    lastEnergyRef.current = energy;
  }, [mood, energy, isAIActive]);

  // Track mood analysis updates
  useEffect(() => {
    if (mood && energy !== undefined && crowdSize !== undefined && confidence !== undefined) {
      djLogger.logMoodAnalysis(mood, energy, crowdSize, confidence);
    }
  }, [mood, energy, crowdSize, confidence]);

  // Track track changes
  useEffect(() => {
    if (currentTrack && currentTrack.title !== lastTrackRef.current && lastTrackRef.current !== '') {
      const reason = isAIActive ? 'ai_decision' : 'manual_override';
      
      console.log(`🎵 Track change detected: ${lastTrackRef.current} → ${currentTrack.title}`);
      djLogger.logTrackChange(
        lastTrackRef.current,
        currentTrack.title,
        reason,
        mood,
        currentTrack.bpm,
        currentTrack.genre
      );
    }
    
    if (currentTrack) {
      lastTrackRef.current = currentTrack.title;
    }
  }, [currentTrack, mood, isAIActive]);

  // Track crowd response periodically
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;

    const interval = setInterval(() => {
      const engagement = Math.min(100, (crowdSize * energy) / 10);
      const timeInTrack = Date.now() - (Date.now() % 30000); // Simplified
      
      djLogger.logCrowdResponse(
        engagement,
        currentTrack.title,
        timeInTrack / 1000
      );
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, crowdSize, energy]);

  // Utility functions to log specific events
  const logAIDecision = (decision: string, confidence: number, context: any) => {
    djLogger.logAIDecision(decision, confidence, context);
  };

  const logUserInteraction = (action: string, details: any) => {
    djLogger.logUserInteraction(action, details);
  };

  const logMoodOverride = (overrideType: 'hype' | 'chill') => {
    djLogger.logUserInteraction('mood_override', {
      type: overrideType,
      previousMood: mood,
      energy: energy,
      crowdSize: crowdSize
    });
  };

  const logAnnouncement = (message: string) => {
    djLogger.logUserInteraction('announcement', {
      message: message,
      mood: mood,
      energy: energy,
      track: currentTrack?.title || 'none'
    });
  };

  return {
    logAIDecision,
    logUserInteraction,
    logMoodOverride,
    logAnnouncement
  };
};