import React, { useState, useEffect } from 'react';
import { FullscreenVideoBackground } from './components/FullscreenVideoBackground';
import { DraggablePanel } from './components/DraggablePanel';
import { TrackList } from './components/TrackList';
import { NowPlaying } from './components/NowPlaying';
import { GeminiMoodDisplay } from './components/GeminiMoodDisplay';
import { VoiceAnnouncements } from './components/VoiceAnnouncements';
import { SmartEventDashboard } from './components/SmartEventDashboard';
import { FaceRecognitionSystem } from './components/FaceRecognitionSystem';
import { EnhancedAIHostPanel } from './components/EnhancedAIHostPanel';
import { EventSetupWizard } from './components/EventSetupWizard';
import { FloatingControls } from './components/FloatingControls';
import { DynamicBackground } from './components/DynamicBackground';
import { useTrackLibrary } from './hooks/useTrackLibrary';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useGeminiMoodAnalysis } from './hooks/useGeminiMoodAnalysis';
import { useSmartEventDJ } from './hooks/useSmartEventDJ';
import { useEnhancedAIHost } from './hooks/useEnhancedAIHost';
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
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [showSetup, setShowSetup] = useState(true);
  const [eventSetup, setEventSetup] = useState<EventSetup | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Core hooks
  const { tracks, isLoading: tracksLoading, addTrack } = useTrackLibrary();
  const audioPlayer = useAudioPlayer();
  const geminiMood = useGeminiMoodAnalysis(videoElement, true);

  // Define callback functions before using them in hooks
  const handleTrackSelect = (track: Track) => {
    audioPlayer.loadTrack(track);
    if (!audioPlayer.isPlaying) {
      setTimeout(() => audioPlayer.togglePlay(), 500);
    }
  };

  const handleAnnouncement = (message: string) => {
    console.log('🎤 Announcement triggered:', message);
    
    // Duck audio during announcement
    audioPlayer.duckAudio();
    
    // Trigger voice announcement
    const event = new CustomEvent('immediateAnnouncement', {
      detail: { message }
    });
    window.dispatchEvent(event);
    
    // Restore audio after announcement (estimated 5 seconds)
    setTimeout(() => {
      audioPlayer.unduckAudio();
    }, 5000);
  };

  const handleVIPRecognition = (person: VIPPerson) => {
    console.log('🌟 VIP recognized:', person.name);
    
    // Trigger personalized announcement
    const event = new CustomEvent('personAnnouncement', {
      detail: { 
        personName: person.name,
        message: person.greeting || `Welcome ${person.name}! Great to see you here!`
      }
    });
    window.dispatchEvent(event);
  };

  // Smart Event DJ hook
  const smartEventDJ = useSmartEventDJ({
    tracks,
    currentMood: geminiMood.mood,
    energy: geminiMood.energy,
    crowdSize: geminiMood.crowdSize,
    onTrackChange: handleTrackSelect,
    onAnnouncement: handleAnnouncement,
    isPlaying: audioPlayer.isPlaying,
    currentTrack: audioPlayer.currentTrack
  });

  // Enhanced AI Host hook
  const enhancedAIHost = useEnhancedAIHost({
    videoElement,
    eventContext: eventSetup ? {
      ...eventSetup,
      startTime: new Date()
    } : null,
    tracks,
    currentTrack: audioPlayer.currentTrack,
    isPlaying: audioPlayer.isPlaying,
    onAnnouncement: handleAnnouncement,
    onTrackChange: handleTrackSelect,
    enabled: hasStarted && !showSetup
  });

  const handleEventSetup = (setup: EventSetup) => {
    setEventSetup(setup);
    setShowSetup(false);
    setHasStarted(true);
    
    // Initialize smart event DJ
    if (smartEventDJ.initializeEvent) {
      const eventDetails = {
        id: crypto.randomUUID(),
        name: setup.eventName,
        type: setup.eventType,
        startTime: new Date().toTimeString().slice(0, 5),
        endTime: new Date(Date.now() + setup.duration * 60 * 60 * 1000).toTimeString().slice(0, 5),
        expectedAttendees: 50,
        venue: 'Live Event',
        specialMoments: [],
        vipGuests: setup.vipPeople.map(vip => ({
          ...vip,
          recognitionCount: 0
        })),
        musicPreferences: ['Electronic', 'House'],
        eventFlow: []
      };
      smartEventDJ.initializeEvent(eventDetails);
    }
    
    console.log('🎪 Event setup complete:', setup.eventName);
  };

  const handleSkipSetup = () => {
    setShowSetup(false);
    setHasStarted(true);
    console.log('⏭️ Skipped event setup - using basic DJ mode');
  };

  const handleStartSession = () => {
    if (!hasStarted) {
      setHasStarted(true);
      handleAnnouncement("Welcome to DJ Tillu! Your AI-powered event experience starts now!");
    }
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // Show setup wizard if not configured
  if (showSetup) {
    return (
      <EventSetupWizard
        onSetupComplete={handleEventSetup}
        onSkip={handleSkipSetup}
      />
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Fullscreen Video Background */}
      <FullscreenVideoBackground onVideoReady={setVideoElement} />
      
      {/* Dynamic Background Effects */}
      <DynamicBackground 
        mood={geminiMood.mood} 
        energy={geminiMood.energy} 
        isPlaying={audioPlayer.isPlaying} 
      />

      {/* Floating Controls */}
      <FloatingControls
        isPlaying={audioPlayer.isPlaying}
        onPlayToggle={audioPlayer.togglePlay}
        onSettingsToggle={toggleSettings}
        onStartSession={handleStartSession}
        hasStarted={hasStarted}
      />

      {/* Settings Panels - Only show when settings is open */}
      {showSettings && (
        <>
          {/* Track Library Panel */}
          <DraggablePanel
            title="🎵 Track Library"
            initialPosition={{ x: 20, y: 100 }}
            initialSize={{ width: 350, height: 500 }}
            accentColor="purple"
          >
            <TrackList
              tracks={tracks}
              currentTrack={audioPlayer.currentTrack}
              isPlaying={audioPlayer.isPlaying}
              onTrackSelect={handleTrackSelect}
              onPlayToggle={audioPlayer.togglePlay}
            />
          </DraggablePanel>

          {/* AI Mood Analysis Panel */}
          <DraggablePanel
            title="🧠 AI Vision Analysis"
            initialPosition={{ x: 400, y: 100 }}
            initialSize={{ width: 320, height: 400 }}
            accentColor="blue"
          >
            <GeminiMoodDisplay
              mood={geminiMood.mood}
              energy={geminiMood.energy}
              crowdSize={geminiMood.crowdSize}
              confidence={geminiMood.confidence}
              isAnalyzing={geminiMood.isAnalyzing}
              lastAnalysis={geminiMood.lastAnalysis}
              error={geminiMood.error}
              enabled={geminiMood.enabled}
              onTriggerAnalysis={geminiMood.triggerAnalysis}
              onToggleEnabled={geminiMood.toggleEnabled}
            />
          </DraggablePanel>

          {/* Enhanced AI Host Panel */}
          <DraggablePanel
            title="🎤 Interactive AI Host"
            initialPosition={{ x: 750, y: 100 }}
            initialSize={{ width: 380, height: 600 }}
            accentColor="green"
          >
            <EnhancedAIHostPanel
              isActive={enhancedAIHost.isActive}
              onStartHost={enhancedAIHost.startHost}
              onStopHost={enhancedAIHost.stopHost}
              isListening={enhancedAIHost.isListening}
              isAnalyzing={enhancedAIHost.isAnalyzing}
              lastResponse={enhancedAIHost.lastResponse}
              conversationHistory={enhancedAIHost.conversationHistory}
              speechHistory={enhancedAIHost.speechHistory}
              error={enhancedAIHost.error}
              onForceAnalysis={enhancedAIHost.forceAnalysis}
              stats={enhancedAIHost.stats}
              speechStats={enhancedAIHost.speechStats}
              eventContext={eventSetup}
            />
          </DraggablePanel>

          {/* Voice Announcements Panel */}
          <DraggablePanel
            title="🔊 Voice System"
            initialPosition={{ x: 1150, y: 100 }}
            initialSize={{ width: 320, height: 450 }}
            accentColor="yellow"
          >
            <VoiceAnnouncements
              mood={geminiMood.mood}
              energy={geminiMood.energy}
              crowdSize={geminiMood.crowdSize}
              currentTrack={audioPlayer.currentTrack?.title || 'None'}
            />
          </DraggablePanel>

          {/* Smart Event Dashboard */}
          <DraggablePanel
            title="🎪 Event Dashboard"
            initialPosition={{ x: 20, y: 620 }}
            initialSize={{ width: 400, height: 350 }}
            accentColor="pink"
          >
            <SmartEventDashboard
              eventDetails={smartEventDJ.eventDetails}
              isActive={smartEventDJ.isActive}
              eventStarted={smartEventDJ.eventStarted}
              currentPhase={smartEventDJ.currentPhase}
              recognizedVIPs={smartEventDJ.recognizedVIPs}
              eventStatus={smartEventDJ.getEventStatus()}
              upcomingMoments={smartEventDJ.getUpcomingMoments()}
              triggeredMoments={smartEventDJ.triggeredMoments}
              onStartEvent={smartEventDJ.startEvent}
              onStopEvent={smartEventDJ.stopEvent}
            />
          </DraggablePanel>

          {/* Face Recognition Panel */}
          <DraggablePanel
            title="👁️ Face Recognition"
            initialPosition={{ x: 450, y: 620 }}
            initialSize={{ width: 350, height: 350 }}
            accentColor="red"
          >
            <FaceRecognitionSystem
              videoElement={videoElement}
              vipGuests={eventSetup?.vipPeople || []}
              onVIPRecognized={handleVIPRecognition}
              enabled={hasStarted && !showSetup}
            />
          </DraggablePanel>
        </>
      )}

      {/* Now Playing - Center when track is selected */}
      {audioPlayer.currentTrack && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
            <NowPlaying
              currentTrack={audioPlayer.currentTrack}
              isPlaying={audioPlayer.isPlaying}
              currentTime={audioPlayer.currentTime}
              duration={audioPlayer.duration}
              volume={audioPlayer.volume}
              isLoading={audioPlayer.isLoading}
              error={audioPlayer.error}
              onPlayToggle={audioPlayer.togglePlay}
              onSeek={audioPlayer.seek}
              onVolumeChange={audioPlayer.setVolume}
            />
          </div>
        </div>
      )}

      {/* Loading State */}
      {tracksLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center">
            <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-white mb-2">Loading DJ Tillu</h3>
            <p className="text-gray-300">Initializing AI systems and music library...</p>
          </div>
        </div>
      )}

      {/* Welcome Message */}
      {hasStarted && !audioPlayer.currentTrack && !showSettings && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 text-center">
          <div className="bg-black/20 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
            <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              DJ Tillu
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              {eventSetup ? `Welcome to ${eventSetup.eventName}!` : 'Your AI-Powered Event Experience'}
            </p>
            <p className="text-gray-400 mb-8">
              Click the settings button to access all controls and start your event
            </p>
            <div className="flex justify-center space-x-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500/30 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl">🎵</span>
                </div>
                <p className="text-xs text-gray-400">Smart Music</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl">🧠</span>
                </div>
                <p className="text-xs text-gray-400">AI Vision</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/30 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl">🎤</span>
                </div>
                <p className="text-xs text-gray-400">Voice Host</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-500/30 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl">👁️</span>
                </div>
                <p className="text-xs text-gray-400">Face Recognition</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;