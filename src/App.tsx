import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Settings, Volume2 } from 'lucide-react';
import FloatingControls from './components/FloatingControls';
import DraggablePanel from './components/DraggablePanel';
import NowPlaying from './components/NowPlaying';
import TrackList from './components/TrackList';
import DJInterface from './components/DJInterface';
import AudioVisualizer from './components/AudioVisualizer';
import DynamicBackground from './components/DynamicBackground';
import AIDJPanel from './components/AIDJPanel';
import MoodDisplay from './components/MoodDisplay';
import AudiusBrowser from './components/AudiusBrowser';
import FMABrowser from './components/FMABrowser';
import VideoAnalyzer from './components/VideoAnalyzer';
import SupabaseTrackManager from './components/SupabaseTrackManager';
import SupabaseTrackUploader from './components/SupabaseTrackUploader';
import EventSetupWizard from './components/EventSetupWizard';
import SmartEventDashboard from './components/SmartEventDashboard';
import EventDetailsManager from './components/EventDetailsManager';
import MoodPlaylistManager from './components/MoodPlaylistManager';
import WhooshMoodBrowser from './components/WhooshMoodBrowser';
import FaceRecognitionSystem from './components/FaceRecognitionSystem';
import AWSFaceRecognitionPanel from './components/AWSFaceRecognitionPanel';
import ServerSideAWSPanel from './components/ServerSideAWSPanel';
import OpenAIEventHostPanel from './components/OpenAIEventHostPanel';
import VoiceAnnouncements from './components/VoiceAnnouncements';
import ContinuousAIAgentPanel from './components/ContinuousAIAgentPanel';
import FullscreenVideoBackground from './components/FullscreenVideoBackground';
import { useMusicPlayer } from './hooks/useMusicPlayer';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useMoodAnalysis } from './hooks/useMoodAnalysis';
import { useSmartEventDJ } from './hooks/useSmartEventDJ';
import { useTrackLibrary } from './hooks/useTrackLibrary';
import { useWandbIntegration } from './hooks/useWandbIntegration';
import { useGeminiMoodAnalysis } from './hooks/useGeminiMoodAnalysis';
import { useAWSFaceRecognition } from './hooks/useAWSFaceRecognition';
import { useServerSideAWSFaceRecognition } from './hooks/useServerSideAWSFaceRecognition';
import { useOpenAIEventHost } from './hooks/useOpenAIEventHost';
import { useContinuousAIAgent } from './hooks/useContinuousAIAgent';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [volume, setVolume] = useState(0.7);
  const [showEventSetup, setShowEventSetup] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);
  const [vipGuests, setVipGuests] = useState([]);
  const [aiPersonality, setAiPersonality] = useState('humorous');
  const [showVideoBackground, setShowVideoBackground] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize hooks
  const { tracks, isLoading: tracksLoading } = useTrackLibrary();
  const { 
    currentMood, 
    moodHistory, 
    analyzeMood,
    isAnalyzing 
  } = useMoodAnalysis();
  
  const {
    playTrack,
    pauseTrack,
    nextTrack,
    previousTrack,
    setTrackVolume
  } = useAudioPlayer(audioRef);

  const {
    smartRecommendations,
    generatePlaylist,
    isGenerating
  } = useSmartEventDJ();

  const { logEvent } = useWandbIntegration();
  
  const {
    moodData: geminiMood,
    analyzeMoodFromVideo: analyzeGeminiMood,
    isAnalyzing: isGeminiAnalyzing
  } = useGeminiMoodAnalysis();

  const {
    recognizedFaces: awsFaces,
    analyzeFrame: analyzeAWSFrame,
    isAnalyzing: isAWSAnalyzing
  } = useAWSFaceRecognition();

  const {
    recognizedFaces: serverFaces,
    analyzeFrame: analyzeServerFrame,
    isAnalyzing: isServerAnalyzing
  } = useServerSideAWSFaceRecognition();

  const {
    isActive: isOpenAIActive,
    startAnalysis: startOpenAI,
    stopAnalysis: stopOpenAI,
    lastDecision,
    recognizedVIPs
  } = useOpenAIEventHost(videoRef, vipGuests, eventDetails, aiPersonality);

  const {
    isActive: isAgentActive,
    startAgent,
    stopAgent,
    agentState,
    agentDecisions
  } = useContinuousAIAgent(videoRef, eventDetails, vipGuests);

  // Handle play/pause
  const handlePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
      setIsPlaying(false);
    } else {
      if (currentTrack) {
        playTrack(currentTrack);
      } else if (tracks.length > 0) {
        const firstTrack = tracks[0];
        setCurrentTrack(firstTrack);
        playTrack(firstTrack);
      }
      setIsPlaying(true);
    }
  };

  // Handle volume changes
  useEffect(() => {
    setTrackVolume(volume);
  }, [volume, setTrackVolume]);

  // Handle event setup completion
  const handleEventSetupComplete = (details, guests, personality) => {
    setEventDetails(details);
    setVipGuests(guests);
    setAiPersonality(personality);
    setShowEventSetup(false);
    
    // Log event setup
    logEvent('event_setup_completed', {
      event_type: details?.type,
      vip_count: guests?.length || 0,
      personality: personality
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Dynamic Background */}
      <DynamicBackground currentMood={currentMood} isPlaying={isPlaying} />
      
      {/* Fullscreen Video Background */}
      {showVideoBackground && (
        <FullscreenVideoBackground 
          onClose={() => setShowVideoBackground(false)}
        />
      )}

      {/* Hidden video element for AI analysis */}
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

      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {/* Voice Announcements System */}
      <VoiceAnnouncements />

      {/* Event Setup Wizard */}
      {showEventSetup && (
        <EventSetupWizard
          onComplete={handleEventSetupComplete}
          onClose={() => setShowEventSetup(false)}
        />
      )}

      {/* Main Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <Volume2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">DJ Tillu</h1>
              <p className="text-purple-200">AI-Powered Event Host</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowEventSetup(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 font-medium"
            >
              Event Setup
            </button>
            <button
              onClick={() => setShowVideoBackground(!showVideoBackground)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-medium"
            >
              Video Mode
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-200"
            >
              <Settings className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Main Play Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handlePlayPause}
            className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-2xl hover:shadow-pink-500/25"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white ml-1" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </button>
        </div>

        {/* Audio Visualizer */}
        <div className="mb-8">
          <AudioVisualizer 
            audioRef={audioRef} 
            isPlaying={isPlaying}
            currentMood={currentMood}
          />
        </div>

        {/* Floating Controls */}
        <FloatingControls
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          volume={volume}
          onVolumeChange={setVolume}
          onNext={nextTrack}
          onPrevious={previousTrack}
        />

        {/* Draggable Panels */}
        {showSettings && (
          <>
            {/* Now Playing */}
            <DraggablePanel
              title="Now Playing"
              initialPosition={{ x: 50, y: 100 }}
              initialSize={{ width: 350, height: 200 }}
            >
              <NowPlaying 
                track={currentTrack}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
              />
            </DraggablePanel>

            {/* Track Library */}
            <DraggablePanel
              title="Track Library"
              initialPosition={{ x: 450, y: 100 }}
              initialSize={{ width: 400, height: 300 }}
            >
              <TrackList
                tracks={tracks}
                currentTrack={currentTrack}
                onTrackSelect={(track) => {
                  setCurrentTrack(track);
                  playTrack(track);
                  setIsPlaying(true);
                }}
                isLoading={tracksLoading}
              />
            </DraggablePanel>

            {/* DJ Interface */}
            <DraggablePanel
              title="DJ Controls"
              initialPosition={{ x: 900, y: 100 }}
              initialSize={{ width: 300, height: 400 }}
            >
              <DJInterface
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                volume={volume}
                onVolumeChange={setVolume}
                onNext={nextTrack}
                onPrevious={previousTrack}
              />
            </DraggablePanel>

            {/* AI DJ Panel */}
            <DraggablePanel
              title="AI DJ Assistant"
              initialPosition={{ x: 50, y: 350 }}
              initialSize={{ width: 350, height: 300 }}
            >
              <AIDJPanel
                currentMood={currentMood}
                recommendations={smartRecommendations}
                onGeneratePlaylist={generatePlaylist}
                isGenerating={isGenerating}
              />
            </DraggablePanel>

            {/* Mood Display */}
            <DraggablePanel
              title="Mood Analysis"
              initialPosition={{ x: 450, y: 450 }}
              initialSize={{ width: 300, height: 250 }}
            >
              <MoodDisplay
                currentMood={currentMood}
                moodHistory={moodHistory}
                onAnalyzeMood={() => analyzeMood(videoRef.current)}
                isAnalyzing={isAnalyzing}
              />
            </DraggablePanel>

            {/* Audius Browser */}
            <DraggablePanel
              title="Audius Music"
              initialPosition={{ x: 800, y: 450 }}
              initialSize={{ width: 400, height: 350 }}
            >
              <AudiusBrowser
                onTrackSelect={(track) => {
                  setCurrentTrack(track);
                  playTrack(track);
                  setIsPlaying(true);
                }}
              />
            </DraggablePanel>

            {/* FMA Browser */}
            <DraggablePanel
              title="Free Music Archive"
              initialPosition={{ x: 1250, y: 100 }}
              initialSize={{ width: 400, height: 350 }}
            >
              <FMABrowser
                onTrackSelect={(track) => {
                  setCurrentTrack(track);
                  playTrack(track);
                  setIsPlaying(true);
                }}
              />
            </DraggablePanel>

            {/* Video Analyzer */}
            <DraggablePanel
              title="Video Analysis"
              initialPosition={{ x: 1250, y: 500 }}
              initialSize={{ width: 350, height: 300 }}
            >
              <VideoAnalyzer
                videoRef={videoRef}
                onMoodDetected={(mood) => console.log('Mood detected:', mood)}
              />
            </DraggablePanel>

            {/* Supabase Track Manager */}
            <DraggablePanel
              title="Track Manager"
              initialPosition={{ x: 50, y: 700 }}
              initialSize={{ width: 400, height: 350 }}
            >
              <SupabaseTrackManager
                onTrackSelect={(track) => {
                  setCurrentTrack(track);
                  playTrack(track);
                  setIsPlaying(true);
                }}
              />
            </DraggablePanel>

            {/* Track Uploader */}
            <DraggablePanel
              title="Upload Tracks"
              initialPosition={{ x: 500, y: 700 }}
              initialSize={{ width: 350, height: 300 }}
            >
              <SupabaseTrackUploader />
            </DraggablePanel>

            {/* Smart Event Dashboard */}
            <DraggablePanel
              title="Event Dashboard"
              initialPosition={{ x: 900, y: 700 }}
              initialSize={{ width: 450, height: 400 }}
            >
              <SmartEventDashboard
                eventDetails={eventDetails}
                currentMood={currentMood}
                recognizedFaces={[...awsFaces, ...serverFaces]}
                isPlaying={isPlaying}
                currentTrack={currentTrack}
              />
            </DraggablePanel>

            {/* Event Details Manager */}
            <DraggablePanel
              title="Event Details"
              initialPosition={{ x: 1400, y: 700 }}
              initialSize={{ width: 350, height: 300 }}
            >
              <EventDetailsManager
                eventDetails={eventDetails}
                onUpdateDetails={setEventDetails}
              />
            </DraggablePanel>

            {/* Mood Playlist Manager */}
            <DraggablePanel
              title="Mood Playlists"
              initialPosition={{ x: 50, y: 1100 }}
              initialSize={{ width: 400, height: 350 }}
            >
              <MoodPlaylistManager
                currentMood={currentMood}
                onPlaylistSelect={(tracks) => {
                  if (tracks.length > 0) {
                    setCurrentTrack(tracks[0]);
                    playTrack(tracks[0]);
                    setIsPlaying(true);
                  }
                }}
              />
            </DraggablePanel>

            {/* Whoosh Mood Browser */}
            <DraggablePanel
              title="Whoosh Music"
              initialPosition={{ x: 500, y: 1100 }}
              initialSize={{ width: 400, height: 350 }}
            >
              <WhooshMoodBrowser
                currentMood={currentMood}
                onTrackSelect={(track) => {
                  setCurrentTrack(track);
                  playTrack(track);
                  setIsPlaying(true);
                }}
              />
            </DraggablePanel>

            {/* Face Recognition System */}
            <DraggablePanel
              title="Face Recognition"
              initialPosition={{ x: 950, y: 1100 }}
              initialSize={{ width: 350, height: 300 }}
            >
              <FaceRecognitionSystem
                videoRef={videoRef}
                vipGuests={vipGuests}
                onFaceRecognized={(face) => {
                  logEvent('vip_recognized', { name: face.name });
                }}
              />
            </DraggablePanel>

            {/* AWS Face Recognition */}
            <DraggablePanel
              title="AWS Face Recognition"
              initialPosition={{ x: 1350, y: 1100 }}
              initialSize={{ width: 350, height: 300 }}
            >
              <AWSFaceRecognitionPanel
                videoRef={videoRef}
                recognizedFaces={awsFaces}
                onAnalyzeFrame={analyzeAWSFrame}
                isAnalyzing={isAWSAnalyzing}
              />
            </DraggablePanel>

            {/* Server-Side AWS Panel */}
            <DraggablePanel
              title="Server AWS Recognition"
              initialPosition={{ x: 50, y: 1500 }}
              initialSize={{ width: 350, height: 300 }}
            >
              <ServerSideAWSPanel
                videoRef={videoRef}
                recognizedFaces={serverFaces}
                onAnalyzeFrame={analyzeServerFrame}
                isAnalyzing={isServerAnalyzing}
              />
            </DraggablePanel>

            {/* OpenAI Event Host */}
            <DraggablePanel
              title="OpenAI Event Host"
              initialPosition={{ x: 450, y: 1500 }}
              initialSize={{ width: 400, height: 350 }}
            >
              <OpenAIEventHostPanel
                videoRef={videoRef}
                isActive={isOpenAIActive}
                onStart={startOpenAI}
                onStop={stopOpenAI}
                lastDecision={lastDecision}
                recognizedVIPs={recognizedVIPs}
                vipGuests={vipGuests}
                eventDetails={eventDetails}
                aiPersonality={aiPersonality}
              />
            </DraggablePanel>

            {/* Continuous AI Agent */}
            <DraggablePanel
              title="Continuous AI Agent"
              initialPosition={{ x: 900, y: 1500 }}
              initialSize={{ width: 400, height: 350 }}
            >
              <ContinuousAIAgentPanel
                isActive={isAgentActive}
                onStart={startAgent}
                onStop={stopAgent}
                agentState={agentState}
                agentDecisions={agentDecisions}
                eventDetails={eventDetails}
                vipGuests={vipGuests}
              />
            </DraggablePanel>
          </>
        )}
      </div>
    </div>
  );
}

export default App;