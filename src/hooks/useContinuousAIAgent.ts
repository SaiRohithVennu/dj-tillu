import { useState, useEffect, useRef } from 'react';

export interface EventContext {
  currentMood: string;
  energy: number;
  crowdSize: number;
  timeOfDay: string;
  eventType: string;
  vipGuests: string[];
  specialRequests: string[];
}

export interface AIInsight {
  id: string;
  type: 'music' | 'crowd' | 'energy' | 'timing' | 'special';
  message: string;
  confidence: number;
  timestamp: Date;
  actionable: boolean;
}

export interface AIRecommendation {
  id: string;
  type: 'track' | 'transition' | 'announcement' | 'lighting' | 'volume';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedImpact: number;
  timestamp: Date;
}

export interface PerformanceMetrics {
  crowdEngagement: number;
  energyLevel: number;
  musicSatisfaction: number;
  transitionQuality: number;
  overallScore: number;
  trendsLast30Min: {
    engagement: number[];
    energy: number[];
    satisfaction: number[];
  };
}

export interface ContinuousAIAgentState {
  isActive: boolean;
  insights: AIInsight[];
  recommendations: AIRecommendation[];
  performanceMetrics: PerformanceMetrics;
  lastAnalysis: Date | null;
  analysisCount: number;
  status: 'idle' | 'analyzing' | 'generating' | 'error';
  error: string | null;
}

export interface UseContinuousAIAgentReturn extends ContinuousAIAgentState {
  startAgent: () => void;
  stopAgent: () => void;
  clearInsights: () => void;
  clearRecommendations: () => void;
  dismissRecommendation: (id: string) => void;
  forceAnalysis: () => void;
}

