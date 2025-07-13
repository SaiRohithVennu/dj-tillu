import React from 'react';
import { Play, Pause, Music, Clock, Download, ExternalLink } from 'lucide-react';
import { Track } from '../data/tracks';

interface TrackListProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onTrackSelect: (track: Track) => void;
  onPlayToggle: () => void;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onTrackSelect,
  onPlayToggle
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (tracks.length === 0) {
    return (
      <div className="text-center py-8">
        <Music className="w-12 h-12 text-gray-500 mx-auto mb-3" />
        <p className="text-gray-300 mb-2">Loading music library...</p>
        <p className="text-gray-400 text-sm">Getting tracks from Audius</p>
      </div>
    );
  }
  return (
    <div className="space-y-2 max-h-full overflow-y-auto pr-2">
        {tracks.map((track) => (
          <div
            key={track.id}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              currentTrack?.id === track.id
                ? 'bg-purple-600/30 border-purple-500/60 backdrop-blur-sm'
                : 'bg-white/10 border-white/20 hover:bg-white/20 backdrop-blur-sm'
            }`}
            onClick={() => onTrackSelect(track)}
          >
            <div className="flex items-center space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentTrack?.id === track.id) {
                      onPlayToggle();
                    } else {
                      onTrackSelect(track);
                    }
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    currentTrack?.id === track.id && isPlaying
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-white/20 text-white hover:bg-purple-600'
                  }`}
                >
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{track.title}</p>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-300">{track.artist}</span>
                    <span className="text-purple-300">{track.bpm} BPM</span>
                    <span className="text-gray-400">{formatDuration(track.duration)}</span>
                  </div>
                </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="px-2 py-1 bg-purple-500/30 text-purple-200 rounded text-xs">
                {track.genre}
              </span>
              {currentTrack?.id === track.id && (
                <span className="text-purple-300 font-medium text-xs flex items-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-1 animate-pulse"></div>
                  Playing
                </span>
              )}
            </div>
          </div>
        ))}
    </div>
  );
};