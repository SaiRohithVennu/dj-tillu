import React from 'react';
import { Calendar, Clock, Users, Zap, CheckCircle, AlertCircle } from 'lucide-react';

interface SmartEventDashboardProps {
  eventDetails: any;
  isActive: boolean;
  eventStarted: boolean;
  currentPhase: any;
  recognizedVIPs: any[];
  eventStatus: string;
  upcomingMoments: any[];
  triggeredMoments: string[];
  onStartEvent: () => void;
  onStopEvent: () => void;
}

export const SmartEventDashboard: React.FC<SmartEventDashboardProps> = ({
  eventDetails,
  isActive,
  eventStarted,
  currentPhase,
  recognizedVIPs,
  eventStatus,
  upcomingMoments,
  triggeredMoments,
  onStartEvent,
  onStopEvent
}) => {
  if (!eventDetails) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
        <p className="text-gray-300 mb-2">No event configured</p>
        <p className="text-gray-400 text-sm">Set up your event in the Event Setup panel</p>
      </div>
    );
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPhaseColor = (phase: string) => {
    const colors = {
      arrival: 'blue',
      cocktail: 'green',
      dinner: 'yellow',
      dancing: 'purple',
      closing: 'red'
    };
    return colors[phase as keyof typeof colors] || 'gray';
  };

  return (
    <div className="space-y-4">
      {/* Event Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg p-4 border border-purple-500/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-white">{eventDetails.name}</h3>
          <span className="px-2 py-1 bg-purple-500/30 text-purple-200 rounded text-xs">
            {eventDetails.type.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">
              {formatTime(eventDetails.startTime)} - {formatTime(eventDetails.endTime)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">{eventDetails.expectedAttendees} guests</span>
          </div>
        </div>
      </div>

      {/* Event Status */}
      <div className="bg-white/10 rounded-lg p-3 border border-white/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-300">Event Status:</span>
          <span className={`font-semibold ${
            eventStarted && isActive ? 'text-green-300' : 
            eventStarted ? 'text-yellow-300' : 'text-gray-300'
          }`}>
            {eventStatus}
          </span>
        </div>
        
        <div className="flex space-x-2">
          {!eventStarted ? (
            <button
              onClick={onStartEvent}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center"
            >
              <Zap className="w-4 h-4 mr-2" />
              Start Event
            </button>
          ) : (
            <button
              onClick={onStopEvent}
              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Stop Event
            </button>
          )}
        </div>
      </div>

      {/* Current Phase */}
      {currentPhase && (
        <div className={`bg-${getPhaseColor(currentPhase.phase)}-600/20 rounded-lg p-3 border border-${getPhaseColor(currentPhase.phase)}-500/30`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">Current Phase</span>
            <span className={`text-${getPhaseColor(currentPhase.phase)}-300 text-sm`}>
              {formatTime(currentPhase.time)}
            </span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Phase:</span>
              <span className={`text-${getPhaseColor(currentPhase.phase)}-200 capitalize`}>
                {currentPhase.phase}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Music Style:</span>
              <span className={`text-${getPhaseColor(currentPhase.phase)}-200`}>
                {currentPhase.musicStyle}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Target Energy:</span>
              <span className={`text-${getPhaseColor(currentPhase.phase)}-200`}>
                {currentPhase.energyTarget}/10
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIP Recognition Status */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">VIP Recognition</h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {recognizedVIPs.map((vip) => (
            <div
              key={vip.id}
              className={`p-2 rounded-lg border text-sm ${
                vip.recognitionCount > 0
                  ? 'bg-green-500/20 border-green-500/40'
                  : 'bg-white/5 border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white font-medium">{vip.name}</span>
                  <span className="text-gray-400 ml-2">({vip.role})</span>
                </div>
                <div className="flex items-center space-x-1">
                  {vip.recognitionCount > 0 ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-300 text-xs">
                        {vip.recognitionCount}x
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500 text-xs">Not seen</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {recognizedVIPs.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No VIPs configured</p>
          )}
        </div>
      </div>

      {/* Upcoming Moments */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">Upcoming Moments</h4>
        <div className="space-y-2">
          {upcomingMoments.map((moment) => (
            <div
              key={moment.id}
              className="p-2 bg-yellow-600/20 border border-yellow-500/30 rounded-lg text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-white">{moment.description}</span>
                <span className="text-yellow-300">{formatTime(moment.time)}</span>
              </div>
              <div className="text-xs text-yellow-200 mt-1 capitalize">
                {moment.type.replace('_', ' ')}
              </div>
            </div>
          ))}
          
          {upcomingMoments.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No upcoming moments</p>
          )}
        </div>
      </div>

      {/* Event Stats */}
      <div className="bg-purple-600/10 rounded-lg p-3 border border-purple-500/20">
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <p className="text-purple-300 font-semibold">{triggeredMoments.length}</p>
            <p className="text-gray-400">Moments</p>
          </div>
          <div>
            <p className="text-purple-300 font-semibold">
              {recognizedVIPs.filter(v => v.recognitionCount > 0).length}
            </p>
            <p className="text-gray-400">VIPs Seen</p>
          </div>
          <div>
            <p className="text-purple-300 font-semibold">
              {eventDetails.eventFlow.length}
            </p>
            <p className="text-gray-400">Phases</p>
          </div>
        </div>
      </div>
    </div>
  );
};