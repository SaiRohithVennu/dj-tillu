import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, Clock, Users } from 'lucide-react';
import { elevenLabsVoice } from '../utils/elevenLabsVoice';

interface VoiceAnnouncementsProps {
  mood: string;
  energy: number;
  crowdSize: number;
  currentTrack: string;
  onAnnouncementStart?: () => void;
  onAnnouncementEnd?: () => void;
}

interface AnnouncementQueue {
  id: string;
  message: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  timestamp: number;
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<string>('');
  const [announcementQueue, setAnnouncementQueue] = useState<AnnouncementQueue[]>([]);
  const [lastContextualAnnouncement, setLastContextualAnnouncement] = useState<number>(0);
  const [voiceSettings, setVoiceSettings] = useState({
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - Professional male voice
    speed: 1.0,
    volume: 0.8
  });

  const processingRef = useRef<boolean>(false);
  const queueTimeoutRef = useRef<NodeJS.Timeout>();

  // Process announcement queue sequentially
  const processQueue = async () => {
    if (processingRef.current || announcementQueue.length === 0 || !isEnabled) {
      return;
    }

    processingRef.current = true;
    const nextAnnouncement = announcementQueue[0];
    
    try {
      setCurrentAnnouncement(nextAnnouncement.message);
      setIsSpeaking(true);
      
      if (onAnnouncementStart) {
        onAnnouncementStart();
      }

      await playElevenLabsVoice(nextAnnouncement.message);

      // Remove processed announcement from queue
      setAnnouncementQueue(prev => prev.slice(1));
      
    } catch (error) {
      console.error('❌ Voice announcement failed:', error);
      // Remove failed announcement and continue with queue
      setAnnouncementQueue(prev => prev.slice(1));
    } finally {
      setIsSpeaking(false);
      setCurrentAnnouncement('');
      processingRef.current = false;
      
      if (onAnnouncementEnd) {
        onAnnouncementEnd();
      }

      // Process next item in queue after a short delay
      if (announcementQueue.length > 1) {
        queueTimeoutRef.current = setTimeout(processQueue, 1000);
      }
    }
  };

  // Add announcement to queue
  const queueAnnouncement = (message: string, priority: 'immediate' | 'high' | 'medium' | 'low' = 'medium') => {
    if (!isEnabled || !message.trim()) return;

    const announcement: AnnouncementQueue = {
      id: `${Date.now()}-${Math.random()}`,
      message: message.trim(),
      priority,
      timestamp: Date.now()
    };

    setAnnouncementQueue(prev => {
      const newQueue = [...prev, announcement];
      
      // Sort by priority (immediate > high > medium > low)
      const priorityOrder = { immediate: 0, high: 1, medium: 2, low: 3 };
      return newQueue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    });

    console.log(`🎤 Queued announcement (${priority}):`, message);
  };

  // Process queue when new items are added
  useEffect(() => {
    if (announcementQueue.length > 0 && !processingRef.current) {
      processQueue();
    }
  }, [announcementQueue.length]);

