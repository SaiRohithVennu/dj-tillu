class ServerSideAWSService {
  private supabaseUrl: string;
  private supabaseKey: string;
  private useMockService: boolean = false;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    // Check if we have valid Supabase credentials
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('⚠️ Supabase credentials not found, using mock AWS service');
      this.useMockService = true;
    }
  }

  private async makeRequest(endpoint: string, data: any) {
    if (this.useMockService) {
      return this.getMockResponse(endpoint, data);
    }

    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('⚠️ Edge Function not found, switching to mock service');
          this.useMockService = true;
          return this.getMockResponse(endpoint, data);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('⚠️ Network error, switching to mock AWS service');
        this.useMockService = true;
        return this.getMockResponse(endpoint, data);
      }
      throw error;
    }
  }

  private getMockResponse(endpoint: string, data: any) {
    console.log(`🎭 Using mock AWS service for endpoint: ${endpoint}`);
    
    switch (endpoint) {
      case 'aws-face-recognition':
        if (data.action === 'initialize') {
          return { success: true, message: 'Mock AWS initialized', collectionId: data.collectionId };
        } else if (data.action === 'recognize') {
          return {
            success: true,
            faces: [
              {
                faceId: 'mock-face-123',
                confidence: 85.5,
                personId: 'mock-person-1',
                personName: 'Mock Person',
                boundingBox: { left: 0.2, top: 0.3, width: 0.4, height: 0.5 }
              }
            ]
          };
        } else if (data.action === 'addFace') {
          return { success: true, faceId: 'mock-face-' + Date.now() };
        }
        break;
      default:
        return { success: true, message: 'Mock response' };
    }
  }

  async initializeEvent(eventDetails: { eventId: string; eventName: string; collectionId: string }) {
    try {
      const response = await this.makeRequest('aws-face-recognition', {
        action: 'initialize',
        ...eventDetails
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to initialize AWS services');
      }
      
      return response;
    } catch (error) {
      console.error('AWS initialization error:', error);
      throw new Error('Unable to connect to AWS services. Please check your network connection and ensure the Supabase Edge Function is properly deployed.');
    }
  }

  async recognizeFace(imageData: string) {
    try {
      const response = await this.makeRequest('aws-face-recognition', {
        action: 'recognize',
        imageData
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Face recognition failed');
      }
      
      return response.faces || [];
    } catch (error) {
      console.error('Face recognition error:', error);
      throw error;
    }
  }

  async addFace(imageData: string, personId: string, personName: string) {
    try {
      const response = await this.makeRequest('aws-face-recognition', {
        action: 'addFace',
        imageData,
        personId,
        personName
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to add face');
      }
      
      return response;
    } catch (error) {
      console.error('Add face error:', error);
      throw error;
    }
  }
}

export { ServerSideAWSService };