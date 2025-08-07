import React, { useState, useRef, useEffect } from 'react';
import { Music, Users, Brain, Mic, Camera, Upload, Settings, Play, Pause, SkipForward, Volume2 } from 'lucide-react';
import { DraggablePanel } from './components/DraggablePanel';
import { AIDJPanel } from './components/AIDJPanel';
import { TrackList } from './components/TrackList';
import { NowPlaying } from './components/NowPlaying';
import { MoodDisplay } from './components/MoodDisplay';
import { AudioVisualizer } from './components/AudioVisualizer';
import { DJInterface } from './components/DJInterface';
import { FloatingControls } from './components/FloatingControls';
import { DynamicBackground } from './components/DynamicBackground';
import { AudiusBrowser } from './components/AudiusBrowser';
import { FMABrowser } from './components/FMABrowser';
import { WhooshMoodBrowser } from './components/WhooshMoodBrowser';
import { VideoAnalyzer } from './components/VideoAnalyzer';
import { GeminiMoodDisplay } from './components/GeminiMoodDisplay';
import { VoiceAnnouncements } from './components/VoiceAnnouncements';
import { SupabaseTrackUploader } from './components/SupabaseTrackUploader';
import { SupabaseTrackManager } from './components/SupabaseTrackManager';
import { EventSetupWizard } from './components/EventSetupWizard';
import { SmartEventDashboard } from './components/SmartEventDashboard';
import { EventDetailsManager } from './components/EventDetailsManager';
import { MoodPlaylistManager } from './components/MoodPlaylistManager';
import { FullscreenVideoBackground } from './components/FullscreenVideoBackground';
import { FaceRecognitionSystem } from './components/FaceRecognitionSystem';
import { AWSFaceRecognitionPanel } from './components/AWSFaceRecognitionPanel';
import { ServerSideAWSPanel } from './components/ServerSideAWSPanel';
import { OpenAIEventHostPanel } from './components/OpenAIEventHostPanel';
import { ContinuousAIAgentPanel } from './components/ContinuousAIAgentPanel';
import { AudioDebugger } from './components/AudioDebugger';

import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useMusicPlayer } from './hooks/useMusicPlayer';
import { useTrackLibrary } from './hooks/useTrackLibrary';
import { useMoodAnalysis } from './hooks/useMoodAnalysis';
import { useGeminiMoodAnalysis } from './hooks/useGeminiMoodAnalysis';
import { useSmartEventDJ } from './hooks/useSmartEventDJ';
import { useSmartEventEmcee } from './hooks/useSmartEventEmcee';
import { useAWSFaceRecognition } from './hooks/useAWSFaceRecognition';
import { useServerSideAWSFaceRecognition } from './hooks/useServerSideAWSFaceRecognition';
import { useOpenAIEventHost } from './hooks/useOpenAIEventHost';
import { useContinuousAIAgent } from './hooks/useContinuousAIAgent';
import { useWandbIntegration } from './hooks/useWandbIntegration';

import { tracks } from './data/tracks';

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
  expectedAttendance: number;
  duration: number;
  vibe: string;
  specialRequests: string;
}

interface VIPGuest {
  id: string;
  name: string;
  preferences: string[];
  lastSeen?: Date;
}

