import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mic, MicOff, Play, Square, Users, Brain, Volume2 } from 'lucide-react';
import { useContinuousAIAgent } from '../hooks/useContinuousAIAgent';

interface ContinuousAIAgentPanelProps {
  vipPeople: Array<{
    id: string;
    name: string;
    role: string;
    photoUrl?: string;
    customGreeting?: string;
  }>;
  eventDetails: {
    name: string;
    type: string;
    duration: number;
    aiPersonality: string;
  };
  onAnnouncement: (text: string, priority: 'high' | 'medium' | 'low') => void;
}

export const ContinuousAIAgentPanel: React.FC<ContinuousAIAgentPanelProps> = ({
  vipPeople,
  eventDetails,
  onAnnouncement
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const {
    startAgent,
    stopAgent,
    isRunning,
    lastActivity,
    recognizedPeople,
    agentStatus,
    stats
  } = useContinuousAIAgent({
    videoRef,
    vipPeople,
    eventDetails,
    onAnnouncement,
    enabled: isActive && cameraEnabled
  });

  // Initialize camera
  const initializeCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
      setCameraEnabled(true);
    } catch (error) {
      console.error('Failed to access camera:', error);
      alert('Camera access is required for the AI agent to work');
    }
  };

  // Cleanup camera
  const cleanupCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraEnabled(false);
  };

  // Start/Stop agent
  const handleToggleAgent = async () => {
    if (!isActive) {
      if (!cameraEnabled) {
        await initializeCamera();
      }
      if (cameraEnabled) {
        startAgent();
        setIsActive(true);
        onAnnouncement(
          `Hello everyone! I'm your AI host for ${eventDetails.name}. I'll be watching and helping make this event amazing!`,
          'high'
        );
      }
    } else {
      stopAgent();
      setIsActive(false);
      cleanupCamera();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCamera();
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isRunning ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Brain className={`w-6 h-6 ${isRunning ? 'text-green-600' : 'text-gray-600'}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">🎥 AI Video Agent</h3>
            <p className="text-sm text-gray-600">
              {isRunning ? 'Actively hosting your event' : 'Ready to start hosting'}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleToggleAgent}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isActive
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isActive ? (
            <>
              <Square className="w-4 h-4 inline mr-2" />
              STOP
            </>
          ) : (
            <>
              <Play className="w-4 h-4 inline mr-2" />
              START
            </>
          )}
        </button>
      </div>

      {/* Camera Feed */}
      <div className="mb-6">
        <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          
          {!cameraEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm opacity-75">Camera not active</p>
              </div>
            </div>
          )}
          
          {cameraEnabled && (
            <div className="absolute top-2 left-2">
              <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                isRunning ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
                {isRunning ? 'LIVE' : 'READY'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agent Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">People Recognized</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{recognizedPeople.length}</div>
          {recognizedPeople.length > 0 && (
            <div className="mt-2 space-y-1">
              {recognizedPeople.slice(0, 3).map((person, index) => (
                <div key={index} className="text-xs text-gray-600">
                  {person.name} ({person.confidence}% match)
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Volume2 className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Announcements</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalAnnouncements}</div>
          <div className="text-xs text-gray-600 mt-1">
            Last: {stats.lastAnnouncementTime || 'None'}
          </div>
        </div>
      </div>

      {/* Current Activity */}
      {lastActivity && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Current Activity</h4>
          <p className="text-sm text-blue-700">{lastActivity}</p>
        </div>
      )}

      {/* Agent Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Agent Status</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${
              agentStatus === 'active' ? 'text-green-600' : 
              agentStatus === 'idle' ? 'text-yellow-600' : 'text-gray-600'
            }`}>
              {agentStatus.charAt(0).toUpperCase() + agentStatus.slice(1)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Personality:</span>
            <span className="font-medium text-gray-900">{eventDetails.aiPersonality}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Event:</span>
            <span className="font-medium text-gray-900">{eventDetails.name}</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {!isActive && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">How to Use:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Click START to begin AI hosting</li>
            <li>• Allow camera access when prompted</li>
            <li>• The AI will recognize VIP people and make announcements</li>
            <li>• Wave at the camera to test interaction</li>
          </ul>
        </div>
      )}
    </div>
  );
};