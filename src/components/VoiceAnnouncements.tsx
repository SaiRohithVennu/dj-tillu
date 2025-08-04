import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, Clock, Zap, Pause, Play } from 'lucide-react';

interface VoiceAnnouncementsProps {
  mood: string;
  energy: number;
  crowdSize: number;
  currentTrack: string;
  onAnnouncementStart?: () => void;
  onAnnouncementEnd?: () => void;
}

interface AnnouncementQueueItem {
  id: string;
  message: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  timestamp: number;
  type: 'vip' | 'mood' | 'general' | 'speech_pause';
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
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<string>('');
  const [announcementQueue, setAnnouncementQueue] = useState<AnnouncementQueueItem[]>([]);
  const [lastAnnouncement, setLastAnnouncement] = useState<Date | null>(null);
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8
  });
  const [speechDetected, setSpeechDetected] = useState(false);
  const [queuePaused, setQueuePaused] = useState(false);

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const queueProcessorRef = useRef<NodeJS.Timeout>();
  const speechDetectionRef = useRef<NodeJS.Timeout>();

  // ElevenLabs configuration
  const elevenLabsConfig = {
    apiKey: 'sk_07c70c046693c3952aeb0e20b4df14c74e90a2cfb06aece8',
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - Professional male voice
    modelId: 'eleven_multilingual_v2'
  };

  // Listen for global announcement events
  useEffect(() => {
    const handleImmediateAnnouncement = (event: CustomEvent) => {
      const { message } = event.detail;
      addToQueue(message, 'immediate', 'general');
    };

    const handlePersonAnnouncement = (event: CustomEvent) => {
      const { personName, message } = event.detail;
      addToQueue(message, 'high', 'vip');
    };

    const handleSpeechDetection = (event: CustomEvent) => {
      const { isActive } = event.detail;
      setSpeechDetected(isActive);
      
      if (isActive) {
        setQueuePaused(true);
        console.log('🎤 Speech detected - pausing announcements');
      } else {
        // Resume after 2 seconds to ensure speech has fully ended
        setTimeout(() => {
          setQueuePaused(false);
          console.log('🎤 Speech ended - resuming announcements');
        }, 2000);
      }
    };

    window.addEventListener('immediateAnnouncement', handleImmediateAnnouncement as EventListener);
    window.addEventListener('personAnnouncement', handlePersonAnnouncement as EventListener);
    window.addEventListener('speechDetection', handleSpeechDetection as EventListener);

    return () => {
      window.removeEventListener('immediateAnnouncement', handleImmediateAnnouncement as EventListener);
      window.removeEventListener('personAnnouncement', handlePersonAnnouncement as EventListener);
      window.removeEventListener('speechDetection', handleSpeechDetection as EventListener);
    };
  }, []);

  // Add announcement to queue
  const addToQueue = (message: string, priority: AnnouncementQueueItem['priority'], type: AnnouncementQueueItem['type']) => {
    if (!isEnabled) return;

    // Check for recent similar announcements to avoid spam
    const recentSimilar = announcementQueue.find(item => 
      item.message.toLowerCase().includes(message.toLowerCase().substring(0, 20)) &&
      (Date.now() - item.timestamp) < 30000 // 30 seconds
    );

    if (recentSimilar && type !== 'immediate') {
      console.log('🎤 Skipping similar recent announcement');
      return;
    }

    const newItem: AnnouncementQueueItem = {
      id: crypto.randomUUID(),
      message,
      priority,
      timestamp: Date.now(),
      type
    };

    setAnnouncementQueue(prev => {
      const updated = [...prev, newItem];
      // Sort by priority: immediate > high > medium > low
      const priorityOrder = { immediate: 0, high: 1, medium: 2, low: 3 };
      return updated.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    });

    console.log(`🎤 Added to announcement queue: ${message} (${priority})`);
  };

  // Process announcement queue
  useEffect(() => {
    const processQueue = async () => {
      if (queuePaused || speechDetected || isAnnouncing || announcementQueue.length === 0) {
        return;
      }

      // Check rate limiting (minimum 5 seconds between announcements)
      if (lastAnnouncement && (Date.now() - lastAnnouncement.getTime()) < 5000) {
        return;
      }

      const nextAnnouncement = announcementQueue[0];
      
      // Remove from queue
      setAnnouncementQueue(prev => prev.slice(1));
      
      // Process announcement
      await playAnnouncement(nextAnnouncement.message);
    };

    // Process queue every 2 seconds
    queueProcessorRef.current = setInterval(processQueue, 2000);

    return () => {
      if (queueProcessorRef.current) {
        clearInterval(queueProcessorRef.current);
      }
    };
  }, [queuePaused, speechDetected, isAnnouncing, announcementQueue, lastAnnouncement]);

  // Play announcement using ElevenLabs or fallback to browser speech
  const playAnnouncement = async (message: string) => {
    if (!isEnabled || isAnnouncing) return;

    setIsAnnouncing(true);
    setCurrentAnnouncement(message);
    
    if (onAnnouncementStart) {
      onAnnouncementStart();
    }

    try {
      // Try ElevenLabs first
      const success = await playElevenLabsAnnouncement(message);
      
      if (!success) {
        // Fallback to browser speech synthesis
        await playBrowserSpeech(message);
      }

    } catch (error) {
      console.error('🎤 Announcement failed:', error);
      // Final fallback to browser speech
      await playBrowserSpeech(message);
    } finally {
      setIsAnnouncing(false);
      setCurrentAnnouncement('');
      setLastAnnouncement(new Date());
      
      if (onAnnouncementEnd) {
        onAnnouncementEnd();
      }
    }
  };

  // ElevenLabs text-to-speech
  const playElevenLabsAnnouncement = async (message: string): Promise<boolean> => {
    try {
      console.log('🎤 Using ElevenLabs for announcement:', message);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsConfig.voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': elevenLabsConfig.apiKey,
          },
          body: JSON.stringify({
            text: message,
            model_id: elevenLabsConfig.modelId,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.8,
              style: 0.2,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      
      return new Promise((resolve) => {
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        
        audio.volume = voiceSettings.volume;
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          resolve(true);
        };
        
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          resolve(false);
        };

        audio.play().catch(() => resolve(false));
      });

    } catch (error) {
      console.error('🎤 ElevenLabs failed:', error);
      return false;
    }
  };

  // Browser speech synthesis fallback
  const playBrowserSpeech = async (message: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.warn('🎤 Speech synthesis not supported');
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.volume = voiceSettings.volume;
      
      // Try to use a good voice
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.lang.startsWith('en')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      speechSynthesis.speak(utterance);
      console.log('🎤 Using browser speech synthesis');
    });
  };

  // Stop current announcement
  const stopAnnouncement = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    setIsAnnouncing(false);
    setCurrentAnnouncement('');
    
    if (onAnnouncementEnd) {
      onAnnouncementEnd();
    }
  };

  // Clear queue
  const clearQueue = () => {
    setAnnouncementQueue([]);
    console.log('🎤 Announcement queue cleared');
  };

  // Generate contextual announcement
  const generateContextualAnnouncement = () => {
    const announcements = [
      `The energy is ${energy > 70 ? 'incredible' : energy > 40 ? 'good' : 'building'} with ${crowdSize} people here!`,
      `Feeling those ${mood.toLowerCase()} vibes! Keep it going everyone!`,
      `${currentTrack} is hitting different with this crowd!`,
      `${crowdSize} people strong and the energy is ${energy}%! Let's go!`
    ];

    const randomAnnouncement = announcements[Math.floor(Math.random() * announcements.length)];
    addToQueue(randomAnnouncement, 'low', 'general');
  };

  const formatTime = (date: Date | null) => {
    return date ? date.toLocaleTimeString() : 'Never';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Mic className="w-5 h-5 text-yellow-400" />
          <span className="text-white font-medium">Voice System</span>
          {isAnnouncing && (
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setQueuePaused(!queuePaused)}
            className={`p-1 rounded transition-colors ${
              queuePaused ? 'bg-red-500/30 text-red-300' : 'bg-green-500/30 text-green-300'
            }`}
            title={queuePaused ? 'Resume queue' : 'Pause queue'}
          >
            {queuePaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>
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
      </div>

      {/* Speech Detection Status */}
      {speechDetected && (
        <div className="bg-orange-600/20 border border-orange-500/40 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-orange-300 text-sm">Speech detected - announcements paused</span>
          </div>
          <p className="text-xs text-orange-200 mt-1">
            Will resume when speech ends
          </p>
        </div>
      )}

      {/* Current Status */}
      <div className="bg-white/10 rounded-lg p-3 border border-white/20">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Status:</span>
            <span className={`font-semibold ${
              speechDetected ? 'text-orange-300' :
              queuePaused ? 'text-red-300' :
              isAnnouncing ? 'text-yellow-300' : 
              isEnabled ? 'text-green-300' : 'text-red-300'
            }`}>
              {speechDetected ? 'Speech Detected' :
               queuePaused ? 'Paused' :
               isAnnouncing ? 'Announcing' : 
               isEnabled ? 'Ready' : 'Disabled'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-300">Queue:</span>
            <span className="text-purple-300 font-semibold">{announcementQueue.length} pending</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-300">Last:</span>
            <span className="text-gray-400">{formatTime(lastAnnouncement)}</span>
          </div>
        </div>
      </div>

      {/* Current Announcement */}
      {isAnnouncing && currentAnnouncement && (
        <div className="bg-yellow-600/20 border border-yellow-500/40 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-300 font-medium flex items-center">
              <Volume2 className="w-4 h-4 mr-1" />
              Now Speaking
            </span>
            <button
              onClick={stopAnnouncement}
              className="p-1 bg-red-500/30 hover:bg-red-500/50 rounded transition-colors"
            >
              <VolumeX className="w-3 h-3 text-red-300" />
            </button>
          </div>
          <p className="text-white text-sm italic">"{currentAnnouncement}"</p>
        </div>
      )}

      {/* Announcement Queue */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-300">Queue ({announcementQueue.length})</h4>
          {announcementQueue.length > 0 && (
            <button
              onClick={clearQueue}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
        
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {announcementQueue.slice(0, 5).map((item, index) => (
            <div
              key={item.id}
              className={`p-2 rounded text-xs ${
                index === 0 ? 'bg-yellow-600/20 border border-yellow-500/30' : 'bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-medium ${getPriorityColor(item.priority)}`}>
                  {item.priority.toUpperCase()}
                </span>
                <span className="text-gray-400">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-gray-300 truncate">"{item.message}"</p>
            </div>
          ))}
          
          {announcementQueue.length === 0 && (
            <div className="text-center py-4">
              <MessageSquare className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No announcements queued</p>
            </div>
          )}
        </div>
      </div>

      {/* Voice Settings */}
      <div className="bg-purple-600/10 rounded-lg p-3 border border-purple-500/20">
        <h4 className="text-sm font-medium text-purple-300 mb-2">Voice Settings</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-300 mb-1">Speed</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceSettings.rate}
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-purple-300">{voiceSettings.rate}x</span>
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={voiceSettings.volume}
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-purple-300">{Math.round(voiceSettings.volume * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <button
          onClick={generateContextualAnnouncement}
          disabled={!isEnabled || isAnnouncing}
          className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center"
        >
          <Zap className="w-4 h-4 mr-2" />
          Contextual Announcement
        </button>
      </div>

      {/* Info */}
      <div className="bg-yellow-600/10 rounded-lg p-2 border border-yellow-500/20">
        <p className="text-xs text-gray-300 text-center">
          <strong>Smart Voice System</strong><br />
          {isEnabled 
            ? 'ElevenLabs AI voice with browser speech fallback. Automatically pauses during detected speech.'
            : 'Voice announcements disabled'
          }
        </p>
      </div>
    </div>
  );
};