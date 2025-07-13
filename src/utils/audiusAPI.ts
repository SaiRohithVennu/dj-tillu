// Audius API integration for fetching real music
export interface AudiusTrack {
  id: string;
  title: string;
  user: {
    name: string;
    handle: string;
  };
  duration: number;
  genre: string;
  mood?: string;
  tags?: string;
  artwork?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
  play_count: number;
  favorite_count: number;
  repost_count: number;
  created_at: string;
  permalink: string;
}

export interface AudiusUser {
  id: string;
  name: string;
  handle: string;
  follower_count: number;
  track_count: number;
  playlist_count: number;
  bio?: string;
  location?: string;
  profile_picture?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
}

export interface AudiusSearchResponse {
  data: AudiusTrack[];
}

export interface AudiusUserResponse {
  data: AudiusUser[];
}

export class AudiusAPI {
  private baseUrl: string | null = null;
  private appName = 'DJ AlterEgo';
  private healthyNodes: string[] = [];
  private lastNodeCheck = 0;
  private nodeCheckInterval = 5 * 60 * 1000; // 5 minutes

  // Get healthy discovery nodes
  private async getHealthyNodes(): Promise<string[]> {
    try {
      const response = await fetch('https://api.audius.co/health_check/discovery_nodes');
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      const data = await response.json();
      const healthyNodes = data.data
        ?.filter((node: any) => node.healthy)
        ?.map((node: any) => node.endpoint)
        ?.filter((endpoint: string) => endpoint && endpoint.startsWith('https://')) || [];
      
      console.log('🎵 Audius: Found healthy nodes:', healthyNodes.length);
      return healthyNodes;
    } catch (error) {
      console.warn('🎵 Audius: Failed to get healthy nodes, using fallback');
      // Fallback to known working nodes
      return [
        'https://discoveryprovider.audius.co',
        'https://discoveryprovider2.audius.co',
        'https://discoveryprovider3.audius.co'
      ];
    }
  }

