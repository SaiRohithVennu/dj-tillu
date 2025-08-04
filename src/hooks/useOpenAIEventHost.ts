import { useState, useEffect, useRef, useCallback } from 'react';
import { analyzeVideoForEventHost } from '../utils/openAIEventHost';
import { generateVoiceAnnouncement } from '../utils/elevenLabsVoice';

interface VIPPerson {
  name: string;
  role: string;
  photo: string;
}

interface EventHostState {
  isActive: boolean;
  isAnalyzing: boolean;
  lastAnalysis: string;
  recognizedVIPs: VIPPerson[];
  announcementHistory: string[];
  crowdCount: number;
  currentActivity: string;
  eventPersonality: 'humorous' | 'formal' | 'energetic' | 'professional';
}

export const useOpenAIEventHost = (videoElement?: HTMLVideoElement) => {
  const [state, setState] = useState<EventHostState>({
    isActive: false,
    isAnalyzing: false,
    lastAnalysis: '',
    recognizedVIPs: [],
    announcementHistory: [],
    crowdCount: 0,
    currentActivity: 'unknown',
    eventPersonality: 'humorous'
  });

  const analysisIntervalRef = useRef<NodeJS.Timeout>();
  const vipPhotosRef = useRef<VIPPerson[]>([]);

  const startHost = useCallback(() => {
    setState(prev => ({ ...prev, isActive: true }));
    
    // Start analysis loop
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }
    
    analysisIntervalRef.current = setInterval(() => {
      if (videoElement) {
        performAnalysis();
      }
    }, 10000); // Analyze every 10 seconds
  }, [videoElement]);

  const stopHost = useCallback(() => {
    setState(prev => ({ ...prev, isActive: false, isAnalyzing: false }));
    
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = undefined;
    }
  }, []);

  const performAnalysis = useCallback(async () => {
    if (!videoElement || state.isAnalyzing) return;

    setState(prev => ({ ...prev, isAnalyzing: true }));

    try {
      // Capture frame from video
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      // Analyze with OpenAI
      const analysis = await analyzeVideoForEventHost(
        imageData,
        vipPhotosRef.current,
        state.eventPersonality
      );

      setState(prev => ({
        ...prev,
        lastAnalysis: analysis.description,
        crowdCount: analysis.crowdCount,
        currentActivity: analysis.activity,
        isAnalyzing: false
      }));

      // Check for VIP recognition
      if (analysis.recognizedVIPs && analysis.recognizedVIPs.length > 0) {
        const newVIPs = analysis.recognizedVIPs.filter(
          vip => !state.recognizedVIPs.some(existing => existing.name === vip.name)
        );

        if (newVIPs.length > 0) {
          setState(prev => ({
            ...prev,
            recognizedVIPs: [...prev.recognizedVIPs, ...newVIPs]
          }));

          // Generate announcement for new VIPs
          for (const vip of newVIPs) {
            await makeAnnouncement(`Welcome ${vip.name}, our ${vip.role}!`);
          }
        }
      }

      // Make general announcements based on analysis
      if (analysis.shouldAnnounce && analysis.announcement) {
        await makeAnnouncement(analysis.announcement);
      }

    } catch (error) {
      console.error('Analysis failed:', error);
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, [videoElement, state.isAnalyzing, state.eventPersonality, state.recognizedVIPs]);

  const makeAnnouncement = useCallback(async (text: string) => {
    try {
      // Add to history
      setState(prev => ({
        ...prev,
        announcementHistory: [...prev.announcementHistory, text].slice(-10) // Keep last 10
      }));

      // Generate voice announcement
      await generateVoiceAnnouncement(text);

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('voiceAnnouncement', {
        detail: { text, timestamp: Date.now() }
      }));

    } catch (error) {
      console.error('Announcement failed:', error);
    }
  }, []);

  const setVIPPhotos = useCallback((vips: VIPPerson[]) => {
    vipPhotosRef.current = vips;
  }, []);

  const setEventPersonality = useCallback((personality: EventHostState['eventPersonality']) => {
    setState(prev => ({ ...prev, eventPersonality: personality }));
  }, []);

  const testVoiceSystem = useCallback(async () => {
    await makeAnnouncement("Testing voice system - DJ Tillu is ready to rock!");
  }, [makeAnnouncement]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startHost,
    stopHost,
    performAnalysis,
    makeAnnouncement,
    setVIPPhotos,
    setEventPersonality,
    testVoiceSystem
  };
};