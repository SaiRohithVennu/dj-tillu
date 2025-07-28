import React, { useRef, useEffect, useState } from 'react';
import { Eye, Users, AlertCircle, CheckCircle, Camera } from 'lucide-react';
import { GeminiVisionAnalyzer } from '../utils/geminiVision';

interface VIPGuest {
  id: string;
  name: string;
  role: string;
  faceImageUrl?: string;
  personalizedGreeting?: string;
  lastSeen?: Date;
  recognitionCount: number;
}

interface FaceRecognitionSystemProps {
  videoElement: HTMLVideoElement | null;
  vipGuests: VIPGuest[];
  onVIPRecognized: (guest: VIPGuest) => void;
  enabled: boolean;
}

export const FaceRecognitionSystem: React.FC<FaceRecognitionSystemProps> = ({
  videoElement,
  vipGuests,
  onVIPRecognized,
  enabled
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recognizedGuests, setRecognizedGuests] = useState<VIPGuest[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const analyzerRef = useRef<GeminiVisionAnalyzer | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const apiKey = 'AIzaSyDMtDDrtr8WLwUHpXnVkRVzN1s_4IkUsRo';
    analyzerRef.current = new GeminiVisionAnalyzer(apiKey);
  }, []);

  useEffect(() => {
    if (!enabled || !videoElement || !analyzerRef.current || vipGuests.length === 0) {
      return;
    }

    const runFaceRecognition = async () => {
      if (isAnalyzing) return;

      setIsAnalyzing(true);
      setError(null);

      try {
        // Capture current frame
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');

        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        ctx.drawImage(videoElement, 0, 0);
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

        // Create recognition prompt with VIP guest descriptions
        const guestDescriptions = vipGuests.map(guest => 
          `${guest.name} (${guest.role})`
        ).join(', ');

        const recognitionPrompt = `
Analyze this image for face recognition at an event. Look for these VIP guests: ${guestDescriptions}

Instructions:
1. Identify any faces in the image
2. Try to match faces with the VIP guest list provided
3. Consider facial features, age, gender, and context
4. Be conservative - only report matches you're confident about

Respond in this format:
Faces_Detected: [number]
VIP_Matches: [guest_name1, guest_name2] or "none"
Confidence: [1-10]

Example: "Faces_Detected: 2, VIP_Matches: Sarah Johnson, Confidence: 8"
`;

        const requestBody = {
          contents: [{
            parts: [
              { text: recognitionPrompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 1024,
          }
        };

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=${analyzerRef.current.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          }
        );

        if (!response.ok) {
          throw new Error(`Recognition API error: ${response.status}`);
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Parse recognition results
        const vipMatches = responseText.match(/VIP_Matches:\s*([^,\n]+)/i)?.[1]?.trim();
        const confidence = parseInt(responseText.match(/Confidence:\s*(\d+)/i)?.[1] || '0');

        if (vipMatches && vipMatches !== 'none' && confidence >= 6) {
          const matchedNames = vipMatches.split(',').map(name => name.trim());
          
          matchedNames.forEach(matchedName => {
            const guest = vipGuests.find(g => 
              g.name.toLowerCase().includes(matchedName.toLowerCase()) ||
              matchedName.toLowerCase().includes(g.name.toLowerCase())
            );
            
            if (guest) {
              // Update recognition count and last seen
              const updatedGuest = {
                ...guest,
                lastSeen: new Date(),
                recognitionCount: guest.recognitionCount + 1
              };
              
              setRecognizedGuests(prev => {
                const existing = prev.find(g => g.id === guest.id);
                if (existing) {
                  return prev.map(g => g.id === guest.id ? updatedGuest : g);
                } else {
                  return [...prev, updatedGuest];
                }
              });

              // Trigger recognition callback
              onVIPRecognized(updatedGuest);
              
              console.log(`🎯 VIP Recognized: ${guest.name} (${guest.role}) - Confidence: ${confidence}`);
            }
          });
        }

        setLastAnalysis(new Date());

      } catch (error: any) {
        console.error('Face recognition error:', error);
        setError(error.message);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Run recognition every 10 seconds
    intervalRef.current = setInterval(runFaceRecognition, 10000);
    
    // Run initial recognition after 2 seconds
    setTimeout(runFaceRecognition, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, videoElement, vipGuests, isAnalyzing]);

  const formatLastSeen = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Eye className="w-5 h-5 text-blue-400" />
          <span className="text-white font-medium">Face Recognition</span>
          {enabled && isAnalyzing && (
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          )}
        </div>
        <div className="text-xs text-gray-400">
          {vipGuests.length} VIPs registered
        </div>
      </div>

      {/* Status */}
      <div className={`bg-white/10 rounded-lg p-3 border border-white/20 ${!enabled ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">Status:</span>
          <span className={`font-semibold ${
            !enabled ? 'text-gray-400' : 
            isAnalyzing ? 'text-yellow-300' : 
            'text-green-300'
          }`}>
            {!enabled ? 'Disabled' : isAnalyzing ? 'Scanning...' : 'Active'}
          </span>
        </div>
        
        {lastAnalysis && (
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-300">Last Scan:</span>
            <span className="text-purple-300">{formatLastSeen(lastAnalysis)}</span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* VIP Guest List */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">VIP Guests</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {vipGuests.map((guest) => {
            const recognized = recognizedGuests.find(g => g.id === guest.id);
            const isRecognized = recognized && recognized.recognitionCount > 0;
            
            return (
              <div
                key={guest.id}
                className={`p-3 rounded-lg border transition-all ${
                  isRecognized
                    ? 'bg-green-500/20 border-green-500/40'
                    : 'bg-white/5 border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {guest.faceImageUrl ? (
                      <img
                        src={guest.faceImageUrl}
                        alt={guest.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{guest.name}</p>
                      <p className="text-xs text-gray-400">{guest.role}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {isRecognized ? (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-300">
                          Seen {recognized.recognitionCount}x
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">Not detected</span>
                    )}
                    {recognized?.lastSeen && (
                      <p className="text-xs text-gray-400 mt-1">
                        {formatLastSeen(recognized.lastSeen)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {vipGuests.length === 0 && (
            <div className="text-center py-4">
              <Camera className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No VIP guests configured</p>
              <p className="text-xs text-gray-500">Add guests in Event Setup</p>
            </div>
          )}
        </div>
      </div>

      {/* Recognition Stats */}
      {recognizedGuests.length > 0 && (
        <div className="bg-green-600/10 rounded-lg p-3 border border-green-500/20">
          <div className="grid grid-cols-2 gap-4 text-center text-xs">
            <div>
              <p className="text-green-300 font-semibold">{recognizedGuests.length}</p>
              <p className="text-gray-400">VIPs Detected</p>
            </div>
            <div>
              <p className="text-green-300 font-semibold">
                {recognizedGuests.reduce((sum, g) => sum + g.recognitionCount, 0)}
              </p>
              <p className="text-gray-400">Total Recognitions</p>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className={`bg-blue-600/10 rounded-lg p-2 border border-blue-500/20 ${!enabled ? 'opacity-50' : ''}`}>
        <p className="text-xs text-gray-300 text-center">
          <strong>AI Face Recognition</strong><br />
          {enabled ? 'Scanning for VIP guests every 10 seconds' : 'Enable in Event Setup to start recognition'}
        </p>
      </div>
    </div>
  );
};