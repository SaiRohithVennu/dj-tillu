import React from 'react';
import { Brain, Zap, MessageSquare, Clock, Users, Music, CheckCircle, AlertCircle } from 'lucide-react';

interface OpenAIEventHostPanelProps {
  isActive: boolean;
  onStartAI: () => void;
  onStopAI: () => void;
  lastDecision: any;
  decisionHistory: any[];
  isThinking: boolean;
  eventContext: any;
  recognizedVIPs: any[];
  crowdSize: number;
}

export const OpenAIEventHostPanel: React.FC<OpenAIEventHostPanelProps> = ({
  isActive,
  onStartAI,
  onStopAI,
  lastDecision,
  decisionHistory,
  isThinking,
  eventContext,
  recognizedVIPs,
  crowdSize
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-blue-400" />
          <span className="text-white font-medium">OpenAI Event Host</span>
          {isActive && isThinking && (
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          )}
        </div>
        <button
          onClick={isActive ? onStopAI : onStartAI}
          className={`px-3 py-1 rounded text-xs transition-colors ${
            isActive 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isActive ? 'STOP AI' : 'START AI'}
        </button>
      </div>

      {/* AI Status */}
      <div className="bg-white/10 rounded-lg p-3 border border-white/20">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">AI Status:</span>
            <span className={`font-semibold ${
              isThinking ? 'text-yellow-300' : 
              isActive ? 'text-green-300' : 'text-red-300'
            }`}>
              {isThinking ? 'Thinking...' :
               isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-300">Event:</span>
            <span className="text-purple-300 font-semibold">{eventContext?.eventName || 'None'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-300">Personality:</span>
            <span className="text-blue-300 capitalize">{eventContext?.aiPersonality || 'None'}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-300">VIPs Present:</span>
            <span className="text-green-300 font-semibold">{recognizedVIPs.length}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-300">Crowd Size:</span>
            <span className="text-blue-300 font-semibold">{crowdSize}</span>
          </div>
        </div>
      </div>

      {/* Last Decision */}
      {lastDecision && (
        <div className="bg-blue-600/10 rounded-lg p-3 border border-blue-500/20">
          <h4 className="text-sm font-medium text-blue-300 mb-2 flex items-center">
            <MessageSquare className="w-4 h-4 mr-1" />
            Last AI Decision
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-300">Priority:</span>
              <span className={`font-semibold ${getPriorityColor(lastDecision.priority)}`}>
                {lastDecision.priority.toUpperCase()}
              </span>
            </div>
            
            {lastDecision.announcement && (
              <div>
                <span className="text-gray-300">Announcement:</span>
                <p className="text-white text-sm mt-1 italic">"{lastDecision.announcement}"</p>
              </div>
            )}
            
            {lastDecision.suggestedTrack && (
              <div className="flex justify-between">
                <span className="text-gray-300">Music Suggestion:</span>
                <span className="text-purple-300">{lastDecision.suggestedTrack}</span>
              </div>
            )}
            
            <div>
              <span className="text-gray-300">Reasoning:</span>
              <p className="text-gray-400 text-xs mt-1">{lastDecision.reasoning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Decision History */}
      {decisionHistory.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Recent Decisions</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {decisionHistory.slice(-5).reverse().map((decision, index) => (
              <div
                key={index}
                className="p-2 bg-white/5 rounded text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${getPriorityColor(decision.priority)}`}>
                    {decision.priority.toUpperCase()}
                  </span>
                  <div className="flex items-center space-x-2">
                    {decision.shouldAnnounce && (
                      <MessageSquare className="w-3 h-3 text-blue-400" />
                    )}
                    {decision.shouldChangeMusic && (
                      <Music className="w-3 h-3 text-purple-400" />
                    )}
                  </div>
                </div>
                {decision.announcement && (
                  <p className="text-gray-300 mt-1 truncate">"{decision.announcement}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Thinking Indicator */}
      {isThinking && (
        <div className="bg-yellow-600/20 rounded-lg p-3 border border-yellow-500/30">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-yellow-300 text-sm">AI is analyzing the situation...</span>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-600/10 rounded-lg p-2 border border-blue-500/20">
        <p className="text-xs text-gray-300 text-center">
          <strong>OpenAI-Powered Event Host</strong><br />
          {isActive 
            ? 'Making intelligent decisions every 15 seconds based on face recognition'
            : 'Click START AI to enable autonomous event hosting'
          }
        </p>
      </div>
    </div>
  );
};