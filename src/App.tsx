import React, { useState, useEffect } from 'react';
import { Music, Settings, Play, Pause, SkipForward, Volume2, Users, Camera, Mic, Brain, Zap, Calendar, Upload } from 'lucide-react';
import DJInterface from './components/DJInterface';
import TrackList from './components/TrackList';
import NowPlaying from './components/NowPlaying';
import AudioVisualizer from './components/AudioVisualizer';
import MoodDisplay from './components/MoodDisplay';
import AIDJPanel from './components/AIDJPanel';
import DynamicBackground from './components/DynamicBackground';
import FloatingControls from './components/FloatingControls';
import DraggablePanel from './components/DraggablePanel';
import AudiusBrowser from './components/AudiusBrowser';
import FMABrowser from './components/FMABrowser';
import WhooshMoodBrowser from './components/WhooshMoodBrowser';
import VoiceAnnouncements from './components/VoiceAnnouncements';
import VideoAnalyzer from './components/VideoAnalyzer';
import GeminiMoodDisplay from './components/GeminiMoodDisplay';
import SmartEventDashboard from './components/SmartEventDashboard';
import EventDetailsManager from './components/EventDetailsManager';
import MoodPlaylistManager from './components/MoodPlaylistManager';
import SupabaseTrackManager from './components/SupabaseTrackManager';
import SupabaseTrackUploader from './components/SupabaseTrackUploader';
import FaceRecognitionSystem from './components/FaceRecognitionSystem';
import FullscreenVideoBackground from './components/FullscreenVideoBackground';
import EventSetupWizard from './components/EventSetupWizard';
import AWSFaceRecognitionPanel from './components/AWSFaceRecognitionPanel';
import ServerSideAWSPanel from './components/ServerSideAWSPanel';
import OpenAIEventHostPanel from './components/OpenAIEventHostPanel';
import ContinuousAIAgentPanel from './components/ContinuousAIAgentPanel';
import EventPlaylistUploader from './components/EventPlaylistUploader';
import EventPlaylistManager from './components/EventPlaylistManager';
import { useMusicPlayer } from './hooks/useMusicPlayer';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useMoodAnalysis } from './hooks/useMoodAnalysis';
import { useAIMoodDJ } from './hooks/useAIMoodDJ';
import { useSmartEventDJ } from './hooks/useSmartEventDJ';
import { useTrackLibrary } from './hooks/useTrackLibrary';
import { useWandbIntegration } from './hooks/useWandbIntegration';
import { useGeminiMoodAnalysis } from './hooks/useGeminiMoodAnalysis';
import { useSmartEventEmcee } from './hooks/useSmartEventEmcee';
import { useAWSFaceRecognition } from './hooks/useAWSFaceRecognition';
import { useServerSideAWSFaceRecognition } from './hooks/useServerSideAWSFaceRecognition';
import { useOpenAIEventHost } from './hooks/useOpenAIEventHost';
import { useContinuousAIAgent } from './hooks/useContinuousAIAgent';
import { useEventAwareTrackLibrary } from './hooks/useEventAwareTrackLibrary';

