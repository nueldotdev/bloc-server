import { Request, Response, NextFunction } from 'express'
import { supabase } from './supabase'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email?: string
  }
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    res.status(401).json({ error: 'Missing authorization header' })
    return 
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    res.status(401).json({ error: 'Invalid token' })
    return
  }

  req.user = {
    id: user.id,
    email: user.email
  }

  next()
}

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return next()
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (!error && user) {
    req.user = {
      id: user.id,
      email: user.email
    }
  }

  next()
}
