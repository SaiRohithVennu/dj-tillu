import React, { useState, useRef, useEffect } from 'react';
import { EventSetupWizard } from './components/EventSetupWizard';
import { DraggablePanel } from './components/DraggablePanel';
import { FullscreenVideoBackground } from './components/FullscreenVideoBackground';
import { TrackList } from './components/TrackList';
import { NowPlaying } from './components/NowPlaying';
import { FloatingControls } from './components/FloatingControls';
import { VoiceAnnouncements } from './components/VoiceAnnouncements';
import { ContinuousAIAgentPanel } from './components/ContinuousAIAgentPanel';
import { ServerSideAWSPanel } from './components/ServerSideAWSPanel';
import { SmartEventDashboard } from './components/SmartEventDashboard';
import { EventDetailsManager } from './components/EventDetailsManager';
import { AudiusBrowser } from './components/AudiusBrowser';
import { SupabaseTrackManager } from './components/SupabaseTrackManager';
import { WhooshMoodBrowser } from './components/WhooshMoodBrowser';
import { MoodPlaylistManager } from './components/MoodPlaylistManager';
import { DynamicBackground } from './components/DynamicBackground';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useTrackLibrary } from './hooks/useTrackLibrary';
import { useGeminiMoodAnalysis } from './hooks/useGeminiMoodAnalysis';
import { useContinuousAIAgent } from './hooks/useContinuousAIAgent';
import { useServerSideAWSFaceRecognition } from './hooks/useServerSideAWSFaceRecognition';
import { useSmartEventDJ } from './hooks/useSmartEventDJ';
import { useWandbIntegration } from './hooks/useWandbIntegration';
import { Settings, X } from 'lucide-react';

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

