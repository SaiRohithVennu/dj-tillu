import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Mic, MicOff, Settings, Play, Pause, RotateCcw } from 'lucide-react';
import { elevenLabsVoice } from '../utils/elevenLabsVoice';

interface VoiceAnnouncementsProps {
  mood: string;
  energy: number;
  crowdSize: number;
  currentTrack: string;
  onAnnouncementStart?: () => void;
  onAnnouncementEnd?: () => void;
}

interface AnnouncementItem {
  id: string;
  message: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  timestamp: number;
  type: 'ai' | 'manual' | 'vip' | 'system';
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
  const [volume, setVolume] = useState(80);
  const [queue, setQueue] = useState<AnnouncementItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<AnnouncementItem | null>(null);
  const [voiceSettings, setVoiceSettings] = useState(elevenLabsVoice.getDefaultDJVoiceSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [lastAnnouncement, setLastAnnouncement] = useState<string>('');
  const [announcementHistory, setAnnouncementHistory] = useState<string[]>([]);

  const processingRef = useRef(false);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Process announcement queue
  const processQueue = async () => {
    if (processingRef.current || queue.length === 0 || !isEnabled) return;

    processingRef.current = true;
    setIsProcessing(true);

    const nextAnnouncement = queue[0];
    setCurrentAnnouncement(nextAnnouncement);
    setQueue(prev => prev.slice(1));

    try {
      console.log('🎤 Processing announcement:', nextAnnouncement.message);
      
      if (onAnnouncementStart) {
        onAnnouncementStart();
      }

      // Try ElevenLabs first, fallback to browser speech
      try {
        await playElevenLabsVoice(nextAnnouncement.message);
      } catch (elevenLabsError: any) {
        console.warn('⚠️ ElevenLabs unavailable, using browser speech:', elevenLabsError.message);
        await playBrowserVoice(nextAnnouncement.message);
      }

      // Update history
      setLastAnnouncement(nextAnnouncement.message);
      setAnnouncementHistory(prev => [...prev.slice(-4), nextAnnouncement.message]);

    } catch (error) {
      console.error('❌ Announcement failed:', error);
    } finally {
      setCurrentAnnouncement(null);
      setIsProcessing(false);
      processingRef.current = false;

      if (onAnnouncementEnd) {
        onAnnouncementEnd();
      }

      // Process next item in queue after a short delay
      setTimeout(() => {
        if (queue.length > 0) {
          processQueue();
        }
      }, 1000);
    }
  };

  // Play announcement using ElevenLabs
  const playElevenLabsVoice = async (message: string) => {
    try {
      const audioBuffer = await elevenLabsVoice.generateSpeech(message, voiceSettings);
      if (audioBuffer) {
        await elevenLabsVoice.playAudio(audioBuffer);
        console.log('✅ ElevenLabs announcement completed');
      } else {
        throw new Error('No audio buffer generated');
      }
    } catch (error: any) {
      // Check if it's a quota error
      if (error.message.includes('quota_exceeded')) {
        console.warn('⚠️ ElevenLabs quota exceeded, falling back to browser speech');
        throw new Error('ElevenLabs quota exceeded');
      }
      console.warn('⚠️ ElevenLabs failed, falling back to browser speech:', error.message);
      throw error;
    }
  };

  // Fallback to browser speech synthesis
  const playBrowserVoice = async (message: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(message);
      speechSynthesisRef.current = utterance;

      // Configure voice settings
      utterance.volume = volume / 100;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      // Try to use a good voice
      const voices = window.speechSynthesis.getVoices();
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

      window.speechSynthesis.speak(utterance);
    });
  };

  // Add announcement to queue
  const addAnnouncement = (
    message: string, 
    priority: AnnouncementItem['priority'] = 'medium',
    type: AnnouncementItem['type'] = 'manual'
  ) => {
    const announcement: AnnouncementItem = {
      id: crypto.randomUUID(),
      message: message.trim(),
      priority,
      timestamp: Date.now(),
      type
    };

    setQueue(prev => {
      // Insert based on priority
      const newQueue = [...prev, announcement];
      return newQueue.sort((a, b) => {
        const priorityOrder = { immediate: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    });

    console.log('📢 Added announcement to queue:', message);
  };

  // Process queue when items are added
  useEffect(() => {
    if (queue.length > 0 && !processingRef.current) {
      processQueue();
    }
  }, [queue]);

  // Listen for global announcement events
  useEffect(() => {
    const handleImmediateAnnouncement = (event: CustomEvent) => {
      addAnnouncement(event.detail.message, 'immediate', 'ai');
    };

    const handlePersonAnnouncement = (event: CustomEvent) => {
      addAnnouncement(event.detail.message, 'high', 'vip');
    };

    window.addEventListener('immediateAnnouncement', handleImmediateAnnouncement as EventListener);
    window.addEventListener('personAnnouncement', handlePersonAnnouncement as EventListener);

    // Expose function for external calls
    (window as any).triggerPersonAnnouncement = (personName: string, message: string) => {
      addAnnouncement(message, 'high', 'vip');
    };

    return () => {
      window.removeEventListener('immediateAnnouncement', handleImmediateAnnouncement as EventListener);
      window.removeEventListener('personAnnouncement', handlePersonAnnouncement as EventListener);
      delete (window as any).triggerPersonAnnouncement;
    };
  }, []);

  // Stop current announcement
  const stopCurrentAnnouncement = () => {
    // Stop ElevenLabs audio
    if ((elevenLabsVoice as any).currentAudio) {
      (elevenLabsVoice as any).currentAudio.pause();
      (elevenLabsVoice as any).currentAudio = null;
    }

    // Stop browser speech
    if (speechSynthesisRef.current) {
      window.speechSynthesis.cancel();
      speechSynthesisRef.current = null;
    }

    setCurrentAnnouncement(null);
    setIsProcessing(false);
    processingRef.current = false;

    if (onAnnouncementEnd) {
      onAnnouncementEnd();
    }
  };

  // Clear queue
  const clearQueue = () => {
    setQueue([]);
    stopCurrentAnnouncement();
  };

  // Test voice
  const testVoice = () => {
    const testMessage = `Hello! This is your AI DJ testing the voice system. Current mood is ${mood} with ${energy}% energy!`;
    addAnnouncement(testMessage, 'immediate', 'system');
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ai': return '🤖';
      case 'vip': return '⭐';
      case 'system': return '⚙️';
      default: return '🎤';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Mic className="w-5 h-5 text-pink-400" />
          <span className="text-white font-medium">Voice System</span>
          {isProcessing && (
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <Settings className="w-3 h-3" />
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

      {/* Voice Settings */}
      {showSettings && (
        <div className="bg-white/10 rounded-lg p-3 border border-white/20 space-y-3">
          <h4 className="text-sm font-medium text-white">Voice Settings</h4>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">Volume</label>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-gray-400">{volume}%</span>
          </div>

          <div>
            <label className="block text-xs text-gray-300 mb-1">Voice</label>
            <select
              value={voiceSettings.voice_id}
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, voice_id: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
            >
              {elevenLabsVoice.getDJVoiceOptions().map(voice => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} - {voice.description}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={testVoice}
            className="w-full px-3 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors text-sm"
          >
            Test Voice
          </button>
        </div>
      )}

      {/* Current Status */}
      <div className={`bg-white/10 rounded-lg p-3 border border-white/20 ${!isEnabled ? 'opacity-50' : ''}`}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Status:</span>
            <span className={`font-semibold ${
              !isEnabled ? 'text-gray-400' :
              isProcessing ? 'text-yellow-300' : 'text-green-300'
            }`}>
              {!isEnabled ? 'Disabled' :
               isProcessing ? 'Speaking...' : 'Ready'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-300">Queue:</span>
            <span className="text-purple-300 font-semibold">{queue.length}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-300">Voice Engine:</span>
            <span className="text-blue-300">ElevenLabs + Browser</span>
          </div>
        </div>
      </div>

      {/* Current Announcement */}
      {currentAnnouncement && (
        <div className="bg-pink-600/20 rounded-lg p-3 border border-pink-500/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-pink-300 font-medium text-sm">Now Speaking</span>
            <button
              onClick={stopCurrentAnnouncement}
              className="p-1 bg-red-500/30 hover:bg-red-500/50 rounded transition-colors"
            >
              <Pause className="w-3 h-3 text-red-300" />
            </button>
          </div>
          <p className="text-white text-sm italic">"{currentAnnouncement.message}"</p>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className={`${getPriorityColor(currentAnnouncement.priority)} font-medium`}>
              {currentAnnouncement.priority.toUpperCase()}
            </span>
            <span className="text-gray-400">
              {getTypeIcon(currentAnnouncement.type)} {currentAnnouncement.type}
            </span>
          </div>
        </div>
      )}

      {/* Queue Display */}
      {queue.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-300">Queue ({queue.length})</h4>
            <button
              onClick={clearQueue}
              className="px-2 py-1 bg-red-500/30 hover:bg-red-500/50 rounded text-xs transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {queue.slice(0, 5).map((item, index) => (
              <div
                key={item.id}
                className="p-2 bg-white/5 rounded text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium ${getPriorityColor(item.priority)}`}>
                    #{index + 1} {item.priority.toUpperCase()}
                  </span>
                  <span className="text-gray-400">
                    {getTypeIcon(item.type)}
                  </span>
                </div>
                <p className="text-gray-300 truncate">"{item.message}"</p>
              </div>
            ))}
            {queue.length > 5 && (
              <p className="text-xs text-gray-400 text-center py-1">
                +{queue.length - 5} more in queue
              </p>
            )}
          </div>
        </div>
      )}

      {/* Last Announcement */}
      {lastAnnouncement && !currentAnnouncement && (
        <div className="bg-gray-600/20 rounded-lg p-3 border border-gray-500/30">
          <h4 className="text-sm font-medium text-gray-300 mb-1">Last Announcement</h4>
          <p className="text-gray-300 text-sm italic">"{lastAnnouncement}"</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-2">
        <button
          onClick={testVoice}
          disabled={!isEnabled || isProcessing}
          className="w-full px-3 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center"
        >
          <Mic className="w-4 h-4 mr-2" />
          Test Voice
        </button>
      </div>

      {/* Context Info */}
      <div className="bg-pink-600/10 rounded-lg p-3 border border-pink-500/20">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-300">Mood:</span>
            <span className="text-pink-300 capitalize">{mood}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Energy:</span>
            <span className="text-pink-300">{energy}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Crowd:</span>
            <span className="text-pink-300">{crowdSize}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Track:</span>
            <span className="text-pink-300 truncate">{currentTrack}</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className={`bg-pink-600/10 rounded-lg p-2 border border-pink-500/20 ${!isEnabled ? 'opacity-50' : ''}`}>
        <p className="text-xs text-gray-300 text-center">
          <strong>Professional AI Voice</strong><br />
          {isEnabled ? 'ElevenLabs + Browser Speech fallback' : 'Voice announcements disabled'}
        </p>
      </div>
    </div>
  );
};