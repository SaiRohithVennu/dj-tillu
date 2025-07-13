import React, { useState, useRef } from 'react';
import { Upload, Music, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { audioStorage, SupabaseTrack } from '../utils/supabaseStorage';
import { Track } from '../data/tracks';

interface SupabaseTrackUploaderProps {
  onTrackUploaded: (track: Track) => void;
  onClose: () => void;
}

export const SupabaseTrackUploader: React.FC<SupabaseTrackUploaderProps> = ({
  onTrackUploaded,
  onClose
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState({
    title: '',
    artist: '',
    duration: 180,
    bpm: 128,
    genre: 'Electronic'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const genres = [
    'Electronic', 'Techno', 'House', 'Trance', 'Dubstep', 'Drum & Bass',
    'Hip Hop', 'Pop', 'Rock', 'Jazz', 'Classical', 'Reggae', 'Country',
    'R&B', 'Funk', 'Disco', 'Ambient', 'Synthwave', 'Regional Mexican'
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      
      // Auto-fill title from filename
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setMetadata(prev => ({
        ...prev,
        title: prev.title || fileName
      }));

      // Try to get audio duration
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        setMetadata(prev => ({
          ...prev,
          duration: Math.round(audio.duration)
        }));
      };
      audio.src = URL.createObjectURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an audio file');
      return;
    }

    if (!metadata.title.trim() || !metadata.artist.trim()) {
      setError('Please fill in title and artist');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Initialize bucket if needed
      await audioStorage.initializeBucket();

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await audioStorage.uploadTrack(selectedFile, metadata);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.track) {
        // Convert SupabaseTrack to Track format
        const track: Track = {
          id: result.track.id,
          title: result.track.title,
          artist: result.track.artist,
          duration: result.track.duration,
          bpm: result.track.bpm,
          genre: result.track.genre,
          audioUrl: result.track.audio_url || audioStorage.getPublicUrl(result.track.file_path),
          albumArt: result.track.album_art || 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=300',
          license: 'User Upload'
        };

        setSuccess(true);
        onTrackUploaded(track);

        // Auto-close after success
        setTimeout(() => {
          onClose();
        }, 2000);

      } else {
        setError(result.error || 'Upload failed');
      }

    } catch (error: any) {
      setError(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-purple-500/30 p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Upload className="w-5 h-5 mr-2 text-purple-400" />
            Upload Track
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success State */}
        {success && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">Upload Successful!</h4>
            <p className="text-gray-300">Track added to your library</p>
          </div>
        )}

        {/* Upload Form */}
        {!success && (
          <>
            {/* File Selection */}
            <div className="mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {!selectedFile ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed border-purple-500/50 rounded-lg hover:border-purple-500 transition-colors text-center"
                >
                  <Music className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <p className="text-white font-medium mb-1">Choose Audio File</p>
                  <p className="text-gray-400 text-sm">MP3, WAV, OGG supported</p>
                </button>
              ) : (
                <div className="bg-purple-600/20 border border-purple-500/40 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{selectedFile.name}</p>
                      <p className="text-gray-300 text-sm">
                        {formatFileSize(selectedFile.size)} • {formatDuration(metadata.duration)}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Metadata Form */}
            {selectedFile && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                  <input
                    type="text"
                    value={metadata.title}
                    onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                    placeholder="Track title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Artist *</label>
                  <input
                    type="text"
                    value={metadata.artist}
                    onChange={(e) => setMetadata(prev => ({ ...prev, artist: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                    placeholder="Artist name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">BPM</label>
                    <input
                      type="number"
                      value={metadata.bpm}
                      onChange={(e) => setMetadata(prev => ({ ...prev, bpm: Number(e.target.value) }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                      min="60"
                      max="200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Duration (s)</label>
                    <input
                      type="number"
                      value={metadata.duration}
                      onChange={(e) => setMetadata(prev => ({ ...prev, duration: Number(e.target.value) }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Genre</label>
                  <select
                    value={metadata.genre}
                    onChange={(e) => setMetadata(prev => ({ ...prev, genre: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  >
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-600/20 border border-red-500/40 rounded-lg flex items-center">
                <AlertCircle className="w-4 h-4 text-red-400 mr-2" />
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || !metadata.title.trim() || !metadata.artist.trim()}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              {isUploading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Track
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};