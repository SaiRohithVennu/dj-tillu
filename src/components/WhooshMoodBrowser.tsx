import React, { useState, useEffect } from 'react';
import { Globe, Music, Zap, Heart, RefreshCw, Download } from 'lucide-react';
import { browserbaseAPI, WhooshMood } from '../utils/browserbaseAPI';
import { Track } from '../data/tracks';

interface WhooshMoodBrowserProps {
  onTrackSelect: (track: Track) => void;
  onAddToLibrary: (track: Track) => void;
  currentMood?: string;
}

export const WhooshMoodBrowser: React.FC<WhooshMoodBrowserProps> = ({
  onTrackSelect,
  onAddToLibrary,
  currentMood = 'happy'
}) => {
  const [moods, setMoods] = useState<WhooshMood[]>([]);
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadMoods();
  }, []);

  const loadMoods = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🎵 Loading WhooshMusic moods via Browserbase...');
      const scrapedMoods = await browserbaseAPI.getCachedMoods();
      setMoods(scrapedMoods);
      setLastUpdated(new Date());
      console.log(`✅ Loaded ${scrapedMoods.length} moods from WhooshMusic`);
    } catch (error: any) {
      console.error('❌ Failed to load moods:', error);
      setError('Failed to load moods from WhooshMusic');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshMoods = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Clear cache and fetch fresh data
      localStorage.removeItem('whoosh_moods_cache');
      const freshMoods = await browserbaseAPI.scrapeWhooshMoods();
      setMoods(freshMoods);
      setLastUpdated(new Date());
      console.log(`🔄 Refreshed ${freshMoods.length} moods from WhooshMusic`);
    } catch (error: any) {
      console.error('❌ Failed to refresh moods:', error);
      setError('Failed to refresh moods');
    } finally {
      setIsLoading(false);
    }
  };

  const generateTrackForMood = (mood: WhooshMood): Track => {
    // Generate a demo track based on the mood
    const bpmRanges: { [key: string]: [number, number] } = {
      'happy': [120, 140],
      'energetic': [130, 150],
      'calm': [80, 110],
      'dramatic': [90, 120],
      'upbeat': [125, 145],
      'chill': [90, 115],
      'intense': [140, 160],
      'peaceful': [70, 100],
      'exciting': [135, 155],
      'romantic': [80, 110]
    };

    const moodKey = mood.name.toLowerCase();
    const [minBpm, maxBpm] = bpmRanges[moodKey] || [120, 140];
    const bpm = Math.floor(Math.random() * (maxBpm - minBpm + 1)) + minBpm;

    return {
      id: `whoosh-${mood.name.toLowerCase()}-${Date.now()}`,
      title: `${mood.name} Vibes`,
      artist: 'WhooshMusic Collection',
      duration: Math.floor(Math.random() * 120) + 180, // 3-5 minutes
      bpm,
      genre: mood.name,
      audioUrl: `generated://${mood.name.toLowerCase()}`,
      albumArt: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=300',
      license: 'WhooshMusic Royalty-Free'
    };
  };

  const handleMoodSelect = (mood: WhooshMood) => {
    setSelectedMood(mood.name);
    const track = generateTrackForMood(mood);
    onTrackSelect(track);
  };

  const handleAddMoodToLibrary = (mood: WhooshMood) => {
    const track = generateTrackForMood(mood);
    onAddToLibrary(track);
  };

  const getMoodIcon = (moodName: string) => {
    const name = moodName.toLowerCase();
    if (name.includes('happy') || name.includes('joyful')) return <Heart className="w-4 h-4" />;
    if (name.includes('energetic') || name.includes('intense')) return <Zap className="w-4 h-4" />;
    return <Music className="w-4 h-4" />;
  };

  const getMoodColor = (moodName: string) => {
    const name = moodName.toLowerCase();
    if (name.includes('happy') || name.includes('joyful')) return 'yellow';
    if (name.includes('energetic') || name.includes('intense')) return 'red';
    if (name.includes('calm') || name.includes('peaceful')) return 'blue';
    if (name.includes('dramatic') || name.includes('epic')) return 'purple';
    if (name.includes('romantic')) return 'pink';
    return 'green';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center">
          <Globe className="w-5 h-5 mr-2 text-blue-400" />
          WhooshMusic Moods
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={refreshMoods}
            disabled={isLoading}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
            title="Refresh moods"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Browserbase Status */}
      <div className="bg-blue-600/10 rounded-lg p-3 border border-blue-500/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-300 font-medium">🤖 Browserbase Integration</span>
          <span className="text-blue-200">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Not loaded'}
          </span>
        </div>
        <p className="text-xs text-gray-300 mt-1">
          Real-time mood scraping from WhooshMusic.com for hackathon demo
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-600/20 border border-red-500/40 rounded-lg p-3">
          <p className="text-red-300 text-sm">{error}</p>
          <button
            onClick={loadMoods}
            className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-6">
          <RefreshCw className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-spin" />
          <p className="text-gray-300">Scraping moods from WhooshMusic...</p>
          <p className="text-xs text-gray-400 mt-1">Using Browserbase automation</p>
        </div>
      )}

      {/* Moods Grid */}
      {!isLoading && moods.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-300">
            Found {moods.length} mood categories from WhooshMusic
          </p>
          
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {moods.map((mood, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedMood === mood.name
                    ? `bg-${getMoodColor(mood.name)}-500/30 border-${getMoodColor(mood.name)}-500/60`
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                }`}
                onClick={() => handleMoodSelect(mood)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getMoodIcon(mood.name)}
                    <span className="font-medium text-white text-sm">{mood.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddMoodToLibrary(mood);
                    }}
                    className="p-1 bg-green-500/30 hover:bg-green-500/50 rounded transition-colors"
                    title="Add to library"
                  >
                    <Download className="w-3 h-3 text-green-300" />
                  </button>
                </div>
                
                <p className="text-xs text-gray-300 line-clamp-2">
                  {mood.description}
                </p>
                
                {selectedMood === mood.name && (
                  <div className="mt-2 text-xs text-green-300 flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                    Playing {mood.name} vibes
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="bg-purple-600/10 rounded-lg p-3 border border-purple-500/20">
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <p className="text-purple-300 font-semibold">{moods.length}</p>
            <p className="text-gray-400">Moods</p>
          </div>
          <div>
            <p className="text-purple-300 font-semibold">Live</p>
            <p className="text-gray-400">Scraping</p>
          </div>
          <div>
            <p className="text-purple-300 font-semibold">Browserbase</p>
            <p className="text-gray-400">Powered</p>
          </div>
        </div>
        <p className="text-xs text-gray-300 text-center mt-2">
          <strong>Hackathon Demo:</strong> Real-time mood data from WhooshMusic
        </p>
      </div>
    </div>
  );
};