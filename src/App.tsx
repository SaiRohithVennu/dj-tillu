import React, { useState, useRef, useEffect } from 'react';
import { Zap, Settings, X } from 'lucide-react';
import { DraggablePanel } from './components/DraggablePanel';
import { FullscreenVideoBackground } from './components/FullscreenVideoBackground';
import { TrackList } from './components/TrackList';
import { NowPlaying } from './components/NowPlaying';
import { FloatingControls } from './components/FloatingControls';
import { SmartEventDashboard } from './components/SmartEventDashboard';
import { ContinuousAIAgentPanel } from './components/ContinuousAIAgentPanel';
import { ServerSideAWSPanel } from './components/ServerSideAWSPanel';
import { VoiceAnnouncements } from './components/VoiceAnnouncements';
import { EventDetailsManager } from './components/EventDetailsManager';
import { AudiusBrowser } from './components/AudiusBrowser';
import { SupabaseTrackManager } from './components/SupabaseTrackManager';
import { WhooshMoodBrowser } from './components/WhooshMoodBrowser';
import { MoodPlaylistManager } from './components/MoodPlaylistManager';
import { AudioVisualizer } from './components/AudioVisualizer';
import { EventSetupWizard } from './components/EventSetupWizard';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useTrackLibrary } from './hooks/useTrackLibrary';
import { useGeminiMoodAnalysis } from './hooks/useGeminiMoodAnalysis';
import { useSmartEventDJ } from './hooks/useSmartEventDJ';
import { useServerSideAWSFaceRecognition } from './hooks/useServerSideAWSFaceRecognition';
import { useContinuousAIAgent } from './hooks/useContinuousAIAgent';
import { useWandbIntegration } from './hooks/useWandbIntegration';

interface VIPPerson {
  id: string;
  name: string;
  role: string;
  imageFile?: File;
  imageUrl?: string;
  recognitionCount: number;
  lastSeen?: Date;
}

interface EventSetup {
  eventName: string;
  eventType: 'birthday' | 'corporate' | 'wedding' | 'party' | 'conference';
  duration: number;
  vipPeople: VIPPerson[];
  aiPersonality: 'humorous' | 'formal' | 'energetic' | 'professional';
}

interface Announcement {
  id: string;
  message: string;
  timestamp: Date;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  status: 'pending' | 'playing' | 'completed' | 'failed';
}

