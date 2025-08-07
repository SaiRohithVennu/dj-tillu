import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Settings, Maximize2, Minimize2 } from 'lucide-react';
import DraggablePanel from './components/DraggablePanel';
import TrackList from './components/TrackList';
import NowPlaying from './components/NowPlaying';
import DJInterface from './components/DJInterface';
import AIDJPanel from './components/AIDJPanel';
import AudioVisualizer from './components/AudioVisualizer';
import MoodDisplay from './components/MoodDisplay';
import DynamicBackground from './components/DynamicBackground';
import FloatingControls from './components/FloatingControls';
import VideoAnalyzer from './components/VideoAnalyzer';
import GeminiMoodDisplay from './components/GeminiMoodDisplay';
import VoiceAnnouncements from './components/VoiceAnnouncements';
import SmartEventDashboard from './components/SmartEventDashboard';
import EventSetupWizard from './components/EventSetupWizard';
import SupabaseTrackManager from './components/SupabaseTrackManager';
import FaceRecognitionSystem from './components/FaceRecognitionSystem';
import AWSFaceRecognitionPanel from './components/AWSFaceRecognitionPanel';
import ServerSideAWSPanel from './components/ServerSideAWSPanel';
import OpenAIEventHostPanel from './components/OpenAIEventHostPanel';
import ContinuousAIAgentPanel from './components/ContinuousAIAgentPanel';
import { useMusicPlayer } from './hooks/useMusicPlayer';
import { useAIMoodDJ } from './hooks/useAIMoodDJ';
import { useGeminiMoodAnalysis } from './hooks/useGeminiMoodAnalysis';
import { useSmartEventDJ } from './hooks/useSmartEventDJ';
import { useSmartEventEmcee } from './hooks/useSmartEventEmcee';
import { useOpenAIEventHost } from './hooks/useOpenAIEventHost';
import { useContinuousAIAgent } from './hooks/useContinuousAIAgent';
import { tracks } from './data/tracks';

interface EventDetails {
  name: string;
  type: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  vipPhotos: string[];
  aiPersonality: string;
}

