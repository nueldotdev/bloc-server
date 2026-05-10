import { Response } from 'express'
import { AuthRequest } from '../utils/auth'
import { supabase } from '../utils/supabase'

export const createNote = async (req: AuthRequest, res: Response) => {
  const { videoId, text, timestamp, sessionId } = req.body
  const user = req.user

  if (!user) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  const { data, error } = await supabase
    .from('notes')
    .insert([{ 
        user_id: user.id, 
        video_id: videoId, 
        text, 
        timestamp, 
        session_id: sessionId 
    }])
    .select()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ data: data[0] })
}

export const getNotes = async (req: AuthRequest, res: Response) => {
  const { videoId } = req.params
  const { sessionId } = req.query
  const user = req.user

  if (!user) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  let query = supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .eq('video_id', videoId)
    
  if (sessionId) {
      query = query.eq('session_id', sessionId)
  }

  const { data, error } = await query.order('timestamp', { ascending: false })

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ data })
}

export const getAllNotes = async (req: AuthRequest, res: Response) => {
    const user = req.user

    if (!user) {
        res.status(401).json({ error: 'Authentication required' })
        return
    }

    const { data, error } = await supabase
        .from('notes')
        .select(`
            *,
            sessions (
                name,
                queue
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        res.status(500).json({ error: error.message })
        return
    }

    res.json({ data })
}

export const deleteNote = async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const user = req.user

    if (!user) {
        res.status(401).json({ error: 'Authentication required' })
        return
    }

    const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        res.status(500).json({ error: error.message })
        return
    }

    res.json({ success: true })
}

export const updateNote = async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const { text } = req.body
    const user = req.user

    if (!user) {
        res.status(401).json({ error: 'Authentication required' })
        return
    }

    const { data, error } = await supabase
        .from('notes')
        .update({ text })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()

    if (error) {
        res.status(500).json({ error: error.message })
        return
    }

    res.json({ data: data[0] })
}
