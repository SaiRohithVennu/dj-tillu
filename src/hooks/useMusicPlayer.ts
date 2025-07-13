import { useState, useEffect } from 'react';

export const useMusicPlayer = () => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyzerNode, setAnalyzerNode] = useState<AnalyserNode | null>(null);

  useEffect(() => {
    // Create audio context for analysis (when user interacts)
    const createAudioContext = () => {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyzer = context.createAnalyser();
        analyzer.fftSize = 256;
        
        setAudioContext(context);
        setAnalyzerNode(analyzer);
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    };

    // Create context on first user interaction
    const handleUserInteraction = () => {
      createAudioContext();
      document.removeEventListener('click', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  return { audioContext, analyzerNode };
};