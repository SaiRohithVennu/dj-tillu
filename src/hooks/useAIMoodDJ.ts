import { useState, useEffect, useRef } from 'react';
import { Track } from '../data/tracks';
import { getTracksForMood } from '../data/moodPlaylists';

interface AIMoodDJProps {
  tracks: Track[];
  currentMood: string;
  energy: number;
  crowdSize: number;
  onTrackChange: (track: Track) => void;
  onAnnouncement: (message: string) => void;
  isPlaying: boolean;
  currentTrack: Track | null;
}

export const useAIMoodDJ = ({
  tracks,
  currentMood,
  energy,
  crowdSize,
  onTrackChange,
  onAnnouncement,
  isPlaying,
  currentTrack
}: AIMoodDJProps) => {
  const [lastMood, setLastMood] = useState(currentMood);
  const [isAIActive, setIsAIActive] = useState(true);
  const [nextCheck, setNextCheck] = useState(Date.now() + 15000);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Track selection based on mood and energy
  const selectTrackForMood = (mood: string, energy: number): Track | null => {
    // Get tracks specifically curated for this mood
    let suitableTracks = getTracksForMood(mood.toLowerCase(), tracks);

    // If no mood-specific tracks, fall back to all tracks
    if (suitableTracks.length === 0) {
      console.log(`🤖 AI DJ: No tracks found for mood ${mood}, using all tracks`);
      suitableTracks = tracks;
    } else {
      console.log(`🤖 AI DJ: Found ${suitableTracks.length} tracks for mood ${mood}`);
    }

    // Filter by energy level (BPM)
    if (energy > 80) {
      // High energy - prefer faster tracks
      suitableTracks = suitableTracks.filter(track => track.bpm >= 130);
    } else if (energy < 50) {
      // Low energy - prefer slower tracks
      suitableTracks = suitableTracks.filter(track => track.bpm <= 130);
    }

    // If no tracks match energy criteria, use genre-filtered tracks
    if (suitableTracks.length === 0) {
      suitableTracks = getTracksForMood(mood.toLowerCase(), tracks);
      if (suitableTracks.length === 0) {
        suitableTracks = tracks;
      }
    }

    // Exclude current track if possible
    if (currentTrack && suitableTracks.length > 1) {
      suitableTracks = suitableTracks.filter(track => track.id !== currentTrack.id);
    }

    // Return random track from suitable options
    return suitableTracks.length > 0 
      ? suitableTracks[Math.floor(Math.random() * suitableTracks.length)]
      : null;
  };

  // Generate mood change announcement
  const generateMoodAnnouncement = (oldMood: string, newMood: string, newTrack: Track): string => {
    const announcements = [
      `DJ Tillu here! Feeling the ${newMood} energy! Switching to ${newTrack.title}!`,
      `The crowd wants ${newMood} vibes! Here comes ${newTrack.title} by ${newTrack.artist}!`,
      `DJ Tillu reading the room... ${newMood} mood detected! Playing ${newTrack.title}!`,
      `Energy shift to ${newMood}! Perfect time for ${newTrack.title}!`,
      `${newMood} vibes incoming! Dropping ${newTrack.title} right now!`,
      `Smooth transition to ${newMood} mode with ${newTrack.title}! Let's go!`,
      `DJ Tillu's AI says ${newMood}! Time for ${newTrack.title}!`
    ];

    return announcements[Math.floor(Math.random() * announcements.length)];
  };

  // Smooth transition with crossfade effect
  const performSmoothTransition = async (newTrack: Track, announcement: string) => {
    console.log(`🎵 Starting smooth transition to: ${newTrack.title}`);
    
    setIsTransitioning(true);
    setTransitionProgress(0);
    
    // Step 1: Start crossfade (reduce current volume)
    setTransitionProgress(25);
    
    // Step 2: Announce transition
    setTimeout(() => {
      setIsAnnouncing(true);
      onAnnouncement(announcement);
      setTransitionProgress(50);
    }, 500);
    
    // Step 3: Change track during announcement
    setTimeout(() => {
      onTrackChange(newTrack);
      setTransitionProgress(75);
    }, 2500);
    
    // Step 4: Complete transition
    setTimeout(() => {
      setIsAnnouncing(false);
      setIsTransitioning(false);
      setTransitionProgress(100);
      console.log(`✅ Smooth transition complete: ${newTrack.title}`);
    }, 4000);
  };

  // Check mood and potentially change track
  const checkMoodAndChangeTrack = () => {
    if (!isAIActive || !isPlaying || isTransitioning) return;

    console.log(`🤖 AI DJ: Checking mood... Current: ${currentMood}, Last: ${lastMood}`);

    // Check if mood has changed significantly
    const moodChanged = currentMood.toLowerCase() !== lastMood.toLowerCase();
    
    if (moodChanged) {
      console.log(`🤖 AI DJ: Mood changed from ${lastMood} to ${currentMood}`);
      
      const newTrack = selectTrackForMood(currentMood, energy);
      
      if (newTrack && newTrack.id !== currentTrack?.id) {
        console.log(`🤖 AI DJ: Switching to ${newTrack.title} for ${currentMood} mood`);
        
        setIsTransitioning(true);
        
        // Generate and play announcement
        const announcement = generateMoodAnnouncement(lastMood, currentMood, newTrack);
        
        performSmoothTransition(newTrack, announcement);
        
        setLastMood(currentMood);
      }
    } else {
      console.log(`🤖 AI DJ: Mood stable (${currentMood}), continuing current track`);
    }

    // Set next check time
    setNextCheck(Date.now() + 15000); // Check every 15 seconds
  };

  // Main AI DJ loop
  useEffect(() => {
    if (!isAIActive) return;

    const runAICheck = () => {
      const now = Date.now();
      if (now >= nextCheck) {
        checkMoodAndChangeTrack();
      }
    };

    // Check every second, but only act every 15 seconds
    intervalRef.current = setInterval(runAICheck, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAIActive, currentMood, lastMood, energy, isPlaying, currentTrack, nextCheck]);

  // Initialize with current mood
  useEffect(() => {
    if (lastMood !== currentMood) {
      setLastMood(currentMood);
    }
  }, []);

  const toggleAI = () => {
    setIsAIActive(!isAIActive);
    console.log(`🤖 AI DJ: ${!isAIActive ? 'Activated' : 'Deactivated'}`);
  };

  const forceCheck = () => {
    if (isAIActive) {
      setNextCheck(Date.now());
      console.log('🤖 AI DJ: Forcing mood check...');
    }
  };

  const getTimeToNextCheck = () => {
    const remaining = Math.max(0, nextCheck - Date.now());
    return Math.ceil(remaining / 1000);
  };

  return {
    isAIActive,
    toggleAI,
    forceCheck,
    isAnnouncing,
    isTransitioning,
    transitionProgress,
    timeToNextCheck: getTimeToNextCheck(),
    lastMood
  };
};