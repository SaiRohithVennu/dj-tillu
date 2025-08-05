// Wandb integration for DJ analytics and logging
// Note: Wandb functionality is disabled for now to avoid import errors

export class WandbDJLogger {
  private isInitialized = false;
  private sessionId: string | null = null;

  constructor() {
    // Initialize without wandb for now
    this.sessionId = `dj-session-${Date.now()}`;
  }

  // Initialize wandb session
  initialize() {
    try {
      console.log('📊 Analytics: Session started (wandb disabled)');
      this.isInitialized = true;
    } catch (error) {
      console.warn('📊 Analytics initialization failed:', error);
    }
  }

  // Log mood transitions
  logMoodTransition(
    fromMood: string,
    toMood: string,
    energyChange: number,
    isAITriggered: boolean
  ) {
    console.log('📊 Mood Transition:', {
      from: fromMood,
      to: toMood,
      energyChange,
      aiTriggered: isAITriggered,
      timestamp: new Date().toISOString()
    });

    // Wandb logging disabled
    // wandb.log({
    //   mood_transition: {
    //     from_mood: fromMood,
    //     to_mood: toMood,
    //     energy_change: energyChange,
    //     ai_triggered: isAITriggered
    //   }
    // });
  }

  // Log mood analysis results
  logMoodAnalysis(mood: string, energy: number, crowdSize: number, confidence: number) {
    console.log('📊 Mood Analysis:', {
      mood,
      energy,
      crowdSize,
      confidence,
      timestamp: new Date().toISOString()
    });

    // Wandb logging disabled
    // wandb.log({
    //   mood_analysis: {
    //     mood,
    //     energy,
    //     crowd_size: crowdSize,
    //     confidence
    //   }
    // });
  }

  // Log track changes
  logTrackChange(
    fromTrack: string,
    toTrack: string,
    reason: 'ai_decision' | 'manual_override',
    mood: string,
    bpm: number,
    genre: string
  ) {
    console.log('📊 Track Change:', {
      from: fromTrack,
      to: toTrack,
      reason,
      mood,
      bpm,
      genre,
      timestamp: new Date().toISOString()
    });

    // Wandb logging disabled
    // wandb.log({
    //   track_change: {
    //     from_track: fromTrack,
    //     to_track: toTrack,
    //     change_reason: reason,
    //     current_mood: mood,
    //     track_bpm: bpm,
    //     track_genre: genre
    //   }
    // });
  }

  // Log crowd response
  logCrowdResponse(engagement: number, trackTitle: string, timeInTrack: number) {
    console.log('📊 Crowd Response:', {
      engagement,
      track: trackTitle,
      timeInTrack,
      timestamp: new Date().toISOString()
    });

    // Wandb logging disabled
    // wandb.log({
    //   crowd_response: {
    //     engagement_score: engagement,
    //     current_track: trackTitle,
    //     time_in_track: timeInTrack
    //   }
    // });
  }

  // Log AI decisions
  logAIDecision(decision: string, confidence: number, context: any) {
    console.log('📊 AI Decision:', {
      decision,
      confidence,
      context,
      timestamp: new Date().toISOString()
    });

    // Wandb logging disabled
    // wandb.log({
    //   ai_decision: {
    //     decision_type: decision,
    //     confidence_score: confidence,
    //     decision_context: context
    //   }
    // });
  }

  // Log user interactions
  logUserInteraction(action: string, details: any) {
    console.log('📊 User Interaction:', {
      action,
      details,
      timestamp: new Date().toISOString()
    });

    // Wandb logging disabled
    // wandb.log({
    //   user_interaction: {
    //     action_type: action,
    //     interaction_details: details
    //   }
    // });
  }

  // Finish session
  finish() {
    console.log('📊 Analytics: Session ended');
    this.isInitialized = false;
    
    // Wandb finish disabled
    // wandb.finish();
  }
}

export const djLogger = new WandbDJLogger();