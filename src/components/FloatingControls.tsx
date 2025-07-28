import React from 'react';
import { Play, Pause, Settings, VolumeX, Volume2, Calendar } from 'lucide-react';

interface FloatingControlsProps {
  isPlaying: boolean;
  onPlayToggle: () => void;
  onSettingsToggle: () => void;
  isSilenced?: boolean;
  onStartSession: () => void;
  hasStarted: boolean;
  onToggleSilence?: () => void;
  onForceSilence?: (duration?: number) => void;
  onShowEventSetup?: () => void;
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({
  isPlaying,
  onPlayToggle,
  onSettingsToggle,
  isSilenced = false,
  onStartSession,
  hasStarted
  onToggleSilence,
  onForceSilence,
  onShowEventSetup
}) => {
  const handleMainPlayClick = () => {
    if (!hasStarted) {
      // First time clicking - start the session
      onStartSession();
    } else {
      // Normal play/pause toggle
      onPlayToggle();
    }
  };

  return (
    <>
      {/* Main Play/Pause Control - Center Bottom */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={handleMainPlayClick}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
            hasStarted && isPlaying
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 shadow-purple-500/50 scale-110'
              : !hasStarted
              ? 'bg-gradient-to-r from-green-500 to-blue-500 shadow-green-500/50 hover:scale-105 animate-pulse'
              : 'bg-black/40 backdrop-blur-xl border border-white/30 hover:scale-105'
          }`}
          title={!hasStarted ? 'Start DJ Tillu Session' : isPlaying ? 'Pause' : 'Play'}
        >
          {!hasStarted ? (
            <Play className="w-8 h-8 text-white ml-1" />
          ) : isPlaying ? (
            <Pause className="w-8 h-8 text-white" />
          ) : (
            <Play className="w-8 h-8 text-white ml-1" />
          )}
        </button>
        
      </div>

      {/* Event Setup Button - Top Left */}
      {onShowEventSetup && (
        <div className="absolute top-6 left-20 z-50">
          <button
            onClick={onShowEventSetup}
            className="w-12 h-12 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors border border-white/20"
            title="Event Setup"
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Silence Control - Bottom Left */}
      {onToggleSilence && (
        <div className="absolute bottom-12 left-8 z-50">
          <button
            onClick={onToggleSilence}
            className={`w-12 h-12 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors border border-white/20 ${
              isSilenced ? 'bg-red-500/30' : 'bg-black/30'
            }`}
            title={isSilenced ? 'Enable announcements' : 'Silence announcements'}
          >
            {isSilenced ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          {onForceSilence && (
            <div className="absolute -top-12 left-0 text-xs text-white bg-black/50 px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
              Hold to silence for 30s
            </div>
          )}
        </div>
      )}

      {/* Settings Button - Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={onSettingsToggle}
          className="w-12 h-12 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors border border-white/20"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </>
  );
};