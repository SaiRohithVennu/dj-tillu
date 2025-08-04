import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Settings, Volume2, Music } from 'lucide-react';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useTrackLibrary } from './hooks/useTrackLibrary';
import { useMoodAnalysis } from './hooks/useMoodAnalysis';
import { Track } from './data/tracks';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Core hooks
  const { tracks, isLoading: tracksLoading } = useTrackLibrary();
  const { mood, energy, crowdSize } = useMoodAnalysis();
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    currentTrack,
    isLoading,
    error,
    loadTrack,
    togglePlay,
    seek,
    setVolume
  } = useAudioPlayer();

  const handleStartSession = () => {
    setHasStarted(true);
    if (tracks.length > 0 && !currentTrack) {
      loadTrack(tracks[0]);
    }
  };

  const handleTrackSelect = (track: Track) => {
    loadTrack(track);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 transition-all duration-2000 ${
          isPlaying ? 'animate-pulse' : ''
        }`} />
        
        {isPlaying && (
          <>
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-purple-400 rounded-full opacity-30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `float 3s ease-in-out infinite ${Math.random() * 2}s`,
                  animationDirection: Math.random() > 0.5 ? 'normal' : 'reverse'
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Hidden video for future AI features */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="hidden"
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Volume2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            DJ Tillu
          </h1>
          <p className="text-xl text-purple-200 mb-2">AI-Powered DJ Experience</p>
          <p className="text-gray-300">
            {hasStarted ? 'Your AI DJ is ready to rock!' : 'Click the button below to start your session'}
          </p>
        </div>

        {/* Current Track Display */}
        {currentTrack && (
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-8 mb-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              {currentTrack.albumArt && (
                <div className="w-32 h-32 mx-auto mb-6 rounded-xl overflow-hidden border-2 border-white/30 shadow-xl">
                  <img 
                    src={currentTrack.albumArt} 
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h3 className="text-xl font-bold text-white mb-2">{currentTrack.title}</h3>
              <p className="text-gray-300 mb-4">{currentTrack.artist}</p>
              <div className="flex justify-center space-x-4 text-sm text-gray-400 mb-6">
                <span>{currentTrack.genre}</span>
                <span>•</span>
                <span>{currentTrack.bpm} BPM</span>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div 
                  className="w-full h-2 bg-gray-700 rounded-full cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = x / rect.width;
                    seek(percentage * duration);
                  }}
                >
                  <div 
                    className="h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-100 shadow-lg"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Volume Control */}
              <div className="flex items-center space-x-3">
                <Volume2 className="w-4 h-4 text-gray-300" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${volume}%, rgba(255,255,255,0.2) ${volume}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
                <span className="text-sm text-gray-300 w-12">{volume}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Play Button */}
        <div className="mb-8">
          <button
            onClick={hasStarted ? togglePlay : handleStartSession}
            disabled={isLoading}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              hasStarted && isPlaying
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 shadow-purple-500/50 scale-110'
                : !hasStarted
                ? 'bg-gradient-to-r from-green-500 to-blue-500 shadow-green-500/50 hover:scale-105 animate-pulse'
                : 'bg-black/40 backdrop-blur-xl border border-white/30 hover:scale-105'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!hasStarted ? 'Start DJ Tillu Session' : isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : !hasStarted ? (
              <Play className="w-10 h-10 text-white ml-1" />
            ) : isPlaying ? (
              <Pause className="w-10 h-10 text-white" />
            ) : (
              <Play className="w-10 h-10 text-white ml-1" />
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 mb-6 max-w-md">
            <p className="text-red-300 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Track Library */}
        {hasStarted && (
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6 max-w-2xl w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Music className="w-5 h-5 mr-2" />
              Track Library
            </h2>
            
            {tracksLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-300">Loading tracks from Audius...</p>
              </div>
            ) : tracks.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      currentTrack?.id === track.id
                        ? 'bg-purple-600/30 border-purple-500/60 backdrop-blur-sm'
                        : 'bg-white/10 border-white/20 hover:bg-white/20 backdrop-blur-sm'
                    }`}
                    onClick={() => handleTrackSelect(track)}
                  >
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (currentTrack?.id === track.id) {
                            togglePlay();
                          } else {
                            handleTrackSelect(track);
                          }
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          currentTrack?.id === track.id && isPlaying
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'bg-white/20 text-white hover:bg-purple-600'
                        }`}
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{track.title}</p>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-gray-300">{track.artist}</span>
                          <span className="text-purple-300">{track.bpm} BPM</span>
                          <span className="text-gray-400">{formatTime(track.duration)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="px-2 py-1 bg-purple-500/30 text-purple-200 rounded text-xs">
                        {track.genre}
                      </span>
                      {currentTrack?.id === track.id && (
                        <span className="text-purple-300 font-medium text-xs flex items-center">
                          <div className="w-2 h-2 bg-purple-400 rounded-full mr-1 animate-pulse"></div>
                          Playing
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Music className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-300 mb-2">No tracks available</p>
                <p className="text-gray-400 text-sm">Loading music library...</p>
              </div>
            )}
          </div>
        )}

        {/* Mood Display */}
        {hasStarted && (
          <div className="mt-6 bg-black/20 backdrop-blur-xl rounded-xl border border-white/10 p-4 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-3 text-center">Current Vibe</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-300">Mood</p>
                <p className="text-sm font-bold text-purple-300">{mood}</p>
              </div>
              <div>
                <p className="text-xs text-gray-300">Energy</p>
                <div className="w-full bg-white/20 rounded-full h-2 mb-1">
                  <div 
                    className="h-2 bg-gradient-to-r from-yellow-400 to-red-400 rounded-full transition-all duration-500"
                    style={{ width: `${energy}%` }}
                  />
                </div>
                <p className="text-xs text-yellow-300 font-bold">{energy}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-300">Crowd</p>
                <p className="text-sm font-bold text-green-300">{crowdSize}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Button */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-12 h-12 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors border border-white/20"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-20 right-6 z-50 bg-black/80 backdrop-blur-xl rounded-xl border border-white/20 p-6 max-w-sm shadow-2xl">
          <h3 className="text-lg font-bold text-white mb-4">DJ Tillu Settings</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">System Status</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tracks Loaded:</span>
                  <span className="text-white">{tracks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Mood:</span>
                  <span className="text-purple-300">{mood}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Session:</span>
                  <span className="text-green-300">{hasStarted ? 'Active' : 'Not Started'}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Features</h4>
              <div className="space-y-2 text-xs text-gray-400">
                <div>✅ Audius Music Integration</div>
                <div>✅ AI Mood Analysis</div>
                <div>✅ Real-time Audio Player</div>
                <div>🔄 Voice Announcements (Coming Soon)</div>
                <div>🔄 Face Recognition (Coming Soon)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
      `}</style>
    </div>
  );
}

export default App;