import React, { useState, useEffect } from 'react';
import { DraggablePanel } from './components/DraggablePanel';
import { FloatingControls } from './components/FloatingControls';
import { NowPlaying } from './components/NowPlaying';
import { TrackList } from './components/TrackList';
import { DJInterface } from './components/DJInterface';
import { AIDJPanel } from './components/AIDJPanel';
import { MoodDisplay } from './components/MoodDisplay';
import { GeminiMoodDisplay } from './components/GeminiMoodDisplay';
import { DynamicBackground } from './components/DynamicBackground';
import { FullscreenVideoBackground } from './components/FullscreenVideoBackground';
import { VideoAnalyzer } from './components/VideoAnalyzer';
import { SmartEventDashboard } from './components/SmartEventDashboard';
import { ContinuousAIAgentPanel } from './components/ContinuousAIAgentPanel';
import { VoiceAnnouncements } from './components/VoiceAnnouncements';
import { ServerSideAWSPanel } from './components/ServerSideAWSPanel';
import { OpenAIEventHostPanel } from './components/OpenAIEventHostPanel';
import { AudioVisualizer } from './components/AudioVisualizer';
import { useMusicPlayer } from './hooks/useMusicPlayer';
import { useSmartEventDJ } from './hooks/useSmartEventDJ';
import { useContinuousAIAgent } from './hooks/useContinuousAIAgent';
import { useOpenAIEventHost } from './hooks/useOpenAIEventHost';

function App() {
  const [isAllSystemsActive, setIsAllSystemsActive] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const { 
    tracks, 
    currentTrackIndex, 
    playTrack, 
    nextTrack, 
    previousTrack,
    togglePlayPause 
  } = useMusicPlayer();
  
  const { 
    eventData, 
    isEventActive, 
    startEvent, 
    updateEventStatus 
  } = useSmartEventDJ();
  
  const { 
    isAgentActive, 
    startAgent, 
    agentStatus 
  } = useContinuousAIAgent();
  
  const { 
    isHostActive, 
    startHost, 
    hostStatus 
  } = useOpenAIEventHost();

  const handleStartAll = () => {
    setIsAllSystemsActive(true);
    
    // Start all systems
    startEvent();
    startAgent();
    startHost();
    
    // Start music if tracks available
    if (tracks.length > 0 && !isPlaying) {
      playTrack(0);
      setIsPlaying(true);
    }
    
    // Update current track
    if (tracks.length > 0) {
      setCurrentTrack(tracks[currentTrackIndex]);
    }
  };

  const handleStopAll = () => {
    setIsAllSystemsActive(false);
    setIsPlaying(false);
    // Stop all systems
    updateEventStatus('stopped');
  };

  useEffect(() => {
    if (tracks.length > 0) {
      setCurrentTrack(tracks[currentTrackIndex]);
    }
  }, [currentTrackIndex, tracks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Dynamic Background */}
      <DynamicBackground />
      
      {/* Fullscreen Video Background */}
      <FullscreenVideoBackground />
      
      {/* Audio Visualizer */}
      <AudioVisualizer 
        isPlaying={isPlaying}
        currentTrack={currentTrack}
      />
      
      {/* Main Content Grid */}
      <div className="relative z-10 p-4 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-screen">
        
        {/* Music Library Panel */}
        <DraggablePanel
          title="Music Library"
          initialPosition={{ x: 20, y: 120 }}
          color="purple"
        >
          <TrackList 
            tracks={tracks}
            currentTrackIndex={currentTrackIndex}
            onTrackSelect={playTrack}
            isPlaying={isPlaying}
          />
        </DraggablePanel>

        {/* Event Dashboard Panel */}
        <DraggablePanel
          title="Event Dashboard"
          initialPosition={{ x: 420, y: 120 }}
          color="blue"
        >
          <SmartEventDashboard 
            eventData={eventData}
            isEventActive={isAllSystemsActive}
            onStartEvent={handleStartAll}
          />
        </DraggablePanel>

        {/* AI Video Agent Panel */}
        <DraggablePanel
          title="AI Video Agent"
          initialPosition={{ x: 820, y: 120 }}
          color="green"
        >
          <ContinuousAIAgentPanel 
            isActive={isAllSystemsActive}
            agentStatus={agentStatus}
            eventData={eventData}
          />
        </DraggablePanel>

        {/* Face Recognition Panel */}
        <DraggablePanel
          title="Face Recognition"
          initialPosition={{ x: 1220, y: 120 }}
          color="yellow"
        >
          <ServerSideAWSPanel />
        </DraggablePanel>

        {/* Voice System Panel */}
        <DraggablePanel
          title="Voice System"
          initialPosition={{ x: 20, y: 520 }}
          color="pink"
        >
          <VoiceAnnouncements 
            isActive={isAllSystemsActive}
            currentTrack={currentTrack}
            eventData={eventData}
          />
        </DraggablePanel>

        {/* AI Host Panel */}
        <DraggablePanel
          title="AI Event Host"
          initialPosition={{ x: 420, y: 520 }}
          color="indigo"
        >
          <OpenAIEventHostPanel 
            isActive={isAllSystemsActive}
            hostStatus={hostStatus}
            eventData={eventData}
            currentTrack={currentTrack}
          />
        </DraggablePanel>

        {/* Video Analyzer Panel */}
        <DraggablePanel
          title="Video Analysis"
          initialPosition={{ x: 820, y: 520 }}
          color="teal"
        >
          <VideoAnalyzer />
        </DraggablePanel>

        {/* Mood Display Panel */}
        <DraggablePanel
          title="Mood Analysis"
          initialPosition={{ x: 1220, y: 520 }}
          color="orange"
        >
          <GeminiMoodDisplay />
        </DraggablePanel>

      </div>

      {/* Floating Controls - Main Start Button */}
      <FloatingControls
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isAllSystemsActive={isAllSystemsActive}
        onTogglePlayPause={togglePlayPause}
        onNext={nextTrack}
        onPrevious={previousTrack}
        onStartAll={handleStartAll}
        onStopAll={handleStopAll}
      />

      {/* Now Playing Display */}
      {currentTrack && (
        <NowPlaying 
          track={currentTrack}
          isPlaying={isPlaying}
        />
      )}

    </div>
  );
}

export default App;