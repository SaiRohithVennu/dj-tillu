// Browserbase API integration for scraping WhooshMusic moods
export interface WhooshMood {
  name: string;
  description: string;
  url: string;
  trackCount?: number;
}

export class BrowserbaseAPI {
  private apiKey: string;
  private projectId: string;
  private baseUrl = 'https://www.browserbase.com/v1';

  constructor() {
    this.apiKey = 'bb_live_t2_J85nE44EbI0ewg7doVNCCEwU';
    this.projectId = '986c4ca7-2e87-424b-9b55-41a6a3931a99';
  }

  // Create a new browser session
  private async createSession(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: this.projectId,
          browserSettings: {
            viewport: { width: 1920, height: 1080 }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.status}`);
      }

      const data = await response.json();
      console.log('🌐 Browserbase: Session created:', data.id);
      return data.id;
    } catch (error) {
      console.error('❌ Browserbase: Failed to create session:', error);
      throw error;
    }
  }

  // Execute JavaScript in the browser session
  private async executeScript(sessionId: string, script: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/actions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'evaluate',
          expression: script
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to execute script: ${response.status}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('❌ Browserbase: Failed to execute script:', error);
      throw error;
    }
  }

  // Navigate to a URL
  private async navigateToUrl(sessionId: string, url: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/actions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'goto',
          url: url
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to navigate: ${response.status}`);
      }

      console.log('🌐 Browserbase: Navigated to:', url);
    } catch (error) {
      console.error('❌ Browserbase: Failed to navigate:', error);
      throw error;
    }
  }

  // Close browser session
  private async closeSession(sessionId: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });
      console.log('🌐 Browserbase: Session closed');
    } catch (error) {
      console.error('❌ Browserbase: Failed to close session:', error);
    }
  }

  // Scrape WhooshMusic moods
  async scrapeWhooshMoods(): Promise<WhooshMood[]> {
    let sessionId: string | null = null;
    
    try {
      console.log('🎵 Starting WhooshMusic mood scraping...');
      
      // Create browser session
      sessionId = await this.createSession();
      
      // Navigate to WhooshMusic moods page
      await this.navigateToUrl(sessionId, 'https://www.whooshmusic.com/royalty-free-music-moods/');
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Scrape mood data
      const scrapingScript = `
        (function() {
          const moods = [];
          
          // Try multiple selectors to find mood elements
          const moodSelectors = [
            '.mood-item',
            '.mood-card',
            '.category-item',
            '.mood-link',
            'a[href*="mood"]',
            '.grid-item',
            '.category-card'
          ];
          
          let moodElements = [];
          
          for (const selector of moodSelectors) {
            moodElements = document.querySelectorAll(selector);
            if (moodElements.length > 0) {
              console.log('Found moods with selector:', selector);
              break;
            }
          }
          
          // If no specific mood elements, try to find links containing mood keywords
          if (moodElements.length === 0) {
            const allLinks = document.querySelectorAll('a');
            const moodKeywords = ['happy', 'sad', 'energetic', 'calm', 'dramatic', 'upbeat', 'chill', 'intense', 'peaceful', 'exciting'];
            
            moodElements = Array.from(allLinks).filter(link => {
              const text = link.textContent.toLowerCase();
              const href = link.href.toLowerCase();
              return moodKeywords.some(keyword => text.includes(keyword) || href.includes(keyword));
            });
          }
          
          // Extract mood data
          moodElements.forEach((element, index) => {
            try {
              const name = element.textContent?.trim() || element.getAttribute('title') || \`Mood \${index + 1}\`;
              const url = element.href || element.querySelector('a')?.href || '';
              const description = element.getAttribute('data-description') || 
                                element.querySelector('.description')?.textContent?.trim() || 
                                \`\${name} music mood\`;
              
              if (name && name.length > 0 && name.length < 50) {
                moods.push({
                  name: name,
                  description: description,
                  url: url
                });
              }
            } catch (e) {
              console.error('Error processing mood element:', e);
            }
          });
          
          // Fallback: Create default moods if scraping fails
          if (moods.length === 0) {
            const defaultMoods = [
              { name: 'Happy', description: 'Upbeat and joyful music', url: '' },
              { name: 'Energetic', description: 'High-energy and dynamic tracks', url: '' },
              { name: 'Calm', description: 'Peaceful and relaxing music', url: '' },
              { name: 'Dramatic', description: 'Intense and emotional compositions', url: '' },
              { name: 'Upbeat', description: 'Positive and lively tracks', url: '' },
              { name: 'Chill', description: 'Laid-back and mellow vibes', url: '' },
              { name: 'Intense', description: 'Powerful and gripping music', url: '' },
              { name: 'Peaceful', description: 'Serene and tranquil sounds', url: '' },
              { name: 'Exciting', description: 'Thrilling and adventurous music', url: '' },
              { name: 'Romantic', description: 'Love and romance themed tracks', url: '' }
            ];
            moods.push(...defaultMoods);
          }
          
          return {
            success: true,
            moods: moods.slice(0, 20), // Limit to 20 moods
            scrapedFrom: 'WhooshMusic',
            timestamp: new Date().toISOString()
          };
        })();
      `;
      
      const result = await this.executeScript(sessionId, scrapingScript);
      
      if (result && result.success) {
        console.log(`✅ Scraped ${result.moods.length} moods from WhooshMusic`);
        return result.moods;
      } else {
        throw new Error('Failed to scrape moods');
      }
      
    } catch (error) {
      console.error('❌ WhooshMusic scraping failed:', error);
      
      // Return fallback moods for hackathon demo
      return this.getFallbackMoods();
      
    } finally {
      if (sessionId) {
        await this.closeSession(sessionId);
      }
    }
  }

  // Fallback moods if scraping fails
  private getFallbackMoods(): WhooshMood[] {
    return [
      { name: 'Happy', description: 'Upbeat and joyful music perfect for celebrations', url: '' },
      { name: 'Energetic', description: 'High-energy tracks that pump up the crowd', url: '' },
      { name: 'Calm', description: 'Peaceful and relaxing music for chill moments', url: '' },
      { name: 'Dramatic', description: 'Intense and emotional compositions', url: '' },
      { name: 'Upbeat', description: 'Positive and lively tracks that lift spirits', url: '' },
      { name: 'Chill', description: 'Laid-back and mellow vibes for relaxation', url: '' },
      { name: 'Intense', description: 'Powerful and gripping music for peak moments', url: '' },
      { name: 'Peaceful', description: 'Serene and tranquil sounds for meditation', url: '' },
      { name: 'Exciting', description: 'Thrilling and adventurous music for action', url: '' },
      { name: 'Romantic', description: 'Love and romance themed tracks for intimate moments', url: '' },
      { name: 'Mysterious', description: 'Enigmatic and suspenseful atmospheric music', url: '' },
      { name: 'Triumphant', description: 'Victory and achievement celebration music', url: '' },
      { name: 'Melancholic', description: 'Bittersweet and contemplative emotional tracks', url: '' },
      { name: 'Playful', description: 'Fun and whimsical music for lighthearted moments', url: '' },
      { name: 'Epic', description: 'Grand and cinematic compositions for big moments', url: '' }
    ];
  }

  // Get cached moods (for performance)
  async getCachedMoods(): Promise<WhooshMood[]> {
    const cacheKey = 'whoosh_moods_cache';
    const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        const isExpired = Date.now() - data.timestamp > cacheExpiry;
        
        if (!isExpired) {
          console.log('🎵 Using cached WhooshMusic moods');
          return data.moods;
        }
      }
    } catch (error) {
      console.warn('Failed to load cached moods:', error);
    }
    
    // Fetch fresh data
    const moods = await this.scrapeWhooshMoods();
    
    // Cache the results
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        moods,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to cache moods:', error);
    }
    
    return moods;
  }
}

export const browserbaseAPI = new BrowserbaseAPI();