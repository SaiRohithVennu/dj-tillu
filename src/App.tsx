import React, { useState, useEffect } from 'react';
import { EventSetupWizard } from './components/EventSetupWizard';
import { DraggablePanel } from './components/DraggablePanel';
import { TrackList } from './components/TrackList';
import { NowPlaying } from './components/NowPlaying';
import { AudiusBrowser } from './components/AudiusBrowser';
import { VideoAnalyzer } from './components/VideoAnalyzer';
import { VoiceAnnouncements } from './components/VoiceAnnouncements';
import { AudioVisualizer } from './components/AudioVisualizer';
import { FloatingControls } from './components/FloatingControls';
import { FullscreenVideoBackground } from './components/FullscreenVideoBackground';
import { MoodPlaylistManager } from './components/MoodPlaylistManager';
import { SupabaseTrackManager } from './components/SupabaseTrackManager';
import { WhooshMoodBrowser } from './components/WhooshMoodBrowser';
import { EventDetailsManager } from './components/EventDetailsManager';
import { SmartEventDashboard } from './components/SmartEventDashboard';
import { ServerSideAWSPanel } from './components/ServerSideAWSPanel';
import { useServerSideAWSFaceRecognition } from './hooks/useServerSideAWSFaceRecognition';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useSmartEventDJ } from './hooks/useSmartEventDJ';
import { useSmartEventEmcee } from './hooks/useSmartEventEmcee';
import { Track } from './data/tracks';
import { useTrackLibrary } from './hooks/useTrackLibrary';

interface EventSetup {
  eventName: string;
  eventType: 'birthday' | 'corporate' | 'wedding' | 'party' | 'conference';
  duration: number;
  vipPeople: Array<{
    id: string;
    name: string;
    role: string;
    imageFile?: File;
    imageUrl?: string;
    greeting?: string;
  }>;
  aiPersonality: 'humorous' | 'formal' | 'energetic' | 'professional';
  specialMoments: string[];
}

