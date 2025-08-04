import React, { useState, useRef, useEffect } from 'react';
import { Music, Settings, Play, Pause, SkipForward, Volume2, Mic, Camera, Users, Calendar, Zap } from 'lucide-react';
import { useTrackLibrary } from './hooks/useTrackLibrary';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useMusicPlayer } from './hooks/useMusicPlayer';
import { useSmartEventDJ } from './hooks/useSmartEventDJ';
import { useSmartEventEmcee } from './hooks/useSmartEventEmcee';
import { useServerSideAWSFaceRecognition } from './hooks/useServerSideAWSFaceRecognition';
import { useContinuousAIAgent } from './hooks/useContinuousAIAgent';
import { useOpenAIEventHost } from './hooks/useOpenAIEventHost';
import { useWandbIntegration } from './hooks/useWandbIntegration';
import TrackList from './components/TrackList';
import NowPlaying from './components/NowPlaying';
import DJInterface from './components/DJInterface';
import AIDJPanel from './components/AIDJPanel';
import AudioVisualizer from './components/AudioVisualizer';
import DynamicBackground from './components/DynamicBackground';
import FloatingControls from './components/FloatingControls';
import SmartEventDashboard from './components/SmartEventDashboard';
import EventSetupWizard from './components/EventSetupWizard';
import ServerSideAWSPanel from './components/ServerSideAWSPanel';
import ContinuousAIAgentPanel from './components/ContinuousAIAgentPanel';
import OpenAIEventHostPanel from './components/OpenAIEventHostPanel';
import FullscreenVideoBackground from './components/FullscreenVideoBackground';
import { EventSetup, VIPPerson } from './components/EventSetupWizard';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [eventSetup, setEventSetup] = useState<EventSetup | null>(null);
  const [isEventActive, setIsEventActive] = useState(false);
  const [eventId] = useState(() => `event_${Date.now()}`);
  const videoElement = useRef<HTMLVideoElement>(null);

  // Track library and audio player
  const { tracks: trackLibrary, loadTrack, currentTrack } = useTrackLibrary();
  const { isPlaying, togglePlayPause, volume, setVolume } = useAudioPlayer();
  const musicPlayer = useMusicPlayer(trackLibrary, loadTrack);

  // Default event setup for when no event is configured
  const defaultSetup: EventSetup = {
    eventName: 'DJ Session',
    eventType: 'party',
    duration: 120,
    vipPeople: [],
    specialMoments: [],
    musicPreferences: {
      genres: ['electronic', 'house', 'techno'],
      energy: 'high',
      explicitContent: false
    },
    hostPersonality: 'energetic'
  };

  // Smart Event DJ
  const smartDJ = useSmartEventDJ({
    tracks: trackLibrary,
    eventSetup: eventSetup || defaultSetup,
    onTrackChange: loadTrack,
    isPlaying,
    currentTrack
  });

  // Smart Event Emcee
  const smartEmcee = useSmartEventEmcee({
    tracks: trackLibrary,
    videoElement,
    eventSetup: eventSetup || defaultSetup,
    onTrackChange: loadTrack,
    onAnnouncement: triggerAnnouncement,
    isPlaying,
    currentTrack
  });

  // Server-side AWS Face Recognition
  const awsFaceRecognition = useServerSideAWSFaceRecognition({
    videoElement,
    vipPeople: eventSetup?.vipPeople || [],
    eventId,
    enabled: (isEventActive && eventSetup !== null) || (eventSetup !== null && eventSetup.vipPeople.length > 0),
    onVIPRecognized: handleVIPRecognized
  });

  // Continuous AI Agent
  const continuousAI = useContinuousAIAgent({
    videoElement,
    eventSetup: eventSetup || defaultSetup,
    onAnnouncement: triggerAnnouncement,
    enabled: true
  });

  // OpenAI Event Host
  const openAIHost = useOpenAIEventHost({
    eventSetup: eventSetup || defaultSetup,
    currentTrack,
    isPlaying,
    onAnnouncement: triggerAnnouncement,
    enabled: isEventActive
  });

  // W&B Integration
  const wandbIntegration = useWandbIntegration({
    eventId,
    eventSetup: eventSetup || defaultSetup,
    enabled: isEventActive
  });

  function triggerAnnouncement(message: string, priority: 'immediate' | 'high' | 'medium' | 'low' = 'medium') {
    console.log(`🎤 Announcement (${priority}): ${message}`);
    
    // Use Web Speech API for text-to-speech
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      
      // Choose voice based on personality
      const voices = speechSynthesis.getVoices();
      const personality = eventSetup?.hostPersonality || 'energetic';
      
      if (personality === 'professional') {
        const professionalVoice = voices.find(v => v.name.includes('Microsoft David') || v.name.includes('Google UK English Male'));
        if (professionalVoice) utterance.voice = professionalVoice;
      } else if (personality === 'energetic') {
        const energeticVoice = voices.find(v => v.name.includes('Microsoft Zira') || v.name.includes('Google US English Female'));
        if (energeticVoice) utterance.voice = energeticVoice;
      }
      
      speechSynthesis.speak(utterance);
    }
  }

  function handleVIPRecognized(vip: VIPPerson) {
    console.log(`🎯 🎉 VIP RECOGNIZED: ${vip.name} (${vip.role})`);
    
    const greetings = {
      'CEO': `Welcome, ${vip.name}! The CEO has arrived - let's make this event extraordinary!`,
      'Manager': `Great to see you, ${vip.name}! Our manager is here to keep the energy high!`,
      'VIP Guest': `Ladies and gentlemen, please welcome our special VIP guest, ${vip.name}!`,
      'Speaker': `Everyone, let's give a warm welcome to our speaker, ${vip.name}!`,
      'Performer': `The stage is set! Please welcome our talented performer, ${vip.name}!`,
      'Sponsor': `We're honored to have our sponsor, ${vip.name}, join us tonight!`,
      'Other': `Please join me in welcoming the amazing ${vip.name}!`
    };

    const greeting = greetings[vip.role as keyof typeof greetings] || greetings['Other'];
    triggerAnnouncement(greeting, 'immediate');
  }

  function handleEventSetupComplete(setup: EventSetup) {
    console.log('🎉 Event setup completed:', setup);
    setEventSetup(setup);
    
    // Auto-start event if VIP people are configured
    if (setup.vipPeople.length > 0) {
      setIsEventActive(true);
      triggerAnnouncement(`Welcome to ${setup.eventName}! Let's get this ${setup.eventType} started!`, 'immediate');
    }
  }

  function handleStartEvent() {
    if (eventSetup) {
      setIsEventActive(true);
      triggerAnnouncement(`Welcome to ${eventSetup.eventName}! Let's get this ${eventSetup.eventType} started!`, 'immediate');
    }
  }

  function handleStopEvent() {
    setIsEventActive(false);
    triggerAnnouncement('Thank you for joining us! The event has concluded.', 'immediate');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      {/* Dynamic Background */}
      <DynamicBackground currentTrack={currentTrack} isPlaying={isPlaying} />
      
      {/* Fullscreen Video Background */}
      <FullscreenVideoBackground ref={videoElement} />
      
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between p-6 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              DJ Tillu
            </h1>
            <p className="text-sm text-gray-300">
              {eventSetup ? `${eventSetup.eventName} • ${eventSetup.eventType}` : 'Smart AI Event Host'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {isEventActive && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-300">LIVE</span>
            </div>
          )}
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 p-6 space-y-6">
        {/* Settings Panel */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Event Configuration</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <EventSetupWizard
                onComplete={handleEventSetupComplete}
                initialSetup={eventSetup}
              />
            </div>
          </div>
        )}

        {/* Control Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Track Library */}
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center space-x-2 mb-4">
              <Music className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold">Track Library</h3>
            </div>
            <TrackList
              tracks={trackLibrary}
              currentTrack={currentTrack}
              onTrackSelect={loadTrack}
              isPlaying={isPlaying}
            />
          </div>

          {/* AI Video Agent */}
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <ContinuousAIAgentPanel
              analysis={continuousAI.currentAnalysis}
              isEnabled={continuousAI.isEnabled}
              onToggle={continuousAI.toggleEnabled}
              stats={continuousAI.stats}
            />
          </div>

          {/* Face Recognition */}
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center space-x-2 mb-4">
              <Camera className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold">Face Recognition</h3>
            </div>
            
            <ServerSideAWSPanel
              vipPeople={eventSetup?.vipPeople || []}
              recognitionResults={awsFaceRecognition.recognitionResults}
              isEnabled={awsFaceRecognition.isEnabled}
              onToggle={awsFaceRecognition.toggleEnabled}
              status={awsFaceRecognition.status}
            />
          </div>
        </div>

        {/* Event Dashboard */}
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <SmartEventDashboard
            eventSetup={eventSetup}
            isEventActive={isEventActive}
            onStartEvent={handleStartEvent}
            onStopEvent={handleStopEvent}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            stats={{
              totalTracks: trackLibrary.length,
              playTime: 0,
              vipRecognitions: awsFaceRecognition.recognitionResults.length,
              aiInteractions: continuousAI.stats.totalInteractions
            }}
          />
        </div>

        {/* Now Playing & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <NowPlaying
              track={currentTrack}
              isPlaying={isPlaying}
              onTogglePlay={togglePlayPause}
              volume={volume}
              onVolumeChange={setVolume}
            />
          </div>

          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <AudioVisualizer isPlaying={isPlaying} />
          </div>
        </div>
      </div>

      {/* Floating Controls */}
      <FloatingControls
        isPlaying={isPlaying}
        onTogglePlay={togglePlayPause}
        onNext={musicPlayer.nextTrack}
        onPrevious={musicPlayer.previousTrack}
        volume={volume}
        onVolumeChange={setVolume}
      />
    </div>
  );
}

export default App;