  // Ensure we have a working base URL
  private async ensureBaseUrl(): Promise<void> {
    const now = Date.now();
    
    // Check if we need to refresh nodes
    if (!this.baseUrl || this.healthyNodes.length === 0 || (now - this.lastNodeCheck) > this.nodeCheckInterval) {
      this.healthyNodes = await this.getHealthyNodes();
      this.lastNodeCheck = now;
    }

    // If no baseUrl or current one failed, try to find a working one
    if (!this.baseUrl && this.healthyNodes.length > 0) {
      for (const node of this.healthyNodes) {
        try {
          // Test the node with a simple request
          const testResponse = await fetch(`${node}/v1/tracks/trending?app_name=${this.appName}&limit=1`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          
          if (testResponse.ok) {
            this.baseUrl = node;
            console.log('🎵 Audius: Using discovery node:', this.baseUrl);
            return;
          }
        } catch (error) {
          console.warn('🎵 Audius: Node failed test:', node);
          continue;
        }
      }
    }

    // If still no working baseUrl, throw error
    if (!this.baseUrl) {
      throw new Error('No healthy Audius discovery nodes available');
    }
  }

  // Retry mechanism for failed requests
  private async fetchWithRetry(url: string, options?: RequestInit, maxRetries = 2): Promise<Response> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.ensureBaseUrl();
        
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (response.ok) {
          return response;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error as Error;
        console.warn(`🎵 Audius: Request failed (attempt ${attempt + 1}):`, error);
        
        // If this was a network error, try a different node
        if (attempt < maxRetries && this.healthyNodes.length > 1) {
          // Remove current node and try next one
          const currentNodeIndex = this.healthyNodes.indexOf(this.baseUrl || '');
          if (currentNodeIndex > -1) {
            this.healthyNodes.splice(currentNodeIndex, 1);
          }
          this.baseUrl = null; // Force selection of new node
        }
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }

  // Get trending tracks
  async getTrendingTracks(genre?: string, limit: number = 20): Promise<AudiusTrack[]> {
    try {
      await this.ensureBaseUrl();
      
      let url = `${this.baseUrl}/v1/tracks/trending`;
      const params = new URLSearchParams({
        app_name: this.appName,
        limit: limit.toString()
      });

      if (genre) {
        params.append('genre', genre);
      }

      const response = await this.fetchWithRetry(`${url}?${params}`);

      const data: AudiusSearchResponse = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching trending tracks:', error);
      return [];
    }
  }

  // Search tracks by query
  async searchTracks(query: string, genre?: string, limit: number = 20): Promise<AudiusTrack[]> {
    try {
      await this.ensureBaseUrl();
      
      const params = new URLSearchParams({
        app_name: this.appName,
        query: query,
        limit: limit.toString()
      });

      if (genre) {
        params.append('genre', genre);
      }

      const response = await this.fetchWithRetry(`${this.baseUrl}/v1/tracks/search?${params}`);

      const data: AudiusSearchResponse = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error searching tracks:', error);
      return [];
    }
  }

  // Get tracks by genre
  async getTracksByGenre(genre: string, limit: number = 20): Promise<AudiusTrack[]> {
    try {
      const searchQueries = this.getGenreSearchTerms(genre);
      const allTracks: AudiusTrack[] = [];

      for (const searchTerm of searchQueries) {
        const tracks = await this.searchTracks(searchTerm, genre, Math.ceil(limit / searchQueries.length));
        allTracks.push(...tracks);
      }

      // Remove duplicates and limit results
      const uniqueTracks = allTracks.filter((track, index, self) => 
        index === self.findIndex(t => t.id === track.id)
      );

      return uniqueTracks.slice(0, limit);
    } catch (error) {
      console.error('Error fetching tracks by genre:', error);
      return [];
    }
  }

  // Get tracks for specific mood
  async getTracksForMood(mood: string, limit: number = 15): Promise<AudiusTrack[]> {
    const moodToGenre = this.getMoodGenreMapping();
    const genres = moodToGenre[mood.toLowerCase()] || ['electronic'];
    
    const allTracks: AudiusTrack[] = [];
    
    for (const genre of genres) {
      const tracks = await this.getTracksByGenre(genre, Math.ceil(limit / genres.length));
      allTracks.push(...tracks);
    }

    // Remove duplicates and shuffle
    const uniqueTracks = allTracks.filter((track, index, self) => 
      index === self.findIndex(t => t.id === track.id)
    );

    return this.shuffleArray(uniqueTracks).slice(0, limit);
  }

  // Get streaming URL for a track
  async getStreamUrl(trackId: string): Promise<string | null> {
    try {
      await this.ensureBaseUrl();
      
      const url = `${this.baseUrl}/v1/tracks/${trackId}/stream?app_name=${this.appName}`;
      
      // Test if the stream URL is accessible
      const response = await this.fetchWithRetry(url, { method: 'HEAD' }, 1);
      if (response.ok) {
        return url;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting stream URL:', error);
      return null;
    }
  }

  // Convert Audius track to app Track format
  convertToAppTrack(audiusTrack: AudiusTrack): any {
    return {
      id: `audius-${audiusTrack.id}`,
      title: audiusTrack.title,
      artist: audiusTrack.user.name,
      duration: audiusTrack.duration,
      bpm: this.estimateBPM(audiusTrack.genre, audiusTrack.title),
      genre: audiusTrack.genre || 'Electronic',
      audioUrl: `https://discoveryprovider.audius.co/v1/tracks/${audiusTrack.id}/stream?app_name=${this.appName}`,
      albumArt: audiusTrack.artwork?.['480x480'] || audiusTrack.artwork?.['150x150'] || 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=300',
      license: 'Audius',
      playCount: audiusTrack.play_count,
      favoriteCount: audiusTrack.favorite_count,
      permalink: audiusTrack.permalink
    };
  }

  // Estimate BPM based on genre and title
  private estimateBPM(genre: string, title: string): number {
    const genreBPM: { [key: string]: [number, number] } = {
      'Electronic': [120, 140],
      'Techno': [125, 145],
      'House': [120, 130],
      'Trance': [130, 140],
      'Dubstep': [140, 150],
      'Drum & Bass': [160, 180],
      'Hip-Hop': [80, 100],
      'Pop': [100, 120],
      'Rock': [110, 140],
      'Jazz': [90, 120],
      'Classical': [60, 120],
      'Reggae': [60, 90],
      'Country': [100, 130],
      'R&B': [70, 100],
      'Funk': [100, 120],
      'Disco': [110, 130],
      'Ambient': [60, 100]
    };

    const [min, max] = genreBPM[genre] || [120, 140];
    
    // Adjust based on title keywords
    const titleLower = title.toLowerCase();
    if (titleLower.includes('fast') || titleLower.includes('speed') || titleLower.includes('rush')) {
      return Math.floor(Math.random() * (max - min + 20)) + min + 10;
    }
    if (titleLower.includes('slow') || titleLower.includes('chill') || titleLower.includes('relax')) {
      return Math.floor(Math.random() * (max - min - 20)) + min - 10;
    }
    
    return Math.floor(Math.random() * (max - min)) + min;
  }

  // Get genre search terms for better results
  private getGenreSearchTerms(genre: string): string[] {
    const genreTerms: { [key: string]: string[] } = {
      'Electronic': ['electronic', 'edm', 'synth', 'digital'],
      'Techno': ['techno', 'tech house', 'minimal'],
      'House': ['house', 'deep house', 'progressive house'],
      'Trance': ['trance', 'progressive trance', 'uplifting'],
      'Dubstep': ['dubstep', 'bass', 'wobble'],
      'Hip-Hop': ['hip hop', 'rap', 'beats'],
      'Pop': ['pop', 'mainstream', 'radio'],
      'Rock': ['rock', 'guitar', 'band'],
      'Jazz': ['jazz', 'smooth', 'instrumental'],
      'Reggae': ['reggae', 'dub', 'island'],
      'Ambient': ['ambient', 'atmospheric', 'chill']
    };

    return genreTerms[genre] || [genre.toLowerCase()];
  }

  // Map moods to genres
  private getMoodGenreMapping(): { [key: string]: string[] } {
    return {
      'excited': ['Electronic', 'Techno', 'Dubstep'],
      'energetic': ['Techno', 'House', 'Electronic'],
      'happy': ['Pop', 'House', 'Electronic'],
      'chill': ['Ambient', 'Jazz', 'R&B'],
      'disappointed': ['Ambient', 'Jazz', 'Pop'],
      'bored': ['Electronic', 'House', 'Pop'],
      'focused': ['Ambient', 'Electronic', 'Trance'],
      'euphoric': ['Trance', 'Electronic', 'Techno']
    };
  }

  // Utility function to shuffle array
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Get available genres
  getAvailableGenres(): string[] {
    return [
      'Electronic', 'Techno', 'House', 'Trance', 'Dubstep', 'Drum & Bass',
      'Hip-Hop', 'Pop', 'Rock', 'Jazz', 'Classical', 'Reggae', 'Country',
      'R&B', 'Funk', 'Disco', 'Ambient'
    ];
  }
}

export const audiusAPI = new AudiusAPI();