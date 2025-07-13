import React, { useEffect, useState } from 'react';

interface AudioDebuggerProps {
  audioElement: HTMLAudioElement | null;
  currentTrack: any;
  isPlaying: boolean;
}

export const AudioDebugger: React.FC<AudioDebuggerProps> = ({ 
  audioElement, 
  currentTrack, 
  isPlaying 
}) => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    if (audioElement) {
      const updateDebugInfo = () => {
        setDebugInfo({
          src: audioElement.src,
          readyState: audioElement.readyState,
          paused: audioElement.paused,
          currentTime: audioElement.currentTime,
          duration: audioElement.duration,
          volume: audioElement.volume,
          muted: audioElement.muted,
          networkState: audioElement.networkState,
          error: audioElement.error?.message || 'None'
        });
      };

      const interval = setInterval(updateDebugInfo, 1000);
      updateDebugInfo();

      return () => clearInterval(interval);
    }
  }, [audioElement]);

  if (!audioElement) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs">
      <h4 className="font-bold mb-2">Audio Debug Info</h4>
      <div className="space-y-1">
        <div>Track: {currentTrack?.title || 'None'}</div>
        <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
        <div>Paused: {debugInfo.paused ? 'Yes' : 'No'}</div>
        <div>Ready State: {debugInfo.readyState}</div>
        <div>Current Time: {debugInfo.currentTime?.toFixed(2) || 0}s</div>
        <div>Duration: {debugInfo.duration?.toFixed(2) || 0}s</div>
        <div>Volume: {debugInfo.volume}</div>
        <div>Error: {debugInfo.error}</div>
        <div>Network: {debugInfo.networkState}</div>
      </div>
    </div>
  );
};