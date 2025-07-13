export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  bpm: number;
  genre: string;
  audioUrl: string;
  albumArt?: string;
  license: string;
  waveformData?: number[];
}

// Using reliable audio sources with different formats for better compatibility
export const tracks: Track[] = [
  // Library will be populated with Audius tracks on app startup
];

// Convert Google Drive share link to direct download link
const convertGoogleDriveLink = (shareUrl: string): string => {
  const fileIdMatch = shareUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (fileIdMatch) {
    const fileId = fileIdMatch[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  return shareUrl;
};

// FMA API integration for dynamic track loading
export const searchFMATrack = async (query: string, genre?: string): Promise<Track[]> => {
  try {
    // Note: This is a simplified example. The actual FMA API might require authentication
    // For production, you'd want to implement proper API calls to FMA's search endpoint
    const response = await fetch(`https://freemusicarchive.org/api/get/tracks.json?api_key=YOUR_API_KEY&limit=10&genre=${genre || 'electronic'}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch from FMA');
    }
    
    const data = await response.json();
    
    return data.dataset
      .filter((track: any) => track.track_url && track.track_url.trim() !== '')
      .map((track: any, index: number) => ({
      id: track.track_id || `fma-${index}`,
      title: track.track_title || 'Unknown Title',
      artist: track.artist_name || 'Unknown Artist',
      duration: parseInt(track.track_duration) || 180,
      bpm: Math.floor(Math.random() * 60) + 120, // FMA doesn't always provide BPM
      genre: track.track_genres?.[0]?.genre_title || 'Electronic',
      audioUrl: track.track_url || '',
      albumArt: track.album_image_file || 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=300',
      license: track.license_title || 'CC BY'
    }));
  } catch (error) {
    console.error('Error fetching from FMA:', error);
    return [];
  }
};

export const getFMAGenres = () => [
  'Electronic',
  'Techno', 
  'House',
  'Ambient',
  'Drum & Bass',
  'Dubstep',
  'Trance',
  'Synthwave',
  'Experimental',
  'Dance'
];