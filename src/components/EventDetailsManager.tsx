import React, { useState } from 'react';
import { Calendar, Clock, Users, MapPin, Save, Edit3 } from 'lucide-react';

interface EventDetails {
  id: string;
  name: string;
  type: 'wedding' | 'birthday' | 'corporate' | 'party' | 'festival' | 'club';
  startTime: string;
  endTime: string;
  expectedAttendees: number;
  venue: string;
  specialMoments: SpecialMoment[];
  vipGuests: VIPGuest[];
  musicPreferences: string[];
  eventFlow: EventFlowItem[];
}

interface SpecialMoment {
  id: string;
  time: string;
  type: 'entrance' | 'speech' | 'cake_cutting' | 'first_dance' | 'toast' | 'surprise';
  description: string;
  musicCue?: string;
  announcementTemplate?: string;
}

interface VIPGuest {
  id: string;
  name: string;
  role: string; // 'bride', 'groom', 'birthday_person', 'ceo', 'guest_of_honor'
  faceImageUrl?: string;
  personalizedGreeting?: string;
  favoriteGenres?: string[];
}

interface EventFlowItem {
  id: string;
  time: string;
  phase: 'arrival' | 'cocktail' | 'dinner' | 'dancing' | 'closing';
  energyTarget: number; // 1-10
  musicStyle: string;
  duration: number; // minutes
}

interface EventDetailsManagerProps {
  onEventSaved: (event: EventDetails) => void;
}

