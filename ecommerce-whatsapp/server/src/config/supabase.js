import dotenv from 'dotenv'
dotenv.config({ override: true })

import { createClient } from '@supabase/supabase-js'

// CREDENCIALES NUEVO PROYECTO (hardcodeadas temporalmente)
const NUEVO_PROJECT_URL = 'https://dsovrmquhgkquqsvkptc.supabase.co';
const NUEVO_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3ZybXF1aGdrcXVxc3ZrcHRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkzNzI1MiwiZXhwIjoyMDkxNTEzMjUyfQ.wXoOTwXEJaEA-PHuQ9TfwnvEWpXAd-VkcRRlzKzqtXw';
const NUEVO_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3ZybXF1aGdrcXVxc3ZrcHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzcyNTIsImV4cCI6MjA5MTUxMzI1Mn0.BYHmFiUuuvZaAUNXINKiqSt4TMYoSDQUFd_HyDx-H7A';

// Usar variables de entorno si existen, sino usar las hardcodeadas
const supabaseUrl = process.env.SUPABASE_URL || NUEVO_PROJECT_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || NUEVO_SERVICE_KEY;

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
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || NUEVO_ANON_KEY;
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey)
