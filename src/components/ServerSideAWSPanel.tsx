import React from 'react';
import { Eye, Users, AlertCircle, CheckCircle, Camera, Zap, Server } from 'lucide-react';

interface VIPPerson {
  id: string;
  name: string;
  role: string;
  recognitionCount: number;
  lastSeen?: Date;
}

interface CrowdAnalysis {
  faceCount: number;
  emotions: string[];
  averageAge: number;
  dominantEmotion: string;
}

interface ServerSideAWSPanelProps {
  isInitialized: boolean;
  isAnalyzing: boolean;
  recognizedPeople: VIPPerson[];
  lastAnalysis: Date | null;
  error: string | null;
  crowdAnalysis: CrowdAnalysis;
  vipPeople: VIPPerson[];
  enabled: boolean;
}

export const ServerSideAWSPanel: React.FC<ServerSideAWSPanelProps> = ({
  isInitialized,
  isAnalyzing,
  recognizedPeople,
  lastAnalysis,
  error,
  crowdAnalysis,
  vipPeople,
  enabled
}) => {
  const formatLastSeen = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'happy': return 'text-green-400';
      case 'excited': return 'text-yellow-400';
      case 'surprised': return 'text-blue-400';
      case 'calm': return 'text-blue-300';
      case 'sad': return 'text-gray-400';
      case 'angry': return 'text-red-400';
      default: return 'text-purple-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Server className="w-5 h-5 text-blue-400" />
          <span className="text-white font-medium">Server-Side AWS</span>
          {isInitialized && isAnalyzing && (
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          )}
        </div>
        <div className="text-xs text-gray-400">
          {vipPeople.length} VIPs • Edge Function
        </div>
      </div>

      {/* Initialization Status */}
      {!isInitialized && !error && enabled && (
        <div className="bg-yellow-600/20 border border-yellow-500/40 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-yellow-300 text-sm">Initializing server-side AWS...</span>
          </div>
          <p className="text-xs text-yellow-200 mt-1">
            Setting up S3 bucket and Rekognition collection
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
          <p className="text-xs text-red-200 mt-1">
            Check Supabase Edge Function logs and AWS credentials
          </p>
        </div>
      )}

      {/* Status */}
      {isInitialized && (
        <div className="bg-white/10 rounded-lg p-3 border border-white/20">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-300 flex items-center">
              <Server className="w-3 h-3 mr-1" />
              Status:
            </span>
            <span className={`font-semibold ${
              isAnalyzing ? 'text-blue-300' : 'text-green-300'
            }`}>
              {isAnalyzing ? 'Analyzing...' : 'Active'}
            </span>
          </div>
          
          {lastAnalysis && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Last Scan:</span>
              <span className="text-purple-300">{formatLastSeen(lastAnalysis)}</span>
            </div>
          )}
        </div>
      )}

      {/* Crowd Analysis */}
      {isInitialized && (
        <div className="bg-purple-600/10 rounded-lg p-3 border border-purple-500/20">
          <h4 className="text-sm font-medium text-purple-300 mb-2 flex items-center">
            <Eye className="w-4 h-4 mr-1" />
            Live Crowd Analysis
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Faces:</span>
              <span className="text-white font-bold">{crowdAnalysis.faceCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Avg Age:</span>
              <span className="text-white font-bold">
                {crowdAnalysis.averageAge > 0 ? Math.round(crowdAnalysis.averageAge) : '-'}
              </span>
            </div>
            <div className="col-span-2 flex items-center justify-between">
              <span className="text-gray-300">Mood:</span>
              <span className={`font-bold capitalize ${getEmotionColor(crowdAnalysis.dominantEmotion)}`}>
                {crowdAnalysis.dominantEmotion}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIP Recognition Results */}
      {isInitialized && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">VIP Recognition</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {vipPeople.map((person) => {
              const recognized = recognizedPeople.find(p => p.id === person.id);
              const isRecognized = recognized && recognized.recognitionCount > 0;
              
              return (
                <div
                  key={person.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isRecognized
                      ? 'bg-green-500/20 border-green-500/40'
                      : 'bg-white/5 border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {person.imageUrl ? (
                        <img
                          src={person.imageUrl}
                          alt={person.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-gray-300" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-white">{person.name}</p>
                        <p className="text-xs text-gray-400">{person.role}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {isRecognized ? (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-green-300">
                            ✅ Recognized {recognized.recognitionCount}x
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">👁️ Scanning...</span>
                      )}
                      {recognized?.lastSeen && (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatLastSeen(recognized.lastSeen)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {vipPeople.length === 0 && (
              <div className="text-center py-4">
                <Camera className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No VIP people configured</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recognition Stats */}
      {recognizedPeople.length > 0 && (
        <div className="bg-green-600/10 rounded-lg p-3 border border-green-500/20">
          <div className="grid grid-cols-2 gap-4 text-center text-xs">
            <div>
              <p className="text-green-300 font-semibold">{recognizedPeople.length}</p>
              <p className="text-gray-400">VIPs Detected</p>
            </div>
            <div>
              <p className="text-green-300 font-semibold">
                {recognizedPeople.reduce((sum, g) => sum + g.recognitionCount, 0)}
              </p>
              <p className="text-gray-400">Total Recognitions</p>
            </div>
          </div>
        </div>
      )}

      {/* Server Info */}
      <div className="bg-blue-600/10 rounded-lg p-2 border border-blue-500/20">
        <p className="text-xs text-gray-300 text-center">
          <strong>Server-Side AWS Integration</strong><br />
          {isInitialized ? 'Running on Supabase Edge Functions' : enabled ? 'Initializing...' : 'Disabled'}
        </p>
      </div>
    </div>
  );
};