function App() {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [selectedTracks, setSelectedTracks] = useState<Track[]>([]);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [vipGuests, setVipGuests] = useState<VIPGuest[]>([]);
  const [showEventSetup, setShowEventSetup] = useState(false);
  const [showVideoBackground, setShowVideoBackground] = useState(false);

  const handleVIPRecognizedRef = useRef<((guest: VIPGuest) => void) | null>(null);

  const { 
    currentMood, 
    energy, 
    crowdSize, 
    recommendations 
  } = useMoodAnalysis();

  const {
    mood: geminiMood,
    confidence: geminiConfidence,
    suggestions: geminiSuggestions,
    isAnalyzing: isGeminiAnalyzing,
    analyzeImage: analyzeGeminiImage
  } = useGeminiMoodAnalysis();

  const {
    playlist,
    currentIndex,
    isAutoMixing,
    toggleAutoMix,
    nextTrack,
    previousTrack
  } = useSmartEventDJ(tracks, eventDetails);

  const {
    announcement,
    isAnnouncing,
    makeAnnouncement
  } = useSmartEventEmcee(eventDetails, currentTrack);

  const {
    isRecognizing: isAWSRecognizing,
    recognizedFaces: awsRecognizedFaces,
    startRecognition: startAWSRecognition,
    stopRecognition: stopAWSRecognition
  } = useAWSFaceRecognition();

  const {
    isRecognizing: isServerRecognizing,
    recognizedFaces: serverRecognizedFaces,
    startRecognition: startServerRecognition,
    stopRecognition: stopServerRecognition
  } = useServerSideAWSFaceRecognition(handleVIPRecognizedRef.current);

  const {
    isHosting,
    currentScript,
    hostPersonality,
    startHosting,
    stopHosting,
    updatePersonality
  } = useOpenAIEventHost(
    eventDetails,
    currentTrack,
    { currentMood, energy, crowdSize },
    handleVIPRecognizedRef.current
  );

  const {
    isActive: isAgentActive,
    insights,
    recommendations: agentRecommendations,
    performance
  } = useContinuousAIAgent({
    eventDetails,
    currentTrack,
    currentMood,
    energy,
    crowdSize,
    tracks,
    vipGuests
  });

  const { logEvent, logMetric } = useWandbIntegration();

  // Set up the VIP recognition handler
  useEffect(() => {
    handleVIPRecognizedRef.current = (guest: VIPGuest) => {
      setVipGuests(prev => {
        const existing = prev.find(g => g.id === guest.id);
        if (existing) {
          return prev.map(g => g.id === guest.id ? { ...g, lastSeen: new Date() } : g);
        }
        return [...prev, { ...guest, lastSeen: new Date() }];
      });

      // Log VIP recognition event
      logEvent('vip_recognized', {
        guest_id: guest.id,
        guest_name: guest.name,
        preferences: guest.preferences
      });

      // Make announcement for VIP
      makeAnnouncement(`Welcome back ${guest.name}! We've prepared some special music just for you.`);
    };
  }, [logEvent, makeAnnouncement]);

  const handleTrackSelect = (track: Track) => {
    setCurrentTrack(track);
    logEvent('track_selected', {
      track_id: track.id,
      track_title: track.title,
      artist: track.artist,
      genre: track.genre
    });
  };

  const handleEventSetup = (details: EventDetails) => {
    setEventDetails(details);
    setShowEventSetup(false);
    logEvent('event_setup', {
      event_name: details.name,
      event_type: details.type,
      expected_attendance: details.expectedAttendance
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden relative">
      <DynamicBackground 
        currentMood={currentMood} 
        energy={energy} 
        isPlaying={isPlaying} 
      />
      
      {showVideoBackground && (
        <FullscreenVideoBackground
          onClose={() => setShowVideoBackground(false)}
        />
      )}

      {showEventSetup && (
        <EventSetupWizard
          onComplete={handleEventSetup}
          onClose={() => setShowEventSetup(false)}
        />
      )}

      <div className="relative z-10 p-4">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Music className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI DJ System
              </h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-purple-300">
              <Users className="w-4 h-4" />
              <span>Crowd: {crowdSize}</span>
              <span className="mx-2">•</span>
              <span>Energy: {Math.round(energy * 100)}%</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowEventSetup(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Event Setup</span>
            </button>
            <button
              onClick={() => setShowVideoBackground(!showVideoBackground)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>Video BG</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
          {/* Left Column - Track Management */}
          <div className="col-span-3 space-y-4">
            <DraggablePanel title="Track Library" icon={<Music className="w-4 h-4" />}>
              <TrackList 
                tracks={tracks} 
                onTrackSelect={handleTrackSelect}
                selectedTrack={currentTrack}
              />
            </DraggablePanel>
            
            <DraggablePanel title="Supabase Tracks" icon={<Upload className="w-4 h-4" />}>
              <SupabaseTrackManager onTrackSelect={handleTrackSelect} />
            </DraggablePanel>
          </div>

          {/* Center Column - Main Interface */}
          <div className="col-span-6 space-y-4">
            <DraggablePanel title="Now Playing" icon={<Play className="w-4 h-4" />}>
              <NowPlaying 
                track={currentTrack}
                isPlaying={isPlaying}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                onNext={nextTrack}
                onPrevious={previousTrack}
              />
            </DraggablePanel>

            <DraggablePanel title="DJ Interface" icon={<Mic className="w-4 h-4" />}>
              <DJInterface 
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                volume={volume}
                onVolumeChange={setVolume}
                onTrackChange={setCurrentTrack}
              />
            </DraggablePanel>

            <DraggablePanel title="Audio Visualizer" icon={<Volume2 className="w-4 h-4" />}>
              <AudioVisualizer 
                isPlaying={isPlaying}
                currentTrack={currentTrack}
                volume={volume}
              />
            </DraggablePanel>
          </div>

          {/* Right Column - AI & Analysis */}
          <div className="col-span-3 space-y-4">
            <DraggablePanel title="AI DJ Assistant" icon={<Brain className="w-4 h-4" />}>
              <AIDJPanel 
                currentMood={currentMood}
                energy={energy}
                recommendations={recommendations}
                onTrackSelect={handleTrackSelect}
              />
            </DraggablePanel>

            <DraggablePanel title="Mood Analysis" icon={<Brain className="w-4 h-4" />}>
              <MoodDisplay 
                mood={currentMood}
                energy={energy}
                crowdSize={crowdSize}
                recommendations={recommendations}
              />
            </DraggablePanel>

            <DraggablePanel title="Gemini Vision" icon={<Camera className="w-4 h-4" />}>
              <GeminiMoodDisplay 
                mood={geminiMood}
                confidence={geminiConfidence}
                suggestions={geminiSuggestions}
                isAnalyzing={isGeminiAnalyzing}
                onAnalyzeImage={analyzeGeminiImage}
              />
            </DraggablePanel>
          </div>
        </div>

        {/* Additional Panels - Floating */}
        <DraggablePanel 
          title="Video Analyzer" 
          icon={<Camera className="w-4 h-4" />}
          initialPosition={{ x: 50, y: 50 }}
          className="fixed z-20"
        >
          <VideoAnalyzer onMoodDetected={(mood) => console.log('Video mood:', mood)} />
        </DraggablePanel>

        <DraggablePanel 
          title="Music Browser" 
          icon={<Music className="w-4 h-4" />}
          initialPosition={{ x: 100, y: 100 }}
          className="fixed z-20"
        >
          <AudiusBrowser onTrackSelect={handleTrackSelect} />
        </DraggablePanel>

        <DraggablePanel 
          title="FMA Browser" 
          icon={<Music className="w-4 h-4" />}
          initialPosition={{ x: 150, y: 150 }}
          className="fixed z-20"
        >
          <FMABrowser onTrackSelect={handleTrackSelect} />
        </DraggablePanel>

        <DraggablePanel 
          title="Mood Browser" 
          icon={<Brain className="w-4 h-4" />}
          initialPosition={{ x: 200, y: 200 }}
          className="fixed z-20"
        >
          <WhooshMoodBrowser onTrackSelect={handleTrackSelect} />
        </DraggablePanel>

        <DraggablePanel 
          title="Voice Announcements" 
          icon={<Mic className="w-4 h-4" />}
          initialPosition={{ x: 250, y: 250 }}
          className="fixed z-20"
        >
          <VoiceAnnouncements 
            announcement={announcement}
            isAnnouncing={isAnnouncing}
            onMakeAnnouncement={makeAnnouncement}
          />
        </DraggablePanel>

        <DraggablePanel 
          title="Track Uploader" 
          icon={<Upload className="w-4 h-4" />}
          initialPosition={{ x: 300, y: 300 }}
          className="fixed z-20"
        >
          <SupabaseTrackUploader />
        </DraggablePanel>

        <DraggablePanel 
          title="Event Dashboard" 
          icon={<Users className="w-4 h-4" />}
          initialPosition={{ x: 350, y: 350 }}
          className="fixed z-20"
        >
          <SmartEventDashboard 
            eventDetails={eventDetails}
            currentTrack={currentTrack}
            mood={currentMood}
            energy={energy}
            crowdSize={crowdSize}
            vipGuests={vipGuests}
          />
        </DraggablePanel>

        <DraggablePanel 
          title="Event Details" 
          icon={<Settings className="w-4 h-4" />}
          initialPosition={{ x: 400, y: 400 }}
          className="fixed z-20"
        >
          <EventDetailsManager 
            eventDetails={eventDetails}
            onUpdateDetails={setEventDetails}
          />
        </DraggablePanel>

        <DraggablePanel 
          title="Mood Playlists" 
          icon={<Music className="w-4 h-4" />}
          initialPosition={{ x: 450, y: 450 }}
          className="fixed z-20"
        >
          <MoodPlaylistManager 
            currentMood={currentMood}
            onTrackSelect={handleTrackSelect}
          />
        </DraggablePanel>

        <DraggablePanel 
          title="Face Recognition" 
          icon={<Camera className="w-4 h-4" />}
          initialPosition={{ x: 500, y: 500 }}
          className="fixed z-20"
        >
          <FaceRecognitionSystem 
            onVIPRecognized={(guest) => handleVIPRecognizedRef.current?.(guest)}
          />
        </DraggablePanel>

        <DraggablePanel 
          title="AWS Face Recognition" 
          icon={<Camera className="w-4 h-4" />}
          initialPosition={{ x: 550, y: 550 }}
          className="fixed z-20"
        >
          <AWSFaceRecognitionPanel 
            isRecognizing={isAWSRecognizing}
            recognizedFaces={awsRecognizedFaces}
            onStartRecognition={startAWSRecognition}
            onStopRecognition={stopAWSRecognition}
          />
        </DraggablePanel>

        <DraggablePanel 
          title="Server-Side AWS" 
          icon={<Camera className="w-4 h-4" />}
          initialPosition={{ x: 600, y: 600 }}
          className="fixed z-20"
        >
          <ServerSideAWSPanel 
            isRecognizing={isServerRecognizing}
            recognizedFaces={serverRecognizedFaces}
            onStartRecognition={startServerRecognition}
            onStopRecognition={stopServerRecognition}
          />
        </DraggablePanel>

        <DraggablePanel 
          title="AI Event Host" 
          icon={<Mic className="w-4 h-4" />}
          initialPosition={{ x: 650, y: 650 }}
          className="fixed z-20"
        >
          <OpenAIEventHostPanel 
            isHosting={isHosting}
            currentScript={currentScript}
            hostPersonality={hostPersonality}
            onStartHosting={startHosting}
            onStopHosting={stopHosting}
            onUpdatePersonality={updatePersonality}
          />
        </DraggablePanel>

        <DraggablePanel 
          title="Continuous AI Agent" 
          icon={<Brain className="w-4 h-4" />}
          initialPosition={{ x: 700, y: 700 }}
          className="fixed z-20"
        >
          <ContinuousAIAgentPanel 
            isActive={isAgentActive}
            insights={insights}
            recommendations={agentRecommendations}
            performance={performance}
            tracks={tracks}
          />
        </DraggablePanel>

        <DraggablePanel 
          title="Audio Debugger" 
          icon={<Volume2 className="w-4 h-4" />}
          initialPosition={{ x: 750, y: 750 }}
          className="fixed z-20"
        >
          <AudioDebugger 
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            volume={volume}
          />
        </DraggablePanel>
      </div>

      <FloatingControls 
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onNext={nextTrack}
        onPrevious={previousTrack}
        volume={volume}
        onVolumeChange={setVolume}
      />
    </div>
  );
}

export default App;