import React, { useState, useEffect, useRef } from 'react';
import { Music, Settings, X, Mic, Users, Brain, Camera, Database, Globe, Heart, Calendar, Eye } from 'lucide-react';
import { Track } from './data/tracks';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useTrackLibrary } from './hooks/useTrackLibrary';
import { useMoodAnalysis } from './hooks/useMoodAnalysis';
import { useWandbIntegration } from './hooks/useWandbIntegration';
import { useSmartEventDJ } from './hooks/useSmartEventDJ';
import { useOpenAIEventHost } from './hooks/useOpenAIEventHost';
import { useContinuousAIAgent } from './hooks/useContinuousAIAgent';

// Components
import { DraggablePanel } from './components/DraggablePanel';
import { TrackList } from './components/TrackList';
import { NowPlaying } from './components/NowPlaying';
import { MoodDisplay } from './components/MoodDisplay';
import { AudioVisualizer } from './components/AudioVisualizer';
import { AudiusBrowser } from './components/AudiusBrowser';
import { SupabaseTrackManager } from './components/SupabaseTrackManager';
import { WhooshMoodBrowser } from './components/WhooshMoodBrowser';
import { MoodPlaylistManager } from './components/MoodPlaylistManager';
import { EventDetailsManager } from './components/EventDetailsManager';
import { SmartEventDashboard } from './components/SmartEventDashboard';
import { FaceRecognitionSystem } from './components/FaceRecognitionSystem';
import { EventSetupWizard } from './components/EventSetupWizard';
import { OpenAIEventHostPanel } from './components/OpenAIEventHostPanel';
import { VoiceAnnouncements } from './components/VoiceAnnouncements';
import { ContinuousAIAgentPanel } from './components/ContinuousAIAgentPanel';
import { FullscreenVideoBackground } from './components/FullscreenVideoBackground';
import { DynamicBackground } from './components/DynamicBackground';
import { FloatingControls } from './components/FloatingControls';

interface VIPPerson {
  id: string;
  name: string;
  role: string;
  imageFile?: File;
  imageUrl?: string;
  greeting?: string;
  recognitionCount: number;
  lastSeen?: Date;
}

interface EventSetup {
  eventName: string;
  eventType: 'birthday' | 'corporate' | 'wedding' | 'party' | 'conference';
  duration: number;
  vipPeople: VIPPerson[];
  aiPersonality: 'humorous' | 'formal' | 'energetic' | 'professional';
  specialMoments: string[];
}