function App() {
  const [activePanel, setActivePanel] = useState<string>('dj');
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEventSetup, setShowEventSetup] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [showEventPlaylistManager, setShowEventPlaylistManager] = useState(false);

  const { 
    currentTrack, 
    isPlaying, 
    volume, 
    progress,
    playlist,
    playTrack,
    pauseTrack,
    nextTrack,
    setVolume,
    addToPlaylist,
    removeFromPlaylist
  } = useMusicPlayer();

  const { audioContext, analyser } = useAudioPlayer();
  const { mood, energy, dominantColor } = useMoodAnalysis(analyser);
  const { aiRecommendations, isAnalyzing } = useAIMoodDJ(mood, energy);
  const { eventStatus, eventPhase, specialMoments } = useSmartEventDJ(currentEvent);
  const { tracks, isLoading: tracksLoading, searchTracks, addTrack } = useTrackLibrary();
  const { logEvent, isConnected: wandbConnected } = useWandbIntegration();
  const { geminiMood, geminiEnergy, isAnalyzing: geminiAnalyzing } = useGeminiMoodAnalysis();
  const { announcements, isActive: emceeActive } = useSmartEventEmcee(currentEvent);
  const { detectedFaces, isActive: faceRecognitionActive } = useAWSFaceRecognition();
  const { recognizedPeople, isProcessing: serverAWSProcessing } = useServerSideAWSFaceRecognition();
  const { hostMessages, isHostActive } = useOpenAIEventHost(currentEvent);
  const { agentMessages, isAgentActive } = useContinuousAIAgent();
  const { eventTracks, activePlaylist, switchPlaylist } = useEventAwareTrackLibrary(currentEvent?.id);

  useEffect(() => {
    if (currentTrack && mood) {
      logEvent('track_mood_match', {
        track: currentTrack.title,
        mood: mood,
        energy: energy,
        timestamp: Date.now()
      });
    }
  }, [currentTrack, mood, energy, logEvent]);

  const handleEventCreated = (event: any) => {
    setCurrentEvent(event);
    setShowEventSetup(false);
  };

  const panels = [
    { id: 'dj', label: 'DJ Interface', icon: Music },
    { id: 'tracks', label: 'Track Library', icon: Upload },
    { id: 'mood', label: 'Mood Analysis', icon: Brain },
    { id: 'ai', label: 'AI DJ', icon: Zap },
    { id: 'audius', label: 'Audius Browser', icon: Music },
    { id: 'fma', label: 'FMA Browser', icon: Music },
    { id: 'whoosh', label: 'Whoosh Mood', icon: Music },
    { id: 'voice', label: 'Voice Announcements', icon: Mic },
    { id: 'video', label: 'Video Analysis', icon: Camera },
    { id: 'gemini', label: 'Gemini Mood', icon: Brain },
    { id: 'event', label: 'Smart Event', icon: Calendar },
    { id: 'supabase', label: 'Track Manager', icon: Upload },
    { id: 'face', label: 'Face Recognition', icon: Users },
    { id: 'aws-face', label: 'AWS Face Recognition', icon: Users },
    { id: 'server-aws', label: 'Server AWS', icon: Users },
    { id: 'openai-host', label: 'OpenAI Host', icon: Mic },
    { id: 'continuous-ai', label: 'Continuous AI', icon: Brain },
  ];

  const renderActivePanel = () => {
    switch (activePanel) {
      case 'dj':
        return <DJInterface currentTrack={currentTrack} isPlaying={isPlaying} onPlay={playTrack} onPause={pauseTrack} onNext={nextTrack} />;
      case 'tracks':
        return <TrackList tracks={eventTracks || tracks} onTrackSelect={playTrack} currentTrack={currentTrack} />;
      case 'mood':
        return <MoodDisplay mood={mood} energy={energy} dominantColor={dominantColor} />;
      case 'ai':
        return <AIDJPanel recommendations={aiRecommendations} isAnalyzing={isAnalyzing} onTrackSelect={playTrack} />;
      case 'audius':
        return <AudiusBrowser onTrackSelect={playTrack} />;
      case 'fma':
        return <FMABrowser onTrackSelect={playTrack} />;
      case 'whoosh':
        return <WhooshMoodBrowser mood={mood} energy={energy} onTrackSelect={playTrack} />;
      case 'voice':
        return <VoiceAnnouncements currentTrack={currentTrack} mood={mood} energy={energy} />;
      case 'video':
        return <VideoAnalyzer />;
      case 'gemini':
        return <GeminiMoodDisplay mood={geminiMood} energy={geminiEnergy} isAnalyzing={geminiAnalyzing} />;
      case 'event':
        return <SmartEventDashboard event={currentEvent} eventStatus={eventStatus} eventPhase={eventPhase} specialMoments={specialMoments} />;
      case 'supabase':
        return <SupabaseTrackManager onTrackSelect={playTrack} />;
      case 'face':
        return <FaceRecognitionSystem />;
      case 'aws-face':
        return <AWSFaceRecognitionPanel detectedFaces={detectedFaces} isActive={faceRecognitionActive} />;
      case 'server-aws':
        return <ServerSideAWSPanel recognizedPeople={recognizedPeople} isProcessing={serverAWSProcessing} />;
      case 'openai-host':
        return <OpenAIEventHostPanel messages={hostMessages} isActive={isHostActive} event={currentEvent} />;
      case 'continuous-ai':
        return <ContinuousAIAgentPanel messages={agentMessages} isActive={isAgentActive} />;
      default:
        return <DJInterface currentTrack={currentTrack} isPlaying={isPlaying} onPlay={playTrack} onPause={pauseTrack} onNext={nextTrack} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      <DynamicBackground mood={mood} energy={energy} dominantColor={dominantColor} />
      
      {isFullscreen && (
        <FullscreenVideoBackground 
          onClose={() => setIsFullscreen(false)}
          currentTrack={currentTrack}
          mood={mood}
          energy={energy}
        />
      )}

      {showEventSetup && (
        <EventSetupWizard 
          onEventCreated={handleEventCreated}
          onClose={() => setShowEventSetup(false)}
        />
      )}

      {showEventPlaylistManager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Event Playlists</h2>
              <button
                onClick={() => setShowEventPlaylistManager(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <EventPlaylistManager 
              currentEvent={currentEvent}
              onPlaylistSwitch={switchPlaylist}
              activePlaylist={activePlaylist}
            />
          </div>
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between p-6 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                DJ Tillu
              </h1>
              <p className="text-sm text-gray-300">AI-Powered Smart Event DJ</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {currentEvent && (
              <div className="text-right">
                <p className="text-sm font-medium">{currentEvent.name}</p>
                <p className="text-xs text-gray-400">{currentEvent.type}</p>
              </div>
            )}
            
            <button
              onClick={() => setShowEventSetup(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>New Event</span>
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute top-20 right-6 bg-black/80 backdrop-blur-sm rounded-xl p-6 w-80 z-50">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>
            
            {/* Event Playlists Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Event Playlists</h4>
              <button
                onClick={() => setShowEventPlaylistManager(true)}
                className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-colors"
              >
                Manage Event Playlists
              </button>
              {activePlaylist && (
                <p className="text-xs text-gray-400 mt-1">
                  Active: {activePlaylist.name} ({activePlaylist.tracks?.length || 0} tracks)
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Volume</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Fullscreen Mode</span>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className={`px-3 py-1 rounded text-xs ${isFullscreen ? 'bg-green-600' : 'bg-gray-600'}`}
                >
                  {isFullscreen ? 'ON' : 'OFF'}
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">W&B Logging</span>
                <div className={`w-3 h-3 rounded-full ${wandbConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex h-[calc(100vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 bg-black/20 backdrop-blur-sm p-4 overflow-y-auto">
            <nav className="space-y-2">
              {panels.map((panel) => {
                const Icon = panel.icon;
                return (
                  <button
                    key={panel.id}
                    onClick={() => setActivePanel(panel.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      activePanel === panel.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{panel.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Panel */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderActivePanel()}
          </div>

          {/* Right Sidebar */}
          <div className="w-80 bg-black/20 backdrop-blur-sm p-4 space-y-4 overflow-y-auto">
            <NowPlaying 
              track={currentTrack} 
              isPlaying={isPlaying} 
              progress={progress}
              onPlay={playTrack}
              onPause={pauseTrack}
              onNext={nextTrack}
            />
            
            <AudioVisualizer analyser={analyser} />
            
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tracks in Library:</span>
                  <span>{eventTracks?.length || tracks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Mood:</span>
                  <span className="capitalize">{mood || 'Analyzing...'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Energy Level:</span>
                  <span>{energy ? `${Math.round(energy * 100)}%` : 'Analyzing...'}</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Status:</span>
                  <span className={isAnalyzing ? 'text-yellow-400' : 'text-green-400'}>
                    {isAnalyzing ? 'Analyzing' : 'Ready'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Controls */}
        <FloatingControls
          isPlaying={isPlaying}
          onPlay={playTrack}
          onPause={pauseTrack}
          onNext={nextTrack}
          volume={volume}
          onVolumeChange={setVolume}
        />

        {/* Draggable Panels */}
        <DraggablePanel title="Event Details" defaultPosition={{ x: 20, y: 200 }}>
          <EventDetailsManager event={currentEvent} />
        </DraggablePanel>

        <DraggablePanel title="Mood Playlists" defaultPosition={{ x: 20, y: 400 }}>
          <MoodPlaylistManager mood={mood} energy={energy} onTrackSelect={playTrack} />
        </DraggablePanel>
      </div>
    </div>
  );
}

export default App;