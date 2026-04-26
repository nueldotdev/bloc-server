import { Router } from 'express'
import { addToLibrary, getLibrary, removeFromLibrary, checkLibraryStatus } from './controller'
import { requireAuth, optionalAuth } from '../utils/auth'

const router = Router()

router.post('/', requireAuth, (req, res) => {
    addToLibrary(req, res)
})

router.get('/', requireAuth, (req, res) => {
    getLibrary(req, res)
})

router.get('/status/:videoId', optionalAuth, (req, res) => {
    checkLibraryStatus(req, res)
})

router.delete('/:id', requireAuth, (req, res) => {
    removeFromLibrary(req, res)
})

export default router
