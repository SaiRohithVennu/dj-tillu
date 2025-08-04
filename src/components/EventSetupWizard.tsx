import React, { useState } from 'react';
import { Calendar, Clock, Users, Music, Sparkles, Camera, Upload, X, Plus, User } from 'lucide-react';

export interface VIPPerson {
  id: string;
  name: string;
  role: string;
  imageFile?: File;
  imageUrl?: string;
}

export interface EventDetails {
  name: string;
  type: string;
  duration: number;
  expectedGuests: number;
  vipPeople: VIPPerson[];
  aiPersonality: 'energetic' | 'professional' | 'casual' | 'elegant';
  enableVideoAnalysis: boolean;
  enableFaceRecognition: boolean;
  enableVoiceAnnouncements: boolean;
}

interface EventSetupWizardProps {
  onComplete: (eventDetails: EventDetails) => void;
  onSkip: () => void;
}

const EventSetupWizard: React.FC<EventSetupWizardProps> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState(1);
  const [eventDetails, setEventDetails] = useState<EventDetails>({
    name: '',
    type: 'party',
    duration: 120,
    expectedGuests: 20,
    vipPeople: [],
    aiPersonality: 'energetic',
    enableVideoAnalysis: true,
    enableFaceRecognition: true,
    enableVoiceAnnouncements: true,
  });

  const eventTypes = [
    { id: 'party', name: 'Party', icon: '🎉' },
    { id: 'wedding', name: 'Wedding', icon: '💒' },
    { id: 'corporate', name: 'Corporate Event', icon: '🏢' },
    { id: 'birthday', name: 'Birthday', icon: '🎂' },
    { id: 'conference', name: 'Conference', icon: '🎤' },
    { id: 'other', name: 'Other', icon: '🎪' },
  ];

  const personalities = [
    { id: 'energetic', name: 'Energetic', description: 'High energy, pumps up the crowd' },
    { id: 'professional', name: 'Professional', description: 'Polished, corporate-friendly' },
    { id: 'casual', name: 'Casual', description: 'Relaxed, friendly atmosphere' },
    { id: 'elegant', name: 'Elegant', description: 'Sophisticated, refined style' },
  ];

  const addVIPPerson = () => {
    const newPerson: VIPPerson = {
      id: Date.now().toString(),
      name: '',
      role: '',
    };
    setEventDetails(prev => ({
      ...prev,
      vipPeople: [...prev.vipPeople, newPerson],
    }));
  };

  const updateVIPPerson = (id: string, updates: Partial<VIPPerson>) => {
    setEventDetails(prev => ({
      ...prev,
      vipPeople: prev.vipPeople.map(person =>
        person.id === id ? { ...person, ...updates } : person
      ),
    }));
  };

  const removeVIPPerson = (id: string) => {
    setEventDetails(prev => ({
      ...prev,
      vipPeople: prev.vipPeople.filter(person => person.id !== id),
    }));
  };

  const handleImageUpload = (personId: string, file: File) => {
    const imageUrl = URL.createObjectURL(file);
    updateVIPPerson(personId, { imageFile: file, imageUrl });
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    onComplete(eventDetails);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                Event Setup Wizard
              </h2>
              <p className="text-gray-600 mt-1">Configure your AI DJ experience</p>
            </div>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip Setup
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Step {step} of 4</span>
              <span>{Math.round((step / 4) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Event Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Name
                    </label>
                    <input
                      type="text"
                      value={eventDetails.name}
                      onChange={(e) => setEventDetails(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Sarah's Birthday Party"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Type
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {eventTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setEventDetails(prev => ({ ...prev, type: type.id }))}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            eventDetails.type === type.id
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-2xl mb-1">{type.icon}</div>
                          <div className="text-sm font-medium">{type.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={eventDetails.duration}
                        onChange={(e) => setEventDetails(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        min="30"
                        max="480"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Guests
                      </label>
                      <input
                        type="number"
                        value={eventDetails.expectedGuests}
                        onChange={(e) => setEventDetails(prev => ({ ...prev, expectedGuests: parseInt(e.target.value) }))}
                        min="1"
                        max="500"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  VIP People
                </h3>
                <p className="text-gray-600 mb-4">
                  Add important people who should get personalized announcements when they arrive.
                </p>

                <div className="space-y-4">
                  {eventDetails.vipPeople.map((person) => (
                    <div key={person.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {person.imageUrl ? (
                            <img
                              src={person.imageUrl}
                              alt={person.name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <label className="mt-2 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(person.id, file);
                              }}
                              className="hidden"
                            />
                            <div className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1">
                              <Upload className="w-3 h-3" />
                              Upload
                            </div>
                          </label>
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            value={person.name}
                            onChange={(e) => updateVIPPerson(person.id, { name: e.target.value })}
                            placeholder="Person's name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={person.role}
                            onChange={(e) => updateVIPPerson(person.id, { role: e.target.value })}
                            placeholder="Role (e.g., Birthday Girl, CEO, Best Man)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        
                        <button
                          onClick={() => removeVIPPerson(person.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addVIPPerson}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add VIP Person
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5 text-purple-600" />
                  AI Personality
                </h3>
                <p className="text-gray-600 mb-4">
                  Choose how your AI DJ should behave and interact with guests.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {personalities.map((personality) => (
                    <button
                      key={personality.id}
                      onClick={() => setEventDetails(prev => ({ ...prev, aiPersonality: personality.id as any }))}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        eventDetails.aiPersonality === personality.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 mb-1">{personality.name}</div>
                      <div className="text-sm text-gray-600">{personality.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-purple-600" />
                  AI Features
                </h3>
                <p className="text-gray-600 mb-4">
                  Configure which AI features you'd like to enable for your event.
                </p>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={eventDetails.enableVideoAnalysis}
                      onChange={(e) => setEventDetails(prev => ({ ...prev, enableVideoAnalysis: e.target.checked }))}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Video Analysis</div>
                      <div className="text-sm text-gray-600">AI watches the crowd and adapts music to the mood</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={eventDetails.enableFaceRecognition}
                      onChange={(e) => setEventDetails(prev => ({ ...prev, enableFaceRecognition: e.target.checked }))}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Face Recognition</div>
                      <div className="text-sm text-gray-600">Recognizes VIP people and makes personalized announcements</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={eventDetails.enableVoiceAnnouncements}
                      onChange={(e) => setEventDetails(prev => ({ ...prev, enableVoiceAnnouncements: e.target.checked }))}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Voice Announcements</div>
                      <div className="text-sm text-gray-600">AI makes live announcements and interacts with guests</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-3">
            {step < 4 ? (
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Start DJ Tillu!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSetupWizard;

export { EventSetupWizard }