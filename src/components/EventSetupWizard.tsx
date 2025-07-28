import React, { useState, useRef } from 'react';
import { Calendar, Clock, Users, Upload, Mic, Play, Pause, Settings, Camera, X, CheckCircle, AlertCircle } from 'lucide-react';

interface EventDetails {
  id: string;
  name: string;
  type: 'wedding' | 'birthday' | 'corporate' | 'party' | 'festival' | 'club';
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  description: string;
  expectedAttendees: number;
  musicEnabled: boolean;
  musicPreferences: string[];
  specialMoments: SpecialMoment[];
  vipGuests: VIPGuest[];
  aiVoiceSettings: AIVoiceSettings;
  eventFlow: EventFlowItem[];
}

interface SpecialMoment {
  id: string;
  time: string;
  type: 'entrance' | 'speech' | 'cake_cutting' | 'first_dance' | 'toast' | 'surprise' | 'award' | 'presentation';
  description: string;
  musicCue?: string;
  announcementTemplate?: string;
}

interface VIPGuest {
  id: string;
  name: string;
  role: string;
  description: string;
  faceImage: File | null;
  faceImageUrl?: string;
  personalizedGreeting: string;
  importance: 'high' | 'medium' | 'low';
}

interface AIVoiceSettings {
  voiceType: 'professional' | 'friendly' | 'energetic' | 'elegant' | 'casual';
  speed: number; // 0.5 to 2.0
  pitch: number; // 0.5 to 2.0
  volume: number; // 0 to 100
  announcementStyle: 'formal' | 'casual' | 'party' | 'wedding' | 'corporate';
}

interface EventFlowItem {
  id: string;
  time: string;
  phase: 'arrival' | 'cocktail' | 'dinner' | 'dancing' | 'closing' | 'presentation' | 'ceremony';
  energyTarget: number;
  musicStyle: string;
  duration: number;
  description: string;
}

interface EventSetupWizardProps {
  onEventConfigured: (eventDetails: EventDetails) => void;
  onClose: () => void;
}

