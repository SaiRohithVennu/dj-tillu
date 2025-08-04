import AWS from 'aws-sdk';

interface FaceMatch {
  confidence: number;
  personName: string;
  boundingBox: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

interface VIPPerson {
  id: string;
  name: string;
  role: string;
  imageFile?: File;
  imageUrl?: string;
}

export class AWSRekognitionService {
  private rekognition: AWS.Rekognition;
  private s3: AWS.S3;
  private bucketName: string = 'dj-tillu-faces'; // We'll create this bucket

  constructor() {
    // Initialize AWS SDK
    AWS.config.update({
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
      region: import.meta.env.VITE_AWS_REGION || 'us-west-2',
      // Add CORS configuration for browser
      httpOptions: {
        timeout: 30000,
        connectTimeout: 5000
      },
      maxRetries: 3,
      retryDelayOptions: {
        customBackoff: function(retryCount: number) {
          return Math.pow(2, retryCount) * 100;
        }
      }
    });

    this.rekognition = new AWS.Rekognition();
    this.s3 = new AWS.S3();
    
    // Log configuration for debugging
    console.log('🔧 AWS Config:', {
      region: AWS.config.region,
      hasAccessKey: !!import.meta.env.VITE_AWS_ACCESS_KEY_ID,
      hasSecretKey: !!import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
    });
  }

  // Initialize S3 bucket for storing reference images
  async initializeBucket(): Promise<boolean> {
    try {
      console.log('🔍 Checking if S3 bucket exists:', this.bucketName);
      // Check if bucket exists
      await this.s3.headBucket({ Bucket: this.bucketName }).promise();
      console.log('✅ AWS S3 bucket exists');
      return true;
    } catch (error) {
      console.log('🔧 Bucket does not exist, attempting to create...');
      try {
        // Create bucket if it doesn't exist
        const createParams: AWS.S3.CreateBucketRequest = {
          Bucket: this.bucketName,
        };
        
        // Only add LocationConstraint if not us-east-1
        if (AWS.config.region && AWS.config.region !== 'us-east-1') {
          createParams.CreateBucketConfiguration = {
            LocationConstraint: AWS.config.region as AWS.S3.BucketLocationConstraint
          };
        }
        
        await this.s3.createBucket(createParams).promise();
        console.log('✅ AWS S3 bucket created');
        return true;
      } catch (createError) {
        console.error('❌ Failed to create S3 bucket:', {
          message: createError.message,
          code: createError.code,
          statusCode: createError.statusCode,
          region: AWS.config.region,
          bucketName: this.bucketName
        });
        return false;
      }
    }
  }

  // Upload VIP person's photo to S3 for reference
  async uploadVIPPhoto(person: VIPPerson): Promise<string | null> {
    if (!person.imageFile) return null;

    try {
      const key = `vip-photos/${person.id}-${person.name.replace(/\s+/g, '-')}.jpg`;
      
      // Convert File to Buffer
      const arrayBuffer = await person.imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to S3
      await this.s3.upload({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: person.imageFile.type,
        Metadata: {
          personId: person.id,
          personName: person.name,
          personRole: person.role
        }
      }).promise();

      console.log(`✅ Uploaded VIP photo: ${person.name}`);
      return key;
    } catch (error) {
      console.error(`❌ Failed to upload VIP photo for ${person.name}:`, error);
      return null;
    }
  }

  // Create Rekognition collection for this event
  async createCollection(eventId: string): Promise<boolean> {
    const collectionId = `event-${eventId}`;
    
    try {
      await this.rekognition.createCollection({
        CollectionId: collectionId
      }).promise();
      
      console.log(`✅ Created Rekognition collection: ${collectionId}`);
      return true;
    } catch (error: any) {
      if (error.code === 'ResourceAlreadyExistsException') {
        console.log(`✅ Rekognition collection already exists: ${collectionId}`);
        return true;
      }
      console.error('❌ Failed to create collection:', error);
      return false;
    }
  }

