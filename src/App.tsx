import React, { useState, useEffect, useRef } from 'react';
import { FullscreenVideoBackground } from './components/FullscreenVideoBackground';
import { DraggablePanel } from './components/DraggablePanel';
import { NowPlaying } from './components/NowPlaying';
import { TrackList } from './components/TrackList';
import { GeminiMoodDisplay } from './components/GeminiMoodDisplay';
import { AIDJPanel } from './components/AIDJPanel';
import { VoiceAnnouncements } from './components/VoiceAnnouncements';
import { AudioVisualizer } from './components/AudioVisualizer';
import { AudiusBrowser } from './components/AudiusBrowser';
import { SupabaseTrackManager } from './components/SupabaseTrackManager';
import { ContinuousAIAgentPanel } from './components/ContinuousAIAgentPanel';
import { ServerSideAWSPanel } from './components/ServerSideAWSPanel';
import { FloatingControls } from './components/FloatingControls';
import { EventSetupWizard, EventDetails } from './components/EventSetupWizard';
import { DynamicBackground } from './components/DynamicBackground';

import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useTrackLibrary } from './hooks/useTrackLibrary';
import { useGeminiMoodAnalysis } from './hooks/useGeminiMoodAnalysis';
import { useAIMoodDJ } from './hooks/useAIMoodDJ';
import { useContinuousAIAgent } from './hooks/useContinuousAIAgent';
import { useServerSideAWSFaceRecognition } from './hooks/useServerSideAWSFaceRecognition';
import { useWandbIntegration } from './hooks/useWandbIntegration';

import { Track } from './data/tracks';

