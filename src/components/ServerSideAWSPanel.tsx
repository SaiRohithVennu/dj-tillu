import React from 'react';
import { Eye, Users, AlertCircle, CheckCircle, Camera, Zap, Play, Pause } from 'lucide-react';

interface VIPPerson {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
  recognitionCount: number;
  lastSeen?: Date;
}

interface ServerSideAWSPanelProps {
  vipPeople: VIPPerson[];
  recognitionResults: VIPPerson[];
  isEnabled: boolean;
  onToggle: () => void;
  status: string;
}

export const ServerSideAWSPanel: React.FC<ServerSideAWSPanelProps> = ({
  vipPeople,
  recognitionResults,
  isEnabled,
  onToggle,
  status
}) => {
  const formatLastSeen = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'text-green-300';
      case 'initializing': return 'text-yellow-300';
      case 'disabled': return 'text-gray-400';
      case 'error': return 'text-red-300';
      default: return 'text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'initializing': return <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />;
      case 'disabled': return <AlertCircle className="w-4 h-4 text-gray-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Camera className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Eye className="w-5 h-5 text-blue-400" />
          <span className="text-white font-medium">Face Recognition</span>
          {isEnabled && status === 'active' && (
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggle}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              isEnabled 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Status Display */}
      <div className="bg-white/10 rounded-lg p-3 border border-white/20">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            {getStatusIcon(status)}
            <span className="text-gray-300">Status:</span>
          </div>
          <span className={`font-semibold capitalize ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-300">VIP People:</span>
          <span className="text-purple-300">{vipPeople.length}</span>
        </div>
      </div>

      {/* Status Messages */}
      {status === 'disabled' && (
        <div className="bg-gray-600/20 border border-gray-500/40 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm">Face recognition is disabled</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {vipPeople.length === 0 
              ? 'Add VIP people in Event Setup to enable face recognition'
              : 'Click ON to enable face recognition'
            }
          </p>
        </div>
      )}

      {status === 'initializing' && (
        <div className="bg-yellow-600/20 border border-yellow-500/40 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-yellow-300 text-sm">Initializing AWS services...</span>
          </div>
          <p className="text-xs text-yellow-200 mt-1">
            Setting up face recognition for {vipPeople.length} VIP people
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-300 text-sm">AWS services unavailable</span>
          </div>
          <p className="text-xs text-red-200 mt-1">
            Check AWS credentials and permissions
          </p>
        </div>
      )}

      {/* VIP People List */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">VIP People</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {vipPeople.map((person) => {
            const recognized = recognitionResults.find(p => p.id === person.id);
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
                          {recognized.recognitionCount}x
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">Not detected</span>
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
              <p className="text-xs text-gray-500">Add people in Event Setup</p>
            </div>
          )}
        </div>
      </div>

      {/* Recognition Stats */}
      {recognitionResults.length > 0 && (
        <div className="bg-green-600/10 rounded-lg p-3 border border-green-500/20">
          <div className="grid grid-cols-2 gap-4 text-center text-xs">
            <div>
              <p className="text-green-300 font-semibold">{recognitionResults.length}</p>
              <p className="text-gray-400">VIPs Detected</p>
            </div>
            <div>
              <p className="text-green-300 font-semibold">
                {recognitionResults.reduce((sum, p) => sum + p.recognitionCount, 0)}
              </p>
              <p className="text-gray-400">Total Recognitions</p>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-600/10 rounded-lg p-2 border border-blue-500/20">
        <p className="text-xs text-gray-300 text-center">
          <strong>Server-Side AWS Integration</strong><br />
          {status === 'active' 
            ? 'Scanning for VIP faces every 3 seconds using AWS Rekognition'
            : status === 'disabled'
            ? 'Enable face recognition to start VIP detection'
            : 'Setting up AWS Rekognition services'
          }
        </p>
      </div>
    </div>
  );
};

export default ServerSideAWSPanel;