export const EventSetupWizard: React.FC<EventSetupWizardProps> = ({
  onEventConfigured,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [eventDetails, setEventDetails] = useState<EventDetails>({
    id: crypto.randomUUID(),
    name: '',
    type: 'party',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    description: '',
    expectedAttendees: 50,
    musicEnabled: true,
    musicPreferences: [],
    specialMoments: [],
    vipGuests: [],
    aiVoiceSettings: {
      voiceType: 'friendly',
      speed: 1.0,
      pitch: 1.0,
      volume: 80,
      announcementStyle: 'casual'
    },
    eventFlow: []
  });

  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const eventTypes = [
    { value: 'wedding', label: 'Wedding', icon: '💒', description: 'Wedding ceremony and reception' },
    { value: 'birthday', label: 'Birthday Party', icon: '🎂', description: 'Birthday celebration' },
    { value: 'corporate', label: 'Corporate Event', icon: '🏢', description: 'Business meeting or conference' },
    { value: 'party', label: 'Party', icon: '🎉', description: 'General celebration or party' },
    { value: 'festival', label: 'Festival', icon: '🎪', description: 'Music festival or cultural event' },
    { value: 'club', label: 'Club Night', icon: '🕺', description: 'Nightclub or dance event' }
  ];

  const musicGenres = [
    'Electronic', 'Pop', 'Hip Hop', 'Rock', 'Jazz', 'Classical',
    'Reggae', 'Country', 'R&B', 'Latin', 'Bollywood', 'Afrobeats',
    'House', 'Techno', 'Trance', 'Ambient', 'Funk', 'Soul'
  ];

  const voiceTypes = [
    { value: 'professional', label: 'Professional', description: 'Clear, authoritative voice for corporate events' },
    { value: 'friendly', label: 'Friendly', description: 'Warm, welcoming voice for casual events' },
    { value: 'energetic', label: 'Energetic', description: 'Upbeat, exciting voice for parties' },
    { value: 'elegant', label: 'Elegant', description: 'Sophisticated voice for formal events' },
    { value: 'casual', label: 'Casual', description: 'Relaxed, conversational voice' }
  ];

  const handleImageUpload = async (guestId: string, file: File) => {
    setUploadingImage(guestId);
    
    // Create object URL for preview
    const imageUrl = URL.createObjectURL(file);
    
    // Update guest with image
    setEventDetails(prev => ({
      ...prev,
      vipGuests: prev.vipGuests.map(guest => 
        guest.id === guestId 
          ? { ...guest, faceImage: file, faceImageUrl: imageUrl }
          : guest
      )
    }));
    
    setUploadingImage(null);
  };

  const addVIPGuest = () => {
    const newGuest: VIPGuest = {
      id: crypto.randomUUID(),
      name: '',
      role: '',
      description: '',
      faceImage: null,
      personalizedGreeting: '',
      importance: 'medium'
    };
    
    setEventDetails(prev => ({
      ...prev,
      vipGuests: [...prev.vipGuests, newGuest]
    }));
  };

  const removeVIPGuest = (guestId: string) => {
    setEventDetails(prev => ({
      ...prev,
      vipGuests: prev.vipGuests.filter(guest => guest.id !== guestId)
    }));
  };

  const addSpecialMoment = () => {
    const newMoment: SpecialMoment = {
      id: crypto.randomUUID(),
      time: '',
      type: 'entrance',
      description: '',
      musicCue: '',
      announcementTemplate: ''
    };
    
    setEventDetails(prev => ({
      ...prev,
      specialMoments: [...prev.specialMoments, newMoment]
    }));
  };

  const addEventPhase = () => {
    const newPhase: EventFlowItem = {
      id: crypto.randomUUID(),
      time: '',
      phase: 'arrival',
      energyTarget: 5,
      musicStyle: 'Background',
      duration: 30,
      description: ''
    };
    
    setEventDetails(prev => ({
      ...prev,
      eventFlow: [...prev.eventFlow, newPhase]
    }));
  };

  const testVoice = () => {
    if ('speechSynthesis' in window) {
      setIsTestingVoice(true);
      
      const testMessage = `Hello! I'm your AI DJ assistant. Welcome to ${eventDetails.name || 'your event'}! This is how I'll sound during your event.`;
      
      const utterance = new SpeechSynthesisUtterance(testMessage);
      utterance.rate = eventDetails.aiVoiceSettings.speed;
      utterance.pitch = eventDetails.aiVoiceSettings.pitch;
      utterance.volume = eventDetails.aiVoiceSettings.volume / 100;
      
      utterance.onend = () => setIsTestingVoice(false);
      utterance.onerror = () => setIsTestingVoice(false);
      
      speechSynthesis.speak(utterance);
    }
  };

  const handleFinish = () => {
    // Validate required fields
    if (!eventDetails.name || !eventDetails.date || !eventDetails.startTime) {
      alert('Please fill in all required fields (Event Name, Date, Start Time)');
      return;
    }
    
    console.log('🎪 Event configured:', eventDetails);
    onEventConfigured(eventDetails);
  };

  const steps = [
    { id: 1, title: 'Basic Info', icon: Calendar },
    { id: 2, title: 'VIP Guests', icon: Users },
    { id: 3, title: 'Event Flow', icon: Clock },
    { id: 4, title: 'AI Voice', icon: Mic },
    { id: 5, title: 'Review', icon: CheckCircle }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-purple-500/30 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">Smart Event Setup</h2>
            <p className="text-gray-300 text-sm">Configure your AI DJ assistant</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center p-4 border-b border-white/10">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                currentStep >= step.id 
                  ? 'bg-purple-600 border-purple-600 text-white' 
                  : 'border-gray-600 text-gray-400'
              }`}>
                <step.icon className="w-4 h-4" />
              </div>
              <span className={`ml-2 text-sm ${
                currentStep >= step.id ? 'text-white' : 'text-gray-400'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-purple-600' : 'bg-gray-600'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">Event Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Event Name *</label>
                  <input
                    type="text"
                    value={eventDetails.name}
                    onChange={(e) => setEventDetails(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                    placeholder="Sarah's Wedding Reception"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Event Type</label>
                  <select
                    value={eventDetails.type}
                    onChange={(e) => setEventDetails(prev => ({ ...prev, type: e.target.value as any }))}
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date *</label>
                  <input
                    type="date"
                    value={eventDetails.date}
                    onChange={(e) => setEventDetails(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Time *</label>
                  <input
                    type="time"
                    value={eventDetails.startTime}
                    onChange={(e) => setEventDetails(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                  <input
                    type="time"
                    value={eventDetails.endTime}
                    onChange={(e) => setEventDetails(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Venue</label>
                <input
                  type="text"
                  value={eventDetails.venue}
                  onChange={(e) => setEventDetails(prev => ({ ...prev, venue: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Grand Ballroom, Hotel Paradise"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Description</label>
                <textarea
                  value={eventDetails.description}
                  onChange={(e) => setEventDetails(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  rows={3}
                  placeholder="Brief description of your event..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Expected Attendees</label>
                  <input
                    type="number"
                    value={eventDetails.expectedAttendees}
                    onChange={(e) => setEventDetails(prev => ({ ...prev, expectedAttendees: Number(e.target.value) }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Music Enabled</label>
                  <div className="flex items-center space-x-4 mt-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={eventDetails.musicEnabled}
                        onChange={() => setEventDetails(prev => ({ ...prev, musicEnabled: true }))}
                        className="mr-2"
                      />
                      <span className="text-white">Yes, play music</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!eventDetails.musicEnabled}
                        onChange={() => setEventDetails(prev => ({ ...prev, musicEnabled: false }))}
                        className="mr-2"
                      />
                      <span className="text-white">No music</span>
                    </label>
                  </div>
                </div>
              </div>

              {eventDetails.musicEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Music Preferences</label>
                  <div className="grid grid-cols-3 gap-2">
                    {musicGenres.map(genre => (
                      <label key={genre} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={eventDetails.musicPreferences.includes(genre)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEventDetails(prev => ({
                                ...prev,
                                musicPreferences: [...prev.musicPreferences, genre]
                              }));
                            } else {
                              setEventDetails(prev => ({
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
              )}
            </div>
          )}

          {/* Step 2: VIP Guests */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">VIP Guests & Face Recognition</h3>
                <button
                  onClick={addVIPGuest}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add VIP Guest
                </button>
              </div>

              <p className="text-gray-300 text-sm">
                Upload photos of important guests for AI recognition and personalized announcements.
              </p>

              <div className="space-y-4">
                {eventDetails.vipGuests.map((guest, index) => (
                  <div key={guest.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="text-white font-medium">VIP Guest #{index + 1}</h4>
                      <button
                        onClick={() => removeVIPGuest(guest.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={guest.name}
                          onChange={(e) => {
                            const updated = [...eventDetails.vipGuests];
                            updated[index].name = e.target.value;
                            setEventDetails(prev => ({ ...prev, vipGuests: updated }));
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                          placeholder="Sarah Johnson"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Role/Title</label>
                        <input
                          type="text"
                          value={guest.role}
                          onChange={(e) => {
                            const updated = [...eventDetails.vipGuests];
                            updated[index].role = e.target.value;
                            setEventDetails(prev => ({ ...prev, vipGuests: updated }));
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                          placeholder="Bride, CEO, Guest of Honor"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs text-gray-400 mb-1">Description</label>
                      <textarea
                        value={guest.description}
                        onChange={(e) => {
                          const updated = [...eventDetails.vipGuests];
                          updated[index].description = e.target.value;
                          setEventDetails(prev => ({ ...prev, vipGuests: updated }));
                        }}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                        rows={2}
                        placeholder="Brief description of who this person is and their importance..."
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs text-gray-400 mb-1">Face Photo</label>
                      <div className="flex items-center space-x-4">
                        {guest.faceImageUrl ? (
                          <div className="relative">
                            <img
                              src={guest.faceImageUrl}
                              alt={guest.name}
                              className="w-16 h-16 rounded-lg object-cover border border-gray-600"
                            />
                            <button
                              onClick={() => {
                                const updated = [...eventDetails.vipGuests];
                                updated[index].faceImage = null;
                                updated[index].faceImageUrl = undefined;
                                setEventDetails(prev => ({ ...prev, vipGuests: updated }));
                              }}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-700 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(guest.id, file);
                              }
                            }}
                            className="hidden"
                            id={`face-upload-${guest.id}`}
                          />
                          <label
                            htmlFor={`face-upload-${guest.id}`}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm cursor-pointer transition-colors flex items-center"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {uploadingImage === guest.id ? 'Uploading...' : 'Upload Photo'}
                          </label>
                          <p className="text-xs text-gray-400 mt-1">Clear face photo for best recognition</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs text-gray-400 mb-1">Personalized Greeting</label>
                      <textarea
                        value={guest.personalizedGreeting}
                        onChange={(e) => {
                          const updated = [...eventDetails.vipGuests];
                          updated[index].personalizedGreeting = e.target.value;
                          setEventDetails(prev => ({ ...prev, vipGuests: updated }));
                        }}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                        rows={2}
                        placeholder="Ladies and gentlemen, please welcome our beautiful bride, Sarah!"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Importance Level</label>
                      <select
                        value={guest.importance}
                        onChange={(e) => {
                          const updated = [...eventDetails.vipGuests];
                          updated[index].importance = e.target.value as any;
                          setEventDetails(prev => ({ ...prev, vipGuests: updated }));
                        }}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      >
                        <option value="high">High - Always announce</option>
                        <option value="medium">Medium - Announce once</option>
                        <option value="low">Low - Quiet recognition</option>
                      </select>
                    </div>
                  </div>
                ))}

                {eventDetails.vipGuests.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
                    <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-300 mb-2">No VIP guests added yet</p>
                    <p className="text-gray-400 text-sm">Add important guests for AI recognition</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Event Flow */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Event Timeline & Special Moments</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={addEventPhase}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm flex items-center"
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Add Phase
                  </button>
                  <button
                    onClick={addSpecialMoment}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm flex items-center"
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Add Moment
                  </button>
                </div>
              </div>

              {/* Event Phases */}
              <div>
                <h4 className="text-lg font-medium text-white mb-3">Event Phases</h4>
                <div className="space-y-3">
                  {eventDetails.eventFlow.map((phase, index) => (
                    <div key={phase.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
                      <div className="grid grid-cols-5 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Time</label>
                          <input
                            type="time"
                            value={phase.time}
                            onChange={(e) => {
                              const updated = [...eventDetails.eventFlow];
                              updated[index].time = e.target.value;
                              setEventDetails(prev => ({ ...prev, eventFlow: updated }));
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Phase</label>
                          <select
                            value={phase.phase}
                            onChange={(e) => {
                              const updated = [...eventDetails.eventFlow];
                              updated[index].phase = e.target.value as any;
                              setEventDetails(prev => ({ ...prev, eventFlow: updated }));
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                          >
                            <option value="arrival">Arrival</option>
                            <option value="cocktail">Cocktail</option>
                            <option value="ceremony">Ceremony</option>
                            <option value="dinner">Dinner</option>
                            <option value="presentation">Presentation</option>
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
                            value={phase.energyTarget}
                            onChange={(e) => {
                              const updated = [...eventDetails.eventFlow];
                              updated[index].energyTarget = Number(e.target.value);
                              setEventDetails(prev => ({ ...prev, eventFlow: updated }));
                            }}
                            className="w-full"
                          />
                          <span className="text-xs text-purple-300">{phase.energyTarget}</span>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Music Style</label>
                          <input
                            type="text"
                            value={phase.musicStyle}
                            onChange={(e) => {
                              const updated = [...eventDetails.eventFlow];
                              updated[index].musicStyle = e.target.value;
                              setEventDetails(prev => ({ ...prev, eventFlow: updated }));
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                            placeholder="Background, Upbeat, etc."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Duration (min)</label>
                          <input
                            type="number"
                            value={phase.duration}
                            onChange={(e) => {
                              const updated = [...eventDetails.eventFlow];
                              updated[index].duration = Number(e.target.value);
                              setEventDetails(prev => ({ ...prev, eventFlow: updated }));
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Moments */}
              <div>
                <h4 className="text-lg font-medium text-white mb-3">Special Moments</h4>
                <div className="space-y-3">
                  {eventDetails.specialMoments.map((moment, index) => (
                    <div key={moment.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Time</label>
                          <input
                            type="time"
                            value={moment.time}
                            onChange={(e) => {
                              const updated = [...eventDetails.specialMoments];
                              updated[index].time = e.target.value;
                              setEventDetails(prev => ({ ...prev, specialMoments: updated }));
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Type</label>
                          <select
                            value={moment.type}
                            onChange={(e) => {
                              const updated = [...eventDetails.specialMoments];
                              updated[index].type = e.target.value as any;
                              setEventDetails(prev => ({ ...prev, specialMoments: updated }));
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                          >
                            <option value="entrance">Grand Entrance</option>
                            <option value="speech">Speech</option>
                            <option value="cake_cutting">Cake Cutting</option>
                            <option value="first_dance">First Dance</option>
                            <option value="toast">Toast</option>
                            <option value="award">Award Ceremony</option>
                            <option value="presentation">Presentation</option>
                            <option value="surprise">Surprise</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Music Cue</label>
                          <input
                            type="text"
                            value={moment.musicCue || ''}
                            onChange={(e) => {
                              const updated = [...eventDetails.specialMoments];
                              updated[index].musicCue = e.target.value;
                              setEventDetails(prev => ({ ...prev, specialMoments: updated }));
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                            placeholder="Song name or style"
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
                              const updated = [...eventDetails.specialMoments];
                              updated[index].description = e.target.value;
                              setEventDetails(prev => ({ ...prev, specialMoments: updated }));
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                            placeholder="What's happening at this moment"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Announcement Template</label>
                          <input
                            type="text"
                            value={moment.announcementTemplate || ''}
                            onChange={(e) => {
                              const updated = [...eventDetails.specialMoments];
                              updated[index].announcementTemplate = e.target.value;
                              setEventDetails(prev => ({ ...prev, specialMoments: updated }));
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                            placeholder="Custom announcement text"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: AI Voice */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">AI Voice Settings</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Voice Type</label>
                  <div className="space-y-2">
                    {voiceTypes.map(voice => (
                      <label key={voice.value} className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg border border-gray-600 hover:border-purple-500 transition-colors cursor-pointer">
                        <input
                          type="radio"
                          name="voiceType"
                          value={voice.value}
                          checked={eventDetails.aiVoiceSettings.voiceType === voice.value}
                          onChange={(e) => setEventDetails(prev => ({
                            ...prev,
                            aiVoiceSettings: { ...prev.aiVoiceSettings, voiceType: e.target.value as any }
                          }))}
                          className="mt-1"
                        />
                        <div>
                          <div className="text-white font-medium">{voice.label}</div>
                          <div className="text-gray-400 text-sm">{voice.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Speech Speed: {eventDetails.aiVoiceSettings.speed}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={eventDetails.aiVoiceSettings.speed}
                      onChange={(e) => setEventDetails(prev => ({
                        ...prev,
                        aiVoiceSettings: { ...prev.aiVoiceSettings, speed: Number(e.target.value) }
                      }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Pitch: {eventDetails.aiVoiceSettings.pitch}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={eventDetails.aiVoiceSettings.pitch}
                      onChange={(e) => setEventDetails(prev => ({
                        ...prev,
                        aiVoiceSettings: { ...prev.aiVoiceSettings, pitch: Number(e.target.value) }
                      }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Volume: {eventDetails.aiVoiceSettings.volume}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={eventDetails.aiVoiceSettings.volume}
                      onChange={(e) => setEventDetails(prev => ({
                        ...prev,
                        aiVoiceSettings: { ...prev.aiVoiceSettings, volume: Number(e.target.value) }
                      }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Announcement Style</label>
                    <select
                      value={eventDetails.aiVoiceSettings.announcementStyle}
                      onChange={(e) => setEventDetails(prev => ({
                        ...prev,
                        aiVoiceSettings: { ...prev.aiVoiceSettings, announcementStyle: e.target.value as any }
                      }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="formal">Formal - Professional tone</option>
                      <option value="casual">Casual - Friendly tone</option>
                      <option value="party">Party - Energetic tone</option>
                      <option value="wedding">Wedding - Elegant tone</option>
                      <option value="corporate">Corporate - Business tone</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={testVoice}
                    disabled={isTestingVoice}
                    className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {isTestingVoice ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Testing Voice...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Test Voice
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">Review & Confirm</h3>
              
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                <h4 className="text-white font-medium mb-3">Event Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Event:</span>
                    <span className="text-white ml-2">{eventDetails.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white ml-2 capitalize">{eventDetails.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white ml-2">{eventDetails.date}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Time:</span>
                    <span className="text-white ml-2">{eventDetails.startTime} - {eventDetails.endTime}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Venue:</span>
                    <span className="text-white ml-2">{eventDetails.venue || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Attendees:</span>
                    <span className="text-white ml-2">{eventDetails.expectedAttendees}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Music:</span>
                    <span className="text-white ml-2">{eventDetails.musicEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">VIP Guests:</span>
                    <span className="text-white ml-2">{eventDetails.vipGuests.length}</span>
                  </div>
                </div>
              </div>

              {eventDetails.vipGuests.length > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                  <h4 className="text-white font-medium mb-3">VIP Guests</h4>
                  <div className="space-y-2">
                    {eventDetails.vipGuests.map(guest => (
                      <div key={guest.id} className="flex items-center space-x-3">
                        {guest.faceImageUrl && (
                          <img src={guest.faceImageUrl} alt={guest.name} className="w-8 h-8 rounded-full object-cover" />
                        )}
                        <div>
                          <span className="text-white font-medium">{guest.name}</span>
                          <span className="text-gray-400 ml-2">({guest.role})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-green-600/20 border border-green-500/40 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-300 font-medium">Ready to Start!</span>
                </div>
                <p className="text-green-200 text-sm">
                  Your AI DJ assistant is configured and ready to manage your event. 
                  It will recognize VIP guests, make announcements, and adapt music based on the crowd's mood.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Previous
          </button>
          
          <span className="text-gray-300 text-sm">
            Step {currentStep} of {steps.length}
          </span>
          
          {currentStep < steps.length ? (
            <button
              onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"
            >
              Start AI DJ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};