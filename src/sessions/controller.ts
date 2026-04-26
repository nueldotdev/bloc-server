import { Response } from 'express'
import { AuthRequest } from '../utils/auth'
import { supabase } from '../utils/supabase'

export const createSession = async (req: AuthRequest, res: Response) => {
  console.log('[SessionsController] createSession hit', req.body)
  const { name, initialUrl, queue } = req.body
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
        queue: queue || []
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
  const { name, initialUrl, queue } = req.body
  const user = req.user

  if (!user) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  const { data, error } = await supabase
    .from('sessions')
    .update({ name, initial_url: initialUrl, queue })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ data: data[0] })
}
