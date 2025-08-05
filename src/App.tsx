import React, { useState, useEffect } from 'react';
import { EventSetupWizard } from './components/EventSetupWizard';
import { SmartEventDashboard } from './components/SmartEventDashboard';
import { DJInterface } from './components/DJInterface';
import { NowPlaying } from './components/NowPlaying';
import { TrackList } from './components/TrackList';
import { AIDJPanel } from './components/AIDJPanel';
import { MoodDisplay } from './components/MoodDisplay';
import { GeminiMoodDisplay } from './components/GeminiMoodDisplay';
import { VideoAnalyzer } from './components/VideoAnalyzer';
import { AudiusBrowser } from './components/AudiusBrowser';
import { FMABrowser } from './components/FMABrowser';
import { WhooshMoodBrowser } from './components/WhooshMoodBrowser';
import { AudioVisualizer } from './components/AudioVisualizer';
import { AudioDebugger } from './components/AudioDebugger';
import { VoiceAnnouncements } from './components/VoiceAnnouncements';
import { DynamicBackground } from './components/DynamicBackground';
import { FullscreenVideoBackground } from './components/FullscreenVideoBackground';
import { FloatingControls } from './components/FloatingControls';
import { DraggablePanel } from './components/DraggablePanel';
import { AWSFaceRecognitionPanel } from './components/AWSFaceRecognitionPanel';
import { ServerSideAWSPanel } from './components/ServerSideAWSPanel';
import { OpenAIEventHostPanel } from './components/OpenAIEventHostPanel';
import { ContinuousAIAgentPanel } from './components/ContinuousAIAgentPanel';
import { SupabaseTrackManager } from './components/SupabaseTrackManager';
import { SupabaseTrackUploader } from './components/SupabaseTrackUploader';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useTrackLibrary } from './hooks/useTrackLibrary';
import { useSmartEventDJ } from './hooks/useSmartEventDJ';
import { useAIMoodDJ } from './hooks/useAIMoodDJ';
import { useMoodAnalysis } from './hooks/useMoodAnalysis';
import { useGeminiMoodAnalysis } from './hooks/useGeminiMoodAnalysis';
import { useAWSFaceRecognition } from './hooks/useAWSFaceRecognition';
import { useServerSideAWSFaceRecognition } from './hooks/useServerSideAWSFaceRecognition';
import { useOpenAIEventHost } from './hooks/useOpenAIEventHost';
import { useContinuousAIAgent } from './hooks/useContinuousAIAgent';
import { useSmartEventEmcee } from './hooks/useSmartEventEmcee';
import { tracks } from './data/tracks';
import { moodPlaylists } from './data/moodPlaylists';

interface EventDetails {
  eventName: string;
  eventType: string;
  vipPhotos: Array<{ name: string; photo: string }>;
  eventDate: string;
  venue: string;
  expectedAttendees: number;
  musicPreferences: string[];
  specialRequests: string;
}

