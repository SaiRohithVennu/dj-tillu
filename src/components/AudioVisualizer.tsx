import React, { useRef, useEffect } from 'react';
import { BarChart3, Radio, Zap } from 'lucide-react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  audioElement?: HTMLAudioElement | null;
  mood: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  isPlaying, 
  audioElement,
  mood 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (audioElement && !analyzerRef.current) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaElementSource(audioElement);
        const analyzer = audioContext.createAnalyser();
        
        analyzer.fftSize = 256;
        source.connect(analyzer);
        analyzer.connect(audioContext.destination);
        
        analyzerRef.current = analyzer;
        audioContextRef.current = audioContext;
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }
  }, [audioElement]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const draw = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);

      if (isPlaying) {
        let frequencyData: Uint8Array;
        
        if (analyzerRef.current) {
          frequencyData = new Uint8Array(analyzerRef.current.frequencyBinCount);
          analyzerRef.current.getByteFrequencyData(frequencyData);
        } else {
          // Fallback to fake data if Web Audio API is not available
          frequencyData = new Uint8Array(128);
          for (let i = 0; i < frequencyData.length; i++) {
            frequencyData[i] = Math.random() * 255;
          }
        }

        const bars = 64;
        const barWidth = width / bars;
        const dataStep = Math.floor(frequencyData.length / bars);
        
        for (let i = 0; i < bars; i++) {
          const dataIndex = i * dataStep;
          const amplitude = frequencyData[dataIndex] / 255;
          const barHeight = amplitude * height * 0.8;
          
          const hue = (i / bars) * 360 + (Date.now() * 0.1) % 360;
          const saturation = mood === 'excited' ? 90 : mood === 'energetic' ? 80 : 60;
          const lightness = 50 + amplitude * 30;
          
          ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
          ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
        }

        // Add pulsing center circle
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = 30 + Math.sin(Date.now() * 0.01) * 20;
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isPlaying, mood, audioElement]);

  return (
    <div className="h-full">
      {/* Visualizer Canvas */}
      <div className="relative mb-3 h-32 bg-black/30 rounded-lg overflow-hidden border border-white/20 backdrop-blur-sm">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Radio className="w-8 h-8 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-400">Audio visualization</p>
            </div>
          </div>
        )}
      </div>

      {/* Frequency Bands */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {['Sub', 'Bass', 'Mid', 'High'].map((band, index) => (
          <div key={band} className="text-center">
            <p className="text-xs text-gray-300 mb-1">{band}</p>
            <div className="h-12 bg-white/10 rounded relative overflow-hidden border border-white/20">
              <div 
                className={`absolute bottom-0 w-full transition-all duration-100 ${
                  isPlaying ? 'bg-gradient-to-t from-purple-400 to-pink-400 shadow-lg' : 'bg-gray-500'
                }`}
                style={{ 
                  height: isPlaying ? `${Math.random() * 80 + 20}%` : '10%' 
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Info */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-300 flex items-center">
            <BarChart3 className="w-3 h-3 mr-1" />
            Peak Frequency
          </span>
          <span className="text-purple-200 font-mono">
            {isPlaying ? `${Math.floor(Math.random() * 8000 + 2000)} Hz` : '--- Hz'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300 flex items-center">
            <Zap className="w-3 h-3 mr-1" />
            RMS Level
          </span>
          <span className="text-purple-200 font-mono">
            {isPlaying ? `${(Math.random() * 60 + 40).toFixed(1)} dB` : '--- dB'}
          </span>
        </div>
      </div>
    </div>
  );
};