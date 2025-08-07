import React, { useState } from 'react';
import { Calendar, Users, Music, TrendingUp, Clock, MapPin, Mic, Settings, BarChart3, Activity } from 'lucide-react';

interface EventDetails {
  name: string;
  type: string;
  venue: string;
  date: string;
  duration: number;
  expectedAttendance: number;
  vibe: string;
  specialRequests: string;
}

interface SmartEventDashboardProps {
  eventDetails: EventDetails;
  currentTrack?: any;
  currentMood?: string;
  energy?: number;
  crowdSize?: number;
  isPlaying?: boolean;
  announcements?: string[];
  onUpdateEventDetails?: (details: Partial<EventDetails>) => void;
  onTrackChange?: (track: any) => void;
  onAnnouncement?: (announcement: string) => void;
}

export const SmartEventDashboard: React.FC<SmartEventDashboardProps> = ({
  eventDetails,
  currentTrack,
  currentMood = 'neutral',
  energy = 0.5,
  crowdSize = 0,
  isPlaying = false,
  announcements = [],
  onUpdateEventDetails,
  onTrackChange,
  onAnnouncement
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const getEnergyColor = (energy: number) => {
    if (energy > 0.7) return 'text-red-600 bg-red-100';
    if (energy > 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getMoodColor = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'energetic': return 'text-red-600 bg-red-100';
      case 'happy': return 'text-yellow-600 bg-yellow-100';
      case 'chill': return 'text-blue-600 bg-blue-100';
      case 'romantic': return 'text-pink-600 bg-pink-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Smart Event Dashboard</h2>
            <p className="text-gray-600">{eventDetails.name}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            isPlaying ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="text-sm font-medium">
              {isPlaying ? 'Live' : 'Paused'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'crowd', label: 'Crowd Analysis', icon: Users },
          { id: 'music', label: 'Music Control', icon: Music },
          { id: 'announcements', label: 'Announcements', icon: Mic }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Event Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Venue</span>
              </div>
              <p className="text-lg font-bold text-blue-900">{eventDetails.venue}</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Attendance</span>
              </div>
              <p className="text-lg font-bold text-green-900">
                {crowdSize} / {eventDetails.expectedAttendance}
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-800">Duration</span>
              </div>
              <p className="text-lg font-bold text-purple-900">
                {formatDuration(eventDetails.duration)}
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-800">Event Type</span>
              </div>
              <p className="text-lg font-bold text-orange-900 capitalize">
                {eventDetails.type}
              </p>
            </div>
          </div>

          {/* Real-time Metrics */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Real-time Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Current Mood</span>
                  <Activity className="w-4 h-4 text-gray-500" />
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getMoodColor(currentMood)}`}>
                  {currentMood.charAt(0).toUpperCase() + currentMood.slice(1)}
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Energy Level</span>
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${energy * 100}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${getEnergyColor(energy)}`}>
                    {Math.round(energy * 100)}%
                  </span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Now Playing</span>
                  <Music className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentTrack ? `${currentTrack.title} - ${currentTrack.artist}` : 'No track selected'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'crowd' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Crowd Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Attendance Tracking</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Attendance</span>
                    <span className="font-bold text-blue-600">{crowdSize}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Expected</span>
                    <span className="font-bold text-gray-800">{eventDetails.expectedAttendance}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Capacity %</span>
                    <span className="font-bold text-green-600">
                      {Math.round((crowdSize / eventDetails.expectedAttendance) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Mood Distribution</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Energetic</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Happy</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '80%' }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Chill</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '40%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'music' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Music Control</h3>
            {currentTrack ? (
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{currentTrack.title}</h4>
                    <p className="text-gray-600">{currentTrack.artist}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>{currentTrack.genre}</span>
                      <span>•</span>
                      <span>{currentTrack.bpm} BPM</span>
                      <span>•</span>
                      <span>{Math.floor(currentTrack.duration / 60)}:{(currentTrack.duration % 60).toString().padStart(2, '0')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-8 text-center">
                <Music className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No track currently selected</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Announcements</h3>
            {announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.slice(-5).reverse().map((announcement, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="flex items-center space-x-2 mb-2">
                      <Mic className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-500">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-800">{announcement}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-8 text-center">
                <Mic className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No announcements yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};