import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Eye, EyeOff } from 'lucide-react';

interface FullscreenVideoBackgroundProps {
  onVideoReady?: (video: HTMLVideoElement | null) => void;
}

export const FullscreenVideoBackground: React.FC<FullscreenVideoBackgroundProps> = ({
  onVideoReady
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [streamInfo, setStreamInfo] = useState<any>(null);

  const addDebugLog = (message: string) => {
    console.log('🎥 VIDEO DEBUG:', message);
    setDebugLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Effect to handle video element setup when both stream and ref are available
  useEffect(() => {
    if (mediaStream && videoRef.current) {
      addDebugLog('Attaching stream to video element...');
      
      const video = videoRef.current;
      video.srcObject = mediaStream;
      
      // Add comprehensive event listeners
      video.onloadstart = () => addDebugLog('Video: loadstart event');
      video.onloadeddata = () => addDebugLog('Video: loadeddata event');
      video.oncanplay = () => addDebugLog('Video: canplay event');
      video.onplaying = () => addDebugLog('Video: playing event');
      video.onpause = () => addDebugLog('Video: pause event');
      video.onerror = (e) => addDebugLog(`Video error: ${e}`);
      
      video.onloadedmetadata = async () => {
        addDebugLog('✅ Video metadata loaded');
        try {
          addDebugLog('Attempting to play video...');
          await video.play();
          addDebugLog('✅ Video playing successfully');
          setIsVideoReady(true);
          
          // Notify parent component that video is ready
          if (onVideoReady) {
            onVideoReady(video);
          }
        } catch (playError: any) {
          addDebugLog(`❌ Video play error: ${playError.message}`);
          console.error('Video play error:', playError);
        }
      };
    }
  }, [mediaStream, videoRef.current]);

  useEffect(() => {
    // Auto-start video on component mount
    addDebugLog('Component mounted, starting video...');
    startVideo();
    
    return () => {
      addDebugLog('Component unmounting, stopping video...');
      stopVideo();
    };
  }, []);

  const startVideo = async () => {
    try {
      addDebugLog('Starting getUserMedia request...');
      
      // Check if mediaDevices is available
      if (!navigator.mediaDevices) {
        throw new Error('navigator.mediaDevices not available');
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not available');
      }

      addDebugLog('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user'
        } 
      });
      
      addDebugLog(`✅ Got stream: ${stream ? 'YES' : 'NO'}`);
      
      if (!stream) {
        throw new Error('Stream is null/undefined');
      }

      // Check video tracks
      const videoTracks = stream.getVideoTracks();
      addDebugLog(`Video tracks count: ${videoTracks.length}`);
      
      if (videoTracks.length === 0) {
        throw new Error('No video tracks in stream');
      }

      // Log track details
      videoTracks.forEach((track, index) => {
        addDebugLog(`Track ${index}: ${track.label}, enabled: ${track.enabled}, readyState: ${track.readyState}`);
      });

      // Store stream info for debugging
      setStreamInfo({
        id: stream.id,
        active: stream.active,
        videoTracks: videoTracks.length,
        trackLabels: videoTracks.map(t => t.label)
      });
      
      // Set the media stream - this will trigger the useEffect above
      setMediaStream(stream);
      setHasPermission(true);
      addDebugLog('✅ Video setup complete');
      
    } catch (err: any) {
      addDebugLog(`❌ Error: ${err.message}`);
      console.error('Camera access error:', err);
      setHasPermission(false);
      setMediaStream(null);
      setStreamInfo({ error: err.message });
    }
  };

  const stopVideo = () => {
    addDebugLog('Stopping video...');
    
    // Notify parent that video is no longer available
    if (onVideoReady) {
      onVideoReady(null);
    }
    
    if (mediaStream) {
      const tracks = mediaStream.getTracks();
      addDebugLog(`Stopping ${tracks.length} tracks`);
      tracks.forEach(track => {
        addDebugLog(`Stopping track: ${track.label}`);
        track.stop();
      });
      setMediaStream(null);
      setIsVideoReady(false);
      setStreamInfo(null);
    }
  };

  const toggleVideo = () => {
    if (mediaStream) {
      stopVideo();
    } else {
      startVideo();
    }
  };

  const toggleOverlays = () => {
    setShowOverlays(!showOverlays);
  };

  const toggleDebug = () => {
    setDebugMode(!debugMode);
  };
  return (
    <div className="absolute inset-0 w-full h-full z-0">
      {/* Video Background - HIGHEST PRIORITY */}
      {mediaStream && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover z-0 ${
            debugMode ? 'border-8 border-red-500' : ''
          }`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            filter: debugMode ? 'brightness(1.5) contrast(1.2)' : 'brightness(1.2)',
            border: debugMode ? '8px solid #ef4444' : 'none'
          }}
        />
      )}

      {/* Fallback Background - Only show if video not ready */}
      {(!mediaStream || !isVideoReady) && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center z-0">
          {hasPermission === false ? (
            <div className="text-center text-white z-10">
              <CameraOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Camera Access Denied</h3>
              <p className="text-gray-300 mb-4">Enable camera access for the full DJ experience</p>
              <button
                onClick={startVideo}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="text-center text-white z-10">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Initializing Camera</h3>
              <p className="text-gray-300">Setting up your live DJ experience...</p>
              {mediaStream && !isVideoReady && (
                <p className="text-sm text-purple-300 mt-2">Camera active, loading video...</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Overlay - Only show if enabled */}
      {showOverlays && (
        <div className="absolute inset-0 bg-black/5 z-1"></div>
      )}

      {/* Control Buttons */}
      <div className="absolute top-6 right-6 z-50 flex space-x-2">
        {/* Camera Toggle */}
        <button
          onClick={toggleVideo}
          className="w-12 h-12 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors border border-white/20"
          title={mediaStream ? 'Turn off camera' : 'Turn on camera'}
        >
          {mediaStream ? (
            <CameraOff className="w-5 h-5" />
          ) : (
            <Camera className="w-5 h-5" />
          )}
        </button>

        {/* Overlay Toggle */}
        <button
          onClick={toggleOverlays}
          className="w-12 h-12 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors border border-white/20"
          title={showOverlays ? 'Hide overlays' : 'Show overlays'}
        >
          {showOverlays ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>

        {/* Debug Toggle */}
        <button
          onClick={toggleDebug}
          className={`w-12 h-12 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-500/50 transition-colors border border-white/20 ${
            debugMode ? 'bg-red-500/30' : 'bg-black/30'
          }`}
          title="Toggle debug mode"
        >
          <span className="text-xs font-bold">D</span>
        </button>
      </div>

      {/* Enhanced Debug Info */}
      {/* Debug info only in development mode and when explicitly enabled */}
      {process.env.NODE_ENV === 'development' && debugMode && (
        <div className="absolute top-6 left-6 z-50 bg-black/90 text-white p-2 rounded-lg text-xs">
          <div className="text-green-400 font-bold">Video Status</div>
          <div>Active: {mediaStream ? 'Yes' : 'No'}</div>
          <div>Ready: {isVideoReady ? 'Yes' : 'No'}</div>
        </div>
      )}

      {/* Animated Particles Overlay */}
      {showOverlays && (
        <div className="absolute inset-0 pointer-events-none z-2">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-400/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float 6s ease-in-out infinite ${Math.random() * 3}s`,
                animationDirection: Math.random() > 0.5 ? 'normal' : 'reverse'
              }}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-30px) scale(1.2);
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
};