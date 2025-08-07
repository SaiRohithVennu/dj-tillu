import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Settings, Play, Pause, SkipForward, Trash2, MessageSquare } from 'lucide-react';
import { elevenLabsVoice } from '../utils/elevenLabsVoice';

interface Announcement {
  id: string;
  message: string;
  timestamp: Date;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  status: 'pending' | 'playing' | 'completed' | 'failed';
}

interface VoiceAnnouncementsProps {
  announcements: Announcement[];
  onAddAnnouncement: (message: string, priority?: 'immediate' | 'high' | 'medium' | 'low') => void;
  onClearAnnouncements: () => void;
}

export const VoiceAnnouncements: React.FC<VoiceAnnouncementsProps> = ({
  announcements,
  onAddAnnouncement,
  onClearAnnouncements
}) => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [voiceEngine, setVoiceEngine] = useState<'elevenlabs' | 'browser'>('elevenlabs');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [queue, setQueue] = useState<Announcement[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam voice
    speed: 1.0,
    volume: 0.8
  });
  const [showSettings, setShowSettings] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const processingRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Process announcement queue
  const processQueue = async () => {
    if (processingRef.current || queue.length === 0 || !isVoiceEnabled) return;

    processingRef.current = true;
    setIsProcessing(true);

    const nextAnnouncement = queue[0];
    setCurrentlyPlaying(nextAnnouncement.id);

    try {
      console.log('🎤 Processing announcement:', nextAnnouncement.message);

      // Update announcement status
      setQueue(prev => prev.map(a => 
        a.id === nextAnnouncement.id 
          ? { ...a, status: 'playing' as const }
          : a
      ));

      if (voiceEngine === 'elevenlabs') {
        await playElevenLabsVoice(nextAnnouncement.message);
      } else {
        await playBrowserVoice(nextAnnouncement.message);
      }

      // Mark as completed and remove from queue
      setQueue(prev => prev.filter(a => a.id !== nextAnnouncement.id));
      console.log('✅ Announcement completed');

    } catch (error: any) {
      console.warn('🎤 Voice announcement failed:', error.message);
      
      // Mark as failed but still remove from queue
      setQueue(prev => prev.filter(a => a.id !== nextAnnouncement.id));
      
      // If ElevenLabs fails due to quota, switch to browser voice
      if (error.message.includes('quota_exceeded') || error.message.includes('401')) {
        console.log('🔄 Switching to browser voice due to quota limits');
        setVoiceEngine('browser');
        
        // Retry with browser voice
        try {
          await playBrowserVoice(nextAnnouncement.message);
          console.log('✅ Fallback announcement completed');
        } catch (fallbackError) {
          console.error('❌ Fallback voice also failed:', fallbackError);
        }
      }
    } finally {
      setCurrentlyPlaying(null);
      setIsProcessing(false);
      processingRef.current = false;

      // Process next in queue after a short delay
      setTimeout(() => {
        if (queue.length > 1) {
          processQueue();
        }
      }, 1000);
    }
  };

  const playElevenLabsVoice = async (message: string) => {
    try {
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

      const audioBuffer = await elevenLabsVoice.generateSpeech(message, settings);
      if (audioBuffer) {
        await elevenLabsVoice.playAudio(audioBuffer);
      }
    } catch (error: any) {
      console.warn('🎤 ElevenLabs quota exceeded, falling back to browser voice');
      throw error;
    }
  };

  const playBrowserVoice = async (message: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Stop any currently playing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = voiceSettings.speed;
        utterance.volume = voiceSettings.volume;
        utterance.pitch = 1.0;

        // Try to use a good voice
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Google') || 
          voice.name.includes('Microsoft') ||
          voice.name.includes('Alex') ||
          voice.name.includes('Samantha')
        ) || voices[0];

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onend = () => resolve();
        utterance.onerror = (error) => reject(error);

        speechSynthesis.speak(utterance);
      } catch (error) {
        reject(error);
      }
    });
  };

  // Update queue when announcements change
  useEffect(() => {
    const newAnnouncements = announcements.filter(a => 
      !queue.some(q => q.id === a.id) && a.status === 'pending'
    );

    if (newAnnouncements.length > 0) {
      setQueue(prev => [...prev, ...newAnnouncements].sort((a, b) => {
        const priorityOrder = { immediate: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }));
    }
  }, [announcements]);

  // Process queue when it changes
  useEffect(() => {
    if (queue.length > 0 && !processingRef.current) {
      processQueue();
    }
  }, [queue, isVoiceEnabled]);

  const handleAddAnnouncement = () => {
    if (newMessage.trim()) {
      onAddAnnouncement(newMessage.trim(), 'medium');
      setNewMessage('');
    }
  };

  const handleTestVoice = async () => {
    const testMessage = "Hello! This is your AI DJ testing the voice system. How does this sound?";
    onAddAnnouncement(testMessage, 'immediate');
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'playing': return <Play className="w-3 h-3 text-green-400" />;
      case 'completed': return <div className="w-3 h-3 bg-green-400 rounded-full" />;
      case 'failed': return <div className="w-3 h-3 bg-red-400 rounded-full" />;
      default: return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
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
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              isVoiceEnabled
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {isVoiceEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Voice Engine Status */}
      <div className="bg-white/10 rounded-lg p-3 border border-white/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">Voice Engine:</span>
          <span className="text-pink-300 font-medium">
            {voiceEngine === 'elevenlabs' ? 'ElevenLabs + Browser' : 'Browser Only'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-300">Queue:</span>
          <span className="text-white font-medium">{queue.length} pending</span>
        </div>
      </div>

      {/* Add Announcement */}
      <div className="space-y-2">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type announcement message..."
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-pink-500 focus:outline-none"
            onKeyPress={(e) => e.key === 'Enter' && handleAddAnnouncement()}
          />
          <button
            onClick={handleAddAnnouncement}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleTestVoice}
          className="w-full px-3 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors flex items-center justify-center"
        >
          <Mic className="w-4 h-4 mr-2" />
          Test Voice
        </button>
      </div>

      {/* Announcement Queue */}
      {queue.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-300">Queue ({queue.length})</h4>
            <button
              onClick={onClearAnnouncements}
              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {queue.map((announcement) => (
              <div
                key={announcement.id}
                className={`p-2 rounded text-xs border ${
                  currentlyPlaying === announcement.id
                    ? 'bg-pink-500/20 border-pink-500/40'
                    : 'bg-white/5 border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(announcement.status)}
                    <span className={`font-medium ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-gray-400">
                    {announcement.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-300 mt-1 line-clamp-2">
                  {announcement.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white/10 rounded-lg p-3 border border-white/20 space-y-3">
          <div>
            <label className="block text-xs text-gray-300 mb-1">Voice Engine</label>
            <select
              value={voiceEngine}
              onChange={(e) => setVoiceEngine(e.target.value as 'elevenlabs' | 'browser')}
              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
            >
              <option value="elevenlabs">ElevenLabs (Professional)</option>
              <option value="browser">Browser Speech (Fallback)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-300 mb-1">Speed</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceSettings.speed}
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, speed: Number(e.target.value) }))}
              className="w-full"
            />
            <div className="text-xs text-gray-400 text-center">{voiceSettings.speed}x</div>
          </div>

          <div>
            <label className="block text-xs text-gray-300 mb-1">Volume</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={voiceSettings.volume}
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, volume: Number(e.target.value) }))}
              className="w-full"
            />
            <div className="text-xs text-gray-400 text-center">{Math.round(voiceSettings.volume * 100)}%</div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-pink-600/10 rounded-lg p-2 border border-pink-500/20">
        <p className="text-xs text-gray-300 text-center">
          <strong>Professional Voice System</strong><br />
          {isVoiceEnabled 
            ? `${voiceEngine === 'elevenlabs' ? 'ElevenLabs AI voice with browser fallback' : 'Browser speech synthesis'}`
            : 'Voice announcements disabled'
          }
        </p>
      </div>
    </div>
  );
};

export default VoiceAnnouncements;