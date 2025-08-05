import React, { useState, useEffect } from 'react';
import { Calendar, Users, Mic, Upload, X, Plus, Save, ArrowRight, ArrowLeft, Check, Sparkles, Star, Crown } from 'lucide-react';

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [setup, setSetup] = useState<EventSetup>({
    eventName: '',
    eventType: 'party',
    duration: 4,
    vipPeople: [],
    aiPersonality: 'energetic',
    specialMoments: []
  });

  const eventTypes = [
    { 
      value: 'birthday', 
      label: 'Birthday Celebration', 
      icon: '🎂', 
      description: 'Joyful moments, cake ceremonies, and heartfelt celebrations',
      gradient: 'from-pink-400 via-rose-400 to-red-400',
      bgImage: 'https://images.pexels.com/photos/1729931/pexels-photo-1729931.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    { 
      value: 'corporate', 
      label: 'Corporate Gathering', 
      icon: '🏢', 
      description: 'Professional networking, presentations, and team building',
      gradient: 'from-blue-400 via-indigo-400 to-purple-400',
      bgImage: 'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    { 
      value: 'wedding', 
      label: 'Wedding Reception', 
      icon: '💒', 
      description: 'Romantic ceremonies, first dances, and eternal love',
      gradient: 'from-purple-400 via-pink-400 to-rose-400',
      bgImage: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    { 
      value: 'party', 
      label: 'Social Gathering', 
      icon: '🎉', 
      description: 'Dancing, music, and unforgettable memories',
      gradient: 'from-yellow-400 via-orange-400 to-red-400',
      bgImage: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    { 
      value: 'conference', 
      label: 'Professional Conference', 
      icon: '🎤', 
      description: 'Keynotes, workshops, and knowledge sharing',
      gradient: 'from-teal-400 via-cyan-400 to-blue-400',
      bgImage: 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
  ];

  const aiPersonalities = [
    { 
      value: 'humorous', 
      label: 'Charismatic Entertainer', 
      icon: '✨', 
      description: 'Witty, charming, and delightfully entertaining',
      example: '"Well, well, well... look who decided to grace us with their presence! Give it up for our birthday star!"',
      gradient: 'from-yellow-400 to-orange-400',
      accent: 'yellow'
    },
    { 
      value: 'formal', 
      label: 'Distinguished Host', 
      icon: '👑', 
      description: 'Elegant, sophisticated, and timelessly refined',
      example: '"Ladies and gentlemen, please join me in welcoming our distinguished CEO, Mr. Johnson."',
      gradient: 'from-purple-400 to-indigo-400',
      accent: 'purple'
    },
    { 
      value: 'energetic', 
      label: 'Dynamic Motivator', 
      icon: '⚡', 
      description: 'High-energy, inspiring, and absolutely electrifying',
      example: '"THE CEO IS HERE! Give it up for our amazing leader! Let\'s show them what ENERGY looks like!"',
      gradient: 'from-red-400 to-pink-400',
      accent: 'red'
    },
    { 
      value: 'professional', 
      label: 'Executive Presenter', 
      icon: '🎯', 
      description: 'Articulate, polished, and impeccably professional',
      example: '"We are pleased to announce the arrival of our Chief Executive Officer. Please join me in extending a warm welcome."',
      gradient: 'from-blue-400 to-cyan-400',
      accent: 'blue'
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

    const personalityGreetings = greetings[setup.aiPersonality];
    const exactMatch = personalityGreetings[person.role];
    
    if (exactMatch) {
      return exactMatch;
    }
    
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
      case 2: return true;
      case 3: return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (currentStep < 3 && canProceed()) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleComplete = () => {
    const finalSetup = {
      ...setup,
      vipPeople: setup.vipPeople.map(person => ({
        ...person,
        greeting: person.greeting || generateDefaultGreeting(person)
      }))
    };
    onSetupComplete(finalSetup);
  };

  // Smooth scroll reveal animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background with Parallax */}
      <div className="absolute inset-0 z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
        
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-purple-600/30 to-pink-600/20 animate-pulse" 
             style={{ animationDuration: '8s' }} />
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '6s', animationDelay: '0s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '8s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '10s', animationDelay: '4s' }} />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5" 
             style={{
               backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
               backgroundSize: '50px 50px'
             }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          {/* Header Section */}
          <div className={`text-center mb-16 transition-all duration-700 ${
            isTransitioning ? 'opacity-0 transform translate-y-8' : 'opacity-100 transform translate-y-0'
          }`}>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl mb-8 shadow-2xl shadow-purple-500/25">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-6xl md:text-7xl font-thin text-white mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Smart Event
              </span>
            </h1>
            <p className="text-xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
              Configure your AI-powered event experience with precision and elegance
            </p>
            
            {/* Progress Indicator */}
            <div className="flex items-center justify-center mt-12 space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    currentStep >= step 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 scale-110' 
                      : 'bg-white/10 backdrop-blur-sm border border-white/20'
                  }`}>
                    {currentStep > step ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <span className={`text-lg font-medium ${
                        currentStep >= step ? 'text-white' : 'text-slate-400'
                      }`}>
                        {step}
                      </span>
                    )}
                    
                    {/* Ripple effect for active step */}
                    {currentStep === step && (
                      <div className="absolute inset-0 rounded-2xl bg-purple-500/30 animate-ping" />
                    )}
                  </div>
                  
                  {step < 3 && (
                    <div className={`w-16 h-1 rounded-full transition-all duration-500 ${
                      currentStep > step ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className={`transition-all duration-700 ${
            isTransitioning ? 'opacity-0 transform translate-x-8' : 'opacity-100 transform translate-x-0'
          }`}>
            
            {/* Step 1: Event Details */}
            {currentStep === 1 && (
              <div className="space-y-12">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-light text-white mb-4">Event Foundation</h2>
                  <p className="text-slate-300 text-lg">Let's begin with the essence of your celebration</p>
                </div>

                {/* Event Name Input */}
                <div className="max-w-2xl mx-auto">
                  <label className="block text-sm font-medium text-slate-300 mb-4 tracking-wide uppercase">
                    Event Name
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={setup.eventName}
                      onChange={(e) => setSetup(prev => ({ ...prev, eventName: e.target.value }))}
                      className="w-full bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl px-8 py-6 text-white text-xl placeholder-slate-400 focus:border-purple-500/50 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all duration-300"
                      placeholder="Sarah's 25th Birthday Celebration"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                </div>

                {/* Event Type Selection */}
                <div className="max-w-5xl mx-auto">
                  <label className="block text-sm font-medium text-slate-300 mb-8 tracking-wide uppercase text-center">
                    Event Experience
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {eventTypes.map((type, index) => (
                      <div
                        key={type.value}
                        className={`group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 hover:scale-105 ${
                          setup.eventType === type.value
                            ? 'ring-2 ring-purple-500/50 shadow-2xl shadow-purple-500/25 scale-105'
                            : 'hover:shadow-xl'
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={() => setSetup(prev => ({ ...prev, eventType: type.value as any }))}
                      >
                        {/* Background Image */}
                        <div className="absolute inset-0">
                          <img 
                            src={type.bgImage} 
                            alt={type.label}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/60" />
                          <div className={`absolute inset-0 bg-gradient-to-t ${type.gradient} opacity-40`} />
                        </div>
                        
                        {/* Content */}
                        <div className="relative p-8 h-64 flex flex-col justify-between">
                          <div className="text-center">
                            <div className="text-5xl mb-4 transform transition-transform duration-300 group-hover:scale-110">
                              {type.icon}
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">{type.label}</h3>
                            <p className="text-sm text-slate-200 leading-relaxed">{type.description}</p>
                          </div>
                          
                          {/* Selection Indicator */}
                          <div className={`absolute top-4 right-4 w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                            setup.eventType === type.value
                              ? 'border-white bg-white shadow-lg'
                              : 'border-white/40 group-hover:border-white/60'
                          }`}>
                            {setup.eventType === type.value && (
                              <Check className="w-4 h-4 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Duration Selection */}
                <div className="max-w-2xl mx-auto">
                  <label className="block text-sm font-medium text-slate-300 mb-6 tracking-wide uppercase text-center">
                    Event Duration
                  </label>
                  
                  <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                    <div className="flex items-center justify-center space-x-6 mb-6">
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={Math.floor(setup.duration)}
                        onChange={(e) => setSetup(prev => ({ ...prev, duration: Number(e.target.value) }))}
                        className="w-24 bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white text-2xl font-light text-center focus:border-purple-500/50 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all duration-300"
                      />
                      <span className="text-2xl font-light text-slate-300">hours</span>
                    </div>
                    
                    {/* Duration Presets */}
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: '1 hour', value: 1 },
                        { label: '2 hours', value: 2 },
                        { label: '4 hours', value: 4 },
                        { label: '8 hours', value: 8 }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => setSetup(prev => ({ ...prev, duration: preset.value }))}
                          className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                            setup.duration === preset.value
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                              : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: VIP People */}
            {currentStep === 2 && (
              <div className="space-y-12">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-light text-white mb-4">Distinguished Guests</h2>
                  <p className="text-slate-300 text-lg">Add key people for personalized AI recognition</p>
                </div>

                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                      <Crown className="w-6 h-6 text-yellow-400" />
                      <span className="text-lg font-medium text-white">VIP Recognition</span>
                    </div>
                    <button
                      onClick={addVIPPerson}
                      className="group px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-105"
                    >
                      <div className="flex items-center space-x-2">
                        <Plus className="w-5 h-5 text-white transition-transform duration-300 group-hover:rotate-90" />
                        <span className="text-white font-medium">Add Person</span>
                      </div>
                    </button>
                  </div>

                  {/* VIP Cards */}
                  <div className="space-y-6">
                    {setup.vipPeople.map((person, index) => (
                      <div
                        key={person.id}
                        className="group bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-8 hover:bg-white/10 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10"
                        style={{ 
                          animationDelay: `${index * 100}ms`,
                          animation: 'slideInUp 0.6s ease-out forwards'
                        }}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
                          {/* Photo Upload */}
                          <div className="lg:col-span-1">
                            <label className="block text-sm font-medium text-slate-300 mb-4 tracking-wide">
                              Recognition Photo
                            </label>
                            <div className="relative">
                              {person.imageUrl ? (
                                <div className="relative group/image">
                                  <img
                                    src={person.imageUrl}
                                    alt={person.name}
                                    className="w-32 h-32 object-cover rounded-2xl border-4 border-emerald-500/50 shadow-xl mx-auto transition-transform duration-300 group-hover/image:scale-105"
                                  />
                                  <div className="absolute -top-2 -left-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                  <button
                                    onClick={() => updateVIPPerson(person.id, { imageFile: undefined, imageUrl: undefined })}
                                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover/image:opacity-100 transition-all duration-300 hover:scale-110"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <label className="group/upload w-32 h-32 mx-auto border-2 border-dashed border-slate-500 rounded-2xl flex items-center justify-center cursor-pointer hover:border-purple-400 transition-all duration-300 hover:bg-purple-500/10">
                                  <div className="text-center">
                                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2 transition-colors duration-300 group-hover/upload:text-purple-400" />
                                    <span className="text-xs text-slate-400 group-hover/upload:text-purple-400 transition-colors duration-300">
                                      Upload
                                    </span>
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

                          {/* Person Details */}
                          <div className="lg:col-span-2 space-y-6">
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2 tracking-wide">
                                Full Name
                              </label>
                              <input
                                type="text"
                                value={person.name}
                                onChange={(e) => updateVIPPerson(person.id, { name: e.target.value })}
                                className="w-full bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-purple-500/50 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all duration-300"
                                placeholder="Sarah Johnson"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2 tracking-wide">
                                Role & Title
                              </label>
                              <input
                                type="text"
                                value={person.role}
                                onChange={(e) => updateVIPPerson(person.id, { role: e.target.value })}
                                className="w-full bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-purple-500/50 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all duration-300"
                                placeholder="Chief Executive Officer"
                                list={`roles-${person.id}`}
                              />
                              <datalist id={`roles-${person.id}`}>
                                <option value="Birthday Person" />
                                <option value="CEO" />
                                <option value="Manager" />
                                <option value="Guest Speaker" />
                                <option value="Bride" />
                                <option value="Groom" />
                                <option value="VIP Guest" />
                              </datalist>
                            </div>
                          </div>

                          {/* Custom Greeting */}
                          <div className="lg:col-span-1">
                            <label className="block text-sm font-medium text-slate-300 mb-2 tracking-wide">
                              Personal Touch
                            </label>
                            <textarea
                              value={person.greeting}
                              onChange={(e) => updateVIPPerson(person.id, { greeting: e.target.value })}
                              className="w-full bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-400 focus:border-purple-500/50 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 resize-none"
                              rows={4}
                              placeholder="Custom greeting message..."
                            />
                            <button
                              onClick={() => updateVIPPerson(person.id, { greeting: generateDefaultGreeting(person) })}
                              className="mt-2 text-xs text-purple-400 hover:text-purple-300 transition-colors duration-300"
                            >
                              Generate AI Greeting
                            </button>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeVIPPerson(person.id)}
                          className="absolute top-4 right-4 w-8 h-8 bg-red-500/20 hover:bg-red-500 rounded-full flex items-center justify-center text-red-400 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {setup.vipPeople.length === 0 && (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                          <Users className="w-12 h-12 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-light text-white mb-2">No VIP guests yet</h3>
                        <p className="text-slate-400">Add key people for personalized recognition and greetings</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: AI Personality */}
            {currentStep === 3 && (
              <div className="space-y-12">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-light text-white mb-4">AI Personality</h2>
                  <p className="text-slate-300 text-lg">Choose your digital host's character and voice</p>
                </div>

                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {aiPersonalities.map((personality, index) => (
                    <div
                      key={personality.value}
                      className={`group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 ${
                        setup.aiPersonality === personality.value
                          ? 'ring-2 ring-purple-500/50 shadow-2xl shadow-purple-500/25 scale-105'
                          : 'hover:scale-102 hover:shadow-xl'
                      }`}
                      style={{ animationDelay: `${index * 150}ms` }}
                      onClick={() => setSetup(prev => ({ ...prev, aiPersonality: personality.value as any }))}
                    >
                      {/* Background */}
                      <div className="absolute inset-0">
                        <div className={`bg-gradient-to-br ${personality.gradient} opacity-20`} />
                        <div className="absolute inset-0 bg-black/40" />
                      </div>
                      
                      {/* Content */}
                      <div className="relative p-8">
                        <div className="flex items-center space-x-4 mb-6">
                          <div className={`w-16 h-16 bg-gradient-to-r ${personality.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                            <span className="text-2xl">{personality.icon}</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-white">{personality.label}</h3>
                            <p className="text-slate-300 text-sm">{personality.description}</p>
                          </div>
                        </div>
                        
                        {/* Example Quote */}
                        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                            <p className="text-sm text-slate-200 italic leading-relaxed">
                              {personality.example}
                            </p>
                          </div>
                        </div>
                        
                        {/* Selection Indicator */}
                        <div className={`absolute top-6 right-6 w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                          setup.aiPersonality === personality.value
                            ? 'border-white bg-white shadow-lg'
                            : 'border-white/40 group-hover:border-white/60'
                        }`}>
                          {setup.aiPersonality === personality.value && (
                            <Check className={`w-4 h-4 text-${personality.accent}-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Setup Summary */}
                <div className="max-w-3xl mx-auto">
                  <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 backdrop-blur-xl rounded-3xl border border-purple-500/30 p-8">
                    <h3 className="text-2xl font-light text-white mb-6 text-center">Event Configuration</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Calendar className="w-6 h-6 text-purple-400" />
                        </div>
                        <p className="text-sm text-slate-400 mb-1">Event</p>
                        <p className="text-white font-medium">{setup.eventName || 'Unnamed Event'}</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Star className="w-6 h-6 text-blue-400" />
                        </div>
                        <p className="text-sm text-slate-400 mb-1">Type</p>
                        <p className="text-white font-medium capitalize">{setup.eventType}</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Clock className="w-6 h-6 text-green-400" />
                        </div>
                        <p className="text-sm text-slate-400 mb-1">Duration</p>
                        <p className="text-white font-medium">{setup.duration}h</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Users className="w-6 h-6 text-yellow-400" />
                        </div>
                        <p className="text-sm text-slate-400 mb-1">VIP Guests</p>
                        <p className="text-white font-medium">{setup.vipPeople.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className={`flex justify-between items-center mt-16 transition-all duration-700 ${
            isTransitioning ? 'opacity-0 transform translate-y-8' : 'opacity-100 transform translate-y-0'
          }`}>
            <div className="flex space-x-4">
              <button
                onClick={onSkip}
                className="group px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl transition-all duration-300 hover:bg-white/10 hover:border-white/30"
              >
                <span className="text-slate-300 group-hover:text-white transition-colors duration-300">
                  Skip Setup
                </span>
              </button>
              
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="group px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl transition-all duration-300 hover:bg-white/20 hover:shadow-lg"
                >
                  <div className="flex items-center space-x-2">
                    <ArrowLeft className="w-5 h-5 text-white transition-transform duration-300 group-hover:-translate-x-1" />
                    <span className="text-white">Previous</span>
                  </div>
                </button>
              )}
            </div>

            <div>
              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="group px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-white font-medium text-lg">Continue</span>
                    <ArrowRight className="w-5 h-5 text-white transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="group px-12 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/30 hover:scale-105"
                >
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-5 h-5 text-white transition-transform duration-300 group-hover:rotate-12" />
                    <span className="text-white font-semibold text-lg">Launch Experience</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};