  // Play announcement using ElevenLabs with error handling
  const playElevenLabsVoice = async (text: string): Promise<void> => {
    try {
      console.log('🎤 ElevenLabs: Starting speech generation...');
      
      const settings = {
        voice_id: voiceSettings.voiceId,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true,
        },
      };

      const audioBuffer = await elevenLabsVoice.generateSpeech(text, settings);
      
      if (audioBuffer) {
        await elevenLabsVoice.playAudio(audioBuffer);
        console.log('✅ ElevenLabs announcement completed');
      } else {
        throw new Error('No audio buffer generated');
      }
      
    } catch (error: any) {
      console.error('❌ ElevenLabs speech generation failed:', error);
      
      // Fallback to browser speech synthesis
      console.log('🔄 Falling back to browser speech synthesis...');
      await playBrowserVoice(text);
    }
  };

  // Fallback browser speech synthesis
  const playBrowserVoice = async (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceSettings.speed;
      utterance.volume = voiceSettings.volume;
      utterance.pitch = 1.0;

      // Try to find a good voice
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.lang.startsWith('en')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        console.log('✅ Browser speech completed');
        resolve();
      };
      
      utterance.onerror = (error) => {
        console.error('❌ Browser speech error:', error);
        reject(error);
      };

      speechSynthesis.speak(utterance);
    });
  };

  // Listen for global announcement events
  useEffect(() => {
    const handleImmediateAnnouncement = (event: CustomEvent) => {
      const { message } = event.detail;
      queueAnnouncement(message, 'immediate');
    };

    const handlePersonAnnouncement = (event: CustomEvent) => {
      const { personName, message } = event.detail;
      queueAnnouncement(message || `Welcome ${personName}!`, 'high');
    };

    window.addEventListener('immediateAnnouncement', handleImmediateAnnouncement as EventListener);
    window.addEventListener('personAnnouncement', handlePersonAnnouncement as EventListener);

    return () => {
      window.removeEventListener('immediateAnnouncement', handleImmediateAnnouncement as EventListener);
      window.removeEventListener('personAnnouncement', handlePersonAnnouncement as EventListener);
    };
  }, []);

  // Contextual announcements based on mood/energy changes
  useEffect(() => {
    if (!isEnabled) return;

    const now = Date.now();
    const timeSinceLastContextual = now - lastContextualAnnouncement;

    // Only make contextual announcements every 2 minutes to avoid spam
    if (timeSinceLastContextual < 120000) return;

    // Generate contextual announcements based on crowd changes
    if (energy > 80 && crowdSize > 5) {
      queueAnnouncement("The energy in here is absolutely incredible! Keep it going!", 'low');
      setLastContextualAnnouncement(now);
    } else if (energy < 30 && crowdSize > 3) {
      queueAnnouncement("Let's bring that energy up! Time to get moving!", 'low');
      setLastContextualAnnouncement(now);
    } else if (crowdSize > 10) {
      queueAnnouncement("Wow! Look at this amazing crowd! You all look fantastic!", 'low');
      setLastContextualAnnouncement(now);
    }
  }, [mood, energy, crowdSize, isEnabled, lastContextualAnnouncement]);

  // Test voice function
  const testVoice = () => {
    queueAnnouncement("Voice test! This is your AI DJ speaking. How does this sound?", 'immediate');
  };

  // Clear queue
  const clearQueue = () => {
    setAnnouncementQueue([]);
    if (queueTimeoutRef.current) {
      clearTimeout(queueTimeoutRef.current);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Voice Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isSpeaking ? (
            <Mic className="w-5 h-5 text-green-400 animate-pulse" />
          ) : (
            <MicOff className="w-5 h-5 text-gray-400" />
          )}
          <span className="text-white font-medium">Voice Announcements</span>
          {isSpeaking && (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          )}
        </div>
        <button
          onClick={() => setIsEnabled(!isEnabled)}
          className={`px-3 py-1 rounded text-xs transition-colors ${
            isEnabled 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Current Status */}
      <div className={`bg-white/10 rounded-lg p-3 border border-white/20 ${!isEnabled ? 'opacity-50' : ''}`}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Status:</span>
            <span className={`font-semibold ${
              isSpeaking ? 'text-green-300' : 
              isEnabled ? 'text-blue-300' : 'text-red-300'
            }`}>
              {isSpeaking ? 'Speaking' :
               isEnabled ? 'Ready' : 'Disabled'}
            </span>
          </div>
          
          {currentAnnouncement && (
            <div>
              <span className="text-gray-300">Current:</span>
              <p className="text-white text-xs mt-1 italic">"{currentAnnouncement}"</p>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-300">Queue:</span>
            <span className="text-purple-300 font-semibold">{announcementQueue.length}</span>
          </div>
        </div>
      </div>

      {/* Voice Settings */}
      <div className={`space-y-3 ${!isEnabled ? 'opacity-50' : ''}`}>
        <div>
          <label className="block text-xs text-gray-300 mb-1">Voice</label>
          <select
            value={voiceSettings.voiceId}
            onChange={(e) => setVoiceSettings(prev => ({ ...prev, voiceId: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
            disabled={isSpeaking}
          >
            {elevenLabsVoice.getDJVoiceOptions().map(voice => (
              <option key={voice.id} value={voice.id}>
                {voice.name} - {voice.description}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-300 mb-1">Speed</label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={voiceSettings.speed}
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, speed: Number(e.target.value) }))}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              disabled={isSpeaking}
            />
            <span className="text-xs text-gray-400">{voiceSettings.speed}x</span>
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
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              disabled={isSpeaking}
            />
            <span className="text-xs text-gray-400">{Math.round(voiceSettings.volume * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Queue Display */}
      {announcementQueue.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-medium text-gray-300">Announcement Queue</h4>
            <button
              onClick={clearQueue}
              className="text-xs text-red-400 hover:text-red-300"
              disabled={isSpeaking}
            >
              Clear
            </button>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {announcementQueue.slice(0, 3).map((announcement, index) => (
              <div
                key={announcement.id}
                className={`p-2 rounded text-xs ${
                  index === 0 && isSpeaking
                    ? 'bg-green-500/20 border border-green-500/40'
                    : 'bg-white/5 border border-white/20'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-medium text-xs ${
                    announcement.priority === 'immediate' ? 'text-red-300' :
                    announcement.priority === 'high' ? 'text-orange-300' :
                    announcement.priority === 'medium' ? 'text-yellow-300' : 'text-green-300'
                  }`}>
                    {announcement.priority.toUpperCase()}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {formatTime(announcement.timestamp)}
                  </span>
                </div>
                <p className="text-gray-300 truncate">"{announcement.message}"</p>
              </div>
            ))}
            {announcementQueue.length > 3 && (
              <div className="text-center text-xs text-gray-400 py-1">
                +{announcementQueue.length - 3} more...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="space-y-2">
        <button
          onClick={testVoice}
          disabled={!isEnabled}
          className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-sm"
        >
          Test Voice
        </button>
      </div>

      {/* Context Info */}
      <div className={`bg-purple-600/10 rounded-lg p-2 border border-purple-500/20 ${!isEnabled ? 'opacity-50' : ''}`}>
        <div className="grid grid-cols-3 gap-2 text-xs text-center">
          <div>
            <div className="text-purple-300 font-semibold">{mood}</div>
            <div className="text-gray-400">Mood</div>
          </div>
          <div>
            <div className="text-purple-300 font-semibold">{energy}%</div>
            <div className="text-gray-400">Energy</div>
          </div>
          <div>
            <div className="text-purple-300 font-semibold">{crowdSize}</div>
            <div className="text-gray-400">Crowd</div>
          </div>
        </div>
        <p className="text-xs text-gray-300 text-center mt-2">
          <strong>ElevenLabs Voice</strong> with fallback to browser speech
        </p>
      </div>
    </div>
  );
};