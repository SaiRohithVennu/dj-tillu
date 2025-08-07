import { useState, useRef, useCallback } from 'react';

export interface VIPPerson {
  id: string;
  name: string;
  role?: string;
  preferences?: string[];
}

export interface EventDetails {
  id: string;
  name: string;
  type: string;
  vipPeople: VIPPerson[];
  musicPreferences: string[];
  specialRequests: string[];
}

export interface UseOpenAIEventHostProps {
  eventDetails: EventDetails;
  onVIPRecognized?: (person: VIPPerson) => void;
  onAnnouncementGenerated?: (announcement: string) => void;
}

export interface UseOpenAIEventHostReturn {
  isGenerating: boolean;
  lastAnnouncement: string | null;
  generateVIPAnnouncement: (person: VIPPerson) => Promise<void>;
  generateEventUpdate: (context: string) => Promise<void>;
  generateMusicTransition: (fromTrack: string, toTrack: string) => Promise<void>;
  handleImmediateVIPAnnouncement: (person: VIPPerson) => Promise<void>;
}

export function useOpenAIEventHost({
  eventDetails,
  onVIPRecognized,
  onAnnouncementGenerated
}: UseOpenAIEventHostProps): UseOpenAIEventHostReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastAnnouncement, setLastAnnouncement] = useState<string | null>(null);
  const lastVIPAnnouncementsRef = useRef<Map<string, number>>(new Map());

  const generateVIPAnnouncement = useCallback(async (person: VIPPerson) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      // Check if we've announced this person recently (within 10 minutes)
      const lastAnnouncement = lastVIPAnnouncementsRef.current.get(person.id);
      const now = Date.now();
      if (lastAnnouncement && (now - lastAnnouncement) < 10 * 60 * 1000) {
        return;
      }

      const prompt = `Generate a warm, professional announcement for ${person.name} arriving at ${eventDetails.name}. 
      Event type: ${eventDetails.type}
      Person's role: ${person.role || 'VIP guest'}
      Keep it brief, welcoming, and appropriate for the event atmosphere.`;

      // Simulate API call (replace with actual OpenAI API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const announcement = `Ladies and gentlemen, please join me in welcoming ${person.name} to ${eventDetails.name}!`;
      
      setLastAnnouncement(announcement);
      lastVIPAnnouncementsRef.current.set(person.id, now);
      
      onAnnouncementGenerated?.(announcement);
      onVIPRecognized?.(person);
      
    } catch (error) {
      console.error('Error generating VIP announcement:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [eventDetails, isGenerating, onVIPRecognized, onAnnouncementGenerated]);

  const generateEventUpdate = useCallback(async (context: string) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      const prompt = `Generate a brief event update announcement for ${eventDetails.name}.
      Context: ${context}
      Event type: ${eventDetails.type}
      Keep it engaging and informative.`;

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const announcement = `Thank you all for being part of ${eventDetails.name}. ${context}`;
      
      setLastAnnouncement(announcement);
      onAnnouncementGenerated?.(announcement);
      
    } catch (error) {
      console.error('Error generating event update:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [eventDetails, isGenerating, onAnnouncementGenerated]);

  const generateMusicTransition = useCallback(async (fromTrack: string, toTrack: string) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      const prompt = `Generate a smooth DJ transition announcement from "${fromTrack}" to "${toTrack}".
      Event: ${eventDetails.name}
      Keep it brief and energetic.`;

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const announcement = `Coming up next, we have "${toTrack}" - let's keep the energy flowing!`;
      
      setLastAnnouncement(announcement);
      onAnnouncementGenerated?.(announcement);
      
    } catch (error) {
      console.error('Error generating music transition:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [eventDetails, isGenerating, onAnnouncementGenerated]);

  const handleImmediateVIPAnnouncement = useCallback(async (person: VIPPerson) => {
    // Force immediate announcement regardless of recent announcements
    lastVIPAnnouncementsRef.current.delete(person.id);
    await generateVIPAnnouncement(person);
  }, [generateVIPAnnouncement]);

  return {
    isGenerating,
    lastAnnouncement,
    generateVIPAnnouncement,
    generateEventUpdate,
    generateMusicTransition,
    handleImmediateVIPAnnouncement
  };
}