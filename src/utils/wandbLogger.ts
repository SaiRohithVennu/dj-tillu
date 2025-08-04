import * as wandb from 'wandb';

export class WandbDJLogger {
  private initialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      // Initialize wandb for DJ performance tracking
      await wandb.init({
        project: 'dj-tillu-performance',
        name: `dj-session-${Date.now()}`,
        config: {
          environment: 'production',
          version: '1.0.0'
        }
      });
      this.initialized = true;
      console.log('WandB DJ Logger initialized successfully');
    } catch (error) {
      console.warn('WandB initialization failed:', error);
      this.initialized = false;
    }
  }

  logTrackPlay(track: any) {
    if (!this.initialized) return;
    
    try {
      wandb.log({
        event: 'track_played',
        track_title: track.title,
        artist: track.artist,
        genre: track.genre,
        bpm: track.bpm,
        duration: track.duration,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to log track play:', error);
    }
  }

  logMoodChange(mood: string, confidence: number) {
    if (!this.initialized) return;
    
    try {
      wandb.log({
        event: 'mood_change',
        mood: mood,
        confidence: confidence,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to log mood change:', error);
    }
  }

  logFaceRecognition(personName: string, confidence: number) {
    if (!this.initialized) return;
    
    try {
      wandb.log({
        event: 'face_recognized',
        person: personName,
        confidence: confidence,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to log face recognition:', error);
    }
  }

  logDJAction(action: string, details: any = {}) {
    if (!this.initialized) return;
    
    try {
      wandb.log({
        event: 'dj_action',
        action: action,
        details: details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to log DJ action:', error);
    }
  }

  async finish() {
    if (!this.initialized) return;
    
    try {
      await wandb.finish();
      console.log('WandB DJ Logger session finished');
    } catch (error) {
      console.warn('Failed to finish WandB session:', error);
    }
  }
}

// Export singleton instance
export const djLogger = new WandbDJLogger();