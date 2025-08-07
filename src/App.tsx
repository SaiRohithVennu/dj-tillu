import React, { useState, useRef, useEffect } from 'react';
import { EventSetupWizard, VIPPerson } from './components/EventSetupWizard';
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
import { AudioVisualizer } from './components/AudioVisualizer';
import { EventDetailsManager } from './components/EventDetailsManager';
import { MoodPlaylistManager } from './components/MoodPlaylistManager';
import { AIDJPanel } from './components/AIDJPanel';
import { Settings, X, Zap } from 'lucide-react';

import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useTrackLibrary } from './hooks/useTrackLibrary';
import { useGeminiMoodAnalysis } from './hooks/useGeminiMoodAnalysis';
import { useServerSideAWSFaceRecognition } from './hooks/useServerSideAWSFaceRecognition';
import { useContinuousAIAgent } from './hooks/useContinuousAIAgent';
import { useOpenAIEventHost } from './hooks/useOpenAIEventHost';
import { useAIMoodDJ } from './hooks/useAIMoodDJ';
import { useWandbIntegration } from './hooks/useWandbIntegration';

export interface EventSetup {
  eventName: string;
  eventType: 'birthday' | 'corporate' | 'wedding' | 'party' | 'conference';
  duration: number;
  vipPeople: VIPPerson[];
  aiPersonality: 'humorous' | 'formal' | 'energetic' | 'professional';
}

