import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Users, Eye } from 'lucide-react';

interface VideoAnalyzerProps {
  onMoodChange: (mood: string) => void;
}

export const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({ onMoodChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState(0);
  const [analysisData, setAnalysisData] = useState({
    movement: 'High',
    lighting: 'Optimal',
    density: 'Medium'
  });

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsVideoActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };

  const stopVideo = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsVideoActive(false);
    }
  };

  useEffect(() => {
    if (isVideoActive) {
      const interval = setInterval(() => {
        setDetectedFaces(Math.floor(Math.random() * 15) + 5);
        setAnalysisData({
          movement: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
          lighting: ['Poor', 'Good', 'Optimal'][Math.floor(Math.random() * 3)],
          density: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isVideoActive]);

  return (
    <div className="bg-gradient-to-b from-gray-900 to-black border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-purple-300 mb-2">Crowd Analysis</h3>
        <div className="h-1 w-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded mx-auto"></div>
      </div>

      {/* Video Feed */}
      <div className="relative mb-4">
        <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden border border-purple-500/20">
          {isVideoActive ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">Video feed inactive</p>
              </div>
            </div>
          )}
        </div>
        
        {isVideoActive && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center">
            <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
            LIVE
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={isVideoActive ? stopVideo : startVideo}
          className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center transition-colors ${
            isVideoActive
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {isVideoActive ? (
            <>
              <CameraOff className="w-4 h-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Start
            </>
          )}
        </button>
      </div>

      {/* Analysis Results */}
      {isVideoActive && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Detected Faces
            </span>
            <span className="text-purple-300 font-mono">{detectedFaces}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-300 flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Movement
            </span>
            <span className={`font-semibold ${
              analysisData.movement === 'High' ? 'text-green-400' :
              analysisData.movement === 'Medium' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {analysisData.movement}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Lighting</span>
            <span className={`font-semibold ${
              analysisData.lighting === 'Optimal' ? 'text-green-400' :
              analysisData.lighting === 'Good' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {analysisData.lighting}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Crowd Density</span>
            <span className={`font-semibold ${
              analysisData.density === 'High' ? 'text-green-400' :
              analysisData.density === 'Medium' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {analysisData.density}
            </span>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};