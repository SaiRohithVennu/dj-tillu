import { useState, useEffect, useRef } from 'react';
import { Track } from '../data/tracks';

interface EventSetup {
  eventName: string;
  eventType: 'birthday' | 'corporate' | 'wedding' | 'party' | 'conference';
  duration: number;
  vipPeople: Array<{
    id: string;
    name: string;
    role: string;
    imageFile?: File;
    imageUrl?: string;
    greeting?: string;
  }>;
  aiPersonality: 'humorous' | 'formal' | 'energetic' | 'professional';
  specialMoments: string[];
}

interface UseSmartEventEmceeProps {
  tracks: Track[];
  videoElement: HTMLVideoElement | null;
  eventSetup: EventSetup;
  onTrackChange: (track: Track) => void;
  onAnnouncement: (message: string) => void;
  isPlaying: boolean;
  currentTrack: Track | null;
}

export const useSmartEventEmcee = ({
  tracks,
  videoElement,
  eventSetup,
  onTrackChange,
  onAnnouncement,
  isPlaying,
  currentTrack
}: UseSmartEventEmceeProps) => {
  const [isEventActive, setIsEventActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>('preparation');
  const [recognizedVIPs, setRecognizedVIPs] = useState<any[]>([]);
  const [eventStartTime, setEventStartTime] = useState<Date | null>(null);
  const [lastAnnouncement, setLastAnnouncement] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout>();

  // Start the smart event
  const startEvent = () => {
    setIsEventActive(true);
    setEventStartTime(new Date());
    setCurrentPhase('opening');
    
    // Welcome announcement
    const welcomeMessage = generateWelcomeMessage();
    onAnnouncement(welcomeMessage);
    setLastAnnouncement(new Date());
    
    console.log('🎪 Smart Event Emcee started:', eventSetup.eventName);
  };

  // Stop the event
  const stopEvent = () => {
    setIsEventActive(false);
    setCurrentPhase('ended');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    console.log('🎪 Smart Event Emcee stopped');
  };

  // Generate welcome message based on event type and personality
  const generateWelcomeMessage = (): string => {
    const { eventName, eventType, aiPersonality } = eventSetup;
    
    const welcomeMessages = {
      humorous: {
        birthday: `🎂 Hold onto your party hats! Welcome to ${eventName}! Let's make this birthday legendary!`,
        corporate: `📈 Welcome to ${eventName}! Don't worry, this meeting will actually be fun! Let's get started!`,
        wedding: `💒 Love is in the air! Welcome to ${eventName}! Tissues are available at the back!`,
        party: `🎉 Party people! Welcome to ${eventName}! Let's turn this place upside down!`,
        conference: `🎤 Welcome to ${eventName}! Prepare for knowledge bombs and hopefully no boring PowerPoints!`
      },
      formal: {
        birthday: `🎉 Ladies and gentlemen, welcome to ${eventName}. We are gathered to celebrate this special day.`,
        corporate: `🏢 Welcome to ${eventName}. Thank you for joining us for this important gathering.`,
        wedding: `💒 Welcome to ${eventName}. We are here to celebrate the union of two hearts.`,
        party: `🎊 Welcome to ${eventName}. We are delighted to have you join our celebration.`,
        conference: `🎤 Welcome to ${eventName}. We look forward to an enlightening and productive session.`
      },
      energetic: {
        birthday: `🎂 BIRTHDAY CELEBRATION TIME! Welcome to ${eventName}! Let's make some NOISE!`,
        corporate: `🚀 Welcome to ${eventName}! Time to show what TEAMWORK looks like! Let's GO!`,
        wedding: `💒 LOVE IS HERE! Welcome to ${eventName}! This is going to be AMAZING!`,
        party: `🎉 PARTY TIME! Welcome to ${eventName}! Are you ready to have the TIME OF YOUR LIFE?!`,
        conference: `🎤 Welcome to ${eventName}! Get ready for some INCREDIBLE insights! Let's DO THIS!`
      },
      professional: {
        birthday: `🎂 Welcome to ${eventName}. We are pleased to celebrate this special occasion with you.`,
        corporate: `🏢 Welcome to ${eventName}. Thank you for your participation in today's proceedings.`,
        wedding: `💒 Welcome to ${eventName}. We are honored to witness this joyous celebration.`,
        party: `🎊 Welcome to ${eventName}. We appreciate your presence at this gathering.`,
        conference: `🎤 Welcome to ${eventName}. We are excited to share valuable insights with you today.`
      }
    };

    return welcomeMessages[aiPersonality][eventType] || `Welcome to ${eventName}!`;
  };

  // Handle VIP recognition
  const handleVIPRecognized = (vip: any) => {
    if (!isEventActive) return;

    // Check if this VIP was recently announced (avoid spam)
    const recentlyAnnounced = recognizedVIPs.find(r => 
      r.id === vip.id && 
      r.lastAnnouncement && 
      (Date.now() - r.lastAnnouncement.getTime()) < 300000 // 5 minutes
    );

    if (recentlyAnnounced) {
      console.log(`🎯 VIP ${vip.name} recently announced, skipping`);
      return;
    }

    // Generate personalized greeting
    const greeting = vip.greeting || generateDefaultGreeting(vip);
    
    // Announce after a brief delay
    setTimeout(() => {
      onAnnouncement(greeting);
      setLastAnnouncement(new Date());
    }, 2000);

    // Update recognized VIPs
    setRecognizedVIPs(prev => {
      const updated = prev.filter(r => r.id !== vip.id);
      return [...updated, { ...vip, lastAnnouncement: new Date() }];
    });

    console.log(`🌟 VIP announced: ${vip.name} (${vip.role})`);
  };

  // Generate default greeting based on role and personality
  const generateDefaultGreeting = (vip: any): string => {
    const { aiPersonality } = eventSetup;
    
    const greetings = {
      humorous: {
        CEO: `📈 Alert! Alert! The big boss ${vip.name} is in the building! Everyone look busy! Just kidding - welcome!`,
        Manager: `👔 The manager ${vip.name} has entered! Everyone pretend you've been working hard! Welcome!`,
        default: `⭐ VIP alert! ${vip.name} has graced us with their presence! Let's show them some love!`
      },
      formal: {
        CEO: `🏢 It is my honor to welcome our esteemed CEO, ${vip.name}. Please join me in extending a warm welcome.`,
        Manager: `👔 We are honored to welcome our manager, ${vip.name}. Thank you for your leadership.`,
        default: `✨ Please join me in welcoming our distinguished guest, ${vip.name}.`
      },
      energetic: {
        CEO: `🚀 THE BOSS IS HERE! Give it up for ${vip.name}! Let's show them what ENERGY looks like!`,
        Manager: `👔 MANAGER ON DECK! ${vip.name} is HERE! Time to show them what TEAMWORK looks like!`,
        default: `⭐ VIP IN THE HOUSE! ${vip.name} is HERE and we are PUMPED! Let's make some NOISE!`
      },
      professional: {
        CEO: `🏢 We welcome our Chief Executive Officer, ${vip.name}. Thank you for joining us today.`,
        Manager: `👔 We are pleased to welcome our manager, ${vip.name}. Thank you for your continued leadership.`,
        default: `✨ We are honored to have ${vip.name} with us today. Please join me in welcoming them.`
      }
    };

    const personalityGreetings = greetings[aiPersonality];
    return personalityGreetings[vip.role] || personalityGreetings.default;
  };

  // Event phase management
  useEffect(() => {
    if (!isEventActive || !eventStartTime) return;

    const updatePhase = () => {
      const elapsed = Date.now() - eventStartTime.getTime();
      const elapsedMinutes = elapsed / (1000 * 60);
      const totalDuration = eventSetup.duration * 60; // Convert hours to minutes

      if (elapsedMinutes < 5) {
        setCurrentPhase('opening');
      } else if (elapsedMinutes < totalDuration * 0.3) {
        setCurrentPhase('early');
      } else if (elapsedMinutes < totalDuration * 0.7) {
        setCurrentPhase('main');
      } else if (elapsedMinutes < totalDuration * 0.9) {
        setCurrentPhase('late');
      } else {
        setCurrentPhase('closing');
      }
    };

    // Update phase every minute
    intervalRef.current = setInterval(updatePhase, 60000);
    updatePhase(); // Initial update

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isEventActive, eventStartTime, eventSetup.duration]);

  return {
    isEventActive,
    currentPhase,
    recognizedVIPs,
    eventStartTime,
    lastAnnouncement,
    startEvent,
    stopEvent,
    handleVIPRecognized
  };
};