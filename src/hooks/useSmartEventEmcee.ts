import { useState, useEffect, useRef } from 'react';
import { Track } from '../data/tracks';
import { GeminiVisionAnalyzer } from '../utils/geminiVision';

interface VIPPerson {
  id: string;
  name: string;
  role: string;
  imageFile?: File;
  imageUrl?: string;
  greeting?: string;
  recognitionCount: number;
  lastSeen?: Date;
}

interface EventSetup {
  eventName: string;
  eventType: 'birthday' | 'corporate' | 'wedding' | 'party' | 'conference';
  duration: number;
  vipPeople: VIPPerson[];
  aiPersonality: 'humorous' | 'formal' | 'energetic' | 'professional';
  specialMoments: string[];
}

interface SmartEventEmceeProps {
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
}: SmartEventEmceeProps) => {
  const [isActive, setIsActive] = useState(false);
  const [recognizedPeople, setRecognizedPeople] = useState<VIPPerson[]>([]);
  const [currentMood, setCurrentMood] = useState('neutral');
  const [currentEnergy, setCurrentEnergy] = useState(50);
  const [crowdSize, setCrowdSize] = useState(0);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzerRef = useRef<GeminiVisionAnalyzer | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout>();
  const eventStartTime = useRef<Date | null>(null);

  // Initialize Gemini analyzer
  useEffect(() => {
    const apiKey = 'AIzaSyDMtDDrtr8WLwUHpXnVkRVzN1s_4IkUsRo';
    analyzerRef.current = new GeminiVisionAnalyzer(apiKey);
  }, []);

  // Start the smart event emcee
  const startEvent = () => {
    setIsActive(true);
    eventStartTime.current = new Date();
    
    // Welcome announcement
    const welcomeMessage = generateWelcomeMessage();
    onAnnouncement(welcomeMessage);
    
    console.log('🎤 Smart Event Emcee started:', eventSetup.eventName);
  };

  const stopEvent = () => {
    setIsActive(false);
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }
    console.log('🎤 Smart Event Emcee stopped');
  };

  // Generate welcome message based on event type and personality
  const generateWelcomeMessage = (): string => {
    const { eventName, eventType, aiPersonality } = eventSetup;
    const durationText = eventSetup.duration < 1 
      ? `${Math.round(eventSetup.duration * 60)}-minute` 
      : eventSetup.duration === 1 
      ? 'one-hour' 
      : `${eventSetup.duration}-hour`;
    
    const welcomeMessages = {
      humorous: {
        birthday: `🎂 Welcome to ${eventName}! I'm your AI DJ for this ${durationText} celebration and I promise not to embarrass anyone... much! Let's get this birthday party started!`,
        corporate: `🏢 Welcome to ${eventName}! Don't worry, I won't tell HR about your dance moves during this ${durationText} event! Let's make this corporate gathering actually fun!`,
        wedding: `💒 Welcome to ${eventName}! Love is in the air for this ${durationText} celebration, and so is my amazing playlist! Let's celebrate love and good music!`,
        party: `🎉 Welcome to ${eventName}! I'm your AI DJ for this ${durationText} party and I'm here to make sure everyone has a blast! Let's party!`,
        conference: `🎤 Welcome to ${eventName}! I'm your AI host for this ${durationText} conference, and I promise to keep things lively between presentations!`
      },
      formal: {
        birthday: `🎂 Good evening, and welcome to ${eventName}. It is our pleasure to celebrate this special ${durationText} occasion with you.`,
        corporate: `🏢 Welcome to ${eventName}. We are honored to have you join us for this important ${durationText} corporate gathering.`,
        wedding: `💒 Welcome to ${eventName}. We are gathered here today for this ${durationText} celebration of love and unity.`,
        party: `🎉 Good evening, and welcome to ${eventName}. We hope you enjoy this wonderful ${durationText} celebration.`,
        conference: `🎤 Welcome to ${eventName}. We look forward to this informative and engaging ${durationText} event.`
      },
      energetic: {
        birthday: `🎂 WELCOME TO ${eventName.toUpperCase()}! ARE YOU READY FOR THIS ${durationText.toUpperCase()} PARTY?! Let's make this birthday UNFORGETTABLE!`,
        corporate: `🏢 WELCOME TO ${eventName.toUpperCase()}! Time to show everyone that ${durationText} corporate events can be AMAZING! Let's GO!`,
        wedding: `💒 WELCOME TO ${eventName.toUpperCase()}! Love is in the air for this ${durationText.toUpperCase()} celebration and the energy is ELECTRIC! Let's celebrate!`,
        party: `🎉 WELCOME TO ${eventName.toUpperCase()}! This ${durationText.toUpperCase()} party starts NOW! Let's turn up the energy!`,
        conference: `🎤 WELCOME TO ${eventName.toUpperCase()}! Get ready for an INCREDIBLE ${durationText.toUpperCase()} experience! Let's make it happen!`
      },
      professional: {
        birthday: `🎂 Welcome to ${eventName}. We are pleased to celebrate this ${durationText} milestone with you today.`,
        corporate: `🏢 Welcome to ${eventName}. Thank you for joining us for this ${durationText} corporate event.`,
        wedding: `💒 Welcome to ${eventName}. We are honored to witness this ${durationText} celebration of love.`,
        party: `🎉 Welcome to ${eventName}. We hope you have an enjoyable ${durationText} evening with us.`,
        conference: `🎤 Welcome to ${eventName}. We appreciate your attendance at this ${durationText} conference.`
      }
    };

    return welcomeMessages[aiPersonality][eventType] || `Welcome to ${eventName}!`;
  };

  // Enhanced analysis with face recognition
  const performSmartAnalysis = async () => {
    if (!videoElement || !analyzerRef.current || isAnalyzing || !isActive) return;

    setIsAnalyzing(true);
    
    try {
      // Create enhanced prompt with better face recognition
      const vipNames = eventSetup.vipPeople.map(p => p.name).join(', ');
      const enhancedPrompt = `
You are an AI Event Host analyzing a live camera feed. Look very carefully at this image:

EVENT CONTEXT:
- Event: ${eventSetup.eventName}
- Type: ${eventSetup.eventType}
- Key people to look for: ${vipNames || 'None specified'}
- You must look VERY carefully at faces in the image

CRITICAL INSTRUCTIONS:
1. CAREFULLY examine every face in the image
2. Look for the specific people: ${vipNames}
3. Count all visible people
4. Determine what's happening (speaking, presenting, celebrating, etc.)
5. Rate the energy level (1-10)

RESPOND EXACTLY IN THIS FORMAT:
People: [number]
Mood: [mood word]
Energy: [1-10]
Activity: [what people are doing]
Person_Recognized: [exact name if you see them, or "none"]
Should_Announce: [yes/no - if you recognized someone or see special activity]
Announcement: [what to say if Should_Announce is yes]

Example: "People: 2, Mood: focused, Energy: 6, Activity: working at desk, Person_Recognized: Sarah Johnson, Should_Announce: yes, Announcement: Welcome our amazing intern Sarah! Great to see you here!"
`;

      // Capture and analyze frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0);
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      const requestBody = {
        contents: [{
          parts: [
            { text: enhancedPrompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 1024,
        }
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=AIzaSyDMtDDrtr8WLwUHpXnVkRVzN1s_4IkUsRo`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) throw new Error(`Analysis failed: ${response.status}`);

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      console.log('🤖 AI Analysis Response:', responseText);
      
      // Parse the enhanced response
      const peopleMatch = responseText.match(/People:\s*(\d+)/i);
      const moodMatch = responseText.match(/Mood:\s*(\w+)/i);
      const energyMatch = responseText.match(/Energy:\s*(\d+)/i);
      const activityMatch = responseText.match(/Activity:\s*([^,\n]+)/i);
      const personMatch = responseText.match(/Person_Recognized:\s*([^,\n]+)/i);
      const shouldAnnounceMatch = responseText.match(/Should_Announce:\s*(yes|no)/i);
      const announcementMatch = responseText.match(/Announcement:\s*([^,\n]+)/i);

      const newCrowdSize = peopleMatch ? parseInt(peopleMatch[1]) : 0;
      const newMood = moodMatch ? moodMatch[1].toLowerCase() : 'neutral';
      const newEnergy = energyMatch ? parseInt(energyMatch[1]) * 10 : 50; // Convert to 0-100
      const activity = activityMatch ? activityMatch[1].trim() : 'general';
      const personRecognized = personMatch ? personMatch[1].trim() : 'none';
      const shouldAnnounce = shouldAnnounceMatch ? shouldAnnounceMatch[1] === 'yes' : false;
      const announcement = announcementMatch ? announcementMatch[1].trim() : '';

      // Update state
      setCrowdSize(newCrowdSize);
      setCurrentMood(newMood);
      setCurrentEnergy(newEnergy);
      setLastAnalysis(new Date());

      // Handle VIP recognition
      if (personRecognized && personRecognized !== 'none') {
        handleVIPRecognition(personRecognized, announcement);
      }

      // Handle announcements
      if (shouldAnnounce && announcement) {
        setTimeout(() => {
          onAnnouncement(announcement);
        }, 1000);
      }

      // Adapt music based on analysis
      adaptMusicToContext(newMood, newEnergy, activity);

      console.log('🎤 Smart Analysis:', { 
        people: newCrowdSize, 
        mood: newMood, 
        energy: newEnergy, 
        activity, 
        personRecognized, 
        shouldAnnounce 
      });

    } catch (error) {
      console.error('🎤 Smart analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle VIP recognition
  const handleVIPRecognition = (recognizedName: string, customAnnouncement?: string) => {
    const vipPerson = eventSetup.vipPeople.find(person => 
      person.name.toLowerCase().includes(recognizedName.toLowerCase()) ||
      recognizedName.toLowerCase().includes(person.name.toLowerCase())
    );

    if (vipPerson) {
      const updatedPerson = {
        ...vipPerson,
        recognitionCount: (vipPerson.recognitionCount || 0) + 1,
        lastSeen: new Date()
      };

      setRecognizedPeople(prev => {
        const existing = prev.find(p => p.id === vipPerson.id);
        if (existing) {
          return prev.map(p => p.id === vipPerson.id ? updatedPerson : p);
        } else {
          return [...prev, updatedPerson];
        }
      });

      // Trigger personalized announcement
      const greeting = customAnnouncement || vipPerson.greeting || `Welcome ${vipPerson.name}!`;
      setTimeout(() => {
        onAnnouncement(greeting);
      }, 1000);

      console.log('🌟 VIP Recognized:', vipPerson.name);
    }
  };

  // Handle special moments
  const handleSpecialMoment = (activity: string, mood: string) => {
    const { eventType, aiPersonality } = eventSetup;
    
    let announcement = '';
    
    if (activity.includes('cake') && eventType === 'birthday') {
      announcement = generateSpecialMomentAnnouncement('cake_cutting', aiPersonality);
    } else if (activity.includes('speech') || activity.includes('speaking')) {
      announcement = generateSpecialMomentAnnouncement('speech', aiPersonality);
    } else if (activity.includes('dancing')) {
      announcement = generateSpecialMomentAnnouncement('dancing', aiPersonality);
    } else if (activity.includes('toast')) {
      announcement = generateSpecialMomentAnnouncement('toast', aiPersonality);
    }

    if (announcement) {
      setTimeout(() => {
        onAnnouncement(announcement);
      }, 2000);
    }
  };

  // Generate special moment announcements
  const generateSpecialMomentAnnouncement = (moment: string, personality: string): string => {
    const announcements = {
      humorous: {
        cake_cutting: "🎂 Hold up everyone! It's cake time! Don't worry, I counted the candles - we're not telling anyone the real number!",
        speech: "🎤 Looks like someone's got something important to say! Everyone quiet down - this could be good! Or at least pretend to listen!",
        dancing: "💃 Oh my! Look at those moves! The dance floor is officially ON FIRE!",
        toast: "🥂 Glasses up everyone! Time for a toast! And remember, no crying in your champagne!",
        presentation: "📊 Time for the main event! Someone's about to show us some PowerPoint magic! Let's give them our attention!",
        networking: "🤝 I see some serious networking happening! Don't forget to exchange those business cards!"
      },
      formal: {
        cake_cutting: "🎂 Ladies and gentlemen, we have reached the moment for the traditional cake cutting ceremony.",
        speech: "🎤 We now have a distinguished speaker ready to address the assembly. Please give them your full attention.",
        dancing: "💃 The dance floor is now active. Please join in the celebration.",
        toast: "🥂 Please raise your glasses for a special toast.",
        presentation: "📊 We are now ready for our scheduled presentation. Please direct your attention to the speaker.",
        networking: "🤝 This is an excellent opportunity for professional networking. Please feel free to introduce yourselves."
      },
      energetic: {
        cake_cutting: "🎂 CAKE TIME! CAKE TIME! Everyone gather around! This is the MOMENT we've been waiting for!",
        speech: "🎤 SPEECH TIME! Everyone listen up! Our speaker is about to drop some KNOWLEDGE!",
        dancing: "💃 THE DANCE FLOOR IS ALIVE! Look at those INCREDIBLE moves! Keep it going!",
        toast: "🥂 TOAST TIME! Glasses HIGH! Let's make this EPIC!",
        presentation: "📊 PRESENTATION TIME! Get ready for some AMAZING insights! This is going to be INCREDIBLE!",
        networking: "🤝 NETWORKING TIME! Get out there and make those CONNECTIONS! Let's GO!"
      },
      professional: {
        cake_cutting: "🎂 We are now ready for the cake cutting ceremony. Please gather around.",
        speech: "🎤 We have a distinguished speaker ready to address the assembly. Please give them your undivided attention.",
        dancing: "💃 Dancing has commenced. Please feel free to join the celebration.",
        toast: "🥂 Please prepare for a toast. Kindly raise your glasses.",
        presentation: "📊 We are ready to begin our scheduled presentation. Please take your seats and give the speaker your attention.",
        networking: "🤝 This is a designated networking period. Please take this opportunity to connect with your colleagues."
      }
    };

    return announcements[personality as keyof typeof announcements]?.[moment as keyof typeof announcements.humorous] || 
           `Special moment detected: ${moment}`;
  };

  // Adapt music based on context
  const adaptMusicToContext = (mood: string, energy: number, activity: string) => {
    if (!isPlaying || !tracks.length) return;

    let targetBPM = 120;
    let preferredGenres: string[] = [];

    // Determine music based on activity and mood
    if (activity.includes('dancing')) {
      targetBPM = 130 + (energy / 10);
      preferredGenres = ['Electronic', 'House', 'Techno'];
    } else if (activity.includes('eating') || activity.includes('dinner')) {
      targetBPM = 90 + (energy / 15);
      preferredGenres = ['Jazz', 'Ambient', 'Chill'];
    } else if (activity.includes('speech') || activity.includes('presentation')) {
      // Lower volume or pause for speeches
      return;
    } else {
      // General background music
      targetBPM = 110 + (energy / 8);
      preferredGenres = ['Electronic', 'Pop', 'House'];
    }

    // Find suitable track
    const suitableTracks = tracks.filter(track => {
      const bpmMatch = Math.abs(track.bpm - targetBPM) < 20;
      const genreMatch = preferredGenres.some(genre => 
        track.genre.toLowerCase().includes(genre.toLowerCase())
      );
      return bpmMatch || genreMatch;
    });

    if (suitableTracks.length > 0 && currentTrack) {
      const newTrack = suitableTracks[Math.floor(Math.random() * suitableTracks.length)];
      if (newTrack.id !== currentTrack.id) {
        console.log('🎵 Adapting music for context:', { activity, mood, newTrack: newTrack.title });
        setTimeout(() => {
          onTrackChange(newTrack);
        }, 3000);
      }
    }
  };

  // Main analysis loop
  useEffect(() => {
    if (!isActive || !videoElement) return;

    // Run analysis every 3 seconds for better accuracy
    analysisIntervalRef.current = setInterval(performSmartAnalysis, 3000);

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [isActive, videoElement, eventSetup]);

  return {
    isActive,
    startEvent,
    stopEvent,
    recognizedPeople,
    currentMood,
    currentEnergy,
    crowdSize,
    lastAnalysis,
    isAnalyzing,
    eventStartTime: eventStartTime.current
  };
};