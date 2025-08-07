import React, { useState, useEffect, useRef } from 'react';
import { Brain, Play, Pause, Settings, Activity, Zap, Eye, MessageSquare, BarChart3, Clock, Users, Music } from 'lucide-react';
import { useContinuousAIAgent } from '../hooks/useContinuousAIAgent';

interface ContinuousAIAgentPanelProps {
  currentTrack?: any;
  currentMood?: string;
  energy?: number;
  crowdSize?: number;
  eventDetails?: any;
  isPlaying?: boolean;
  onTrackChange?: (track: any) => void;
  onAnnouncement?: (announcement: string) => void;
}

export const ContinuousAIAgentPanel: React.FC<ContinuousAIAgentPanelProps> = ({
  currentTrack,
  currentMood = 'neutral',
  energy = 0.5,
  crowdSize = 0,
  eventDetails,
  isPlaying = false,
  onTrackChange,
  onAnnouncement
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [settings, setSettings] = useState({
    analysisInterval: 30,
    moodSensitivity: 0.7,
    autoAnnouncements: true,
    trackRecommendations: true,
    crowdAnalysis: true
  });

  const {
    isRunning,
    responseHistory = [],
    currentAnalysis,
    startAgent,
    stopAgent,
    updateContext
  } = useContinuousAIAgent({
    videoRef,
    currentTrack,
    currentMood,
    energy,
    crowdSize,
    eventDetails,
    isPlaying,
    onTrackChange,
    onAnnouncement,
    settings
  });

  useEffect(() => {
    if (isActive && !isRunning) {
      startAgent();
    } else if (!isActive && isRunning) {
      stopAgent();
    }
  }, [isActive, isRunning, startAgent, stopAgent]);

  useEffect(() => {
    updateContext({
      currentTrack,
      currentMood,
      energy,
      crowdSize,
      eventDetails,
      isPlaying
    });
  }, [currentTrack, currentMood, energy, crowdSize, eventDetails, isPlaying, updateContext]);

  const handleToggleAgent = () => {
    setIsActive(!isActive);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'mood': return <Eye className="w-4 h-4" />;
      case 'crowd': return <Users className="w-4 h-4" />;
      case 'music': return <Music className="w-4 h-4" />;
      case 'announcement': return <MessageSquare className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="w-8 h-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Continuous AI Agent</h2>
            <p className="text-gray-600">Real-time event analysis and optimization</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="text-sm font-medium">
              {isRunning ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <button
            onClick={handleToggleAgent}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isActive ? 'Stop Agent' : 'Start Agent'}</span>
          </button>
        </div>
      </div>

      {/* Current Analysis Display */}
      {currentAnalysis && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-800">Current Analysis</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Mood</span>
              </div>
              <p className="text-lg font-bold text-blue-600 capitalize">
                {currentAnalysis.mood || currentMood}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <BarChart3 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Energy</span>
              </div>
              <p className="text-lg font-bold text-green-600">
                {Math.round((currentAnalysis.energy || energy) * 100)}%
              </p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Users className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Crowd</span>
              </div>
              <p className="text-lg font-bold text-orange-600">
                {currentAnalysis.crowdSize || crowdSize} people
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Agent Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Analysis Interval (seconds)
            </label>
            <input
              type="number"
              min="10"
              max="300"
              value={settings.analysisInterval}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                analysisInterval: parseInt(e.target.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mood Sensitivity
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={settings.moodSensitivity}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                moodSensitivity: parseFloat(e.target.value)
              }))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{settings.moodSensitivity}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.autoAnnouncements}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                autoAnnouncements: e.target.checked
              }))}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">Auto Announcements</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.trackRecommendations}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                trackRecommendations: e.target.checked
              }))}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">Track Recommendations</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.crowdAnalysis}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                crowdAnalysis: e.target.checked
              }))}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">Crowd Analysis</span>
          </label>
        </div>
      </div>

      {/* Analysis History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800">Analysis History</h3>
          </div>
          <span className="text-sm text-gray-600">
            {responseHistory.length} entries
          </span>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {responseHistory.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No analysis data yet. Start the agent to begin monitoring.</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {responseHistory.slice(-10).reverse().map((entry, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getAnalysisIcon(entry.type)}
                      <span className="font-medium text-gray-800 capitalize">
                        {entry.type} Analysis
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{entry.content}</p>
                  {entry.action && (
                    <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                      <p className="text-sm text-blue-800">
                        <strong>Action:</strong> {entry.action}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hidden video element for analysis */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="hidden"
        onLoadedMetadata={() => {
          if (videoRef.current) {
            videoRef.current.play().catch(console.error);
          }
        }}
      />
    </div>
  );
};