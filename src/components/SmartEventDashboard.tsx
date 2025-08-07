import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Zap, Settings, Play, Pause } from 'lucide-react';
import { useSmartEventDJ } from '../hooks/useSmartEventDJ';

interface SmartEventDashboardProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

export const SmartEventDashboard: React.FC<SmartEventDashboardProps> = ({
  isActive,
  onToggle
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [eventDetails, setEventDetails] = useState({
    name: 'kjhkjbkjb jk,',
    type: 'BIRTHDAY',
    startTime: '10:00 AM',
    endTime: '10:05 AM',
    guestCount: 50
  });

  const {
    currentPhase,
    timeline,
    isRunning,
    startEvent,
    pauseEvent,
    updateEventDetails,
    getRecommendations
  } = useSmartEventDJ();

  useEffect(() => {
    if (isActive && !isRunning) {
      startEvent(eventDetails);
    } else if (!isActive && isRunning) {
      pauseEvent();
    }
  }, [isActive, isRunning, startEvent, pauseEvent, eventDetails]);

  const handleToggle = () => {
    onToggle(!isActive);
  };

  const handleEventDetailsChange = (field: string, value: string | number) => {
    const newDetails = { ...eventDetails, [field]: value };
    setEventDetails(newDetails);
    updateEventDetails(newDetails);
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Event Dashboard</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={handleToggle}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            {isActive ? 'ACTIVE' : 'START'}
          </button>
        </div>
      </div>

      {/* Event Info Card */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-white font-medium">{eventDetails.name}</h4>
          <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
            {eventDetails.type}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-300">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{eventDetails.startTime} - {eventDetails.endTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{eventDetails.guestCount} guests</span>
          </div>
        </div>
      </div>

      {/* Event Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">Event Status:</span>
          <span className={`font-medium ${
            isRunning ? 'text-green-400' : 'text-gray-400'
          }`}>
            {isRunning ? 'Event ready to start' : 'Event ready to start'}
          </span>
        </div>

        {currentPhase && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Current Phase:</span>
            <span className="text-white font-medium capitalize">{currentPhase}</span>
          </div>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-gray-300 mb-2">Event Timeline</div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {timeline.map((event, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${
                    event.completed ? 'bg-green-400' : 'bg-gray-400'
                  }`} />
                  <span className="text-gray-300">{event.time}</span>
                  <span className="text-white">{event.activity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* VIP Recognition Status */}
      <div className="mt-4 pt-4 border-t border-white/20">
        <div className="text-sm text-gray-300 mb-2">VIP Recognition</div>
        <div className="text-xs text-gray-400">No VIPs configured</div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-4 pt-4 border-t border-white/20 space-y-3">
          <div>
            <label className="block text-xs text-gray-300 mb-1">Event Name</label>
            <input
              type="text"
              value={eventDetails.name}
              onChange={(e) => handleEventDetailsChange('name', e.target.value)}
              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-300 mb-1">Event Type</label>
            <select
              value={eventDetails.type}
              onChange={(e) => handleEventDetailsChange('type', e.target.value)}
              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
            >
              <option value="BIRTHDAY">Birthday</option>
              <option value="WEDDING">Wedding</option>
              <option value="CORPORATE">Corporate</option>
              <option value="PARTY">Party</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Start Time</label>
              <input
                type="time"
                value={eventDetails.startTime}
                onChange={(e) => handleEventDetailsChange('startTime', e.target.value)}
                className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">End Time</label>
              <input
                type="time"
                value={eventDetails.endTime}
                onChange={(e) => handleEventDetailsChange('endTime', e.target.value)}
                className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-300 mb-1">Guest Count</label>
            <input
              type="number"
              value={eventDetails.guestCount}
              onChange={(e) => handleEventDetailsChange('guestCount', Number(e.target.value))}
              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
              min="1"
              max="1000"
            />
          </div>
        </div>
      )}

      {/* Main Start Event Button */}
      <div className="mt-4">
        <button
          onClick={handleToggle}
          disabled={!eventDetails.name}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
            isActive
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
              : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
          } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
        >
          <Zap className="w-5 h-5" />
          {isActive ? 'Event Active' : 'Start Event'}
        </button>
      </div>
    </div>
  );
};