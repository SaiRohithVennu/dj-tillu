# 🎵 DJ Tillu - AI-Powered Live DJ Experience

An intelligent DJ application that uses AI vision to read crowd emotions and automatically adjusts music in real-time.

## ✨ Features

- **🤖 AI Mood Detection** - Uses Gemini Vision API to analyze crowd emotions
- **🎵 Automatic Song Selection** - Changes tracks based on detected mood and energy
- **📹 Live Video Analysis** - Real-time webcam feed analysis
- **🎧 Smooth Transitions** - Professional DJ-style crossfades
- **🎤 Voice Announcements** - AI DJ announcements during transitions
- **🎶 Music Integration** - Supports Audius streaming and Supabase storage
- **📱 Responsive Design** - Works on desktop and mobile

## 🚀 Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **AI:** Google Gemini Vision API
- **Audio:** Web Audio API + HTML5 Audio
- **Music:** Audius API + Supabase Storage
- **Database:** Supabase PostgreSQL

## 🛠️ Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SaiRohithVennu/dj-tillu.git
   cd dj-tillu
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file with:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database:**
   - Follow instructions in `SUPABASE_SETUP.md`
   - Run the SQL migration in your Supabase dashboard

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🎮 How to Use

1. **Click the Play Button** - DJ Tillu will welcome you and start the session
2. **Allow Camera Access** - For AI mood detection to work
3. **Dance and Enjoy** - The AI will read your mood and change songs automatically
4. **Upload Your Music** - Use the Supabase uploader to add your own tracks

## 🤖 AI Features

- **Mood Detection:** Excited, Energetic, Happy, Chill, Focused, etc.
- **Energy Levels:** 0-100% energy detection
- **Crowd Size:** Counts visible people in the frame
- **Smart Transitions:** Automatic song changes based on mood shifts

## 🎵 Music Sources

- **Audius Integration** - Streams from decentralized music platform
- **Supabase Storage** - Upload and store your own tracks
- **Generated Audio** - Fallback synthetic audio for demos

## 📱 Components

- **Draggable Panels** - Resizable and movable UI components
- **Track Library** - Browse and manage your music collection
- **Mood Playlists** - Curated playlists for different moods
- **Voice Announcements** - AI DJ commentary and transitions

## 🔧 Configuration

The app includes several configurable features:
- Gemini Vision analysis frequency (30 seconds)
- AI DJ transition timing (15 seconds)
- Audio ducking for announcements
- Mood-based track selection algorithms

## 🚀 Deployment

Build for production:
```bash
npm run build
```

The app can be deployed to any static hosting service like Netlify, Vercel, or GitHub Pages.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your own DJ adventures!

## 🎉 Credits

- **Gemini Vision API** for AI mood detection
- **Audius** for decentralized music streaming
- **Supabase** for database and storage
- **React** and **Tailwind CSS** for the beautiful UI

---

**Made with ❤️ by SaiRohithVennu**

*Turn up the music and let AI read the room!* 🎵✨