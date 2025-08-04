import { init, log, finish } from 'wandb';

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

class WandbLogger {
  private initialized = false;
  private projectName = 'ai-dj-system';

  async initialize() {
    try {
      if (!this.initialized) {
        await init({
          project: this.projectName,
          name: `dj-session-${Date.now()}`,
          config: {
            system: 'AI DJ System',
            version: '1.0.0'
          }
        });
        this.initialized = true;
        console.log('WandB logging initialized');
      }
    } catch (error) {
      console.warn('Failed to initialize WandB:', error);
    }
  }

  async logTrackPlay(track: TrackMetadata) {
    try {
      if (!this.initialized) await this.initialize();
      
      await log({
        event: 'track_play',
        track_title: track.title,
        track_artist: track.artist,
        track_genre: track.genre,
        track_bpm: track.bpm,
        track_duration: track.duration,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('Failed to log track play:', error);
    }
  }

  async logMoodChange(moodData: MoodData) {
    try {
      if (!this.initialized) await this.initialize();
      
      await log({
        event: 'mood_change',
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
      if (!this.initialized) await this.initialize();
      
      await log({
        event: 'face_recognition',
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
      if (!this.initialized) await this.initialize();
      
      await log({
        event: 'dj_action',
        action,
        ...metadata,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('Failed to log DJ action:', error);
    }
  }

  async finishSession() {
    try {
      if (this.initialized) {
        await finish();
        this.initialized = false;
        console.log('WandB session finished');
      }
    } catch (error) {
      console.warn('Failed to finish WandB session:', error);
    }
  }
}

// Export singleton instance
export const wandbLogger = new WandbLogger();