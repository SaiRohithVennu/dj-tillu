import React from 'react';
import { Eye, Brain, MessageSquare, Zap, Clock, Users, Camera, Play, Pause, RotateCcw } from 'lucide-react';

interface ContinuousAIAgentPanelProps {
  isActive: boolean;
  onStartAgent: () => void;
  onStopAgent: () => void;
  isAnalyzing: boolean;
  lastResponse: any;
  responseHistory: any[];
  agentStatus: any;
  error: string | null;
  onForceAnalysis: () => void;
  conversationHistory: string[];
  eventContext: any;
}

export const ContinuousAIAgentPanel: React.FC<ContinuousAIAgentPanelProps> = ({
  isActive,
  onStartAgent,
  onStopAgent,
  isAnalyzing,
  lastResponse,
  responseHistory,
  agentStatus,
  error,
  onForceAnalysis,
  conversationHistory,
  eventContext
}) => {
  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'excited': return 'text-yellow-400';
      case 'welcoming': return 'text-green-400';
      case 'encouraging': return 'text-blue-400';
      case 'celebratory': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate': return 'text-red-400';
      case 'high': return 'text-orange-400';
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
          <Eye className="w-5 h-5 text-blue-400" />
          <span className="text-white font-medium">AI Video Agent</span>
          {isActive && (
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              isAnalyzing ? 'bg-yellow-400' : 'bg-green-400'
            }`}></div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onForceAnalysis}
            disabled={!isActive || isAnalyzing}
            className="p-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded text-xs transition-colors"
            title="Force analysis"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            onClick={isActive ? onStopAgent : onStartAgent}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              isActive 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-3 h-3 inline mr-1" />
                STOP
              </>
            ) : (
              <>
                <Play className="w-3 h-3 inline mr-1" />
                START
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Agent Status */}
      <div className={`bg-white/10 rounded-lg p-3 border border-white/20 ${!isActive ? 'opacity-50' : ''}`}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Status:</span>
            <span className={`font-semibold ${
              isAnalyzing ? 'text-yellow-300' : 
              isActive ? 'text-green-300' : 'text-red-300'
            }`}>
              {isAnalyzing ? 'Analyzing...' :
               isActive ? 'Watching' : 'Inactive'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-300">Event:</span>
            <span className="text-purple-300 font-semibold">
              {eventContext?.eventName || 'None'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-300">Personality:</span>
            <span className="text-blue-300 capitalize">
              {eventContext?.aiPersonality || 'None'}
            </span>
          </div>

          {agentStatus.conversationHistory !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-300">Interactions:</span>
              <span className="text-green-300 font-semibold">
                {agentStatus.conversationHistory}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Last Response */}
      {lastResponse && (
        <div className="bg-blue-600/10 rounded-lg p-3 border border-blue-500/20">
          <h4 className="text-sm font-medium text-blue-300 mb-2 flex items-center">
            <Brain className="w-4 h-4 mr-1" />
            Last AI Response
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-300">Priority:</span>
              <span className={`font-semibold ${getPriorityColor(lastResponse.priority)}`}>
                {lastResponse.priority.toUpperCase()}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-300">Emotion:</span>
              <span className={`font-semibold ${getEmotionColor(lastResponse.emotion)}`}>
                {lastResponse.emotion}
              </span>
            </div>
            
            {lastResponse.message && (
              <div>
                <span className="text-gray-300">Message:</span>
                <p className="text-white text-sm mt-1 italic">"{lastResponse.message}"</p>
              </div>
            )}
            
            {lastResponse.suggestedMusicStyle && (
              <div className="flex justify-between">
                <span className="text-gray-300">Music:</span>
                <span className="text-purple-300">{lastResponse.suggestedMusicStyle}</span>
              </div>
            )}
            
            <div>
              <span className="text-gray-300">Reasoning:</span>
              <p className="text-gray-400 text-xs mt-1">{lastResponse.reasoning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Conversation History */}
      {conversationHistory.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
            <MessageSquare className="w-4 h-4 mr-1" />
            Recent Interactions
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {conversationHistory.slice(-5).reverse().map((interaction, index) => (
              <div
                key={index}
                className="p-2 bg-white/5 rounded text-xs"
              >
                <p className="text-gray-300">"{interaction.split(': ')[1]}"</p>
                <p className="text-gray-500 text-xs mt-1">{interaction.split(': ')[0]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Indicator */}
      {isAnalyzing && (
        <div className="bg-yellow-600/20 rounded-lg p-3 border border-yellow-500/30">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-yellow-300 text-sm">AI is watching and thinking...</span>
          </div>
          <p className="text-xs text-yellow-200 mt-1">
            Analyzing video feed with Gemini Vision + OpenAI reasoning
          </p>
        </div>
      )}

      {/* Info */}
      <div className={`bg-blue-600/10 rounded-lg p-2 border border-blue-500/20 ${!isActive ? 'opacity-50' : ''}`}>
        <p className="text-xs text-gray-300 text-center">
          <strong>Continuous AI Video Agent</strong><br />
          {isActive 
            ? 'Watching video feed and making intelligent hosting decisions every 3-5 seconds'
            : 'Click START to enable continuous AI video interaction'
          }
        </p>
      </div>
    </div>
  );
};