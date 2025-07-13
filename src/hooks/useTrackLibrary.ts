import { useState, useEffect } from 'react';
import { Track } from '../data/tracks';
import { audiusAPI } from '../utils/audiusAPI';
import { addTrackToMoodPlaylist } from '../data/moodPlaylists';

export const useTrackLibrary = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial tracks from Audius on startup
  useEffect(() => {
    loadInitialTracks();
  }, []);

  const loadInitialTracks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🎵 Loading initial tracks from Audius...');
      
      // Load tracks from Audius
      const moodGenres = {
        'excited': ['Electronic', 'Techno'],
        'energetic': ['Techno', 'Electronic'],
        'happy': ['House', 'Electronic'],
        'chill': ['Ambient', 'Trance'],
        'euphoric': ['Trance', 'Dubstep'],
        'disappointed': ['Ambient', 'Electronic'],
        'bored': ['Electronic', 'House'],
        'focused': ['Ambient', 'Electronic']
      };
      
      const allTracks: Track[] = [];
      
      // Load tracks for each mood
      for (const [mood, genres] of Object.entries(moodGenres)) {
        console.log(`🎭 Loading tracks for ${mood} mood...`);
        
        for (const genre of genres) {
          try {
            const audiusTracks = await audiusAPI.getTracksByGenre(genre, 2);
            const convertedTracks = audiusTracks.map((track, index) => {
              const convertedTrack = audiusAPI.convertToAppTrack(track);
              // Update ID to include mood for easier filtering
              convertedTrack.id = `audius-${mood}-${index + 1}`;
              return convertedTrack;
            });
            
            allTracks.push(...convertedTracks);
            
            // Add tracks to mood playlists
            convertedTracks.forEach(track => {
              addTrackToMoodPlaylist(mood, track.id);
            });
            
          } catch (genreError) {
            console.warn(`Failed to load ${genre} tracks for ${mood}:`, genreError);
          }
        }
      }
      
      // Load some general tracks
      const generalGenres = ['Electronic', 'House'];
      for (const genre of generalGenres) {
        try {
          const audiusTracks = await audiusAPI.getTracksByGenre(genre, 3);
          const convertedTracks = audiusTracks.map(track => audiusAPI.convertToAppTrack(track));
          allTracks.push(...convertedTracks);
        } catch (genreError) {
          console.warn(`Failed to load ${genre} tracks from Audius:`, genreError);
        }
      }
      
      if (allTracks.length > 0) {
        setTracks(allTracks);
        console.log(`✅ Loaded ${allTracks.length} tracks from Audius with mood assignments`);
      } else {
        setTracks(getFallbackTracks());
        console.log('⚠️ Using fallback tracks - Audius unavailable');
      }
      
    } catch (error: any) {
      console.error('❌ Failed to load initial tracks:', error);
      setError('Failed to load music library');
      
      // Set empty array on error
      setTracks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackTracks = (): Track[] => {
    return [
      {
        id: 'fallback-1',
        title: 'Electronic Dreams',
        artist: 'DJ AlterEgo',
        duration: 180,
        bpm: 128,
        genre: 'Electronic',
        audioUrl: 'generated://electronic',
        albumArt: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=300',
        license: 'Generated'
      },
      {
        id: 'fallback-2',
        title: 'Techno Pulse',
        artist: 'AI Producer',
        duration: 200,
        bpm: 135,
        genre: 'Techno',
        audioUrl: 'generated://techno',
        albumArt: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=300',
        license: 'Generated'
      },
      {
        id: 'fallback-3',
        title: 'House Vibes',
        artist: 'Beat Master',
        duration: 220,
        bpm: 125,
        genre: 'House',
        audioUrl: 'generated://house',
        albumArt: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=300',
        license: 'Generated'
      }
      // Add more fallback tracks as needed
    ];
  };

  const addTrack = (track: Track) => {
    setTracks(prev => {
      // Check if track already exists
      if (prev.find(t => t.id === track.id)) {
        console.log('Track already in library:', track.title);
        return prev;
      }
      
      console.log('➕ Added track to library:', track.title);
      return [...prev, track];
    });
  };

  const removeTrack = (trackId: string) => {
    setTracks(prev => {
      const filtered = prev.filter(t => t.id !== trackId);
      console.log('➖ Removed track from library');
      return filtered;
    });
  };

  const refreshLibrary = () => {
    console.log('🔄 Refreshing track library...');
    loadInitialTracks();
  };

  return {
    tracks,
    isLoading,
    error,
    addTrack,
    removeTrack,
    refreshLibrary
  };
};