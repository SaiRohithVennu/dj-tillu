import React, { useState, useEffect } from 'react';
import { Search, Music, Download, Globe, Filter, TrendingUp, Heart, Play, Pause, ExternalLink } from 'lucide-react';
import { audiusAPI, AudiusTrack } from '../utils/audiusAPI';
import { Track } from '../data/tracks';

interface AudiusBrowserProps {
  onTrackSelect: (track: Track) => void;
  onAddToLibrary: (track: Track) => void;
  currentMood?: string;
}

export const AudiusBrowser: React.FC<AudiusBrowserProps> = ({ 
  onTrackSelect, 
  onAddToLibrary,
  currentMood = 'energetic'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Electronic');
  const [searchResults, setSearchResults] = useState<AudiusTrack[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<AudiusTrack[]>([]);
  const [moodTracks, setMoodTracks] = useState<AudiusTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'trending' | 'search' | 'mood'>('trending');
  const [isExpanded, setIsExpanded] = useState(false);

  const genres = audiusAPI.getAvailableGenres();

  // Load trending tracks on mount
  useEffect(() => {
    loadTrendingTracks();
  }, []);

  // Load mood-based tracks when mood changes
  useEffect(() => {
    if (currentMood) {
      loadMoodTracks();
    }
  }, [currentMood]);

  const loadTrendingTracks = async () => {
    setIsLoading(true);
    try {
      const tracks = await audiusAPI.getTrendingTracks(selectedGenre, 15);
      setTrendingTracks(tracks);
      console.log(`🎵 Loaded ${tracks.length} trending tracks`);
    } catch (error) {
      console.error('Error loading trending tracks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoodTracks = async () => {
    try {
      const tracks = await audiusAPI.getTracksForMood(currentMood, 12);
      setMoodTracks(tracks);
      console.log(`🎭 Loaded ${tracks.length} tracks for ${currentMood} mood`);
    } catch (error) {
      console.error('Error loading mood tracks:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const results = await audiusAPI.searchTracks(searchQuery, selectedGenre, 15);
      setSearchResults(results);
      setActiveTab('search');
      console.log(`🔍 Found ${results.length} tracks for "${searchQuery}"`);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenreChange = async (genre: string) => {
    setSelectedGenre(genre);
    if (activeTab === 'trending') {
      setIsLoading(true);
      try {
        const tracks = await audiusAPI.getTrendingTracks(genre, 15);
        setTrendingTracks(tracks);
      } catch (error) {
        console.error('Error loading genre tracks:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTrackSelect = (audiusTrack: AudiusTrack) => {
    const track = audiusAPI.convertToAppTrack(audiusTrack);
    onTrackSelect(track);
  };

  const handleAddToLibrary = (audiusTrack: AudiusTrack) => {
    const track = audiusAPI.convertToAppTrack(audiusTrack);
    onAddToLibrary(track);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getCurrentTracks = () => {
    switch (activeTab) {
      case 'trending': return trendingTracks;
      case 'search': return searchResults;
      case 'mood': return moodTracks;
      default: return trendingTracks;
    }
  };

  const TrackItem: React.FC<{ track: AudiusTrack }> = ({ track }) => (
    <div className="p-3 bg-gray-800/50 rounded-lg border border-purple-500/20 hover:bg-gray-700/50 transition-colors">
      <div className="flex items-center space-x-3">
        {/* Album Art */}
        <div className="w-12 h-12 rounded overflow-hidden bg-gray-700 flex-shrink-0">
          {track.artwork?.['150x150'] ? (
            <img 
              src={track.artwork['150x150']} 
              alt={track.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white truncate">{track.title}</p>
          <p className="text-sm text-gray-400 truncate">{track.user.name}</p>
          <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
            <span>{track.genre}</span>
            <span>•</span>
            <span>{formatDuration(track.duration)}</span>
            <span>•</span>
            <span className="flex items-center">
              <Heart className="w-3 h-3 mr-1" />
              {formatNumber(track.favorite_count)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleTrackSelect(track)}
            className="p-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
            title="Play now"
          >
            <Play className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleAddToLibrary(track)}
            className="p-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
            title="Add to library"
          >
            <Download className="w-3 h-3" />
          </button>
          <a
            href={`https://audius.co${track.permalink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
            title="Open in Audius"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-purple-300 flex items-center">
          <Globe className="w-5 h-5 mr-2" />
          Audius Music
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-purple-400 hover:text-purple-300 transition-colors"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('trending')}
          className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
            activeTab === 'trending' 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-300 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-1" />
          Trending
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
            activeTab === 'search' 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-300 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4 inline mr-1" />
          Search
        </button>
        <button
          onClick={() => setActiveTab('mood')}
          className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
            activeTab === 'mood' 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-300 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4 inline mr-1" />
          {currentMood}
        </button>
      </div>

      {/* Search Controls */}
      {activeTab === 'search' && (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Audius tracks..."
              className="flex-1 bg-gray-800 border border-purple-500/30 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg transition-colors"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Genre Filter */}
      <div className="flex items-center space-x-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={selectedGenre}
          onChange={(e) => handleGenreChange(e.target.value)}
          className="bg-gray-800 border border-purple-500/30 rounded-lg px-3 py-1 text-white focus:border-purple-500 focus:outline-none"
        >
          {genres.map((genre) => (
            <option key={genre} value={genre}>{genre}</option>
          ))}
        </select>
        {activeTab === 'trending' && (
          <button
            onClick={loadTrendingTracks}
            disabled={isLoading}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 rounded text-sm transition-colors"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Track List */}
      {isExpanded && (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-300">Loading tracks...</p>
            </div>
          ) : getCurrentTracks().length > 0 ? (
            getCurrentTracks().map((track) => (
              <TrackItem key={track.id} track={track} />
            ))
          ) : (
            <div className="text-center py-8">
              <Music className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-300">
                {activeTab === 'search' && searchQuery 
                  ? `No tracks found for "${searchQuery}"` 
                  : 'No tracks available'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="bg-purple-600/10 rounded-lg p-3 border border-purple-500/20">
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <p className="text-purple-300 font-semibold">{trendingTracks.length}</p>
            <p className="text-gray-400">Trending</p>
          </div>
          <div>
            <p className="text-purple-300 font-semibold">{moodTracks.length}</p>
            <p className="text-gray-400">Mood Tracks</p>
          </div>
          <div>
            <p className="text-purple-300 font-semibold">{searchResults.length}</p>
            <p className="text-gray-400">Search Results</p>
          </div>
        </div>
        <p className="text-xs text-gray-300 text-center mt-2">
          <strong>Powered by Audius</strong> - Decentralized music streaming
        </p>
      </div>
    </div>
  );
};