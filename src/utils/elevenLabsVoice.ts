interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description: string;
}

interface ElevenLabsSettings {
  voice_id: string;
  model_id: string;
  voice_settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
}

export class ElevenLabsVoiceService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private currentAudio: HTMLAudioElement | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Get available voices
  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error);
      return [];
    }
  }

  // Generate speech from text
  async generateSpeech(
    text: string, 
    settings: ElevenLabsSettings
  ): Promise<ArrayBuffer | null> {
    try {
      console.log('🎤 ElevenLabs: Generating speech for:', text.substring(0, 50) + '...');

      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${settings.voice_id}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text: text,
            model_id: settings.model_id,
            voice_settings: settings.voice_settings,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      console.log('✅ ElevenLabs: Speech generated successfully');
      return audioBuffer;

    } catch (error: any) {
      console.error('❌ ElevenLabs speech generation failed:', error);
      throw error;
    }
  }

  // Play generated audio
  async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Stop any currently playing announcement
        if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio = null;
        }

        const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;
        
        // Set volume to ensure it's audible
        audio.volume = 0.8;
        audio.preload = 'auto';

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          resolve();
        };

        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          reject(error);
        };

        // Ensure audio plays with user interaction context
        audio.play().then(() => {
          console.log('✅ ElevenLabs audio playing successfully');
        }).catch((playError) => {
          console.error('❌ ElevenLabs audio play error:', playError);
          reject(playError);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Get default DJ voice settings
  getDefaultDJVoiceSettings(): ElevenLabsSettings {
    return {
      voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam - Professional male voice
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.2,
        use_speaker_boost: true,
      },
    };
  }

  // Get available DJ voice options
  getDJVoiceOptions(): Array<{ id: string; name: string; description: string }> {
    return [
      {
        id: 'pNInz6obpgDQGcFmaJgB',
        name: 'Adam',
        description: 'Professional male DJ voice - confident and clear'
      },
      {
        id: 'EXAVITQu4vr4xnSDxMaL',
        name: 'Bella',
        description: 'Energetic female DJ voice - upbeat and engaging'
      },
      {
        id: 'ErXwobaYiN019PkySvjV',
        name: 'Antoni',
        description: 'Smooth male voice - perfect for announcements'
      },
      {
        id: 'VR6AewLTigWG4xSOukaG',
        name: 'Arnold',
        description: 'Deep authoritative voice - great for events'
      },
      {
        id: 'piTKgcLEGmPE4e6mEKli',
        name: 'Nicole',
        description: 'Professional female voice - clear and friendly'
      },
      {
        id: 'TxGEqnHWrfWFTfGW9XjX',
        name: 'Josh',
        description: 'Young energetic male voice - perfect for parties'
      }
    ];
  }

  // Test voice with sample text
  async testVoice(voiceId: string): Promise<void> {
    const settings: ElevenLabsSettings = {
      voice_id: voiceId,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.2,
        use_speaker_boost: true,
      },
    };

    const testText = "Hey everyone! This is your AI DJ testing the voice system. How does this sound?";
    
    try {
      const audioBuffer = await this.generateSpeech(testText, settings);
      if (audioBuffer) {
        await this.playAudio(audioBuffer);
      }
    } catch (error) {
      console.error('Voice test failed:', error);
      throw error;
    }
  }
}

export const elevenLabsVoice = new ElevenLabsVoiceService('sk_07c70c046693c3952aeb0e20b4df14c74e90a2cfb06aece8');