export const EventDetailsManager: React.FC<EventDetailsManagerProps> = ({
  onEventSaved
}) => {
  const [event, setEvent] = useState<EventDetails>({
    id: crypto.randomUUID(),
    name: '',
    type: 'party',
    startTime: '',
    endTime: '',
    expectedAttendees: 50,
    venue: '',
    specialMoments: [],
    vipGuests: [],
    musicPreferences: [],
    eventFlow: []
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'flow' | 'vips' | 'moments'>('basic');

  const eventTypes = [
    { value: 'wedding', label: 'Wedding', icon: '💒' },
    { value: 'birthday', label: 'Birthday Party', icon: '🎂' },
    { value: 'corporate', label: 'Corporate Event', icon: '🏢' },
    { value: 'party', label: 'Party', icon: '🎉' },
    { value: 'festival', label: 'Festival', icon: '🎪' },
    { value: 'club', label: 'Club Night', icon: '🕺' }
  ];

  const musicGenres = [
    'Electronic', 'Pop', 'Hip Hop', 'Rock', 'Jazz', 'Classical',
    'Reggae', 'Country', 'R&B', 'Latin', 'Bollywood', 'Afrobeats'
  ];

  const addSpecialMoment = () => {
    const newMoment: SpecialMoment = {
      id: crypto.randomUUID(),
      time: '',
      type: 'entrance',
      description: '',
      musicCue: '',
      announcementTemplate: ''
    };
    setEvent(prev => ({
      ...prev,
      specialMoments: [...prev.specialMoments, newMoment]
    }));
  };

  const addVIPGuest = () => {
    const newVIP: VIPGuest = {
      id: crypto.randomUUID(),
      name: '',
      role: 'guest_of_honor',
      personalizedGreeting: '',
      favoriteGenres: []
    };
    setEvent(prev => ({
      ...prev,
      vipGuests: [...prev.vipGuests, newVIP]
    }));
  };

  const addFlowItem = () => {
    const newFlow: EventFlowItem = {
      id: crypto.randomUUID(),
      time: '',
      phase: 'arrival',
      energyTarget: 5,
      musicStyle: 'Background',
      duration: 30
    };
    setEvent(prev => ({
      ...prev,
      eventFlow: [...prev.eventFlow, newFlow]
    }));
  };

  const handleSave = () => {
    onEventSaved(event);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-purple-400" />
          Smart Event Setup
        </h2>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Event
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
        {[
          { id: 'basic', label: 'Basic Info', icon: Calendar },
          { id: 'flow', label: 'Event Flow', icon: Clock },
          { id: 'vips', label: 'VIP Guests', icon: Users },
          { id: 'moments', label: 'Special Moments', icon: Edit3 }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 px-3 py-2 rounded text-sm transition-colors flex items-center justify-center ${
              activeTab === id 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4 mr-1" />
            {label}
          </button>
        ))}
      </div>

      {/* Basic Info Tab */}
      {activeTab === 'basic' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Event Name</label>
              <input
                type="text"
                value={event.name}
                onChange={(e) => setEvent(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                placeholder="Sarah's Wedding Reception"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Event Type</label>
              <select
                value={event.type}
                onChange={(e) => setEvent(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              >
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
              <input
                type="datetime-local"
                value={event.startTime}
                onChange={(e) => setEvent(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
              <input
                type="datetime-local"
                value={event.endTime}
                onChange={(e) => setEvent(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Expected Attendees</label>
              <input
                type="number"
                value={event.expectedAttendees}
                onChange={(e) => setEvent(prev => ({ ...prev, expectedAttendees: Number(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Venue</label>
            <input
              type="text"
              value={event.venue}
              onChange={(e) => setEvent(prev => ({ ...prev, venue: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              placeholder="Grand Ballroom, Hotel Paradise"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Music Preferences</label>
            <div className="grid grid-cols-4 gap-2">
              {musicGenres.map(genre => (
                <label key={genre} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={event.musicPreferences.includes(genre)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEvent(prev => ({
                          ...prev,
                          musicPreferences: [...prev.musicPreferences, genre]
                        }));
                      } else {
                        setEvent(prev => ({
                          ...prev,
                          musicPreferences: prev.musicPreferences.filter(g => g !== genre)
                        }));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-300">{genre}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Event Flow Tab */}
      {activeTab === 'flow' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Event Timeline</h3>
            <button
              onClick={addFlowItem}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
            >
              Add Phase
            </button>
          </div>

          <div className="space-y-3">
            {event.eventFlow.map((flow, index) => (
              <div key={flow.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                <div className="grid grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Time</label>
                    <input
                      type="time"
                      value={flow.time}
                      onChange={(e) => {
                        const updated = [...event.eventFlow];
                        updated[index].time = e.target.value;
                        setEvent(prev => ({ ...prev, eventFlow: updated }));
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Phase</label>
                    <select
                      value={flow.phase}
                      onChange={(e) => {
                        const updated = [...event.eventFlow];
                        updated[index].phase = e.target.value as any;
                        setEvent(prev => ({ ...prev, eventFlow: updated }));
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                    >
                      <option value="arrival">Arrival</option>
                      <option value="cocktail">Cocktail</option>
                      <option value="dinner">Dinner</option>
                      <option value="dancing">Dancing</option>
                      <option value="closing">Closing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Energy (1-10)</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={flow.energyTarget}
                      onChange={(e) => {
                        const updated = [...event.eventFlow];
                        updated[index].energyTarget = Number(e.target.value);
                        setEvent(prev => ({ ...prev, eventFlow: updated }));
                      }}
                      className="w-full"
                    />
                    <span className="text-xs text-purple-300">{flow.energyTarget}</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Music Style</label>
                    <input
                      type="text"
                      value={flow.musicStyle}
                      onChange={(e) => {
                        const updated = [...event.eventFlow];
                        updated[index].musicStyle = e.target.value;
                        setEvent(prev => ({ ...prev, eventFlow: updated }));
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      placeholder="Upbeat Pop"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Duration (min)</label>
                    <input
                      type="number"
                      value={flow.duration}
                      onChange={(e) => {
                        const updated = [...event.eventFlow];
                        updated[index].duration = Number(e.target.value);
                        setEvent(prev => ({ ...prev, eventFlow: updated }));
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIP Guests Tab */}
      {activeTab === 'vips' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">VIP Guest Recognition</h3>
            <button
              onClick={addVIPGuest}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
            >
              Add VIP
            </button>
          </div>

          <div className="space-y-3">
            {event.vipGuests.map((vip, index) => (
              <div key={vip.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={vip.name}
                      onChange={(e) => {
                        const updated = [...event.vipGuests];
                        updated[index].name = e.target.value;
                        setEvent(prev => ({ ...prev, vipGuests: updated }));
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      placeholder="Sarah Johnson"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Role</label>
                    <select
                      value={vip.role}
                      onChange={(e) => {
                        const updated = [...event.vipGuests];
                        updated[index].role = e.target.value;
                        setEvent(prev => ({ ...prev, vipGuests: updated }));
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                    >
                      <option value="guest_of_honor">Guest of Honor</option>
                      <option value="bride">Bride</option>
                      <option value="groom">Groom</option>
                      <option value="birthday_person">Birthday Person</option>
                      <option value="ceo">CEO</option>
                      <option value="speaker">Speaker</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Face Photo URL</label>
                    <input
                      type="url"
                      value={vip.faceImageUrl || ''}
                      onChange={(e) => {
                        const updated = [...event.vipGuests];
                        updated[index].faceImageUrl = e.target.value;
                        setEvent(prev => ({ ...prev, vipGuests: updated }));
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Personalized Greeting</label>
                  <textarea
                    value={vip.personalizedGreeting || ''}
                    onChange={(e) => {
                      const updated = [...event.vipGuests];
                      updated[index].personalizedGreeting = e.target.value;
                      setEvent(prev => ({ ...prev, vipGuests: updated }));
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                    placeholder="Ladies and gentlemen, please welcome the beautiful bride, Sarah!"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special Moments Tab */}
      {activeTab === 'moments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Special Moments & Cues</h3>
            <button
              onClick={addSpecialMoment}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
            >
              Add Moment
            </button>
          </div>

          <div className="space-y-3">
            {event.specialMoments.map((moment, index) => (
              <div key={moment.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Time</label>
                    <input
                      type="time"
                      value={moment.time}
                      onChange={(e) => {
                        const updated = [...event.specialMoments];
                        updated[index].time = e.target.value;
                        setEvent(prev => ({ ...prev, specialMoments: updated }));
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Type</label>
                    <select
                      value={moment.type}
                      onChange={(e) => {
                        const updated = [...event.specialMoments];
                        updated[index].type = e.target.value as any;
                        setEvent(prev => ({ ...prev, specialMoments: updated }));
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                    >
                      <option value="entrance">Grand Entrance</option>
                      <option value="speech">Speech</option>
                      <option value="cake_cutting">Cake Cutting</option>
                      <option value="first_dance">First Dance</option>
                      <option value="toast">Toast</option>
                      <option value="surprise">Surprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Music Cue</label>
                    <input
                      type="text"
                      value={moment.musicCue || ''}
                      onChange={(e) => {
                        const updated = [...event.specialMoments];
                        updated[index].musicCue = e.target.value;
                        setEvent(prev => ({ ...prev, specialMoments: updated }));
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      placeholder="Here Comes The Bride"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={moment.description}
                      onChange={(e) => {
                        const updated = [...event.specialMoments];
                        updated[index].description = e.target.value;
                        setEvent(prev => ({ ...prev, specialMoments: updated }));
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      placeholder="Bride and groom entrance"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Announcement Template</label>
                    <input
                      type="text"
                      value={moment.announcementTemplate || ''}
                      onChange={(e) => {
                        const updated = [...event.specialMoments];
                        updated[index].announcementTemplate = e.target.value;
                        setEvent(prev => ({ ...prev, specialMoments: updated }));
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      placeholder="It's time for the moment we've all been waiting for..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};