function App() {
  // Initialize handlers first to prevent initialization errors
  const handleEventStart = () => {
    setIsEventActive(true);
    setShowEventSetup(false);
    
    // Start all systems
    if (startContinuousAgent) {
      startContinuousAgent();
    }
    
    // Auto-select first track if none selected
    if (!currentTrack && tracks.length > 0) {
      setCurrentTrack(tracks[0]);
    }
    
    console.log('🎉 Event started with all systems active!');
  };

  const handleEventSetupComplete = (details: EventDetails) => {
    setEventDetails(details);
    setShowEventSetup(false);
    console.log('Event setup completed:', details);
  };

  // State management
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(tracks[0]);
  const [volume, setVolume] = useState(0.7);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEventSetup, setShowEventSetup] = useState(false);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [isEventActive, setIsEventActive] = useState(false);
  const [allSystemsActive, setAllSystemsActive] = useState(false);

  // Hooks
  const { 
    playTrack, 
    pauseTrack, 
    nextTrack, 
    previousTrack,
    currentTime,
    duration,
    audioRef
  } = useMusicPlayer(tracks, currentTrack, setCurrentTrack);

  const { 
    currentMood, 
    moodIntensity, 
    suggestedTracks,
    startMoodAnalysis,
    stopMoodAnalysis
  } = useAIMoodDJ();

  const {
    mood: geminiMood,
    confidence: geminiConfidence,
    isAnalyzing: isGeminiAnalyzing,
    startAnalysis: startGeminiAnalysis,
    stopAnalysis: stopGeminiAnalysis
  } = useGeminiMoodAnalysis();

  const {
    eventStatus,
    currentSegment,
    timeRemaining,
    startEvent,
    pauseEvent,
    resetEvent
  } = useSmartEventDJ(eventDetails);

  const {
    announcements,
    addAnnouncement,
    clearAnnouncements
  } = useSmartEventEmcee(eventDetails, currentTrack);

  const {
    hostMessages,
    isHostActive,
    startHost,
    stopHost
  } = useOpenAIEventHost(eventDetails);

  const {
    agentStatus,
    interactions,
    startAgent: startContinuousAgent,
    stopAgent: stopContinuousAgent
  } = useContinuousAIAgent(eventDetails);

  // Effects
  useEffect(() => {
    if (isPlaying) {
      playTrack();
    } else {
      pauseTrack();
    }
  }, [isPlaying, playTrack, pauseTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef]);

  // Check if all systems are active
  useEffect(() => {
    const systemsActive = isEventActive && agentStatus === 'active';
    setAllSystemsActive(systemsActive);
  }, [isEventActive, agentStatus]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden relative">
      <DynamicBackground 
        mood={geminiMood || currentMood} 
        intensity={geminiConfidence || moodIntensity}
        isPlaying={isPlaying}
      />
      
      {/* Event Setup Wizard */}
      {showEventSetup && (
        <EventSetupWizard 
          onComplete={handleEventSetupComplete}
          onClose={() => setShowEventSetup(false)}
        />
      )}

      {/* Main Interface */}
      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              DJ Tillu
            </h1>
            <p className="text-purple-300">AI-Powered Event DJ System</p>
          </div>
          
          <div className="flex gap-2">
            {!eventDetails && (
              <button
                onClick={() => setShowEventSetup(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium"
              >
                Setup Event
              </button>
            )}
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all duration-200"
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </div>

        {/* Draggable Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Music Library */}
          <DraggablePanel
            title="Music Library"
            initialPosition={{ x: 20, y: 100 }}
            color="purple"
          >
            <TrackList 
              tracks={tracks}
              currentTrack={currentTrack}
              onTrackSelect={setCurrentTrack}
              isPlaying={isPlaying}
            />
          </DraggablePanel>

          {/* Event Dashboard */}
          <DraggablePanel
            title="Event Dashboard"
            initialPosition={{ x: 420, y: 100 }}
            color="blue"
          >
            <SmartEventDashboard
              eventDetails={eventDetails}
              eventStatus={eventStatus}
              currentSegment={currentSegment}
              timeRemaining={timeRemaining}
              isEventActive={isEventActive}
              onEventStart={handleEventStart}
            />
          </DraggablePanel>

          {/* AI Video Agent */}
          <DraggablePanel
            title="AI Video Agent"
            initialPosition={{ x: 820, y: 100 }}
            color="green"
          >
            <ContinuousAIAgentPanel
              agentStatus={agentStatus}
              interactions={interactions}
              eventDetails={eventDetails}
              isEventActive={isEventActive}
            />
          </DraggablePanel>

          {/* Face Recognition */}
          <DraggablePanel
            title="Face Recognition"
            initialPosition={{ x: 1220, y: 100 }}
            color="yellow"
          >
            <ServerSideAWSPanel />
          </DraggablePanel>
        </div>

        {/* Voice System Panel */}
        <DraggablePanel
          title="Voice System"
          initialPosition={{ x: 20, y: 500 }}
          color="pink"
        >
          <VoiceAnnouncements 
            announcements={announcements}
            onAddAnnouncement={addAnnouncement}
            onClearAnnouncements={clearAnnouncements}
          />
        </DraggablePanel>

        {/* Now Playing */}
        <div className="fixed bottom-20 left-4 right-4 z-20">
          <NowPlaying 
            track={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            onVolumeChange={setVolume}
          />
        </div>

        {/* Floating Controls */}
        <FloatingControls
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onNext={nextTrack}
          onPrevious={previousTrack}
          allSystemsActive={allSystemsActive}
          onStartAll={handleEventStart}
        />

        {/* Hidden Video Analyzer for continuous analysis */}
        <div className="hidden">
          <VideoAnalyzer />
        </div>

        {/* Audio Visualizer */}
        <div className="fixed bottom-4 right-4 z-10">
          <AudioVisualizer 
            audioRef={audioRef}
            isPlaying={isPlaying}
          />
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} />
    </div>
  );
}

export default App;