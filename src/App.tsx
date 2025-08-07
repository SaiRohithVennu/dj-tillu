import React, { useState, useRef } from 'react';
import { Play, Pause, SkipForward, Volume2, Users, Mic, Settings, Brain, Eye, Camera, MessageSquare } from 'lucide-react';
import DraggablePanel from './components/DraggablePanel';
import AudioVisualizer from './components/AudioVisualizer';
import NowPlaying from './components/NowPlaying';
import TrackList from './components/TrackList';
import MoodDisplay from './components/MoodDisplay';
import DJInterface from './components/DJInterface';
import AIDJPanel from './components/AIDJPanel';
import VideoAnalyzer from './components/VideoAnalyzer';
import DynamicBackground from './components/DynamicBackground';
import FloatingControls from './components/FloatingControls';
import VoiceAnnouncements from './components/VoiceAnnouncements';
import EventSetupWizard, { EventSetup, VIPPerson } from './components/EventSetupWizard';
import SmartEventDashboard from './components/SmartEventDashboard';
import ContinuousAIAgentPanel from './components/ContinuousAIAgentPanel';
import ServerSideAWSPanel from './components/ServerSideAWSPanel';
import OpenAIEventHostPanel from './components/OpenAIEventHostPanel';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useTrackLibrary } from './hooks/useTrackLibrary';
import { useGeminiMoodAnalysis } from './hooks/useGeminiMoodAnalysis';
import { useSmartEventDJ } from './hooks/useSmartEventDJ';
import { useContinuousAIAgent } from './hooks/useContinuousAIAgent';
import { useServerSideAWSFaceRecognition } from './hooks/useServerSideAWSFaceRecognition';
import { useOpenAIEventHost } from './hooks/useOpenAIEventHost';

interface AppEventDetails extends EventSetup {
  id: string;
}

