/**
 * Utility to extract video IDs from YouTube playlists
 */

interface PlaylistVideo {
  id: string;
  title: string;
}

/**
 * Extract playlist ID from various YouTube URL formats
 */
export const extractPlaylistId = (url: string): string | null => {
  try {
    const urlObj = new URL(url.includes('://') ? url : `https://${url}`);
    
    // Check query params for list/playlist ID
    const playlistId = urlObj.searchParams.get('list') || urlObj.searchParams.get('playlist');
    if (playlistId) return playlistId;
    
    // Check if it's a 34-character playlist ID directly
    if (url.length === 34 && url.match(/^[a-zA-Z0-9_-]{34}$/)) {
      return url;
    }
  } catch (e) {
    // Check if raw string is a valid playlist ID
    if (url.length === 34 && url.match(/^[a-zA-Z0-9_-]{34}$/)) {
      return url;
    }
  }
  return null;
};

/**
 * Fetch playlist videos from YouTube
 * Uses YouTube's embedded initial data to avoid needing API keys
 */
export const fetchPlaylistVideos = async (playlistId: string): Promise<PlaylistVideo[]> => {
  try {
    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
    
    // Fetch the playlist page
    const response = await fetch(playlistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch playlist: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract the initial data from the page
    // YouTube embeds the initial data in a script tag: var ytInitialData = {...}
    const initialDataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/);
    
    if (!initialDataMatch) {
      throw new Error('Could not extract playlist data from YouTube page');
    }

    const initialData = JSON.parse(initialDataMatch[1]);
    
    // Navigate through the nested structure to find videos
    const videos: PlaylistVideo[] = [];
    
    try {
      const contents = initialData.contents.twoColumnBrowseResultsRenderer.tabs[0]
        .tabRenderer.content.sectionListRenderer.contents[0]
        .itemSectionRenderer.contents[0]
        .playlistVideoListRenderer.contents;

      for (const item of contents) {
        if (item.playlistVideoRenderer) {
          const videoId = item.playlistVideoRenderer.videoId;
          const titleRuns = item.playlistVideoRenderer.title?.runs || [];
          const title = titleRuns.map((run: any) => run.text).join('') || videoId;
          
          videos.push({
            id: videoId,
            title: title.substring(0, 200) // Cap title length
          });
        }
        
        // Stop if we've fetched a reasonable number
        if (videos.length >= 100) break;
      }
    } catch (e) {
      console.error('Error parsing playlist contents:', e);
      // Continue with what we got, or throw if we have nothing
      if (videos.length === 0) {
        throw new Error('Could not parse playlist videos from YouTube data');
      }
    }

    return videos;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[PlaylistUtil] Error fetching playlist videos: ${errorMessage}`);
    throw new Error(`Failed to fetch playlist videos: ${errorMessage}`);
  }
};
