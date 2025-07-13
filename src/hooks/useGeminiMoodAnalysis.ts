import { useState, useEffect, useRef } from 'react';
import { GeminiVisionAnalyzer } from '../utils/geminiVision';
import weave from '@wandb/weave';

interface MoodAnalysisState {
  mood: string;
  energy: number;
  crowdSize: number;
  confidence: number;
  isAnalyzing: boolean;
  lastAnalysis: Date | null;
  error: string | null;
}

export const useGeminiMoodAnalysis = (
  videoElement: HTMLVideoElement | null,
  initialEnabled: boolean = true
) => {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [state, setState] = useState<MoodAnalysisState>({
    mood: 'Energetic',
    energy: 75,
    crowdSize: 0,
    confidence: 0,
    isAnalyzing: false,
    lastAnalysis: null,
    error: null
  });

  const analyzerRef = useRef<GeminiVisionAnalyzer | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastAnalysisTimeRef = useRef<number>(0);

  // Initialize Gemini analyzer
  useEffect(() => {
    const apiKey = 'AIzaSyDMtDDrtr8WLwUHpXnVkRVzN1s_4IkUsRo';
    analyzerRef.current = new GeminiVisionAnalyzer(apiKey);
    console.log('🤖 Gemini: Analyzer initialized');
  }, []);

  // Main analysis loop
  useEffect(() => {
    if (!enabled || !videoElement || !analyzerRef.current) {
      console.log('🤖 Gemini: Analysis disabled or not ready');
      return;
    }

    const runAnalysis = async () => {
      const now = Date.now();
      const timeSinceLastAnalysis = now - lastAnalysisTimeRef.current;
      
      // Only analyze if 30 seconds have passed since last analysis
      if (timeSinceLastAnalysis < 30000) {
        console.log(`🤖 Gemini: Skipping analysis - only ${Math.round(timeSinceLastAnalysis/1000)}s since last analysis`);
        return;
      }

      if (state.isAnalyzing) {
        console.log('🤖 Gemini: Analysis already in progress, skipping...');
        return;
      }

      // Check if video is ready
      if (videoElement.readyState < 2) {
        console.log('🤖 Gemini: Video not ready, skipping analysis');
        return;
      }

      lastAnalysisTimeRef.current = now;
      setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
      console.log('🤖 Gemini: Starting emotion analysis...');

      try {
        const analysis = await analyzerRef.current!.analyzeEmotion(videoElement);
        const mappedMood = analyzerRef.current!.mapEmotionToMood(analysis.dominantEmotion);
        
        setState(prev => ({
          ...prev,
          mood: mappedMood,
          energy: Math.round(analysis.energy),
          crowdSize: analysis.crowdSize,
          confidence: Math.round(analysis.confidence * 100),
          isAnalyzing: false,
          lastAnalysis: new Date(),
          error: null
        }));

        console.log(`🤖 Gemini: Analysis complete - Mood: ${mappedMood}, Energy: ${analysis.energy}%, Crowd: ${analysis.crowdSize}`);
        
      } catch (error: any) {
        console.error('🤖 Gemini: Analysis error:', error);
        setState(prev => ({
          ...prev,
          isAnalyzing: false,
          error: error.message || 'Analysis failed'
        }));
      }
    };

    // Run initial analysis after 5 seconds
    const initialTimeout = setTimeout(() => {
      lastAnalysisTimeRef.current = 0; // Allow first analysis
      runAnalysis();
    }, 5000);

    // Check every 5 seconds, but only analyze every 30 seconds
    intervalRef.current = setInterval(runAnalysis, 5000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, videoElement, state.isAnalyzing]);

  // Manual trigger for analysis
  const triggerAnalysis = async () => {
    if (!videoElement || !analyzerRef.current || state.isAnalyzing) {
      console.log('🤖 Gemini: Cannot trigger analysis - not ready or already analyzing');
      return;
    }

    // Reset the timer to allow manual analysis
    lastAnalysisTimeRef.current = 0;
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    
    try {
      // Track with Weave for hackathon
      const analysis = await weave.trace('gemini_mood_analysis', async () => {
        return await analyzerRef.current!.analyzeEmotion(videoElement);
      });
      const mappedMood = analyzerRef.current.mapEmotionToMood(analysis.dominantEmotion);
      
      lastAnalysisTimeRef.current = Date.now();
      setState(prev => ({
        ...prev,
        mood: mappedMood,
        energy: Math.round(analysis.energy),
        crowdSize: analysis.crowdSize,
        confidence: Math.round(analysis.confidence * 100),
        isAnalyzing: false,
        lastAnalysis: new Date(),
        error: null
      }));

      console.log(`🤖 Gemini: Manual analysis complete - ${mappedMood}`);
      
    } catch (error: any) {
      console.error('🤖 Gemini: Manual analysis error:', error);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error.message || 'Manual analysis failed'
      }));
    }
  };

  const toggleEnabled = () => {
    setEnabled(!enabled);
    console.log(`🤖 Gemini Vision: ${!enabled ? 'Enabled' : 'Disabled'}`);
  };

  return {
    mood: state.mood,
    energy: state.energy,
    crowdSize: state.crowdSize,
    confidence: state.confidence,
    isAnalyzing: state.isAnalyzing,
    lastAnalysis: state.lastAnalysis,
    error: state.error,
    enabled,
    triggerAnalysis,
    toggleEnabled
  };
};