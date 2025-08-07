import { useState, useEffect, useRef } from 'react';
import { Track } from '../data/tracks';

interface EventSetup {
  eventName: string;
  eventType: 'birthday' | 'corporate' | 'wedding' | 'party' | 'conference';
  duration: number;
  vipPeople: VIPPerson[];
  aiPersonality: 'humorous' | 'formal' | 'energetic' | 'professional';
}

interface VIPPerson {
  id: string;
  name: string;
  role: string;
  imageFile?: File;
  imageUrl?: string;
  recognitionCount: number;
  lastSeen?: Date;
}

interface SpecialMoment {
  id: string;
  time: string;
  type: 'entrance' | 'speech' | 'cake_cutting' | 'first_dance' | 'toast' | 'surprise';
  description: string;
  musicCue?: string;
  announcementTemplate?: string;
}

interface UseSmartEventEmceeProps {
  eventSetup: EventSetup | null;
  currentTrack: Track | null;
  currentMood: string;
  energy: number;
  crowdSize: number;
  recognizedVIPs: VIPPerson[];
  onAnnouncement: (message: string) => void;
  onTrackChange: (track: Track) => void;
}

export const useSmartEventEmcee = ({
  eventSetup,
  currentTrack,
  currentMood,
  energy,
  crowdSize,
  recognizedVIPs,
  onAnnouncement,
  onTrackChange
}: UseSmartEventEmceeProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [lastAnnouncement, setLastAnnouncement] = useState<string | null>(null);
  const [eventStartTime, setEventStartTime] = useState<Date | null>(null);
  const [triggeredMoments, setTriggeredMoments] = useState<Set<string>>(new Set());
  const [lastVIPAnnouncements, setLastVIPAnnouncements] = useState<Map<string, number>>(new Map());
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastMoodRef = useRef<string>('');
  const lastEnergyRef = useRef<number>(0);

  // Start event hosting
  const startEvent = () => {
    if (!eventSetup) return;
    
    setIsActive(true);
    setEventStartTime(new Date());
    
    const welcomeMessage = generateWelcomeMessage();
    makeAnnouncement(welcomeMessage);
    
    console.log('🎪 Smart Event Emcee started:', eventSetup.eventName);
  };

  // Stop event hosting
  const stopEvent = () => {
    setIsActive(false);
    setEventStartTime(null);
    setTriggeredMoments(new Set());
    setLastVIPAnnouncements(new Map());
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    console.log('🛑 Smart Event Emcee stopped');
  };

  // Generate welcome message based on event type
  const generateWelcomeMessage = (): string => {
    if (!eventSetup) return "Welcome to this amazing event!";
    
    const eventTypeMessages = {
      birthday: `Welcome to ${eventSetup.eventName}! Let's celebrate this special day with amazing music and great vibes!`,
      corporate: `Welcome to ${eventSetup.eventName}! Thank you for joining us at this important gathering. Let's make it memorable!`,
      wedding: `Welcome to ${eventSetup.eventName}! Love is in the air and we're here to celebrate this beautiful union!`,
      party: `Welcome to ${eventSetup.eventName}! Get ready for an incredible party experience with non-stop music and fun!`,
      conference: `Welcome to ${eventSetup.eventName}! We're excited to have you here for this important conference.`
    };
    
    return eventTypeMessages[eventSetup.eventType] || `Welcome to ${eventSetup.eventName}!`;
  };

  // Make announcement with voice synthesis
  const makeAnnouncement = (message: string) => {
    setIsAnnouncing(true);
    setLastAnnouncement(message);
    onAnnouncement(message);
    
    // Reset announcing state after estimated speech duration
    const estimatedDuration = message.length * 100; // ~100ms per character
    setTimeout(() => {
      setIsAnnouncing(false);
    }, Math.max(3000, estimatedDuration));
    
    console.log('📢 Announcement:', message);
  };

  // Perform smart analysis of current situation
  const performSmartAnalysis = () => {
    if (!eventSetup || !isActive) return;
    
    const currentTime = new Date();
    const eventDuration = eventStartTime 
      ? Math.floor((currentTime.getTime() - eventStartTime.getTime()) / 1000 / 60)
      : 0;

    // Check for mood changes
    if (currentMood !== lastMoodRef.current && lastMoodRef.current !== '') {
      const moodChangeMessage = generateMoodChangeAnnouncement(lastMoodRef.current, currentMood);
      if (moodChangeMessage) {
        makeAnnouncement(moodChangeMessage);
      }
    }

    // Check for energy level changes
    const energyDiff = Math.abs(energy - lastEnergyRef.current);
    if (energyDiff > 20 && lastEnergyRef.current > 0) {
      const energyMessage = generateEnergyChangeAnnouncement(energy, lastEnergyRef.current);
      if (energyMessage) {
        makeAnnouncement(energyMessage);
      }
    }

    // Update references
    lastMoodRef.current = currentMood;
    lastEnergyRef.current = energy;
  };

  // Generate mood change announcement
  const generateMoodChangeAnnouncement = (oldMood: string, newMood: string): string | null => {
    if (!eventSetup) return null;
    
    const personalityStyle = eventSetup.aiPersonality;
    
    const moodMessages = {
      humorous: {
        'chill_to_energetic': "Whoa! I see the energy just went from zero to hero! Time to turn up the heat!",
        'energetic_to_chill': "Okay, okay, let's bring it down a notch. Chill vibes incoming!",
        'happy_to_excited': "The happiness just leveled up to pure excitement! I love it!",
        'default': `The vibe just shifted from ${oldMood} to ${newMood}! Rolling with it!`
      },
      formal: {
        'chill_to_energetic': "I observe a delightful increase in energy. Adjusting our musical selection accordingly.",
        'energetic_to_chill': "The atmosphere is becoming more relaxed. Perfect time for some mellower selections.",
        'happy_to_excited': "The joy in the room has intensified beautifully. What a wonderful sight!",
        'default': `The mood has gracefully transitioned to ${newMood}. Adapting our experience accordingly.`
      },
      energetic: {
        'chill_to_energetic': "YES! NOW WE'RE TALKING! The energy just EXPLODED! Let's GO!",
        'energetic_to_chill': "Alright, time to cool down and catch our breath! Smooth vibes coming up!",
        'happy_to_excited': "HAPPINESS OVERLOAD! This is what I'm talking about! PUMP IT UP!",
        'default': `MOOD SHIFT DETECTED! From ${oldMood} to ${newMood}! ADAPTING THE BEATS!`
      },
      professional: {
        'chill_to_energetic': "Excellent! The energy level has increased significantly. Adjusting music selection.",
        'energetic_to_chill': "The pace is moderating nicely. Transitioning to more relaxed selections.",
        'happy_to_excited': "Wonderful to see the excitement building. Enhancing the musical experience.",
        'default': `Mood transition detected: ${oldMood} to ${newMood}. Optimizing playlist accordingly.`
      }
    };

    const moodKey = `${oldMood}_to_${newMood}`;
    const messages = moodMessages[personalityStyle];
    return messages[moodKey as keyof typeof messages] || messages.default;
  };

  // Generate energy change announcement
  const generateEnergyChangeAnnouncement = (newEnergy: number, oldEnergy: number): string | null => {
    if (!eventSetup) return null;
    
    const personalityStyle = eventSetup.aiPersonality;
    const isIncreasing = newEnergy > oldEnergy;
    
    const energyMessages = {
      humorous: {
        increasing: "Someone just cranked up the energy dial! I can feel the excitement from here!",
        decreasing: "Taking it down a notch! Sometimes you need to recharge before the next wave!"
      },
      formal: {
        increasing: "I'm pleased to observe the increased energy and engagement in the room.",
        decreasing: "The atmosphere is settling into a more comfortable pace."
      },
      energetic: {
        increasing: "ENERGY SURGE DETECTED! THIS IS WHAT I'M TALKING ABOUT!",
        decreasing: "Cooling down the energy! Time to reset and build it back up!"
      },
      professional: {
        increasing: "Energy levels are rising. Excellent engagement from our attendees.",
        decreasing: "Energy levels are moderating. Adjusting accordingly."
      }
    };

    return energyMessages[personalityStyle][isIncreasing ? 'increasing' : 'decreasing'];
  };

  // Handle VIP recognition
  const handleVIPRecognition = (vip: VIPPerson) => {
    if (!eventSetup || !isActive) return;
    
    const now = Date.now();
    const lastAnnouncement = lastVIPAnnouncements.get(vip.id) || 0;
    
    // Only announce if not announced in last 5 minutes
    if (now - lastAnnouncement > 300000) {
      const greeting = generateVIPGreeting(vip);
      makeAnnouncement(greeting);
      setLastVIPAnnouncements(prev => new Map(prev).set(vip.id, now));
    }
  };

  // Generate VIP greeting
  const generateVIPGreeting = (vip: VIPPerson): string => {
    if (!eventSetup) return `Welcome ${vip.name}!`;
    
    const personalityStyle = eventSetup.aiPersonality;
    
    const greetingTemplates = {
      humorous: {
        CEO: `The big boss has entered the building! Everyone, give a warm welcome to ${vip.name}!`,
        Manager: `Our fearless manager ${vip.name} just walked in! Hide your phones, just kidding!`,
        'Birthday Person': `The birthday legend has arrived! ${vip.name}, this party is all about you!`,
        default: `Look who just showed up! Everyone welcome ${vip.name}!`
      },
      formal: {
        CEO: `Ladies and gentlemen, please join me in welcoming our esteemed CEO, ${vip.name}.`,
        Manager: `We are honored to have our distinguished manager, ${vip.name}, join us this evening.`,
        'Birthday Person': `Please welcome our guest of honor, ${vip.name}, on this special day.`,
        default: `Please join me in welcoming our special guest, ${vip.name}.`
      },
      energetic: {
        CEO: `THE CEO IS IN THE HOUSE! Everyone give it up for ${vip.name}!`,
        Manager: `MANAGER ALERT! ${vip.name} just arrived and the energy just went UP!`,
        'Birthday Person': `IT'S THE BIRTHDAY SUPERSTAR! ${vip.name} IS HERE! LET'S CELEBRATE!`,
        default: `VIP ALERT! ${vip.name} just walked in! WELCOME TO THE PARTY!`
      },
      professional: {
        CEO: `Our CEO ${vip.name} has joined us. Welcome to the event.`,
        Manager: `Manager ${vip.name} has arrived. Thank you for being here.`,
        'Birthday Person': `Our birthday celebrant ${vip.name} is here. Happy birthday!`,
        default: `${vip.name} has joined us. Welcome to the event.`
      }
    };

    const templates = greetingTemplates[personalityStyle];
    return templates[vip.role as keyof typeof templates] || templates.default;
  };

  // Handle special moments
  const handleSpecialMoment = (moment: SpecialMoment) => {
    if (!eventSetup || !isActive) return;
    
    if (triggeredMoments.has(moment.id)) return;
    
    setTriggeredMoments(prev => new Set(prev).add(moment.id));
    
    const announcement = moment.announcementTemplate || generateMomentAnnouncement(moment);
    makeAnnouncement(announcement);
    
    // Handle music cue if specified
    if (moment.musicCue && onTrackChange) {
      // This would need to be implemented with track search
      console.log('🎵 Music cue requested:', moment.musicCue);
    }
  };

  // Generate moment announcement
  const generateMomentAnnouncement = (moment: SpecialMoment): string => {
    if (!eventSetup) return `It's time for ${moment.description}!`;
    
    const personalityStyle = eventSetup.aiPersonality;
    
    const momentMessages = {
      humorous: {
        entrance: "And here comes the star of the show! Everyone look alive!",
        speech: "Speech time! Everyone put down your drinks and pretend to listen!",
        cake_cutting: "Cake time! The moment we've all been waiting for... well, after the music!",
        first_dance: "Time for the first dance! No pressure, but everyone's watching!",
        toast: "Raise those glasses! Time for some heartfelt words!",
        surprise: "Surprise time! I hope someone remembered to bring it!"
      },
      formal: {
        entrance: "Ladies and gentlemen, please direct your attention to this special entrance.",
        speech: "We now invite you to join us for a special address.",
        cake_cutting: "It is now time for the traditional cake cutting ceremony.",
        first_dance: "Please join us for the first dance of the evening.",
        toast: "Please raise your glasses for a special toast.",
        surprise: "We have prepared a special surprise for this occasion."
      },
      energetic: {
        entrance: "HERE THEY COME! EVERYONE GET READY FOR THE GRAND ENTRANCE!",
        speech: "SPEECH TIME! EVERYONE GATHER AROUND FOR SOME INSPIRING WORDS!",
        cake_cutting: "CAKE TIME! THIS IS THE MOMENT WE'VE ALL BEEN WAITING FOR!",
        first_dance: "FIRST DANCE TIME! LET'S GIVE THEM THE SPOTLIGHT!",
        toast: "TOAST TIME! RAISE THOSE GLASSES HIGH!",
        surprise: "SURPRISE TIME! GET READY FOR SOMETHING AMAZING!"
      },
      professional: {
        entrance: "Please welcome our special guests as they make their entrance.",
        speech: "We will now proceed with the scheduled address.",
        cake_cutting: "It is time for the cake cutting ceremony.",
        first_dance: "The first dance will now commence.",
        toast: "Please join us for a toast.",
        surprise: "We have a special presentation prepared."
      }
    };

    const messages = momentMessages[personalityStyle];
    return messages[moment.type] || `It's time for ${moment.description}!`;
  };

  // Main analysis loop
  useEffect(() => {
    if (!isActive || !eventSetup) return;

    const runAnalysis = () => {
      performSmartAnalysis();
    };

    // Run analysis every 10 seconds
    intervalRef.current = setInterval(runAnalysis, 10000);
    
    // Run initial analysis
    runAnalysis();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, eventSetup, currentMood, energy, crowdSize]);

  // Handle VIP recognition from external systems
  useEffect(() => {
    if (!isActive || !eventSetup) return;
    
    recognizedVIPs.forEach(vip => {
      if (vip.lastSeen && Date.now() - vip.lastSeen.getTime() < 5000) {
        // Recently recognized VIP
        handleVIPRecognition(vip);
      }
    });
  }, [recognizedVIPs, isActive, eventSetup]);

  return {
    isActive,
    isAnnouncing,
    lastAnnouncement,
    eventStartTime,
    startEvent,
    stopEvent,
    makeAnnouncement,
    handleVIPRecognition,
    handleSpecialMoment
  };
};