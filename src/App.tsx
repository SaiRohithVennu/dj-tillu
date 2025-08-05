import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Settings, Users, Mic, Camera, Music, Brain, Eye, Zap } from 'lucide-react';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useTrackLibrary } from './hooks/useTrackLibrary';
import { useGeminiMoodAnalysis } from './hooks/useGeminiMoodAnalysis';
import { useOpenAIEventHost } from './hooks/useOpenAIEventHost';
import { useContinuousAIAgent } from './hooks/useContinuousAIAgent';
import { useServerSideAWSFaceRecognition } from './hooks/useServerSideAWSFaceRecognition';
import { DJInterface } from './components/DJInterface';
import { TrackList } from './components/TrackList';
import { NowPlaying } from './components/NowPlaying';
import { GeminiMoodDisplay } from './components/GeminiMoodDisplay';
import { OpenAIEventHostPanel } from './components/OpenAIEventHostPanel';
import { ContinuousAIAgentPanel } from './components/ContinuousAIAgentPanel';
import { ServerSideAWSPanel } from './components/ServerSideAWSPanel';
import { EventSetupWizard } from './components/EventSetupWizard';
import { DraggablePanel } from './components/DraggablePanel';
import { FullscreenVideoBackground } from './components/FullscreenVideoBackground';
import { FloatingControls } from './components/FloatingControls';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  bpm: number;
  genre: string;
  file_path: string;
  file_size: number;
  audio_url?: string;
  album_art?: string;
  created_at?: string;
}

interface EventDetails {
  name: string;
  type: string;
  vipPhotos: File[];
  description?: string;
}

