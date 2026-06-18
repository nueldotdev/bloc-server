import { Router } from 'express'
import { getPlaylistVideos } from './controller'

const router = Router()

// Get videos from a playlist URL
router.get('/videos', (req, res) => {
  getPlaylistVideos(req as any, res)
})

export default router
