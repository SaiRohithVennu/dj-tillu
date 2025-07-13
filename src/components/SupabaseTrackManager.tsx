import React, { useState, useEffect } from 'react';
import { Database, Upload, Trash2, Download, RefreshCw } from 'lucide-react';
import { audioStorage, SupabaseTrack } from '../utils/supabaseStorage';
import { SupabaseTrackUploader } from './SupabaseTrackUploader';
import { Track } from '../data/tracks';

interface SupabaseTrackManagerProps {
  onTrackSelect: (track: Track) => void;
  onAddToLibrary: (track: Track) => void;
}

export const SupabaseTrackManager: React.FC<SupabaseTrackManagerProps> = ({
  onTrackSelect,
  onAddToLibrary
}) => {
  const [tracks, setTracks] = useState<SupabaseTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabaseTracks = await audioStorage.getAllTracks();
      setTracks(supabaseTracks);
      console.log(`📦 Loaded ${supabaseTracks.length} tracks from Supabase`);
    } catch (error: any) {
      setError(error.message);
      console.error('Error loading tracks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackUploaded = (track: Track) => {
    onAddToLibrary(track);
    loadTracks(); // Refresh the list
    setShowUploader(false);
  };

  const handleDeleteTrack = async (track: SupabaseTrack) => {
    if (!confirm(`Delete "${track.title}" by ${track.artist}?`)) return;

    try {
      const success = await audioStorage.deleteTrack(track.id, track.file_path);
      if (success) {
        setTracks(prev => prev.filter(t => t.id !== track.id));
        console.log('✅ Track deleted successfully');
      } else {
        setError('Failed to delete track');
      }
    } catch (error: any) {
      setError(error.message);
      console.error('Error deleting track:', error);
    }
  };

  const convertToTrack = (supabaseTrack: SupabaseTrack): Track => ({
    id: supabaseTrack.id,
    title: supabaseTrack.title,
    artist: supabaseTrack.artist,
    duration: supabaseTrack.duration,
    bpm: supabaseTrack.bpm,
    genre: supabaseTrack.genre,
    audioUrl: supabaseTrack.audio_url || audioStorage.getPublicUrl(supabaseTrack.file_path),
    albumArt: supabaseTrack.album_art || 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=300',
    license: 'Supabase Storage'
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center">
          <Database className="w-5 h-5 mr-2 text-blue-400" />
          Supabase Tracks
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={loadTracks}
            disabled={isLoading}
            className="p-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowUploader(true)}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center"
          >
            <Upload className="w-4 h-4 mr-1" />
            Upload
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-600/20 border border-red-500/40 rounded-lg p-3">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-spin" />
          <p className="text-gray-300">Loading tracks...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && tracks.length === 0 && (
        <div className="text-center py-8">
          <Database className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-300 mb-2">No tracks uploaded yet</p>
          <button
            onClick={() => setShowUploader(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Upload Your First Track
          </button>
        </div>
      )}

      {/* Tracks List */}
      {!isLoading && tracks.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="bg-white/10 border border-white/20 rounded-lg p-3 hover:bg-white/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate">{track.title}</h4>
                  <p className="text-sm text-gray-300 truncate">{track.artist}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                    <span>{track.genre}</span>
                    <span>•</span>
                    <span>{track.bpm} BPM</span>
                    <span>•</span>
                    <span>{formatDuration(track.duration)}</span>
                    <span>•</span>
                    <span>{formatFileSize(track.file_size)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-3">
                  <button
                    onClick={() => onTrackSelect(convertToTrack(track))}
                    className="p-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                    title="Play now"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onAddToLibrary(convertToTrack(track))}
                    className="p-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
                    title="Add to library"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteTrack(track)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                    title="Delete track"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploader && (
        <SupabaseTrackUploader
          onTrackUploaded={handleTrackUploaded}
          onClose={() => setShowUploader(false)}
        />
      )}
    </div>
  );
};