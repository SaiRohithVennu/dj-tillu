import wandb from 'wandb';

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

export class WandbDJLogger {
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

  constructor() {
    this.sessionId = `dj-session-${Date.now()}`;
    this.sessionStartTime = Date.now();
  }

  async initialize() {
    try {
      console.log('🔄 Initializing wandb for DJ AlterEgo...');
      
      await wandb.init({
        project: 'dj-alterego',
        entity: 'rohithv0898',
        apiKey: 'ea9fd0db0a318a07e06857dfb82ca56bdbffe9d7',
        config: {
          app_version: '1.0.0',
          session_id: this.sessionId,
          ai_dj_enabled: true,
          gemini_vision_enabled: true,
          mood_analysis_interval: 10000,
          track_change_threshold: 'mood_shift'
        },
        tags: ['ai-dj', 'live-performance', 'mood-analysis', 'gemini-vision'],
        notes: 'Live DJ set with AI mood analysis and automatic track selection'
      });

      this.isInitialized = true;
      console.log('✅ wandb initialized successfully');
      
      // Log session start
      this.logSessionStart();
      
    } catch (error) {
      console.error('❌ Failed to initialize wandb:', error);
      this.isInitialized = false;
    }
  }

  private logSessionStart() {
    if (!this.isInitialized) return;

    wandb.log({
      'session/start': 1,
      'session/id': this.sessionId,
      'session/timestamp': this.sessionStartTime,
      'session/platform': 'web',
      'session/ai_enabled': true
    });

    console.log('📊 Session start logged to wandb');
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

    wandb.log(metrics);

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

    wandb.log({
      'transitions/mood_change': `${fromMood} → ${toMood}`,
      'transitions/energy_delta': energyChange,
      'transitions/duration_seconds': duration,
      'transitions/ai_triggered': aiTriggered,
      'transitions/crowd_size': this.lastCrowdSize,
      'transitions/timestamp': timestamp,
      'session/id': this.sessionId
    });

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

    const trackChange: TrackChange = {
      previousTrack,
      newTrack,
      reason,
      moodContext,
      energyBefore: this.lastEnergy,
      energyAfter: this.lastEnergy, // Will be updated after mood analysis
      crowdSize: this.lastCrowdSize,
      confidence: 0.8,
      timestamp
    };

    wandb.log({
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
    });

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

    const crowdResponse: CrowdResponse = {
      mood: this.lastMood,
      energy: this.lastEnergy,
      crowdSize: this.lastCrowdSize,
      engagement,
      trackPlaying,
      timeInTrack,
      geminiConfidence: 0.8 // Will be updated with actual confidence
    };

    wandb.log({
      'crowd/engagement': engagement,
      'crowd/size': this.lastCrowdSize,
      'crowd/energy_response': this.lastEnergy,
      'crowd/mood_response': this.lastMood,
      'crowd/track_playing': trackPlaying,
      'crowd/time_in_track': timeInTrack,
      'session/id': this.sessionId,
      'crowd/timestamp': Date.now()
    });

    console.log(`👥 Crowd response logged: ${engagement}% engagement, ${this.lastCrowdSize} people`);
  }

  logAIDecision(decision: string, confidence: number, context: any) {
    if (!this.isInitialized) return;

    wandb.log({
      'ai/decision': decision,
      'ai/confidence': confidence,
      'ai/mood_context': context.mood || this.lastMood,
      'ai/energy_context': context.energy || this.lastEnergy,
      'ai/crowd_context': context.crowdSize || this.lastCrowdSize,
      'ai/timestamp': Date.now(),
      'session/id': this.sessionId
    });

    console.log(`🤖 AI decision logged: ${decision} (${Math.round(confidence * 100)}% confidence)`);
  }

  logUserInteraction(action: string, details: any) {
    if (!this.isInitialized) return;

    wandb.log({
      'user/action': action,
      'user/details': JSON.stringify(details),
      'user/mood_context': this.lastMood,
      'user/energy_context': this.lastEnergy,
      'user/timestamp': Date.now(),
      'session/id': this.sessionId
    });

    console.log(`👤 User interaction logged: ${action}`);
  }

  logSessionSummary() {
    if (!this.isInitialized) return;

    const sessionDuration = (Date.now() - this.sessionStartTime) / 1000 / 60; // minutes
    const totalTracks = this.trackHistory.length;
    const moodChanges = this.moodHistory.length;
    const avgEnergy = this.moodHistory.reduce((sum, m) => sum + m.energy, 0) / this.moodHistory.length;
    const avgCrowdSize = this.lastCrowdSize; // Simplified

    wandb.log({
      'session/duration_minutes': sessionDuration,
      'session/total_tracks': totalTracks,
      'session/mood_changes': moodChanges,
      'session/avg_energy': avgEnergy,
      'session/avg_crowd_size': avgCrowdSize,
      'session/tracks_per_minute': totalTracks / sessionDuration,
      'session/mood_changes_per_minute': moodChanges / sessionDuration,
      'session/end_timestamp': Date.now(),
      'session/id': this.sessionId
    });

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

  async finish() {
    if (!this.isInitialized) return;

    this.logSessionSummary();
    
    try {
      await wandb.finish();
      console.log('✅ wandb session finished');
    } catch (error) {
      console.error('❌ Error finishing wandb session:', error);
    }
  }
}

// Singleton instance
export const djLogger = new WandbDJLogger();