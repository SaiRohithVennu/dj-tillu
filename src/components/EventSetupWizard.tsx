import React, { useState } from 'react';
import { Camera, Users, Clock, Sparkles, Check, Upload, X } from 'lucide-react';

interface EventSetupWizardProps {
  onSetupComplete: (eventData: any) => void;
  onSkip: () => void;
}

export const EventSetupWizard: React.FC<EventSetupWizardProps> = ({ onSetupComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [eventData, setEventData] = useState({
    type: '',
    duration: 2,
    vipPeople: [] as File[],
    aiPersonality: 'energetic'
  });

  const eventTypes = [
    { id: 'birthday', name: 'Birthday Party', icon: '🎂', image: 'https://images.pexels.com/photos/1729931/pexels-photo-1729931.jpeg' },
    { id: 'corporate', name: 'Corporate Event', icon: '💼', image: 'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg' },
    { id: 'wedding', name: 'Wedding', icon: '💒', image: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg' },
    { id: 'party', name: 'House Party', icon: '🎉', image: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg' }
  ];

  const aiPersonalities = [
    { id: 'energetic', name: 'Energetic', description: 'High energy, enthusiastic announcements' },
    { id: 'formal', name: 'Formal', description: 'Professional, elegant tone' },
    { id: 'humorous', name: 'Humorous', description: 'Fun, witty, entertaining' },
    { id: 'professional', name: 'Professional', description: 'Business-appropriate, polished' }
  ];

  const steps = [
    { title: 'Event Type', description: 'What kind of event are you hosting?' },
    { title: 'Duration', description: 'How long will your event last?' },
    { title: 'VIP People', description: 'Upload photos of important guests' },
    { title: 'AI Personality', description: 'Choose your AI host personality' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onSetupComplete(eventData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setEventData(prev => ({
        ...prev,
        vipPeople: [...prev.vipPeople, ...newFiles]
      }));
    }
  };

  const removeVipPhoto = (index: number) => {
    setEventData(prev => ({
      ...prev,
      vipPeople: prev.vipPeople.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Cinematic Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg)',
        }}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      </div>

      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-thin text-white mb-4 tracking-tight">
              Smart Event Setup
            </h1>
            <p className="text-xl text-gray-300 font-light">
              Configure your AI-powered event experience
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
                    ${index <= currentStep 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50' 
                      : 'bg-black/30 text-gray-400 border border-gray-600'
                    }
                  `}>
                    {index < currentStep ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-16 h-0.5 mx-2 transition-all duration-500
                      ${index < currentStep ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-gray-600'}
                    `} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-3xl font-thin text-white mb-2">
                {steps[currentStep].title}
              </h2>
              <p className="text-gray-300 text-lg font-light">
                {steps[currentStep].description}
              </p>
            </div>

            {/* Step Content */}
            <div className="min-h-[400px] flex items-center justify-center">
              {currentStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {eventTypes.map((type) => (
                    <div
                      key={type.id}
                      onClick={() => setEventData(prev => ({ ...prev, type: type.id }))}
                      className={`
                        relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-500 group
                        ${eventData.type === type.id 
                          ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/50 scale-105' 
                          : 'hover:scale-105 hover:shadow-xl'
                        }
                      `}
                    >
                      <div 
                        className="h-48 bg-cover bg-center"
                        style={{ backgroundImage: `url(${type.image})` }}
                      >
                        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-all duration-300" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                          <div className="text-4xl mb-2">{type.icon}</div>
                          <h3 className="text-xl font-medium">{type.name}</h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentStep === 1 && (
                <div className="w-full max-w-md">
                  <div className="text-center mb-8">
                    <div className="text-6xl font-thin text-white mb-4">
                      {eventData.duration}
                    </div>
                    <div className="text-xl text-gray-300">
                      {eventData.duration === 1 ? 'Hour' : 'Hours'}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={eventData.duration}
                    onChange={(e) => setEventData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>1 hour</span>
                    <span>12 hours</span>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="w-full">
                  <div className="border-2 border-dashed border-gray-600 rounded-2xl p-8 text-center mb-6 hover:border-purple-500 transition-colors duration-300">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 mb-4">
                      Upload photos of VIP guests for face recognition
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                      id="vip-upload"
                    />
                    <label
                      htmlFor="vip-upload"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl cursor-pointer hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Choose Photos
                    </label>
                  </div>

                  {eventData.vipPeople.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {eventData.vipPeople.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`VIP ${index + 1}`}
                            className="w-full h-24 object-cover rounded-xl"
                          />
                          <button
                            onClick={() => removeVipPhoto(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {aiPersonalities.map((personality) => (
                    <div
                      key={personality.id}
                      onClick={() => setEventData(prev => ({ ...prev, aiPersonality: personality.id }))}
                      className={`
                        p-6 rounded-2xl cursor-pointer transition-all duration-500 border
                        ${eventData.aiPersonality === personality.id
                          ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500 shadow-lg shadow-purple-500/50'
                          : 'bg-black/20 border-gray-600 hover:border-purple-500/50 hover:bg-black/30'
                        }
                      `}
                    >
                      <h3 className="text-xl font-medium text-white mb-2">
                        {personality.name}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {personality.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={onSkip}
                className="px-6 py-3 text-gray-400 hover:text-white transition-colors duration-300"
              >
                Skip Setup
              </button>

              <div className="flex space-x-4">
                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 bg-black/30 text-white rounded-xl border border-gray-600 hover:bg-black/50 transition-all duration-300"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={currentStep === 0 && !eventData.type}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #3b82f6);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #3b82f6);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </div>
  );
};

export default EventSetupWizard;