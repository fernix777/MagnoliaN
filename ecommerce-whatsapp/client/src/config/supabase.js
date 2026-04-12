import { createClient } from '@supabase/supabase-js'

// CREDENCIALES HARDCODEADAS (nuevo proyecto)
const HARDCODED_URL = 'https://dsovrmquhgkquqsvkptc.supabase.co';
const HARDCODED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3ZybXF1aGdrcXVxc3ZrcHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzcyNTIsImV4cCI6MjA5MTUxMzI1Mn0.BYHmFiUuuvZaAUNXINKiqSt4TMYoSDQUFd_HyDx-H7A';

// Usar variables de entorno o hardcodeadas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || HARDCODED_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || HARDCODED_KEY;

// Debug temporal para verificar valores de entorno en el cliente
console.log('[Supabase config] supabaseUrl =', JSON.stringify(supabaseUrl))
console.log('[Supabase config] supabaseAnonKey definido =', !!supabaseAnonKey)
console.log('[Supabase config] Usando hardcodeado:', !import.meta.env.VITE_SUPABASE_URL)

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    }
})
