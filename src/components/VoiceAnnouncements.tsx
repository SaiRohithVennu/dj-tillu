import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Settings, Play, Pause, RotateCcw } from 'lucide-react';
import { elevenLabsVoice } from '../utils/elevenLabsVoice';

interface VoiceAnnouncementsProps {
  mood: string;
  energy: number;
  crowdSize: number;
  currentTrack: string;
  onAnnouncementStart: () => void;
  onAnnouncementEnd: () => void;
}

interface AnnouncementQueueItem {
  id: string;
  text: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  emotion: 'excited' | 'welcoming' | 'encouraging' | 'professional' | 'celebratory';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<string>('');
  const [announcementQueue, setAnnouncementQueue] = useState<AnnouncementQueueItem[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('pNInz6obpgDQGcFmaJgB'); // Adam voice
  const [voiceVolume, setVoiceVolume] = useState(80);
  const [testMessage, setTestMessage] = useState('');
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processingRef = useRef<boolean>(false);
  const queueIntervalRef = useRef<NodeJS.Timeout>();

  const availableVoices = elevenLabsVoice.getDJVoiceOptions();

  // Listen for AI announcements
  useEffect(() => {
    const handleAIAnnouncement = (event: CustomEvent) => {
      const { message, priority = 'medium', emotion = 'professional' } = event.detail;
      addToQueue(message, priority, emotion);
    };

    const handleImmediateAnnouncement = (event: CustomEvent) => {
      const { message } = event.detail;
      addToQueue(message, 'immediate', 'welcoming');
    };

    window.addEventListener('aiAnnouncement', handleAIAnnouncement as EventListener);
    window.addEventListener('immediateAnnouncement', handleImmediateAnnouncement as EventListener);

    return () => {
      window.removeEventListener('aiAnnouncement', handleAIAnnouncement as EventListener);
      window.removeEventListener('immediateAnnouncement', handleImmediateAnnouncement as EventListener);
    };
  }, []);

  // Process announcement queue
  useEffect(() => {
    if (!isEnabled) return;

    const processQueue = async () => {
      if (processingRef.current || announcementQueue.length === 0) return;

      // Sort by priority
      const sortedQueue = [...announcementQueue].sort((a, b) => {
        const priorityOrder = { immediate: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      const nextAnnouncement = sortedQueue[0];
      if (!nextAnnouncement) return;

      processingRef.current = true;
      setCurrentAnnouncement(nextAnnouncement.text);
      setIsPlaying(true);
      onAnnouncementStart();

      try {
        await playAnnouncement(nextAnnouncement);
        
        // Remove from queue
        setAnnouncementQueue(prev => prev.filter(item => item.id !== nextAnnouncement.id));
        
      } catch (error: any) {
        console.error('Voice announcement failed:', error);
        setError(error.message);
        
        // Try browser speech synthesis as fallback
        try {
          await playBrowserSpeech(nextAnnouncement.text);
        } catch (fallbackError) {
          console.error('Browser speech fallback failed:', fallbackError);
        }
      } finally {
        processingRef.current = false;
        setIsPlaying(false);
        setCurrentAnnouncement('');
        onAnnouncementEnd();
      }
    };

    queueIntervalRef.current = setInterval(processQueue, 1000);

    return () => {
      if (queueIntervalRef.current) {
        clearInterval(queueIntervalRef.current);
      }
    };
  }, [isEnabled, announcementQueue]);

  const addToQueue = (text: string, priority: AnnouncementQueueItem['priority'], emotion: AnnouncementQueueItem['emotion']) => {
    if (!isEnabled || !text.trim()) return;

    const announcement: AnnouncementQueueItem = {
      id: crypto.randomUUID(),
      text: text.trim(),
      priority,
      emotion,
      timestamp: Date.now()
    };

    setAnnouncementQueue(prev => [...prev, announcement]);
    console.log('🎤 Added to voice queue:', text);
  };

  const playAnnouncement = async (announcement: AnnouncementQueueItem) => {
    const settings = {
      ...elevenLabsVoice.getDefaultDJVoiceSettings(),
      voice_id: selectedVoice,
      voice_settings: {
        ...elevenLabsVoice.getDefaultDJVoiceSettings().voice_settings,
        stability: announcement.emotion === 'excited' ? 0.3 : 0.5,
        similarity_boost: 0.8,
        style: announcement.emotion === 'energetic' ? 0.4 : 0.2,
        use_speaker_boost: true
      }
    };

    const audioBuffer = await elevenLabsVoice.generateSpeech(announcement.text, settings);
    if (audioBuffer) {
      await elevenLabsVoice.playAudio(audioBuffer);
    }
  };

  const playBrowserSpeech = (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = voiceVolume / 100;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);

      speechSynthesis.speak(utterance);
    });
  };

  const testVoice = async () => {
    if (!testMessage.trim()) return;

    setIsTestingVoice(true);
    setError(null);

    try {
      await elevenLabsVoice.testVoice(selectedVoice);
    } catch (error: any) {
      setError(error.message);
      // Fallback to browser speech
      try {
        await playBrowserSpeech(testMessage);
      } catch (fallbackError) {
        console.error('Voice test failed completely:', fallbackError);
      }
    } finally {
      setIsTestingVoice(false);
    }
  };

  const clearQueue = () => {
    setAnnouncementQueue([]);
    setCurrentAnnouncement('');
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
          <Mic className="w-5 h-5 text-purple-400" />
          <span className="text-white font-medium">Voice System</span>
          {isPlaying && (
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
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

      {/* Current Announcement */}
      {currentAnnouncement && (
        <div className="bg-purple-600/20 border border-purple-500/40 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Mic className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-purple-300 font-medium">Speaking...</span>
          </div>
          <p className="text-white text-sm italic">"{currentAnnouncement}"</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3">
          <p className="text-red-300 text-sm">{error}</p>
          <p className="text-red-200 text-xs mt-1">Using browser speech as fallback</p>
        </div>
      )}

      {/* Voice Settings */}
      <div className="bg-white/10 rounded-lg p-3 border border-white/20">
        <h4 className="text-sm font-medium text-white mb-3">Voice Settings</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-300 mb-1">Voice Character</label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            >
              {availableVoices.map(voice => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} - {voice.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-300 mb-1">Volume: {voiceVolume}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={voiceVolume}
              onChange={(e) => setVoiceVolume(Number(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Voice Test */}
      <div className="bg-white/10 rounded-lg p-3 border border-white/20">
        <h4 className="text-sm font-medium text-white mb-2">Test Voice</h4>
        <div className="space-y-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter test message..."
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
          <button
            onClick={testVoice}
            disabled={isTestingVoice || !testMessage.trim()}
            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded transition-colors text-sm"
          >
            {isTestingVoice ? 'Testing...' : 'Test Voice'}
          </button>
        </div>
      </div>

      {/* Announcement Queue */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-white">Queue ({announcementQueue.length})</h4>
          {announcementQueue.length > 0 && (
            <button
              onClick={clearQueue}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Clear All
            </button>
          )}
        </div>
        
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {announcementQueue.map((item, index) => (
            <div
              key={item.id}
              className="p-2 bg-white/5 rounded text-xs"
            >
              <div className="flex items-center justify-between">
                <span className={`font-medium ${getPriorityColor(item.priority)}`}>
                  #{index + 1} {item.priority.toUpperCase()}
                </span>
                <span className="text-gray-400">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-gray-300 mt-1 truncate">"{item.text}"</p>
            </div>
          ))}
          
          {announcementQueue.length === 0 && (
            <div className="text-center py-4">
              <MicOff className="w-6 h-6 text-gray-500 mx-auto mb-1" />
              <p className="text-xs text-gray-400">No announcements queued</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Announcements */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => addToQueue(`The energy is ${energy > 70 ? 'incredible' : 'building'} tonight!`, 'medium', 'excited')}
          className="px-2 py-1 bg-yellow-600/30 hover:bg-yellow-600/50 rounded text-xs transition-colors"
        >
          Energy Check
        </button>
        <button
          onClick={() => addToQueue(`We have ${crowdSize} amazing people here!`, 'medium', 'welcoming')}
          className="px-2 py-1 bg-green-600/30 hover:bg-green-600/50 rounded text-xs transition-colors"
        >
          Crowd Count
        </button>
        <button
          onClick={() => addToQueue(`Now playing ${currentTrack}!`, 'low', 'professional')}
          className="px-2 py-1 bg-blue-600/30 hover:bg-blue-600/50 rounded text-xs transition-colors"
        >
          Track Info
        </button>
        <button
          onClick={() => addToQueue(`Let's keep this ${mood} vibe going!`, 'medium', 'encouraging')}
          className="px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 rounded text-xs transition-colors"
        >
          Mood Boost
        </button>
      </div>

      {/* Status Info */}
      <div className="bg-purple-600/10 rounded-lg p-2 border border-purple-500/20">
        <p className="text-xs text-gray-300 text-center">
          <strong>ElevenLabs Voice AI</strong><br />
          {isEnabled ? 'Ready for announcements' : 'Voice system disabled'}
        </p>
      </div>
    </div>
  );
};