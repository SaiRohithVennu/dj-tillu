# 🎤 DJ Tillu - Complete System Documentation

## 📋 **Table of Contents**
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [API Integrations](#api-integrations)
5. [Data Flow](#data-flow)
6. [AI Systems](#ai-systems)
7. [Component Hierarchy](#component-hierarchy)
8. [Event Flow Management](#event-flow-management)
9. [Voice & Audio System](#voice--audio-system)
10. [Database Schema](#database-schema)
11. [Environment Variables](#environment-variables)
12. [Deployment](#deployment)

---

## 🎯 **System Overview**

**DJ Tillu** is an AI-powered live DJ and event hosting application that combines:
- **Real-time video analysis** (Gemini Vision)
- **Face recognition** (AWS Rekognition)
- **Intelligent conversation** (OpenAI GPT-4)
- **Professional voice synthesis** (ElevenLabs)
- **Music streaming** (Audius + Supabase)
- **Live event management** (Smart Event System)

### **Core Capabilities**
- 🎥 **Continuous video monitoring** (like ChatGPT video mode)
- 🎯 **VIP face recognition** with personalized greetings
- 🎤 **Natural voice announcements** with professional AI voices
- 🎵 **Intelligent music selection** based on crowd mood
- 📅 **Event timeline management** with special moment detection
- 🎪 **Multi-personality hosting** (humorous, formal, energetic, professional)

---

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    DJ TILLU ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + TypeScript + Tailwind)                  │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │ Video Feed  │ AI Panels   │ Music UI    │ Controls    │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  AI Processing Layer                                        │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │ Gemini      │ OpenAI      │ AWS         │ ElevenLabs  │  │
│  │ Vision      │ GPT-4       │ Rekognition │ Voice       │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Data & Storage Layer                                       │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │ Supabase    │ Audius      │ Browser     │ Local       │  │
│  │ Database    │ Music API   │ Storage     │ State       │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 **File Structure**

### **Core Application**
```
src/
├── App.tsx                          # Main application orchestrator
├── main.tsx                         # React entry point
└── index.css                        # Global styles (Tailwind)
```

### **Components** (`src/components/`)
```
├── EventSetupWizard.tsx             # Initial event configuration
├── DraggablePanel.tsx               # Resizable/draggable UI panels
├── FullscreenVideoBackground.tsx    # Camera feed management
├── VoiceAnnouncements.tsx           # Voice synthesis & queue management
├── ContinuousAIAgentPanel.tsx       # ChatGPT-like video agent UI
├── ServerSideAWSPanel.tsx           # Face recognition status
├── SmartEventDashboard.tsx          # Event timeline & VIP tracking
├── TrackList.tsx                    # Music library interface
├── NowPlaying.tsx                   # Current track display
├── FloatingControls.tsx             # Main play/pause controls
├── AudiusBrowser.tsx                # Music discovery from Audius
├── SupabaseTrackManager.tsx         # Upload/manage audio files
├── WhooshMoodBrowser.tsx            # Mood-based music discovery
├── AudioVisualizer.tsx              # Real-time audio visualization
├── EventDetailsManager.tsx          # Event configuration
└── MoodPlaylistManager.tsx          # Mood-based playlists
```

### **Hooks** (`src/hooks/`)
```
├── useAudioPlayer.ts                # Audio playback management
├── useContinuousAIAgent.ts          # ChatGPT-like video agent
├── useSmartEventEmcee.ts            # Enhanced event hosting
├── useSmartEventDJ.ts               # Event timeline management
├── useServerSideAWSFaceRecognition.ts # Face recognition integration
├── useTrackLibrary.ts               # Music library management
├── useDraggable.ts                  # Drag & drop functionality
├── useResizable.ts                  # Panel resizing
└── useGeminiMoodAnalysis.ts         # Video mood analysis
```

### **Utilities** (`src/utils/`)
```
├── continuousAIAgent.ts             # Core AI video agent logic
├── elevenLabsVoice.ts               # Professional voice synthesis
├── geminiVision.ts                  # Video analysis with Gemini
├── openAIEventHost.ts               # Event hosting decisions
├── serverSideAWS.ts                 # Face recognition client
├── audiusAPI.ts                     # Music streaming integration
├── supabaseStorage.ts               # Audio file management
├── audioGenerator.ts                # Synthetic audio generation
├── browserbaseAPI.ts                # Web scraping for moods
└── awsRekognition.ts                # Direct AWS integration
```

### **Data** (`src/data/`)
```
├── tracks.ts                        # Track interface & utilities
└── moodPlaylists.ts                 # Mood-based playlist management
```

### **Backend** (`supabase/functions/`)
```
└── aws-face-recognition/
    └── index.ts                     # Server-side AWS face recognition
```

---

## 🔌 **API Integrations**

### **1. OpenAI GPT-4** 
**Purpose:** Intelligent event hosting decisions
**Endpoint:** `https://api.openai.com/v1/chat/completions`
**Usage:**
```typescript
// Makes hosting decisions based on video analysis
const decision = await openAIEventHost.makeEventDecision(
  eventContext,
  crowdAnalysis,
  currentTrack,
  isPlaying
);
```

### **2. Google Gemini Vision**
**Purpose:** Real-time video analysis
**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent`
**Usage:**
```typescript
// Analyzes video frames for mood, energy, people count
const analysis = await geminiAnalyzer.analyzeEmotion(videoElement);
```

### **3. ElevenLabs Voice**
**Purpose:** Professional AI voice synthesis
**Endpoint:** `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
**Usage:**
```typescript
// Generates natural speech from text
const audioBuffer = await elevenLabsVoice.generateSpeech(text, settings);
```

### **4. AWS Rekognition** (Server-Side)
**Purpose:** VIP face recognition
**Implementation:** Supabase Edge Function
**Usage:**
```typescript
// Recognizes VIP people in video feed
const result = await serverSideAWS.recognizeFaces(eventId, videoElement);
```

### **5. Audius Music API**
**Purpose:** Decentralized music streaming
**Endpoint:** `https://discoveryprovider.audius.co/v1/`
**Usage:**
```typescript
// Streams real music tracks
const tracks = await audiusAPI.getTrendingTracks(genre, limit);
```

### **6. Supabase**
**Purpose:** Database & file storage
**Services:** Database, Storage, Edge Functions
**Usage:**
```typescript
// Stores uploaded audio files and metadata
const result = await audioStorage.uploadTrack(file, metadata);
```

---

## 🔄 **Data Flow**

### **Main Application Flow**
```
1. User Setup
   ├── Event Configuration (name, type, duration)
   ├── VIP People Upload (photos for recognition)
   └── AI Personality Selection

2. System Initialization
   ├── Camera Access Request
   ├── AI Services Connection
   ├── Music Library Loading
   └── Event Context Creation

3. Live Operation
   ├── Continuous Video Analysis (3-5s intervals)
   ├── Face Recognition Scanning (2s intervals)
   ├── Music Mood Adaptation
   └── Voice Announcements

4. Event Management
   ├── Timeline Tracking
   ├── Special Moment Detection
   ├── VIP Recognition & Greetings
   └── Energy-Based Music Selection
```

### **AI Decision Pipeline**
```
Video Frame → Gemini Analysis → OpenAI Reasoning → Action Execution
     ↓              ↓               ↓               ↓
  Raw Image → Scene Understanding → Host Decision → Voice/Music
```

**Detailed Steps:**
1. **Video Capture:** Extract frame from live camera feed
2. **Vision Analysis:** Gemini identifies people, activities, mood, energy
3. **Context Building:** Combine with event details, VIP list, conversation history
4. **Decision Making:** OpenAI determines if/how to respond
5. **Action Execution:** Trigger voice announcement and/or music change

---

## 🧠 **AI Systems**

### **1. Continuous AI Video Agent**
**File:** `src/utils/continuousAIAgent.ts`
**Purpose:** ChatGPT-like video interaction

**Key Features:**
- **Continuous monitoring** every 3-5 seconds
- **Conversation memory** (last 10 interactions)
- **Scene memory** (last 20 scene descriptions)
- **Natural responses** based on what it sees
- **Personality adaptation** (humorous, formal, energetic, professional)

**Flow:**
```typescript
1. analyzeVideoFrame(videoElement) → VideoAnalysis
2. makeHostingDecision(analysis) → AIResponse  
3. updateMemory(analysis, response)
4. executeActions(response)
```

### **2. Smart Event Emcee**
**File:** `src/hooks/useSmartEventEmcee.ts`
**Purpose:** Enhanced event hosting with face recognition

**Key Features:**
- **VIP recognition integration**
- **Event timeline awareness**
- **Special moment detection**
- **Contextual announcements**
- **Music adaptation**

### **3. Face Recognition System**
**File:** `src/utils/serverSideAWS.ts` + Edge Function
**Purpose:** Server-side VIP recognition

**Flow:**
```typescript
1. Upload VIP photos → S3 bucket
2. Index faces → Rekognition collection
3. Scan video frames → Face matching
4. Trigger personalized greetings
```

---

## 🎵 **Component Hierarchy**

```
App.tsx (Root)
├── EventSetupWizard.tsx (Initial setup)
├── FullscreenVideoBackground.tsx (Camera feed)
├── DraggablePanel[] (Multiple panels)
│   ├── TrackList.tsx (Music library)
│   ├── SmartEventDashboard.tsx (Event status)
│   ├── ContinuousAIAgentPanel.tsx (AI video agent)
│   ├── ServerSideAWSPanel.tsx (Face recognition)
│   └── VoiceAnnouncements.tsx (Voice system)
├── NowPlaying.tsx (Current track - conditional)
├── FloatingControls.tsx (Main controls)
└── Settings Panel (Conditional)
    ├── EventDetailsManager.tsx
    ├── AudiusBrowser.tsx
    ├── SupabaseTrackManager.tsx
    ├── WhooshMoodBrowser.tsx
    └── MoodPlaylistManager.tsx
```

---

## 📅 **Event Flow Management**

### **Event Phases**
```typescript
interface EventFlowItem {
  time: string;           // "19:30"
  phase: 'arrival' | 'cocktail' | 'dinner' | 'dancing' | 'closing';
  energyTarget: number;   // 1-10
  musicStyle: string;     // "Upbeat Pop"
  duration: number;       // minutes
}
```

### **Special Moments**
```typescript
interface SpecialMoment {
  time: string;           // "20:00"
  type: 'entrance' | 'speech' | 'cake_cutting' | 'first_dance' | 'toast';
  description: string;    // "Birthday cake ceremony"
  musicCue?: string;      // "Happy Birthday Song"
  announcementTemplate?: string;
}
```

### **VIP Management**
```typescript
interface VIPGuest {
  id: string;
  name: string;
  role: string;           // "CEO", "Birthday Person", "Bride"
  faceImageUrl?: string;
  personalizedGreeting?: string;
  recognitionCount: number;
  lastSeen?: Date;
}
```

---

## 🎤 **Voice & Audio System**

### **Voice Announcement Queue**
```typescript
interface AnnouncementQueue {
  id: string;
  message: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  timestamp: number;
}
```

### **Audio Processing Pipeline**
```
1. Text Input → ElevenLabs API → Audio Buffer
2. Audio Ducking → Lower background music
3. Voice Playback → Professional AI voice
4. Audio Unducking → Restore music volume
5. Queue Processing → Next announcement
```

### **Voice Settings**
```typescript
interface VoiceSettings {
  voiceId: string;        // ElevenLabs voice ID
  speed: number;          // 0.5 - 2.0
  volume: number;         // 0.1 - 1.0
}
```

---

## 🗄️ **Database Schema**

### **Tracks Table** (Supabase)
```sql
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  duration INTEGER NOT NULL,
  bpm INTEGER NOT NULL,
  genre TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  audio_url TEXT,
  album_art TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Storage Buckets**
- **audio-tracks:** User uploaded MP3/WAV files (50MB limit)
- **dj-tillu-rekognition-bucket:** VIP photos for face recognition

---

## 🔑 **Environment Variables**

### **Required Variables**
```env
# Supabase (Database & Storage)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# AI Services
VITE_OPENAI_API_KEY=sk-proj-...          # ChatGPT-like hosting
VITE_GEMINI_API_KEY=AIzaSy...            # Video analysis
VITE_ELEVENLABS_API_KEY=sk_...           # Professional voice

# AWS (Face Recognition)
VITE_AWS_ACCESS_KEY_ID=AKIA...
VITE_AWS_SECRET_ACCESS_KEY=...
VITE_AWS_REGION=us-west-2

# Optional
VITE_WANDB_API_KEY=...                   # Analytics logging
```

---

## 🎯 **Key Features & Flows**

### **1. Event Setup Flow**
```
EventSetupWizard → Event Details → VIP People → AI Personality → Event Start
```

### **2. AI Video Agent Flow** (Like ChatGPT Video)
```
Video Frame → Gemini Analysis → OpenAI Decision → Voice Response
     ↓              ↓               ↓               ↓
  Live Feed → Scene Understanding → Host Decision → Natural Speech
```

### **3. Face Recognition Flow**
```
Video Frame → AWS Rekognition → VIP Match → Personalized Greeting
     ↓              ↓               ↓               ↓
  Live Feed → Face Detection → Identity Match → Custom Announcement
```

### **4. Music Intelligence Flow**
```
Crowd Analysis → Mood Detection → Track Selection → Smooth Transition
     ↓              ↓               ↓               ↓
  Video + Audio → AI Analysis → Smart Matching → Crossfade
```

---

## 🎪 **Event Types & Personalities**

### **Event Types**
- **🎂 Birthday:** Celebration-focused, cake moments, age-appropriate music
- **🏢 Corporate:** Professional tone, networking awareness, presentation cues
- **💒 Wedding:** Romantic moments, special dances, ceremony awareness
- **🎉 Party:** High energy, dancing focus, social interaction
- **🎤 Conference:** Presentation support, speaker introductions, professional atmosphere

### **AI Personalities**
- **😄 Humorous:** Witty, entertaining, light-hearted observations
- **🎩 Formal:** Elegant, sophisticated, dignified announcements
- **⚡ Energetic:** High-energy, pump-up style, enthusiastic responses
- **👔 Professional:** Corporate-friendly, clear, articulate communication

---

## 🎵 **Music System**

### **Music Sources**
1. **Audius API:** Decentralized music streaming
2. **Supabase Storage:** User uploaded tracks
3. **Generated Audio:** Synthetic tracks for fallback
4. **WhooshMusic:** Mood-based discovery (via Browserbase scraping)

### **Track Interface**
```typescript
interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;       // seconds
  bpm: number;           // beats per minute
  genre: string;
  audioUrl: string;      // streaming URL
  albumArt?: string;
  license: string;
}
```

### **Mood-Based Selection**
```typescript
const moodToGenre = {
  'excited': ['Electronic', 'Techno', 'Dubstep'],
  'energetic': ['Techno', 'House', 'Electronic'],
  'happy': ['Pop', 'House', 'Electronic'],
  'chill': ['Ambient', 'Jazz', 'R&B'],
  'euphoric': ['Trance', 'Electronic', 'Techno']
};
```

---

## 🔄 **Real-Time Processing**

### **Analysis Intervals**
- **AI Video Agent:** 3-5 seconds (natural conversation timing)
- **Face Recognition:** 2-3 seconds (VIP detection)
- **Mood Analysis:** 30 seconds (avoid over-analysis)
- **Music Adaptation:** 15 seconds (smooth transitions)

### **Memory Management**
- **Conversation History:** Last 10 interactions
- **Scene Memory:** Last 20 scene descriptions
- **VIP Announcements:** 5-minute cooldown per person
- **Mood History:** Last 50 mood readings

---

## 🎯 **Smart Decision Making**

### **AI Decision Factors**
1. **Event Context:** Type, duration, phase
2. **Crowd Analysis:** Size, energy, mood
3. **VIP Presence:** New arrivals, recognition confidence
4. **Conversation History:** Avoid repetition
5. **Timing:** Appropriate moments for announcements
6. **Music Context:** Current track, energy level

### **Response Priorities**
- **Immediate:** VIP arrivals, special moments
- **High:** Significant crowd changes, energy shifts
- **Medium:** General observations, mood comments
- **Low:** Background context, subtle adjustments

---

## 🚀 **Deployment**

### **Frontend Deployment** (Netlify)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:** All VITE_* variables
- **Live URL:** https://splendid-souffle-0d083c.netlify.app

### **Backend Services**
- **Supabase Edge Functions:** AWS face recognition
- **Database:** PostgreSQL with RLS policies
- **Storage:** Audio files with public access

---

## 🔧 **Technical Implementation**

### **State Management**
- **React Hooks:** Custom hooks for each major feature
- **Local State:** Component-level state management
- **Global Events:** Custom events for cross-component communication
- **Memory Management:** Circular buffers for history tracking

### **Performance Optimizations**
- **Debounced Analysis:** Prevent excessive API calls
- **Image Compression:** Optimize video frames for analysis
- **Audio Ducking:** Smooth volume transitions
- **Queue Management:** Sequential voice processing
- **Caching:** Mood data and track information

### **Error Handling**
- **Graceful Degradation:** Fallback to browser speech if ElevenLabs fails
- **Retry Logic:** Automatic retries for failed API calls
- **User Feedback:** Clear error messages and status indicators
- **Offline Support:** Generated audio when streaming fails

---

## 🎪 **User Experience Flow**

### **1. Initial Setup (30 seconds)**
```
Welcome Screen → Event Details → VIP Photos → AI Personality → Ready!
```

### **2. Live Operation**
```
Camera On → AI Watching → Music Playing → Natural Hosting
    ↓           ↓            ↓             ↓
Video Feed → Scene Analysis → Track Selection → Voice Announcements
```

### **3. Interaction Examples**

**Scenario 1: VIP Arrival**
```
1. Camera detects new face
2. AWS recognizes "Sarah Johnson (CEO)"
3. AI decides: "Should announce CEO arrival"
4. Voice: "Ladies and gentlemen, our CEO Sarah Johnson has joined us!"
5. Music: Continues current track (no interruption needed)
```

**Scenario 2: Energy Shift**
```
1. Gemini detects: "People dancing, high energy"
2. AI decides: "Energy increased, should pump up music"
3. Voice: "I love seeing this energy! Let's turn it up!"
4. Music: Switches to higher BPM track
```

**Scenario 3: Special Moment**
```
1. Timeline detects: "20:00 - Cake cutting time"
2. AI announces: "It's time for the moment we've all been waiting for!"
3. Music: Fades to background volume
4. Voice: "Everyone gather around for the cake cutting ceremony!"
```

---

## 🎨 **UI/UX Design**

### **Design Principles**
- **Fullscreen Video Background:** Immersive camera feed
- **Draggable Panels:** Customizable interface layout
- **Glassmorphism:** Translucent panels with backdrop blur
- **Color-Coded Systems:** Purple (AI), Blue (Face Recognition), Green (Music)
- **Real-Time Indicators:** Live status, analysis progress, queue status

### **Responsive Layout**
- **Desktop:** Multi-panel layout with draggable positioning
- **Mobile:** Stacked panels with touch-friendly controls
- **Accessibility:** High contrast, clear typography, keyboard navigation

---

## 📊 **Analytics & Monitoring**

### **Wandb Integration** (Optional)
- **Session Tracking:** Duration, interactions, decisions
- **Mood Analytics:** Energy trends, crowd response
- **AI Performance:** Decision accuracy, response timing
- **Music Analytics:** Track changes, mood transitions

### **Console Logging**
- **Detailed Debug Info:** All AI decisions and reasoning
- **Performance Metrics:** API response times, error rates
- **User Interactions:** Button clicks, settings changes
- **System Status:** Service health, connection status

---

## 🔮 **Future Enhancements**

### **Planned Features**
- **Multi-Camera Support:** Multiple angle analysis
- **Advanced Choreography:** Dance move recognition
- **Social Media Integration:** Live streaming to platforms
- **Advanced Analytics:** Crowd heatmaps, engagement metrics
- **Custom Voice Training:** Personalized AI voice models
- **Gesture Recognition:** Hand signals for DJ control

### **Technical Improvements**
- **WebRTC Integration:** Lower latency video processing
- **Edge Computing:** Faster face recognition
- **Advanced Caching:** Smarter content delivery
- **Mobile App:** Native iOS/Android versions

---

## 🎯 **System Strengths**

1. **🧠 True AI Intelligence:** Not just automation, but genuine understanding
2. **🎥 Continuous Awareness:** Never stops watching and learning
3. **🎤 Natural Interaction:** Conversational, not robotic
4. **🎵 Musical Intelligence:** Adapts to real crowd energy
5. **👥 Personal Recognition:** Knows who's who
6. **⚡ Real-Time Response:** Immediate reaction to changes
7. **🎪 Event Expertise:** Understands different event types
8. **🔧 Highly Configurable:** Adapts to any event style

---

## 🏆 **Innovation Summary**

**DJ Tillu** represents a breakthrough in AI-powered event hosting by combining:

- **Computer Vision** (Gemini) for scene understanding
- **Natural Language Processing** (OpenAI) for intelligent responses  
- **Face Recognition** (AWS) for personalized interactions
- **Voice Synthesis** (ElevenLabs) for professional announcements
- **Music Intelligence** (Audius + AI) for perfect soundtrack selection
- **Event Management** (Custom) for timeline awareness

The result is an **autonomous digital event host** that can see, think, remember, and respond just like a professional human DJ/emcee - but never gets tired, never forgets a name, and always knows the perfect thing to say! 🎪✨

---

*Built with React, TypeScript, Tailwind CSS, and powered by cutting-edge AI services.*