import { useState, useCallback } from 'react';
import { ServerSideAWSService } from '../utils/serverSideAWS';

interface UseServerSideAWSFaceRecognitionReturn {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  recognizeFace: (imageData: string) => Promise<any>;
  addFace: (imageData: string, personId: string, personName: string) => Promise<void>;
}

export const useServerSideAWSFaceRecognition = (): UseServerSideAWSFaceRecognitionReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    if (isInitialized) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const awsService = new ServerSideAWSService();
      await awsService.initializeEvent({
        eventId: 'default-event',
        eventName: 'DJ Tillu Event',
        collectionId: 'dj-tillu-faces'
      });
      
      setIsInitialized(true);
      console.log('✅ Server-side AWS Face Recognition initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to initialize AWS services: ${errorMessage}`);
      console.error('❌ Server-side AWS initialization failed:', errorMessage);
      
      // For development, we'll still mark as initialized to allow mock functionality
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  const recognizeFace = useCallback(async (imageData: string) => {
    if (!isInitialized) {
      throw new Error('AWS Face Recognition not initialized');
    }
    
    try {
      const awsService = new ServerSideAWSService();
      return await awsService.recognizeFace(imageData);
    } catch (err) {
      console.error('Face recognition error:', err);
      throw err;
    }
  }, [isInitialized]);

  const addFace = useCallback(async (imageData: string, personId: string, personName: string) => {
    if (!isInitialized) {
      throw new Error('AWS Face Recognition not initialized');
    }
    
    try {
      const awsService = new ServerSideAWSService();
      await awsService.addFace(imageData, personId, personName);
    } catch (err) {
      console.error('Add face error:', err);
      throw err;
    }
  }, [isInitialized]);

  return {
    isInitialized,
    isLoading,
    error,
    initialize,
    recognizeFace,
    addFace
  };
};