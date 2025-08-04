// Browser-compatible analytics logger (replaces wandb)
interface DJMetrics {
  mood: string;
  energy: number;
  crowdSize: number;
  confidence: number;
  trackTitle: string;
  trackArtist: string;
  trackGenre: string;
  trackBPM: number;
  sessionId: string;
  timestamp: number;
}

interface MoodTransition {
  fromMood: string;
  toMood: string;
  energyChange: number;
  crowdResponse: number;
  trackChanged: boolean;
  aiTriggered: boolean;
  confidence: number;
  duration: number;
}

interface TrackChange {
  previousTrack: string;
  newTrack: string;
  reason: 'mood_change' | 'energy_shift' | 'manual_override' | 'ai_decision';
  moodContext: string;
  energyBefore: number;
  energyAfter: number;
  crowdSize: number;
  confidence: number;
  timestamp: number;
}

interface CrowdResponse {
  mood: string;
  energy: number;
  crowdSize: number;
  engagement: number;
  trackPlaying: string;
  timeInTrack: number;
  geminiConfidence: number;
}

export class BrowserDJLogger {
  private isInitialized = false;
  private sessionId: string;
  private sessionStartTime: number;
  private lastMood: string = '';
  private lastEnergy: number = 0;
  private lastCrowdSize: number = 0;
  private trackStartTime: number = 0;
  private currentTrack: string = '';
  private moodHistory: Array<{ mood: string; timestamp: number; energy: number }> = [];
  private trackHistory: Array<{ track: string; timestamp: number; reason: string }> = [];
  private analyticsData: Array<{ type: string; data: any; timestamp: number }> = [];

  constructor() {
    this.sessionId = `dj-session-${Date.now()}`;
    this.sessionStartTime = Date.now();
  }

  async initialize() {
    try {
      console.log('🔄 Initializing browser analytics for DJ AlterEgo...');
      
      this.isInitialized = true;
      console.log('✅ Browser analytics initialized successfully');
      
      // Log session start
      this.logSessionStart();
      
    } catch (error) {
      console.error('❌ Failed to initialize analytics:', error);
      this.isInitialized = false;
    }
  }

  private logSessionStart() {
    if (!this.isInitialized) return;

    const sessionData = {
      'session/start': 1,
      'session/id': this.sessionId,
      'session/timestamp': this.sessionStartTime,
      'session/platform': 'web',
      'session/ai_enabled': true
    };

    this.logToConsole('session_start', sessionData);
    this.storeAnalytics('session_start', sessionData);
  }

  logMoodAnalysis(mood: string, energy: number, crowdSize: number, confidence: number) {
    if (!this.isInitialized) return;

    const timestamp = Date.now();
    const sessionTime = (timestamp - this.sessionStartTime) / 1000; // seconds

    // Calculate mood stability (how long in current mood)
    const moodStability = this.calculateMoodStability(mood, timestamp);
    
    // Calculate energy trend
    const energyTrend = this.calculateEnergyTrend(energy);
    
    // Calculate crowd engagement
    const crowdEngagement = this.calculateCrowdEngagement(crowdSize, energy);

    const metrics = {
      // Core mood metrics
      'mood/current': mood,
      'mood/energy': energy,
      'mood/crowd_size': crowdSize,
      'mood/confidence': confidence,
      'mood/stability_seconds': moodStability,
      
      // Derived metrics
      'analysis/energy_trend': energyTrend,
      'analysis/crowd_engagement': crowdEngagement,
      'analysis/session_time': sessionTime,
      
      // Gemini performance
      'gemini/confidence': confidence,
      'gemini/response_quality': confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low',
      
      // Session context
      'session/timestamp': timestamp,
      'session/id': this.sessionId
    };

    this.logToConsole('mood_analysis', metrics);
    this.storeAnalytics('mood_analysis', metrics);

    // Update history
    this.moodHistory.push({ mood, timestamp, energy });
    this.lastMood = mood;
    this.lastEnergy = energy;
    this.lastCrowdSize = crowdSize;

    // Keep only last 50 entries
    if (this.moodHistory.length > 50) {
      this.moodHistory = this.moodHistory.slice(-50);
    }

    console.log(`📊 Mood analysis logged: ${mood} (${energy}% energy, ${crowdSize} people)`);
  }

