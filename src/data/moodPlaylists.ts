export interface MoodPlaylist {
  mood: string;
  displayName: string;
  description: string;
  tracks: string[]; // Array of track IDs
  preferredBPMRange: { min: number; max: number };
  preferredGenres: string[];
  color: string;
}

export const moodPlaylists: MoodPlaylist[] = [
  {
    mood: 'excited',
    displayName: 'Excited',
    description: 'High-energy tracks for when the crowd is pumped up',
    tracks: ['audius-excited-1', 'audius-excited-2', 'audius-excited-3', 'audius-excited-4'],
    preferredBPMRange: { min: 130, max: 160 },
    preferredGenres: ['Electronic', 'Techno', 'Hard Techno'],
    color: 'yellow'
  },
  {
    mood: 'energetic',
    displayName: 'Energetic',
    description: 'Dynamic beats to keep the energy flowing',
    tracks: ['audius-energetic-1', 'audius-energetic-2', 'audius-energetic-3', 'audius-energetic-4'],
    preferredBPMRange: { min: 125, max: 145 },
    preferredGenres: ['Techno', 'Electronic', 'Bass'],
    color: 'red'
  },
  {
    mood: 'happy',
    displayName: 'Happy',
    description: 'Feel-good vibes for positive moments',
    tracks: ['audius-happy-1', 'audius-happy-2', 'audius-happy-3', 'audius-happy-4'],
    preferredBPMRange: { min: 120, max: 135 },
    preferredGenres: ['Electronic', 'Trance', 'Synthwave'],
    color: 'green'
  },
  {
    mood: 'chill',
    displayName: 'Chill',
    description: 'Relaxed tracks for mellow moments',
    tracks: ['audius-chill-1', 'audius-chill-2', 'audius-chill-3', 'audius-chill-4'],
    preferredBPMRange: { min: 100, max: 125 },
    preferredGenres: ['Synthwave', 'Ambient', 'Trance', 'Regional Mexican'],
    color: 'blue'
  },
  {
    mood: 'euphoric',
    displayName: 'Euphoric',
    description: 'Peak-time anthems for maximum impact',
    tracks: ['audius-euphoric-1', 'audius-euphoric-2', 'audius-euphoric-3', 'audius-euphoric-4'],
    preferredBPMRange: { min: 135, max: 170 },
    preferredGenres: ['Hard Techno', 'Bass', 'Techno'],
    color: 'purple'
  },
  {
    mood: 'disappointed',
    displayName: 'Disappointed',
    description: 'Uplifting tracks to turn the mood around',
    tracks: ['audius-disappointed-1', 'audius-disappointed-2', 'audius-disappointed-3'],
    preferredBPMRange: { min: 115, max: 130 },
    preferredGenres: ['Synthwave', 'Ambient', 'Trance'],
    color: 'orange'
  },
  {
    mood: 'bored',
    displayName: 'Bored',
    description: 'Engaging tracks to re-energize the crowd',
    tracks: ['audius-bored-1', 'audius-bored-2', 'audius-bored-3'],
    preferredBPMRange: { min: 125, max: 140 },
    preferredGenres: ['Electronic', 'Bass', 'Techno'],
    color: 'indigo'
  },
  {
    mood: 'focused',
    displayName: 'Focused',
    description: 'Steady rhythms for concentrated listening',
    tracks: ['audius-focused-1', 'audius-focused-2', 'audius-focused-3'],
    preferredBPMRange: { min: 120, max: 130 },
    preferredGenres: ['Ambient', 'Trance', 'Electronic'],
    color: 'cyan'
  }
];

// Helper functions
export const getMoodPlaylist = (mood: string): MoodPlaylist | undefined => {
  return moodPlaylists.find(playlist => 
    playlist.mood.toLowerCase() === mood.toLowerCase()
  );
};

export const addTrackToMoodPlaylist = (mood: string, trackId: string): boolean => {
  const playlist = getMoodPlaylist(mood);
  if (playlist && !playlist.tracks.includes(trackId)) {
    playlist.tracks.push(trackId);
    return true;
  }
  return false;
};

export const removeTrackFromMoodPlaylist = (mood: string, trackId: string): boolean => {
  const playlist = getMoodPlaylist(mood);
  if (playlist) {
    const index = playlist.tracks.indexOf(trackId);
    if (index > -1) {
      playlist.tracks.splice(index, 1);
      return true;
    }
  }
  return false;
};

export const getTracksForMood = (mood: string, allTracks: any[]): any[] => {
  const playlist = getMoodPlaylist(mood);
  if (!playlist) return [];
  
  // Filter tracks that are specifically added to this mood playlist
  const playlistTracks = allTracks.filter(track => playlist.tracks.includes(track.id));
  
  // If no specific tracks, filter by genre and BPM preferences
  if (playlistTracks.length === 0) {
    return allTracks.filter(track => {
      const genreMatch = playlist.preferredGenres.some(genre => 
        track.genre.toLowerCase().includes(genre.toLowerCase())
      );
      const bpmMatch = track.bpm >= playlist.preferredBPMRange.min && 
                      track.bpm <= playlist.preferredBPMRange.max;
      return genreMatch || bpmMatch;
    });
  }
  
  return playlistTracks;
};

export const getAllMoodNames = (): string[] => {
  return moodPlaylists.map(playlist => playlist.mood);
};