function App() {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [showSetupWizard, setShowSetupWizard] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Define functions before hooks that use them
  const loadTrack = (track: Track) => {
    setCurrentTrack(track);
    play(track.audio_url || '');
  };

  const triggerAnnouncement = (message: string, type: 'info' | 'warning' | 'celebration' = 'info') => {
    console.log(`[DJ Announcement - ${type.toUpperCase()}]: ${message}`);
    // This will be handled by the voice system
  };

  const handleVIPRecognized = (personName: string, confidence: number) => {
    triggerAnnouncement(`VIP ${personName} has arrived! Welcome to the party!`, 'celebration');
  };

  const handleEventSetupComplete = (details: EventDetails) => {
    setEventDetails(details);
    setShowSetupWizard(false);
  };

  const handleSkipSetup = () => {
    setShowSetupWizard(false);
  };

  const handleStartSession = () => {
    setSessionStarted(true);
  };

  // Initialize hooks after function definitions
  const { 
    isPlaying, 
    currentTime, 
    duration, 
    volume, 
    play, 
    pause, 
    seek, 
    setVolume 
  } = useAudioPlayer();

  const { tracks, loading: tracksLoading } = useTrackLibrary();
  
  const { 
    currentMood, 
    confidence, 
    isAnalyzing, 
    startAnalysis, 
    stopAnalysis 
  } = useGeminiMoodAnalysis(videoRef);

  const {
    isHosting,
    currentAnnouncement,
    startHosting,
    stopHosting,
    makeAnnouncement
  } = useOpenAIEventHost(eventDetails);

  const {
    isActive: aiAgentActive,
    currentAction,
    insights,
    startAgent,
    stopAgent
  } = useContinuousAIAgent({
    videoRef,
    currentTrack,
    eventDetails,
    triggerAnnouncement,
    loadTrack
  });

  const {
    isRecognizing,
    recognizedPeople,
    startRecognition,
    stopRecognition,
    addVIPPerson
  } = useServerSideAWSFaceRecognition({
    onVIPRecognized: handleVIPRecognized
  });

  // Auto-start systems when session begins
  useEffect(() => {
    if (sessionStarted && eventDetails) {
      startAnalysis();
      startHosting();
      startAgent();
      
      // Add VIP photos to face recognition
      if (eventDetails.vipPhotos.length > 0) {
        eventDetails.vipPhotos.forEach((photo, index) => {
          addVIPPerson(`VIP-${index + 1}`, photo);
        });
        startRecognition();
      }
    }
  }, [sessionStarted, eventDetails]);

  if (showSetupWizard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <EventSetupWizard
          onComplete={handleEventSetupComplete}
          onSkip={handleSkipSetup}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Fullscreen Video Background */}
      <FullscreenVideoBackground ref={videoRef} />
      
      {/* Main Interface */}
      <div className="relative z-10 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between bg-black/20 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-8 h-8 text-yellow-400" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                DJ Tillu
              </h1>
            </div>
            {eventDetails && (
              <div className="text-sm text-gray-300">
                <span className="font-medium">{eventDetails.name}</span>
                <span className="mx-2">•</span>
                <span className="capitalize">{eventDetails.type}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {sessionStarted && (
              <>
                <div className="flex items-center space-x-1 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs">LIVE</span>
                </div>
                {isAnalyzing && (
                  <div className="flex items-center space-x-1 text-blue-400">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs">AI Vision</span>
                  </div>
                )}
                {aiAgentActive && (
                  <div className="flex items-center space-x-1 text-purple-400">
                    <Brain className="w-4 h-4" />
                    <span className="text-xs">AI Agent</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Start Session Button */}
        {!sessionStarted && (
          <div className="flex justify-center">
            <button
              onClick={handleStartSession}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-105"
            >
              🎉 Start DJ Session
            </button>
          </div>
        )}

        {/* Main Content Grid */}
        {sessionStarted && (
          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
            {/* Left Panel - Track Library */}
            <div className="col-span-3">
              <DraggablePanel
                title="Track Library"
                icon={<Music className="w-4 h-4" />}
                defaultPosition={{ x: 20, y: 100 }}
                className="h-full"
              >
                <TrackList
                  tracks={tracks}
                  onTrackSelect={loadTrack}
                  currentTrack={currentTrack}
                  loading={tracksLoading}
                />
              </DraggablePanel>
            </div>

            {/* Center Panel - DJ Interface */}
            <div className="col-span-6">
              <div className="space-y-4 h-full">
                {/* Now Playing */}
                <DraggablePanel
                  title="Now Playing"
                  icon={<Play className="w-4 h-4" />}
                  defaultPosition={{ x: 400, y: 50 }}
                >
                  <NowPlaying
                    track={currentTrack}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    onPlayPause={() => isPlaying ? pause() : play()}
                    onSeek={seek}
                  />
                </DraggablePanel>

                {/* DJ Controls */}
                <DraggablePanel
                  title="DJ Controls"
                  icon={<Settings className="w-4 h-4" />}
                  defaultPosition={{ x: 400, y: 250 }}
                >
                  <DJInterface
                    isPlaying={isPlaying}
                    volume={volume}
                    onPlayPause={() => isPlaying ? pause() : play()}
                    onVolumeChange={setVolume}
                    onNext={() => {/* Handle next track */}}
                    onPrevious={() => {/* Handle previous track */}}
                  />
                </DraggablePanel>
              </div>
            </div>

            {/* Right Panel - AI Systems */}
            <div className="col-span-3 space-y-4">
              {/* Mood Analysis */}
              <DraggablePanel
                title="AI Mood Analysis"
                icon={<Eye className="w-4 h-4" />}
                defaultPosition={{ x: 1200, y: 100 }}
              >
                <GeminiMoodDisplay
                  mood={currentMood}
                  confidence={confidence}
                  isAnalyzing={isAnalyzing}
                  onToggleAnalysis={() => isAnalyzing ? stopAnalysis() : startAnalysis()}
                />
              </DraggablePanel>

              {/* AI Event Host */}
              <DraggablePanel
                title="AI Event Host"
                icon={<Mic className="w-4 h-4" />}
                defaultPosition={{ x: 1200, y: 300 }}
              >
                <OpenAIEventHostPanel
                  isHosting={isHosting}
                  currentAnnouncement={currentAnnouncement}
                  onToggleHosting={() => isHosting ? stopHosting() : startHosting()}
                  onMakeAnnouncement={makeAnnouncement}
                />
              </DraggablePanel>

              {/* Continuous AI Agent */}
              <DraggablePanel
                title="AI Agent"
                icon={<Brain className="w-4 h-4" />}
                defaultPosition={{ x: 1200, y: 500 }}
              >
                <ContinuousAIAgentPanel
                  isActive={aiAgentActive}
                  currentAction={currentAction}
                  insights={insights}
                  onToggle={() => aiAgentActive ? stopAgent() : startAgent()}
                />
              </DraggablePanel>

              {/* Face Recognition */}
              {eventDetails?.vipPhotos.length > 0 && (
                <DraggablePanel
                  title="VIP Recognition"
                  icon={<Users className="w-4 h-4" />}
                  defaultPosition={{ x: 1200, y: 700 }}
                >
                  <ServerSideAWSPanel
                    isRecognizing={isRecognizing}
                    recognizedPeople={recognizedPeople}
                    onToggleRecognition={() => isRecognizing ? stopRecognition() : startRecognition()}
                    vipCount={eventDetails.vipPhotos.length}
                  />
                </DraggablePanel>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Controls */}
      {sessionStarted && (
        <FloatingControls
          isPlaying={isPlaying}
          volume={volume}
          onPlayPause={() => isPlaying ? pause() : play()}
          onVolumeChange={setVolume}
          currentTrack={currentTrack}
        />
      )}
    </div>
  );
}

export default App;