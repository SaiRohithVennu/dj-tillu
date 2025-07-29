import { useState, useEffect, useRef } from 'react';
import { Track } from '../data/tracks';

interface EventDetails {
  id: string;
  name: string;
  type: 'wedding' | 'birthday' | 'corporate' | 'party' | 'festival' | 'club';
  startTime: string;
  endTime: string;
  expectedAttendees: number;
  venue: string;
  specialMoments: SpecialMoment[];
  vipGuests: VIPGuest[];
  musicPreferences: string[];
  eventFlow: EventFlowItem[];
}

interface SpecialMoment {
  id: string;
  time: string;
  type: 'entrance' | 'speech' | 'cake_cutting' | 'first_dance' | 'toast' | 'surprise';
  description: string;
  musicCue?: string;
  announcementTemplate?: string;
  triggered?: boolean;
}

interface VIPGuest {
  id: string;
  name: string;
  role: string;
  faceImageUrl?: string;
  personalizedGreeting?: string;
  recognitionCount: number;
  lastSeen?: Date;
}

interface EventFlowItem {
  id: string;
  time: string;
  phase: 'arrival' | 'cocktail' | 'dinner' | 'dancing' | 'closing';
  energyTarget: number;
  musicStyle: string;
  duration: number;
  active?: boolean;
}

interface UseSmartEventDJProps {
  tracks: Track[];
  currentMood: string;
  energy: number;
  crowdSize: number;
  onTrackChange: (track: Track) => void;
  onAnnouncement: (message: string) => void;
  isPlaying: boolean;
  currentTrack: Track | null;
}