function App() {
  // Core state
  const [isAllActive, setIsAllActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [eventSetup, setEventSetup] = useState<EventSetup | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Audio and music
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    currentTrack,
    isLoading,
    error: audioError,
    loadTrack,
    togglePlay,
    seek,
    setVolume
  } = useAudioPlayer();

  const { tracks, isLoading: tracksLoading, addTrack } = useTrackLibrary();

  // AI systems
  const {
    mood,
    energy,
    crowdSize,
    confidence,
    isAnalyzing: isMoodAnalyzing,
    lastAnalysis,
    error: moodError,
    enabled: moodEnabled,
    triggerAnalysis,
    toggleEnabled: toggleMoodEnabled
  } = useGeminiMoodAnalysis(videoRef.current);

  const {
    eventDetails,
    isActive: isEventActive,
    currentPhase,
    recognizedVIPs,
    initializeEvent,
    startEvent,
    stopEvent,
    handleVIPRecognized
  } = useSmartEventDJ({
    tracks,
    currentMood: mood,
    energy,
    crowdSize,
    onTrackChange: loadTrack,
    onAnnouncement: handleAddAnnouncement,
    isPlaying,
    currentTrack
  });

  const {
    isInitialized: awsInitialized,
    isAnalyzing: awsAnalyzing,
    recognizedPeople: awsRecognizedPeople,
    lastAnalysis: awsLastAnalysis,
    error: awsError,
    crowdAnalysis
  } = useServerSideAWSFaceRecognition({
    videoElement: videoRef.current,
    vipPeople: eventSetup?.vipPeople || [],
    eventId: eventSetup?.eventName.replace(/\s+/g, '-').toLowerCase() || 'default-event',
    enabled: isAllActive,
    onVIPRecognized: handleVIPRecognized
  });

  const {
    isActive: aiAgentActive,
    startAgent,
    stopAgent,
    isAnalyzing: aiAgentAnalyzing,
    lastResponse: aiLastResponse,
    responseHistory: aiResponseHistory,
    error: aiAgentError
  } = useContinuousAIAgent({
    videoElement: videoRef.current,
    eventContext: eventSetup ? {
      ...eventSetup,
      startTime: new Date()
    } : {
      eventName: 'Demo Event',
      eventType: 'party',
      duration: 1,
      aiPersonality: 'energetic',
      vipPeople: [],
      startTime: new Date()
    },
    tracks,
    currentTrack,
    isPlaying,
    onAnnouncement: handleAddAnnouncement,
    onTrackChange: loadTrack,
    enabled: isAllActive
  });

  // Wandb analytics integration
  useWandbIntegration({
    mood,
    energy,
    crowdSize,
    confidence,
    currentTrack,
    isPlaying,
    isAIActive: isAllActive
  });

  // Event setup completion handler
  const handleEventSetupComplete = (setup: EventSetup) => {
    setEventSetup(setup);
    initializeEvent({
      id: crypto.randomUUID(),
      name: setup.eventName,
      type: setup.eventType as any,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + setup.duration * 60 * 60 * 1000).toISOString(),
      expectedAttendees: 50,
      venue: 'Live Event',
      specialMoments: [],
      vipGuests: setup.vipPeople.map(vip => ({
        ...vip,
        faceImageUrl: vip.imageUrl
      })),
      musicPreferences: [],
      eventFlow: []
    });
    console.log('🎪 Event setup completed:', setup.eventName);
  };

  // Announcement management
  function handleAddAnnouncement(message: string, priority: 'immediate' | 'high' | 'medium' | 'low' = 'medium') {
    const announcement: Announcement = {
      id: crypto.randomUUID(),
      message,
      timestamp: new Date(),
      priority,
      status: 'pending'
    };
    setAnnouncements(prev => [...prev, announcement]);
    console.log('📢 Announcement added:', message);
  }

  const handleClearAnnouncements = () => {
    setAnnouncements([]);
    console.log('🗑️ Announcements cleared');
  };

  // Main start/stop handler
  const handleStartAll = () => {
    if (!isAllActive) {
      console.log('🚀 Starting all systems...');
      setIsAllActive(true);
      
      if (eventSetup) {
        startEvent();
        startAgent();
      }
      
      // Welcome announcement
      const welcomeMessage = eventSetup 
        ? `Welcome to ${eventSetup.eventName}! I'm your AI DJ and I'm ready to make this ${eventSetup.eventType} amazing!`
        : "Welcome! I'm your AI DJ and I'm ready to make this event amazing!";
      
      setTimeout(() => {
        handleAddAnnouncement(welcomeMessage, 'high');
      }, 2000);
      
    } else {
      console.log('🛑 Stopping all systems...');
      setIsAllActive(false);
      stopEvent();
      stopAgent();
    }
  };

  // Video ready handler
  const handleVideoReady = (video: HTMLVideoElement | null) => {
    videoRef.current = video;
    console.log('🎥 Video ready:', !!video);
  };

  // Show event setup wizard if no event is configured
  if (!eventSetup) {
    return <EventSetupWizard onSetupComplete={handleEventSetupComplete} />;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Fullscreen Video Background */}
      <FullscreenVideoBackground onVideoReady={handleVideoReady} />

      {/* Main UI Panels */}
      <DraggablePanel
        title="Music Library"
        initialPosition={{ x: 20, y: 100 }}
        initialSize={{ width: 350, height: 500 }}
        accentColor="purple"
      >
        <TrackList
          tracks={tracks}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onTrackSelect={loadTrack}
          onPlayToggle={togglePlay}
        />
      </DraggablePanel>

      <DraggablePanel
        title="Event Dashboard"
        initialPosition={{ x: 390, y: 100 }}
        initialSize={{ width: 320, height: 400 }}
        accentColor="blue"
      >
        <SmartEventDashboard
          isActive={isEventActive}
          onToggle={(active) => {
            if (active) {
              startEvent();
            } else {
              stopEvent();
            }
          }}
        />
      </DraggablePanel>

      <DraggablePanel
        title="AI Video Agent"
        initialPosition={{ x: 730, y: 100 }}
        initialSize={{ width: 320, height: 450 }}
        accentColor="green"
      >
        <ContinuousAIAgentPanel
          isActive={aiAgentActive}
          onToggle={(active) => {
            if (active) {
              startAgent();
            } else {
              stopAgent();
            }
          }}
        />
      </DraggablePanel>

      <DraggablePanel
        title="Face Recognition"
        initialPosition={{ x: 1070, y: 100 }}
        initialSize={{ width: 320, height: 400 }}
        accentColor="yellow"
      >
        <ServerSideAWSPanel
          isInitialized={awsInitialized}
          isAnalyzing={awsAnalyzing}
          recognizedPeople={awsRecognizedPeople}
          lastAnalysis={awsLastAnalysis}
          error={awsError}
          crowdAnalysis={crowdAnalysis}
          vipPeople={eventSetup.vipPeople}
          enabled={isAllActive}
        />
      </DraggablePanel>

      <DraggablePanel
        title="Voice System"
        initialPosition={{ x: 20, y: 620 }}
        initialSize={{ width: 350, height: 300 }}
        accentColor="pink"
      >
        <VoiceAnnouncements
          announcements={announcements}
          onAddAnnouncement={handleAddAnnouncement}
          onClearAnnouncements={handleClearAnnouncements}
        />
      </DraggablePanel>

      {/* Now Playing - Only show when track is selected */}
      {currentTrack && (
        <DraggablePanel
          title="Now Playing"
          initialPosition={{ x: 390, y: 520 }}
          initialSize={{ width: 320, height: 350 }}
          accentColor="purple"
        >
          <div className="space-y-4">
            <NowPlaying
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              isLoading={isLoading}
              error={audioError}
              onPlayToggle={togglePlay}
              onSeek={seek}
              onVolumeChange={setVolume}
            />
            <AudioVisualizer
              isPlaying={isPlaying}
              audioElement={null}
              mood={mood}
            />
          </div>
        </DraggablePanel>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-purple-500/30 p-6 w-full max-w-6xl h-5/6 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">DJ Settings & Music Discovery</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-auto">
              <div className="space-y-6">
                <EventDetailsManager onEventSaved={(event) => console.log('Event saved:', event)} />
                <AudiusBrowser
                  onTrackSelect={loadTrack}
                  onAddToLibrary={addTrack}
                  currentMood={mood}
                />
              </div>
              
              <div className="space-y-6">
                <SupabaseTrackManager
                  onTrackSelect={loadTrack}
                  onAddToLibrary={addTrack}
                />
                <WhooshMoodBrowser
                  onTrackSelect={loadTrack}
                  onAddToLibrary={addTrack}
                  currentMood={mood}
                />
                <MoodPlaylistManager
                  tracks={tracks}
                  onPlayTrack={loadTrack}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Controls */}
      <FloatingControls
        onStartAll={handleStartAll}
        isAllActive={isAllActive}
      />

      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed top-6 left-6 z-40 w-12 h-12 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors border border-white/20"
        title="Settings & Music Discovery"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Event Info Display */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-40 bg-black/30 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
        <div className="text-center">
          <h1 className="text-white font-bold text-lg">{eventSetup.eventName}</h1>
          <p className="text-purple-300 text-sm capitalize">
            {eventSetup.eventType} • {eventSetup.aiPersonality} AI • {eventSetup.vipPeople.length} VIPs
          </p>
        </div>
      </div>

      {/* System Status Indicators */}
      <div className="fixed bottom-6 right-6 z-40 space-y-2">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isAllActive ? 'bg-green-500/80 text-white' : 'bg-gray-500/80 text-white'
        }`}>
          {isAllActive ? '🟢 ALL SYSTEMS ACTIVE' : '⚫ SYSTEMS STANDBY'}
        </div>
        
        {isAllActive && (
          <>
            <div className={`px-3 py-1 rounded-full text-xs ${
              isMoodAnalyzing ? 'bg-purple-500/80 text-white' : 'bg-gray-600/80 text-gray-300'
            }`}>
              🧠 AI Vision: {mood} ({energy}%)
            </div>
            
            <div className={`px-3 py-1 rounded-full text-xs ${
              awsAnalyzing ? 'bg-blue-500/80 text-white' : 'bg-gray-600/80 text-gray-300'
            }`}>
              👁️ Face Recognition: {awsRecognizedPeople.length} VIPs
            </div>
            
            <div className={`px-3 py-1 rounded-full text-xs ${
              aiAgentAnalyzing ? 'bg-green-500/80 text-white' : 'bg-gray-600/80 text-gray-300'
            }`}>
              🎤 AI Agent: {aiAgentActive ? 'Active' : 'Standby'}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;