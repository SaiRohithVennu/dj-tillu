import React, { useState } from 'react';
import { Calendar, Users, Mic, Upload, X, Plus, Save, ArrowRight } from 'lucide-react';

interface VIPPerson {
  id: string;
  name: string;
  role: string;
  imageFile?: File;
  imageUrl?: string;
  greeting?: string;
}

interface EventSetup {
  eventName: string;
  eventType: 'birthday' | 'corporate' | 'wedding' | 'party' | 'conference';
  duration: number; // in hours
  vipPeople: VIPPerson[];
  aiPersonality: 'humorous' | 'formal' | 'energetic' | 'professional';
  specialMoments: string[];
}

interface EventSetupWizardProps {
  onSetupComplete: (setup: EventSetup) => void;
  onSkip: () => void;
}

export const EventSetupWizard: React.FC<EventSetupWizardProps> = ({
  onSetupComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [setup, setSetup] = useState<EventSetup>({
    eventName: '',
    eventType: 'party',
    duration: 4,
    vipPeople: [],
    aiPersonality: 'energetic',
    specialMoments: []
  });

  const eventTypes = [
    { value: 'birthday', label: 'Birthday Party', icon: '🎂', description: 'Celebrate with cake, songs, and fun!' },
    { value: 'corporate', label: 'Corporate Event', icon: '🏢', description: 'Professional networking and presentations' },
    { value: 'wedding', label: 'Wedding', icon: '💒', description: 'Romantic celebration with special moments' },
    { value: 'party', label: 'General Party', icon: '🎉', description: 'Fun gathering with music and dancing' },
    { value: 'conference', label: 'Conference', icon: '🎤', description: 'Professional talks and presentations' }
  ];

  const aiPersonalities = [
    { 
      value: 'humorous', 
      label: 'Humorous DJ', 
      icon: '😄', 
      description: 'Fun, witty, and entertaining announcements',
      example: '"Well, well, well... look who decided to show up! Give it up for our birthday star!"'
    },
    { 
      value: 'formal', 
      label: 'Formal Host', 
      icon: '🎩', 
      description: 'Professional and elegant announcements',
      example: '"Ladies and gentlemen, please join me in welcoming our distinguished CEO, Mr. Johnson."'
    },
    { 
      value: 'energetic', 
      label: 'Energetic Emcee', 
      icon: '⚡', 
      description: 'High-energy, pump-up style announcements',
      example: '"THE CEO IS HERE! Give it up for our amazing leader! Let\'s show them what ENERGY looks like!"'
    },
    { 
      value: 'professional', 
      label: 'Professional Host', 
      icon: '👔', 
      description: 'Corporate-friendly, clear announcements',
      example: '"We are pleased to announce the arrival of our Chief Executive Officer. Please join me in extending a warm corporate welcome."'
    }
  ];

  const addVIPPerson = () => {
    const newPerson: VIPPerson = {
      id: crypto.randomUUID(),
      name: '',
      role: setup.eventType === 'birthday' ? 'Birthday Person' : 
            setup.eventType === 'corporate' ? 'CEO' :
            setup.eventType === 'wedding' ? 'Bride' : 'VIP Guest',
      greeting: ''
    };
    setSetup(prev => ({
      ...prev,
      vipPeople: [...prev.vipPeople, newPerson]
    }));
  };

  const updateVIPPerson = (id: string, updates: Partial<VIPPerson>) => {
    setSetup(prev => ({
      ...prev,
      vipPeople: prev.vipPeople.map(person => 
        person.id === id ? { ...person, ...updates } : person
      )
    }));
  };

  const removeVIPPerson = (id: string) => {
    setSetup(prev => ({
      ...prev,
      vipPeople: prev.vipPeople.filter(person => person.id !== id)
    }));
  };

  const handleImageUpload = (personId: string, file: File) => {
    const imageUrl = URL.createObjectURL(file);
    updateVIPPerson(personId, { imageFile: file, imageUrl });
  };

  const generateDefaultGreeting = (person: VIPPerson) => {
    const greetings = {
      humorous: {
        'Birthday Person': `🎂 Hold up everyone! The birthday legend has arrived! ${person.name}, you're officially older and hopefully wiser! Let's sing!`,
        'CEO': `📈 Alert! Alert! The big boss ${person.name} is in the building! Everyone look busy! Just kidding - let's give them a warm welcome!`,
        'Intern': `👋 Look who's here! Our amazing intern ${person.name} has joined us! Don't worry, we won't make you get coffee... yet! Welcome!`,
        'Manager': `👔 The manager ${person.name} has entered the building! Everyone pretend you've been working hard! Just kidding - welcome!`,
        'Bride': `👰 Here comes the bride! Everyone, please welcome the absolutely stunning ${person.name}! Tissues are available at the back!`,
        'VIP Guest': `⭐ VIP alert! ${person.name} has graced us with their presence! Let's show them some love!`,
        'Guest Speaker': `🎤 Our guest speaker ${person.name} is here! Get ready for some wisdom, insights, and hopefully no boring PowerPoints!`,
        'Team Lead': `🚀 Team lead ${person.name} has arrived! Time to show them what we've been working on! Let's make them proud!`
      },
      formal: {
        'Birthday Person': `🎉 Ladies and gentlemen, please join me in celebrating ${person.name} on this very special day. Happy Birthday!`,
        'CEO': `🏢 It is my honor to welcome our esteemed CEO, ${person.name}. Please join me in extending a warm corporate welcome.`,
        'Intern': `👋 Please join me in welcoming our intern, ${person.name}. We are pleased to have you as part of our team.`,
        'Manager': `👔 We are honored to welcome our manager, ${person.name}. Thank you for your leadership and guidance.`,
        'Bride': `💒 We are gathered here today to celebrate love. Please welcome our beautiful bride, ${person.name}.`,
        'VIP Guest': `✨ Please join me in welcoming our distinguished guest, ${person.name}.`,
        'Guest Speaker': `🎤 It is our privilege to welcome our distinguished guest speaker, ${person.name}. Please give them your full attention.`,
        'Team Lead': `🚀 Please join me in welcoming our team lead, ${person.name}. We appreciate your dedication to our success.`
      },
      energetic: {
        'Birthday Person': `🎂 BIRTHDAY SUPERSTAR ALERT! ${person.name} is HERE! Let's get this party STARTED! Everybody scream HAPPY BIRTHDAY!`,
        'CEO': `🚀 THE BOSS IS HERE! Give it up for ${person.name}! Let's show them what ENERGY looks like!`,
        'Intern': `👋 INTERN POWER! ${person.name} is in the house! Fresh energy, fresh ideas! Let's GO!`,
        'Manager': `👔 MANAGER ON DECK! ${person.name} is HERE! Time to show them what TEAMWORK looks like! YEAH!`,
        'Bride': `💒 HERE COMES THE BRIDE! Everyone on your feet for the absolutely GORGEOUS ${person.name}! This is IT!`,
        'VIP Guest': `⭐ VIP IN THE HOUSE! ${person.name} is HERE and we are PUMPED! Let's make some NOISE!`,
        'Guest Speaker': `🎤 SPEAKER ALERT! ${person.name} is HERE to drop some KNOWLEDGE BOMBS! Are you READY?!`,
        'Team Lead': `🚀 TEAM LEAD IN THE BUILDING! ${person.name} is HERE! Let's show them our AMAZING energy! GO TEAM!`
      },
      professional: {
        'Birthday Person': `🎂 We are pleased to celebrate ${person.name}'s birthday today. Please join us in wishing them well.`,
        'CEO': `🏢 We welcome our Chief Executive Officer, ${person.name}. Thank you for joining us today.`,
        'Intern': `👋 We welcome our intern, ${person.name}, to today's proceedings. We appreciate your participation.`,
        'Manager': `👔 We are pleased to welcome our manager, ${person.name}. Thank you for your continued leadership.`,
        'Bride': `💒 Please welcome ${person.name}, our bride, as we celebrate this joyous occasion.`,
        'VIP Guest': `✨ We are honored to have ${person.name} with us today. Please join me in welcoming them.`,
        'Guest Speaker': `🎤 We are honored to welcome our guest speaker, ${person.name}. Please give them your undivided attention.`,
        'Team Lead': `🚀 We welcome our team lead, ${person.name}. Thank you for your guidance and expertise.`
      }
    };

    // Try to find exact match first, then fallback to generic greeting
    const personalityGreetings = greetings[setup.aiPersonality];
    const exactMatch = personalityGreetings[person.role];
    
    if (exactMatch) {
      return exactMatch;
    }
    
    // Generate dynamic greeting for custom roles
    const roleBasedGreeting = {
      humorous: `🎉 Look who's here! Our amazing ${person.role.toLowerCase()}, ${person.name}! Let's give them a warm welcome!`,
      formal: `✨ Please join me in welcoming our ${person.role.toLowerCase()}, ${person.name}.`,
      energetic: `🚀 ${person.role.toUpperCase()} ALERT! ${person.name} is HERE! Let's show them some ENERGY!`,
      professional: `👔 We welcome our ${person.role.toLowerCase()}, ${person.name}. Thank you for joining us today.`
    };
    
    return roleBasedGreeting[setup.aiPersonality] || `Welcome ${person.name}!`;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return setup.eventName.trim() !== '';
      case 2: return true; // VIP people are optional
      case 3: return true; // AI personality has default
      default: return true;
    }
  };

  const handleComplete = () => {
    // Generate default greetings for people without custom ones
    const finalSetup = {
      ...setup,
      vipPeople: setup.vipPeople.map(person => ({
        ...person,
        greeting: person.greeting || generateDefaultGreeting(person)
      }))
    };
    onSetupComplete(finalSetup);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center p-4">
      <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 p-8 w-full max-w-4xl shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎤 Smart Event Setup</h1>
          <p className="text-gray-300">Configure your AI Event Emcee</p>
          <div className="flex justify-center mt-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= step ? 'bg-purple-500 text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  {step}
                </div>
                {step < 3 && <div className={`w-12 h-1 ${currentStep > step ? 'bg-purple-500' : 'bg-gray-600'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Event Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-purple-400" />
              Event Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Event Name *</label>
              <input
                type="text"
                value={setup.eventName}
                onChange={(e) => setSetup(prev => ({ ...prev, eventName: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                placeholder="Sarah's 25th Birthday Party"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Event Type</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {eventTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSetup(prev => ({ ...prev, eventType: type.value as any }))}
                    className={`p-4 rounded-lg border transition-all text-left ${
                      setup.eventType === type.value
                        ? 'bg-purple-600/30 border-purple-500/60 text-white'
                        : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <h3 className="font-medium">{type.label}</h3>
                        <p className="text-xs opacity-70">{type.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Event Duration</label>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={Math.floor(setup.duration)}
                    onChange={(e) => setSetup(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    className="w-20 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none text-center"
                  />
                  <select
                    value={setup.duration >= 1 && setup.duration < 1 ? 'minutes' : 'hours'}
                    onChange={(e) => {
                      const isMinutes = e.target.value === 'minutes';
                      const currentValue = Math.floor(setup.duration);
                      setSetup(prev => ({ 
                        ...prev, 
                        duration: isMinutes ? Math.min(currentValue, 59) : Math.max(currentValue, 1)
                      }));
                    }}
                    className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
                
                {/* Quick Duration Presets */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '5 min', value: 5/60 },
                    { label: '15 min', value: 15/60 },
                    { label: '30 min', value: 0.5 },
                    { label: '1 hour', value: 1 },
                    { label: '2 hours', value: 2 },
                    { label: '4 hours', value: 4 },
                    { label: '8 hours', value: 8 }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setSetup(prev => ({ ...prev, duration: preset.value }))}
                      className={`px-3 py-1 rounded text-xs transition-colors ${
                        Math.abs(setup.duration - preset.value) < 0.01
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                
                <div className="text-sm text-gray-400">
                  Duration: {setup.duration < 1 
                    ? `${Math.round(setup.duration * 60)} minutes` 
                    : setup.duration === 1 
                    ? '1 hour' 
                    : `${setup.duration} hours`
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: VIP People */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Users className="w-6 h-6 mr-2 text-purple-400" />
                Key People Recognition
              </h2>
              <button
                onClick={addVIPPerson}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Person
              </button>
            </div>

            <p className="text-gray-300">Upload photos of key people for AI recognition and personalized announcements.</p>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {setup.vipPeople.map((person) => (
                <div key={person.id} className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Photo</label>
                      <div className="relative">
                        {person.imageUrl ? (
                          <div className="relative">
                            <img
                              src={person.imageUrl}
                              alt={person.name}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => updateVIPPerson(person.id, { imageFile: undefined, imageUrl: undefined })}
                              className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="w-full h-32 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500 transition-colors">
                            <div className="text-center">
                              <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                              <span className="text-xs text-gray-400">Upload Photo</span>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(person.id, file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                        <input
                          type="text"
                          value={person.name}
                          onChange={(e) => updateVIPPerson(person.id, { name: e.target.value })}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                        <input
                          type="text"
                          value={person.role}
                          onChange={(e) => updateVIPPerson(person.id, { role: e.target.value })}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                          placeholder="e.g. Intern, Manager, Guest Speaker"
                          list={`roles-${person.id}`}
                        />
                        <datalist id={`roles-${person.id}`}>
                          <option value="Birthday Person" />
                          <option value="CEO" />
                          <option value="CTO" />
                          <option value="Manager" />
                          <option value="Intern" />
                          <option value="Guest Speaker" />
                          <option value="Team Lead" />
                          <option value="Bride" />
                          <option value="Groom" />
                          <option value="Best Man" />
                          <option value="Maid of Honor" />
                          <option value="VIP Guest" />
                          <option value="Host" />
                          <option value="Presenter" />
                          <option value="Client" />
                          <option value="Investor" />
                          <option value="Family Member" />
                          <option value="Friend" />
                          <option value="Colleague" />
                        >
                        </datalist>
                      </div>
                    </div>

                    {/* Custom Greeting */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Custom Greeting (Optional)</label>
                      <textarea
                        value={person.greeting}
                        onChange={(e) => updateVIPPerson(person.id, { greeting: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                        rows={3}
                        placeholder="Leave empty for AI-generated greeting"
                      />
                      <button
                        onClick={() => updateVIPPerson(person.id, { greeting: generateDefaultGreeting(person) })}
                        className="mt-1 text-xs text-purple-400 hover:text-purple-300"
                      >
                        Generate AI Greeting
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => removeVIPPerson(person.id)}
                    className="mt-3 text-red-400 hover:text-red-300 text-sm flex items-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove Person
                  </button>
                </div>
              ))}

              {setup.vipPeople.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No people added yet</p>
                  <p className="text-sm">Add key people for personalized recognition</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: AI Personality */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Mic className="w-6 h-6 mr-2 text-purple-400" />
              AI Personality
            </h2>

            <p className="text-gray-300">Choose how your AI emcee should sound and behave during announcements.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiPersonalities.map((personality) => (
                <button
                  key={personality.value}
                  onClick={() => setSetup(prev => ({ ...prev, aiPersonality: personality.value as any }))}
                  className={`p-6 rounded-lg border transition-all text-left ${
                    setup.aiPersonality === personality.value
                      ? 'bg-purple-600/30 border-purple-500/60 text-white'
                      : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-3xl">{personality.icon}</span>
                    <div>
                      <h3 className="font-bold text-lg">{personality.label}</h3>
                      <p className="text-sm opacity-70">{personality.description}</p>
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 mt-3">
                    <p className="text-xs text-gray-300 italic">"{personality.example}"</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Setup Summary */}
            <div className="bg-purple-600/20 rounded-lg p-4 border border-purple-500/30">
              <h3 className="font-bold text-white mb-2">Setup Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-300">Event:</span>
                  <span className="text-white ml-2">{setup.eventName}</span>
                </div>
                <div>
                  <span className="text-gray-300">Type:</span>
                  <span className="text-white ml-2 capitalize">{setup.eventType}</span>
                </div>
                <div>
                  <span className="text-gray-300">Duration:</span>
                  <span className="text-white ml-2">{setup.duration} hours</span>
                </div>
                <div>
                  <span className="text-gray-300">VIP People:</span>
                  <span className="text-white ml-2">{setup.vipPeople.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <div className="flex space-x-3">
            <button
              onClick={onSkip}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-white"
            >
              Skip Setup
            </button>
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-white"
              >
                Back
              </button>
            )}
          </div>

          <div>
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white flex items-center"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white flex items-center font-bold"
              >
                <Save className="w-4 h-4 mr-2" />
                Start Smart Event
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};