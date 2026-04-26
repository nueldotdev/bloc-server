import { Router } from 'express'
import { createNote, getNotes, deleteNote } from './controller'
import { requireAuth } from '../utils/auth'

const router = Router()

router.post('/', requireAuth, (req, res) => {
    createNote(req, res)
})

router.get('/:videoId', requireAuth, (req, res) => {
    getNotes(req, res)
})

router.put('/:id', requireAuth, (req, res) => {
    updateNote(req, res)
})

router.delete('/:id', requireAuth, (req, res) => {
    deleteNote(req, res)
})

export default router
