import { useState, useRef, useEffect } from 'react';
import { Track } from '../data/tracks';
import { AudioGenerator } from '../utils/audioGenerator';

export const useAudioPlayer = () => {
  const audioGeneratorRef = useRef<AudioGenerator | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const playStartTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();
  const [isDucked, setIsDucked] = useState(false);
  const originalVolumeRef = useRef<number>(75);

  useEffect(() => {
    audioGeneratorRef.current = new AudioGenerator();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioGeneratorRef.current) {
        audioGeneratorRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (audioGeneratorRef.current) {
      const effectiveVolume = isDucked ? (volume / 100) * 0.3 : (volume / 100);
      audioGeneratorRef.current.setVolume(effectiveVolume);
    }
  }, [volume, isDucked]);

  const updateCurrentTime = () => {
    if (isPlaying && audioGeneratorRef.current) {
      const elapsed = (Date.now() - playStartTimeRef.current) / 1000;
      setCurrentTime(elapsed);
      
      if (elapsed >= duration) {
        setIsPlaying(false);
        setCurrentTime(0);
        return;
      }
      
      animationFrameRef.current = requestAnimationFrame(updateCurrentTime);
    }
  };

  const loadTrack = async (track: Track) => {
    try {
      setIsLoading(true);
      setError(null);
      setCurrentTrack(track);
      setCurrentTime(0);
      setDuration(track.duration);
      
      console.log('🎵 Loading track:', track.title, 'Audio URL:', track.audioUrl);

      // Check if this is a real audio URL (Audius, Supabase, or direct audio files)
      if (track.audioUrl.startsWith('http') && 
          !track.audioUrl.startsWith('generated://')) {
        console.log('Loading real audio file:', track.audioUrl);
        // For real audio files, we'll use HTML audio element
        setAudioBuffer(null);
        setIsLoading(false);
        console.log('✅ Real audio track loaded successfully');
      } else {
        // For generated audio (synthetic tracks)
        if (audioGeneratorRef.current) {
          audioGeneratorRef.current.stop();
          
          const buffer = audioGeneratorRef.current.generateTrackAudio(
            track.id, 
            track.bpm, 
            track.duration
          );
          
          if (buffer) {
            setAudioBuffer(buffer);
            setIsLoading(false);
            console.log('Generated audio for track:', track.title);
            console.log('✅ Generated audio track loaded successfully');
          } else {
            throw new Error('Failed to generate audio');
          }
        }
      }
    } catch (error) {
      console.error('Error loading track:', error);
      setError('Failed to generate audio');
      setIsLoading(false);
    }
  };

  const play = async () => {
    if (!currentTrack) return;

    // Stop any currently playing HTML audio to prevent conflicts
    const htmlAudio = (window as any).currentAudio;
    if (htmlAudio) {
      htmlAudio.pause();
      htmlAudio.currentTime = 0;
      (window as any).currentAudio = null;
    }

    console.log('🎵 Play function called for:', currentTrack.title);
    
    try {
      setError(null);
      
      // Check if this is a real audio file (including Audius streams)
      if (currentTrack.audioUrl.startsWith('http') && 
          !currentTrack.audioUrl.startsWith('generated://')) {
        
        // Check if it's a Google Drive link (show warning)
        const isGoogleDriveLink = currentTrack.audioUrl.includes('drive.google.com');
        const isAudiusStream = currentTrack.audioUrl.includes('audius.co') || currentTrack.audioUrl.includes('discoveryprovider');
        
        if (isGoogleDriveLink) {
          setError('Google Drive links cannot be played directly in the browser due to CORS restrictions. The track will use generated audio instead. For real audio playback, please use a direct audio file URL (.mp3, .wav, etc.) from services like SoundCloud, Dropbox, or dedicated audio hosting.');
          
          // Clear error after showing message briefly, then play generated audio
          setTimeout(() => {
            setError(null);
            
            // Fall back to generated audio for Google Drive links
            if (audioGeneratorRef.current) {
              audioGeneratorRef.current.stop();
              
              const buffer = audioGeneratorRef.current.generateTrackAudio(
                currentTrack.id, 
                currentTrack.bpm, 
                currentTrack.duration
              );
              
              if (buffer) {
                setAudioBuffer(buffer);
                setIsPlaying(true);
                
                const startTime = currentTime;
                const remainingDuration = duration - startTime;
                
                if (remainingDuration <= 0) {
                  setCurrentTime(0);
                  return;
                }

                const playBuffer = audioGeneratorRef.current.generateTrackAudio(
                  currentTrack.id,
                  currentTrack.bpm,
                  remainingDuration
                );

                if (playBuffer) {
                  playStartTimeRef.current = Date.now() - (startTime * 1000);
                  
                  audioGeneratorRef.current.play(playBuffer, volume / 100).then(() => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                  }).catch((error) => {
                    console.error('Playback ended with error:', error);
                    setIsPlaying(false);
                  });

                  updateCurrentTime();
                  console.log('Generated audio playback started for Google Drive track');
                }
              }
            }
          }, 2000); // Show message for 2 seconds, then start playing
          
          return;
        }
        
        // Check if URL is a direct audio file or Audius stream
        const isDirectAudioFile = isAudiusStream ||
                                 currentTrack.audioUrl.includes('.mp3') || 
                                 currentTrack.audioUrl.includes('.wav') || 
                                 currentTrack.audioUrl.includes('.ogg') || 
                                 currentTrack.audioUrl.includes('.m4a') ||
                                 currentTrack.audioUrl.includes('.flac') ||
                                 currentTrack.audioUrl.includes('supabase');
        
        if (!isDirectAudioFile && !isGoogleDriveLink && !isAudiusStream) {
          setError('This URL is not a supported audio source. Supported sources: Audius streams, Supabase storage, or direct audio file links (.mp3, .wav, .ogg, .m4a, .flac).');
          setIsPlaying(false);
          return;
        }
        
        console.log(`Playing ${isAudiusStream ? 'Audius stream' : 'audio file'}:`, currentTrack.audioUrl);
        
        // Create HTML audio element for real files
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.src = currentTrack.audioUrl;
        audio.volume = volume / 100;
        audio.currentTime = currentTime;
        
        // Store reference for control
        (window as any).currentAudio = audio;
        
        audio.onloadstart = () => console.log('Audio loading started');
        audio.oncanplay = () => console.log('Audio can play');
        audio.onplay = () => {
          console.log('Audio started playing');
          setIsPlaying(true);
        };
        audio.onerror = (e) => {
          console.error('Audio error:', e);
          setError(`Failed to load ${isAudiusStream ? 'Audius stream' : 'audio file'}. ${isAudiusStream ? 'This track may not be available for streaming.' : 'Please ensure the URL is a direct link to an audio file.'}`);
          setIsPlaying(false);
        };
        
        audio.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };
        
        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime);
        };
        
        try {
          console.log('🎵 Attempting to play HTML audio...');
          await audio.play();
          console.log(`${isAudiusStream ? 'Audius stream' : 'Audio file'} playback started successfully`);
          setIsPlaying(true);
        } catch (playError) {
          console.error('Play error:', playError);
          setError(`Failed to play ${isAudiusStream ? 'Audius stream' : 'audio'}. ${isAudiusStream ? 'This track may not be available for streaming.' : 'This file format may not be supported.'}`);
          setIsPlaying(false);
        }
        
      } else {
        // Generated audio (existing logic)
        console.log('🎵 Playing generated audio...');
        if (!audioGeneratorRef.current || !audioBuffer) return;
        
        const startTime = currentTime;
        const remainingDuration = duration - startTime;
        
        if (remainingDuration <= 0) {
          setCurrentTime(0);
          return;
        }

        const buffer = audioGeneratorRef.current.generateTrackAudio(
          currentTrack.id,
          currentTrack.bpm,
          remainingDuration
        );

        if (buffer) {
          playStartTimeRef.current = Date.now() - (startTime * 1000);
          
          try {
            await audioGeneratorRef.current.play(buffer, volume / 100);
            updateCurrentTime();
            console.log('Generated audio playback started successfully');
            setIsPlaying(true);
          } catch (error) {
            console.error('Generated audio play error:', error);
            setIsPlaying(false);
            setError('Failed to play generated audio');
          }
        }
      }
    } catch (error: any) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setError('Failed to play audio');
    }
  };

  const pause = () => {
    // Stop HTML audio if it exists
    const htmlAudio = (window as any).currentAudio;
    if (htmlAudio) {
      htmlAudio.pause();
      console.log('HTML audio paused');
    }
    
    // Stop generated audio
    if (audioGeneratorRef.current) {
      try {
        audioGeneratorRef.current.stop();
      } catch (error) {
        console.log('Generated audio already stopped');
      }
    }
    
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const seek = (time: number) => {
    setCurrentTime(time);
    if (isPlaying) {
      pause();
      // Will restart from new position when play is called again
    }
  };

  const setVolumeLevel = (newVolume: number) => {
    setVolume(newVolume);
    if (!isDucked) {
      originalVolumeRef.current = newVolume;
    }
    
    // Update HTML audio volume if it exists
    const htmlAudio = (window as any).currentAudio;
    if (htmlAudio) {
      htmlAudio.volume = (isDucked ? newVolume * 0.3 : newVolume) / 100;
    }
  };

  const duckAudio = () => {
    setIsDucked(true);
    console.log('🔊 Audio ducked for announcement');
  };

  const unduckAudio = () => {
    setIsDucked(false);
    console.log('🔊 Audio unducked');
  };

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    currentTrack,
    isLoading,
    error,
    loadTrack,
    togglePlay,
    seek,
    setVolume: setVolumeLevel,
    audioElement: null, // Not using HTML audio element anymore
    duckAudio,
    unduckAudio,
    isDucked
  };
};