function App() {
  const { 
    tracks: trackLibrary, 
    isLoading: libraryLoading, 
    error: libraryError,
    addTrack: addToLibrary,
    refreshLibrary 
  } = useTrackLibrary();
  
  const [showSetup, setShowSetup] = useState(true);
  const [eventSetup, setEventSetup] = useState<EventSetup | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [hasSessionStarted, setHasSessionStarted] = useState(false);
  const [showEventSetup, setShowEventSetup] = useState(false);
  const [eventId] = useState(() => `event-${Date.now()}`);
  
  // Simple state for crowd analysis (no complex mood tracking)
  const [crowdSize, setCrowdSize] = useState(0);
  const [currentMood] = useState('energetic'); // Fixed mood for event hosting
  
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    currentTrack,
    isLoading,
    error,
    loadTrack,
    togglePlay,
    seek,
    setVolume,
    audioElement,
    duckAudio,
    unduckAudio,
    isDucked
  } = useAudioPlayer();

  // Simple crowd analysis without complex mood tracking
  const mood = currentMood;
  const energy = 75; // Fixed energy level for event hosting
  const confidence = 85; // Fixed confidence

  const triggerAnnouncement = (message: string) => {
    console.log('🎤 Triggering announcement:', message);
    duckAudio(); // Duck audio before announcement
    
    // Set up global function for voice announcements component
    (window as any).triggerPersonAnnouncement = (personName: string, customMessage?: string) => {
      const announcement = customMessage || `Welcome ${personName}! Great to see you here!`;
      console.log('🎤 Person announcement triggered:', announcement);
      
      // This will be handled by the VoiceAnnouncements component
      const event = new CustomEvent('personAnnouncement', {
        detail: { personName, message: announcement }
      });
      window.dispatchEvent(event);
    };
    
    // Trigger immediate announcement
    const event = new CustomEvent('immediateAnnouncement', {
      detail: { message }
    });
    window.dispatchEvent(event);
  };

  const {
    eventDetails,
    isActive: isEventActive,
    eventStarted,
    currentPhase,
    recognizedVIPs,
    initializeEvent,
    startEvent,
    stopEvent,
    handleVIPRecognized,
    getEventStatus,
    getUpcomingMoments,
    triggeredMoments
  } = useSmartEventDJ({
    tracks: trackLibrary,
    currentMood: currentMood,
    energy,
    crowdSize,
    onTrackChange: loadTrack,
    onAnnouncement: triggerAnnouncement,
    isPlaying,
    currentTrack
  });

  // Simple state for announcements
  const [isAnnouncing, setIsAnnouncing] = useState(false);

  // AWS Face Recognition
  const awsFaceRecognition = useServerSideAWSFaceRecognition({
    videoElement,
    vipPeople: eventSetup?.vipPeople || [],
    eventId,
    enabled: isEventActive && eventSetup !== null,
    onVIPRecognized: handleVIPRecognized
  });

  // Smart Event Emcee (new enhanced system)
  const smartEmcee = useSmartEventEmcee({
    tracks: trackLibrary,
    videoElement,
    eventSetup: eventSetup || {
      eventName: 'DJ Session',
      eventType: 'party',
      duration: 4,
      vipPeople: [],
      aiPersonality: 'energetic',
      specialMoments: []
    },
    onTrackChange: loadTrack,
    onAnnouncement: triggerAnnouncement,
    isPlaying,
    currentTrack
  });

  const handleAddToLibrary = (track: Track) => {
    addToLibrary(track);
  };

  const handleStartSession = async () => {
    console.log('🎵 Starting DJ session...');
    
    // Mark session as started immediately
    setHasSessionStarted(true);
    
    // Start smart emcee if event is configured
    if (eventSetup) {
      smartEmcee.startEvent();
      setIsAnnouncing(true);
    }
    
    // Announce session start
    const startAnnouncements = [
      "Welcome to DJ Tillu! Let's get this party started!",
      "DJ Tillu is in the house! Time to feel the beat!",
      "Your AI DJ is ready to rock! Let's make some noise!",
      "Session starting now! Get ready for an incredible musical journey!",
      "DJ Tillu taking control! Let's turn up the energy!"
    ];
    
    const announcement = startAnnouncements[Math.floor(Math.random() * startAnnouncements.length)];
    triggerAnnouncement(announcement);
    
    // Wait for announcement, then load and play music
    setTimeout(() => {
      if (!currentTrack && trackLibrary.length > 0) {
        const firstTrack = trackLibrary[0];
        console.log('🎵 Loading first track:', firstTrack.title);
        loadTrack(firstTrack);
        
        // Force play after track loads
        setTimeout(() => {
          console.log('🎵 Force starting playback...');
          if (!isPlaying) {
            togglePlay();
          }
        }, 2000);
      } else if (currentTrack && !isPlaying) {
        setTimeout(() => {
          togglePlay();
        }, 1000);
        console.log('🎵 Track already loaded, starting playback...');
      }
    }, 3000); // Wait for announcement
  };
  useEffect(() => {
  // Update crowd size from AWS face recognition
  useEffect(() => {
    setCrowdSize(awsFaceRecognition.crowdAnalysis.faceCount);
  }, [awsFaceRecognition.crowdAnalysis.faceCount]);
    document.title = 'DJ Tillu - Live AI DJ Experience';
  }, []);

  // Handle event setup completion
  const handleSetupComplete = (setup: EventSetup) => {
    setEventSetup(setup);
    setShowSetup(false);
    console.log('🎪 Event setup completed:', setup);
  };

  const handleSkipSetup = () => {
    setShowSetup(false);
    console.log('🎪 Event setup skipped');
  };

  // Show setup wizard first
  if (showSetup) {
    return (
      <EventSetupWizard
        onSetupComplete={handleSetupComplete}
        onSkip={handleSkipSetup}
      />
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-black">
      {/* Fullscreen Video Background */}
      <div className="absolute inset-0 z-0">
        <FullscreenVideoBackground onVideoReady={setVideoElement} />
      </div>
      
      {/* Overlay Content */}
      <div className={`absolute inset-0 z-10 transition-opacity duration-500 ${showOverlays ? 'opacity-100' : 'opacity-30'}`}>
        {/* Top Bar - Minimal Branding */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center backdrop-blur-md">
              <span className="text-lg font-bold text-white">DJ</span>
            </div>
            <div className="text-white">
              {eventSetup ? (
                <>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {eventSetup.eventName}
                  </h1>
                  <p className="text-xs text-gray-300 opacity-80">Smart AI Emcee • {eventSetup.eventType}</p>
                </>
              ) : (
                <>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    DJ Tillu
                  </h1>
                  <p className="text-xs text-gray-300 opacity-80">AI Live Session</p>
                </>
              )}
            </div>
          </div>
          
          {/* Live Indicator */}
          <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-md rounded-full px-4 py-2 border border-red-500/30">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400 text-sm font-medium">LIVE</span>
          </div>
        </div>

        {/* Left Panel - Track Library */}
        <DraggablePanel
          title="Track Library"
          initialPosition={{ x: 20, y: 100 }}
          initialSize={{ width: 320, height: 400 }}
          className="z-40"
          accentColor="purple"
        >
            <TrackList
              tracks={trackLibrary}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onTrackSelect={loadTrack}
              onPlayToggle={togglePlay}
            />
        </DraggablePanel>


        {/* Right Panel - Crowd Analytics */}
        <DraggablePanel
          title="Event Dashboard"
          initialPosition={{ x: window.innerWidth - 340, y: 400 }}
          initialSize={{ width: 320, height: 280 }}
          className="z-40"
          accentColor="blue"
        >
          <SmartEventDashboard
            eventDetails={eventDetails}
            isActive={isEventActive}
            eventStarted={eventStarted}
            currentPhase={currentPhase}
            recognizedVIPs={recognizedVIPs}
            eventStatus={getEventStatus()}
            upcomingMoments={getUpcomingMoments()}
            triggeredMoments={triggeredMoments}
            onStartEvent={startEvent}
            onStopEvent={stopEvent}
          />
        </DraggablePanel>

        {/* Face Recognition - Left side under Track Library */}
        <DraggablePanel
          title="VIP Face Recognition"
          initialPosition={{ x: 20, y: 520 }}
          initialSize={{ width: 320, height: 280 }}
          className="z-40"
          accentColor="green"
        >
          <ServerSideAWSPanel
            isInitialized={awsFaceRecognition.isInitialized}
            isAnalyzing={awsFaceRecognition.isAnalyzing}
            recognizedPeople={awsFaceRecognition.recognizedPeople}
            lastAnalysis={awsFaceRecognition.lastAnalysis}
            error={awsFaceRecognition.error}
            crowdAnalysis={awsFaceRecognition.crowdAnalysis}
            vipPeople={eventSetup?.vipPeople || []}
            enabled={isEventActive && eventSetup !== null}
          />
        </DraggablePanel>

        {/* Event Status - Top right */}
        <DraggablePanel
          title="Event Status"
          initialPosition={{ x: window.innerWidth - 340, y: 100 }}
          initialSize={{ width: 320, height: 200 }}
          className="z-40"
          accentColor="purple"
        >
          <div className="text-center space-y-3">
            <div className="text-2xl">🎤</div>
            <h3 className="text-lg font-bold text-white">AI Event Host</h3>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-4 text-center text-sm">
                <div>
                  <div className="text-green-300 font-bold text-lg">{awsFaceRecognition.recognizedPeople.length}</div>
                  <div className="text-gray-400">VIPs Seen</div>
                </div>
                <div>
                  <div className="text-blue-300 font-bold text-lg">{crowdSize}</div>
                  <div className="text-gray-400">People Present</div>
                </div>
              </div>
            </div>
            <div className={`px-3 py-2 rounded-lg ${
              smartEmcee.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
            }`}>
              {smartEmcee.isActive ? '🟢 AI Host Active' : '⚪ AI Host Inactive'}
            </div>
          </div>
        </DraggablePanel>

        {/* Voice Announcements - Bottom right */}
        <DraggablePanel
          title="Voice Announcements"
          initialPosition={{ x: window.innerWidth - 340, y: 700 }}
          initialSize={{ width: 320, height: 200 }}
          className="z-40"
          accentColor="yellow"
        >
          <VoiceAnnouncements 
            mood={mood} 
            energy={energy} 
            crowdSize={crowdSize}
            currentTrack={currentTrack?.title || 'No track'}
            onAnnouncementStart={duckAudio}
            onAnnouncementEnd={unduckAudio}
          />
        </DraggablePanel>

        {/* Center - Now Playing (when track is selected) */}
        {currentTrack && !smartEmcee.isActive && (
          <DraggablePanel
            title="Now Playing"
            initialPosition={{ x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 150 }}
            initialSize={{ width: 400, height: 450 }}
            className="z-50"
            accentColor="pink"
          >
            {currentTrack ? (
              <NowPlaying
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                isLoading={isLoading}
                onPlayToggle={togglePlay}
                onSeek={seek}
                onVolumeChange={setVolume}
                error={error}
              />
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-white mb-2">DJ Tillu Starting...</h3>
                <p className="text-gray-300">Loading your music experience</p>
                {isTransitioning && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${transitionProgress}%` }}
                      />
                    </div>
                    <p className="text-purple-300 text-sm">Transitioning tracks...</p>
                  </div>
                )}
              </div>
            )}
          </DraggablePanel>
        )}

        {/* Smart Event Host Panel (when active) */}
        {smartEmcee.isActive && (
          <DraggablePanel
            title="🎤 AI Event Host"
            initialPosition={{ x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 150 }}
            initialSize={{ width: 400, height: 350 }}
            className="z-50"
            accentColor="blue"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">🎤</span>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-white mb-2">AI Event Host Active</h3>
                <p className="text-gray-300 text-sm">{eventSetup?.eventName}</p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="text-blue-300 font-bold text-lg">{smartEmcee.recognizedPeople.length}</div>
                    <div className="text-gray-400">People Seen</div>
                  </div>
                  <div>
                    <div className="text-green-300 font-bold text-lg">{smartEmcee.crowdSize}</div>
                    <div className="text-gray-400">In Frame</div>
                  </div>
                  <div>
                    <div className="text-purple-300 font-bold text-lg">{smartEmcee.currentEnergy}%</div>
                    <div className="text-gray-400">Energy</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-600/20 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-300 font-medium text-sm">Analyzing Camera Feed</span>
                </div>
                <p className="text-xs text-gray-300">
                  Current Mood: <span className="text-blue-300 capitalize">{smartEmcee.currentMood}</span>
                </p>
                {smartEmcee.lastAnalysis && (
                  <p className="text-xs text-gray-400 mt-1">
                    Last Analysis: {smartEmcee.lastAnalysis.toLocaleTimeString()}
                  </p>
                )}
              </div>
              
              {smartEmcee.recognizedPeople.length > 0 && (
                <div className="bg-green-600/20 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-green-300 mb-2">Recognized People:</h4>
                  <div className="space-y-1">
                    {smartEmcee.recognizedPeople.map(person => (
                      <div key={person.id} className="flex justify-between text-xs">
                        <span className="text-white">{person.name}</span>
                        <span className="text-green-300">{person.recognitionCount}x seen</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DraggablePanel>
        )}
        {/* Floating Controls */}
        <FloatingControls
          isPlaying={isPlaying}
          onPlayToggle={togglePlay}
          onSettingsToggle={() => setShowSettings(!showSettings)}
          onStartSession={handleStartSession}
          hasStarted={hasSessionStarted}
        />

        {/* Settings Panel (when open) */}
        {showSettings && (
          <div className="absolute inset-4 z-60 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Event Setup</h3>
                <div className="space-y-4">
                  <button
                    onClick={() => setShowEventSetup(!showEventSetup)}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  >
                    {showEventSetup ? 'Hide Event Setup' : 'Configure Smart Event'}
                  </button>
                  
                  {showEventSetup && (
                    <div className="max-h-96 overflow-y-auto">
                      <EventDetailsManager onEventSaved={initializeEvent} />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Master Volume</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Music Browser</h3>
                
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-white mb-4">Mood Playlists</h4>
                  <MoodPlaylistManager
                    tracks={trackLibrary}
                    onPlayTrack={loadTrack}
                  />
                </div>
                
                <AudiusBrowser 
                  onTrackSelect={loadTrack}
                  onAddToLibrary={handleAddToLibrary}
                  currentMood={mood}
                />
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">WhooshMusic Moods</h3>
                  <WhooshMoodBrowser
                    onTrackSelect={loadTrack}
                    onAddToLibrary={handleAddToLibrary}
                    currentMood={mood}
                  />
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Upload Music</h3>
                  <SupabaseTrackManager
                    onTrackSelect={loadTrack}
                    onAddToLibrary={handleAddToLibrary}
                  />
                </div>
              </div>
            </div>
          </div>
        )}


        {/* AI Status Indicator */}
        {(isEventActive || smartEmcee.isActive) && (
          <div className="absolute top-1/2 left-8 transform -translate-y-1/2 z-50">
            <div className={`px-4 py-2 rounded-full backdrop-blur-xl shadow-2xl border transition-all ${
              smartEmcee.isActive
                ? 'bg-blue-500/30 border-blue-500/50'
                : isEventActive
                ? 'bg-purple-500/30 border-purple-500/50'
                : 'bg-green-500/30 border-green-500/50'
            }`}>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  smartEmcee.isActive ? 'bg-blue-400' :
                  isEventActive ? 'bg-purple-400' : 'bg-green-400'
                }`}></div>
                <span className={`font-semibold text-sm ${
                  smartEmcee.isActive ? 'text-blue-300' :
                  isEventActive ? 'text-purple-300' : 'text-green-300'
                }`}>
                  {smartEmcee.isActive ? 'AI EVENT HOST ACTIVE' :
                   isEventActive ? 'SMART EVENT ACTIVE' : 'AI DJ ACTIVE'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Smart Emcee Status */}
        {smartEmcee.isActive && (
          <div className="absolute bottom-32 right-8 z-50">
            <div className="px-4 py-2 rounded-full bg-blue-500/30 border border-blue-500/50 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-blue-300 font-semibold text-sm">
                  AI EVENT HOST • {smartEmcee.recognizedPeople.length} VIPs SEEN
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Audio Ducking Indicator */}
        {(isDucked || isAnnouncing) && (
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-50">
            <div className="px-4 py-2 rounded-full bg-yellow-500/30 border border-yellow-500/50 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-yellow-300 font-semibold text-sm">
                  ANNOUNCEMENT
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;