import React, { useState, useEffect, useRef } from 'react';
import { EventSetupWizard, EventSetup, VIPPerson } from './components/EventSetupWizard';
import { DraggablePanel } from './components/DraggablePanel';
import { FullscreenVideoBackground } from './components/FullscreenVideoBackground';
import { TrackList } from './components/TrackList';
import { NowPlaying } from './components/NowPlaying';
import { FloatingControls } from './components/FloatingControls';
import { VoiceAnnouncements } from './components/VoiceAnnouncements';
import { ContinuousAIAgentPanel } from './components/ContinuousAIAgentPanel';
import { SmartEventDashboard } from './components/SmartEventDashboard';
import { ServerSideAWSPanel } from './components/ServerSideAWSPanel';
import { EventDetailsManager } from './components/EventDetailsManager';
import { AudiusBrowser } from './components/AudiusBrowser';
import { SupabaseTrackManager } from './components/SupabaseTrackManager';
import { WhooshMoodBrowser } from './components/WhooshMoodBrowser';
import { MoodPlaylistManager } from './components/MoodPlaylistManager';
import { AudioVisualizer } from './components/AudioVisualizer';
import { { AIDJPanel } from './components/AIDJPanel';
import { useTrackLibrary } from './hooks/useTrackLibrary';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useGeminiMoodAnalysis } from './hooks/useGeminiMoodAnalysis';
import { useServerSideAWSFaceRecognition } from './hooks/useServerSideAWSFaceRecognition';
import { useContinuousAIAgent } from './hooks/useContinuousAIAgent';
import { useSmartEventEmcee } from './hooks/useSmartEventEmcee';
import { useAIMoodDJ } from './hooks/useAIMoodDJ';
import { useOpenAIEventHost } from './hooks/useOpenAIEventHost';
import { useWandbIntegration } from './hooks/useWandbIntegration';
import { Settings, Zap, Music, Users, Brain, Eye, Mic, Calendar, Database, Globe, Heart, BarChart3 } from 'lucide-react';

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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAllActive, setIsAllActive] = useState(false);

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

  // AI Analysis Hooks
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

  // Face Recognition Hook
  const {
    isInitialized: faceRecognitionInitialized,
    isAnalyzing: isFaceAnalyzing,
    recognizedPeople,
    lastAnalysis: lastFaceAnalysis,
    error: faceRecognitionError,
    crowdAnalysis
  } = useServerSideAWSFaceRecognition({
    videoElement,
    vipPeople: eventDetails?.vipPeople || [],
    eventId: eventDetails?.id || '',
    enabled: !!eventDetails && isAllActive,
    onVIPRecognized: handleVIPRecognized
  });

  // Continuous AI Agent Hook
  const {
    isActive: aiAgentActive,
    startAgent,
    stopAgent,
    isAnalyzing: aiAgentAnalyzing,
    lastResponse: aiLastResponse,
    responseHistory: aiResponseHistory,
    agentStatus,
    error: aiAgentError,
    forceAnalysis: forceAIAnalysis
  } = useContinuousAIAgent({
    videoElement,
    eventContext: eventDetails ? {
      eventName: eventDetails.eventName,
      eventType: eventDetails.eventType,
      duration: eventDetails.duration,
      aiPersonality: eventDetails.aiPersonality,
      vipPeople: eventDetails.vipPeople,
      startTime: new Date()
    } : null,
    tracks,
    currentTrack,
    isPlaying,
    onAnnouncement: addAnnouncement,
    onTrackChange: handleTrackSelect,
    enabled: isAllActive
  });

  // Smart Event Emcee Hook
  const {
    isActive: emceeActive,
    startEvent: startEmcee,
    stopEvent: stopEmcee,
    recognizedPeople: emceeRecognizedPeople,
    currentMood: emceeMood,
    currentEnergy: emceeEnergy,
    crowdSize: emceeCrowdSize,
    lastAnalysis: emceeLastAnalysis,
    isAnalyzing: emceeAnalyzing
  } = useSmartEventEmcee({
    tracks,
    videoElement,
    eventSetup: eventDetails || {
      eventName: '',
      eventType: 'party',
      duration: 1,
      vipPeople: [],
      aiPersonality: 'energetic',
      specialMoments: []
    },
    onTrackChange: handleTrackSelect,
    onAnnouncement: addAnnouncement,
    isPlaying,
    currentTrack
  });

  // AI Mood DJ Hook
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
    onTrackChange: handleTrackSelect,
    onAnnouncement: addAnnouncement,
    isPlaying,
    currentTrack
  });

  // OpenAI Event Host Hook
  const {
    isGenerating: isHostGenerating,
    lastAnnouncement: hostLastAnnouncement,
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
      id: '',
      name: '',
      type: 'party',
      vipPeople: [],
      musicPreferences: [],
      specialRequests: []
    },
    onVIPRecognized: handleVIPRecognized,
    onAnnouncementGenerated: addAnnouncement
  });

  // Wandb Analytics Hook
  const { logAIDecision, logUserInteraction, logMoodOverride, logAnnouncement } = useWandbIntegration({
    mood,
    energy,
    crowdSize,
    confidence,
    currentTrack,
    isPlaying,
    isAIActive
  });

  // Event handlers
  const handleEventSetupComplete = (setup: EventSetup) => {
    const eventWithId: AppEventDetails = {
      ...setup,
      id: crypto.randomUUID()
    };
    setEventDetails(eventWithId);
    console.log('🎪 Event setup complete:', eventWithId.eventName);
  };

  const handleTrackSelect = async (track: any) => {
    await loadTrack(track);
    logUserInteraction('track_select', { track: track.title, artist: track.artist });
  };

  const handleVIPRecognized = (person: VIPPerson) => {
    console.log('🌟 VIP Recognized:', person.name);
    
    // Generate immediate announcement
    if (eventDetails) {
      handleImmediateVIPAnnouncement(person);
    }
    
    logUserInteraction('vip_recognized', { 
      name: person.name, 
      role: person.role,
      recognitionCount: person.recognitionCount 
    });
  };

  const addAnnouncement = (message: string, priority: 'immediate' | 'high' | 'medium' | 'low' = 'medium') => {
    const announcement: Announcement = {
      id: crypto.randomUUID(),
      message,
      timestamp: new Date(),
      priority,
      status: 'pending'
    };
    
    setAnnouncements(prev => [...prev, announcement]);
    logAnnouncement(message);
    console.log('📢 Announcement added:', message);
  };

  const clearAnnouncements = () => {
    setAnnouncements([]);
  };

  const handleStartAll = () => {
    setIsAllActive(true);
    
    if (eventDetails) {
      startEmcee();
      startAgent();
      
      addAnnouncement(
        `Welcome to ${eventDetails.eventName}! All AI systems are now active and ready to make this ${eventDetails.eventType} amazing!`,
        'immediate'
      );
    }
    
    logUserInteraction('start_all_systems', { eventName: eventDetails?.eventName });
  };

  const handleStopAll = () => {
    setIsAllActive(false);
    stopEmcee();
    stopAgent();
    
    addAnnouncement('AI systems have been paused. Thank you for using DJ Tillu!', 'high');
    logUserInteraction('stop_all_systems', {});
  };

  // Show event setup wizard if no event is configured
  if (!eventDetails) {
    return <EventSetupWizard onSetupComplete={handleEventSetupComplete} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fullscreen Video Background */}
      <FullscreenVideoBackground onVideoReady={setVideoElement} />

      {/* Main Interface Panels */}
      <div className="relative z-10">
        {/* Track Library Panel */}
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

        {/* Smart Event Dashboard */}
        <DraggablePanel
          title="Event Dashboard"
          initialPosition={{ x: 390, y: 100 }}
          initialSize={{ width: 400, height: 450 }}
          accentColor="blue"
        >
          <SmartEventDashboard
            eventDetails={{
              name: eventDetails.eventName,
              type: eventDetails.eventType,
              venue: 'Live Event',
              date: new Date().toLocaleDateString(),
              duration: eventDetails.duration * 60, // Convert to minutes
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

        {/* Continuous AI Agent Panel */}
        <DraggablePanel
          title="AI Video Agent"
          initialPosition={{ x: 810, y: 100 }}
          initialSize={{ width: 380, height: 500 }}
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
            onAnnouncement={addAnnouncement}
          />
        </DraggablePanel>

        {/* Server-Side AWS Face Recognition Panel */}
        <DraggablePanel
          title="Face Recognition"
          initialPosition={{ x: 1210, y: 100 }}
          initialSize={{ width: 320, height: 450 }}
          accentColor="red"
        >
          <ServerSideAWSPanel
            isInitialized={faceRecognitionInitialized}
            isAnalyzing={isFaceAnalyzing}
            recognizedPeople={recognizedPeople}
            lastAnalysis={lastFaceAnalysis}
            error={faceRecognitionError}
            crowdAnalysis={crowdAnalysis}
            vipPeople={eventDetails.vipPeople}
            enabled={isAllActive}
          />
        </DraggablePanel>

        {/* Voice Announcements Panel */}
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

        {/* AI DJ Panel */}
        <DraggablePanel
          title="AI DJ Assistant"
          initialPosition={{ x: 390, y: 570 }}
          initialSize={{ width: 320, height: 350 }}
          accentColor="yellow"
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

        {/* Audio Visualizer Panel */}
        <DraggablePanel
          title="Audio Visualizer"
          initialPosition={{ x: 730, y: 620 }}
          initialSize={{ width: 300, height: 300 }}
          accentColor="blue"
        >
          <AudioVisualizer
            isPlaying={isPlaying}
            audioElement={null}
            mood={mood}
          />
        </DraggablePanel>
      </div>

      {/* Now Playing (Conditional) */}
      {currentTrack && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
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

      {/* Floating Controls */}
      <FloatingControls
        onStartAll={isAllActive ? handleStopAll : handleStartAll}
        isAllActive={isAllActive}
      />

      {/* Settings Panel (Conditional) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">DJ Settings & Music Discovery</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Event Details Manager */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                  Event Management
                </h3>
                <EventDetailsManager onEventSaved={() => {}} />
              </div>

              {/* Audius Browser */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-purple-400" />
                  Audius Discovery
                </h3>
                <AudiusBrowser
                  onTrackSelect={handleTrackSelect}
                  onAddToLibrary={addTrack}
                  currentMood={mood}
                />
              </div>

              {/* Supabase Track Manager */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Database className="w-5 h-5 mr-2 text-green-400" />
                  Upload Tracks
                </h3>
                <SupabaseTrackManager
                  onTrackSelect={handleTrackSelect}
                  onAddToLibrary={addTrack}
                />
              </div>

              {/* WhooshMusic Browser */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-pink-400" />
                  Mood Discovery
                </h3>
                <WhooshMoodBrowser
                  onTrackSelect={handleTrackSelect}
                  onAddToLibrary={addTrack}
                  currentMood={mood}
                />
              </div>

              {/* Mood Playlist Manager */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Music className="w-5 h-5 mr-2 text-yellow-400" />
                  Mood Playlists
                </h3>
                <MoodPlaylistManager
                  tracks={tracks}
                  onPlayTrack={handleTrackSelect}
                />
              </div>

              {/* System Status */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-cyan-400" />
                  System Status
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Event:</span>
                    <span className="text-white font-medium">{eventDetails.eventName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">AI Systems:</span>
                    <span className={`font-medium ${isAllActive ? 'text-green-300' : 'text-red-300'}`}>
                      {isAllActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Tracks Loaded:</span>
                    <span className="text-purple-300 font-medium">{tracks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">VIPs Configured:</span>
                    <span className="text-blue-300 font-medium">{eventDetails.vipPeople.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Current Mood:</span>
                    <span className="text-yellow-300 font-medium capitalize">{mood}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Energy Level:</span>
                    <span className="text-orange-300 font-medium">{energy}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Toggle Button */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed top-6 right-6 z-40 w-12 h-12 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors border border-white/20"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Event Status Indicator */}
      <div className="fixed top-6 left-6 z-40 bg-black/30 backdrop-blur-md rounded-xl border border-white/20 p-3">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isAllActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
          <div className="text-white">
            <p className="font-semibold">{eventDetails.eventName}</p>
            <p className="text-xs text-gray-300 capitalize">{eventDetails.eventType} • {eventDetails.aiPersonality} AI</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;