import React, { useState, useCallback } from 'react';
import { EventSetupWizard } from './components/EventSetupWizard';
import { SmartEventDashboard } from './components/SmartEventDashboard';
import { DynamicBackground } from './components/DynamicBackground';
import { useSmartEventDJ } from './hooks/useSmartEventDJ';
import { useSmartEventEmcee } from './hooks/useSmartEventEmcee';
import { useOpenAIEventHost } from './hooks/useOpenAIEventHost';
import { useContinuousAIAgent } from './hooks/useContinuousAIAgent';

export interface EventSetup {
  eventName: string;
  eventType: string;
  duration: number;
  vipPersons: VIPPerson[];
  musicPreferences: string[];
  specialRequests: string;
}

export interface VIPPerson {
  id: string;
  name: string;
  role: string;
  photo?: string;
}

function App() {
  const [eventSetup, setEventSetup] = useState<EventSetup | null>(null);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<string[]>([]);

  // Handler functions defined before hooks
  const handleAnnouncement = useCallback((announcement: string) => {
    setAnnouncements(prev => [...prev, announcement]);
  }, []);

  const handleVIPRecognized = useCallback((person: VIPPerson) => {
    console.log('VIP recognized:', person);
    handleAnnouncement(`Welcome ${person.name}, our ${person.role}!`);
  }, [handleAnnouncement]);

  const handleTrackChange = useCallback((track: any) => {
    setCurrentTrack(track);
    console.log('Track changed:', track);
  }, []);

  const handleSetupComplete = useCallback((setup: EventSetup) => {
    setEventSetup(setup);
    console.log('Event setup completed:', setup);
  }, []);

  // Initialize hooks with handlers
  const djSystem = useSmartEventDJ({
    eventSetup,
    onTrackChange: handleTrackChange,
    onAnnouncement: handleAnnouncement
  });

  const emceeSystem = useSmartEventEmcee({
    eventSetup,
    onAnnouncement: handleAnnouncement,
    onVIPRecognized: handleVIPRecognized
  });

  const hostSystem = useOpenAIEventHost({
    eventSetup,
    onAnnouncement: handleAnnouncement
  });

  const aiAgent = useContinuousAIAgent({
    eventSetup,
    onDecision: (decision) => console.log('AI Decision:', decision)
  });

  if (!eventSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <DynamicBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <EventSetupWizard onSetupComplete={handleSetupComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <DynamicBackground />
      <div className="relative z-10">
        <SmartEventDashboard
          eventSetup={eventSetup}
          currentTrack={currentTrack}
          announcements={announcements}
          djSystem={djSystem}
          emceeSystem={emceeSystem}
          hostSystem={hostSystem}
          aiAgent={aiAgent}
        />
      </div>
    </div>
  );
}

export default App;