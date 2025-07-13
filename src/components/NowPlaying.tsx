import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { Track } from '../data/tracks';

interface NowPlayingProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  error: string | null;
  onPlayToggle: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
}

export const NowPlaying: React.FC<NowPlayingProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isLoading,
  error,
  onPlayToggle,
  onSeek,
  onVolumeChange
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentTrack) {
    return (
      null
    );
  }

  // Show error message if there's an audio error
  if (error) {
    return (
      <div className="text-center">
        <h3 className="text-lg font-bold text-red-300 mb-4">Audio Error</h3>
        <div className="text-center text-red-400 mb-4">
          <p>{error}</p>
        </div>
        <div className="text-center">
          <button
            onClick={onPlayToggle}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      {/* Track Info */}
      <div className="mb-6">
        {currentTrack.albumArt && (
          <div className="w-24 h-24 mx-auto mb-4 rounded-xl overflow-hidden border-2 border-white/30 shadow-xl">
            <img 
              src={currentTrack.albumArt} 
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <h4 className="text-lg font-bold text-white mb-1">{currentTrack.title}</h4>
        <p className="text-gray-300 mb-2">{currentTrack.artist}</p>
        <div className="flex justify-center space-x-3 text-xs text-gray-400">
          <span>{currentTrack.genre}</span>
          <span>•</span>
          <span>{currentTrack.bpm} BPM</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-300 mb-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div 
          className="w-full h-2 bg-gray-700 rounded-full cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            onSeek(percentage * duration);
          }}
        >
          <div 
            className="h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-100 shadow-lg"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4 mb-4">
        <button className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
          <SkipBack className="w-5 h-5 text-white" />
        </button>
        
        <button
          onClick={onPlayToggle}
          disabled={isLoading}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
            isPlaying
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 shadow-purple-500/50'
              : 'bg-white/20 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
          )}
        </button>
        
        <button className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
          <SkipForward className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center space-x-2">
        <Volume2 className="w-4 h-4 text-gray-300" />
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${volume}%, rgba(255,255,255,0.2) ${volume}%, rgba(255,255,255,0.2) 100%)`
          }}
        />
        <span className="text-xs text-gray-300 w-8">{volume}%</span>
      </div>
    </div>
  );
};