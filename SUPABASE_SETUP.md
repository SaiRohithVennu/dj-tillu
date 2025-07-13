# 🗄️ Supabase Database Setup Guide

## Quick Setup (2 minutes)

### Method 1: Copy & Paste SQL (Recommended)
1. **Open your Supabase dashboard**
2. **Go to SQL Editor** (left sidebar)
3. **Copy the entire content** from `supabase/migrations/001_setup_audio_tracks.sql`
4. **Paste and click "RUN"**
5. **Done!** ✅

### Method 2: Manual Setup
If you prefer to do it step by step:

#### Step 1: Create Table
```sql
CREATE TABLE IF NOT EXISTS tracks (
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

#### Step 2: Enable Security
```sql
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON tracks FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON tracks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON tracks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON tracks FOR DELETE USING (true);
```

#### Step 3: Create Storage Bucket
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-tracks',
  'audio-tracks', 
  true,
  52428800,
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac'];
```

#### Step 4: Storage Policies
```sql
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'audio-tracks');

CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT USING (bucket_id = 'audio-tracks');

CREATE POLICY "Allow public deletes" ON storage.objects
FOR DELETE USING (bucket_id = 'audio-tracks');
```

## ✅ Verification

After running the SQL, verify:

1. **Tables**: Go to "Table Editor" → See `tracks` table
2. **Storage**: Go to "Storage" → See `audio-tracks` bucket  
3. **Policies**: Go to "Authentication" → "Policies" → See track policies

## 🎵 What This Enables

- ✅ **Upload MP3/WAV files** up to 50MB
- ✅ **Store track metadata** (title, artist, BPM, genre)
- ✅ **Public access** for your DJ app
- ✅ **Real audio streaming** (no more generated audio!)
- ✅ **File management** through the app interface

## 🚀 Next Steps

Once setup is complete:
1. **Open your DJ app**
2. **Go to Settings** 
3. **Find "Supabase Tracks" section**
4. **Click "Upload"** to add your first MP3!

## 🔧 Environment Variables

Make sure your `.env` file has:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```