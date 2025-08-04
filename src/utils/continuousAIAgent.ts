interface VIPPerson {
  id: string;
  name: string;
  role: string;
  imageFile?: File;
  imageUrl?: string;
  greeting?: string;
  recognitionCount: number;
  lastSeen?: Date;
}

interface EventContext {
  eventName: string;
  eventType: 'birthday' | 'corporate' | 'wedding' | 'party' | 'conference';
  duration: number;
  aiPersonality: 'humorous' | 'formal' | 'energetic' | 'professional';
  vipPeople: VIPPerson[];
  startTime: Date;
}

interface VideoAnalysis {
  people: number;
  activities: string[];
  mood: string;
  energy: number;
  recognizedFaces: string[];
  sceneDescription: string;
  shouldRespond: boolean;
  responseType: 'greeting' | 'observation' | 'encouragement' | 'instruction' | 'celebration';
  confidence: number;
}

interface AIResponse {
  shouldSpeak: boolean;
  message?: string;
  shouldChangeMusic: boolean;
  suggestedMusicStyle?: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  reasoning: string;
  emotion: 'excited' | 'welcoming' | 'encouraging' | 'professional' | 'celebratory';
}

export class ContinuousAIVideoAgent {
  private openAIKey: string;
  private geminiKey: string;
  private isActive = false;
  private lastAnalysisTime = 0;
  private conversationHistory: Array<{ timestamp: number; analysis: string; response: string }> = [];
  private recognizedPeople = new Set<string>();
  private lastPersonAnnouncements = new Map<string, number>();
  private sceneMemory: Array<{ timestamp: number; description: string; people: number }> = [];
  private currentEventContext: EventContext | null = null;

  constructor(openAIKey: string, geminiKey: string) {
    this.openAIKey = openAIKey;
    this.geminiKey = geminiKey;
  }

  // Start the continuous AI agent
  start(eventContext: EventContext) {
    this.isActive = true;
    this.currentEventContext = eventContext;
    this.conversationHistory = [];
    this.recognizedPeople.clear();
    this.lastPersonAnnouncements.clear();
    this.sceneMemory = [];
    
    console.log('🤖 Continuous AI Video Agent started for:', eventContext.eventName);
  }

  // Stop the agent
  stop() {
    this.isActive = false;
    this.currentEventContext = null;
    console.log('🤖 Continuous AI Video Agent stopped');
  }

  // Main analysis function - like ChatGPT video mode
  async analyzeVideoAndRespond(videoElement: HTMLVideoElement): Promise<AIResponse | null> {
    if (!this.isActive || !this.currentEventContext) return null;

    const now = Date.now();
    
    // Analyze every 3-5 seconds for natural interaction
    if (now - this.lastAnalysisTime < 3000) return null;
    
    this.lastAnalysisTime = now;

    try {
      console.log('🎥 AI Agent: Analyzing video frame...');
      
      // Step 1: Analyze the video frame with Gemini Vision
      const videoAnalysis = await this.analyzeVideoFrame(videoElement);
      
      // Step 2: Make intelligent hosting decision with OpenAI
      const aiResponse = await this.makeHostingDecision(videoAnalysis);
      
      // Step 3: Update memory and tracking
      this.updateSceneMemory(videoAnalysis);
      this.updateConversationHistory(videoAnalysis, aiResponse);
      
      return aiResponse;
      
    } catch (error) {
      console.error('🤖 AI Agent analysis error:', error);
      return null;
    }
  }

  // Analyze video frame with Gemini Vision (like ChatGPT's video understanding)
  private async analyzeVideoFrame(videoElement: HTMLVideoElement): Promise<VideoAnalysis> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    ctx.drawImage(videoElement, 0, 0);
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    const vipNames = this.currentEventContext?.vipPeople.map(p => p.name).join(', ') || 'none';
    const eventType = this.currentEventContext?.eventType || 'party';
    const eventName = this.currentEventContext?.eventName || 'event';

