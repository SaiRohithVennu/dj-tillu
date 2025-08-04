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
import { AudioVisualizer } from './components/AudioVisualizer';
import { GeminiMoodDisplay } from './components/GeminiMoodDisplay';
import { DynamicBackground } from './components/DynamicBackground';

import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useTrackLibrary } from './hooks/useTrackLibrary';
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
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [eventSetup, setEventSetup] = useState<EventSetup | null>(null);
  const [showEventSetup, setShowEventSetup] = useState(true);
  const [isEventActive, setIsEventActive] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Generate unique event ID
  const eventId = useRef(crypto.randomUUID()).current;

  // Audio system
  const audioPlayer = useAudioPlayer();
  const trackLibrary = useTrackLibrary();

  // AI systems
  const geminiMood = useGeminiMoodAnalysis(videoElement, true);
  
  // Default event setup for AI systems
  const defaultSetup: EventSetup = {
    eventName: 'DJ Session',
    eventType: 'party',
    duration: 2,
    vipPeople: [],
    aiPersonality: 'energetic',
    specialMoments: []
  };

  // Continuous AI Agent
  const continuousAI = useContinuousAIAgent({
    videoElement,
    eventContext: {
      ...defaultSetup,
      ...(eventSetup || {}),
      startTime: new Date()
    },
    tracks: trackLibrary.tracks,
    currentTrack: audioPlayer.currentTrack,
    isPlaying: audioPlayer.isPlaying,
    onAnnouncement: triggerAnnouncement,
    onTrackChange: loadTrack,
    enabled: isEventActive
  });

  // AWS Face Recognition
  const awsFaceRecognition = useServerSideAWSFaceRecognition({
    videoElement,
    vipPeople: eventSetup?.vipPeople || [],
    eventId,
    enabled: isEventActive && eventSetup !== null,
    onVIPRecognized: handleVIPRecognized
  });

  // Smart Event DJ
  const smartEventDJ = useSmartEventDJ({
    tracks: trackLibrary.tracks,
    currentMood: geminiMood.mood,
    energy: geminiMood.energy,
    crowdSize: geminiMood.crowdSize,
    onTrackChange: loadTrack,
    onAnnouncement: triggerAnnouncement,
    isPlaying: audioPlayer.isPlaying,
    currentTrack: audioPlayer.currentTrack
  });

  // Event handlers
  const handleEventSetupComplete = (setup: EventSetup) => {
    setEventSetup(setup);
    setShowEventSetup(false);
    setIsEventActive(true);
    console.log('🎪 Event setup complete:', setup.eventName);
  };

  const handleSkipSetup = () => {
    setShowEventSetup(false);
    setHasStarted(true);
    console.log('🎪 Skipped event setup, starting basic DJ mode');
  };

  const loadTrack = async (track: Track) => {
    try {
      await audioPlayer.loadTrack(track);
      console.log('🎵 Track loaded:', track.title);
    } catch (error) {
      console.error('Failed to load track:', error);
    }
  };

  const handleVIPRecognized = (person: VIPPerson) => {
    console.log('🌟 VIP recognized:', person.name);
    
    // Trigger personalized announcement
    const greeting = person.greeting || `Welcome ${person.name}! Great to see you here!`;
    setTimeout(() => {
      triggerAnnouncement(greeting);
    }, 1000);
  };

  const triggerAnnouncement = (message: string) => {
    console.log('🎤 Triggering announcement:', message);
    
    // Dispatch custom event for voice system
    window.dispatchEvent(new CustomEvent('immediateAnnouncement', {
      detail: { message }
    }));
  };

  const handleStartSession = () => {
    setHasStarted(true);
    if (!audioPlayer.currentTrack && trackLibrary.tracks.length > 0) {
      loadTrack(trackLibrary.tracks[0]);
    }
    console.log('🎵 DJ session started');
  };

  // Auto-load first track when library is ready
  useEffect(() => {
    if (!audioPlayer.currentTrack && trackLibrary.tracks.length > 0 && !trackLibrary.isLoading) {
      loadTrack(trackLibrary.tracks[0]);
    }
  }, [trackLibrary.tracks, trackLibrary.isLoading]);

  // Show event setup wizard first
  if (showEventSetup) {
    return (
      <EventSetupWizard
        onSetupComplete={handleEventSetupComplete}
        onSkip={handleSkipSetup}
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Dynamic Background */}
      <DynamicBackground 
        mood={geminiMood.mood} 
        energy={geminiMood.energy} 
        isPlaying={audioPlayer.isPlaying} 
      />

      {/* Fullscreen Video Background */}
      <FullscreenVideoBackground onVideoReady={setVideoElement} />

      {/* Main UI Panels */}
      <DraggablePanel
        title="Track Library"
        initialPosition={{ x: 20, y: 100 }}
        initialSize={{ width: 350, height: 500 }}
        accentColor="purple"
      >
        <TrackList
          tracks={trackLibrary.tracks}
          currentTrack={audioPlayer.currentTrack}
          isPlaying={audioPlayer.isPlaying}
          onTrackSelect={loadTrack}
          onPlayToggle={audioPlayer.togglePlay}
        />
      </DraggablePanel>

      <DraggablePanel
        title="Face Recognition"
        initialPosition={{ x: window.innerWidth - 370, y: 100 }}
        initialSize={{ width: 350, height: 400 }}
        accentColor="green"
      >
        <ServerSideAWSPanel
          vipPeople={eventSetup?.vipPeople || []}
          recognitionResults={awsFaceRecognition.recognitionResults}
          isEnabled={awsFaceRecognition.isEnabled}
          onToggle={awsFaceRecognition.toggleEnabled}
          status={awsFaceRecognition.status}
        />
      </DraggablePanel>

      <DraggablePanel
        title="AI Video Agent"
        initialPosition={{ x: 20, y: 620 }}
        initialSize={{ width: 400, height: 350 }}
        accentColor="blue"
      >
        <ContinuousAIAgentPanel
          isActive={continuousAI.isActive}
          onStartAgent={continuousAI.startAgent}
          onStopAgent={continuousAI.stopAgent}
          isAnalyzing={continuousAI.isAnalyzing}
          lastResponse={continuousAI.lastResponse}
          responseHistory={continuousAI.responseHistory}
          agentStatus={continuousAI.agentStatus}
          error={continuousAI.error}
          onForceAnalysis={continuousAI.forceAnalysis}
          conversationHistory={continuousAI.conversationHistory}
          eventContext={eventSetup || defaultSetup}
        />
      </DraggablePanel>

      <DraggablePanel
        title="Event Dashboard"
        initialPosition={{ x: window.innerWidth - 370, y: 520 }}
        initialSize={{ width: 350, height: 400 }}
        accentColor="yellow"
      >
        <SmartEventDashboard
          eventDetails={eventSetup}
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

      <DraggablePanel
        title="AI Vision"
        initialPosition={{ x: 440, y: 100 }}
        initialSize={{ width: 300, height: 350 }}
        accentColor="pink"
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

      <DraggablePanel
        title="Voice System"
        initialPosition={{ x: 440, y: 470 }}
        initialSize={{ width: 300, height: 300 }}
        accentColor="red"
      >
        <VoiceAnnouncements
          mood={geminiMood.mood}
          energy={geminiMood.energy}
          crowdSize={geminiMood.crowdSize}
          currentTrack={audioPlayer.currentTrack?.title || ''}
          onAnnouncementStart={audioPlayer.duckAudio}
          onAnnouncementEnd={audioPlayer.unduckAudio}
        />
      </DraggablePanel>

      {/* Now Playing - Center Bottom */}
      {audioPlayer.currentTrack && (
        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-40">
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

      {/* Floating Controls */}
      <FloatingControls
        isPlaying={audioPlayer.isPlaying}
        onPlayToggle={audioPlayer.togglePlay}
        onSettingsToggle={() => setShowSettings(!showSettings)}
        onStartSession={handleStartSession}
        hasStarted={hasStarted}
      />

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black/80 backdrop-blur-xl rounded-3xl border border-white/20 p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">DJ Tillu Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Event Configuration */}
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <EventDetailsManager onEventSaved={(event) => console.log('Event saved:', event)} />
              </div>

              {/* Music Sources */}
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <AudiusBrowser
                  onTrackSelect={loadTrack}
                  onAddToLibrary={trackLibrary.addTrack}
                  currentMood={geminiMood.mood}
                />
              </div>

              <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <SupabaseTrackManager
                  onTrackSelect={loadTrack}
                  onAddToLibrary={trackLibrary.addTrack}
                />
              </div>

              <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <WhooshMoodBrowser
                  onTrackSelect={loadTrack}
                  onAddToLibrary={trackLibrary.addTrack}
                  currentMood={geminiMood.mood}
                />
              </div>

              {/* Mood Management */}
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <MoodPlaylistManager
                  tracks={trackLibrary.tracks}
                  onPlayTrack={loadTrack}
                />
              </div>

              {/* Audio Visualization */}
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <AudioVisualizer
                  isPlaying={audioPlayer.isPlaying}
                  audioElement={audioPlayer.audioElement}
                  mood={geminiMood.mood}
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