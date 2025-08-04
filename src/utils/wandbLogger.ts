// Wandb integration removed - no longer needed
export class WandbDJLogger {
  constructor() {
    console.log('📊 Analytics: Wandb integration disabled');
  }

  logSession(data: any) {
    console.log('📊 Session data:', data);
  }

  logMoodChange(data: any) {
    console.log('📊 Mood change:', data);
  }

  logTrackChange(data: any) {
    console.log('📊 Track change:', data);
  }

  logVIPRecognition(data: any) {
    console.log('📊 VIP recognition:', data);
  }

  logAIDecision(data: any) {
    console.log('📊 AI decision:', data);
  }

  finish() {
    console.log('📊 Session finished');
  }
}

export const wandbLogger = new WandbDJLogger();