function App() {
  const [showEventSetup, setShowEventSetup] = useState(true);
  const [eventDetails, setEventDetails] = useState<AppEventDetails | null>(null);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Audio player and track management
  const { 
    isPlaying, 
    currentTrack, 
    volume, 
    currentTime, 
    duration,
    play, 
    pause, 
    skipToNext, 
    setVolume,
    seekTo 
  } = useAudioPlayer();

  const { tracks, isLoading: tracksLoading } = useTrackLibrary();

  // Mood analysis
  const { 
    currentMood, 
    energy, 
    crowdSize, 
    isAnalyzing 
  } = useGeminiMoodAnalysis(videoRef);

  // Smart Event DJ
  const smartDJ = useSmartEventDJ({
    tracks: tracks || [],
    currentMood,
    energy,
    crowdSize,
    onTrackChange: (track) => {
      // Handle track change
      console.log('Track changed:', track);
    },
    onAnnouncement: (announcement) => {
      setAnnouncements(prev => [...prev, announcement]);
    },
    isPlaying,
    currentTrack
  });

  // Continuous AI Agent
  const aiAgent = useContinuousAIAgent({
    eventDetails: eventDetails || undefined,
    currentMood,
    energy,
    crowdSize,
    currentTrack,
    isPlaying,
    tracks: tracks || [],
    announcements
  });

  // Server-side AWS Face Recognition
  const awsFaceRecognition = useServerSideAWSFaceRecognition({
    eventDetails: eventDetails || { 
      eventName: '', 
      eventType: 'party', 
      expectedAttendees: 0, 
      vipPeople: [], 
      musicPreferences: [], 
      specialRequests: '' 
    },
    onVIPRecognized: (vip: VIPPerson) => {
      console.log('VIP recognized:', vip);
      setAnnouncements(prev => [...prev, `VIP ${vip.name} has arrived!`]);
    }
  });

  // OpenAI Event Host
  const eventHost = useOpenAIEventHost({
    eventDetails: eventDetails || { 
      eventName: '', 
      eventType: 'party', 
      expectedAttendees: 0, 
      vipPeople: [], 
      musicPreferences: [], 
      specialRequests: '' 
    },
    currentMood,
    energy,
    crowdSize,
    currentTrack,
    isPlaying,
    onAnnouncement: (announcement) => {
      setAnnouncements(prev => [...prev, announcement]);
    }
  });

  const handleEventSetupComplete = (setup: EventSetup) => {
    const eventWithId: AppEventDetails = {
      ...setup,
      id: crypto.randomUUID()
    };
    setEventDetails(eventWithId);
    setShowEventSetup(false);
  };

  const handleAddAnnouncement = (announcement: string) => {
    setAnnouncements(prev => [...prev, announcement]);
  };

  const handleClearAnnouncements = () => {
    setAnnouncements([]);
  };

  const handleUpdateEventDetails = (updates: Partial<EventSetup>) => {
    if (eventDetails) {
      setEventDetails(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  if (showEventSetup) {
    return <EventSetupWizard onComplete={handleEventSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden relative">
      <DynamicBackground mood={currentMood} energy={energy} />
      
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

      {/* Main Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Event DJ
              </h1>
              <p className="text-purple-300">{eventDetails?.eventName || 'Smart Event Management'}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <Users className="w-5 h-5 text-purple-300" />
              <span className="text-sm">{crowdSize} people</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <Brain className="w-5 h-5 text-blue-300" />
              <span className="text-sm capitalize">{currentMood}</span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Left Column - Now Playing & Controls */}
          <div className="col-span-4 space-y-6">
            <NowPlaying 
              track={currentTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onSeek={seekTo}
            />
            
            <DJInterface
              isPlaying={isPlaying}
              volume={volume}
              onPlay={play}
              onPause={pause}
              onNext={skipToNext}
              onVolumeChange={setVolume}
            />

            <AudioVisualizer 
              isPlaying={isPlaying}
              currentTrack={currentTrack}
            />
          </div>

          {/* Center Column - Track List & Mood */}
          <div className="col-span-4 space-y-6">
            <TrackList 
              tracks={tracks || []}
              currentTrack={currentTrack}
              onTrackSelect={(track) => {
                // Handle track selection
                console.log('Track selected:', track);
              }}
              isLoading={tracksLoading}
            />
            
            <MoodDisplay 
              mood={currentMood}
              energy={energy}
              crowdSize={crowdSize}
              isAnalyzing={isAnalyzing}
            />
          </div>

          {/* Right Column - Smart Event Dashboard */}
          <div className="col-span-4">
            <SmartEventDashboard
              eventDetails={eventDetails}
              currentMood={currentMood}
              energy={energy}
              crowdSize={crowdSize}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              tracks={tracks || []}
              announcements={announcements}
              onUpdateEventDetails={handleUpdateEventDetails}
              onAddAnnouncement={handleAddAnnouncement}
              onClearAnnouncements={handleClearAnnouncements}
            />
          </div>
        </div>
      </div>

      {/* Floating Panels */}
      <DraggablePanel
        title="AI DJ Assistant"
        icon={<Brain className="w-5 h-5" />}
        initialPosition={{ x: 50, y: 100 }}
        defaultSize={{ width: 400, height: 500 }}
      >
        <AIDJPanel
          currentMood={currentMood}
          energy={energy}
          crowdSize={crowdSize}
          currentTrack={currentTrack}
          onTrackRecommendation={(track) => {
            console.log('AI recommended track:', track);
          }}
        />
      </DraggablePanel>

      <DraggablePanel
        title="Video Analysis"
        icon={<Camera className="w-5 h-5" />}
        initialPosition={{ x: 500, y: 100 }}
        defaultSize={{ width: 350, height: 400 }}
      >
        <VideoAnalyzer
          videoRef={videoRef}
          currentMood={currentMood}
          energy={energy}
          crowdSize={crowdSize}
          isAnalyzing={isAnalyzing}
        />
      </DraggablePanel>

      <DraggablePanel
        title="Continuous AI Agent"
        icon={<Brain className="w-5 h-5" />}
        initialPosition={{ x: 900, y: 100 }}
        defaultSize={{ width: 400, height: 600 }}
      >
        <ContinuousAIAgentPanel
          isActive={aiAgent.isActive}
          responseHistory={aiAgent.responseHistory}
          onStart={aiAgent.startAgent}
          onStop={aiAgent.stopAgent}
          onClearHistory={aiAgent.clearHistory}
        />
      </DraggablePanel>

      <DraggablePanel
        title="Face Recognition"
        icon={<Eye className="w-5 h-5" />}
        initialPosition={{ x: 100, y: 400 }}
        defaultSize={{ width: 350, height: 450 }}
      >
        <ServerSideAWSPanel
          isActive={awsFaceRecognition.isActive}
          recognizedFaces={awsFaceRecognition.recognizedFaces}
          onStart={awsFaceRecognition.startRecognition}
          onStop={awsFaceRecognition.stopRecognition}
          onClearHistory={awsFaceRecognition.clearHistory}
        />
      </DraggablePanel>

      <DraggablePanel
        title="AI Event Host"
        icon={<MessageSquare className="w-5 h-5" />}
        initialPosition={{ x: 500, y: 400 }}
        defaultSize={{ width: 400, height: 500 }}
      >
        <OpenAIEventHostPanel
          isActive={eventHost.isActive}
          announcements={eventHost.announcements}
          onStart={eventHost.startHosting}
          onStop={eventHost.stopHosting}
          onClearAnnouncements={eventHost.clearAnnouncements}
          onImmediateAnnouncement={eventHost.handleImmediateVIPAnnouncement}
        />
      </DraggablePanel>

      {/* Voice Announcements */}
      <VoiceAnnouncements 
        announcements={announcements}
        onAnnouncementComplete={(index) => {
          setAnnouncements(prev => prev.filter((_, i) => i !== index));
        }}
      />

      {/* Floating Controls */}
      <FloatingControls
        isPlaying={isPlaying}
        onPlay={play}
        onPause={pause}
        onNext={skipToNext}
        volume={volume}
        onVolumeChange={setVolume}
      />
    </div>
  );
}

export default App;