import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface SupabaseTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  bpm: number;
  genre: string;
  file_path: string;
  file_size: number;
  created_at: string;
  album_art?: string;
}

export class SupabaseAudioStorage {
  private bucketName = 'audio-tracks';

  // Initialize storage bucket (call this once)
  async initializeBucket() {
    try {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName);

      if (!bucketExists) {
        // Create bucket
        const { error } = await supabase.storage.createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'],
          fileSizeLimit: 50 * 1024 * 1024 // 50MB limit
        });

        if (error) {
          console.error('Error creating bucket:', error);
          return false;
        }
        console.log('✅ Audio bucket created successfully');
      }

      return true;
    } catch (error) {
      console.error('Error initializing bucket:', error);
      return false;
    }
  }

  // Upload MP3 file
  async uploadTrack(
    file: File,
    metadata: {
      title: string;
      artist: string;
      duration: number;
      bpm: number;
      genre: string;
    }
  ): Promise<{ success: boolean; track?: SupabaseTrack; error?: string }> {
    try {
      // Validate file type
      if (!file.type.includes('audio')) {
        return { success: false, error: 'Please upload an audio file' };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `tracks/${fileName}`;

      console.log('🎵 Uploading track:', file.name);

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { success: false, error: uploadError.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        return { success: false, error: 'Failed to get public URL' };
      }

      // Save track metadata to database
      const trackData = {
        id: crypto.randomUUID(),
        title: metadata.title,
        artist: metadata.artist,
        duration: metadata.duration,
        bpm: metadata.bpm,
        genre: metadata.genre,
        file_path: filePath,
        file_size: file.size,
        audio_url: urlData.publicUrl,
        created_at: new Date().toISOString()
      };

      // Insert into tracks table
      const { data: dbData, error: dbError } = await supabase
        .from('tracks')
        .insert([trackData])
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Clean up uploaded file if database insert fails
        await supabase.storage.from(this.bucketName).remove([filePath]);
        return { success: false, error: dbError.message };
      }

      console.log('✅ Track uploaded successfully:', trackData.title);

      return {
        success: true,
        track: {
          ...dbData,
          file_path: filePath
        }
      };

    } catch (error: any) {
      console.error('Error uploading track:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all tracks from database
  async getAllTracks(): Promise<SupabaseTrack[]> {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tracks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching tracks:', error);
      return [];
    }
  }

  // Delete track
  async deleteTrack(trackId: string, filePath: string): Promise<boolean> {
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('tracks')
        .delete()
        .eq('id', trackId);

      if (dbError) {
        console.error('Database delete error:', dbError);
        return false;
      }

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        return false;
      }

      console.log('✅ Track deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting track:', error);
      return false;
    }
  }

  // Get public URL for a track
  getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  // Get signed URL for private access (if needed)
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
  }
}

export const audioStorage = new SupabaseAudioStorage();