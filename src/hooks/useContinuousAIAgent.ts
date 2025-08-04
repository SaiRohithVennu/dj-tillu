import { useState, useEffect, useRef, useCallback } from 'react';

interface Person {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
  customGreeting?: string;
}

interface ContinuousAIAgentState {
  isActive: boolean;
  isAnalyzing: boolean;
  lastAnnouncement: string;
  announcementCount: number;
  recognizedPeople: string[];
  currentActivity: string;
  error: string | null;
}

interface UseContinuousAIAgentReturn extends ContinuousAIAgentState {
  startAgent: () => void;
  stopAgent: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const useContinuousAIAgent = (
  people: Person[] = [],
  eventName: string = '',
  personality: string = 'energetic'
): UseContinuousAIAgentReturn => {
  const [state, setState] = useState<ContinuousAIAgentState>({
    isActive: false,
    isAnalyzing: false,
    lastAnnouncement: '',
    announcementCount: 0,
    recognizedPeople: [],
    currentActivity: 'Waiting to start...',
    error: null
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnnouncementTime = useRef<number>(0);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      
      setState(prev => ({ ...prev, error: null }));
    } catch (error) {
      console.error('Camera initialization failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Camera access denied. Please allow camera permissions.' 
      }));
    }
  }, []);

  // Make periodic announcements
  const makePeriodicAnnouncement = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastAnnouncement = now - lastAnnouncementTime.current;
    
    // Make announcement every 2 minutes
    if (timeSinceLastAnnouncement < 120000) return;

    try {
      setState(prev => ({ ...prev, isAnalyzing: true, currentActivity: 'Generating announcement...' }));

      const announcements = [
        `Welcome to ${eventName}! The energy in here is fantastic!`,
        "I'm loving the vibe everyone! Keep the good times rolling!",
        "This is your AI DJ speaking - hope everyone is having an amazing time!",
        "The party is in full swing! Let's keep this energy going!",
        "What an incredible crowd we have here tonight!",
        "I can feel the excitement in the room - you all are amazing!"
      ];

      const randomAnnouncement = announcements[Math.floor(Math.random() * announcements.length)];
      
      // Dispatch announcement event for voice system
      window.dispatchEvent(new CustomEvent('aiAnnouncement', {
        detail: { message: randomAnnouncement, priority: 'medium' }
      }));

      setState(prev => ({
        ...prev,
        lastAnnouncement: randomAnnouncement,
        announcementCount: prev.announcementCount + 1,
        isAnalyzing: false,
        currentActivity: 'Monitoring event...'
      }));

      lastAnnouncementTime.current = now;
    } catch (error) {
      console.error('Announcement generation failed:', error);
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false,
        currentActivity: 'Error generating announcement',
        error: 'Failed to generate announcement' 
      }));
    }
  }, [eventName]);

  // Start the AI agent
  const startAgent = useCallback(async () => {
    if (state.isActive) return;

    await initializeCamera();
    
    setState(prev => ({ 
      ...prev, 
      isActive: true, 
      currentActivity: 'Starting AI agent...',
      error: null 
    }));

    // Welcome announcement
    const welcomeMessage = `Hello everyone! Welcome to ${eventName}! I'm your AI DJ and I'm excited to be here with you all tonight!`;
    
    window.dispatchEvent(new CustomEvent('aiAnnouncement', {
      detail: { message: welcomeMessage, priority: 'high' }
    }));

    setState(prev => ({
      ...prev,
      lastAnnouncement: welcomeMessage,
      announcementCount: 1,
      currentActivity: 'AI agent active - monitoring event'
    }));

    // Start periodic announcements
    intervalRef.current = setInterval(makePeriodicAnnouncement, 30000); // Check every 30 seconds
  }, [state.isActive, initializeCamera, makePeriodicAnnouncement, eventName]);

  // Stop the AI agent
  const stopAgent = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isActive: false, 
      isAnalyzing: false,
      currentActivity: 'AI agent stopped' 
    }));

    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAgent();
    };
  }, [stopAgent]);

  // Listen for face recognition events
  useEffect(() => {
    const handleFaceRecognition = (event: CustomEvent) => {
      const { personName } = event.detail;
      
      if (!state.recognizedPeople.includes(personName)) {
        setState(prev => ({
          ...prev,
          recognizedPeople: [...prev.recognizedPeople, personName]
        }));

        // Find person details
        const person = people.find(p => p.name === personName);
        const greeting = person?.customGreeting || `Hey ${personName}! Great to see you here!`;
        
        // Announce recognition
        window.dispatchEvent(new CustomEvent('aiAnnouncement', {
          detail: { message: greeting, priority: 'high' }
        }));

        setState(prev => ({
          ...prev,
          lastAnnouncement: greeting,
          announcementCount: prev.announcementCount + 1
        }));
      }
    };

    window.addEventListener('faceRecognized', handleFaceRecognition as EventListener);
    
    return () => {
      window.removeEventListener('faceRecognized', handleFaceRecognition as EventListener);
    };
  }, [people, state.recognizedPeople]);

  return {
    ...state,
    startAgent,
    stopAgent,
    videoRef
  };
};