import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, MessageSquare, Settings, Zap } from 'lucide-react';

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
    provider: 'browser', // 'browser', 'elevenlabs', 'openai'
    voice: 'auto',
    rate: 0.85,
    pitch: 1.0,
    volume: 0.9
  });
  const [lastAnnouncementTime, setLastAnnouncementTime] = useState<number>(0);
  const [announcementHistory, setAnnouncementHistory] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);

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
    
    const contextualAnnouncements = [
      // Energy-based announcements
      ...(energy > 80 ? [
        `Wow! The energy is absolutely electric right now at ${energy}%!`,
        `I'm seeing some incredible vibes from you ${crowdSize} amazing people!`,
        `This is what I call peak energy! Keep this momentum going!`,
        `The crowd is absolutely on fire tonight! You're killing it!`
      ] : energy > 60 ? [
        `Great energy in the room! ${energy}% and climbing!`,
        `I love what I'm seeing from the ${crowdSize} of you here!`,
        `The vibe is perfect right now - let's keep building this energy!`,
        `You're all bringing such good energy to this space!`
      ] : [
        `Let's bring that energy up! I know you've got it in you!`,
        `Time to wake up the room! Show me what you've got!`,
        `I can feel the potential energy from all ${crowdSize} of you!`,
        `Let's turn this up a notch! Ready to feel the beat?`
      ]),
      
      // Mood-based announcements
      ...(mood === 'excited' ? [
        `I can see the excitement on your faces! This is what I live for!`,
        `The excitement is contagious! Everyone's feeling it!`,
        `This excited energy is exactly what we need right now!`
      ] : mood === 'happy' ? [
        `Those smiles are lighting up the room! Keep spreading that joy!`,
        `Happiness is the best accessory, and you're all wearing it well!`,
        `I love seeing all these happy faces! Music really does bring joy!`
      ] : mood === 'chill' ? [
        `Perfect chill vibes right now. Sometimes this is exactly what we need.`,
        `I'm reading a nice relaxed energy. Let's keep this smooth flow going.`,
        `Chill mode activated! Sometimes the best moments are the quiet ones.`
      ] : [
        `I'm reading the room and adjusting the vibe accordingly.`,
        `Every crowd has its own unique energy, and I'm here for it.`,
        `Let me find the perfect sound for this moment.`
      ]),
      
      // Time-based announcements
      ...(isLateNight ? [
        `It's getting late but the night is still young! Who's ready to keep going?`,
        `Late night energy hits different! This is when the magic happens!`,
        `The night owls are out! This is our time to shine!`
      ] : isEvening ? [
        `Perfect evening vibes! This is what weekends are made for!`,
        `Evening energy is setting in! Time to make some memories!`,
        `The evening is young and full of possibilities!`
      ] : [
        `Daytime party energy! I love the enthusiasm!`,
        `Afternoon vibes are hitting just right!`,
        `Who says you need to wait for nighttime to have fun?`
      ]),
      
      // Track-based announcements (if playing)
      ...(currentTrack !== 'No track' ? [
        `${currentTrack} is really resonating with the crowd right now!`,
        `This track is hitting all the right notes for this ${mood} mood!`,
        `I picked ${currentTrack} specifically for this energy level!`,
        `The algorithm says this is the perfect track for right now!`
      ] : []),
      
      // Crowd size based
      ...(crowdSize > 10 ? [
        `${crowdSize} people strong! This is what I call a proper gathering!`,
        `With ${crowdSize} people here, we've got the perfect crowd size for some magic!`,
        `${crowdSize} people, one vibe! This is beautiful to see!`
      ] : crowdSize > 0 ? [
        `Intimate gathering of ${crowdSize}! Sometimes the best parties are the smaller ones!`,
        `Quality over quantity! ${crowdSize} people with amazing energy!`,
        `Small but mighty! ${crowdSize} people bringing the perfect vibe!`
      ] : [
        `I'm here and ready whenever you are!`,
        `The music is playing, just waiting for the crowd to arrive!`,
        `Setting the perfect atmosphere for when everyone gets here!`
      ])
    ];
    
    // Filter out recently used announcements
    const availableAnnouncements = contextualAnnouncements.filter(announcement => 
      !announcementHistory.includes(announcement)
    );
    
    const selectedAnnouncement = availableAnnouncements.length > 0 
      ? availableAnnouncements[Math.floor(Math.random() * availableAnnouncements.length)]
      : contextualAnnouncements[Math.floor(Math.random() * contextualAnnouncements.length)];

    setLastAnnouncement(selectedAnnouncement);
    setLastAnnouncementTime(now);
    
    // Update history (keep last 10 announcements)
    setAnnouncementHistory(prev => [...prev.slice(-9), selectedAnnouncement]);
    
    if (isEnabled) {
      setAnnouncementQueue(prev => [...prev, selectedAnnouncement].slice(-3));
    }
  };

  useEffect(() => {
    if (isEnabled) {
      // Vary the interval between 45-90 seconds to feel more natural
      const randomInterval = 45000 + Math.random() * 45000;
      const interval = setInterval(generateContextualAnnouncement, randomInterval);
      return () => clearInterval(interval);
    }
  }, [isEnabled, mood, energy, crowdSize, currentTrack]);

  const playAnnouncement = async (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      // Duck audio before announcement
      onAnnouncementStart?.();
      
      if (voiceSettings.provider === 'elevenlabs') {
        await playElevenLabsVoice(text);
      } else if (voiceSettings.provider === 'openai') {
        await playOpenAIVoice(text);
      } else {
        await playBrowserVoice(text);
      }
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
      // This would require ElevenLabs API key
      console.log('🎤 ElevenLabs voice not implemented yet');
      await playBrowserVoice(text); // Fallback
    } catch (error) {
      console.error('ElevenLabs error:', error);
      await playBrowserVoice(text);
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
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, provider: e.target.value as any }))}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
            >
              <option value="browser">Browser (Free)</option>
              <option value="elevenlabs">ElevenLabs (Premium)</option>
              <option value="openai">OpenAI (Premium)</option>
            </select>
          </div>
          
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
            const testAnnouncement = "This is a test of the AI voice system. How does this sound to you?";
            setLastAnnouncement(testAnnouncement);
            playAnnouncement(testAnnouncement);
          }}
          className="w-full px-2 py-1 bg-blue-500/30 hover:bg-blue-500/50 rounded text-xs transition-colors border border-blue-500/20 flex items-center justify-center"
        >
          <Zap className="w-3 h-3 mr-1" />
          Test Voice
        </button>
      </div>

    </div>
  );
};