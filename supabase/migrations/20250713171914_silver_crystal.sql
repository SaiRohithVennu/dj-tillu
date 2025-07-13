/*
  # Setup Audio Tracks Database

  1. New Tables
    - `tracks`
      - `id` (uuid, primary key)
      - `title` (text, track title)
      - `artist` (text, artist name)
      - `duration` (integer, duration in seconds)
      - `bpm` (integer, beats per minute)
      - `genre` (text, music genre)
      - `file_path` (text, storage file path)
      - `file_size` (bigint, file size in bytes)
      - `audio_url` (text, public URL for streaming)
      - `album_art` (text, album art URL)
      - `created_at` (timestamp, creation time)

  2. Storage
    - Create `audio-tracks` bucket for MP3 files
    - Set 50MB file size limit
    - Allow audio file types only

  3. Security
    - Enable RLS on tracks table
    - Add policies for public CRUD operations
    - Add storage policies for file operations
*/

-- Create tracks table
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

-- Enable Row Level Security
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access" 
ON tracks FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access" 
ON tracks FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access" 
ON tracks FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access" 
ON tracks FOR DELETE 
USING (true);

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-tracks',
  'audio-tracks', 
  true,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac'];

-- Storage policies for audio-tracks bucket
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'audio-tracks');

CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT USING (bucket_id = 'audio-tracks');

CREATE POLICY "Allow public deletes" ON storage.objects
FOR DELETE USING (bucket_id = 'audio-tracks');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre);
CREATE INDEX IF NOT EXISTS idx_tracks_bpm ON tracks(bpm);
CREATE INDEX IF NOT EXISTS idx_tracks_created_at ON tracks(created_at);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist);