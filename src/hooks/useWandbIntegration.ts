import { useEffect } from 'react';
import { djLogger } from '../utils/wandbLogger';

export const useWandbIntegration = () => {
  useEffect(() => {
    // Initialize WandB logging session
    djLogger.initSession('dj-tillu-session', {
      project: 'dj-tillu',
      entity: 'ai-dj',
      tags: ['ai-dj', 'music', 'mood-analysis']
    });

    // Log initial session start
    djLogger.logEvent('session_start', {
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`
    });

    // Cleanup function
    return () => {
      djLogger.finishSession();
    };
  }, []);

  return {
    logEvent: djLogger.logEvent.bind(djLogger),
    logMetric: djLogger.logMetric.bind(djLogger),
    logAudio: djLogger.logAudio.bind(djLogger)
  };
};