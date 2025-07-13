import { useState, useEffect } from 'react';

export const useMoodAnalysis = () => {
  const [mood, setMood] = useState('Energetic');
  const [energy, setEnergy] = useState(75);
  const [crowdSize, setCrowdSize] = useState(42);

  useEffect(() => {
    // Simulate real-time mood analysis updates
    const interval = setInterval(() => {
      const moods = ['Excited', 'Energetic', 'Chill', 'Happy', 'Euphoric'];
      setMood(moods[Math.floor(Math.random() * moods.length)]);
      setEnergy(Math.floor(Math.random() * 40) + 60);
      setCrowdSize(Math.floor(Math.random() * 30) + 20);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { mood, energy, crowdSize };
};