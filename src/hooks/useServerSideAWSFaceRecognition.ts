import { useState, useEffect } from 'react';
import { ServerSideAWSService } from '../utils/serverSideAWS';

interface EventDetails {
  eventName: string;
  eventType: string;
  vipGuests: Array<{
    name: string;
    role: string;
    imageUrl?: string;
  }>;
}

export const useServerSideAWSFaceRecognition = (eventDetails: EventDetails | null) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognizedFaces, setRecognizedFaces] = useState<Array<{
    name: string;
    confidence: number;
    timestamp: Date;
  }>>([]);

  const initialize = async () => {
    if (!eventDetails) {
      setError('Event details are required for initialization');
      return;
    }

    try {
      setError(null);
      console.log('🔄 Initializing server-side AWS face recognition...');
      
      await ServerSideAWSService.initializeEvent(eventDetails);
      setIsInitialized(true);
      console.log('✅ Server-side AWS face recognition initialized successfully');
      
      // Show success notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('AWS Face Recognition Ready', {
          body: 'VIP guest recognition is now active',
          icon: '/favicon.ico'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Server-side AWS initialization failed:', errorMessage);
      setError(`AWS initialization failed: ${errorMessage}`);
      
      // Show user-friendly notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Face Recognition Unavailable', {
          body: 'Event will continue without VIP recognition features',
          icon: '/favicon.ico'
        });
      }
    }
  };

  const processImage = async (imageData: string) => {
    if (!isInitialized) {
      console.warn('AWS service not initialized');
      return null;
    }

    try {
      setIsProcessing(true);
      setError(null);
      
      const result = await ServerSideAWSService.recognizeFaces(imageData);
      
      if (result && result.length > 0) {
        const newRecognitions = result.map(face => ({
          name: face.name,
          confidence: face.confidence,
          timestamp: new Date()
        }));
        
        setRecognizedFaces(prev => [...prev, ...newRecognitions]);
        return result;
      }
      
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Face recognition failed';
      console.error('❌ Face recognition error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const clearRecognitions = () => {
    setRecognizedFaces([]);
  };

  useEffect(() => {
    if (eventDetails && !isInitialized && !error) {
      initialize();
    }
  }, [eventDetails, isInitialized, error]);

  return {
    isInitialized,
    isProcessing,
    error,
    recognizedFaces,
    processImage,
    clearRecognitions,
    reinitialize: initialize
  };
};