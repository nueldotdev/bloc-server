import { Router } from 'express'
import { handleChat, getHistory, getTopics } from './controller'
import { requireAuth } from '../utils/auth'

const router = Router()

router.post('/chat', requireAuth, (req, res) => {
    handleChat(req, res)
})

router.get('/history/:videoId', requireAuth, (req, res) => {
    getHistory(req, res)
})

router.post('/topics', requireAuth, (req, res) => {
    getTopics(req, res)
})

export default router
