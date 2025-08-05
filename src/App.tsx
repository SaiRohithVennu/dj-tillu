import React, { useState, useRef, useEffect } from 'react';
import { EventSetupWizard } from './components/EventSetupWizard';
import { FullscreenVideoBackground } from './components/FullscreenVideoBackground';
import { DraggablePanel } from './components/DraggablePanel';
import { TrackList } from './components/TrackList';
import { NowPlaying } from './components/NowPlaying';
import { FloatingControls } from './components/FloatingControls';
import { VoiceAnnouncements } from './components/VoiceAnnouncements';
import { ContinuousAIAgentPanel } from './components/ContinuousAIAgentPanel';
import { ServerSideAWSPanel } from './components/ServerSideAWSPanel';
import { SmartEventDashboard } from './components/SmartEventDashboard';
import { AudiusBrowser } from './components/AudiusBrowser';
import { SupabaseTrackManager } from './components/SupabaseTrackManager';
import { WhooshMoodBrowser } from './components/WhooshMoodBrowser';
import { MoodPlaylistManager } from './components/MoodPlaylistManager';
import { AudioVisualizer } from './components/AudioVisualizer';
import { EventDetailsManager } from './components/EventDetailsManager';
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
  const [hasSetup, setHasSetup] = useState(false);
  const [eventSetup, setEventSetup] = useState<EventSetup | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

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

  // Gemini mood analysis
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
      eventName: eventSetup.eventName,
      eventType: eventSetup.eventType,
      duration: eventSetup.duration,
      aiPersonality: eventSetup.aiPersonality,
      vipPeople: eventSetup.vipPeople,
      startTime: new Date()
    } : null,
    tracks,
    currentTrack,
    isPlaying,
    onAnnouncement: handleAnnouncement,
    onTrackChange: handleTrackChange,
    enabled: hasSetup
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
    eventId: eventSetup?.eventName.replace(/\s+/g, '-').toLowerCase() || 'default',
    enabled: hasSetup && hasStarted,
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
    energy,
    crowdSize,
    onTrackChange: handleTrackChange,
    onAnnouncement: handleAnnouncement,
    isPlaying,
    currentTrack
  });

  // Wandb Integration
  useWandbIntegration({
    mood,
    energy,
    crowdSize,
    confidence,
    currentTrack,
    isPlaying,
    isAIActive: isAIAgentActive
  });

  const handleSetupComplete = (setup: EventSetup) => {
    setEventSetup(setup);
    setHasSetup(true);
    console.log('🎪 Event setup completed:', setup);
  };

  const handleTrackChange = (track: any) => {
    loadTrack(track);
  };

  const handleAnnouncement = (message: string) => {
    // Duck audio for announcement
    duckAudio();
    
    // Trigger voice announcement
    const event = new CustomEvent('immediateAnnouncement', {
      detail: { message }
    });
    window.dispatchEvent(event);
    
    // Unduck audio after announcement (estimated 3 seconds)
    setTimeout(() => {
      unduckAudio();
    }, 3000);
  };

  const handleVIPRecognized = (person: VIPPerson) => {
    console.log('🌟 VIP Recognized:', person.name);
    
    // Trigger personalized announcement
    const event = new CustomEvent('personAnnouncement', {
      detail: { 
        personName: person.name,
        message: `Welcome ${person.name}! Great to see our ${person.role} here!`
      }
    });
    window.dispatchEvent(event);
  };

  const handleStartSession = () => {
    setHasStarted(true);
    
    if (tracks.length > 0 && !currentTrack) {
      loadTrack(tracks[0]);
    }
    
    // Start AI agent if event is set up
    if (eventSetup && !isAIAgentActive) {
      startAgent();
    }
    
    console.log('🎉 DJ Tillu session started!');
  };

  const handlePlayToggle = () => {
    if (!hasStarted) {
      handleStartSession();
    } else {
      togglePlay();
    }
  };

  // Show setup wizard if not completed
  if (!hasSetup) {
    return <EventSetupWizard onSetupComplete={handleSetupComplete} />;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Fullscreen Video Background */}
      <FullscreenVideoBackground onVideoReady={setVideoElement} />

      {/* Main Content Overlay */}
      <div className="relative z-10 w-full h-full">
        {/* Draggable Panels */}
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
            onTrackSelect={handleTrackChange}
            onPlayToggle={togglePlay}
          />
        </DraggablePanel>

        <DraggablePanel
          title="Smart Event Dashboard"
          initialPosition={{ x: 400, y: 100 }}
          initialSize={{ width: 380, height: 450 }}
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
          initialPosition={{ x: 800, y: 100 }}
          initialSize={{ width: 350, height: 400 }}
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
            eventContext={eventSetup ? {
              eventName: eventSetup.eventName,
              eventType: eventSetup.eventType,
              duration: eventSetup.duration,
              aiPersonality: eventSetup.aiPersonality,
              vipPeople: eventSetup.vipPeople,
              startTime: new Date()
            } : null}
          />
        </DraggablePanel>

        <DraggablePanel
          title="Face Recognition"
          initialPosition={{ x: 1200, y: 100 }}
          initialSize={{ width: 320, height: 450 }}
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
            enabled={hasSetup && hasStarted}
          />
        </DraggablePanel>

        <DraggablePanel
          title="Voice System"
          initialPosition={{ x: 20, y: 620 }}
          initialSize={{ width: 350, height: 300 }}
          accentColor="pink"
        >
          <VoiceAnnouncements
            mood={mood}
            energy={energy}
            crowdSize={crowdSize}
            currentTrack={currentTrack?.title || ''}
            onAnnouncementStart={duckAudio}
            onAnnouncementEnd={unduckAudio}
          />
        </DraggablePanel>

        {/* Now Playing - Center Bottom */}
        {currentTrack && hasStarted && (
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-40">
            <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
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
          onPlayToggle={handlePlayToggle}
          onSettingsToggle={() => setShowSettings(!showSettings)}
          onStartSession={handleStartSession}
          hasStarted={hasStarted}
        />

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black/80 backdrop-blur-xl rounded-3xl border border-white/20 p-8 w-full max-w-6xl h-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white">DJ Tillu Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Event Management */}
                <div className="space-y-6">
                  <EventDetailsManager onEventSaved={initializeEvent} />
                </div>

                {/* Music Sources */}
                <div className="space-y-6">
                  <AudiusBrowser
                    onTrackSelect={handleTrackChange}
                    onAddToLibrary={addTrack}
                    currentMood={mood}
                  />
                  
                  <SupabaseTrackManager
                    onTrackSelect={handleTrackChange}
                    onAddToLibrary={addTrack}
                  />
                  
                  <WhooshMoodBrowser
                    onTrackSelect={handleTrackChange}
                    onAddToLibrary={addTrack}
                    currentMood={mood}
                  />
                  
                  <MoodPlaylistManager
                    tracks={tracks}
                    onPlayTrack={handleTrackChange}
                  />
                </div>
              </div>

              {/* Audio Visualizer */}
              <div className="mt-8">
                <AudioVisualizer
                  isPlaying={isPlaying}
                  audioElement={null}
                  mood={mood}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;