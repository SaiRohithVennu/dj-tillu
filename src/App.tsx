import React, { useState, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Settings, Users, Brain, Mic, Camera, Upload, Music } from 'lucide-react';
import { DraggablePanel } from './components/DraggablePanel';
import { AudioVisualizer } from './components/AudioVisualizer';
import { NowPlaying } from './components/NowPlaying';
import { TrackList } from './components/TrackList';
import { DJInterface } from './components/DJInterface';
import { MoodDisplay } from './components/MoodDisplay';
import { GeminiMoodDisplay } from './components/GeminiMoodDisplay';
import { VideoAnalyzer } from './components/VideoAnalyzer';
import { VoiceAnnouncements } from './components/VoiceAnnouncements';
import { SmartEventDashboard } from './components/SmartEventDashboard';
import { ContinuousAIAgentPanel } from './components/ContinuousAIAgentPanel';
import { ServerSideAWSPanel } from './components/ServerSideAWSPanel';
import { OpenAIEventHostPanel } from './components/OpenAIEventHostPanel';
import { SupabaseTrackUploader } from './components/SupabaseTrackUploader';
import { SupabaseTrackManager } from './components/SupabaseTrackManager';
import { EventSetupWizard } from './components/EventSetupWizard';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useTrackLibrary } from './hooks/useTrackLibrary';
import { useGeminiMoodAnalysis } from './hooks/useGeminiMoodAnalysis';
import { useSmartEventDJ } from './hooks/useSmartEventDJ';
import { useContinuousAIAgent } from './hooks/useContinuousAIAgent';
import { useServerSideAWSFaceRecognition } from './hooks/useServerSideAWSFaceRecognition';
import { useOpenAIEventHost } from './hooks/useOpenAIEventHost';

interface EventDetails {
  name: string;
  type: string;
  expectedAttendees: number;
  duration: number;
  vibe: string;
  specialRequests: string;
}

