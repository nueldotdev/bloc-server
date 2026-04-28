
export const getTranscript = async (id: string) => {
  const { YoutubeTranscript } = await import('youtube-transcript')
  const transcriptData = await YoutubeTranscript.fetchTranscript(id);
  if (!transcriptData || transcriptData.length === 0) {
    return
  }

  return transcriptData
  
}