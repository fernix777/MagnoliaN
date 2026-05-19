import { createClient } from '@supabase/supabase-js'

// Usa variables de entorno desde client/.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug temporal para verificar valores de entorno en el cliente
console.log('[Supabase config] supabaseUrl =', JSON.stringify(supabaseUrl))
console.log('[Supabase config] supabaseAnonKey definido =', !!supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    }
})
