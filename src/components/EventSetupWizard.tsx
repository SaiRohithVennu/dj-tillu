import React, { useState } from 'react';
import { Calendar, Clock, Users, Bot, Upload, X, User, Briefcase } from 'lucide-react';

interface VIPPerson {
  id: string;
  name: string;
  role: string;
  imageFile?: File;
  imageUrl?: string;
  recognitionCount: number;
  lastSeen?: Date;
}

interface EventSetup {
  eventName: string;
  eventType: 'birthday' | 'corporate' | 'wedding' | 'party' | 'conference';
  duration: number;
  vipPeople: VIPPerson[];
  aiPersonality: 'humorous' | 'formal' | 'energetic' | 'professional';
}

interface EventSetupWizardProps {
  onSetupComplete: (setup: EventSetup) => void;
}

export const EventSetupWizard: React.FC<EventSetupWizardProps> = ({ onSetupComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [eventSetup, setEventSetup] = useState<EventSetup>({
    eventName: '',
    eventType: 'party',
    duration: 1,
    vipPeople: [],
    aiPersonality: 'energetic'
  });

  const eventTypes = [
    { value: 'birthday', label: 'Birthday Party', icon: '🎂', description: 'Celebrate special birthdays with personalized music and announcements' },
    { value: 'corporate', label: 'Corporate Event', icon: '🏢', description: 'Professional gatherings with networking and presentation support' },
    { value: 'wedding', label: 'Wedding', icon: '💒', description: 'Romantic celebrations with special moment recognition' },
    { value: 'party', label: 'Party', icon: '🎉', description: 'High-energy celebrations with crowd interaction' },
    { value: 'conference', label: 'Conference', icon: '🎤', description: 'Professional events with speaker introductions' }
  ];

  const durationOptions = [
    { value: 5/60, label: '5 minutes', description: 'Quick demo' },
    { value: 10/60, label: '10 minutes', description: 'Short event' },
    { value: 0.5, label: '30 minutes', description: 'Brief gathering' },
    { value: 1, label: '1 hour', description: 'Standard event' },
    { value: 2, label: '2 hours', description: 'Extended event' },
    { value: 3, label: '3 hours', description: 'Long celebration' },
    { value: 4, label: '4 hours', description: 'Full event' },
    { value: 6, label: '6 hours', description: 'All-day event' },
    { value: 8, label: '8 hours', description: 'Extended celebration' }
  ];

  const roleOptions = [
    'Birthday Person', 'CEO', 'Manager', 'Guest of Honor', 'Bride', 'Groom',
    'Speaker', 'VIP Guest', 'Intern', 'Team Lead', 'Director', 'Special Guest'
  ];

  const personalities = [
    { value: 'humorous', label: 'Humorous', icon: '😄', description: 'Witty and entertaining, makes people laugh' },
    { value: 'formal', label: 'Formal', icon: '🎩', description: 'Elegant and sophisticated, perfect for upscale events' },
    { value: 'energetic', label: 'Energetic', icon: '⚡', description: 'High-energy and enthusiastic, pumps up the crowd' },
    { value: 'professional', label: 'Professional', icon: '👔', description: 'Corporate-friendly and articulate' }
  ];

  const [newVIPPerson, setNewVIPPerson] = useState({
    name: '',
    role: 'VIP Guest',
    imageFile: null as File | null,
    imageUrl: ''
  });

  const handleAddVIPPerson = () => {
    if (!newVIPPerson.name.trim() || !newVIPPerson.imageFile) {
      alert('Please provide both name and photo for the VIP person');
      return;
    }

    const vipPerson: VIPPerson = {
      id: crypto.randomUUID(),
      name: newVIPPerson.name.trim(),
      role: newVIPPerson.role,
      imageFile: newVIPPerson.imageFile,
      imageUrl: newVIPPerson.imageUrl,
      recognitionCount: 0
    };

    setEventSetup(prev => ({
      ...prev,
      vipPeople: [...prev.vipPeople, vipPerson]
    }));

    // Reset form
    setNewVIPPerson({
      name: '',
      role: 'VIP Guest',
      imageFile: null,
      imageUrl: ''
    });
  };

  const handleRemoveVIPPerson = (id: string) => {
    setEventSetup(prev => ({
      ...prev,
      vipPeople: prev.vipPeople.filter(person => person.id !== id)
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewVIPPerson(prev => ({
        ...prev,
        imageFile: file,
        imageUrl: URL.createObjectURL(file)
      }));
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return eventSetup.eventName.trim().length > 0;
      case 2:
        return eventSetup.duration > 0;
      case 3:
        return true; // VIP people are optional
      case 4:
        return true; // AI personality has default
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      onSetupComplete(eventSetup);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/80" />
      
      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
        backgroundSize: '50px 50px'
      }} />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
              DJ Tillu
            </h1>
            <p className="text-xl text-gray-300 mb-8">AI-Powered Event Host & DJ</p>
            
            {/* Progress Indicator */}
            <div className="flex justify-center space-x-4 mb-8">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    step === currentStep
                      ? 'bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/50 scale-110'
                      : step < currentStep
                      ? 'bg-green-500 border-green-400 text-white'
                      : 'bg-black/30 border-gray-600 text-gray-400'
                  }`}
                >
                  {step < currentStep ? '✓' : step}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
            {/* Step 1: Event Type & Name */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="text-center">
                  <Calendar className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">Event Details</h2>
                  <p className="text-gray-300">Tell us about your event</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-medium text-gray-300 mb-3">Event Name</label>
                    <input
                      type="text"
                      value={eventSetup.eventName}
                      onChange={(e) => setEventSetup(prev => ({ ...prev, eventName: e.target.value }))}
                      className="w-full bg-black/20 border border-white/30 rounded-xl px-6 py-4 text-white text-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 backdrop-blur-sm"
                      placeholder="Sarah's Birthday Celebration"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-medium text-gray-300 mb-4">Event Type</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {eventTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setEventSetup(prev => ({ ...prev, eventType: type.value as any }))}
                          className={`p-6 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105 ${
                            eventSetup.eventType === type.value
                              ? 'bg-purple-500/30 border-purple-400 shadow-lg shadow-purple-500/30'
                              : 'bg-black/20 border-white/20 hover:bg-white/10 hover:border-white/40'
                          }`}
                        >
                          <div className="text-4xl mb-3">{type.icon}</div>
                          <h3 className="text-lg font-semibold text-white mb-2">{type.label}</h3>
                          <p className="text-sm text-gray-300">{type.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Duration */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="text-center">
                  <Clock className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">Event Duration</h2>
                  <p className="text-gray-300">How long will your event last?</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {durationOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setEventSetup(prev => ({ ...prev, duration: option.value }))}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 text-center hover:scale-105 ${
                        eventSetup.duration === option.value
                          ? 'bg-blue-500/30 border-blue-400 shadow-lg shadow-blue-500/30'
                          : 'bg-black/20 border-white/20 hover:bg-white/10 hover:border-white/40'
                      }`}
                    >
                      <div className="text-2xl font-bold text-white mb-2">{option.label}</div>
                      <p className="text-sm text-gray-300">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: VIP People */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="text-center">
                  <Users className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">VIP Recognition</h2>
                  <p className="text-gray-300">Upload photos of important people for AI recognition</p>
                </div>

                {/* Add VIP Person Form */}
                <div className="bg-black/30 rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-semibold text-white mb-4">Add VIP Person</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Photo</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="vip-photo-upload"
                        />
                        <label
                          htmlFor="vip-photo-upload"
                          className="block w-full h-32 border-2 border-dashed border-white/30 rounded-xl cursor-pointer hover:border-white/50 transition-colors"
                        >
                          {newVIPPerson.imageUrl ? (
                            <img
                              src={newVIPPerson.imageUrl}
                              alt="VIP Preview"
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                              <Upload className="w-8 h-8 text-gray-400 mb-2" />
                              <span className="text-gray-400">Upload Photo</span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Person Details */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                        <input
                          type="text"
                          value={newVIPPerson.name}
                          onChange={(e) => setNewVIPPerson(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-black/20 border border-white/30 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                          placeholder="Sarah Johnson"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                        <select
                          value={newVIPPerson.role}
                          onChange={(e) => setNewVIPPerson(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full bg-black/20 border border-white/30 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        >
                          {roleOptions.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={handleAddVIPPerson}
                        disabled={!newVIPPerson.name.trim() || !newVIPPerson.imageFile}
                        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Add VIP Person
                      </button>
                    </div>
                  </div>
                </div>

                {/* VIP People List */}
                {eventSetup.vipPeople.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">VIP People ({eventSetup.vipPeople.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {eventSetup.vipPeople.map((person) => (
                        <div
                          key={person.id}
                          className="bg-black/20 rounded-xl p-4 border border-white/20 backdrop-blur-sm"
                        >
                          <div className="flex items-center space-x-4">
                            {person.imageUrl && (
                              <img
                                src={person.imageUrl}
                                alt={person.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-white">{person.name}</h4>
                              <p className="text-gray-300">{person.role}</p>
                              <p className="text-xs text-purple-300 mt-1">
                                AI will announce: "Welcome {person.name}, our {person.role}!"
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveVIPPerson(person.id)}
                              className="p-2 text-red-400 hover:text-red-300 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: AI Personality */}
            {currentStep === 4 && (
              <div className="space-y-8">
                <div className="text-center">
                  <Bot className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">AI Personality</h2>
                  <p className="text-gray-300">Choose how your AI host should behave</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {personalities.map((personality) => (
                    <button
                      key={personality.value}
                      onClick={() => setEventSetup(prev => ({ ...prev, aiPersonality: personality.value as any }))}
                      className={`p-8 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105 ${
                        eventSetup.aiPersonality === personality.value
                          ? 'bg-yellow-500/30 border-yellow-400 shadow-lg shadow-yellow-500/30'
                          : 'bg-black/20 border-white/20 hover:bg-white/10 hover:border-white/40'
                      }`}
                    >
                      <div className="text-5xl mb-4">{personality.icon}</div>
                      <h3 className="text-xl font-semibold text-white mb-3">{personality.label}</h3>
                      <p className="text-gray-300">{personality.description}</p>
                    </button>
                  ))}
                </div>

                {/* Event Summary */}
                <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-6 border border-purple-500/30 backdrop-blur-sm">
                  <h3 className="text-xl font-semibold text-white mb-4">Event Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-gray-300">Event: <span className="text-white font-semibold">{eventSetup.eventName}</span></p>
                      <p className="text-gray-300">Type: <span className="text-white font-semibold">{eventSetup.eventType}</span></p>
                      <p className="text-gray-300">Duration: <span className="text-white font-semibold">
                        {eventSetup.duration < 1 ? `${Math.round(eventSetup.duration * 60)} minutes` : `${eventSetup.duration} hour${eventSetup.duration > 1 ? 's' : ''}`}
                      </span></p>
                    </div>
                    <div>
                      <p className="text-gray-300">VIP People: <span className="text-white font-semibold">{eventSetup.vipPeople.length}</span></p>
                      <p className="text-gray-300">AI Personality: <span className="text-white font-semibold">{eventSetup.aiPersonality}</span></p>
                      <p className="text-gray-300">Face Recognition: <span className="text-green-400 font-semibold">
                        {eventSetup.vipPeople.length > 0 ? 'Enabled' : 'Disabled'}
                      </span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-12">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-8 py-4 bg-black/30 hover:bg-black/50 disabled:bg-black/10 disabled:cursor-not-allowed border border-white/20 rounded-xl transition-all duration-300 text-white disabled:text-gray-500"
              >
                Back
              </button>

              <button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl transition-all duration-300 text-white font-semibold shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {currentStep === 4 ? 'Start Event!' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSetupWizard;