import React from 'react';
import { Heart, Zap, TrendingUp } from 'lucide-react';

interface MoodDisplayProps {
  mood: string;
  energy: number;
  crowdSize: number;
}

export const MoodDisplay: React.FC<MoodDisplayProps> = ({ mood, energy, crowdSize }) => {
  const getMoodColor = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'excited': return 'text-yellow-300';
      case 'energetic': return 'text-red-300';
      case 'chill': return 'text-blue-300';
      case 'happy': return 'text-green-300';
      case 'disappointed': return 'text-orange-400';
      case 'bored': return 'text-gray-400';
      case 'angry': return 'text-red-500';
      case 'sad': return 'text-blue-500';
      case 'confused': return 'text-yellow-500';
      case 'surprised': return 'text-pink-400';
      case 'focused': return 'text-indigo-400';
      case 'tired': return 'text-gray-500';
      default: return 'text-purple-300';
    }
  };

  const getEnergyBarColor = (energy: number) => {
    if (energy > 80) return 'bg-red-400';
    if (energy > 60) return 'bg-yellow-400';
    if (energy > 40) return 'bg-blue-400';
    return 'bg-gray-400';
  };

  return (
    <div className="grid grid-cols-3 gap-4 text-center">
        {/* Mood */}
        <div>
          <Heart className={`w-5 h-5 mx-auto mb-1 ${getMoodColor(mood)}`} />
          <p className="text-xs text-gray-300">Mood</p>
          <p className={`text-sm font-bold ${getMoodColor(mood)}`}>{mood}</p>
        </div>

        {/* Energy */}
        <div>
          <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
          <p className="text-xs text-gray-300">Energy</p>
          <div className="w-full bg-white/20 rounded-full h-2 mb-1">
            <div 
              className={`h-2 rounded-full transition-all duration-500 shadow-sm ${getEnergyBarColor(energy)}`}
              style={{ width: `${energy}%` }}
            ></div>
          </div>
          <p className="text-xs text-yellow-300 font-bold">{energy}%</p>
        </div>

        {/* Crowd Size */}
        <div>
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-300" />
          <p className="text-xs text-gray-300">Crowd</p>
          <p className="text-sm font-bold text-green-300">{crowdSize}</p>
        </div>
    </div>
  );
};