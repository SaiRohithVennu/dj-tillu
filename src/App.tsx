import React, { useState } from 'react';
import { Music, Users, Settings, Play, Pause, SkipForward, Volume2, Mic, Video, Brain, Zap } from 'lucide-react';
import TrackList from './components/TrackList';
import NowPlaying from './components/NowPlaying';
import DJInterface from './components/DJInterface';
import AIDJPanel from './components/AIDJPanel';
import DraggablePanel from './components/DraggablePanel';
import AudioVisualizer from './components/AudioVisualizer';
import FloatingControls from './components/FloatingControls';
import DynamicBackground from './components/DynamicBackground';
import VoiceAnnouncements from './components/VoiceAnnouncements';
import EventDetailsManager from './components/EventDetailsManager';
import SmartEventDashboard from './components/SmartEventDashboard';
import SupabaseTrackManager from './components/SupabaseTrackManager';
import SupabaseTrackUploader from './components/SupabaseTrackUploader';
import EventSetupWizard from './components/EventSetupWizard';
import ServerSideAWSPanel from './components/ServerSideAWSPanel';
import OpenAIEventHostPanel from './components/OpenAIEventHostPanel';
import ContinuousAIAgentPanel from './components/ContinuousAIAgentPanel';
import { useMusicPlayer } from './hooks/useMusicPlayer';
import { useSmartEventDJ } from './hooks/useSmartEventDJ';
import { useTrackLibrary } from './hooks/useTrackLibrary';

function App() {
  const [activeTab, setActiveTab] = useState('tracks');
  const [showEventSetup, setShowEventSetup] = useState(false);
  
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    playTrack,
    pauseTrack,
    resumeTrack,
    nextTrack,
    setVolume,
    seek
  } = useMusicPlayer();

  const {
    eventDetails,
    vipPeople,
    eventActive,
    startEvent,
    stopEvent,
    updateEventDetails,
    addVIPPerson,
    removeVIPPerson
  } = useSmartEventDJ();

  const { tracks, loading: tracksLoading } = useTrackLibrary();

  const handleTrackSelect = (track: any) => {
    playTrack(track);
  };

  const handleEventSetupComplete = (details: any, people: any[]) => {
    updateEventDetails(details);
    people.forEach(person => addVIPPerson(person));
    setShowEventSetup(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      <DynamicBackground />
      
      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  DJ Tillu
                </h1>
                <p className="text-sm text-gray-400">AI-Powered Event DJ</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowEventSetup(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Event Setup</span>
              </button>
              
              {eventActive ? (
                <button
                  onClick={stopEvent}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Pause className="w-4 h-4" />
                  <span>Stop Event</span>
                </button>
              ) : (
                <button
                  onClick={startEvent}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Event</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Track Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-black/20 backdrop-blur-sm rounded-lg p-1">
              {[
                { id: 'tracks', label: 'Track Library', icon: Music },
                { id: 'upload', label: 'Upload Tracks', icon: Users },
                { id: 'manage', label: 'Manage Tracks', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              {activeTab === 'tracks' && (
                <TrackList
                  tracks={tracks}
                  onTrackSelect={handleTrackSelect}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  loading={tracksLoading}
                />
              )}
              {activeTab === 'upload' && <SupabaseTrackUploader />}
              {activeTab === 'manage' && <SupabaseTrackManager />}
            </div>
          </div>

          {/* Right Column - Controls & AI */}
          <div className="space-y-6">
            {/* Now Playing */}
            <NowPlaying
              track={currentTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onPlayPause={isPlaying ? pauseTrack : resumeTrack}
              onNext={nextTrack}
              onSeek={seek}
            />

            {/* Audio Visualizer */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <AudioVisualizer isPlaying={isPlaying} />
            </div>

            {/* Volume Control */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <div className="flex items-center space-x-3">
                <Volume2 className="w-5 h-5 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm text-gray-400 w-12">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>

            {/* Event Status */}
            {eventActive && (
              <div className="bg-green-500/20 backdrop-blur-sm rounded-xl border border-green-500/30 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <h3 className="font-semibold text-green-400">Event Active</h3>
                    <p className="text-sm text-green-300">{eventDetails?.name || 'Live Event'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Draggable Panels */}
      <DraggablePanel
        title="🎧 AI DJ Controls"
        defaultPosition={{ x: 20, y: 200 }}
        defaultSize={{ width: 350, height: 400 }}
      >
        <AIDJPanel />
      </DraggablePanel>

      <DraggablePanel
        title="📊 Event Dashboard"
        defaultPosition={{ x: 400, y: 200 }}
        defaultSize={{ width: 400, height: 500 }}
      >
        <SmartEventDashboard
          eventDetails={eventDetails}
          vipPeople={vipPeople}
          eventActive={eventActive}
          currentTrack={currentTrack}
        />
      </DraggablePanel>

      <DraggablePanel
        title="🎤 Voice & Announcements"
        defaultPosition={{ x: 20, y: 620 }}
        defaultSize={{ width: 350, height: 300 }}
      >
        <VoiceAnnouncements
          eventActive={eventActive}
          currentTrack={currentTrack}
          eventDetails={eventDetails}
        />
      </DraggablePanel>

      <DraggablePanel
        title="👥 Face Recognition"
        defaultPosition={{ x: 820, y: 200 }}
        defaultSize={{ width: 350, height: 400 }}
      >
        <ServerSideAWSPanel
          vipPeople={vipPeople}
          eventActive={eventActive}
        />
      </DraggablePanel>

      <DraggablePanel
        title="🤖 AI Event Host"
        defaultPosition={{ x: 400, y: 720 }}
        defaultSize={{ width: 400, height: 350 }}
      >
        <OpenAIEventHostPanel
          eventDetails={eventDetails}
          vipPeople={vipPeople}
          eventActive={eventActive}
          currentTrack={currentTrack}
        />
      </DraggablePanel>

      <DraggablePanel
        title="🎥 AI Video Agent"
        defaultPosition={{ x: 820, y: 620 }}
        defaultSize={{ width: 350, height: 400 }}
      >
        <ContinuousAIAgentPanel
          eventDetails={eventDetails}
          vipPeople={vipPeople}
          eventActive={eventActive}
        />
      </DraggablePanel>

      {/* Floating Controls */}
      <FloatingControls
        isPlaying={isPlaying}
        onPlayPause={isPlaying ? pauseTrack : resumeTrack}
        onNext={nextTrack}
        volume={volume}
        onVolumeChange={setVolume}
      />

      {/* Event Setup Modal */}
      {showEventSetup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <EventSetupWizard
              onComplete={handleEventSetupComplete}
              onCancel={() => setShowEventSetup(false)}
              initialEventDetails={eventDetails}
              initialVIPPeople={vipPeople}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;