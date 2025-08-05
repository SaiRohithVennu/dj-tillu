import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { S3Client, CreateBucketCommand, HeadBucketCommand, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3"
import { 
  RekognitionClient, 
  CreateCollectionCommand, 
  IndexFacesCommand, 
  SearchFacesByImageCommand,
  DetectFacesCommand,
  DeleteCollectionCommand 
} from "https://esm.sh/@aws-sdk/client-rekognition@3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface VIPPerson {
  id: string;
  name: string;
  role: string;
  imageData?: string; // base64 image data
}

interface FaceMatch {
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

class ServerSideAWSService {
  private rekognitionClient: RekognitionClient;
  private s3Client: S3Client;
  private bucketName = 'dj-tillu-rekognition-bucket';

  constructor() {
    const region = Deno.env.get('AWS_REGION') || 'us-west-2';
    
    const credentials = {
      accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
      secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
    };

    this.s3Client = new S3Client({
      region,
      credentials,
    });

    this.rekognitionClient = new RekognitionClient({
      region,
      credentials,
    });
  }

  async initializeBucket(): Promise<boolean> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ 
        Bucket: this.bucketName 
      }));
      console.log('✅ S3 bucket exists and accessible');
      return true;
    } catch (error) {
      console.error('❌ S3 bucket access failed:', error);
      return false;
    }
  }

  async createCollection(eventId: string): Promise<boolean> {
    const collectionId = `event-${eventId}`;
    
    try {
      await this.rekognitionClient.send(new CreateCollectionCommand({
        CollectionId: collectionId
      }));
      console.log(`✅ Created Rekognition collection: ${collectionId}`);
      return true;
    } catch (error: any) {
      if (error.name === 'ResourceAlreadyExistsException') {
        console.log(`✅ Collection already exists: ${collectionId}`);
        return true;
      }
      console.error('❌ Failed to create collection:', error);
      return false;
    }
  }

  async indexVIPFaces(eventId: string, vipPeople: VIPPerson[]): Promise<boolean> {
    const collectionId = `event-${eventId}`;
    
    try {
      for (const person of vipPeople) {
        if (!person.imageData) continue;

        // Convert base64 to Uint8Array
        const imageBytes = Uint8Array.from(atob(person.imageData), c => c.charCodeAt(0));

        // Upload to S3 first
        const s3Key = `vip-photos/${person.id}-${person.name.replace(/\s+/g, '-')}.jpg`;
        await this.s3Client.send(new PutObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
          Body: imageBytes,
          ContentType: 'image/jpeg',
          Metadata: {
            personId: person.id,
            personName: person.name,
            personRole: person.role
          }
        }));

        // Index face in Rekognition
        const result = await this.rekognitionClient.send(new IndexFacesCommand({
          CollectionId: collectionId,
          Image: {
            S3Object: {
              Bucket: this.bucketName,
              Name: s3Key
            }
          },
          ExternalImageId: person.id,
          DetectionAttributes: ['ALL']
        }));

        if (result.FaceRecords && result.FaceRecords.length > 0) {
          console.log(`✅ Indexed face for ${person.name}`);
        } else {
          console.warn(`⚠️ No face detected in photo for ${person.name}`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to index VIP faces:', error);
      return false;
    }
  }

  async recognizeFaces(eventId: string, imageData: string): Promise<{
    matches: FaceMatch[];
    crowdAnalysis: {
      faceCount: number;
      emotions: string[];
      averageAge: number;
      dominantEmotion: string;
    };
  }> {
    const collectionId = `event-${eventId}`;
    
    try {
      const imageBytes = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));

      // Search for VIP faces
      const searchResult = await this.rekognitionClient.send(new SearchFacesByImageCommand({
        CollectionId: collectionId,
        Image: { Bytes: imageBytes },
        FaceMatchThreshold: 70,
        MaxFaces: 10
      }));

      const matches: FaceMatch[] = [];
      if (searchResult.FaceMatches) {
        for (const match of searchResult.FaceMatches) {
          if (match.Face && match.Face.ExternalImageId && match.Similarity) {
            matches.push({
              confidence: match.Similarity,
              personName: match.Face.ExternalImageId,
              personId: match.Face.ExternalImageId,
              boundingBox: {
                left: match.Face.BoundingBox?.Left || 0,
                top: match.Face.BoundingBox?.Top || 0,
                width: match.Face.BoundingBox?.Width || 0,
                height: match.Face.BoundingBox?.Height || 0
              }
            });
          }
        }
      }

      // Detect all faces for crowd analysis
      const detectResult = await this.rekognitionClient.send(new DetectFacesCommand({
        Image: { Bytes: imageBytes },
        Attributes: ['ALL']
      }));

      const emotions: string[] = [];
      let totalAge = 0;
      const faceCount = detectResult.FaceDetails?.length || 0;

      if (detectResult.FaceDetails) {
        for (const face of detectResult.FaceDetails) {
          if (face.Emotions) {
            const dominantEmotion = face.Emotions.reduce((prev, current) => 
              (current.Confidence || 0) > (prev.Confidence || 0) ? current : prev
            );
            if (dominantEmotion.Type) {
              emotions.push(dominantEmotion.Type);
            }
          }

          if (face.AgeRange?.Low && face.AgeRange?.High) {
            totalAge += (face.AgeRange.Low + face.AgeRange.High) / 2;
          }
        }
      }

      const crowdAnalysis = {
        faceCount,
        emotions,
        averageAge: faceCount > 0 ? totalAge / faceCount : 0,
        dominantEmotion: emotions.length > 0 ? 
          emotions.reduce((a, b, i, arr) => 
            arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
          ).toLowerCase() : 'neutral'
      };

      return { matches, crowdAnalysis };

    } catch (error) {
      console.error('❌ Face recognition failed:', error);
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

  async deleteCollection(eventId: string): Promise<boolean> {
    const collectionId = `event-${eventId}`;
    
    try {
      await this.rekognitionClient.send(new DeleteCollectionCommand({
        CollectionId: collectionId
      }));
      console.log(`✅ Deleted collection: ${collectionId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete collection:', error);
      return false;
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, eventId, vipPeople, imageData } = await req.json()
    const awsService = new ServerSideAWSService()

    switch (action) {
      case 'initialize':
        console.log('🔧 Initializing AWS services...')
        
        const bucketReady = await awsService.initializeBucket()
        if (!bucketReady) {
          throw new Error('S3 bucket not accessible')
        }

        const collectionReady = await awsService.createCollection(eventId)
        if (!collectionReady) {
          throw new Error('Failed to create Rekognition collection')
        }

        const facesIndexed = await awsService.indexVIPFaces(eventId, vipPeople)
        if (!facesIndexed) {
          throw new Error('Failed to index VIP faces')
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'AWS services initialized successfully',
            vipCount: vipPeople.length 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'recognize':
        console.log('🎯 Running face recognition...')
        
        const result = await awsService.recognizeFaces(eventId, imageData)
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            matches: result.matches,
            crowdAnalysis: result.crowdAnalysis
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'cleanup':
        console.log('🧹 Cleaning up AWS resources...')
        
        const deleted = await awsService.deleteCollection(eventId)
        
        return new Response(
          JSON.stringify({ 
            success: deleted, 
            message: deleted ? 'Resources cleaned up' : 'Cleanup failed' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

  } catch (error: any) {
    console.error('❌ Edge function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})