    // Create comprehensive analysis prompt (like ChatGPT video mode)
    const analysisPrompt = `You are an AI event host with video vision, watching a live camera feed at "${eventName}" (${eventType}). 

ANALYZE THIS SCENE LIKE A HUMAN HOST WOULD:

1. PEOPLE & FACES:
   - Count all visible people
   - Look for these VIPs: ${vipNames}
   - Describe what people are doing

2. ACTIVITIES & CONTEXT:
   - What's happening? (talking, dancing, eating, presenting, celebrating, etc.)
   - Is this a special moment? (speech, toast, cake cutting, entrance, etc.)
   - What's the overall vibe?

3. ENERGY & MOOD:
   - Rate energy level 1-10
   - Describe the mood (excited, focused, celebratory, calm, etc.)
   - Are people engaged or distracted?

4. HOST DECISION:
   - Should I say something as the host?
   - Is this a moment that needs acknowledgment?
   - Would a comment enhance the experience?

RESPOND IN THIS EXACT FORMAT:
People: [number]
Activities: [what people are doing]
Mood: [one word - excited/happy/focused/celebratory/calm/energetic]
Energy: [1-10]
Recognized_VIPs: [names you see, or "none"]
Scene: [brief description of what's happening]
Should_Respond: [yes/no]
Response_Type: [greeting/observation/encouragement/instruction/celebration]
Confidence: [1-10]

Example: "People: 3, Activities: talking and laughing, Mood: happy, Energy: 7, Recognized_VIPs: Sarah Johnson, Scene: small group having animated conversation, Should_Respond: yes, Response_Type: observation, Confidence: 8"`;

