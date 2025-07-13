import React, { useState, useEffect } from 'react';
import { Search, Music, Download, Globe, Filter } from 'lucide-react';
import { Track, searchFMATrack, getFMAGenres } from '../data/tracks';

interface FMABrowserProps {
  onTrackSelect: (track: Track) => void;
  onAddToLibrary: (track: Track) => void;
}

export const FMABrowser: React.FC<FMABrowserProps> = ({ onTrackSelect, onAddToLibrary }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Electronic');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const genres = getFMAGenres();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const results = await searchFMATrack(searchQuery, selectedGenre);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to demo results for this example
      setSearchResults([
        {
          id: 'demo-1',
          title: `${searchQuery} Mix`,
          artist: 'FMA Artist',
          duration: 180,
          bpm: 128,
          genre: selectedGenre,
          audioUrl: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Broke_For_Free/Directionless_EP/Broke_For_Free_-_01_-_Night_Owl.mp3',
          albumArt: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=300',
          license: 'CC BY 3.0'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gradient-to-b from-gray-900 to-black border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-purple-300 flex items-center">
          <Globe className="w-5 h-5 mr-2" />
          FMA Browser
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-purple-400 hover:text-purple-300 transition-colors"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Search Controls */}
      <div className="space-y-3 mb-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FMA tracks..."
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

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="bg-gray-800 border border-purple-500/30 rounded-lg px-3 py-1 text-white focus:border-purple-500 focus:outline-none"
          >
            {genres.map((genre) => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Results */}
      {isExpanded && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {searchResults.length > 0 ? (
            searchResults.map((track) => (
              <div
                key={track.id}
                className="p-3 bg-gray-800/50 rounded-lg border border-purple-500/20 hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {track.albumArt && (
                      <img 
                        src={track.albumArt} 
                        alt={track.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{track.title}</p>
                      <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                      <p className="text-xs text-purple-400">{track.license}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">{formatDuration(track.duration)}</span>
                    <button
                      onClick={() => onTrackSelect(track)}
                      className="p-1 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                      title="Play now"
                    >
                      <Music className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onAddToLibrary(track)}
                      className="p-1 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                      title="Add to library"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : searchQuery && !isLoading ? (
            <div className="text-center text-gray-400 py-4">
              <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No tracks found. Try a different search term.</p>
            </div>
          ) : !searchQuery ? (
            <div className="text-center text-gray-400 py-4">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Search the Free Music Archive for new tracks</p>
            </div>
          ) : null}
        </div>
      )}

      {/* FMA Info */}
      <div className="mt-4 p-3 bg-purple-600/10 rounded-lg border border-purple-500/20">
        <p className="text-xs text-gray-300 text-center">
          <strong>Free Music Archive</strong> provides high-quality, legal audio downloads.
          All tracks are available under Creative Commons licenses.
        </p>
      </div>
    </div>
  );
};