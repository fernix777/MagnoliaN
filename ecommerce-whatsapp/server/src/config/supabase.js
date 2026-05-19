import dotenv from 'dotenv'
dotenv.config({ override: true })

import { createClient } from '@supabase/supabase-js'

// Usa variables de entorno (server/.env)
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

console.log('--- SUPABASE CONFIG INIT ---');
console.log('URL:', supabaseUrl);
console.log('SERVICE_KEY starts with:', supabaseServiceKey ? supabaseServiceKey.substring(0, 15) : 'UNDEFINED!');

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
export const supabasePublic = supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : supabase
