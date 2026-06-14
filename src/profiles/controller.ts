import { Response } from 'express'
import { AuthRequest } from '../utils/auth'
import { supabase } from '../utils/supabase'

export const getProfileById = async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const user = req.user

    if (!user) {
        res.status(401).json({ error: 'Authentication required' })
        return
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        res.status(500).json({ error: error.message })
        return
    }

    res.json({ data })
}

export const updateProfile = async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const { full_name, avatar_url, sanity_checks_enabled, learning_intensity, preferred_check_type, preferred_language } = req.body
    const user = req.user

    if (!user) {
        res.status(401).json({ error: 'Authentication required' })
        return
    }

    const updateData: any = {}
    if (full_name !== undefined) updateData.full_name = full_name
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url
    if (sanity_checks_enabled !== undefined) updateData.sanity_checks_enabled = sanity_checks_enabled
    if (learning_intensity !== undefined) updateData.learning_intensity = learning_intensity
    if (preferred_check_type !== undefined) updateData.preferred_check_type = preferred_check_type
    if (preferred_language !== undefined) updateData.preferred_language = preferred_language

    const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id)
        .select()

    if (error) {
        res.status(500).json({ error: error.message })
        return
    }

    res.json({ data: data[0] })
}
