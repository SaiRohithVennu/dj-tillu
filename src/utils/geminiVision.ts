interface EmotionAnalysis {
  dominantEmotion: string;
  confidence: number;
  energy: number;
  crowdSize: number;
  emotions: {
    happy: number;
    excited: number;
    energetic: number;
    chill: number;
    neutral: number;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class GeminiVisionAnalyzer {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private captureFrame(video: HTMLVideoElement): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0);
    
    // Convert to base64 and remove data URL prefix
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  }

  private createPrompt(): string {
    return `Analyze this image as a DJ reading the crowd. Focus on:

1. Count ONLY the clearly visible human faces/people in the image
2. Determine the dominant mood from facial expressions and body language
3. Rate the energy level of the scene from 1-10

Respond in this exact format:
Mood: [one word - excited/happy/energetic/chill/disappointed/bored/angry/sad/confused/surprised/focused/tired/neutral]
Energy: [number 1-10]
People: [exact count of visible people, if none visible say 0]

Example: "Mood: excited, Energy: 8, People: 3"`;
  }

  async analyzeEmotion(video: HTMLVideoElement): Promise<EmotionAnalysis> {
    try {
      console.log('🤖 Gemini: Capturing frame for analysis...');
      const imageBase64 = this.captureFrame(video);
      
      const requestBody = {
        contents: [{
          parts: [
            {
              text: this.createPrompt()
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 1024,
        }
      };

      console.log('🤖 Gemini: Sending request to API...');
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data: GeminiResponse = await response.json();
      console.log('🤖 Gemini: Received response');
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No candidates in Gemini response');
      }

      const responseText = data.candidates[0].content.parts[0].text;
      console.log('🤖 Gemini: Raw response:', responseText);
      
      // Parse the simple response format
      const analysis = this.parseSimpleResponse(responseText);
      console.log('🤖 Gemini: Parsed analysis:', analysis);
      
      // Validate the response structure
      if (!analysis.dominantEmotion || typeof analysis.energy !== 'number') {
        throw new Error('Invalid analysis structure from Gemini');
      }

      return analysis;
      
    } catch (error) {
      console.error('🤖 Gemini: Analysis failed:', error);
      
      // Return fallback data on error
      return {
        dominantEmotion: 'neutral',
        confidence: 0.1,
        energy: 50,
        crowdSize: 0,
        emotions: {
          happy: 0.2,
          excited: 0.2,
          energetic: 0.2,
          chill: 0.2,
          neutral: 0.2
        }
      };
    }
  }

  private parseSimpleResponse(responseText: string): EmotionAnalysis {
    // Define mood keywords first
    const moodKeywords = {
      'excited': ['excited', 'thrilled', 'ecstatic', 'pumped'],
      'energetic': ['energetic', 'active', 'dynamic', 'lively'],
      'happy': ['happy', 'joyful', 'cheerful', 'pleased', 'content'],
      'chill': ['chill', 'relaxed', 'calm', 'peaceful', 'mellow'],
      'disappointed': ['disappointed', 'let down', 'dissatisfied', 'underwhelmed', 'deflated'],
      'bored': ['bored', 'uninterested', 'disengaged', 'apathetic', 'indifferent'],
      'angry': ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'frustrated'],
      'sad': ['sad', 'unhappy', 'melancholy', 'down', 'depressed', 'gloomy'],
      'confused': ['confused', 'puzzled', 'perplexed', 'bewildered', 'uncertain'],
      'surprised': ['surprised', 'shocked', 'amazed', 'astonished', 'startled'],
      'focused': ['focused', 'concentrated', 'attentive', 'engaged', 'absorbed'],
      'tired': ['tired', 'exhausted', 'weary', 'fatigued', 'drained'],
      'neutral': ['neutral', 'normal', 'average', 'okay']
    };

    console.log('🤖 Gemini raw response:', responseText);
    
    let mood = 'neutral';
    let rating = 5; 
    let crowdSize = 0;

    // Parse structured response format: "Mood: excited, Energy: 8, People: 3"
    const moodMatch = responseText.match(/mood:\s*(\w+)/i);
    const energyMatch = responseText.match(/energy:\s*(\d+)/i);
    const peopleMatch = responseText.match(/people:\s*(\d+)/i);
    
    // Extract mood
    if (moodMatch) {
      const detectedMood = moodMatch[1].toLowerCase();
      // Verify it's a valid mood
      for (const [moodType, keywords] of Object.entries(moodKeywords)) {
        if (keywords.includes(detectedMood) || moodType === detectedMood) {
          mood = moodType;
          break;
        }
      }
    } else {
      // Fallback: search for mood keywords anywhere in response
      for (const [moodType, keywords] of Object.entries(moodKeywords)) {
        if (keywords.some(keyword => responseText.toLowerCase().includes(keyword))) {
          mood = moodType;
          break;
        }
      }
    }
    
    // Extract energy rating
    if (energyMatch) {
      const extractedRating = parseInt(energyMatch[1]);
      if (extractedRating >= 1 && extractedRating <= 10) {
        rating = extractedRating;
      }
    } else {
      // Fallback: look for any number 1-10
      const ratingMatch = responseText.match(/(\d+)(?:\/10|out of 10| on the scale)/i) || 
                         responseText.match(/(\d+)/);
      if (ratingMatch) {
        const extractedRating = parseInt(ratingMatch[1]);
        if (extractedRating >= 1 && extractedRating <= 10) {
          rating = extractedRating;
        }
      }
    }
    
    // Extract people count
    if (peopleMatch) {
      crowdSize = parseInt(peopleMatch[1]);
    } else {
      // Fallback: look for "people", "person", "faces" mentions
      const peopleKeywords = responseText.match(/(\d+)\s*(?:people|person|faces|individuals)/i);
      if (peopleKeywords) {
        crowdSize = parseInt(peopleKeywords[1]);
      }
    }
    
    console.log('🤖 Parsed results:', { mood, rating, crowdSize });

    // Convert rating to energy (1-10 scale to 0-100)
    const energy = Math.round((rating / 10) * 100);
    
    // Create emotion distribution based on detected mood
    const emotions = {
      happy: mood === 'happy' ? 0.7 : 0.1,
      excited: mood === 'excited' ? 0.7 : 0.1,
      energetic: mood === 'energetic' ? 0.7 : 0.1,
      chill: mood === 'chill' ? 0.7 : 0.1,
      neutral: mood === 'neutral' ? 0.7 : 0.1
    };
    
    // Normalize emotions to sum to 1.0
    const total = Object.values(emotions).reduce((sum, val) => sum + val, 0);
    Object.keys(emotions).forEach(key => {
      emotions[key as keyof typeof emotions] /= total;
    });

    return {
      dominantEmotion: mood,
      confidence: rating / 10, // Convert 1-10 to 0-1
      energy,
      crowdSize,
      emotions
    };
  }

  // Map Gemini emotions to DJ moods
  mapEmotionToMood(emotion: string): string {
    const moodMap: { [key: string]: string } = {
      'excited': 'Excited',
      'energetic': 'Energetic',
      'happy': 'Happy',
      'chill': 'Chill',
      'disappointed': 'Disappointed',
      'bored': 'Bored',
      'angry': 'Angry',
      'sad': 'Sad',
      'confused': 'Confused',
      'surprised': 'Surprised',
      'focused': 'Focused',
      'tired': 'Tired',
      'neutral': 'Chill'
    };
    
    return moodMap[emotion.toLowerCase()] || 'Chill';
  }
}