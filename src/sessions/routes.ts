import { Router } from 'express'
import { createSession, getSessions, deleteSession, updateSession, getPublicSessions, getSessionById } from './controller'
import { requireAuth } from '../utils/auth'

const router = Router()

router.post('/', requireAuth, (req, res) => {
    createSession(req, res)
})

router.get('/', requireAuth, (req, res) => {
    getSessions(req, res)
})

router.get('/explore', (req, res) => {
    getPublicSessions(req as any, res)
})

router.get('/:id', (req, res) => {
    getSessionById(req as any, res)
})

router.put('/:id', requireAuth, (req, res) => {
    updateSession(req, res)
})

router.delete('/:id', requireAuth, (req, res) => {
    deleteSession(req, res)
})

export default router
