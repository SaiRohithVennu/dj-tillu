// DJ Analytics Logger for tracking performance and decisions
export class DJLogger {
  private isInitialized = false;
  private sessionId: string | null = null;
  private startTime: number = 0;

  // Initialize logging session
  initialize() {
    try {
      this.sessionId = `dj-session-${Date.now()}`;
      this.startTime = Date.now();
      this.isInitialized = true;
      
      console.log('📊 DJ Analytics: Session started', this.sessionId);
      
      // Log session start
      this.logEvent('session_start', {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.warn('📊 DJ Analytics: Failed to initialize:', error);
    }
  }

  // Log mood transitions
  logMoodTransition(
    fromMood: string,
    toMood: string,
    energyChange: number,
    isAITriggered: boolean
  ) {
    if (!this.isInitialized) return;

    this.logEvent('mood_transition', {
      fromMood,
      toMood,
      energyChange,
      isAITriggered,
      timestamp: new Date().toISOString()
    });
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
    if (!this.isInitialized) return;

    this.logEvent('track_change', {
      fromTrack,
      toTrack,
      reason,
      mood,
      bpm,
      genre,
      timestamp: new Date().toISOString()
    });
  }

  // Log mood analysis results
  logMoodAnalysis(
    mood: string,
    energy: number,
    crowdSize: number,
    confidence: number
  ) {
    if (!this.isInitialized) return;

    this.logEvent('mood_analysis', {
      mood,
      energy,
      crowdSize,
      confidence,
      timestamp: new Date().toISOString()
    });
  }

  // Log crowd response metrics
  logCrowdResponse(
    engagement: number,
    currentTrack: string,
    timeInTrack: number
  ) {
    if (!this.isInitialized) return;

    this.logEvent('crowd_response', {
      engagement,
      currentTrack,
      timeInTrack,
      timestamp: new Date().toISOString()
    });
  }

  // Log AI decisions
  logAIDecision(
    decision: string,
    confidence: number,
    context: any
  ) {
    if (!this.isInitialized) return;

    this.logEvent('ai_decision', {
      decision,
      confidence,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // Log user interactions
  logUserInteraction(
    action: string,
    details: any
  ) {
    if (!this.isInitialized) return;

    this.logEvent('user_interaction', {
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Generic event logging
  private logEvent(eventType: string, data: any) {
    try {
      // Store in localStorage for now (could be sent to analytics service)
      const logEntry = {
        sessionId: this.sessionId,
        eventType,
        data,
        timestamp: Date.now()
      };

      const existingLogs = JSON.parse(localStorage.getItem('dj_analytics') || '[]');
      existingLogs.push(logEntry);
      
      // Keep only last 1000 entries
      if (existingLogs.length > 1000) {
        existingLogs.splice(0, existingLogs.length - 1000);
      }
      
      localStorage.setItem('dj_analytics', JSON.stringify(existingLogs));
      
      console.log(`📊 DJ Analytics: ${eventType}`, data);
    } catch (error) {
      console.warn('📊 DJ Analytics: Failed to log event:', error);
    }
  }

  // Get session analytics
  getSessionAnalytics() {
    if (!this.isInitialized) return null;

    try {
      const logs = JSON.parse(localStorage.getItem('dj_analytics') || '[]');
      const sessionLogs = logs.filter((log: any) => log.sessionId === this.sessionId);
      
      return {
        sessionId: this.sessionId,
        duration: Date.now() - this.startTime,
        totalEvents: sessionLogs.length,
        eventTypes: [...new Set(sessionLogs.map((log: any) => log.eventType))],
        logs: sessionLogs
      };
    } catch (error) {
      console.warn('📊 DJ Analytics: Failed to get analytics:', error);
      return null;
    }
  }

  // Finish session
  finish() {
    if (!this.isInitialized) return;

    this.logEvent('session_end', {
      duration: Date.now() - this.startTime,
      timestamp: new Date().toISOString()
    });

    console.log('📊 DJ Analytics: Session ended');
    this.isInitialized = false;
  }
}

export const djLogger = new DJLogger();