function App() {
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [showSetup, setShowSetup] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Define functions before using them in hooks
  const loadTrack = (track: any) => {
    console.log('Loading track:', track);
  };

  const triggerAnnouncement = (message: string, type: 'info' | 'warning' | 'celebration' = 'info') => {
    console.log(`Announcement (${type}):`, message);
  };

  const handleVIPRecognized = (vipName: string) => {
    triggerAnnouncement(`VIP ${vipName} has arrived! Welcome to the event!`, 'celebration');
  };

  const handleEventSetupComplete = (details: EventDetails) => {
    setEventDetails(details);
    setShowSetup(false);
    setSessionStarted(true);
    triggerAnnouncement(`Welcome to ${details.eventName}! Let's get this party started!`, 'celebration');
  };

  const handleSkipSetup = () => {
    setShowSetup(false);
    setSessionStarted(true);
    triggerAnnouncement('DJ session started! Ready to rock!', 'info');
  };

  const handleStartSession = () => {
    setSessionStarted(true);
    triggerAnnouncement('DJ Tillu is now live! Let the music play!', 'celebration');
  };

  // Audio and music hooks
  const { 
    currentTrack, 
    isPlaying, 
    volume, 
    currentTime, 
    duration,
    play, 
    pause, 
    stop, 
    setVolume, 
    seekTo 
  } = useAudioPlayer();

  const { 
    tracks: libraryTracks, 
    loading: tracksLoading, 
    searchTracks, 
    addTrack 
  } = useTrackLibrary();

  // AI and mood analysis hooks
  const { 
    currentMood, 
    moodHistory, 
    suggestedTracks: aiSuggestedTracks,
    isAnalyzing: aiAnalyzing 
  } = useAIMoodDJ();

  const { 
    mood: detectedMood, 
    confidence: moodConfidence, 
    isAnalyzing: moodAnalyzing 
  } = useMoodAnalysis();

  const { 
    mood: geminiMood, 
    confidence: geminiConfidence, 
    isAnalyzing: geminiAnalyzing,
    emotions: geminiEmotions 
  } = useGeminiMoodAnalysis();

  // Smart event and DJ hooks
  const { 
    isActive: smartDJActive, 
    currentPlaylist, 
    nextTrack: smartNextTrack 
  } = useSmartEventDJ(eventDetails || null);

  // Face recognition hooks
  const vipPeople = eventDetails?.vipPhotos?.map(vip => ({
    name: vip.name,
    imageUrl: vip.photo,
    id: vip.name.toLowerCase().replace(/\s+/g, '-')
  })) || [];

  const { 
    isEnabled: faceRecognitionEnabled, 
    recognizedFaces, 
    startRecognition: startFaceRecognition, 
    stopRecognition: stopFaceRecognition 
  } = useAWSFaceRecognition(vipPeople);

  const { 
    isEnabled: serverFaceRecognitionEnabled, 
    recognizedFaces: serverRecognizedFaces, 
    startRecognition: startServerFaceRecognition, 
    stopRecognition: stopServerFaceRecognition 
  } = useServerSideAWSFaceRecognition(vipPeople);

  // AI host and agent hooks
  const { 
    isActive: hostActive, 
    currentAnnouncement, 
    makeAnnouncement 
  } = useOpenAIEventHost(eventDetails || null);

  const { 
    isActive: agentActive, 
    currentAction, 
    insights 
  } = useContinuousAIAgent(eventDetails || null, triggerAnnouncement);

  const { 
    isActive: emceeActive, 
    currentScript, 
    generateIntroduction 
  } = useSmartEventEmcee(eventDetails || null);

  // Handle VIP recognition
  useEffect(() => {
    if (recognizedFaces.length > 0) {
      const latestFace = recognizedFaces[recognizedFaces.length - 1];
      handleVIPRecognized(latestFace.name);
    }
  }, [recognizedFaces]);

  useEffect(() => {
    if (serverRecognizedFaces.length > 0) {
      const latestFace = serverRecognizedFaces[serverRecognizedFaces.length - 1];
      handleVIPRecognized(latestFace.name);
    }
  }, [serverRecognizedFaces]);

  if (showSetup) {
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
      {/* Background */}
      <FullscreenVideoBackground />
      <DynamicBackground mood={geminiMood || detectedMood || 'neutral'} />
      
      {/* Main Interface */}
      <div className="relative z-10 p-4 space-y-4">
        {/* Event Dashboard */}
        {eventDetails && (
          <SmartEventDashboard 
            eventDetails={eventDetails}
            onStartSession={handleStartSession}
          />
        )}

        {/* Core DJ Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <DJInterface 
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              volume={volume}
              onPlay={play}
              onPause={pause}
              onStop={stop}
              onVolumeChange={setVolume}
            />
            
            <NowPlaying 
              track={currentTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onSeek={seekTo}
            />
          </div>

          <div className="space-y-4">
            <AudioVisualizer isPlaying={isPlaying} />
            <MoodDisplay 
              mood={detectedMood}
              confidence={moodConfidence}
              isAnalyzing={moodAnalyzing}
            />
            <GeminiMoodDisplay 
              mood={geminiMood}
              confidence={geminiConfidence}
              emotions={geminiEmotions}
              isAnalyzing={geminiAnalyzing}
            />
          </div>
        </div>

        {/* Track Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrackList 
            tracks={libraryTracks}
            onTrackSelect={loadTrack}
            currentTrack={currentTrack}
          />
          <AIDJPanel 
            currentMood={currentMood}
            suggestedTracks={aiSuggestedTracks}
            onTrackSelect={loadTrack}
            isAnalyzing={aiAnalyzing}
          />
        </div>

        {/* Music Browsers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AudiusBrowser onTrackSelect={loadTrack} />
          <FMABrowser onTrackSelect={loadTrack} />
          <WhooshMoodBrowser 
            currentMood={geminiMood || detectedMood || 'neutral'}
            onTrackSelect={loadTrack}
          />
        </div>

        {/* Supabase Track Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SupabaseTrackUploader />
          <SupabaseTrackManager onTrackSelect={loadTrack} />
        </div>
      </div>

      {/* Draggable Panels */}
      <DraggablePanel title="Video Analysis" initialPosition={{ x: 20, y: 100 }}>
        <VideoAnalyzer />
      </DraggablePanel>

      <DraggablePanel title="Voice Announcements" initialPosition={{ x: 20, y: 300 }}>
        <VoiceAnnouncements />
      </DraggablePanel>

      <DraggablePanel title="Audio Debugger" initialPosition={{ x: 20, y: 500 }}>
        <AudioDebugger 
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          volume={volume}
        />
      </DraggablePanel>

      {/* Face Recognition Panels */}
      {eventDetails && (
        <>
          <DraggablePanel title="AWS Face Recognition" initialPosition={{ x: 300, y: 100 }}>
            <AWSFaceRecognitionPanel 
              vipPeople={vipPeople}
              onVIPRecognized={handleVIPRecognized}
            />
          </DraggablePanel>

          <DraggablePanel title="Server-Side Face Recognition" initialPosition={{ x: 300, y: 300 }}>
            <ServerSideAWSPanel 
              vipPeople={vipPeople}
              onVIPRecognized={handleVIPRecognized}
            />
          </DraggablePanel>
        </>
      )}

      {/* AI Host and Agent Panels */}
      {eventDetails && (
        <>
          <DraggablePanel title="OpenAI Event Host" initialPosition={{ x: 600, y: 100 }}>
            <OpenAIEventHostPanel 
              eventDetails={eventDetails}
              onAnnouncement={triggerAnnouncement}
            />
          </DraggablePanel>

          <DraggablePanel title="Continuous AI Agent" initialPosition={{ x: 600, y: 300 }}>
            <ContinuousAIAgentPanel 
              eventDetails={eventDetails}
              onAction={triggerAnnouncement}
            />
          </DraggablePanel>
        </>
      )}

      {/* Floating Controls */}
      <FloatingControls 
        isPlaying={isPlaying}
        volume={volume}
        onPlay={play}
        onPause={pause}
        onVolumeChange={setVolume}
      />
    </div>
  );
}

export default App;