  logMoodTransition(fromMood: string, toMood: string, energyChange: number, aiTriggered: boolean = false) {
    if (!this.isInitialized || fromMood === toMood) return;

    const timestamp = Date.now();
    const duration = this.moodHistory.length > 0 
      ? (timestamp - this.moodHistory[this.moodHistory.length - 1].timestamp) / 1000 
      : 0;

    const transition: MoodTransition = {
      fromMood,
      toMood,
      energyChange,
      crowdResponse: this.lastCrowdSize,
      trackChanged: false, // Will be updated if track changes
      aiTriggered,
      confidence: 0.8, // Default confidence
      duration
    };

    const transitionData = {
      'transitions/mood_change': `${fromMood} → ${toMood}`,
      'transitions/energy_delta': energyChange,
      'transitions/duration_seconds': duration,
      'transitions/ai_triggered': aiTriggered,
      'transitions/crowd_size': this.lastCrowdSize,
      'transitions/timestamp': timestamp,
      'session/id': this.sessionId
    };

    this.logToConsole('mood_transition', transitionData);
    this.storeAnalytics('mood_transition', transitionData);

    console.log(`🔄 Mood transition logged: ${fromMood} → ${toMood} (${energyChange > 0 ? '+' : ''}${energyChange}% energy)`);
  }

  logTrackChange(
    previousTrack: string, 
    newTrack: string, 
    reason: 'mood_change' | 'energy_shift' | 'manual_override' | 'ai_decision',
    moodContext: string,
    trackBPM: number,
    trackGenre: string
  ) {
    if (!this.isInitialized) return;

    const timestamp = Date.now();
    const timeInPreviousTrack = this.trackStartTime > 0 
      ? (timestamp - this.trackStartTime) / 1000 
      : 0;

    const trackData = {
      'tracks/previous': previousTrack,
      'tracks/new': newTrack,
      'tracks/change_reason': reason,
      'tracks/mood_context': moodContext,
      'tracks/bpm': trackBPM,
      'tracks/genre': trackGenre,
      'tracks/time_in_previous': timeInPreviousTrack,
      'tracks/energy_context': this.lastEnergy,
      'tracks/crowd_size': this.lastCrowdSize,
      'tracks/ai_decision': reason === 'ai_decision',
      'tracks/manual_override': reason === 'manual_override',
      'session/id': this.sessionId,
      'tracks/timestamp': timestamp
    };

    this.logToConsole('track_change', trackData);
    this.storeAnalytics('track_change', trackData);

    // Update tracking
    this.currentTrack = newTrack;
    this.trackStartTime = timestamp;
    this.trackHistory.push({ track: newTrack, timestamp, reason });

    // Keep only last 20 tracks
    if (this.trackHistory.length > 20) {
      this.trackHistory = this.trackHistory.slice(-20);
    }

    console.log(`🎵 Track change logged: ${previousTrack} → ${newTrack} (${reason})`);
  }

  logCrowdResponse(engagement: number, trackPlaying: string, timeInTrack: number) {
    if (!this.isInitialized) return;

    const crowdData = {
      'crowd/engagement': engagement,
      'crowd/size': this.lastCrowdSize,
      'crowd/energy_response': this.lastEnergy,
      'crowd/mood_response': this.lastMood,
      'crowd/track_playing': trackPlaying,
      'crowd/time_in_track': timeInTrack,
      'session/id': this.sessionId,
      'crowd/timestamp': Date.now()
    };

    this.logToConsole('crowd_response', crowdData);
    this.storeAnalytics('crowd_response', crowdData);

    console.log(`👥 Crowd response logged: ${engagement}% engagement, ${this.lastCrowdSize} people`);
  }

  logAIDecision(decision: string, confidence: number, context: any) {
    if (!this.isInitialized) return;

    const aiData = {
      'ai/decision': decision,
      'ai/confidence': confidence,
      'ai/mood_context': context.mood || this.lastMood,
      'ai/energy_context': context.energy || this.lastEnergy,
      'ai/crowd_context': context.crowdSize || this.lastCrowdSize,
      'ai/timestamp': Date.now(),
      'session/id': this.sessionId
    };

    this.logToConsole('ai_decision', aiData);
    this.storeAnalytics('ai_decision', aiData);

    console.log(`🤖 AI decision logged: ${decision} (${Math.round(confidence * 100)}% confidence)`);
  }