function App() {
  const [showEventSetup, setShowEventSetup] = useState(true);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [allSystemsStarted, setAllSystemsStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Core hooks
  const { tracks, loading: tracksLoading } = useTrackLibrary();
  const { currentMood, energy, crowdSize } = useGeminiMoodAnalysis(videoRef);
  const { 
    currentTrack, 
    isPlaying, 
    play, 
    pause, 
    nextTrack, 
    previousTrack,
    setCurrentTrack 
  } = useAudioPlayer(tracks);

  // Smart Event DJ
  const smartEventDJ = useSmartEventDJ({
    tracks,
    currentMood,
    energy,
    crowdSize,
    onTrackChange: setCurrentTrack,
    onAnnouncement: (announcement: string) => {
      setAnnouncements(prev => [...prev, announcement]);
    },
    isPlaying,
    currentTrack
  });

  // AI Systems
  const continuousAIAgent = useContinuousAIAgent({
    videoRef,
    eventDetails,
    currentTrack,
    currentMood,
    energy,
    crowdSize
  });

  const faceRecognition = useServerSideAWSFaceRecognition({
    videoRef,
    onFaceDetected: (faces) => {
      console.log('Faces detected:', faces);
    }
  });

  const eventHost = useOpenAIEventHost({
    eventDetails,
    currentTrack,
    currentMood,
    crowdSize,
    onAnnouncement: (announcement: string) => {
      setAnnouncements(prev => [...prev, announcement]);
    }
  });

  const handleEventSetupComplete = (details: EventDetails) => {
    setEventDetails(details);
    setShowEventSetup(false);
  };

  const handleStartAllSystems = () => {
    setAllSystemsStarted(true);
    // Start all AI systems
    continuousAIAgent.startAgent();
    faceRecognition.startRecognition();
    eventHost.startHosting();
  };

  const handleAddAnnouncement = (announcement: string) => {
    setAnnouncements(prev => [...prev, announcement]);
  };

  const handleClearAnnouncements = () => {
    setAnnouncements([]);
  };

  const handleUpdateEventDetails = (details: Partial<EventDetails>) => {
    if (eventDetails) {
      setEventDetails({ ...eventDetails, ...details });
    }
  };

  if (showEventSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <EventSetupWizard onComplete={handleEventSetupComplete} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden relative">
      {/* Hidden video element for mood analysis */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="hidden"
        onLoadedMetadata={() => {
          if (videoRef.current) {
            videoRef.current.play();
          }
        }}
      />

      {/* Main Control Panel */}
      <div className="absolute top-4 left-4 z-50">
        <div className="bg-black/20 backdrop-blur-md rounded-lg p-4 border border-white/10">
          <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Music className="w-8 h-8" />
            AI Event DJ System
          </h1>
          
          {eventDetails && (
            <div className="mb-4 text-sm">
              <p><strong>Event:</strong> {eventDetails.name}</p>
              <p><strong>Type:</strong> {eventDetails.type}</p>
              <p><strong>Expected:</strong> {eventDetails.expectedAttendees} people</p>
            </div>
          )}

          {!allSystemsStarted ? (
            <button
              onClick={handleStartAllSystems}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              START ALL SYSTEMS
            </button>
          ) : (
            <div className="text-green-400 font-semibold flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              All Systems Active
            </div>
          )}
        </div>
      </div>

      {/* Audio Controls */}
      <div className="absolute bottom-4 left-4 right-4 z-40">
        <div className="bg-black/20 backdrop-blur-md rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={previousTrack}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              
              <button
                onClick={isPlaying ? pause : play}
                className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              
              <button
                onClick={nextTrack}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {currentTrack && (
              <div className="flex-1 mx-6">
                <div className="text-sm font-medium">{currentTrack.title}</div>
                <div className="text-xs text-white/60">{currentTrack.artist}</div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <div className="w-20 h-1 bg-white/20 rounded-full">
                <div className="w-3/4 h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Draggable Panels */}
      <DraggablePanel
        title="Audio Visualizer"
        defaultPosition={{ x: 100, y: 100 }}
        defaultSize={{ width: 400, height: 300 }}
      >
        <AudioVisualizer />
      </DraggablePanel>

      <DraggablePanel
        title="Now Playing"
        defaultPosition={{ x: 520, y: 100 }}
        defaultSize={{ width: 350, height: 200 }}
      >
        <NowPlaying track={currentTrack} />
      </DraggablePanel>

      <DraggablePanel
        title="Track Library"
        defaultPosition={{ x: 100, y: 420 }}
        defaultSize={{ width: 500, height: 400 }}
      >
        <TrackList 
          tracks={tracks} 
          currentTrack={currentTrack}
          onTrackSelect={setCurrentTrack}
          loading={tracksLoading}
        />
      </DraggablePanel>

      <DraggablePanel
        title="DJ Interface"
        defaultPosition={{ x: 620, y: 320 }}
        defaultSize={{ width: 400, height: 350 }}
      >
        <DJInterface />
      </DraggablePanel>

      <DraggablePanel
        title="Mood Analysis"
        defaultPosition={{ x: 890, y: 100 }}
        defaultSize={{ width: 300, height: 250 }}
      >
        <GeminiMoodDisplay 
          mood={currentMood}
          energy={energy}
          crowdSize={crowdSize}
        />
      </DraggablePanel>

      <DraggablePanel
        title="Video Analysis"
        defaultPosition={{ x: 1040, y: 370 }}
        defaultSize={{ width: 350, height: 300 }}
      >
        <VideoAnalyzer videoRef={videoRef} />
      </DraggablePanel>

      <DraggablePanel
        title="Voice Announcements"
        defaultPosition={{ x: 1200, y: 100 }}
        defaultSize={{ width: 300, height: 400 }}
      >
        <VoiceAnnouncements 
          announcements={announcements}
          onAddAnnouncement={handleAddAnnouncement}
          onClearAnnouncements={handleClearAnnouncements}
        />
      </DraggablePanel>

      <DraggablePanel
        title="Event Dashboard"
        defaultPosition={{ x: 200, y: 50 }}
        defaultSize={{ width: 600, height: 500 }}
      >
        <SmartEventDashboard
          eventDetails={eventDetails}
          currentTrack={currentTrack}
          currentMood={currentMood}
          energy={energy}
          crowdSize={crowdSize}
          isPlaying={isPlaying}
          tracks={tracks}
          onUpdateEventDetails={handleUpdateEventDetails}
          onTrackChange={setCurrentTrack}
          onAnnouncement={handleAddAnnouncement}
        />
      </DraggablePanel>

      <DraggablePanel
        title="AI Agent"
        defaultPosition={{ x: 820, y: 50 }}
        defaultSize={{ width: 400, height: 450 }}
      >
        <ContinuousAIAgentPanel
          isActive={continuousAIAgent.isActive}
          responseHistory={continuousAIAgent.responseHistory}
          currentResponse={continuousAIAgent.currentResponse}
          onStart={continuousAIAgent.startAgent}
          onStop={continuousAIAgent.stopAgent}
        />
      </DraggablePanel>

      <DraggablePanel
        title="Face Recognition"
        defaultPosition={{ x: 1240, y: 50 }}
        defaultSize={{ width: 350, height: 400 }}
      >
        <ServerSideAWSPanel
          isActive={faceRecognition.isActive}
          detectedFaces={faceRecognition.detectedFaces}
          onStart={faceRecognition.startRecognition}
          onStop={faceRecognition.stopRecognition}
        />
      </DraggablePanel>

      <DraggablePanel
        title="AI Event Host"
        defaultPosition={{ x: 50, y: 600 }}
        defaultSize={{ width: 400, height: 350 }}
      >
        <OpenAIEventHostPanel
          isActive={eventHost.isActive}
          currentScript={eventHost.currentScript}
          onStart={eventHost.startHosting}
          onStop={eventHost.stopHosting}
        />
      </DraggablePanel>

      <DraggablePanel
        title="Track Uploader"
        defaultPosition={{ x: 470, y: 600 }}
        defaultSize={{ width: 400, height: 300 }}
      >
        <SupabaseTrackUploader />
      </DraggablePanel>

      <DraggablePanel
        title="Track Manager"
        defaultPosition={{ x: 890, y: 600 }}
        defaultSize={{ width: 500, height: 400 }}
      >
        <SupabaseTrackManager />
      </DraggablePanel>
    </div>
  );
}

export default App;