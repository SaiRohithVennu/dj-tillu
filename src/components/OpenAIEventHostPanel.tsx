import React, { useState } from 'react';
import { Camera, Mic, MicOff, Settings, Play, Pause, Users, Brain } from 'lucide-react';
import { useOpenAIEventHost } from '../hooks/useOpenAIEventHost';

interface OpenAIEventHostPanelProps {
  videoElement?: HTMLVideoElement | null;
  onVIPRecognized?: (vip: any) => void;
}

export const OpenAIEventHostPanel: React.FC<OpenAIEventHostPanelProps> = ({
  videoElement,
  onVIPRecognized
}) => {
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    isActive,
    isAnalyzing,
    lastAnalysis,
    peopleCount,
    recognizedVIPs,
    announcements,
    startHost,
    stopHost,
    forceAnalysis,
    testVoiceSystem
  } = useOpenAIEventHost(videoElement, onVIPRecognized);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">AI Event Host</h3>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Status Display */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm font-medium">
            {isActive ? 'Active' : 'Inactive'}
          </span>
          {isAnalyzing && (
            <div className="flex items-center space-x-1 text-blue-600">
              <Camera className="w-4 h-4 animate-pulse" />
              <span className="text-xs">Analyzing...</span>
            </div>
          )}
        </div>

        {/* People Count */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{peopleCount} people detected</span>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3 mb-4">
        <div className="flex space-x-2">
          <button
            onClick={isActive ? stopHost : startHost}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium ${
              isActive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isActive ? 'Stop AI' : 'Start AI'}</span>
          </button>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={forceAnalysis}
            disabled={!isActive}
            className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium"
          >
            Force Analysis Now
          </button>
          <button
            onClick={testVoiceSystem}
            className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium"
          >
            Test Voice System
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        {/* VIP Recognition */}
        {recognizedVIPs.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recent VIP Recognition</h4>
            <div className="space-y-1">
              {recognizedVIPs.slice(-3).map((vip, index) => (
                <div key={index} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                  {vip.name} - {vip.confidence}% confidence
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Announcements */}
        {announcements.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Announcements</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {announcements.slice(-3).map((announcement, index) => (
                <div key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {announcement.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Analysis */}
        {lastAnalysis && (
          <div className="text-xs text-gray-500">
            Last analysis: {new Date(lastAnalysis).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Settings</h4>
          <div className="space-y-2 text-xs text-gray-600">
            <div>Analysis Interval: 10 seconds</div>
            <div>Voice System: ElevenLabs + Browser Fallback</div>
            <div>Recognition: OpenAI Vision API</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenAIEventHostPanel