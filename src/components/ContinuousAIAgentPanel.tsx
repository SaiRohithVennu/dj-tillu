import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Settings, Activity, Zap } from 'lucide-react';
import { useContinuousAIAgent } from '../hooks/useContinuousAIAgent';

interface ContinuousAIAgentPanelProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

export const ContinuousAIAgentPanel: React.FC<ContinuousAIAgentPanelProps> = ({
  isActive,
  onToggle
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [analysisInterval, setAnalysisInterval] = useState(5000);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
  
  const {
    isAnalyzing,
    currentMood,
    lastAnalysis,
    analysisHistory,
    startAnalysis,
    stopAnalysis,
    error
  } = useContinuousAIAgent({
    interval: analysisInterval,
    confidenceThreshold
  });

  useEffect(() => {
    if (isActive && !isAnalyzing) {
      startAnalysis();
    } else if (!isActive && isAnalyzing) {
      stopAnalysis();
    }
  }, [isActive, isAnalyzing, startAnalysis, stopAnalysis]);

  const handleToggle = () => {
    onToggle(!isActive);
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-green-400" />
          <h3 className="text-white font-semibold">AI Video Agent</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={handleToggle}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            {isActive ? 'ACTIVE' : 'START'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">Status:</span>
          <div className="flex items-center gap-2">
            {isAnalyzing ? (
              <>
                <Activity className="w-4 h-4 text-green-400 animate-pulse" />
                <span className="text-green-400">Analyzing</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 rounded-full bg-gray-500" />
                <span className="text-gray-400">Inactive</span>
              </>
            )}
          </div>
        </div>

        {currentMood && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Current Mood:</span>
            <span className="text-white font-medium capitalize">{currentMood}</span>
          </div>
        )}

        {lastAnalysis && (
          <div className="text-xs text-gray-400">
            Last analysis: {new Date(lastAnalysis).toLocaleTimeString()}
          </div>
        )}

        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
            Error: {error}
          </div>
        )}
      </div>

      {showSettings && (
        <div className="mt-4 pt-4 border-t border-white/20 space-y-3">
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              Analysis Interval (ms)
            </label>
            <input
              type="number"
              value={analysisInterval}
              onChange={(e) => setAnalysisInterval(Number(e.target.value))}
              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
              min="1000"
              max="30000"
              step="1000"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              Confidence Threshold
            </label>
            <input
              type="range"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="w-full"
              min="0.1"
              max="1"
              step="0.1"
            />
            <div className="text-xs text-gray-400 text-center">
              {(confidenceThreshold * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      {analysisHistory.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="text-xs text-gray-300 mb-2">Recent Analysis</div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {analysisHistory.slice(-3).map((analysis, index) => (
              <div key={index} className="text-xs text-gray-400 flex justify-between">
                <span className="capitalize">{analysis.mood}</span>
                <span>{new Date(analysis.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          <span>Continuous AI Video Agent</span>
        </div>
        <div className="mt-1">
          Click START to enable continuous AI video interaction
        </div>
      </div>
    </div>
  );
};