export function useContinuousAIAgent(eventContext: EventContext): UseContinuousAIAgentReturn {
  const [state, setState] = useState<ContinuousAIAgentState>({
    isActive: false,
    insights: [],
    recommendations: [],
    performanceMetrics: {
      crowdEngagement: 0,
      energyLevel: 0,
      musicSatisfaction: 0,
      transitionQuality: 0,
      overallScore: 0,
      trendsLast30Min: {
        engagement: [],
        energy: [],
        satisfaction: []
      }
    },
    lastAnalysis: null,
    analysisCount: 0,
    status: 'idle',
    error: null
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const analysisIntervalMs = 30000; // 30 seconds

  const generateInsights = async (): Promise<AIInsight[]> => {
    // Simulate AI analysis based on event context
    const insights: AIInsight[] = [];
    
    // Energy-based insights
    if (eventContext.energy < 0.3) {
      insights.push({
        id: `insight-${Date.now()}-1`,
        type: 'energy',
        message: 'Crowd energy is low. Consider playing more upbeat tracks or making an announcement.',
        confidence: 0.85,
        timestamp: new Date(),
        actionable: true
      });
    } else if (eventContext.energy > 0.8) {
      insights.push({
        id: `insight-${Date.now()}-2`,
        type: 'energy',
        message: 'High energy detected! This is a great time for peak-hour tracks.',
        confidence: 0.92,
        timestamp: new Date(),
        actionable: true
      });
    }

    // Mood-based insights
    if (eventContext.currentMood === 'chill' && eventContext.energy > 0.6) {
      insights.push({
        id: `insight-${Date.now()}-3`,
        type: 'music',
        message: 'Mood-energy mismatch detected. Consider transitioning to more energetic genres.',
        confidence: 0.78,
        timestamp: new Date(),
        actionable: true
      });
    }

    // Time-based insights
    const hour = new Date().getHours();
    if (hour > 22 && eventContext.energy < 0.5) {
      insights.push({
        id: `insight-${Date.now()}-4`,
        type: 'timing',
        message: 'Late hour with low energy. Consider playing nostalgic or crowd-favorite tracks.',
        confidence: 0.73,
        timestamp: new Date(),
        actionable: true
      });
    }

    // VIP insights
    if (eventContext.vipGuests.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-5`,
        type: 'special',
        message: `${eventContext.vipGuests.length} VIP guest(s) detected. Consider personalized music preferences.`,
        confidence: 0.95,
        timestamp: new Date(),
        actionable: true
      });
    }

    return insights;
  };

  const generateRecommendations = async (): Promise<AIRecommendation[]> => {
    const recommendations: AIRecommendation[] = [];
    
    // Track recommendations based on context
    if (eventContext.energy < 0.4) {
      recommendations.push({
        id: `rec-${Date.now()}-1`,
        type: 'track',
        title: 'Play High-Energy Track',
        description: 'Switch to a high-BPM track to boost crowd energy',
        priority: 'high',
        estimatedImpact: 0.8,
        timestamp: new Date()
      });
    }

    // Transition recommendations
    if (eventContext.currentMood === 'party' && eventContext.energy > 0.7) {
      recommendations.push({
        id: `rec-${Date.now()}-2`,
        type: 'transition',
        title: 'Smooth Transition',
        description: 'Use a smooth transition to maintain the high energy flow',
        priority: 'medium',
        estimatedImpact: 0.6,
        timestamp: new Date()
      });
    }

    // Announcement recommendations
    if (eventContext.crowdSize > 100 && eventContext.energy < 0.3) {
      recommendations.push({
        id: `rec-${Date.now()}-3`,
        type: 'announcement',
        title: 'Crowd Engagement',
        description: 'Make an announcement to re-engage the crowd',
        priority: 'high',
        estimatedImpact: 0.7,
        timestamp: new Date()
      });
    }

    // Volume recommendations
    const hour = new Date().getHours();
    if (hour > 23) {
      recommendations.push({
        id: `rec-${Date.now()}-4`,
        type: 'volume',
        title: 'Adjust Volume',
        description: 'Consider lowering volume for late-night comfort',
        priority: 'low',
        estimatedImpact: 0.4,
        timestamp: new Date()
      });
    }

    return recommendations;
  };

  const updatePerformanceMetrics = (): PerformanceMetrics => {
    // Simulate performance metrics calculation
    const crowdEngagement = Math.max(0, Math.min(1, eventContext.energy * 0.8 + Math.random() * 0.2));
    const energyLevel = eventContext.energy;
    const musicSatisfaction = eventContext.currentMood === 'party' ? 0.9 : 0.7;
    const transitionQuality = 0.8 + Math.random() * 0.2;
    const overallScore = (crowdEngagement + energyLevel + musicSatisfaction + transitionQuality) / 4;

    return {
      crowdEngagement,
      energyLevel,
      musicSatisfaction,
      transitionQuality,
      overallScore,
      trendsLast30Min: {
        engagement: [...state.performanceMetrics.trendsLast30Min.engagement.slice(-29), crowdEngagement],
        energy: [...state.performanceMetrics.trendsLast30Min.energy.slice(-29), energyLevel],
        satisfaction: [...state.performanceMetrics.trendsLast30Min.satisfaction.slice(-29), musicSatisfaction]
      }
    };
  };

  const performAnalysis = async () => {
    setState(prev => ({ ...prev, status: 'analyzing' }));

    try {
      setState(prev => ({ ...prev, status: 'generating' }));
      
      const [newInsights, newRecommendations] = await Promise.all([
        generateInsights(),
        generateRecommendations()
      ]);

      const updatedMetrics = updatePerformanceMetrics();

      setState(prev => ({
        ...prev,
        insights: [...prev.insights.slice(-19), ...newInsights], // Keep last 20 insights
        recommendations: [...prev.recommendations.slice(-9), ...newRecommendations], // Keep last 10 recommendations
        performanceMetrics: updatedMetrics,
        lastAnalysis: new Date(),
        analysisCount: prev.analysisCount + 1,
        status: 'idle',
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Analysis failed'
      }));
    }
  };

  const startAgent = () => {
    setState(prev => ({ ...prev, isActive: true, error: null }));
    
    // Perform initial analysis
    performAnalysis();
    
    // Set up continuous analysis
    intervalRef.current = setInterval(performAnalysis, analysisIntervalMs);
  };

  const stopAgent = () => {
    setState(prev => ({ ...prev, isActive: false }));
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const clearInsights = () => {
    setState(prev => ({ ...prev, insights: [] }));
  };

  const clearRecommendations = () => {
    setState(prev => ({ ...prev, recommendations: [] }));
  };

  const dismissRecommendation = (id: string) => {
    setState(prev => ({
      ...prev,
      recommendations: prev.recommendations.filter(rec => rec.id !== id)
    }));
  };

  const forceAnalysis = () => {
    if (state.isActive) {
      performAnalysis();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startAgent,
    stopAgent,
    clearInsights,
    clearRecommendations,
    dismissRecommendation,
    forceAnalysis
  };
}