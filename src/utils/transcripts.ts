
// export const getTranscript = async (id: string) => {
//   const { YoutubeTranscript } = await import('youtube-transcript')
//   const transcriptData = await YoutubeTranscript.fetchTranscript(id);
//   if (!transcriptData || transcriptData.length === 0) {
//     return
//   }

//   return transcriptData
  
// }
// 
import { YoutubeTranscript } from 'youtube-transcript';

// Define the shape of the success payload from youtube-transcript
export interface TranscriptResponse {
  text: string;
  duration: number;
  offset: number;
}

// Define our clean error return state
export interface TranscriptErrorState {
  error: true;
  reason: 'DISABLED_OR_BLOCKED' | 'UNKNOWN' | 'API_ERROR';
  message: string;
}

/**
 * Fetches transcript from Supadata.ai as a fallback
 */
async function fetchFromSupadata(id: string): Promise<TranscriptResponse[] | null> {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) {
    console.warn('[Transcript Utility] Supadata API Key missing. Skipping fallback.');
    return null;
  }

  try {
    const url = `https://api.supadata.ai/v1/youtube/transcript?url=https://www.youtube.com/watch?v=${id}&text=false`;
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[Transcript Utility] Supadata API error: ${response.status}`, errorData);
      return null;
    }

    const data = await response.json();
    
    // Map Supadata format to our TranscriptResponse format
    // Supadata content: [{ text: string, offset: number, duration: number }, ...]
    if (data.content && Array.isArray(data.content)) {
      return data.content.map((item: any) => ({
        text: item.text,
        duration: item.duration || 0,
        offset: item.offset || 0
      }));
    }

    return null;
  } catch (error) {
    console.error('[Transcript Utility] Supadata fetch failed:', error);
    return null;
  }
}

export async function getTranscript(
  id: string | string[]
): Promise<TranscriptResponse[] | TranscriptErrorState> {
  const videoId = Array.isArray(id) ? id[0] : id;

  try {
    // 1. Primary Attempt: youtube-transcript (Free)
    console.log(`[Transcript Utility] Attempting free fetch for video ${videoId}...`);
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (transcript && transcript.length > 0) {
      return transcript as TranscriptResponse[];
    }
    
    throw new Error('No transcript returned from free method');
  } catch (error: any) {
    console.warn(`[Transcript Utility] Free fetch failed for ${videoId}:`, error?.message);
    
    // 2. Secondary Attempt: Supadata (Fallback)
    console.log(`[Transcript Utility] Attempting Supadata fallback for video ${videoId}...`);
    const fallbackTranscript = await fetchFromSupadata(videoId);
    
    if (fallbackTranscript) {
      console.log(`[Transcript Utility] Supadata fallback successful for ${videoId}`);
      return fallbackTranscript;
    }

    // 3. All methods failed
    return {
      error: true,
      reason: error?.message?.includes('Transcript is disabled') ? 'DISABLED_OR_BLOCKED' : 'UNKNOWN',
      message: error?.message || 'Unknown transcript fetching error'
    };
  }
}