function App() {
  // Core state
  const [hasStarted, setHasStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEventSetup, setShowEventSetup] = useState(true);
  const [eventSetup, setEventSetup] = useState<EventSetup | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<string>('');

  // Audio and tracks
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

  const {
    tracks,
    isLoading: tracksLoading,
    error: tracksError,
    addTrack,
    removeTrack,
    refreshLibrary
  } = useTrackLibrary();

  // Mood analysis (simplified without Gemini)
  const { mood, energy, crowdSize } = useMoodAnalysis();

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
    handleVIPRecognized,
    getEventStatus,
    getUpcomingMoments,
    triggeredMoments
  } = useSmartEventDJ({
    tracks,
    currentMood: mood,
    energy,
    crowdSize,
    onTrackChange: loadTrack,
    onAnnouncement: handleAnnouncement,
    isPlaying,
    currentTrack
  });

  // OpenAI Event Host
  const {
    isActive: isAIHostActive,
    startAI: startAIHost,
    stopAI: stopAIHost,
    lastDecision,
    decisionHistory,
    isThinking,
    handleImmediateVIPAnnouncement
  } = useOpenAIEventHost({
    eventContext: eventSetup ? {
      ...eventSetup,
      startTime: new Date()
    } : {
      eventName: 'Demo Event',
      eventType: 'party',
      duration: 4,
      aiPersonality: 'energetic',
      vipPeople: [],
      startTime: new Date()
    },
    recognizedVIPs,
    crowdSize,
    tracks,
    currentTrack,
    isPlaying,
    onAnnouncement: handleAnnouncement,
    onTrackChange: loadTrack,
    enabled: hasStarted && eventSetup !== null
  });

  // Wandb integration for analytics
  useWandbIntegration({
    mood,
    energy,
    crowdSize,
    confidence: 80,
    currentTrack,
    isPlaying,
    isAIActive: isAIHostActive
  });

  // Handle announcements
  function handleAnnouncement(message: string) {
    console.log('🎤 Announcement:', message);
    setCurrentAnnouncement(message);
    setAnnouncements(prev => [...prev.slice(-9), message]);
    
    // Duck audio during announcement
    duckAudio();
    
    // Trigger voice announcement
    window.dispatchEvent(new CustomEvent('immediateAnnouncement', {
      detail: { message }
    }));
    
    // Unduck audio after announcement
    setTimeout(() => {
      unduckAudio();
      setCurrentAnnouncement('');
    }, 4000);
  }

  // Handle track selection
  const handleTrackSelect = async (track: Track) => {
    await loadTrack(track);
    if (!isPlaying) {
      togglePlay();
    }
  };

  // Handle event setup completion
  const handleEventSetupComplete = (setup: EventSetup) => {
    setEventSetup(setup);
    setShowEventSetup(false);
    
    // Initialize event systems
    if (setup.vipPeople.length > 0) {
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
          id: vip.id,
          name: vip.name,
          role: vip.role,
          personalizedGreeting: vip.greeting,
          recognitionCount: 0
        })),
        musicPreferences: ['Electronic', 'House', 'Techno'],
        eventFlow: []
      });
    }
    
    console.log('🎉 Event setup complete:', setup.eventName);
  };

  // Handle session start
  const handleStartSession = () => {
    setHasStarted(true);
    
    if (eventSetup) {
      startEvent();
      startAIHost();
    }
    
    // Load first track if available
    if (tracks.length > 0 && !currentTrack) {
      loadTrack(tracks[0]);
    }
    
    handleAnnouncement(`Welcome to ${eventSetup?.eventName || 'DJ Tillu'}! Let's get this party started!`);
  };

  // Handle VIP recognition
  const handleVIPRecognition = (vip: VIPPerson) => {
    handleVIPRecognized(vip);
    handleImmediateVIPAnnouncement(vip);
  };

  // Show event setup wizard if not completed
  if (showEventSetup) {
    return (
      <EventSetupWizard
        onSetupComplete={handleEventSetupComplete}
        onSkip={() => {
          setShowEventSetup(false);
          setEventSetup({
            eventName: 'DJ Tillu Demo',
            eventType: 'party',
            duration: 4,
            vipPeople: [],
            aiPersonality: 'energetic',
            specialMoments: []
          });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fullscreen Video Background */}
      <FullscreenVideoBackground onVideoReady={setVideoElement} />
      
      {/* Dynamic Background Effects */}
      <DynamicBackground mood={mood} energy={energy} isPlaying={isPlaying} />

      {/* Floating Controls */}
      <FloatingControls
        isPlaying={isPlaying}
        onPlayToggle={togglePlay}
        onSettingsToggle={() => setShowSettings(!showSettings)}
        onStartSession={handleStartSession}
        hasStarted={hasStarted}
      />

      {/* Current Announcement Display */}
      {currentAnnouncement && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-purple-500/50 p-8 max-w-2xl shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <Mic className="w-6 h-6 text-purple-400 animate-pulse" />
              <span className="text-purple-300 font-semibold">DJ Tillu Speaking</span>
            </div>
            <p className="text-white text-lg text-center leading-relaxed">
              "{currentAnnouncement}"
            </p>
          </div>
        </div>
      )}

      {/* Settings Panels */}
      {showSettings && hasStarted && (
        <>
          {/* Now Playing Panel */}
          <DraggablePanel
            title="🎵 Now Playing"
            initialPosition={{ x: 20, y: 100 }}
            initialSize={{ width: 320, height: 400 }}
            accentColor="purple"
          >
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
          </DraggablePanel>

          {/* Track Library Panel */}
          <DraggablePanel
            title="🎵 Track Library"
            initialPosition={{ x: 360, y: 100 }}
            initialSize={{ width: 400, height: 500 }}
            accentColor="blue"
          >
            <TrackList
              tracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onTrackSelect={handleTrackSelect}
              onPlayToggle={togglePlay}
            />
          </DraggablePanel>

          {/* Mood Analysis Panel */}
          <DraggablePanel
            title="🎭 Crowd Analysis"
            initialPosition={{ x: 780, y: 100 }}
            initialSize={{ width: 300, height: 350 }}
            accentColor="green"
          >
            <div className="space-y-4">
              <MoodDisplay mood={mood} energy={energy} crowdSize={crowdSize} />
              <AudioVisualizer isPlaying={isPlaying} mood={mood} />
            </div>
          </DraggablePanel>

          {/* OpenAI Event Host Panel */}
          <DraggablePanel
            title="🧠 OpenAI Event Host"
            initialPosition={{ x: 1100, y: 100 }}
            initialSize={{ width: 350, height: 450 }}
            accentColor="blue"
          >
            <OpenAIEventHostPanel
              isActive={isAIHostActive}
              onStartAI={startAIHost}
              onStopAI={stopAIHost}
              lastDecision={lastDecision}
              decisionHistory={decisionHistory}
              isThinking={isThinking}
              eventContext={eventSetup}
              recognizedVIPs={recognizedVIPs}
              crowdSize={crowdSize}
            />
          </DraggablePanel>

          {/* Voice Announcements Panel */}
          <DraggablePanel
            title="🎤 Voice System"
            initialPosition={{ x: 20, y: 520 }}
            initialSize={{ width: 320, height: 400 }}
            accentColor="purple"
          >
            <VoiceAnnouncements
              mood={mood}
              energy={energy}
              crowdSize={crowdSize}
              currentTrack={currentTrack?.title || 'None'}
              onAnnouncementStart={duckAudio}
              onAnnouncementEnd={unduckAudio}
            />
          </DraggablePanel>

          {/* Continuous AI Agent Panel */}
          <DraggablePanel
            title="🎥 AI Video Agent"
            initialPosition={{ x: 360, y: 520 }}
            initialSize={{ width: 400, height: 450 }}
            accentColor="red"
          >
            <ContinuousAIAgentPanel
              vipPeople={eventSetup?.vipPeople || []}
              eventDetails={{
                name: eventSetup?.eventName || 'Demo Event',
                type: eventSetup?.eventType || 'party',
                duration: eventSetup?.duration || 4,
                aiPersonality: eventSetup?.aiPersonality || 'energetic'
              }}
              onAnnouncement={(message, priority) => {
                handleAnnouncement(message);
              }}
            />
          </DraggablePanel>

          {/* Audius Music Browser Panel */}
          <DraggablePanel
            title="🌐 Audius Music"
            initialPosition={{ x: 780, y: 470 }}
            initialSize={{ width: 350, height: 400 }}
            accentColor="green"
          >
            <AudiusBrowser
              onTrackSelect={handleTrackSelect}
              onAddToLibrary={addTrack}
              currentMood={mood}
            />
          </DraggablePanel>

          {/* Supabase Storage Panel */}
          <DraggablePanel
            title="💾 Supabase Storage"
            initialPosition={{ x: 1150, y: 570 }}
            initialSize={{ width: 350, height: 400 }}
            accentColor="blue"
          >
            <SupabaseTrackManager
              onTrackSelect={handleTrackSelect}
              onAddToLibrary={addTrack}
            />
          </DraggablePanel>

          {/* Smart Event Dashboard */}
          {eventDetails && (
            <DraggablePanel
              title="📅 Event Dashboard"
              initialPosition={{ x: 1520, y: 100 }}
              initialSize={{ width: 350, height: 500 }}
              accentColor="yellow"
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
          )}

          {/* Face Recognition Panel */}
          {videoElement && eventSetup?.vipPeople.length > 0 && (
            <DraggablePanel
              title="👁️ Face Recognition"
              initialPosition={{ x: 1520, y: 620 }}
              initialSize={{ width: 350, height: 400 }}
              accentColor="pink"
            >
              <FaceRecognitionSystem
                videoElement={videoElement}
                vipGuests={eventSetup.vipPeople}
                onVIPRecognized={handleVIPRecognition}
                enabled={hasStarted}
              />
            </DraggablePanel>
          )}
        </>
      )}

      {/* Welcome Message */}
      {!hasStarted && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="text-center text-white">
            <div className="mb-8">
              <Music className="w-24 h-24 mx-auto mb-6 text-purple-400 animate-pulse" />
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                DJ Tillu
              </h1>
              <p className="text-2xl text-gray-300 mb-2">AI-Powered Event Host</p>
              <p className="text-lg text-gray-400">
                {eventSetup ? `Ready for ${eventSetup.eventName}` : 'Your intelligent DJ companion'}
              </p>
            </div>
            
            {eventSetup && (
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-md mx-auto">
                <h3 className="text-xl font-semibold mb-4">Event Ready!</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Event:</span>
                    <span className="text-white">{eventSetup.eventName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Type:</span>
                    <span className="text-white capitalize">{eventSetup.eventType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">VIP People:</span>
                    <span className="text-white">{eventSetup.vipPeople.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">AI Style:</span>
                    <span className="text-white capitalize">{eventSetup.aiPersonality}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading States */}
      {tracksLoading && (
        <div className="absolute top-6 left-6 z-50">
          <div className="bg-black/40 backdrop-blur-md rounded-lg p-3 text-white text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading music library...</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {(audioError || tracksError) && (
        <div className="absolute bottom-6 left-6 z-50">
          <div className="bg-red-500/20 backdrop-blur-md rounded-lg p-3 border border-red-500/40 text-red-300 text-sm max-w-sm">
            {audioError || tracksError}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;