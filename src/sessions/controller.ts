import { Response } from 'express'
import { AuthRequest } from '../utils/auth'
import { supabase } from '../utils/supabase'

export const createSession = async (req: AuthRequest, res: Response) => {
  console.log('[SessionsController] createSession hit', req.body)
  const { name, initialUrl, queue, isPublic, description, coverUrl } = req.body
  const user = req.user

  if (!user) {
    console.error('[SessionsController] Unauthorized createSession attempt')
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert([{ 
        user_id: user.id, 
        name, 
        initial_url: initialUrl,
        queue: queue || [],
        is_public: isPublic || false,
        description,
        cover_url: coverUrl
    }])
    .select()

  if (error) {
    console.error('[SessionsController] Supabase error in createSession:', error)
    res.status(500).json({ error: error.message })
    return
  }

  console.log('[SessionsController] session created successfully', data[0])
  res.json({ data: data[0] })
}

export const getSessions = async (req: AuthRequest, res: Response) => {
  const user = req.user

  if (!user) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[SessionsController] Supabase error in getSessions:', error)
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ data })
}

export const getSessionById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      profiles!user_id (
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('[SessionsController] error in getSessionById:', error)
    res.status(404).json({ error: 'Session not found' })
    return
  }

  res.json({ data })
}

export const getPublicSessions = async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      profiles!user_id (
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[SessionsController] Supabase error in getPublicSessions:', error)
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ data })
}

export const deleteSession = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const user = req.user

  if (!user) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ success: true })
}

export const updateSession = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { name, initialUrl, queue, isPublic, description, coverUrl } = req.body
  const user = req.user

  if (!user) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (initialUrl !== undefined) updateData.initial_url = initialUrl
  if (queue !== undefined) updateData.queue = queue
  if (isPublic !== undefined) updateData.is_public = isPublic
  if (description !== undefined) updateData.description = description
  if (coverUrl !== undefined) updateData.cover_url = coverUrl

  const { data, error } = await supabase
    .from('sessions')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ data: data[0] })
}
