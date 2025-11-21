import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
}

// Cliente con service key para operaciones admin
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

// Cliente con anon key para operaciones públicas
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey)
