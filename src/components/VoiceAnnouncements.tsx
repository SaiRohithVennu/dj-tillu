import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, MessageSquare } from 'lucide-react';

interface VoiceAnnouncementsProps {
  mood: string;
  energy: number;
  crowdSize: number;
  currentTrack: string;
  onAnnouncementStart?: () => void;
  onAnnouncementEnd?: () => void;
}

export const VoiceAnnouncements: React.FC<VoiceAnnouncementsProps> = ({
  mood,
  energy,
  crowdSize,
  currentTrack,
  onAnnouncementStart,
  onAnnouncementEnd
}) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [lastAnnouncement, setLastAnnouncement] = useState('Welcome to the party!');
  const [announcementQueue, setAnnouncementQueue] = useState<string[]>([]);

  const generateAnnouncement = () => {
    const announcements = [
      `The crowd is feeling ${mood.toLowerCase()}! Let's keep this energy going!`,
      `Energy levels at ${energy}%! ${currentTrack} is hitting different tonight!`,
      `${crowdSize} people in the house! Make some noise!`,
      `DJ Tillu reading the vibe... Perfect time for a beat drop!`,
      `The algorithm says you're ready for something special!`,
      `Crowd analysis complete: Time to turn it up!`,
      `${mood} vibes detected! Adjusting the mix accordingly!`,
      `This is your AI DJ speaking - the energy is incredible tonight!`
    ];

    const randomAnnouncement = announcements[Math.floor(Math.random() * announcements.length)];
    setLastAnnouncement(randomAnnouncement);
    
    if (isEnabled) {
      setAnnouncementQueue(prev => [...prev, randomAnnouncement].slice(-3));
    }
  };

  useEffect(() => {
    if (isEnabled) {
      const interval = setInterval(generateAnnouncement, 15000);
      return () => clearInterval(interval);
    }
  }, [isEnabled, mood, energy, crowdSize, currentTrack]);

  const playAnnouncement = (text: string) => {
    if ('speechSynthesis' in window) {
      // Duck audio before announcement
      onAnnouncementStart?.();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        // Unduck audio after announcement
        setTimeout(() => {
          onAnnouncementEnd?.();
        }, 500); // Small delay before unducking
      };
      
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIsEnabled(!isEnabled)}
          className={`p-2 rounded-full transition-colors ${
            isEnabled 
              ? 'bg-purple-500 text-white shadow-lg' 
              : 'bg-white/20 text-gray-300'
          }`}
        >
          {isEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>
      </div>

      {/* Current Announcement */}
      <div className="bg-white/10 rounded-lg p-3 mb-3 border border-white/20 backdrop-blur-sm">
        <div className="flex items-start space-x-2 mb-2">
          <MessageSquare className="w-4 h-4 text-purple-300 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-white">{lastAnnouncement}</p>
          </div>
          <button
            onClick={() => playAnnouncement(lastAnnouncement)}
            className="text-purple-300 hover:text-purple-200 transition-colors"
            title="Play announcement"
          >
            <Volume2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick Announcement Buttons */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-300">Quick Drops</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            'Drop incoming!',
            'Hands up!',
            'Make noise!',
            'Let\'s go!'
          ].map((announcement, index) => (
            <button
              key={index}
              onClick={() => {
                setLastAnnouncement(announcement);
                playAnnouncement(announcement);
              }}
              className="text-center px-2 py-1 bg-white/10 hover:bg-purple-500/30 rounded text-xs transition-colors border border-white/20"
            >
              {announcement}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};