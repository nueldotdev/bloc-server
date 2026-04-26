// @ts-nocheck
import { fetchTranscript } from "youtube-transcript/dist/youtube-transcript.esm.js";


export const getTranscript = async (id: string) => {

  const transcriptData = await fetchTranscript(id);
  if (!transcriptData || transcriptData.length === 0) {
    return
  }

  return transcriptData
  
}