interface AppEventDetails extends EventSetup {
  id: string;
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
  const [eventDetails, setEventDetails] = useState<AppEventDetails | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isAllSystemsActive, setIsAllSystemsActive] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Refs for callback functions
  const handleVIPRecognizedRef = useRef<((person: VIPPerson) => void) | null>(null);

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

  // AI systems
  const {
    mood,
    energy,
    crowdSize,
    confidence,
    isAnalyzing: isMoodAnalyzing,
    lastAnalysis,
    error: moodError,
    enabled: moodAnalysisEnabled,
    triggerAnalysis,
    toggleEnabled: toggleMoodAnalysis
  } = useGeminiMoodAnalysis(videoElement, true);

  const {
    isInitialized: awsInitialized,
    isAnalyzing: awsAnalyzing,
    recognizedPeople,
    lastAnalysis: awsLastAnalysis,
    error: awsError,
    crowdAnalysis
  } = useServerSideAWSFaceRecognition({
    videoElement,
    vipPeople: eventDetails?.vipPeople || [],
    eventId: eventDetails?.id || 'default',
    enabled: !!eventDetails && isAllSystemsActive,
    onVIPRecognized: (person) => handleVIPRecognizedRef.current?.(person)
  });

  const {
    isGenerating: openAIGenerating,
    lastAnnouncement,
    generateVIPAnnouncement,
    generateEventUpdate,
    generateMusicTransition,
    handleImmediateVIPAnnouncement
  } = useOpenAIEventHost({
    eventDetails: eventDetails ? {
      id: eventDetails.id,
      name: eventDetails.eventName,
      type: eventDetails.eventType,
      vipPeople: eventDetails.vipPeople,
      musicPreferences: [],
      specialRequests: []
    } : {
      id: 'default',
      name: 'Default Event',
      type: 'party',
      vipPeople: [],
      musicPreferences: [],
      specialRequests: []
    },
    onVIPRecognized: (person) => handleVIPRecognizedRef.current?.(person),
    onAnnouncementGenerated: (announcement) => {
      addAnnouncement(announcement, 'high');
    }
  });

  const {
    isAIActive,
    toggleAI,
    forceCheck,
    isAnnouncing,
    isTransitioning,
    timeToNextCheck,
    lastMood
  } = useAIMoodDJ({
    tracks,
    currentMood: mood,
    energy,
    crowdSize,
    onTrackChange: loadTrack,
    onAnnouncement: (message) => addAnnouncement(message, 'medium'),
    isPlaying,
    currentTrack
  });

  // Wandb analytics integration
  useWandbIntegration({
    mood,
    energy,
    crowdSize,
    confidence,
    currentTrack,
    isPlaying,
    isAIActive
  });

  // Set up the VIP recognition handler
  useEffect(() => {
    handleVIPRecognizedRef.current = (person: VIPPerson) => {
      console.log('🌟 VIP Recognized:', person.name, person.role);
      
      // Generate personalized announcement
      if (generateVIPAnnouncement) {
        generateVIPAnnouncement(person);
      }
      
      // Add to announcements with high priority
      const greeting = `Welcome ${person.name}! Great to see our ${person.role} here!`;
      addAnnouncement(greeting, 'high');
    };
  }, [generateVIPAnnouncement]);

  // Event setup completion
  const handleEventSetupComplete = (setup: EventSetup) => {
    const eventWithId: AppEventDetails = {
      ...setup,
      id: crypto.randomUUID()
    };
    setEventDetails(eventWithId);
    console.log('🎪 Event setup complete:', eventWithId);
  };

  // Announcement management
  const addAnnouncement = (message: string, priority: 'immediate' | 'high' | 'medium' | 'low' = 'medium') => {
    const announcement: Announcement = {
      id: crypto.randomUUID(),
      message,
      timestamp: new Date(),
      priority,
      status: 'pending'
    };
    
    setAnnouncements(prev => [...prev, announcement]);
    console.log('📢 Announcement added:', message);
  };

  const clearAnnouncements = () => {
    setAnnouncements([]);
  };

  // Start all systems
  const handleStartAll = () => {
    setIsAllSystemsActive(!isAllSystemsActive);
    
    if (!isAllSystemsActive) {
      // Welcome message when starting
      const welcomeMessage = eventDetails 
        ? `Welcome to ${eventDetails.eventName}! I'm your AI DJ and I'm ready to make this ${eventDetails.eventType} amazing!`
        : "Welcome! I'm your AI DJ and I'm ready to rock this event!";
      
      addAnnouncement(welcomeMessage, 'immediate');
    }
  };

  // Track selection
  const handleTrackSelect = (track: any) => {
    loadTrack(track);
    console.log('🎵 Track selected:', track.title);
  };

  // If no event is set up, show the wizard
  if (!eventDetails) {
    return <EventSetupWizard onSetupComplete={handleEventSetupComplete} />;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Fullscreen Video Background */}
      <FullscreenVideoBackground onVideoReady={setVideoElement} />

      {/* Main Interface Panels */}
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
          onTrackSelect={handleTrackSelect}
          onPlayToggle={togglePlay}
        />
      </DraggablePanel>

      <DraggablePanel
        title="Event Dashboard"
        initialPosition={{ x: 400, y: 100 }}
        initialSize={{ width: 400, height: 350 }}
        accentColor="blue"
      >
        <SmartEventDashboard
          eventDetails={{
            name: eventDetails.eventName,
            type: eventDetails.eventType,
            venue: 'Live Event',
            date: new Date().toLocaleDateString(),
            duration: eventDetails.duration * 60,
            expectedAttendance: 50,
            vibe: mood,
            specialRequests: ''
          }}
          currentTrack={currentTrack}
          currentMood={mood}
          energy={energy}
          crowdSize={crowdSize}
          isPlaying={isPlaying}
          announcements={announcements.map(a => a.message)}
        />
      </DraggablePanel>

      <DraggablePanel
        title="AI Video Agent"
        initialPosition={{ x: 830, y: 100 }}
        initialSize={{ width: 380, height: 450 }}
        accentColor="green"
      >
        <ContinuousAIAgentPanel
          currentTrack={currentTrack}
          currentMood={mood}
          energy={energy}
          crowdSize={crowdSize}
          eventDetails={eventDetails}
          isPlaying={isPlaying}
          onTrackChange={handleTrackSelect}
          onAnnouncement={(message) => addAnnouncement(message, 'medium')}
        />
      </DraggablePanel>

      <DraggablePanel
        title="Face Recognition"
        initialPosition={{ x: 1240, y: 100 }}
        initialSize={{ width: 320, height: 400 }}
        accentColor="yellow"
      >
        <ServerSideAWSPanel
          isInitialized={awsInitialized}
          isAnalyzing={awsAnalyzing}
          recognizedPeople={recognizedPeople}
          lastAnalysis={awsLastAnalysis}
          error={awsError}
          crowdAnalysis={crowdAnalysis}
          vipPeople={eventDetails.vipPeople}
          enabled={isAllSystemsActive}
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
          onAddAnnouncement={addAnnouncement}
          onClearAnnouncements={clearAnnouncements}
        />
      </DraggablePanel>

      <DraggablePanel
        title="AI DJ Controls"
        initialPosition={{ x: 400, y: 470 }}
        initialSize={{ width: 300, height: 250 }}
        accentColor="red"
      >
        <AIDJPanel
          isAIActive={isAIActive}
          onToggleAI={toggleAI}
          onForceCheck={forceCheck}
          isAnnouncing={isAnnouncing}
          isTransitioning={isTransitioning}
          timeToNextCheck={timeToNextCheck}
          lastMood={lastMood}
          currentMood={mood}
        />
      </DraggablePanel>

      {/* Now Playing - Only show when track is selected */}
      {currentTrack && (
        <DraggablePanel
          title="Now Playing"
          initialPosition={{ x: 730, y: 570 }}
          initialSize={{ width: 300, height: 350 }}
          accentColor="blue"
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
      )}

      {/* Settings Panel - Only show when settings is open */}
      {showSettings && (
        <DraggablePanel
          title="Settings & Music Discovery"
          initialPosition={{ x: 100, y: 50 }}
          initialSize={{ width: 500, height: 600 }}
          accentColor="purple"
        >
          <div className="space-y-6">
            <EventDetailsManager
              onEventSaved={(event) => {
                console.log('Event saved:', event);
                setShowSettings(false);
              }}
            />
            
            <AudiusBrowser
              onTrackSelect={handleTrackSelect}
              onAddToLibrary={addTrack}
              currentMood={mood}
            />
            
            <SupabaseTrackManager
              onTrackSelect={handleTrackSelect}
              onAddToLibrary={addTrack}
            />
            
            <WhooshMoodBrowser
              onTrackSelect={handleTrackSelect}
              onAddToLibrary={addTrack}
              currentMood={mood}
            />
            
            <MoodPlaylistManager
              tracks={tracks}
              onPlayTrack={handleTrackSelect}
            />
          </div>
        </DraggablePanel>
      )}

      {/* Floating Controls */}
      <FloatingControls
        onStartAll={handleStartAll}
        isAllActive={isAllSystemsActive}
      />

      {/* Settings Toggle */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="fixed top-6 left-6 z-50 w-12 h-12 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors border border-white/20"
        title="Settings"
      >
        {showSettings ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
      </button>

      {/* System Status Indicator */}
      <div className="fixed top-6 right-20 z-50 flex items-center space-x-2">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full backdrop-blur-md border border-white/20 ${
          isAllSystemsActive ? 'bg-green-500/30 text-green-200' : 'bg-gray-500/30 text-gray-300'
        }`}>
          <Zap className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isAllSystemsActive ? 'ALL SYSTEMS ACTIVE' : 'SYSTEMS STANDBY'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;