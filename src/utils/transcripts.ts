
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
  reason: 'DISABLED_OR_BLOCKED' | 'UNKNOWN';
  message: string;
}

export async function getTranscript(
  id: string | string[]
): Promise<TranscriptResponse[] | TranscriptErrorState> {
  try {
    // Try fetching with spoofed desktop browser headers
    const transcript = await YoutubeTranscript.fetchTranscript(id as string);
    
    return transcript as TranscriptResponse[];
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[Transcript Utility] Failed for video ${id}:`, error?.message);
      return {
        error: true,
        reason: error?.message?.includes('Transcript is disabled') ? 'DISABLED_OR_BLOCKED' : 'UNKNOWN',
        message: error?.message || 'Unknown transcript fetching error'
      };
    }

    return error as TranscriptErrorState;
  }
}