import React from 'react';
import { useContinuousAIAgent } from '../hooks/useContinuousAIAgent';
import { Track } from '../data/tracks';
import { Bot, Activity, Users, Music, Zap, Clock } from 'lucide-react';

interface ContinuousAIAgentPanelProps {
  tracks: Track[];
  currentMood: string;
  energy: number;
  crowdSize: number;
}

export const ContinuousAIAgentPanel: React.FC<ContinuousAIAgentPanelProps> = ({
  tracks,
  currentMood,
  energy,
  crowdSize
}) => {
  const eventContext = {
    currentMood,
    energy,
    crowdSize,
    timeOfDay: new Date().getHours(),
    eventType: 'party',
    vipGuests: [],
    specialRequests: []
  };

  const {
    isActive,
    currentAction,
    insights,
    recommendations,
    performance,
    toggleAgent,
    executeAction
  } = useContinuousAIAgent({
    tracks,
    eventContext
  });

  return (
    <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-xl p-6 text-white shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Bot className="w-8 h-8 text-purple-400" />
          <h2 className="text-2xl font-bold">Continuous AI Agent</h2>
        </div>
        <button
          onClick={toggleAgent}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            isActive
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-gray-200'
          }`}
        >
          {isActive ? 'Active' : 'Inactive'}
        </button>
      </div>

      {isActive && (
        <>
          {/* Current Action */}
          <div className="mb-6 p-4 bg-black/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold">Current Action</h3>
            </div>
            <p className="text-gray-300">{currentAction || 'Monitoring event...'}</p>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-black/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">Response Time</span>
              </div>
              <p className="text-xl font-bold">{performance.responseTime}ms</p>
            </div>
            <div className="p-3 bg-black/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">Uptime</span>
              </div>
              <p className="text-xl font-bold">{Math.floor(performance.uptime / 60)}m</p>
            </div>
          </div>

          {/* AI Insights */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Bot className="w-5 h-5 mr-2 text-purple-400" />
              AI Insights
            </h3>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div key={index} className="p-3 bg-black/20 rounded-lg">
                  <p className="text-sm text-gray-300">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Music className="w-5 h-5 mr-2 text-green-400" />
              Recommendations
            </h3>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                  <p className="text-sm text-gray-300">{rec.action}</p>
                  <button
                    onClick={() => executeAction(rec)}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium transition-colors"
                  >
                    Execute
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Event Context */}
          <div className="p-4 bg-black/20 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-400" />
              Event Context
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Mood:</span>
                <span className="ml-2 font-medium">{eventContext.currentMood}</span>
              </div>
              <div>
                <span className="text-gray-400">Energy:</span>
                <span className="ml-2 font-medium">{eventContext.energy}%</span>
              </div>
              <div>
                <span className="text-gray-400">Crowd Size:</span>
                <span className="ml-2 font-medium">{eventContext.crowdSize}</span>
              </div>
              <div>
                <span className="text-gray-400">Time:</span>
                <span className="ml-2 font-medium">{eventContext.timeOfDay}:00</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};