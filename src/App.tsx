import React, { useState, useEffect, useRef } from 'react';
import { Settings, Zap, Users, Music, Eye, Brain, Mic, Database, Globe, Calendar } from 'lucide-react';

// Components
import { FullscreenVideoBackground } from './components/FullscreenVideoBackground';
import { FloatingControls } from './components/FloatingControls';
import { DraggablePanel } from './components/DraggablePanel';
import { TrackList } from './components/TrackList';
import { NowPlaying } from './components/NowPlaying';
import { AudioVisualizer } from './components/AudioVisualizer';
import { GeminiMoodDisplay } from './components/GeminiMoodDisplay';
import { ContinuousAIAgentPanel } from './components/ContinuousAIAgentPanel';
import { ServerSideAWSPanel } from './components/ServerSideAWSPanel';
import { VoiceAnnouncements } from './components/VoiceAnnouncements';
import { SupabaseTrackManager } from './components/SupabaseTrackManager';
import { AudiusBrowser } from './components/AudiusBrowser';
import { SmartEventDashboard } from './components/SmartEventDashboard';
import { EventSetupWizard } from './components/EventSetupWizard';
import { DynamicBackground } from './components/DynamicBackground';

// Hooks
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useTrackLibrary } from './hooks/useTrackLibrary';
import { useGeminiMoodAnalysis } from './hooks/useGeminiMoodAnalysis';
import { useContinuousAIAgent } from './hooks/useContinuousAIAgent';
import { useServerSideAWSFaceRecognition } from './hooks/useServerSideAWSFaceRecognition';
import { useSmartEventDJ } from './hooks/useSmartEventDJ';
import { useWandbIntegration } from './hooks/useWandbIntegration';

interface VIPPerson {
  id: string;
  name: string;
  role: string;
  imageFile?: File;
  imageUrl?: string;
  greeting?: string;
  recognitionCount: number;
  lastSeen?: Date;
}

interface EventSetup {
  eventName: string;
  eventType: 'birthday' | 'corporate' | 'wedding' | 'party' | 'conference';
  duration: number;
  vipPeople: VIPPerson[];
  aiPersonality: 'humorous' | 'formal' | 'energetic' | 'professional';
  specialMoments: string[];
}

