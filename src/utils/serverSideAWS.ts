interface FaceRecognitionResult {
  name: string;
  confidence: number;
  boundingBox?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

interface EventDetails {
  eventName: string;
  eventType: string;
  vipGuests: Array<{
    name: string;
    role: string;
    imageUrl?: string;
  }>;
}

export class ServerSideAWSService {
  private static readonly FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aws-face-recognition`;
  
  private static async makeRequest(endpoint: string, data: any) {
    try {
      const response = await fetch(`${this.FUNCTION_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Request failed'}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to AWS services. Please check your network connection and ensure the Supabase Edge Function is properly deployed.');
      }
      throw error;
    }
  }

  static async initializeEvent(eventDetails: EventDetails) {
    try {
      console.log('🔄 Initializing AWS services for event:', eventDetails.eventName);
      
      const response = await this.makeRequest('initialize', {
        eventName: eventDetails.eventName,
        eventType: eventDetails.eventType,
        vipGuests: eventDetails.vipGuests
      });

      if (!response.success) {
        throw new Error(response.error || 'AWS initialization failed');
      }

      console.log('✅ AWS services initialized successfully');
      return response;
    } catch (error) {
      console.error('❌ AWS initialization failed:', error);
      throw new Error(`Failed to initialize AWS services: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async recognizeFaces(imageData: string): Promise<FaceRecognitionResult[]> {
    try {
      console.log('🔍 Processing face recognition...');
      
      const response = await this.makeRequest('recognize', {
        imageData: imageData
      });

      if (!response.success) {
        throw new Error(response.error || 'Face recognition failed');
      }

      console.log(`✅ Face recognition completed. Found ${response.faces?.length || 0} faces`);
      return response.faces || [];
    } catch (error) {
      console.error('❌ Face recognition failed:', error);
      throw new Error(`Face recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async addVipGuest(name: string, imageData: string) {
    try {
      console.log('👤 Adding VIP guest:', name);
      
      const response = await this.makeRequest('add-vip', {
        name: name,
        imageData: imageData
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to add VIP guest');
      }

      console.log('✅ VIP guest added successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to add VIP guest:', error);
      throw new Error(`Failed to add VIP guest: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getEventStats() {
    try {
      const response = await this.makeRequest('stats', {});
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to get event stats');
      }

      return response.stats;
    } catch (error) {
      console.error('❌ Failed to get event stats:', error);
      throw new Error(`Failed to get event stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}