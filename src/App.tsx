import React, { useState, useEffect, useRef } from 'react';
import { FullscreenVideoBackground } from './components/FullscreenVideoBackground';
import { DraggablePanel } from './components/DraggablePanel';
import { TrackList } from './components/TrackList';
import { NowPlaying } from './components/NowPlaying';
import { FloatingControls } from './components/FloatingControls';
import { EventSetupWizard } from './components/EventSetupWizard';
import { SmartEventDashboard } from './components/SmartEventDashboard';
import { ContinuousAIAgentPanel } from './components/ContinuousAIAgentPanel';
import { ServerSideAWSPanel } from './components/ServerSideAWSPanel';
import { VoiceAnnouncements } from './components/VoiceAnnouncements';
import { EventDetailsManager } from './components/EventDetailsManager';
import { AudiusBrowser } from './components/AudiusBrowser';
import { SupabaseTrackManager } from './components/SupabaseTrackManager';
import { WhooshMoodBrowser } from './components/WhooshMoodBrowser';
import { MoodPlaylistManager } from './components/MoodPlaylistManager';
import { EventPlaylistManager } from './components/EventPlaylistManager';
import { AudioVisualizer } from './components/AudioVisualizer';
import { DynamicBackground } from './components/DynamicBackground';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useEventAwareTrackLibrary } from './hooks/useEventAwareTrackLibrary';
import { useGeminiMoodAnalysis } from './hooks/useGeminiMoodAnalysis';
import { useContinuousAIAgent } from './hooks/useContinuousAIAgent';
import { useServerSideAWSFaceRecognition } from './hooks/useServerSideAWSFaceRecognition';
import { useSmartEventDJ } from './hooks/useSmartEventDJ';
import { Track } from './data/tracks';

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
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [eventSetup, setEventSetup] = useState<EventSetup | null>(null);
  const [showEventSetup, setShowEventSetup] = useState(true);
  const [currentEventId, setCurrentEventId] = useState<string>('default-event');

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

  // Mood analysis with Gemini Vision
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

  // Event-aware track library
  const {
    tracks,
    isLoading: tracksLoading,
    error: tracksError,
    activeEventId,
    eventTrackCount,
    addTrackToCurrentEvent,
    refreshTracks
  } = useEventAwareTrackLibrary({
    currentEventId,
    currentMood: mood,
    energy
  });

  // Continuous AI Agent (ChatGPT-like video interaction)
  const {
    isActive: aiAgentActive,
    startAgent: startAIAgent,
    stopAgent: stopAIAgent,
    isAnalyzing: aiAgentAnalyzing,
    lastResponse: aiLastResponse,
    responseHistory: aiResponseHistory,
    agentStatus: aiAgentStatus,
    error: aiAgentError,
    forceAnalysis: forceAIAnalysis,
    conversationHistory
  } = useContinuousAIAgent({
    videoElement,
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
    tracks,
    currentTrack,
    isPlaying,
    onAnnouncement: handleAnnouncement,
    onTrackChange: handleTrackSelect,
    enabled: hasStarted
  });

  // Server-side AWS Face Recognition
  const {
    isInitialized: awsInitialized,
    isAnalyzing: awsAnalyzing,
    recognizedPeople: awsRecognizedPeople,
    lastAnalysis: awsLastAnalysis,
    error: awsError,
    crowdAnalysis: awsCrowdAnalysis
  } = useServerSideAWSFaceRecognition({
    videoElement,
    vipPeople: eventSetup?.vipPeople || [],
    eventId: currentEventId,
    enabled: hasStarted && !!eventSetup,
    onVIPRecognized: handleVIPRecognized
  });

  // Smart Event DJ
  const {
    eventDetails,
    isActive: eventDJActive,
    eventStarted,
    currentPhase,
    recognizedVIPs,
    initializeEvent,
    startEvent: startEventDJ,
    stopEvent: stopEventDJ,
    handleVIPRecognized: handleEventVIPRecognized,
    getEventStatus,
    getUpcomingMoments,
    triggeredMoments
  } = useSmartEventDJ({
    tracks,
    currentMood: mood,
    energy,
    crowdSize,
    onTrackChange: handleTrackSelect,
    onAnnouncement: handleAnnouncement,
    isPlaying,
    currentTrack
  });

  // Voice announcements ref
  const voiceAnnouncementsRef = useRef<any>(null);

  // Handle track selection
  const handleTrackSelect = async (track: Track) => {
    console.log('🎵 Track selected:', track.title);
    await loadTrack(track);
    
    // Auto-play if this is the first track or if already playing
    if (!currentTrack || isPlaying) {
      setTimeout(() => {
        togglePlay();
      }, 500);
    }
  };

  // Handle announcements
  const handleAnnouncement = (message: string) => {
    console.log('🎤 Announcement triggered:', message);
    
    // Duck audio during announcement
    duckAudio();
    
    // Queue announcement in voice system
    if (window.queueAnnouncement) {
      window.queueAnnouncement(message, 'high');
    }
    
    // Unduck audio after announcement (estimated 5 seconds)
    setTimeout(() => {
      unduckAudio();
    }, 5000);
  };

  // Handle VIP recognition
  const handleVIPRecognized = (vip: VIPPerson) => {
    console.log('🌟 VIP recognized:', vip.name);
    
    // Trigger personalized announcement
    const greeting = vip.greeting || `Welcome ${vip.name}! Great to see you here!`;
    handleAnnouncement(greeting);
    
    // Update event DJ system
    handleEventVIPRecognized(vip);
  };

  // Handle event setup completion
  const handleEventSetupComplete = (setup: EventSetup) => {
    setEventSetup(setup);
    setCurrentEventId(`event-${Date.now()}`);
    setShowEventSetup(false);
    
    // Initialize event systems
    if (setup) {
      const eventDetails = {
        id: currentEventId,
        name: setup.eventName,
        type: setup.eventType,
        startTime: new Date().toISOString().slice(11, 16),
        endTime: new Date(Date.now() + setup.duration * 60 * 60 * 1000).toISOString().slice(11, 16),
        expectedAttendees: 50,
        venue: 'Live Event',
        specialMoments: [],
        vipGuests: setup.vipPeople.map(vip => ({
          ...vip,
          faceImageUrl: vip.imageUrl,
          personalizedGreeting: vip.greeting
        })),
        musicPreferences: [],
        eventFlow: []
      };
      
      initializeEvent(eventDetails);
    }
    
    console.log('🎪 Event setup completed:', setup.eventName);
  };

  // Handle session start
  const handleStartSession = () => {
    setHasStarted(true);
    
    // Start AI systems
    if (eventSetup) {
      startAIAgent();
      startEventDJ();
    }
    
    // Welcome announcement
    const welcomeMessage = eventSetup 
      ? `Welcome to ${eventSetup.eventName}! I'm your AI DJ and I'm excited to host this ${eventSetup.eventType} with you!`
      : "Welcome to DJ Tillu! I'm your AI DJ and I'm ready to get this party started!";
    
    setTimeout(() => {
      handleAnnouncement(welcomeMessage);
    }, 2000);
    
    console.log('🎉 DJ Tillu session started!');
  };

  // Handle playlist activation
  const handlePlaylistActivated = (eventId: string, trackCount: number) => {
    console.log(`🎯 Playlist activated for AI: ${eventId} (${trackCount} tracks)`);
    refreshTracks(); // Refresh the track library to use new playlist
  };

  // Skip event setup (for demo)
  const handleSkipSetup = () => {
    const demoSetup: EventSetup = {
      eventName: 'Demo Party',
      eventType: 'party',
      duration: 2,
      vipPeople: [],
      aiPersonality: 'energetic',
      specialMoments: []
    };
    
    handleEventSetupComplete(demoSetup);
  };

  // Global announcement functions for voice system
  useEffect(() => {
    (window as any).queueAnnouncement = (message: string, priority: string) => {
      // This will be handled by the VoiceAnnouncements component
      const event = new CustomEvent('queueAnnouncement', {
        detail: { message, priority }
      });
      window.dispatchEvent(event);
    };

    (window as any).triggerPersonAnnouncement = (personName: string, message: string) => {
      const event = new CustomEvent('personAnnouncement', {
        detail: { personName, message }
      });
      window.dispatchEvent(event);
    };

    return () => {
      delete (window as any).queueAnnouncement;
      delete (window as any).triggerPersonAnnouncement;
    };
  }, []);

  // Show event setup wizard if not completed
  if (showEventSetup) {
    return (
      <EventSetupWizard
        onSetupComplete={handleEventSetupComplete}
        onSkip={handleSkipSetup}
      />
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Fullscreen Video Background */}
      <FullscreenVideoBackground onVideoReady={setVideoElement} />
      
      {/* Dynamic Background Effects */}
      <DynamicBackground 
        mood={mood} 
        energy={energy} 
        isPlaying={isPlaying} 
      />

      {/* Main Draggable Panels */}
      <DraggablePanel
        title="🎵 Music Library"
        initialPosition={{ x: 20, y: 100 }}
        initialSize={{ width: 350, height: 500 }}
        accentColor="purple"
      >
        <div className="space-y-4">
          {/* Event Playlist Status */}
          {activeEventId && eventTrackCount > 0 && (
            <div className="bg-green-600/20 border border-green-500/40 rounded-lg p-3">
              <p className="text-green-300 font-medium">🎯 Event Playlist Active</p>
              <p className="text-white text-sm">{eventTrackCount} songs loaded for this event</p>
            </div>
          )}
          
          {tracksLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-300">Loading music library...</p>
            </div>
          ) : tracksError ? (
            <div className="text-center py-8">
              <p className="text-red-300 mb-2">Failed to load tracks</p>
              <button
                onClick={refreshTracks}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <TrackList
              tracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onTrackSelect={handleTrackSelect}
              onPlayToggle={togglePlay}
            />
          )}
        </div>
      </DraggablePanel>

      {/* Smart Event Dashboard */}
      <DraggablePanel
        title="🎪 Smart Event"
        initialPosition={{ x: 400, y: 100 }}
        initialSize={{ width: 320, height: 450 }}
        accentColor="green"
      >
        <SmartEventDashboard
          eventDetails={eventDetails}
          isActive={eventDJActive}
          eventStarted={eventStarted}
          currentPhase={currentPhase}
          recognizedVIPs={recognizedVIPs}
          eventStatus={getEventStatus()}
          upcomingMoments={getUpcomingMoments()}
          triggeredMoments={triggeredMoments}
          onStartEvent={startEventDJ}
          onStopEvent={stopEventDJ}
        />
      </DraggablePanel>

      {/* Continuous AI Agent Panel */}
      <DraggablePanel
        title="🤖 AI Video Agent"
        initialPosition={{ x: 750, y: 100 }}
        initialSize={{ width: 320, height: 450 }}
        accentColor="blue"
      >
        <ContinuousAIAgentPanel
          isActive={aiAgentActive}
          onStartAgent={startAIAgent}
          onStopAgent={stopAIAgent}
          isAnalyzing={aiAgentAnalyzing}
          lastResponse={aiLastResponse}
          responseHistory={aiResponseHistory}
          agentStatus={aiAgentStatus}
          error={aiAgentError}
          onForceAnalysis={forceAIAnalysis}
          conversationHistory={conversationHistory}
          eventContext={eventSetup}
        />
      </DraggablePanel>

      {/* Server-Side AWS Panel */}
      <DraggablePanel
        title="👁️ Face Recognition"
        initialPosition={{ x: 1100, y: 100 }}
        initialSize={{ width: 320, height: 450 }}
        accentColor="red"
      >
        <ServerSideAWSPanel
          isInitialized={awsInitialized}
          isAnalyzing={awsAnalyzing}
          recognizedPeople={awsRecognizedPeople}
          lastAnalysis={awsLastAnalysis}
          error={awsError}
          crowdAnalysis={awsCrowdAnalysis}
          vipPeople={eventSetup?.vipPeople || []}
          enabled={hasStarted && !!eventSetup}
        />
      </DraggablePanel>

      {/* Voice Announcements Panel */}
      <DraggablePanel
        title="🎤 Voice System"
        initialPosition={{ x: 20, y: 580 }}
        initialSize={{ width: 350, height: 300 }}
        accentColor="yellow"
      >
        <VoiceAnnouncements
          ref={voiceAnnouncementsRef}
          mood={mood}
          energy={energy}
          crowdSize={crowdSize}
          currentTrack={currentTrack?.title || ''}
          onAnnouncementStart={duckAudio}
          onAnnouncementEnd={unduckAudio}
        />
      </DraggablePanel>

      {/* Audio Visualizer Panel */}
      <DraggablePanel
        title="🎵 Audio Visualizer"
        initialPosition={{ x: 400, y: 580 }}
        initialSize={{ width: 320, height: 300 }}
        accentColor="pink"
      >
        <AudioVisualizer
          isPlaying={isPlaying}
          audioElement={null}
          mood={mood}
        />
      </DraggablePanel>

      {/* Now Playing (Center Bottom) */}
      {currentTrack && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
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
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 p-6 w-full max-w-6xl h-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Settings Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">⚙️ DJ Tillu Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Event Playlists */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <EventPlaylistManager
                  currentEventId={currentEventId}
                  onTrackSelect={handleTrackSelect}
                  onPlaylistActivated={handlePlaylistActivated}
                />
              </div>

              {/* Event Details */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <EventDetailsManager
                  onEventSaved={(event) => {
                    initializeEvent(event);
                    console.log('Event details saved:', event.name);
                  }}
                />
              </div>

              {/* Audius Browser */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <AudiusBrowser
                  onTrackSelect={handleTrackSelect}
                  onAddToLibrary={addTrackToCurrentEvent}
                  currentMood={mood}
                />
              </div>

              {/* Supabase Track Manager */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <SupabaseTrackManager
                  onTrackSelect={handleTrackSelect}
                  onAddToLibrary={addTrackToCurrentEvent}
                />
              </div>

              {/* WhooshMusic Browser */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <WhooshMoodBrowser
                  onTrackSelect={handleTrackSelect}
                  onAddToLibrary={addTrackToCurrentEvent}
                  currentMood={mood}
                />
              </div>

              {/* Mood Playlist Manager */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <MoodPlaylistManager
                  tracks={tracks}
                  onPlayTrack={handleTrackSelect}
                />
              </div>
            </div>

            {/* System Status */}
            <div className="mt-6 bg-purple-600/20 rounded-xl p-4 border border-purple-500/30">
              <h3 className="text-lg font-bold text-purple-300 mb-3">🔧 System Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Camera</span>
                  <div className={`w-3 h-3 rounded-full ${videoElement ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">AI Vision</span>
                  <div className={`w-3 h-3 rounded-full ${moodEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Face Recognition</span>
                  <div className={`w-3 h-3 rounded-full ${awsInitialized ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">AI Agent</span>
                  <div className={`w-3 h-3 rounded-full ${aiAgentActive ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
              </div>
              
              <div className="mt-3 text-xs text-gray-400">
                <p>🎵 Active Playlist: {activeEventId ? `${eventTrackCount} songs` : 'Default Audius tracks'}</p>
                <p>🎪 Event: {eventSetup?.eventName || 'Demo Mode'}</p>
                <p>🤖 AI Personality: {eventSetup?.aiPersonality || 'Energetic'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;