  logUserInteraction(action: string, details: any) {
    if (!this.isInitialized) return;

    const interactionData = {
      'user/action': action,
      'user/details': JSON.stringify(details),
      'user/mood_context': this.lastMood,
      'user/energy_context': this.lastEnergy,
      'user/timestamp': Date.now(),
      'session/id': this.sessionId
    };

    this.logToConsole('user_interaction', interactionData);
    this.storeAnalytics('user_interaction', interactionData);

    console.log(`👤 User interaction logged: ${action}`);
  }

  logSessionSummary() {
    if (!this.isInitialized) return;

    const sessionDuration = (Date.now() - this.sessionStartTime) / 1000 / 60; // minutes
    const totalTracks = this.trackHistory.length;
    const moodChanges = this.moodHistory.length;
    const avgEnergy = this.moodHistory.reduce((sum, m) => sum + m.energy, 0) / this.moodHistory.length;
    const avgCrowdSize = this.lastCrowdSize; // Simplified

    const summaryData = {
      'session/duration_minutes': sessionDuration,
      'session/total_tracks': totalTracks,
      'session/mood_changes': moodChanges,
      'session/avg_energy': avgEnergy,
      'session/avg_crowd_size': avgCrowdSize,
      'session/tracks_per_minute': totalTracks / sessionDuration,
      'session/mood_changes_per_minute': moodChanges / sessionDuration,
      'session/end_timestamp': Date.now(),
      'session/id': this.sessionId
    };

    this.logToConsole('session_summary', summaryData);
    this.storeAnalytics('session_summary', summaryData);

    console.log(`📊 Session summary logged: ${sessionDuration.toFixed(1)}min, ${totalTracks} tracks, ${moodChanges} mood changes`);
  }

  private calculateMoodStability(currentMood: string, timestamp: number): number {
    const recentMoods = this.moodHistory.filter(m => m.mood === currentMood);
    if (recentMoods.length === 0) return 0;
    
    const firstOccurrence = recentMoods[0].timestamp;
    return (timestamp - firstOccurrence) / 1000; // seconds
  }

  private calculateEnergyTrend(currentEnergy: number): number {
    if (this.moodHistory.length < 2) return 0;
    
    const recent = this.moodHistory.slice(-5); // Last 5 readings
    const avgRecent = recent.reduce((sum, m) => sum + m.energy, 0) / recent.length;
    
    return currentEnergy - avgRecent; // Positive = increasing, negative = decreasing
  }

  private calculateCrowdEngagement(crowdSize: number, energy: number): number {
    // Simple engagement calculation: crowd size * energy level
    return Math.min(100, (crowdSize * energy) / 10);
  }

  private logToConsole(type: string, data: any) {
    console.log(`📊 Analytics [${type}]:`, data);
  }

  private storeAnalytics(type: string, data: any) {
    this.analyticsData.push({
      type,
      data,
      timestamp: Date.now()
    });

    // Keep only last 1000 entries
    if (this.analyticsData.length > 1000) {
      this.analyticsData = this.analyticsData.slice(-1000);
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('dj_analytics', JSON.stringify(this.analyticsData.slice(-100)));
    } catch (error) {
      console.warn('Failed to store analytics in localStorage:', error);
    }
  }

  // Get analytics data for export
  getAnalyticsData() {
    return this.analyticsData;
  }

  // Export analytics as JSON
  exportAnalytics() {
    const data = {
      sessionId: this.sessionId,
      sessionStartTime: this.sessionStartTime,
      sessionDuration: (Date.now() - this.sessionStartTime) / 1000 / 60,
      analytics: this.analyticsData
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dj-analytics-${this.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('📊 Analytics exported successfully');
  }

  async finish() {
    if (!this.isInitialized) return;

    this.logSessionSummary();
    
    try {
      console.log('✅ Browser analytics session finished');
    } catch (error) {
      console.error('❌ Error finishing analytics session:', error);
    }
  }
}

// Singleton instance
export const djLogger = new BrowserDJLogger();