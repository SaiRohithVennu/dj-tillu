// Server-side AWS utilities for face recognition
// This file contains helper functions for AWS Rekognition operations

export interface AWSConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export interface FaceMatch {
  faceId: string;
  confidence: number;
  personId?: string;
  personName?: string;
  personRole?: string;
}

export interface CrowdAnalysis {
  totalFaces: number;
  averageAge?: number;
  genderDistribution?: {
    male: number;
    female: number;
  };
  emotions?: {
    happy: number;
    sad: number;
    angry: number;
    surprised: number;
    disgusted: number;
    fearful: number;
    calm: number;
  };
}

export interface VIPPerson {
  id: string;
  name: string;
  role: string;
  imageData: string; // base64 encoded image
}

// Helper function to validate AWS configuration
export const validateAWSConfig = (config: Partial<AWSConfig>): config is AWSConfig => {
  return !!(
    config.region &&
    config.accessKeyId &&
    config.secretAccessKey &&
    config.bucketName
  );
};

// Helper function to generate unique collection ID
export const generateCollectionId = (eventId: string): string => {
  return `dj-tillu-event-${eventId}-${Date.now()}`;
};

// Helper function to generate S3 key for face images
export const generateS3Key = (personId: string, eventId: string): string => {
  return `events/${eventId}/faces/${personId}.jpg`;
};

// Helper function to process face recognition results
export const processFaceResults = (
  rekognitionResults: any,
  vipPeople: VIPPerson[]
): {
  faces: FaceMatch[];
  crowdAnalysis: CrowdAnalysis;
  vipMatches: FaceMatch[];
} => {
  const faces: FaceMatch[] = [];
  const vipMatches: FaceMatch[] = [];
  
  // Process face matches
  if (rekognitionResults.FaceMatches) {
    rekognitionResults.FaceMatches.forEach((match: any) => {
      const faceMatch: FaceMatch = {
        faceId: match.Face.FaceId,
        confidence: match.Similarity,
      };
      
      // Check if this is a VIP match
      const vipPerson = vipPeople.find(person => 
        match.Face.ExternalImageId === person.id
      );
      
      if (vipPerson && match.Similarity > 75) {
        faceMatch.personId = vipPerson.id;
        faceMatch.personName = vipPerson.name;
        faceMatch.personRole = vipPerson.role;
        vipMatches.push(faceMatch);
      }
      
      faces.push(faceMatch);
    });
  }
  
  // Process crowd analysis
  const crowdAnalysis: CrowdAnalysis = {
    totalFaces: rekognitionResults.FaceDetails?.length || 0,
  };
  
  if (rekognitionResults.FaceDetails) {
    const faceDetails = rekognitionResults.FaceDetails;
    
    // Calculate average age
    const ages = faceDetails
      .filter((face: any) => face.AgeRange)
      .map((face: any) => (face.AgeRange.Low + face.AgeRange.High) / 2);
    
    if (ages.length > 0) {
      crowdAnalysis.averageAge = ages.reduce((sum: number, age: number) => sum + age, 0) / ages.length;
    }
    
    // Calculate gender distribution
    const genders = faceDetails
      .filter((face: any) => face.Gender)
      .map((face: any) => face.Gender.Value.toLowerCase());
    
    if (genders.length > 0) {
      crowdAnalysis.genderDistribution = {
        male: genders.filter(g => g === 'male').length,
        female: genders.filter(g => g === 'female').length,
      };
    }
    
    // Calculate emotion distribution
    const emotions = faceDetails
      .filter((face: any) => face.Emotions)
      .flatMap((face: any) => face.Emotions);
    
    if (emotions.length > 0) {
      const emotionCounts = emotions.reduce((acc: any, emotion: any) => {
        const type = emotion.Type.toLowerCase();
        acc[type] = (acc[type] || 0) + emotion.Confidence;
        return acc;
      }, {});
      
      crowdAnalysis.emotions = {
        happy: emotionCounts.happy || 0,
        sad: emotionCounts.sad || 0,
        angry: emotionCounts.angry || 0,
        surprised: emotionCounts.surprised || 0,
        disgusted: emotionCounts.disgusted || 0,
        fearful: emotionCounts.fearful || 0,
        calm: emotionCounts.calm || 0,
      };
    }
  }
  
  return {
    faces,
    crowdAnalysis,
    vipMatches,
  };
};

// Helper function to format recognition results for logging
export const formatRecognitionResults = (
  faces: FaceMatch[],
  crowdAnalysis: CrowdAnalysis,
  vipMatches: FaceMatch[]
): string => {
  const parts = [
    `Total faces: ${crowdAnalysis.totalFaces}`,
  ];
  
  if (crowdAnalysis.averageAge) {
    parts.push(`Average age: ${Math.round(crowdAnalysis.averageAge)}`);
  }
  
  if (crowdAnalysis.genderDistribution) {
    const { male, female } = crowdAnalysis.genderDistribution;
    parts.push(`Gender: ${male}M/${female}F`);
  }
  
  if (vipMatches.length > 0) {
    const vipNames = vipMatches.map(match => 
      `${match.personName} (${Math.round(match.confidence)}%)`
    ).join(', ');
    parts.push(`VIPs: ${vipNames}`);
  }
  
  return parts.join(' | ');
};

// Error handling utilities
export class AWSRekognitionError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AWSRekognitionError';
  }
}

export const handleAWSError = (error: any): AWSRekognitionError => {
  if (error.code === 'ResourceNotFoundException') {
    return new AWSRekognitionError(
      'Face collection not found. Please initialize the collection first.',
      error.code,
      404
    );
  }
  
  if (error.code === 'InvalidParameterException') {
    return new AWSRekognitionError(
      'Invalid parameters provided to AWS Rekognition.',
      error.code,
      400
    );
  }
  
  if (error.code === 'AccessDeniedException') {
    return new AWSRekognitionError(
      'Access denied. Please check your AWS credentials.',
      error.code,
      403
    );
  }
  
  if (error.code === 'ThrottlingException') {
    return new AWSRekognitionError(
      'AWS Rekognition rate limit exceeded. Please try again later.',
      error.code,
      429
    );
  }
  
  return new AWSRekognitionError(
    error.message || 'Unknown AWS Rekognition error',
    error.code,
    error.statusCode
  );
};