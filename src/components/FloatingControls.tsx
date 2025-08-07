import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Shuffle, Repeat, Zap } from 'lucide-react';
import { useMusicPlayer } from '../hooks/useMusicPlayer';

interface FloatingControlsProps {
  onStartAll: () => void;
  isAllActive: boolean;
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({
  onStartAll,
  isAllActive
}) => {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    isShuffled,
    isRepeating,
    play,
    pause,
    next,
    previous,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    seek
  } = useMusicPlayer();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    seek(newTime);
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      {/* Main Start All Button */}
      <div className="mb-4 flex justify-center">
        <button
          onClick={onStartAll}
          className={`px-8 py-4 rounded-full font-bold text-white text-lg transition-all transform hover:scale-105 shadow-2xl ${
            isAllActive
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 animate-pulse'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
          } flex items-center gap-3`}
        >
          <Zap className="w-6 h-6" />
          {isAllActive ? 'ALL SYSTEMS ACTIVE' : 'START ALL'}
        </button>
      </div>

      {/* Music Controls */}
      <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-2xl">
        {/* Track Info */}
        {currentTrack && (
          <div className="text-center mb-3">
            <div className="text-white font-semibold text-sm truncate max-w-64">
              {currentTrack.title}
            </div>
            <div className="text-gray-400 text-xs truncate">
              {currentTrack.artist}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {currentTrack && (
          <div className="mb-3">
            <div 
              className="w-full h-1 bg-gray-600 rounded-full cursor-pointer"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                style={{ width: `${(progress / duration) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-full transition-colors ${
              isShuffled ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={previous}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={isPlaying ? pause : play}
            className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>

          <button
            onClick={next}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-2 rounded-full transition-colors ${
              isRepeating ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          
          {showVolumeSlider && (
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                className="w-20 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer slider"
              />
              <span className="text-xs text-gray-400 w-8">
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};