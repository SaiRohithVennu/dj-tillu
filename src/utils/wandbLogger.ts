interface TrackMetadata {
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  duration: number;
}

interface MoodData {
  mood: string;
  confidence: number;
  timestamp: number;
}

interface FaceRecognitionData {
  personName: string;
  confidence: number;
  timestamp: number;
}

class DJLogger {
  private sessionId: string;
  private logs: any[] = [];
  private initialized = false;

  constructor() {
    this.sessionId = `dj-session-${Date.now()}`;
  }

  async initialize() {
    try {
      this.initialized = true;
      this.log('session_start', {
        sessionId: this.sessionId,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      });
      console.log('📊 DJ Logger initialized (browser mode)');
    } catch (error) {
      console.warn('Failed to initialize DJ Logger:', error);
    }
  }

  private log(event: string, data: any) {
    const logEntry = {
      event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...data
    };
    
    this.logs.push(logEntry);
    console.log('📊 DJ Log:', logEntry);
    
    // Keep only last 1000 logs to prevent memory issues
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  async logTrackPlay(track: TrackMetadata) {
    try {
      this.log('track_play', {
        track_title: track.title,
        track_artist: track.artist,
        track_genre: track.genre,
        track_bpm: track.bpm,
        track_duration: track.duration
      });
    } catch (error) {
      console.warn('Failed to log track play:', error);
    }
  }

  async logMoodChange(moodData: MoodData) {
    try {
      this.log('mood_change', {
        mood: moodData.mood,
        confidence: moodData.confidence,
        timestamp: moodData.timestamp
      });
    } catch (error) {
      console.warn('Failed to log mood change:', error);
    }
  }

  async logFaceRecognition(faceData: FaceRecognitionData) {
    try {
      this.log('face_recognition', {
        person_name: faceData.personName,
        confidence: faceData.confidence,
        timestamp: faceData.timestamp
      });
    } catch (error) {
      console.warn('Failed to log face recognition:', error);
    }
  }

  async logDJAction(action: string, metadata: Record<string, any> = {}) {
    try {
      this.log('dj_action', {
        action,
        ...metadata
      });
    } catch (error) {
      console.warn('Failed to log DJ action:', error);
    }
  }

  async logMoodAnalysis(mood: string, energy: number, crowdSize: number, confidence: number) {
    try {
      this.log('mood_analysis', {
        mood,
        energy,
        crowd_size: crowdSize,
        confidence
      });
    } catch (error) {
      console.warn('Failed to log mood analysis:', error);
    }
  }

  async logMoodTransition(fromMood: string, toMood: string, energyChange: number, isAIActive: boolean) {
    try {
      this.log('mood_transition', {
        from_mood: fromMood,
        to_mood: toMood,
        energy_change: energyChange,
        ai_active: isAIActive
      });
    } catch (error) {
      console.warn('Failed to log mood transition:', error);
    }
  }

  async logTrackChange(fromTrack: string, toTrack: string, reason: string, mood: string, bpm: number, genre: string) {
    try {
      this.log('track_change', {
        from_track: fromTrack,
        to_track: toTrack,
        reason,
        mood,
        bpm,
        genre
      });
    } catch (error) {
      console.warn('Failed to log track change:', error);
    }
  }

  async logCrowdResponse(engagement: number, trackTitle: string, timeInTrack: number) {
    try {
      this.log('crowd_response', {
        engagement,
        track_title: trackTitle,
        time_in_track: timeInTrack
      });
    } catch (error) {
      console.warn('Failed to log crowd response:', error);
    }
  }

  async logAIDecision(decision: string, confidence: number, context: any) {
    try {
      this.log('ai_decision', {
        decision,
        confidence,
        context
      });
    } catch (error) {
      console.warn('Failed to log AI decision:', error);
    }
  }

  async logUserInteraction(action: string, details: any) {
    try {
      this.log('user_interaction', {
        action,
        details
      });
    } catch (error) {
      console.warn('Failed to log user interaction:', error);
    }
  }

  async finishSession() {
    try {
      this.log('session_end', {
        duration: Date.now() - parseInt(this.sessionId.split('-')[2]),
        total_logs: this.logs.length
      });
      console.log('📊 DJ Logger session finished');
    } catch (error) {
      console.warn('Failed to finish DJ Logger session:', error);
    }
  }

  // Get session summary for debugging
  getSessionSummary() {
    return {
      sessionId: this.sessionId,
      totalLogs: this.logs.length,
      events: this.logs.reduce((acc, log) => {
        acc[log.event] = (acc[log.event] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  // Export logs for external analysis
  exportLogs() {
    return {
      sessionId: this.sessionId,
      logs: this.logs,
      summary: this.getSessionSummary()
    };
  }
}

// Export singleton instance
export const djLogger = new DJLogger();

// For backward compatibility, also export as wandbLogger
export const wandbLogger = djLogger;