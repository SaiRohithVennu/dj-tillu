import React, { useState } from 'react';
import { Music, Plus, Trash2, Users, Zap, Heart } from 'lucide-react';
import { moodPlaylists, addTrackToMoodPlaylist, removeTrackFromMoodPlaylist, getTracksForMood } from '../data/moodPlaylists';
import { Track } from '../data/tracks';

interface MoodPlaylistManagerProps {
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
}

export const MoodPlaylistManager: React.FC<MoodPlaylistManagerProps> = ({
  tracks,
  onPlayTrack
}) => {
  const [selectedMood, setSelectedMood] = useState('excited');
  const [showAddTrack, setShowAddTrack] = useState(false);

  const selectedPlaylist = moodPlaylists.find(p => p.mood === selectedMood);
  const playlistTracks = getTracksForMood(selectedMood, tracks);
  const availableTracksToAdd = tracks.filter(track => 
    !selectedPlaylist?.tracks.includes(track.id)
  );

  const handleAddTrack = (trackId: string) => {
    if (addTrackToMoodPlaylist(selectedMood, trackId)) {
      setShowAddTrack(false);
      console.log(`Added track ${trackId} to ${selectedMood} playlist`);
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    if (removeTrackFromMoodPlaylist(selectedMood, trackId)) {
      console.log(`Removed track ${trackId} from ${selectedMood} playlist`);
    }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'excited': return <Zap className="w-4 h-4" />;
      case 'happy': return <Heart className="w-4 h-4" />;
      case 'energetic': return <Users className="w-4 h-4" />;
      default: return <Music className="w-4 h-4" />;
    }
  };

  const getMoodColor = (mood: string) => {
    const playlist = moodPlaylists.find(p => p.mood === mood);
    return playlist?.color || 'purple';
  };

  return (
    <div className="space-y-4">
      {/* Mood Selector */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-2">Select Mood Playlist</h3>
        <div className="grid grid-cols-2 gap-2">
          {moodPlaylists.slice(0, 8).map((playlist) => (
            <button
              key={playlist.mood}
              onClick={() => setSelectedMood(playlist.mood)}
              className={`p-2 rounded-lg text-xs transition-all ${
                selectedMood === playlist.mood
                  ? `bg-${playlist.color}-500/30 border-${playlist.color}-500/60 text-${playlist.color}-200`
                  : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
              } border`}
            >
              <div className="flex items-center space-x-1">
                {getMoodIcon(playlist.mood)}
                <span>{playlist.displayName}</span>
              </div>
              <div className="text-xs opacity-70 mt-1">
                {playlist.tracks.length} tracks
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Playlist Info */}
      {selectedPlaylist && (
        <div className={`bg-${selectedPlaylist.color}-500/10 rounded-lg p-3 border border-${selectedPlaylist.color}-500/20`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`font-medium text-${selectedPlaylist.color}-200 flex items-center`}>
              {getMoodIcon(selectedPlaylist.mood)}
              <span className="ml-2">{selectedPlaylist.displayName} Playlist</span>
            </h4>
            <button
              onClick={() => setShowAddTrack(!showAddTrack)}
              className={`p-1 bg-${selectedPlaylist.color}-500/30 hover:bg-${selectedPlaylist.color}-500/50 rounded transition-colors`}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-gray-300 mb-2">{selectedPlaylist.description}</p>
          <div className="text-xs text-gray-400">
            BPM: {selectedPlaylist.preferredBPMRange.min}-{selectedPlaylist.preferredBPMRange.max} • 
            Genres: {selectedPlaylist.preferredGenres.join(', ')}
          </div>
        </div>
      )}

      {/* Add Track Section */}
      {showAddTrack && (
        <div className="bg-white/10 rounded-lg p-3 border border-white/20">
          <h4 className="text-sm font-medium text-white mb-2">Add Track to Playlist</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableTracksToAdd.map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-2 bg-white/5 rounded hover:bg-white/10 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{track.title}</p>
                  <p className="text-xs text-gray-400">{track.artist} • {track.bpm} BPM</p>
                </div>
                <button
                  onClick={() => handleAddTrack(track.id)}
                  className="p-1 bg-green-500/30 hover:bg-green-500/50 rounded transition-colors"
                >
                  <Plus className="w-3 h-3 text-green-300" />
                </button>
              </div>
            ))}
            {availableTracksToAdd.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">All tracks already in playlist</p>
            )}
          </div>
        </div>
      )}

      {/* Playlist Tracks */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">
          Tracks in {selectedPlaylist?.displayName} ({playlistTracks.length})
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {playlistTracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center space-x-2 p-2 bg-white/5 rounded hover:bg-white/10 transition-colors"
            >
              <button
                onClick={() => onPlayTrack(track)}
                className="p-1 bg-purple-500/30 hover:bg-purple-500/50 rounded transition-colors"
              >
                <Music className="w-3 h-3 text-purple-300" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{track.title}</p>
                <p className="text-xs text-gray-400">{track.artist} • {track.bpm} BPM</p>
              </div>
              <button
                onClick={() => handleRemoveTrack(track.id)}
                className="p-1 bg-red-500/30 hover:bg-red-500/50 rounded transition-colors"
              >
                <Trash2 className="w-3 h-3 text-red-300" />
              </button>
            </div>
          ))}
          {playlistTracks.length === 0 && (
            <div className="text-center py-4">
              <Music className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No tracks in this playlist yet</p>
              <p className="text-xs text-gray-500">Click + to add tracks</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};