import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface VipGuest {
  name: string;
  role: string;
  imageUrl?: string;
}

interface EventDetails {
  eventName: string;
  eventType: string;
  vipGuests: VipGuest[];
}

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

// Check if AWS credentials are available
const hasAWSCredentials = () => {
  const accessKey = Deno.env.get('AWS_ACCESS_KEY_ID');
  const secretKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
  const region = Deno.env.get('AWS_REGION');
  
  return !!(accessKey && secretKey && region);
};

// Mock AWS services for development/demo purposes
class MockAWSService {
  private static vipGuests: VipGuest[] = [];
  private static eventName: string = '';

  static async initializeEvent(eventDetails: EventDetails) {
    console.log('🔄 Mock AWS: Initializing event:', eventDetails.eventName);
    this.eventName = eventDetails.eventName;
    this.vipGuests = eventDetails.vipGuests;
    
    // Simulate AWS setup delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: `Mock AWS services initialized for ${eventDetails.eventName}`,
      collectionId: `mock-collection-${Date.now()}`,
      bucketName: `mock-bucket-${eventDetails.eventName.toLowerCase().replace(/\s+/g, '-')}`
    };
  }

  static async recognizeFaces(imageData: string): Promise<FaceRecognitionResult[]> {
    console.log('🔍 Mock AWS: Processing face recognition...');
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock recognition results - randomly recognize VIP guests
    const mockResults: FaceRecognitionResult[] = [];
    
    if (this.vipGuests.length > 0 && Math.random() > 0.7) {
      const randomVip = this.vipGuests[Math.floor(Math.random() * this.vipGuests.length)];
      mockResults.push({
        name: randomVip.name,
        confidence: 85 + Math.random() * 10, // 85-95% confidence
        boundingBox: {
          left: Math.random() * 0.3,
          top: Math.random() * 0.3,
          width: 0.2 + Math.random() * 0.3,
          height: 0.3 + Math.random() * 0.4
        }
      });
    }
    
    console.log(`✅ Mock AWS: Found ${mockResults.length} recognized faces`);
    return mockResults;
  }

  static async addVipGuest(name: string, imageData: string) {
    console.log('👤 Mock AWS: Adding VIP guest:', name);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    this.vipGuests.push({ name, role: 'Guest' });
    
    return {
      success: true,
      message: `VIP guest ${name} added to mock collection`,
      faceId: `mock-face-${Date.now()}`
    };
  }

  static getEventStats() {
    return {
      totalVipGuests: this.vipGuests.length,
      eventName: this.eventName,
      recognitionCount: Math.floor(Math.random() * 10),
      lastRecognition: new Date().toISOString()
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();
    
    if (!endpoint) {
      throw new Error('No endpoint specified');
    }

    const body = await req.json();
    let result;

    // Check if AWS credentials are configured
    if (!hasAWSCredentials()) {
      console.warn('⚠️ AWS credentials not configured, using mock service');
      
      switch (endpoint) {
        case 'initialize':
          result = await MockAWSService.initializeEvent(body as EventDetails);
          break;
        case 'recognize':
          const faces = await MockAWSService.recognizeFaces(body.imageData);
          result = { success: true, faces };
          break;
        case 'add-vip':
          result = await MockAWSService.addVipGuest(body.name, body.imageData);
          break;
        case 'stats':
          const stats = MockAWSService.getEventStats();
          result = { success: true, stats };
          break;
        default:
          throw new Error(`Unknown endpoint: ${endpoint}`);
      }
    } else {
      // TODO: Implement real AWS services when credentials are available
      throw new Error('Real AWS integration not yet implemented. Please configure mock mode or implement AWS SDK integration.');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Edge function error:', error);
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});