// Client-side service to communicate with server-side AWS functions
export interface VIPPerson {
  id: string;
  name: string;
  role: string;
  imageFile?: File;
  imageUrl?: string;
  recognitionCount: number;
  lastSeen?: Date;
}

export interface FaceMatch {
  confidence: number;
  personName: string;
  personId: string;
  boundingBox: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export interface CrowdAnalysis {
  faceCount: number;
  emotions: string[];
  averageAge: number;
  dominantEmotion: string;
}

export class ServerSideAWSService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aws-face-recognition`;
  }

  private async makeRequest(data: any): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Convert File to base64
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (data:image/jpeg;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Convert video frame to base64
  private videoFrameToBase64(videoElement: HTMLVideoElement): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    ctx.drawImage(videoElement, 0, 0);

    // Get base64 without data URL prefix
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  }

  // Initialize AWS services for an event
  async initializeEvent(eventId: string, vipPeople: VIPPerson[]): Promise<{
    success: boolean;
    message: string;
    vipCount?: number;
  }> {
    try {
      console.log('🔧 Initializing server-side AWS services...');

      // Convert VIP images to base64
      const processedVIPs = await Promise.all(
        vipPeople.map(async (person) => {
          if (person.imageFile) {
            const imageData = await this.fileToBase64(person.imageFile);
            return {
              id: person.id,
              name: person.name,
              role: person.role,
              imageData
            };
          }
          return {
            id: person.id,
            name: person.name,
            role: person.role
          };
        })
      );

      const result = await this.makeRequest({
        action: 'initialize',
        eventId,
        vipPeople: processedVIPs
      });

      console.log('✅ Server-side AWS initialization complete');
      return result;

    } catch (error: any) {
      console.error('❌ Server-side AWS initialization failed:', error);
      throw new Error(`AWS initialization failed: ${error.message}`);
    }
  }

  // Recognize faces in video frame
  async recognizeFaces(eventId: string, videoElement: HTMLVideoElement): Promise<{
    matches: FaceMatch[];
    crowdAnalysis: CrowdAnalysis;
  }> {
    try {
      const imageData = this.videoFrameToBase64(videoElement);

      const result = await this.makeRequest({
        action: 'recognize',
        eventId,
        imageData
      });

      if (!result.success) {
        throw new Error('Recognition failed on server');
      }

      return {
        matches: result.matches || [],
        crowdAnalysis: result.crowdAnalysis || {
          faceCount: 0,
          emotions: [],
          averageAge: 0,
          dominantEmotion: 'neutral'
        }
      };

    } catch (error: any) {
      console.error('❌ Server-side face recognition failed:', error);
      return {
        matches: [],
        crowdAnalysis: {
          faceCount: 0,
          emotions: [],
          averageAge: 0,
          dominantEmotion: 'neutral'
        }
      };
    }
  }

  // Clean up AWS resources
  async cleanupEvent(eventId: string): Promise<boolean> {
    try {
      const result = await this.makeRequest({
        action: 'cleanup',
        eventId
      });

      return result.success;
    } catch (error: any) {
      console.error('❌ Server-side cleanup failed:', error);
      return false;
    }
  }
}

export const serverSideAWS = new ServerSideAWSService();