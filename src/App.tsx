import React, { useState, useRef, useEffect } from 'react';
import { DraggablePanel } from './components/DraggablePanel';
import { FullscreenVideoBackground } from './components/FullscreenVideoBackground';
import { FloatingControls } from './components/FloatingControls';
import { TrackList } from './components/TrackList';
import { NowPlaying } from './components/NowPlaying';
import { GeminiMoodDisplay } from './components/GeminiMoodDisplay';
import { VoiceAnnouncements } from './components/VoiceAnnouncements';
import { EventSetupWizard } from './components/EventSetupWizard';
import { SmartEventDashboard } from './components/SmartEventDashboard';
import { FaceRecognitionSystem } from './components/FaceRecognitionSystem';
import { EnhancedAIHostPanel } from './components/EnhancedAIHostPanel';
import { AudioVisualizer } from './components/AudioVisualizer';
import { useTrackLibrary } from './hooks/useTrackLibrary';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useGeminiMoodAnalysis } from './hooks/useGeminiMoodAnalysis';
import { useSmartEventDJ } from './hooks/useSmartEventDJ';
import { useEnhancedAIHost } from './hooks/useEnhancedAIHost';
import { useWandbIntegration } from './hooks/useWandbIntegration';

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
  const [showSetup, setShowSetup] = useState(true);
  const [eventSetup, setEventSetup] = useState<EventSetup | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  // Hooks
  const { tracks, isLoading: tracksLoading, addTrack } = useTrackLibrary();
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    currentTrack,
    isLoading: audioLoading,
    error: audioError,
    loadTrack,
    togglePlay,
    seek,
    setVolume,
    duckAudio,
    unduckAudio
  } = useAudioPlayer();

  const {
    mood,
    energy,
    crowdSize,
    confidence,
    isAnalyzing: moodAnalyzing,
    lastAnalysis,
    error: moodError,
    enabled: moodEnabled,
    triggerAnalysis,
    toggleEnabled: toggleMoodEnabled
  } = useGeminiMoodAnalysis(videoElement, true);

  const {
    eventDetails,
    isActive: eventActive,
    eventStarted,
    currentPhase,
    recognizedVIPs,
    initializeEvent,
    startEvent: startSmartEvent,
    stopEvent: stopSmartEvent,
    handleVIPRecognized,
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

  const {
    isActive: hostActive,
    startHost,
    stopHost,
    isListening,
    isAnalyzing: hostAnalyzing,
    lastResponse,
    conversationHistory,
    speechHistory,
    error: hostError,
    forceAnalysis,
    stats,
    speechStats
  } = useEnhancedAIHost({
    videoElement,
    eventContext: eventSetup ? {
      ...eventSetup,
      startTime: new Date()
    } : null,
    tracks,
    currentTrack,
    isPlaying,
    onAnnouncement: handleAnnouncement,
    onTrackChange: handleTrackSelect,
    enabled: hasStarted
  });

  // Wandb integration for analytics
  useWandbIntegration({
    mood,
    energy,
    crowdSize,
    confidence,
    currentTrack,
    isPlaying,
    isAIActive: hostActive
  });

  // Handle track selection
  const handleTrackSelect = async (track: any) => {
    try {
      await loadTrack(track);
      if (!isPlaying) {
        togglePlay();
      }
    } catch (error) {
      console.error('Error selecting track:', error);
    }
  };

  // Handle announcements with audio ducking
  const handleAnnouncement = (message: string) => {
    console.log('🎤 Announcement:', message);
    
    // Duck audio during announcement
    duckAudio();
    
    // Trigger voice announcement
    const event = new CustomEvent('immediateAnnouncement', {
      detail: { message }
    });
    window.dispatchEvent(event);
    
    // Restore audio after announcement (estimated 5 seconds)
    setTimeout(() => {
      unduckAudio();
    }, 5000);
  };

  // Handle VIP recognition
  const handleVIPRecognition = (vip: VIPPerson) => {
    handleVIPRecognized(vip);
    
    // Trigger personalized announcement
    const event = new CustomEvent('personAnnouncement', {
      detail: { 
        personName: vip.name,
        message: vip.greeting || `Welcome ${vip.name}! Great to see you here!`
      }
    });
    window.dispatchEvent(event);
  };

  // Start session
  const handleStartSession = () => {
    setHasStarted(true);
    
    if (eventSetup) {
      initializeEvent({
        id: crypto.randomUUID(),
        name: eventSetup.eventName,
        type: eventSetup.eventType,
        startTime: new Date().toTimeString().slice(0, 5),
        endTime: new Date(Date.now() + eventSetup.duration * 60 * 60 * 1000).toTimeString().slice(0, 5),
        expectedAttendees: 50,
        venue: 'Live Event',
        specialMoments: [],
        vipGuests: eventSetup.vipPeople.map(vip => ({
          ...vip,
          faceImageUrl: vip.imageUrl,
          personalizedGreeting: vip.greeting
        })),
        musicPreferences: ['Electronic', 'House', 'Techno'],
        eventFlow: []
      });
      
      startSmartEvent();
    }
    
    // Start the enhanced interactive host
    setTimeout(() => {
      startHost();
    }, 2000);
  };

  // Complete event setup
  const handleSetupComplete = (setup: EventSetup) => {
    setEventSetup(setup);
    setShowSetup(false);
    console.log('🎪 Event setup complete:', setup.eventName);
  };

  // Skip setup and use basic mode
  const handleSkipSetup = () => {
    setEventSetup({
      eventName: 'DJ Tillu Session',
      eventType: 'party',
      duration: 2,
      vipPeople: [],
      aiPersonality: 'energetic',
      specialMoments: []
    });
    setShowSetup(false);
  };

  // Show event setup wizard if not configured
  if (showSetup) {
    return (
      <EventSetupWizard
        onSetupComplete={handleSetupComplete}
        onSkip={handleSkipSetup}
      />
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Fullscreen Video Background */}
      <FullscreenVideoBackground onVideoReady={setVideoElement} />

      {/* Floating Controls */}
      <FloatingControls
        isPlaying={isPlaying}
        onPlayToggle={togglePlay}
        onSettingsToggle={() => setShowSettings(!showSettings)}
        onStartSession={handleStartSession}
        hasStarted={hasStarted}
      />

      {/* Draggable Panels */}
      {showSettings && (
        <>
          {/* Track Library */}
          <DraggablePanel
            title="🎵 Track Library"
            initialPosition={{ x: 20, y: 100 }}
            initialSize={{ width: 350, height: 500 }}
            accentColor="purple"
          >
            {tracksLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-300">Loading tracks from Audius...</p>
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
          </DraggablePanel>

          {/* Enhanced Interactive AI Host */}
          <DraggablePanel
            title="🎤 Interactive AI Host"
            initialPosition={{ x: 400, y: 100 }}
            initialSize={{ width: 380, height: 600 }}
            accentColor="blue"
          >
            <EnhancedAIHostPanel
              isActive={hostActive}
              onStartHost={startHost}
              onStopHost={stopHost}
              isListening={isListening}
              isAnalyzing={hostAnalyzing}
              lastResponse={lastResponse}
              conversationHistory={conversationHistory}
              speechHistory={speechHistory}
              error={hostError}
              onForceAnalysis={forceAnalysis}
              stats={stats}
              speechStats={speechStats}
              eventContext={eventSetup}
            />
          </DraggablePanel>

          {/* AI Vision Analysis */}
          <DraggablePanel
            title="🧠 AI Vision"
            initialPosition={{ x: 800, y: 100 }}
            initialSize={{ width: 320, height: 400 }}
            accentColor="green"
          >
            <GeminiMoodDisplay
              mood={mood}
              energy={energy}
              crowdSize={crowdSize}
              confidence={confidence}
              isAnalyzing={moodAnalyzing}
              lastAnalysis={lastAnalysis}
              error={moodError}
              enabled={moodEnabled}
              onTriggerAnalysis={triggerAnalysis}
              onToggleEnabled={toggleMoodEnabled}
            />
          </DraggablePanel>

          {/* Voice Announcements */}
          <DraggablePanel
            title="🎤 Voice System"
            initialPosition={{ x: 1150, y: 100 }}
            initialSize={{ width: 320, height: 450 }}
            accentColor="yellow"
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

          {/* Smart Event Dashboard */}
          {eventSetup && (
            <DraggablePanel
              title="🎪 Event Dashboard"
              initialPosition={{ x: 20, y: 620 }}
              initialSize={{ width: 400, height: 350 }}
              accentColor="pink"
            >
              <SmartEventDashboard
                eventDetails={eventDetails}
                isActive={eventActive}
                eventStarted={eventStarted}
                currentPhase={currentPhase}
                recognizedVIPs={recognizedVIPs}
                eventStatus={getEventStatus()}
                upcomingMoments={getUpcomingMoments()}
                triggeredMoments={triggeredMoments}
                onStartEvent={startSmartEvent}
                onStopEvent={stopSmartEvent}
              />
            </DraggablePanel>
          )}

          {/* Face Recognition */}
          {eventSetup && eventSetup.vipPeople.length > 0 && (
            <DraggablePanel
              title="👁️ Face Recognition"
              initialPosition={{ x: 450, y: 620 }}
              initialSize={{ width: 350, height: 350 }}
              accentColor="red"
            >
              <FaceRecognitionSystem
                videoElement={videoElement}
                vipGuests={eventSetup.vipPeople.map(vip => ({
                  ...vip,
                  recognitionCount: 0
                }))}
                onVIPRecognized={handleVIPRecognition}
                enabled={hasStarted}
              />
            </DraggablePanel>
          )}
        </>
      )}

      {/* Now Playing - Center when track is selected */}
      {currentTrack && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
            <NowPlaying
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              isLoading={audioLoading}
              error={audioError}
              onPlayToggle={togglePlay}
              onSeek={seek}
              onVolumeChange={setVolume}
            />
          </div>
        </div>
      )}

      {/* Audio Visualizer - Bottom Right */}
      {currentTrack && (
        <div className="absolute bottom-6 right-6 w-80 h-48 z-30">
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 p-4 shadow-2xl">
            <AudioVisualizer
              isPlaying={isPlaying}
              audioElement={null}
              mood={mood}
            />
          </div>
        </div>
      )}

      {/* Status Indicators */}
      <div className="absolute top-6 left-6 z-50 space-y-2">
        {/* Event Status */}
        {eventSetup && (
          <div className="bg-black/40 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                eventStarted ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span className="text-white text-sm font-medium">
                {eventSetup.eventName}
              </span>
            </div>
          </div>
        )}

        {/* AI Status */}
        <div className="bg-black/40 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              hostActive ? 'bg-blue-400 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span className="text-white text-sm">
              Interactive AI: {hostActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {isListening && (
            <div className="flex items-center space-x-1 mt-1">
              <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-xs">Listening...</span>
            </div>
          )}
        </div>

        {/* Mood Status */}
        <div className="bg-black/40 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              moodAnalyzing ? 'bg-purple-400 animate-pulse' : 'bg-purple-400'
            }`}></div>
            <span className="text-white text-sm">
              {mood} • {energy}% • {crowdSize} people
            </span>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      {!hasStarted && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-center text-white">
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              DJ Tillu
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              {eventSetup ? `Ready for ${eventSetup.eventName}` : 'AI-Powered Event Host'}
            </p>
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-md mx-auto">
              <p className="text-gray-300 mb-4">
                🎤 **Interactive AI Host** - I can see your expressions and hear what you say!
              </p>
              <p className="text-sm text-gray-400">
                Click the play button to start your intelligent DJ experience
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;