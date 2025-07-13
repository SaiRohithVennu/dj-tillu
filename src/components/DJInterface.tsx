import React from 'react';
import { Play, Pause, RotateCcw, Volume2, Zap, Music } from 'lucide-react';

interface DJInterfaceProps {
  isPlaying: boolean;
  onPlayToggle: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  crossfader: number;
  onCrossfaderChange: (value: number) => void;
  currentTrack: string;
  onTrackChange: (track: string) => void;
}

const tracks = [
  'Electronic Dreams',
  'Neon Nights',
  'Cyber Pulse',
  'Digital Euphoria',
  'Bass Revolution',
  'Techno Storm'
];

export const DJInterface: React.FC<DJInterfaceProps> = ({
  isPlaying,
  onPlayToggle,
  bpm,
  onBpmChange,
  volume,
  onVolumeChange,
  crossfader,
  onCrossfaderChange,
  currentTrack,
  onTrackChange
}) => {
  return (
    <div className="bg-gradient-to-b from-gray-900 to-black border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-purple-300 mb-2">DJ Controls</h2>
        <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded mx-auto"></div>
      </div>

      {/* Track Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Track Selection</label>
        <select
          value={currentTrack}
          onChange={(e) => onTrackChange(e.target.value)}
          className="w-full bg-gray-800 border border-purple-500/30 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
        >
          {tracks.map((track) => (
            <option key={track} value={track}>{track}</option>
          ))}
        </select>
      </div>

      {/* Main Play Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={onPlayToggle}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
            isPlaying
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg shadow-purple-500/50 animate-pulse'
              : 'bg-gradient-to-r from-gray-600 to-gray-500 hover:from-purple-500 hover:to-pink-500'
          }`}
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 text-white" />
          ) : (
            <Play className="w-8 h-8 text-white ml-1" />
          )}
        </button>
      </div>

      {/* BPM Control */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-300">BPM</label>
          <span className="text-purple-300 font-mono">{bpm}</span>
        </div>
        <input
          type="range"
          min="80"
          max="200"
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((bpm - 80) / 120) * 100}%, #374151 ${((bpm - 80) / 120) * 100}%, #374151 100%)`
          }}
        />
      </div>

      {/* Volume Control */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-300 flex items-center">
            <Volume2 className="w-4 h-4 mr-1" />
            Volume
          </label>
          <span className="text-purple-300 font-mono">{volume}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${volume}%, #374151 ${volume}%, #374151 100%)`
          }}
        />
      </div>

      {/* Crossfader */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-300">Crossfader</label>
          <span className="text-purple-300 font-mono">{crossfader}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={crossfader}
          onChange={(e) => onCrossfaderChange(Number(e.target.value))}
          className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Effects */}
      <div className="grid grid-cols-2 gap-3">
        <button className="bg-gray-800 hover:bg-purple-600 border border-purple-500/30 rounded-lg px-4 py-2 transition-colors flex items-center justify-center">
          <Zap className="w-4 h-4 mr-1" />
          Filter
        </button>
        <button className="bg-gray-800 hover:bg-purple-600 border border-purple-500/30 rounded-lg px-4 py-2 transition-colors flex items-center justify-center">
          <RotateCcw className="w-4 h-4 mr-1" />
          Loop
        </button>
        <button className="bg-gray-800 hover:bg-purple-600 border border-purple-500/30 rounded-lg px-4 py-2 transition-colors flex items-center justify-center">
          <Music className="w-4 h-4 mr-1" />
          Echo
        </button>
        <button className="bg-gray-800 hover:bg-purple-600 border border-purple-500/30 rounded-lg px-4 py-2 transition-colors flex items-center justify-center">
          <Zap className="w-4 h-4 mr-1" />
          Reverb
        </button>
      </div>
    </div>
  );
};