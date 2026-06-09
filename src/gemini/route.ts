import { Router } from 'express'
import { handleChat, getHistory, getTopics, getFinalQuiz, getDynamicSanityCheck } from './controller'
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

router.post('/final-quiz', requireAuth, (req, res) => {
    getFinalQuiz(req, res)
})

router.post('/sanity-check', requireAuth, (req, res) => {
    getDynamicSanityCheck(req, res)
})

export default router