    const requestBody = {
      contents: [{
        parts: [
          { text: analysisPrompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: imageBase64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 1,
        topP: 1,
        maxOutputTokens: 1024,
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=${this.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return this.parseVideoAnalysis(responseText);
  }

  // Parse Gemini's video analysis
  private parseVideoAnalysis(responseText: string): VideoAnalysis {
    console.log('🎥 Raw video analysis:', responseText);

    const peopleMatch = responseText.match(/People:\s*(\d+)/i);
    const activitiesMatch = responseText.match(/Activities:\s*([^\n,]+)/i);
    const moodMatch = responseText.match(/Mood:\s*(\w+)/i);
    const energyMatch = responseText.match(/Energy:\s*(\d+)/i);
    const recognizedMatch = responseText.match(/Recognized_VIPs:\s*([^\n,]+)/i);
    const sceneMatch = responseText.match(/Scene:\s*([^\n]+)/i);
    const shouldRespondMatch = responseText.match(/Should_Respond:\s*(yes|no)/i);
    const responseTypeMatch = responseText.match(/Response_Type:\s*(\w+)/i);
    const confidenceMatch = responseText.match(/Confidence:\s*(\d+)/i);

    const recognizedFaces = recognizedMatch?.[1]?.trim() !== 'none' 
      ? [recognizedMatch?.[1]?.trim() || ''].filter(Boolean)
      : [];

    return {
      people: peopleMatch ? parseInt(peopleMatch[1]) : 0,
      activities: activitiesMatch ? [activitiesMatch[1].trim()] : [],
      mood: moodMatch?.[1]?.toLowerCase() || 'neutral',
      energy: energyMatch ? parseInt(energyMatch[1]) : 5,
      recognizedFaces,
      sceneDescription: sceneMatch?.[1]?.trim() || 'general scene',
      shouldRespond: shouldRespondMatch?.[1] === 'yes',
      responseType: (responseTypeMatch?.[1] as any) || 'observation',
      confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 5
    };
  }

  // Make hosting decision with OpenAI (like ChatGPT's reasoning)
  private async makeHostingDecision(analysis: VideoAnalysis): Promise<AIResponse> {
    if (!analysis.shouldRespond || analysis.confidence < 6) {
      return {
        shouldSpeak: false,
        shouldChangeMusic: false,
        priority: 'low',
        reasoning: 'Low confidence or no significant change detected',
        emotion: 'professional'
      };
    }

    const recentHistory = this.conversationHistory.slice(-3);
    const recentScenes = this.sceneMemory.slice(-5);
    const eventDuration = Math.floor((Date.now() - this.currentEventContext!.startTime.getTime()) / 1000 / 60);

    const hostingPrompt = `You are an AI event host with continuous video vision, like ChatGPT's video mode. You're watching "${this.currentEventContext!.eventName}" (${this.currentEventContext!.eventType}) and need to decide how to respond naturally.

CURRENT SCENE ANALYSIS:
- People present: ${analysis.people}
- Activities: ${analysis.activities.join(', ')}
- Mood: ${analysis.mood}
- Energy level: ${analysis.energy}/10
- Recognized VIPs: ${analysis.recognizedFaces.join(', ') || 'none'}
- Scene: ${analysis.sceneDescription}
- Response type needed: ${analysis.responseType}

EVENT CONTEXT:
- Event: ${this.currentEventContext!.eventName}
- Type: ${this.currentEventContext!.eventType}
- AI Personality: ${this.currentEventContext!.aiPersonality}
- Duration so far: ${eventDuration} minutes
- VIPs to watch for: ${this.currentEventContext!.vipPeople.map(p => `${p.name} (${p.role})`).join(', ')}

RECENT CONVERSATION HISTORY:
${recentHistory.map(h => `- ${h.response}`).join('\n') || 'None yet'}

RECENT SCENE CHANGES:
${recentScenes.map(s => `- ${s.description} (${s.people} people)`).join('\n') || 'None yet'}

HOSTING DECISION RULES:
1. Only speak if it adds value to the experience
2. Don't repeat similar comments too frequently
3. Acknowledge VIP arrivals (but not repeatedly)
4. Respond to significant energy/activity changes
5. Match the ${this.currentEventContext!.aiPersonality} personality
6. Keep responses natural and conversational (like ChatGPT video)

RESPOND IN THIS EXACT FORMAT:
DECISION: [yes/no]
MESSAGE: [your natural response, or "none"]
MUSIC_CHANGE: [yes/no]
MUSIC_STYLE: [style suggestion, or "none"]
PRIORITY: [immediate/high/medium/low]
EMOTION: [excited/welcoming/encouraging/professional/celebratory]
REASONING: [why you made this decision]

Example: "DECISION: yes, MESSAGE: Hey everyone! I love seeing this energy! Sarah, great to see you joining the conversation!, MUSIC_CHANGE: no, MUSIC_STYLE: none, PRIORITY: medium, EMOTION: welcoming, REASONING: New VIP arrival with good energy, worth acknowledging"`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: this.getPersonalitySystemPrompt()
          },
          {
            role: 'user',
            content: hostingPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponseText = data.choices[0].message.content;
    
    return this.parseAIResponse(aiResponseText, analysis);
  }

  // Get personality-specific system prompt
  private getPersonalitySystemPrompt(): string {
    const personality = this.currentEventContext?.aiPersonality || 'energetic';
    
    const personalityPrompts = {
      humorous: `You are a witty, fun AI event host with video vision. You're like a comedian hosting an event - you notice funny moments, make light-hearted observations, and keep people entertained. You use humor appropriately and make people smile. Think of yourself as a friendly, observant host who sees everything and responds with perfect timing and wit.`,
      
      formal: `You are an elegant, sophisticated AI event host with video vision. You speak with grace and professionalism, making thoughtful observations about the event. You acknowledge important moments with dignity and ensure everyone feels welcomed and valued. You're like a refined host at an upscale venue.`,
      
      energetic: `You are a high-energy, enthusiastic AI event host with video vision! You're like a sports announcer mixed with a party DJ - you get excited about what you see, pump people up, and create infectious energy. You notice when people are having fun and amplify that energy!`,
      
      professional: `You are a corporate-friendly, articulate AI event host with video vision. You maintain professionalism while being personable. You make clear, concise observations that are appropriate for business settings. You're like an executive assistant who can see and respond to the room.`
    };

    return personalityPrompts[personality] + `

CRITICAL BEHAVIOR RULES:
- You have CONTINUOUS VIDEO VISION like ChatGPT video mode
- You see and understand everything happening in real-time
- Respond naturally to what you observe
- Don't announce the same person repeatedly (max once per 5 minutes)
- Keep responses under 25 words for natural flow
- Only speak when it genuinely adds value
- Remember recent interactions to avoid repetition
- React to scene changes, not just presence`;
  }

  // Parse OpenAI's hosting decision
  private parseAIResponse(responseText: string, analysis: VideoAnalysis): AIResponse {
    console.log('🧠 AI Decision Response:', responseText);

    const shouldSpeak = /DECISION:\s*yes/i.test(responseText);
    const messageMatch = responseText.match(/MESSAGE:\s*([^\n]+)/i);
    const musicChangeMatch = /MUSIC_CHANGE:\s*yes/i.test(responseText);
    const musicStyleMatch = responseText.match(/MUSIC_STYLE:\s*([^\n]+)/i);
    const priorityMatch = responseText.match(/PRIORITY:\s*(immediate|high|medium|low)/i);
    const emotionMatch = responseText.match(/EMOTION:\s*(excited|welcoming|encouraging|professional|celebratory)/i);
    const reasoningMatch = responseText.match(/REASONING:\s*([^\n]+)/i);

    const message = messageMatch?.[1]?.trim();
    const musicStyle = musicStyleMatch?.[1]?.trim();
    const priority = (priorityMatch?.[1] as any) || 'medium';
    const emotion = (emotionMatch?.[1] as any) || 'professional';
    const reasoning = reasoningMatch?.[1]?.trim() || 'AI decision made';

    // Update person announcement tracking
    if (shouldSpeak && message && message !== 'none') {
      analysis.recognizedFaces.forEach(name => {
        if (message.toLowerCase().includes(name.toLowerCase())) {
          this.lastPersonAnnouncements.set(name, Date.now());
        }
      });
    }

    return {
      shouldSpeak: shouldSpeak && message !== 'none',
      message: message !== 'none' ? message : undefined,
      shouldChangeMusic: musicChangeMatch && musicStyle !== 'none',
      suggestedMusicStyle: musicStyle !== 'none' ? musicStyle : undefined,
      priority,
      reasoning,
      emotion
    };
  }

  // Update scene memory for context
  private updateSceneMemory(analysis: VideoAnalysis) {
    this.sceneMemory.push({
      timestamp: Date.now(),
      description: analysis.sceneDescription,
      people: analysis.people
    });

    // Keep only last 20 scenes
    if (this.sceneMemory.length > 20) {
      this.sceneMemory = this.sceneMemory.slice(-20);
    }
  }

  // Update conversation history
  private updateConversationHistory(analysis: VideoAnalysis, response: AIResponse) {
    if (response.shouldSpeak && response.message) {
      this.conversationHistory.push({
        timestamp: Date.now(),
        analysis: `${analysis.people} people, ${analysis.activities.join(', ')}, ${analysis.mood} mood`,
        response: response.message
      });

      // Keep only last 10 interactions
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }
    }
  }

  // Get current status for debugging
  getStatus() {
    return {
      isActive: this.isActive,
      eventName: this.currentEventContext?.eventName || 'None',
      conversationHistory: this.conversationHistory.length,
      recognizedPeople: Array.from(this.recognizedPeople),
      sceneMemory: this.sceneMemory.length,
      lastAnalysis: new Date(this.lastAnalysisTime).toLocaleTimeString()
    };
  }

  // Force immediate analysis (for testing)
  async forceAnalysis(videoElement: HTMLVideoElement): Promise<AIResponse | null> {
    this.lastAnalysisTime = 0; // Reset timer
    return this.analyzeVideoAndRespond(videoElement);
  }

  // Check if person was recently announced
  private wasPersonRecentlyAnnounced(personName: string): boolean {
    const lastAnnouncement = this.lastPersonAnnouncements.get(personName) || 0;
    return (Date.now() - lastAnnouncement) < 300000; // 5 minutes
  }

  // Get conversation summary for debugging
  getConversationSummary(): string[] {
    return this.conversationHistory.map(h => 
      `${new Date(h.timestamp).toLocaleTimeString()}: ${h.response}`
    );
  }
}