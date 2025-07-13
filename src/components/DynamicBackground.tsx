import React from 'react';

interface DynamicBackgroundProps {
  mood: string;
  energy: number;
  isPlaying: boolean;
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ 
  mood, 
  energy, 
  isPlaying 
}) => {
  const getMoodGradient = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'excited':
        return 'from-yellow-500/20 via-red-500/20 to-purple-500/20';
      case 'energetic':
        return 'from-red-500/20 via-pink-500/20 to-purple-500/20';
      case 'chill':
        return 'from-blue-500/20 via-cyan-500/20 to-purple-500/20';
      case 'happy':
        return 'from-green-500/20 via-yellow-500/20 to-purple-500/20';
      default:
        return 'from-purple-500/20 via-pink-500/20 to-blue-500/20';
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient background */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${getMoodGradient(mood)} transition-all duration-2000 ${
          isPlaying ? 'animate-pulse' : ''
        }`}
        style={{
          animation: isPlaying ? `pulse 2s ease-in-out infinite alternate` : 'none'
        }}
      />

      {/* Floating particles */}
      {isPlaying && (
        <>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-purple-400 rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float 3s ease-in-out infinite ${Math.random() * 2}s`,
                animationDirection: Math.random() > 0.5 ? 'normal' : 'reverse'
              }}
            />
          ))}
        </>
      )}

      {/* Pulsing circles */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full animate-ping" 
           style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-pink-500/10 rounded-full animate-ping" 
           style={{ animationDuration: '4s', animationDelay: '1s' }} />
      
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
      `}</style>
    </div>
  );
};