const App: React.FC = () => {
  // Core state
  const [hasSessionStarted, setHasSessionStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [eventSetup, setEventSetup] = useState<EventSetup | null>(null);
  const [showEventSetup, setShowEventSetup] = useState(true);
  const [crowdSize, setCrowdSize] = useState(0);

  // Audio and tracks
  const audioPlayer = useAudioPlayer();
  const trackLibrary = useTrackLibrary();

  // AI systems
  const geminiMood = useGeminiMoodAnalysis(videoElement, hasSessionStarted);
  
  // Continuous AI Agent (ChatGPT-like video interaction)
  const continuousAI = useContinuousAIAgent({
    videoElement,
    eventContext: eventSetup ? {
      eventName: eventSetup.eventName,
      eventType: eventSetup.eventType,
      duration: eventSetup.duration,
      aiPersonality: eventSetup.aiPersonality,
      vipPeople: eventSetup.vipPeople,
      startTime: new Date()
    } : null,
    tracks: trackLibrary.tracks,
    currentTrack: audioPlayer.currentTrack,
    isPlaying: audioPlayer.isPlaying,
    onAnnouncement: handleAnnouncement,
    onTrackChange: handleTrackChange,
    enabled: hasSessionStarted && !!eventSetup
  });

  // Server-side AWS Face Recognition
  const awsFaceRecognition = useServerSideAWSFaceRecognition({
    videoElement,
    vipPeople: eventSetup?.vipPeople || [],
    eventId: eventSetup?.eventName.replace(/\s+/g, '-').toLowerCase() || 'default',
    enabled: hasSessionStarted && !!eventSetup,
    onVIPRecognized: handleVIPRecognized
  });

  // Smart Event DJ
  const smartEventDJ = useSmartEventDJ({
    tracks: trackLibrary.tracks,
    currentMood: geminiMood.mood,
    energy: geminiMood.energy,
    crowdSize: geminiMood.crowdSize,
    onTrackChange: handleTrackChange,
    onAnnouncement: handleAnnouncement,
    isPlaying: audioPlayer.isPlaying,
    currentTrack: audioPlayer.currentTrack
  });

  // Wandb integration for analytics
  useWandbIntegration({
    mood: geminiMood.mood,
    energy: geminiMood.energy,
    crowdSize: geminiMood.crowdSize,
    confidence: geminiMood.confidence,
    currentTrack: audioPlayer.currentTrack,
    isPlaying: audioPlayer.isPlaying,
    isAIActive: continuousAI.isActive
  });

  // Update crowd size from Gemini analysis
  useEffect(() => {
    setCrowdSize(geminiMood.crowdSize);
  }, [geminiMood.crowdSize]);

  // Auto-start first track when session begins
  useEffect(() => {
    if (hasSessionStarted && trackLibrary.tracks.length > 0 && !audioPlayer.currentTrack) {
      const firstTrack = trackLibrary.tracks[0];
      audioPlayer.loadTrack(firstTrack);
      console.log('🎵 Auto-loaded first track:', firstTrack.title);
    }
  }, [hasSessionStarted, trackLibrary.tracks, audioPlayer.currentTrack]);

  // Initialize event when setup is complete
  useEffect(() => {
    if (eventSetup) {
      smartEventDJ.initializeEvent({
        id: eventSetup.eventName.replace(/\s+/g, '-').toLowerCase(),
        name: eventSetup.eventName,
        type: eventSetup.eventType as any,
        startTime: '09:00',
        endTime: '17:00',
        expectedAttendees: 50,
        venue: 'Office',
        specialMoments: [],
        vipGuests: eventSetup.vipPeople.map(vip => ({
          ...vip,
          faceImageUrl: vip.imageUrl,
          personalizedGreeting: vip.greeting
        })),
        musicPreferences: ['Electronic', 'Ambient'],
        eventFlow: []
      });
    }
  }, [eventSetup]);

  const handleStartSession = () => {
    setHasSessionStarted(true);
    setShowEventSetup(false);
    
    // Start AI systems if event is configured
    if (eventSetup) {
      smartEventDJ.startEvent();
      continuousAI.startAgent();
    }
    
    // Welcome announcement
    const welcomeMessage = eventSetup 
      ? `Welcome to ${eventSetup.eventName}! DJ Tillu is now live and ready to make this event amazing!`
      : "DJ Tillu is now live! Let's get this party started!";
    
    setTimeout(() => {
      handleAnnouncement(welcomeMessage);
    }, 2000);
    
    console.log('🎪 DJ Tillu session started!');
  };

  const handleTrackChange = (track: any) => {
    audioPlayer.loadTrack(track);
    console.log('🎵 Track changed to:', track.title);
  };

  const handleAnnouncement = (message: string) => {
    // Trigger immediate announcement
    window.dispatchEvent(new CustomEvent('immediateAnnouncement', {
      detail: { message }
    }));
    
    // Duck audio during announcement
    audioPlayer.duckAudio();
    
    // Unduck after 5 seconds
    setTimeout(() => {
      audioPlayer.unduckAudio();
    }, 5000);
    
    console.log('🎤 Announcement triggered:', message);
  };

  const handleVIPRecognized = (vip: VIPPerson) => {
    console.log('🌟 VIP recognized:', vip.name);
    
    // Let the smart event DJ handle VIP announcements
    smartEventDJ.handleVIPRecognized(vip);
  };

  const handleEventSetupComplete = (setup: EventSetup) => {
    setEventSetup(setup);
    setShowEventSetup(false);
    console.log('✅ Event setup complete:', setup.eventName);
  };

  const handleSkipSetup = () => {
    setShowEventSetup(false);
    console.log('⏭️ Event setup skipped - basic DJ mode');
  };

  // Show event setup wizard first
  if (showEventSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center p-4">
        <EventSetupWizard
          onSetupComplete={handleEventSetupComplete}
          onSkipSetup={handleSkipSetup}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Dynamic Background */}
      <DynamicBackground 
        mood={geminiMood.mood} 
        energy={geminiMood.energy} 
        isPlaying={audioPlayer.isPlaying} 
      />

      {/* Fullscreen Video Background */}
      <FullscreenVideoBackground onVideoReady={setVideoElement} />

      {/* Floating Controls */}
      <FloatingControls
        isPlaying={audioPlayer.isPlaying}
        onPlayToggle={audioPlayer.togglePlay}
        onSettingsToggle={() => setShowSettings(!showSettings)}
        onStartSession={handleStartSession}
        hasStarted={hasSessionStarted}
      />

      {/* Settings Panels */}
      {showSettings && (
        <>
          {/* Track Library */}
          <DraggablePanel
            title="Music Library"
            initialPosition={{ x: 20, y: 100 }}
            initialSize={{ width: 350, height: 500 }}
            accentColor="purple"
          >
            <TrackList
              tracks={trackLibrary.tracks}
              currentTrack={audioPlayer.currentTrack}
              isPlaying={audioPlayer.isPlaying}
              onTrackSelect={handleTrackChange}
              onPlayToggle={audioPlayer.togglePlay}
            />
          </DraggablePanel>

          {/* Now Playing */}
          <DraggablePanel
            title="Now Playing"
            initialPosition={{ x: 390, y: 100 }}
            initialSize={{ width: 320, height: 400 }}
            accentColor="pink"
          >
            <NowPlaying
              currentTrack={audioPlayer.currentTrack}
              isPlaying={audioPlayer.isPlaying}
              currentTime={audioPlayer.currentTime}
              duration={audioPlayer.duration}
              volume={audioPlayer.volume}
              isLoading={audioPlayer.isLoading}
              error={audioPlayer.error}
              onPlayToggle={audioPlayer.togglePlay}
              onSeek={audioPlayer.seek}
              onVolumeChange={audioPlayer.setVolume}
            />
          </DraggablePanel>

          {/* Audio Visualizer */}
          <DraggablePanel
            title="Audio Visualizer"
            initialPosition={{ x: 730, y: 100 }}
            initialSize={{ width: 300, height: 350 }}
            accentColor="green"
          >
            <AudioVisualizer
              isPlaying={audioPlayer.isPlaying}
              audioElement={audioPlayer.audioElement}
              mood={geminiMood.mood}
            />
          </DraggablePanel>

          {/* Gemini Mood Analysis */}
          <DraggablePanel
            title="AI Vision Analysis"
            initialPosition={{ x: 1050, y: 100 }}
            initialSize={{ width: 320, height: 400 }}
            accentColor="blue"
          >
            <GeminiMoodDisplay
              mood={geminiMood.mood}
              energy={geminiMood.energy}
              crowdSize={geminiMood.crowdSize}
              confidence={geminiMood.confidence}
              isAnalyzing={geminiMood.isAnalyzing}
              lastAnalysis={geminiMood.lastAnalysis}
              error={geminiMood.error}
              enabled={geminiMood.enabled}
              onTriggerAnalysis={geminiMood.triggerAnalysis}
              onToggleEnabled={geminiMood.toggleEnabled}
            />
          </DraggablePanel>

          {/* Continuous AI Agent */}
          {eventSetup && (
            <DraggablePanel
              title="AI Video Agent"
              initialPosition={{ x: 20, y: 520 }}
              initialSize={{ width: 350, height: 450 }}
              accentColor="yellow"
            >
              <ContinuousAIAgentPanel
                isActive={continuousAI.isActive}
                onStartAgent={continuousAI.startAgent}
                onStopAgent={continuousAI.stopAgent}
                isAnalyzing={continuousAI.isAnalyzing}
                lastResponse={continuousAI.lastResponse}
                responseHistory={continuousAI.responseHistory}
                agentStatus={continuousAI.agentStatus}
                error={continuousAI.error}
                onForceAnalysis={continuousAI.forceAnalysis}
                conversationHistory={continuousAI.conversationHistory}
                eventContext={eventSetup}
              />
            </DraggablePanel>
          )}

          {/* Server-Side AWS Face Recognition */}
          {eventSetup && (
            <DraggablePanel
              title="Face Recognition"
              initialPosition={{ x: 390, y: 520 }}
              initialSize={{ width: 350, height: 450 }}
              accentColor="red"
            >
              <ServerSideAWSPanel
                isInitialized={awsFaceRecognition.isInitialized}
                isAnalyzing={awsFaceRecognition.isAnalyzing}
                recognizedPeople={awsFaceRecognition.recognizedPeople}
                lastAnalysis={awsFaceRecognition.lastAnalysis}
                error={awsFaceRecognition.error}
                crowdAnalysis={awsFaceRecognition.crowdAnalysis}
                vipPeople={eventSetup.vipPeople}
                enabled={hasSessionStarted}
              />
            </DraggablePanel>
          )}

          {/* Voice Announcements */}
          <DraggablePanel
            title="Voice System"
            initialPosition={{ x: 760, y: 520 }}
            initialSize={{ width: 320, height: 450 }}
            accentColor="green"
          >
            <VoiceAnnouncements
              mood={geminiMood.mood}
              energy={geminiMood.energy}
              crowdSize={geminiMood.crowdSize}
              currentTrack={audioPlayer.currentTrack?.title || 'None'}
              onAnnouncementStart={() => audioPlayer.duckAudio()}
              onAnnouncementEnd={() => audioPlayer.unduckAudio()}
            />
          </DraggablePanel>

          {/* Smart Event Dashboard */}
          {eventSetup && (
            <DraggablePanel
              title="Event Dashboard"
              initialPosition={{ x: 1100, y: 520 }}
              initialSize={{ width: 350, height: 450 }}
              accentColor="purple"
            >
              <SmartEventDashboard
                eventDetails={smartEventDJ.eventDetails}
                isActive={smartEventDJ.isActive}
                eventStarted={smartEventDJ.eventStarted}
                currentPhase={smartEventDJ.currentPhase}
                recognizedVIPs={smartEventDJ.recognizedVIPs}
                eventStatus={smartEventDJ.getEventStatus()}
                upcomingMoments={smartEventDJ.getUpcomingMoments()}
                triggeredMoments={smartEventDJ.triggeredMoments}
                onStartEvent={smartEventDJ.startEvent}
                onStopEvent={smartEventDJ.stopEvent}
              />
            </DraggablePanel>
          )}

          {/* Supabase Track Manager */}
          <DraggablePanel
            title="Upload Music"
            initialPosition={{ x: 20, y: 300 }}
            initialSize={{ width: 350, height: 400 }}
            accentColor="blue"
          >
            <SupabaseTrackManager
              onTrackSelect={handleTrackChange}
              onAddToLibrary={trackLibrary.addTrack}
            />
          </DraggablePanel>

          {/* Audius Browser */}
          <DraggablePanel
            title="Audius Music"
            initialPosition={{ x: 390, y: 300 }}
            initialSize={{ width: 350, height: 400 }}
            accentColor="green"
          >
            <AudiusBrowser
              onTrackSelect={handleTrackChange}
              onAddToLibrary={trackLibrary.addTrack}
              currentMood={geminiMood.mood}
            />
          </DraggablePanel>
        </>
      )}

      {/* Status Bar */}
      {hasSessionStarted && (
        <div className="absolute bottom-4 left-4 right-4 z-40">
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${audioPlayer.isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-sm">
                    {audioPlayer.currentTrack?.title || 'No track selected'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">{geminiMood.mood}</span>
                  <span className="text-xs text-gray-300">{geminiMood.energy}%</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">{geminiMood.crowdSize} people</span>
                </div>

                {eventSetup && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-green-400" />
                    <span className="text-sm">{eventSetup.eventName}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {continuousAI.isActive && (
                  <div className="flex items-center space-x-1">
                    <Brain className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-yellow-300">AI Active</span>
                  </div>
                )}
                
                {awsFaceRecognition.isInitialized && (
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-300">Face Recognition</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1">
                  <Mic className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-300">Voice Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;