export const useSmartEventDJ = ({
  tracks,
  currentMood,
  energy,
  crowdSize,
  onTrackChange,
  onAnnouncement,
  isPlaying,
  currentTrack
}: UseSmartEventDJProps) => {
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<EventFlowItem | null>(null);
  const [triggeredMoments, setTriggeredMoments] = useState<Set<string>>(new Set());
  const [recognizedVIPs, setRecognizedVIPs] = useState<VIPGuest[]>([]);
  const [eventStarted, setEventStarted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Initialize event
  const initializeEvent = (event: EventDetails) => {
    setEventDetails(event);
    setEventStarted(false);
    setTriggeredMoments(new Set());
    setRecognizedVIPs(event.vipGuests.map(vip => ({ ...vip, recognitionCount: 0 })));
    console.log('🎪 Smart Event DJ initialized:', event.name);
  };

  // Start event
  const startEvent = () => {
    if (!eventDetails) return;
    
    setEventStarted(true);
    setIsActive(true);
    
    const welcomeMessage = generateWelcomeAnnouncement();
    onAnnouncement(welcomeMessage);
    
    console.log('🎉 Event started:', eventDetails.name);
  };

  // Generate context-aware announcements
  const generateWelcomeAnnouncement = (): string => {
    if (!eventDetails) return "Welcome to this amazing event!";
    
    const eventTypeMessages = {
      wedding: `Welcome to ${eventDetails.name}! Love is in the air and we're here to celebrate!`,
      birthday: `Happy birthday celebration for ${eventDetails.name}! Let's make this day unforgettable!`,
      corporate: `Welcome to ${eventDetails.name}! Thank you for joining us at this special corporate gathering!`,
      party: `Welcome to ${eventDetails.name}! Get ready for an incredible party experience!`,
      festival: `Welcome to ${eventDetails.name} festival! The energy is electric and the music is about to begin!`,
      club: `Welcome to ${eventDetails.name}! The night is young and the beats are calling!`
    };
    
    return eventTypeMessages[eventDetails.type] || `Welcome to ${eventDetails.name}!`;
  };

  const generateVIPAnnouncement = (vip: VIPGuest): string => {
    if (vip.personalizedGreeting) {
      return vip.personalizedGreeting;
    }
    
    const roleMessages = {
      bride: `Ladies and gentlemen, please welcome our beautiful bride, ${vip.name}!`,
      groom: `Everyone, let's give a warm welcome to our handsome groom, ${vip.name}!`,
      birthday_person: `The star of the show has arrived! Happy birthday to ${vip.name}!`,
      ceo: `Please join me in welcoming our CEO, ${vip.name}!`,
      guest_of_honor: `We have a very special guest with us tonight - ${vip.name}!`,
      speaker: `Our distinguished speaker ${vip.name} has joined us!`
    };
    
    return roleMessages[vip.role as keyof typeof roleMessages] || 
           `Please welcome our special guest, ${vip.name}!`;
  };

  const generateMomentAnnouncement = (moment: SpecialMoment): string => {
    if (moment.announcementTemplate) {
      return moment.announcementTemplate;
    }
    
    const momentMessages = {
      entrance: `It's time for the grand entrance! Everyone please welcome our special guests!`,
      speech: `Ladies and gentlemen, we have a special speech coming up. Please give your attention!`,
      cake_cutting: `It's time for the moment we've all been waiting for - the cake cutting ceremony!`,
      first_dance: `Now for a very special moment - the first dance!`,
      toast: `Please raise your glasses for a special toast!`,
      surprise: `We have a wonderful surprise for everyone! Get ready!`
    };
    
    return momentMessages[moment.type] || `It's time for ${moment.description}!`;
  };

  // Handle VIP recognition
  const handleVIPRecognized = (vip: VIPGuest) => {
    if (!isActive || !eventDetails) return;
    
    // Update recognized VIPs
    setRecognizedVIPs(prev => 
      prev.map(v => v.id === vip.id ? vip : v)
    );
    
    // Only announce if this is a new recognition (first time or after a long gap)
    const shouldAnnounce = vip.recognitionCount === 1 || 
                          (vip.lastSeen && Date.now() - vip.lastSeen.getTime() > 300000); // 5 minutes
    
    if (shouldAnnounce) {
      const announcement = generateVIPAnnouncement(vip);
      setTimeout(() => {
        onAnnouncement(announcement);
      }, 2000); // Delay to avoid interrupting current music
      
      console.log(`🌟 VIP announced: ${vip.name}`);
    }
  };

  // Check for scheduled moments
  const checkScheduledMoments = () => {
    if (!eventDetails || !eventStarted) return;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    eventDetails.specialMoments.forEach(moment => {
      if (moment.time === currentTime && !triggeredMoments.has(moment.id)) {
        // Trigger special moment
        setTriggeredMoments(prev => new Set([...prev, moment.id]));
        
        // Play announcement
        const announcement = generateMomentAnnouncement(moment);
        onAnnouncement(announcement);
        
        // Change music if specified
        if (moment.musicCue) {
          const cueTrack = tracks.find(track => 
            track.title.toLowerCase().includes(moment.musicCue!.toLowerCase()) ||
            track.artist.toLowerCase().includes(moment.musicCue!.toLowerCase())
          );
          
          if (cueTrack) {
            setTimeout(() => {
              onTrackChange(cueTrack);
            }, 5000); // Wait for announcement to finish
          }
        }
        
        console.log(`⏰ Special moment triggered: ${moment.description}`);
      }
    });
  };

  // Update current phase based on time
  const updateCurrentPhase = () => {
    if (!eventDetails || !eventStarted) return;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const activePhase = eventDetails.eventFlow.find(phase => {
      const phaseTime = new Date(`2000-01-01T${phase.time}`);
      const currentTimeObj = new Date(`2000-01-01T${currentTime}`);
      const phaseEndTime = new Date(phaseTime.getTime() + (phase.duration * 60000));
      
      return currentTimeObj >= phaseTime && currentTimeObj <= phaseEndTime;
    });
    
    if (activePhase && (!currentPhase || currentPhase.id !== activePhase.id)) {
      setCurrentPhase(activePhase);
      
      // Adjust music based on phase
      const phaseTrack = selectTrackForPhase(activePhase);
      if (phaseTrack && phaseTrack.id !== currentTrack?.id) {
        onTrackChange(phaseTrack);
      }
      
      console.log(`📅 Phase changed to: ${activePhase.phase} (${activePhase.musicStyle})`);
    }
  };

  // Select track based on event phase
  const selectTrackForPhase = (phase: EventFlowItem): Track | null => {
    let suitableTracks = tracks.filter(track => {
      // Filter by music preferences
      const matchesPreferences = eventDetails?.musicPreferences.some(pref => 
        track.genre.toLowerCase().includes(pref.toLowerCase())
      ) || false;
      
      // Filter by energy level
      const energyMatch = Math.abs(track.bpm - (phase.energyTarget * 15 + 60)) < 30;
      
      // Filter by phase style
      const styleMatch = track.genre.toLowerCase().includes(phase.musicStyle.toLowerCase()) ||
                        track.title.toLowerCase().includes(phase.musicStyle.toLowerCase());
      
      return matchesPreferences || energyMatch || styleMatch;
    });
    
    if (suitableTracks.length === 0) {
      suitableTracks = tracks;
    }
    
    // Exclude current track
    if (currentTrack) {
      suitableTracks = suitableTracks.filter(track => track.id !== currentTrack.id);
    }
    
    return suitableTracks.length > 0 
      ? suitableTracks[Math.floor(Math.random() * suitableTracks.length)]
      : null;
  };

  // Main event loop
  useEffect(() => {
    if (!isActive || !eventDetails) return;
    
    const runEventLoop = () => {
      checkScheduledMoments();
      updateCurrentPhase();
    };
    
    // Run every minute
    intervalRef.current = setInterval(runEventLoop, 60000);
    
    // Run immediately
    runEventLoop();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, eventDetails, eventStarted, currentTrack]);

  const stopEvent = () => {
    setIsActive(false);
    setEventStarted(false);
    setCurrentPhase(null);
    console.log('🛑 Event stopped');
  };

  const getEventStatus = () => {
    if (!eventDetails) return 'No event configured';
    if (!eventStarted) return 'Event ready to start';
    if (!isActive) return 'Event paused';
    return currentPhase ? `Active: ${currentPhase.phase}` : 'Event running';
  };

  const getUpcomingMoments = () => {
    if (!eventDetails) return [];
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return eventDetails.specialMoments
      .filter(moment => moment.time > currentTime && !triggeredMoments.has(moment.id))
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(0, 3);
  };

  return {
    eventDetails,
    isActive,
    eventStarted,
    currentPhase,
    recognizedVIPs,
    initializeEvent,
    startEvent,
    stopEvent,
    handleVIPRecognized,
    getEventStatus,
    getUpcomingMoments,
    triggeredMoments: Array.from(triggeredMoments)
  };
};