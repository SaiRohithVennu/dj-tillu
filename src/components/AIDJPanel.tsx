import React from 'react';
import { Bot, Zap, Clock, Play, Pause, RotateCcw } from 'lucide-react';

interface AIDJPanelProps {
  isAIActive: boolean;
  onToggleAI: () => void;
  onForceCheck: () => void;
  isAnnouncing: boolean;
  isTransitioning: boolean;
  timeToNextCheck: number;
  lastMood: string;
  currentMood: string;
}

export const AIDJPanel: React.FC<AIDJPanelProps> = ({
  isAIActive,
  onToggleAI,
  onForceCheck,
  isAnnouncing,
  isTransitioning,
  timeToNextCheck,
  lastMood,
  currentMood
}) => {
  return (
    <div className="space-y-4">
      {/* AI Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-purple-400" />
          <span className="text-white font-medium">AI DJ Assistant</span>
          {isAIActive && (
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              isTransitioning ? 'bg-yellow-400' : 'bg-green-400'
            }`}></div>
          )}
        </div>
        <button
          onClick={onToggleAI}
          className={`px-3 py-1 rounded text-xs transition-colors ${
            isAIActive 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isAIActive ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Current Status */}
      <div className="bg-white/10 rounded-lg p-3 border border-white/20">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Status:</span>
            <span className={`font-semibold ${
              isTransitioning ? 'text-yellow-300' : 
              isAnnouncing ? 'text-orange-300' :
              isAIActive ? 'text-green-300' : 'text-red-300'
            }`}>
              {isTransitioning ? 'Transitioning' :
               isAnnouncing ? 'Announcing' :
               isAIActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-300">Current Mood:</span>
            <span className="text-purple-300 font-semibold">{currentMood}</span>
          </div>
          
          {lastMood !== currentMood && (
            <div className="flex justify-between">
              <span className="text-gray-300">Previous:</span>
              <span className="text-gray-400">{lastMood}</span>
            </div>
          )}
          
          {isAIActive && (
            <div className="flex justify-between">
              <span className="text-gray-300">Next Check:</span>
              <span className="text-blue-300 font-mono">{timeToNextCheck}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-2">
        <button
          onClick={onForceCheck}
          disabled={!isAIActive || isTransitioning}
          className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Force Mood Check
        </button>
      </div>

      {/* Info */}
      <div className="bg-purple-600/10 rounded-lg p-2 border border-purple-500/20">
        <p className="text-xs text-gray-300 text-center">
          <strong>AI DJ Mode</strong><br />
          {isAIActive 
            ? 'Automatically changes tracks based on crowd mood every 10 seconds'
            : 'Click ON to enable automatic mood-based track selection'
          }
        </p>
      </div>
    </div>
  );
};