function App() {
  // Core state
  const [hasSetupCompleted, setHasSetupCompleted] = useState(false);
  const [eventSetup, setEventSetup] = useState<EventSetup | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Handler functions - defined early to avoid initialization order issues
  const handleAnnouncement = (message: string) => {
    console.log('🎤 Announcement:', message);
    // Trigger voice announcement
    const event = new CustomEvent('immediateAnnouncement', { 
      detail: { message } 
    });
    window.dispatchEvent(event);
  };

  const handleVIPRecognized = (person: VIPPerson) => {
    console.log('🌟 VIP Recognized:', person.name);
    // Trigger personalized announcement
    const event = new CustomEvent('personAnnouncement', { 
      detail: { 
        personName: person.name, 
        message: `Welcome ${person.name}! Great to see you here!` 
      } 
    });
    window.dispatchEvent(event);
  };

  const handleTrackChange = (track: any) => {
    console.log('🎵 Track Change:', track.title);
    loadTrack(track);
  };

  const handleSetupComplete = (setup: EventSetup) => {
    console.log('🎪 Event Setup Complete:', setup);
    setEventSetup(setup);
    setHasSetupCompleted(true);
  };

  // Audio player
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
    setVolume,
    duckAudio,
    unduckAudio
  } = useAudioPlayer();

  // Track library
  const { tracks, isLoading: tracksLoading, addTrack } = useTrackLibrary();

  // Mood analysis
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
  } = useGeminiMoodAnalysis(videoElement, true);

  // Continuous AI Agent
  const {
    isActive: isAIAgentActive,
    startAgent,
    stopAgent,
    isAnalyzing: isAIAnalyzing,
    lastResponse: aiLastResponse,
    responseHistory: aiResponseHistory,
    agentStatus,
    error: aiError,
    forceAnalysis,
    conversationHistory
  } = useContinuousAIAgent({
    videoElement,
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
    onAnnouncement: handleAnnouncement,
    onTrackChange: handleTrackChange,
    enabled: hasSetupCompleted
  });

  // Server-side AWS Face Recognition
  const {
    isInitialized: isAWSInitialized,
    isAnalyzing: isAWSAnalyzing,
    recognizedPeople,
    lastAnalysis: awsLastAnalysis,
    error: awsError,
    crowdAnalysis
  } = useServerSideAWSFaceRecognition({
    videoElement,
    vipPeople: eventSetup?.vipPeople || [],
    eventId: eventSetup?.eventName.replace(/\s+/g, '-').toLowerCase() || 'demo-event',
    enabled: hasSetupCompleted && (eventSetup?.vipPeople.length || 0) > 0,
    onVIPRecognized: handleVIPRecognized
  });

  // Smart Event DJ
  const {
    eventDetails,
    isActive: isEventActive,
    eventStarted,
    currentPhase,
    recognizedVIPs,
    initializeEvent,
    startEvent,
    stopEvent,
    handleVIPRecognized: handleEventVIPRecognized,
    getEventStatus,
    getUpcomingMoments,
    triggeredMoments
  } = useSmartEventDJ({
    tracks,
    currentMood: mood,
    energy: energy,
    crowdSize,
    onTrackChange: handleTrackChange,
    onAnnouncement: handleAnnouncement,
    isPlaying,
    currentTrack
  });

  // Wandb Integration
  useWandbIntegration({
    mood,
    energy: energy,
    crowdSize,
    confidence,
    currentTrack,
    isPlaying,
    isAIActive: isAIAgentActive
  });

  // Handle video element ready
  const handleVideoReady = (video: HTMLVideoElement | null) => {
    setVideoElement(video);
    console.log('🎥 Video element ready:', !!video);
  };

  // Start session
  const handleStartSession = () => {
    setHasStarted(true);
    if (tracks.length > 0 && !currentTrack) {
      loadTrack(tracks[0]);
    }
    console.log('🎉 DJ Session Started!');
  };

  // Initialize event when setup is complete
  useEffect(() => {
    if (hasSetupCompleted && eventSetup) {
      const eventDetails = {
        id: eventSetup.eventName.replace(/\s+/g, '-').toLowerCase(),
        name: eventSetup.eventName,
        type: eventSetup.eventType as any,
        startTime: new Date().toTimeString().slice(0, 5),
        endTime: new Date(Date.now() + eventSetup.duration * 60 * 60 * 1000).toTimeString().slice(0, 5),
        expectedAttendees: 50,
        venue: 'Live Event',
        specialMoments: [],
        vipGuests: eventSetup.vipPeople.map(vip => ({
          ...vip,
          faceImageUrl: vip.imageUrl
        })),
        musicPreferences: ['Electronic', 'House'],
        eventFlow: []
      };
      
      initializeEvent(eventDetails);
    }
  }, [hasSetupCompleted, eventSetup]);

  // Show setup wizard if not completed
  if (!hasSetupCompleted) {
    return <EventSetupWizard onSetupComplete={handleSetupComplete} />;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Dynamic Background */}
      <DynamicBackground 
        mood={mood || 'neutral'} 
        energy={energy || 50} 
        isPlaying={isPlaying} 
      />

      {/* Fullscreen Video Background */}
      <FullscreenVideoBackground onVideoReady={handleVideoReady} />

      {/* Main Content Panels */}
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
        initialPosition={{ x: 400, y: 100 }}
        initialSize={{ width: 320, height: 400 }}
        accentColor="blue"
      >
        <SmartEventDashboard
          eventDetails={eventDetails}
          isActive={isEventActive}
          eventStarted={eventStarted}
          currentPhase={currentPhase}
          recognizedVIPs={recognizedVIPs}
          eventStatus={getEventStatus()}
          upcomingMoments={getUpcomingMoments()}
          triggeredMoments={triggeredMoments}
          onStartEvent={startEvent}
          onStopEvent={stopEvent}
        />
      </DraggablePanel>

      <DraggablePanel
        title="AI Video Agent"
        initialPosition={{ x: 750, y: 100 }}
        initialSize={{ width: 320, height: 450 }}
        accentColor="green"
      >
        <ContinuousAIAgentPanel
          isActive={isAIAgentActive}
          onStartAgent={startAgent}
          onStopAgent={stopAgent}
          isAnalyzing={isAIAnalyzing}
          lastResponse={aiLastResponse}
          responseHistory={aiResponseHistory}
          agentStatus={agentStatus}
          error={aiError}
          onForceAnalysis={forceAnalysis}
          conversationHistory={conversationHistory}
          eventContext={eventSetup}
        />
      </DraggablePanel>

      <DraggablePanel
        title="Face Recognition"
        initialPosition={{ x: 1100, y: 100 }}
        initialSize={{ width: 300, height: 400 }}
        accentColor="yellow"
      >
        <ServerSideAWSPanel
          isInitialized={isAWSInitialized}
          isAnalyzing={isAWSAnalyzing}
          recognizedPeople={recognizedPeople}
          lastAnalysis={awsLastAnalysis}
          error={awsError}
          crowdAnalysis={crowdAnalysis}
          vipPeople={eventSetup?.vipPeople || []}
          enabled={hasSetupCompleted && (eventSetup?.vipPeople.length || 0) > 0}
        />
      </DraggablePanel>

      <DraggablePanel
        title="Voice System"
        initialPosition={{ x: 20, y: 620 }}
        initialSize={{ width: 300, height: 350 }}
        accentColor="pink"
      >
        <VoiceAnnouncements
          mood={mood || 'neutral'}
          energy={energy || 50}
          crowdSize={crowdSize}
          currentTrack={currentTrack?.title || 'None'}
          onAnnouncementStart={duckAudio}
          onAnnouncementEnd={unduckAudio}
        />
      </DraggablePanel>

      {/* Now Playing - Only show when track is selected */}
      {currentTrack && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
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
          </div>
        </div>
      )}

      {/* Floating Controls */}
      <FloatingControls
        isPlaying={isPlaying}
        onPlayToggle={togglePlay}
        onSettingsToggle={() => setShowSettings(!showSettings)}
        onStartSession={handleStartSession}
        hasStarted={hasStarted}
      />

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 p-6 w-full max-w-6xl h-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Settings Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Settings className="w-6 h-6 mr-2 text-purple-400" />
                DJ Settings & Music Discovery
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 h-full overflow-y-auto">
              {/* Event Management */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Event Management</h3>
                <EventDetailsManager onEventSaved={(event) => console.log('Event saved:', event)} />
              </div>

              {/* Music Discovery */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Music Discovery</h3>
                <div className="space-y-4">
                  <AudiusBrowser
                    onTrackSelect={loadTrack}
                    onAddToLibrary={addTrack}
                    currentMood={mood}
                  />
                </div>
              </div>

              {/* Supabase Storage */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Your Tracks</h3>
                <SupabaseTrackManager
                  onTrackSelect={loadTrack}
                  onAddToLibrary={addTrack}
                />
              </div>

              {/* Mood Browser */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Mood Discovery</h3>
                <WhooshMoodBrowser
                  onTrackSelect={loadTrack}
                  onAddToLibrary={addTrack}
                  currentMood={mood}
                />
              </div>

              {/* Playlist Manager */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Mood Playlists</h3>
                <MoodPlaylistManager
                  tracks={tracks}
                  onPlayTrack={loadTrack}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;