import React from 'react';
import { Brain, Zap, Users, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface GeminiMoodDisplayProps {
  mood: string;
  energy: number;
  crowdSize: number;
  confidence: number;
  isAnalyzing: boolean;
  lastAnalysis: Date | null;
  error: string | null;
  enabled: boolean;
  onTriggerAnalysis: () => void;
  onToggleEnabled: () => void;
}

export const GeminiMoodDisplay: React.FC<GeminiMoodDisplayProps> = ({
  mood,
  energy,
  crowdSize,
  confidence,
  isAnalyzing,
  lastAnalysis,
  error,
  enabled,
  onTriggerAnalysis,
  onToggleEnabled
}) => {
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

  const formatLastAnalysis = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  return (
    <div className="space-y-4">
      {/* Header with Gemini branding */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <span className="text-white font-medium">AI Vision</span>
          {enabled && isAnalyzing && (
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          )}
          {!enabled && (
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleEnabled}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              enabled 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {enabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={onTriggerAnalysis}
            disabled={isAnalyzing || !enabled}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded text-xs transition-colors"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Main Analytics Grid */}
      <div className={`grid grid-cols-3 gap-4 text-center ${!enabled ? 'opacity-50' : ''}`}>
        {/* Mood */}
        <div>
          <Eye className={`w-5 h-5 mx-auto mb-1 ${getMoodColor(mood)}`} />
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
          <Users className="w-5 h-5 mx-auto mb-1 text-green-300" />
          <p className="text-xs text-gray-300">Crowd</p>
          <p className="text-sm font-bold text-green-300">{crowdSize}</p>
        </div>
      </div>

      {/* Analysis Status */}
      <div className={`bg-white/10 rounded-lg p-3 border border-white/20 ${!enabled ? 'opacity-50' : ''}`}>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              Confidence
            </span>
            <span className={`font-bold ${confidence > 70 ? 'text-green-300' : confidence > 40 ? 'text-yellow-300' : 'text-red-300'}`}>
              {confidence}%
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Last Analysis
            </span>
            <span className="text-purple-300">
              {formatLastAnalysis(lastAnalysis)}
            </span>
          </div>

          {isAnalyzing && (
            <div className="flex items-center justify-center space-x-2 py-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-purple-300 text-xs ml-2">Analyzing with Apple...</span>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className={`bg-purple-600/10 rounded-lg p-2 border border-purple-500/20 ${!enabled ? 'opacity-50' : ''}`}>
        <p className="text-xs text-gray-300 text-center">
          <strong>Powered by Apple Vision</strong><br />
          {enabled ? 'Real-time emotion detection every 30 seconds' : 'Analysis disabled - click ON to enable'}
        </p>
      </div>
    </div>
  );
};