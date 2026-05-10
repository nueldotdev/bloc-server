import { Router } from 'express'
import { requireAuth } from '../utils/auth'
import { getProfileById, updateProfile } from './controller'

const router = Router()

router.get('/:id', requireAuth, (req, res) => {
    getProfileById(req, res)
})

router.put('/:id', requireAuth, (req, res) => {
    updateProfile(req, res)
})

export default router
