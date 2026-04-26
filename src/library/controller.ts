import { Response } from 'express'
import { AuthRequest } from '../utils/auth'
import { supabase } from '../utils/supabase'

export const addToLibrary = async (req: AuthRequest, res: Response) => {
  const { videoId, title, thumbnailUrl } = req.body
  const user = req.user

  if (!user) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  // Check if already in library
  const { data: existing } = await supabase
    .from('library')
    .select('id')
    .eq('user_id', user.id)
    .eq('video_id', videoId)
    .single()

  if (existing) {
    res.status(400).json({ error: 'Video already in library' })
    return
  }

  const { data, error } = await supabase
    .from('library')
    .insert([{ 
        user_id: user.id, 
        video_id: videoId, 
        title, 
        thumbnail_url: thumbnailUrl 
    }])
    .select()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ data: data[0] })
}

export const getLibrary = async (req: AuthRequest, res: Response) => {
  const user = req.user

  if (!user) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  const { data, error } = await supabase
    .from('library')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ data })
}

export const removeFromLibrary = async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const user = req.user

    if (!user) {
        res.status(401).json({ error: 'Authentication required' })
        return
    }

    const { error } = await supabase
        .from('library')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        res.status(500).json({ error: error.message })
        return
    }

    res.json({ success: true })
}

export const checkLibraryStatus = async (req: AuthRequest, res: Response) => {
    const { videoId } = req.params
    const user = req.user

    if (!user) {
        res.json({ isSaved: false })
        return
    }

    const { data, error } = await supabase
        .from('library')
        .select('id')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .single()

    res.json({ isSaved: !!data && !error, id: data?.id })
}
