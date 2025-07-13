// Audio generator utility for creating synthetic audio
export class AudioGenerator {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;

  constructor() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private createTone(frequency: number, duration: number, type: OscillatorType = 'sine'): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const numSamples = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, numSamples, sampleRate);

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        let sample = 0;

        switch (type) {
          case 'sine':
            sample = Math.sin(2 * Math.PI * frequency * t);
            break;
          case 'square':
            sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
            break;
          case 'sawtooth':
            sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
            break;
          case 'triangle':
            sample = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
            break;
        }

        // Apply envelope (fade in/out)
        const fadeTime = 0.1;
        const fadeInSamples = fadeTime * sampleRate;
        const fadeOutSamples = fadeTime * sampleRate;
        
        if (i < fadeInSamples) {
          sample *= i / fadeInSamples;
        } else if (i > numSamples - fadeOutSamples) {
          sample *= (numSamples - i) / fadeOutSamples;
        }

        channelData[i] = sample * 0.3; // Reduce volume
      }
    }

    return buffer;
  }

  private createBeat(bpm: number, duration: number): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const numSamples = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, numSamples, sampleRate);
    
    const beatInterval = 60 / bpm; // seconds per beat
    const beatSamples = beatInterval * sampleRate;

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < numSamples; i++) {
        const beatPosition = (i % beatSamples) / beatSamples;
        let sample = 0;

        // Kick drum on beat 1 and 3
        if (beatPosition < 0.1) {
          const t = beatPosition / 0.1;
          sample += Math.sin(2 * Math.PI * 60 * t) * Math.exp(-t * 10) * 0.8;
        }

        // Hi-hat on beat 2 and 4
        if (beatPosition > 0.45 && beatPosition < 0.55) {
          sample += (Math.random() - 0.5) * 0.3 * Math.exp(-(beatPosition - 0.5) * 20);
        }

        // Bass line
        const bassFreq = 80 + Math.sin(i / sampleRate * 2 * Math.PI * 0.5) * 20;
        sample += Math.sin(2 * Math.PI * bassFreq * i / sampleRate) * 0.2;

        channelData[i] = sample;
      }
    }

    return buffer;
  }

  generateTrackAudio(trackId: string, bpm: number, duration: number): AudioBuffer | null {
    if (!this.audioContext) return null;

    switch (trackId) {
      case '1': // Electronic
        return this.createBeat(bpm, duration);
      case '2': // Synthwave
        return this.createTone(220, duration, 'sawtooth');
      case '3': // Bass
        return this.createTone(80, duration, 'square');
      case '4': // Trance
        return this.createTone(440, duration, 'sine');
      case '5': // Techno
        return this.createBeat(bpm, duration);
      case '6': // Hard Techno
        return this.createBeat(bpm, duration);
      case '7': // Synthwave
        return this.createTone(330, duration, 'triangle');
      case '8': // Electronic
        return this.createTone(165, duration, 'sine');
      default:
        return this.createTone(440, duration, 'sine');
    }
  }

  play(buffer: AudioBuffer, volume: number = 1): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.audioContext || !this.gainNode) {
        reject(new Error('Audio context not available'));
        return;
      }

      // Stop current audio
      this.stop();

      try {
        this.currentSource = this.audioContext.createBufferSource();
        this.currentSource.buffer = buffer;
        this.currentSource.connect(this.gainNode);
        
        this.gainNode.gain.value = volume;
        
        this.currentSource.onended = () => {
          // Don't resolve here, resolve immediately after start
        };

        this.currentSource.start();
        // Resolve immediately after starting playback
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (error) {
        // Ignore errors when stopping
      }
      this.currentSource = null;
    }
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
  }

  getCurrentTime(): number {
    if (!this.audioContext || !this.currentSource) return 0;
    return this.audioContext.currentTime;
  }

  isPlaying(): boolean {
    return this.currentSource !== null;
  }

  close(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}