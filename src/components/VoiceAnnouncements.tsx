import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, MessageSquare, Settings, Zap } from 'lucide-react';
import { elevenLabsVoice } from '../utils/elevenLabsVoice';

interface VoiceAnnouncementsProps {
  mood: string;
  energy: number;
  crowdSize: number;
  currentTrack: string;
  onAnnouncementStart?: () => void;
  onAnnouncementEnd?: () => void;
}

export const VoiceAnnouncements: React.FC<VoiceAnnouncementsProps> = ({
  mood,
  energy,
  crowdSize,
  currentTrack,
  onAnnouncementStart,
  onAnnouncementEnd
}) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [lastAnnouncement, setLastAnnouncement] = useState('Welcome to the party!');
  const [announcementQueue, setAnnouncementQueue] = useState<string[]>([]);
  const [voiceSettings, setVoiceSettings] = useState({
    provider: 'elevenlabs', // 'browser', 'elevenlabs', 'openai'
    voice: 'auto',
    rate: 0.85,
    pitch: 1.0,
    volume: 0.9,
    elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB' // Adam - Professional male voice
  });
  const [lastAnnouncementTime, setLastAnnouncementTime] = useState<number>(0);
  const [announcementHistory, setAnnouncementHistory] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [availableElevenLabsVoices, setAvailableElevenLabsVoices] = useState<any[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  // Load ElevenLabs voices on mount
  useEffect(() => {
    if (voiceSettings.provider === 'elevenlabs') {
      loadElevenLabsVoices();
    }
  }, [voiceSettings.provider]);

  const loadElevenLabsVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const voices = await elevenLabsVoice.getVoices();
      setAvailableElevenLabsVoices(voices);
      console.log('🎤 Loaded ElevenLabs voices:', voices.length);
    } catch (error) {
      console.error('Failed to load ElevenLabs voices:', error);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const generateContextualAnnouncement = () => {
    const now = Date.now();
    
    // Prevent repetitive announcements (minimum 30 seconds between)
    if (now - lastAnnouncementTime < 30000) {
      return;
    }
    
    // Generate varied, contextual announcements
    const timeOfDay = new Date().getHours();
    const isEvening = timeOfDay >= 18;
    const isLateNight = timeOfDay >= 22 || timeOfDay < 6;
    const isMorning = timeOfDay >= 6 && timeOfDay < 12;
    const isAfternoon = timeOfDay >= 12 && timeOfDay < 18;
    
    // Create much more varied and natural announcements
    const energyLevel = energy > 80 ? 'high' : energy > 60 ? 'medium' : 'low';
    const crowdLevel = crowdSize > 10 ? 'large' : crowdSize > 5 ? 'medium' : crowdSize > 0 ? 'small' : 'empty';
    
    const naturalAnnouncements = {
      // High energy announcements
      high_energy: [
        `Whoa! I'm seeing some serious energy in here! ${energy} percent and climbing!`,
        `This is incredible! The vibe is absolutely electric right now!`,
        `I love what I'm seeing! You're all bringing such amazing energy!`,
        `The energy meter is off the charts! This is what I live for!`,
        `Okay, okay! I see you! That energy is contagious!`,
        `This is it! This is the moment! Feel that energy flowing!`,
        `Incredible! The room is absolutely buzzing with excitement!`,
        `I'm getting goosebumps from this energy! You're all amazing!`
      ],
      
      // Medium energy announcements  
      medium_energy: [
        `Nice energy in the room! I'm feeling good vibes from everyone!`,
        `This is a perfect energy level! Smooth and steady!`,
        `I love this balanced energy! Everyone's in the zone!`,
        `Great vibes flowing through the room right now!`,
        `This energy feels just right! Perfect for this moment!`,
        `I'm reading some really good energy from all of you!`,
        `The vibe is settling in nicely! This is beautiful!`,
        `Loving this steady energy! It's got that perfect flow!`
      ],
      
      // Low energy - encouraging
      low_energy: [
        `Let's bring that energy up a little! I know you've got it in you!`,
        `Time to wake up the room! Show me what you're made of!`,
        `I can feel the potential! Let's unlock that energy!`,
        `Come on everyone! Let's turn this up together!`,
        `I believe in this crowd! Let's build something amazing!`,
        `The night is young! Let's find that spark!`,
        `I'm here to help you find your rhythm! Let's go!`,
        `Every great party starts somewhere! This is our moment!`
      ],
      
      // Mood-specific natural responses
      excited_mood: [
        `I can literally see the excitement on your faces! This is beautiful!`,
        `That excitement is infectious! I'm feeling it too!`,
        `This excited energy is exactly what we needed right now!`,
        `Your excitement is lighting up the whole room!`,
        `I love seeing people this excited! It makes my circuits happy!`
      ],
      
      happy_mood: [
        `Those smiles are absolutely radiant! Keep spreading that joy!`,
        `Happiness looks good on all of you! Seriously!`,
        `I'm getting such positive vibes! This is what music is about!`,
        `Your happiness is the best soundtrack I could ask for!`,
        `Seeing all these genuine smiles just made my day!`
      ],
      
      chill_mood: [
        `Perfect chill vibes right now. Sometimes this is exactly what we need.`,
        `I'm loving this relaxed energy. It's got that smooth flow.`,
        `Chill mode activated! These are the moments that matter.`,
        `This laid-back vibe is hitting just right. Beautiful.`,
        `Sometimes the best energy is the calm, steady kind. This is it.`
      ],
      
      // Time-based natural announcements
      morning: [
        `Good morning energy! I love starting the day with music!`,
        `Morning vibes are hitting different! This is how you start a day!`,
        `Early bird energy! You're all dedicated to the music!`,
        `Morning sessions hit different! There's something special about this!`
      ],
      
      afternoon: [
        `Afternoon energy is settling in nicely! Perfect timing!`,
        `I love these afternoon vibes! No rush, just good music!`,
        `Midday energy has its own special flavor! This is it!`,
        `Afternoon sessions are underrated! This feels perfect!`
      ],
      
      evening: [
        `Evening energy is my favorite! This is when the magic happens!`,
        `The evening is young and full of possibilities!`,
        `Perfect evening vibes! This is what weekends are made for!`,
        `Evening sessions always have that special something!`
      ],
      
      late_night: [
        `Late night energy hits completely different! This is our time!`,
        `The night owls are out! This is when we really come alive!`,
        `It's getting late but the energy is just getting started!`,
        `Late night magic is happening right now! Can you feel it?`
      ],
      
      // Crowd size responses
      intimate_crowd: [
        `I love intimate gatherings like this! Quality over quantity!`,
        `Small but mighty! This energy is concentrated and powerful!`,
        `Sometimes the best vibes come from smaller groups! This is proof!`,
        `Intimate sessions have their own special magic! This is it!`
      ],
      
      medium_crowd: [
        `Perfect crowd size! Not too big, not too small, just right!`,
        `This is the sweet spot for crowd energy! Everyone can connect!`,
        `I love this size group! Everyone's energy can really shine!`,
        `This crowd size creates the perfect energy dynamic!`
      ],
      
      large_crowd: [
        `Wow! Look at this amazing crowd! The energy is multiplied!`,
        `This is what I call a proper gathering! So much energy!`,
        `Big crowd, big energy! This is going to be incredible!`,
        `The more people, the more energy! This is electric!`
      ]
    };
    
    // Select appropriate announcement category
    let selectedAnnouncements: string[] = [];
    
    // Primary selection based on energy and mood
    if (energyLevel === 'high') {
      selectedAnnouncements = naturalAnnouncements.high_energy;
    } else if (energyLevel === 'medium') {
      selectedAnnouncements = naturalAnnouncements.medium_energy;
    } else {
      selectedAnnouncements = naturalAnnouncements.low_energy;
    }
    
    // Add mood-specific announcements
    if (mood === 'excited') {
      selectedAnnouncements = [...selectedAnnouncements, ...naturalAnnouncements.excited_mood];
    } else if (mood === 'happy') {
      selectedAnnouncements = [...selectedAnnouncements, ...naturalAnnouncements.happy_mood];
    } else if (mood === 'chill') {
      selectedAnnouncements = [...selectedAnnouncements, ...naturalAnnouncements.chill_mood];
    }
    
    // Add time-based announcements
    if (isMorning) {
      selectedAnnouncements = [...selectedAnnouncements, ...naturalAnnouncements.morning];
    } else if (isAfternoon) {
      selectedAnnouncements = [...selectedAnnouncements, ...naturalAnnouncements.afternoon];
    } else if (isEvening) {
      selectedAnnouncements = [...selectedAnnouncements, ...naturalAnnouncements.evening];
    } else if (isLateNight) {
      selectedAnnouncements = [...selectedAnnouncements, ...naturalAnnouncements.late_night];
    }
    
    // Add crowd-based announcements
    if (crowdLevel === 'large') {
      selectedAnnouncements = [...selectedAnnouncements, ...naturalAnnouncements.large_crowd];
    } else if (crowdLevel === 'medium') {
      selectedAnnouncements = [...selectedAnnouncements, ...naturalAnnouncements.medium_crowd];
    } else if (crowdLevel === 'small') {
      selectedAnnouncements = [...selectedAnnouncements, ...naturalAnnouncements.intimate_crowd];
    }
    
    // Filter out recently used announcements
    const availableAnnouncements = selectedAnnouncements.filter(announcement => 
      !announcementHistory.includes(announcement)
    );
    
    const selectedAnnouncement = availableAnnouncements.length > 0 
      ? availableAnnouncements[Math.floor(Math.random() * availableAnnouncements.length)]
      : selectedAnnouncements[Math.floor(Math.random() * selectedAnnouncements.length)];

    setLastAnnouncement(selectedAnnouncement);
    setLastAnnouncementTime(now);
    
    // Update history (keep last 10 announcements)
    setAnnouncementHistory(prev => [...prev.slice(-9), selectedAnnouncement]);
    
    if (isEnabled) {
      setAnnouncementQueue(prev => [...prev, selectedAnnouncement].slice(-3));
    }
  };

  useEffect(() => {
    // Listen for immediate announcements
    const handleImmediateAnnouncement = (event: CustomEvent) => {
      const { message } = event.detail;
      setLastAnnouncement(message);
      if (isEnabled) {
        playAnnouncement(message);
      }
    };

    // Listen for person-specific announcements
    const handlePersonAnnouncement = (event: CustomEvent) => {
      const { personName, message } = event.detail;
      if (shouldAnnouncePersonAgain(personName)) {
        setLastAnnouncement(message);
        setLastPersonAnnounced(personName);
        setLastPersonAnnouncementTime(Date.now());
        
        if (isEnabled) {
          playAnnouncement(message);
        }
      }
    };

    window.addEventListener('immediateAnnouncement', handleImmediateAnnouncement as EventListener);
    window.addEventListener('personAnnouncement', handlePersonAnnouncement as EventListener);

    return () => {
      window.removeEventListener('immediateAnnouncement', handleImmediateAnnouncement as EventListener);
      window.removeEventListener('personAnnouncement', handlePersonAnnouncement as EventListener);
    };
  }, [isEnabled]);

  useEffect(() => {
    if (isEnabled) {
      // Vary the interval between 45-90 seconds to feel more natural
      const randomInterval = 45000 + Math.random() * 45000;
      const interval = setInterval(generateContextualAnnouncement, randomInterval);
      return () => clearInterval(interval);
    }
  }, [isEnabled, mood, energy, crowdSize, currentTrack]);

  const playAnnouncement = async (text: string) => {
    try {
      console.log('🎤 Playing announcement:', text);
      
      // Cancel any ongoing speech
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
      
      // Duck audio before announcement
      onAnnouncementStart?.();
      
      if (voiceSettings.provider === 'elevenlabs') {
        console.log('🎤 Using ElevenLabs voice...');
        await playElevenLabsVoice(text);
      } else if (voiceSettings.provider === 'openai') {
        await playOpenAIVoice(text);
      } else {
        await playBrowserVoice(text);
      }
      
      console.log('✅ Announcement completed');
    } catch (error) {
      console.error('❌ Announcement failed:', error);
      // Fallback to browser voice if ElevenLabs fails
      if (voiceSettings.provider === 'elevenlabs') {
        console.log('🔄 Falling back to browser voice...');
        await playBrowserVoice(text);
      }
    } finally {
      // Always unduck audio after announcement
      setTimeout(() => {
        onAnnouncementEnd?.();
      }, 1000);
    }
  };

  const playBrowserVoice = async (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get available voices
    const voices = speechSynthesis.getVoices();
    
    // Enhanced voice selection
    let selectedVoice = null;
    
    if (voiceSettings.voice === 'auto') {
      // Try to find the best available voice
      selectedVoice = voices.find(voice => 
        voice.lang.includes('en') && 
        (voice.name.includes('Samantha') || 
         voice.name.includes('Alex') ||
         voice.name.includes('Karen') ||
         voice.name.includes('Moira') ||
         voice.name.includes('Tessa') ||
         voice.name.includes('Ava') ||
         voice.name.includes('Allison'))
      ) || voices.find(voice => 
        voice.lang.includes('en') && voice.name.includes('Female')
      ) || voices.find(voice => voice.lang.includes('en')) || voices[0];
    } else {
      selectedVoice = voices.find(voice => voice.name === voiceSettings.voice) || voices[0];
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Apply voice settings
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume;
    
    utterance.onend = () => {
      setTimeout(() => {
        onAnnouncementEnd?.();
      }, 500);
    };
    
    speechSynthesis.speak(utterance);
    console.log('🎤 Speaking with voice:', selectedVoice?.name || 'default');
  };

  const playElevenLabsVoice = async (text: string) => {
    try {
      console.log('🎤 Using ElevenLabs voice...');
      
      const settings = {
        voice_id: voiceSettings.elevenLabsVoiceId,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true,
        },
      };
      
      console.log('🎤 Generating speech with ElevenLabs...');
      const audioBuffer = await elevenLabsVoice.generateSpeech(text, settings);
      if (audioBuffer) {
        console.log('🎤 Playing ElevenLabs audio...');
        await elevenLabsVoice.playAudio(audioBuffer);
        console.log('✅ ElevenLabs speech played successfully');
      } else {
        throw new Error('No audio buffer received');
      }
    } catch (error) {
      console.error('❌ ElevenLabs error, falling back to browser voice:', error);
      throw error; // Let the parent handle fallback
    }
  };

  const playOpenAIVoice = async (text: string) => {
    try {
      // This would require OpenAI API key
      console.log('🎤 OpenAI voice not implemented yet');
      await playBrowserVoice(text); // Fallback
    } catch (error) {
      console.error('OpenAI voice error:', error);
      await playBrowserVoice(text);
    }
  };

  const getAvailableVoices = () => {
    const voices = speechSynthesis.getVoices();
    return voices.filter(voice => voice.lang.includes('en'));
  };

  const preventRepetitiveAnnouncements = (newAnnouncement: string) => {
    // Check if this announcement was recently made
    const recentAnnouncements = announcementQueue.slice(-3);
    const isDuplicate = recentAnnouncements.some(announcement => 
      announcement.toLowerCase().includes(newAnnouncement.toLowerCase().substring(0, 20))
    );
    
    return !isDuplicate;
  };

  // Prevent the same person being announced repeatedly
  const [lastPersonAnnounced, setLastPersonAnnounced] = useState<string>('');
  const [lastPersonAnnouncementTime, setLastPersonAnnouncementTime] = useState<number>(0);

  const shouldAnnouncePersonAgain = (personName: string) => {
    const now = Date.now();
    const timeSinceLastPersonAnnouncement = now - lastPersonAnnouncementTime;
    
    // Only announce the same person again after 5 minutes
    if (lastPersonAnnounced === personName && timeSinceLastPersonAnnouncement < 300000) {
      return false;
    }
    
    return true;
  };

  // Expose function to trigger person-specific announcements
  const triggerPersonAnnouncement = (personName: string, customMessage?: string) => {
    if (!shouldAnnouncePersonAgain(personName)) {
      console.log(`🎤 Skipping repeat announcement for ${personName}`);
      return;
    }
    
    const announcement = customMessage || `Welcome ${personName}! Great to see you here!`;
    
    if (preventRepetitiveAnnouncements(announcement)) {
      setLastAnnouncement(announcement);
      setLastPersonAnnounced(personName);
      setLastPersonAnnouncementTime(Date.now());
      
      if (isEnabled) {
        playAnnouncement(announcement);
      }
    }
  };

  // Expose this function to parent components
  React.useImperativeHandle(React.forwardRef(() => null), () => ({
    triggerPersonAnnouncement
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEnabled(!isEnabled)}
            className={`p-2 rounded-full transition-colors ${
              isEnabled 
                ? 'bg-purple-500 text-white shadow-lg' 
                : 'bg-white/20 text-gray-300'
            }`}
          >
            {isEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full bg-white/20 text-gray-300 hover:text-white transition-colors"
          >
            <Settings className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Voice Settings */}
      {showSettings && (
        <div className="bg-white/10 rounded-lg p-3 mb-3 border border-white/20 space-y-3">
          <h4 className="text-sm font-medium text-white">Voice Settings</h4>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">Voice Provider</label>
            <select
              value={voiceSettings.provider}
              onChange={(e) => {
                const newProvider = e.target.value as any;
                setVoiceSettings(prev => ({ ...prev, provider: newProvider }));
                if (newProvider === 'elevenlabs') {
                  loadElevenLabsVoices();
                }
              }}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
            >
              <option value="browser">Browser (Free)</option>
              <option value="elevenlabs">ElevenLabs (Ultra Realistic)</option>
              <option value="openai">OpenAI (Premium)</option>
            </select>
          </div>
          
          {voiceSettings.provider === 'elevenlabs' && (
            <div>
              <label className="block text-xs text-gray-300 mb-1">ElevenLabs Voice</label>
              {isLoadingVoices ? (
                <div className="text-xs text-gray-400">Loading voices...</div>
              ) : (
                <select
                  value={voiceSettings.elevenLabsVoiceId}
                  onChange={(e) => setVoiceSettings(prev => ({ ...prev, elevenLabsVoiceId: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                >
                  {elevenLabsVoice.getDJVoiceOptions().map(voice => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name} - {voice.description}
                    </option>
                  ))}
                  {availableElevenLabsVoices.map(voice => (
                    <option key={voice.voice_id} value={voice.voice_id}>
                      {voice.name} ({voice.category})
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => elevenLabsVoice.testVoice(voiceSettings.elevenLabsVoiceId)}
                className="mt-1 text-xs text-purple-400 hover:text-purple-300"
              >
                Test This Voice
              </button>
            </div>
          )}
          
          {voiceSettings.provider === 'browser' && (
            <div>
              <label className="block text-xs text-gray-300 mb-1">Voice</label>
              <select
                value={voiceSettings.voice}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, voice: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
              >
                <option value="auto">Auto (Best Available)</option>
                {getAvailableVoices().map(voice => (
                  <option key={voice.name} value={voice.name}>{voice.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Speed</label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={voiceSettings.rate}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, rate: Number(e.target.value) }))}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{voiceSettings.rate}x</span>
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Pitch</label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={voiceSettings.pitch}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, pitch: Number(e.target.value) }))}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{voiceSettings.pitch}</span>
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Volume</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={voiceSettings.volume}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, volume: Number(e.target.value) }))}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{Math.round(voiceSettings.volume * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Current Announcement */}
      <div className="bg-white/10 rounded-lg p-3 mb-3 border border-white/20 backdrop-blur-sm">
        <div className="flex items-start space-x-2 mb-2">
          <MessageSquare className="w-4 h-4 text-purple-300 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-white">{lastAnnouncement}</p>
          </div>
          <button
            onClick={() => playAnnouncement(lastAnnouncement)}
            className="text-purple-300 hover:text-purple-200 transition-colors"
            title="Play announcement"
          >
            <Volume2 className="w-3 h-3" />
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Last: {new Date(lastAnnouncementTime).toLocaleTimeString()}
        </div>
      </div>

      {/* Quick Announcement Buttons */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-300">Quick Drops</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            'Here comes the drop!',
            'Hands up everyone!',
            'Make some noise!',
            'Let\'s turn it up!',
            'Feel that bass!',
            'This is your moment!',
            'Energy check!',
            'Who\'s ready?'
          ].slice(0, 4).map((announcement, index) => (
            <button
              key={index}
              onClick={() => {
                setLastAnnouncement(announcement);
                playAnnouncement(announcement);
              }}
              className="text-center px-2 py-1 bg-white/10 hover:bg-purple-500/30 rounded text-xs transition-colors border border-white/20"
            >
              {announcement}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => {
            const testAnnouncement = "Hey everyone! This is your AI DJ testing the ElevenLabs voice system. How does this sound?";
            setLastAnnouncement(testAnnouncement);
            playAnnouncement(testAnnouncement);
          }}
          className="w-full px-2 py-1 bg-blue-500/30 hover:bg-blue-500/50 rounded text-xs transition-colors border border-blue-500/20 flex items-center justify-center"
        >
          <Zap className="w-3 h-3 mr-1" />
          Test ElevenLabs Voice
        </button>
      </div>

    </div>
  );
};