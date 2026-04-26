import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseSecretKey = process.env.SUPABASE_SECRET || ''

if (!supabaseUrl || !supabaseSecretKey) {
  console.warn('Supabase credentials missing in server .env')
}

export const supabase = createClient(supabaseUrl, supabaseSecretKey)
