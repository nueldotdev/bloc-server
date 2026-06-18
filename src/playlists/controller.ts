import { Response } from 'express'
import { AuthRequest } from '../utils/auth'
import { fetchPlaylistVideos, extractPlaylistId } from '../utils/playlist'

/**
 * Fetch all videos from a YouTube playlist
 * GET /api/playlists/videos?url=...
 */
export const getPlaylistVideos = async (req: AuthRequest, res: Response) => {
  try {
    const { url } = req.query
    
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL parameter is required' })
      return
    }

    // Extract playlist ID from various URL formats
    const playlistId = extractPlaylistId(url)
    
    if (!playlistId) {
      res.status(400).json({ 
        error: 'Invalid YouTube URL. Please provide a valid playlist URL.' 
      })
      return
    }

    // Fetch the videos from the playlist
    const videos = await fetchPlaylistVideos(playlistId)
    
    if (videos.length === 0) {
      res.status(400).json({ 
        error: 'Could not find any videos in the playlist. It may be private or empty.' 
      })
      return
    }

    res.json({ 
      data: {
        playlistId,
        videos,
        count: videos.length
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[PlaylistController] Error:', errorMessage)
    res.status(500).json({ 
      error: `Failed to fetch playlist: ${errorMessage}` 
    })
  }
}