  // Index VIP faces in the collection
  async indexVIPFaces(eventId: string, vipPeople: VIPPerson[]): Promise<boolean> {
    const collectionId = `event-${eventId}`;
    
    try {
      for (const person of vipPeople) {
        if (!person.imageFile) continue;

        // Upload photo to S3 first
        const s3Key = await this.uploadVIPPhoto(person);
        if (!s3Key) continue;

        // Index face in Rekognition
        const result = await this.rekognition.indexFaces({
          CollectionId: collectionId,
          Image: {
            S3Object: {
              Bucket: this.bucketName,
              Name: s3Key
            }
          },
          ExternalImageId: person.id,
          DetectionAttributes: ['ALL']
        }).promise();

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

  // Recognize faces in camera frame
  async recognizeFaces(eventId: string, videoElement: HTMLVideoElement): Promise<FaceMatch[]> {
    const collectionId = `event-${eventId}`;
    
    try {
      // Capture frame from video
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
      });

      // Convert blob to buffer
      const arrayBuffer = await blob.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);

      // Search faces in Rekognition collection
      const result = await this.rekognition.searchFacesByImage({
        CollectionId: collectionId,
        Image: {
          Bytes: imageBuffer
        },
        FaceMatchThreshold: 70, // 70% confidence threshold
        MaxFaces: 10
      }).promise();

      const matches: FaceMatch[] = [];

      if (result.FaceMatches) {
        for (const match of result.FaceMatches) {
          if (match.Face && match.Face.ExternalImageId && match.Similarity) {
            // Get person details from external image ID
            const personId = match.Face.ExternalImageId;
            
            matches.push({
              confidence: match.Similarity,
              personName: personId, // We'll map this to actual name later
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

      return matches;
    } catch (error) {
      console.error('❌ Face recognition failed:', error);
      return [];
    }
  }

  // Detect faces and emotions (without recognition)
  async detectFacesAndEmotions(videoElement: HTMLVideoElement): Promise<{
    faceCount: number;
    emotions: string[];
    averageAge: number;
    genders: string[];
  }> {
    try {
      // Capture frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
      });

      const arrayBuffer = await blob.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);

      // Detect faces with attributes
      const result = await this.rekognition.detectFaces({
        Image: {
          Bytes: imageBuffer
        },
        Attributes: ['ALL']
      }).promise();

      const emotions: string[] = [];
      const genders: string[] = [];
      let totalAge = 0;
      const faceCount = result.FaceDetails?.length || 0;

      if (result.FaceDetails) {
        for (const face of result.FaceDetails) {
          // Get dominant emotion
          if (face.Emotions) {
            const dominantEmotion = face.Emotions.reduce((prev, current) => 
              (current.Confidence || 0) > (prev.Confidence || 0) ? current : prev
            );
            if (dominantEmotion.Type) {
              emotions.push(dominantEmotion.Type);
            }
          }

          // Get gender
          if (face.Gender?.Value) {
            genders.push(face.Gender.Value);
          }

          // Get age
          if (face.AgeRange?.Low && face.AgeRange?.High) {
            totalAge += (face.AgeRange.Low + face.AgeRange.High) / 2;
          }
        }
      }

      return {
        faceCount,
        emotions,
        averageAge: faceCount > 0 ? totalAge / faceCount : 0,
        genders
      };
    } catch (error) {
      console.error('❌ Face detection failed:', error);
      return {
        faceCount: 0,
        emotions: [],
        averageAge: 0,
        genders: []
      };
    }
  }

  // Clean up collection after event
  async deleteCollection(eventId: string): Promise<boolean> {
    const collectionId = `event-${eventId}`;
    
    try {
      await this.rekognition.deleteCollection({
        CollectionId: collectionId
      }).promise();
      
      console.log(`✅ Deleted Rekognition collection: ${collectionId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete collection:', error);
      return false;
    }
  }
}

export const awsRekognition = new AWSRekognitionService();