function App() {
  // Core state
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showEventSetup, setShowEventSetup] = useState(true);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);

  // Audio player
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

  // Track library
  const { tracks, isLoading: tracksLoading, addTrack } = useTrackLibrary();

  // Mood analysis with Gemini Vision
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
  } = useGeminiMoodAnalysis(videoElement, eventDetails?.enableVideoAnalysis || false);

  // Define event handlers before using them in hooks
  const handleAnnouncement = (message: string) => {
    console.log('🎤 Announcement triggered:', message);
    
    // Duck audio during announcement
    duckAudio();
    
    // Dispatch global announcement event
    window.dispatchEvent(new CustomEvent('immediateAnnouncement', {
      detail: { message }
    }));
    
    // Restore audio after announcement (estimated 3 seconds per 10 words)
    const estimatedDuration = Math.max(3000, (message.split(' ').length / 10) * 3000);
    setTimeout(() => {
      unduckAudio();
    }, estimatedDuration);
  };

  const handleTrackChange = (track: Track) => {
    console.log('🎵 Track change requested:', track.title);
    loadTrack(track);
  };

  const handleVIPRecognized = (person: any) => {
    console.log('🌟 VIP recognized:', person.name);
    
    // Dispatch VIP recognition event
    window.dispatchEvent(new CustomEvent('personAnnouncement', {
      detail: { 
        personName: person.name,
        message: person.greeting || `Welcome ${person.name}! Great to see you here!`
      }
    }));
  };

  // AI DJ system
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
    onTrackChange: handleTrackChange,
    onAnnouncement: handleAnnouncement,
    isPlaying,
    currentTrack
  });

  // Continuous AI Agent
  const eventContext = eventDetails ? {
    eventName: eventDetails.name,
    eventType: eventDetails.type as any,
    duration: eventDetails.duration,
    aiPersonality: eventDetails.aiPersonality as any,
    vipPeople: eventDetails.vipPeople.map(vip => ({
      ...vip,
      recognitionCount: 0
    })),
    startTime: new Date()
  } : null;

  const {
    isActive: isAIAgentActive,
    startAgent,
    stopAgent,
    isAnalyzing: isAIAnalyzing,
    lastResponse: aiLastResponse,
    responseHistory: aiResponseHistory,
    agentStatus,
    error: aiError,
    forceAnalysis,
    conversationHistory
  } = useContinuousAIAgent({
    videoElement,
    eventContext: eventContext!,
    tracks,
    currentTrack,
    isPlaying,
    onAnnouncement: handleAnnouncement,
    onTrackChange: handleTrackChange,
    enabled: eventDetails?.enableVideoAnalysis || false
  });

  // Server-side AWS Face Recognition
  const {
    isInitialized: awsInitialized,
    isAnalyzing: awsAnalyzing,
    recognizedPeople: awsRecognizedPeople,
    lastAnalysis: awsLastAnalysis,
    error: awsError,
    crowdAnalysis: awsCrowdAnalysis
  } = useServerSideAWSFaceRecognition({
    videoElement,
    vipPeople: eventDetails?.vipPeople.map(vip => ({
      ...vip,
      recognitionCount: 0
    })) || [],
    eventId: eventDetails?.name.replace(/\s+/g, '-').toLowerCase() || 'default',
    enabled: eventDetails?.enableFaceRecognition || false,
    onVIPRecognized: handleVIPRecognized
  });

  // WandB Integration for analytics
  useWandbIntegration({
    mood,
    energy,
    crowdSize,
    confidence,
    currentTrack,
    isPlaying,
    isAIActive
  });

  // Handle video ready
  const handleVideoReady = (video: HTMLVideoElement | null) => {
    setVideoElement(video);
    console.log('📹 Video element ready:', !!video);
  };

  // Handle event setup completion
  const handleEventSetupComplete = (details: EventDetails) => {
    setEventDetails(details);
    setShowEventSetup(false);
    console.log('🎪 Event setup completed:', details.name);
  };

  // Handle session start
  const handleStartSession = () => {
    if (!hasStarted) {
      setHasStarted(true);
      console.log('🚀 DJ Tillu session started!');
      
      // Start first track if available
      if (tracks.length > 0 && !currentTrack) {
        loadTrack(tracks[0]);
      }
    }
  };

  // Handle track selection
  const handleTrackSelect = (track: Track) => {
    loadTrack(track);
    if (!isPlaying) {
      setTimeout(() => togglePlay(), 100);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Dynamic Background */}
      <DynamicBackground 
        mood={mood} 
        energy={energy} 
        isPlaying={isPlaying} 
      />

      {/* Fullscreen Video Background */}
      <FullscreenVideoBackground onVideoReady={handleVideoReady} />

      {/* Event Setup Wizard */}
      {showEventSetup && (
        <EventSetupWizard
          onComplete={handleEventSetupComplete}
          onSkip={() => setShowEventSetup(false)}
        />
      )}

      {/* Floating Controls */}
      <FloatingControls
        isPlaying={isPlaying}
        onPlayToggle={togglePlay}
        onSettingsToggle={() => setShowSettings(!showSettings)}
        onStartSession={handleStartSession}
        hasStarted={hasStarted}
      />

      {/* Main UI Panels */}
      {hasStarted && (
        <>
          {/* Now Playing Panel */}
          <DraggablePanel
            title="Now Playing"
            initialPosition={{ x: 20, y: 20 }}
            initialSize={{ width: 320, height: 400 }}
            accentColor="purple"
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

          {/* Track Library Panel */}
          <DraggablePanel
            title="Track Library"
            initialPosition={{ x: 360, y: 20 }}
            initialSize={{ width: 350, height: 500 }}
            accentColor="blue"
          >
            <TrackList
              tracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onTrackSelect={handleTrackSelect}
              onPlayToggle={togglePlay}
            />
          </DraggablePanel>

          {/* AI Mood Analysis Panel */}
          <DraggablePanel
            title="AI Mood Analysis"
            initialPosition={{ x: 730, y: 20 }}
            initialSize={{ width: 300, height: 350 }}
            accentColor="green"
          >
            <GeminiMoodDisplay
              mood={mood}
              energy={energy}
              crowdSize={crowdSize}
              confidence={confidence}
              isAnalyzing={isMoodAnalyzing}
              lastAnalysis={lastAnalysis}
              error={moodError}
              enabled={moodEnabled}
              onTriggerAnalysis={triggerAnalysis}
              onToggleEnabled={toggleMoodEnabled}
            />
          </DraggablePanel>

          {/* AI DJ Panel */}
          <DraggablePanel
            title="AI DJ Assistant"
            initialPosition={{ x: 1050, y: 20 }}
            initialSize={{ width: 280, height: 300 }}
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

          {/* Voice Announcements Panel */}
          <DraggablePanel
            title="Voice System"
            initialPosition={{ x: 20, y: 440 }}
            initialSize={{ width: 320, height: 400 }}
            accentColor="pink"
          >
            <VoiceAnnouncements
              mood={mood}
              energy={energy}
              crowdSize={crowdSize}
              currentTrack={currentTrack?.title || ''}
              onAnnouncementStart={duckAudio}
              onAnnouncementEnd={unduckAudio}
            />
          </DraggablePanel>

          {/* Audio Visualizer Panel */}
          <DraggablePanel
            title="Audio Visualizer"
            initialPosition={{ x: 360, y: 540 }}
            initialSize={{ width: 350, height: 300 }}
            accentColor="red"
          >
            <AudioVisualizer
              isPlaying={isPlaying}
              audioElement={null}
              mood={mood}
            />
          </DraggablePanel>

          {/* Settings Panels */}
          {showSettings && (
            <>
              {/* Audius Browser */}
              <DraggablePanel
                title="Audius Music Browser"
                initialPosition={{ x: 730, y: 390 }}
                initialSize={{ width: 350, height: 450 }}
                accentColor="blue"
              >
                <AudiusBrowser
                  onTrackSelect={handleTrackSelect}
                  onAddToLibrary={addTrack}
                  currentMood={mood}
                />
              </DraggablePanel>

              {/* Supabase Track Manager */}
              <DraggablePanel
                title="Supabase Track Manager"
                initialPosition={{ x: 1100, y: 340 }}
                initialSize={{ width: 350, height: 400 }}
                accentColor="green"
              >
                <SupabaseTrackManager
                  onTrackSelect={handleTrackSelect}
                  onAddToLibrary={addTrack}
                />
              </DraggablePanel>

              {/* Continuous AI Agent Panel */}
              {eventDetails?.enableVideoAnalysis && eventContext && (
                <DraggablePanel
                  title="AI Video Agent"
                  initialPosition={{ x: 1470, y: 20 }}
                  initialSize={{ width: 350, height: 500 }}
                  accentColor="blue"
                >
                  <ContinuousAIAgentPanel
                    isActive={isAIAgentActive}
                    onStartAgent={startAgent}
                    onStopAgent={stopAgent}
                    isAnalyzing={isAIAnalyzing}
                    lastResponse={aiLastResponse}
                    responseHistory={aiResponseHistory}
                    agentStatus={agentStatus}
                    error={aiError}
                    onForceAnalysis={forceAnalysis}
                    conversationHistory={conversationHistory}
                    eventContext={eventContext}
                  />
                </DraggablePanel>
              )}

              {/* Server-Side AWS Panel */}
              {eventDetails?.enableFaceRecognition && (
                <DraggablePanel
                  title="AWS Face Recognition"
                  initialPosition={{ x: 1470, y: 540 }}
                  initialSize={{ width: 350, height: 400 }}
                  accentColor="blue"
                >
                  <ServerSideAWSPanel
                    isInitialized={awsInitialized}
                    isAnalyzing={awsAnalyzing}
                    recognizedPeople={awsRecognizedPeople}
                    lastAnalysis={awsLastAnalysis}
                    error={awsError}
                    crowdAnalysis={awsCrowdAnalysis}
                    vipPeople={eventDetails?.vipPeople.map(vip => ({
                      ...vip,
                      recognitionCount: 0
                    })) || []}
                    enabled={eventDetails?.enableFaceRecognition || false}
                  />
                </DraggablePanel>
              )}
            </>
          )}
        </>
      )}

      {/* Loading Overlay */}
      {tracksLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">Loading Music Library</h3>
            <p className="text-gray-300">Fetching tracks from Audius...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;