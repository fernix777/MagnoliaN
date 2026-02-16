import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const serverEnvPath = path.resolve(__dirname, '../../server/.env')
let serviceKey = null
let supabaseUrl = process.env.VITE_SUPABASE_URL

try {
  const serverEnv = fs.readFileSync(serverEnvPath, 'utf8')
  const keyMatch = serverEnv.match(/SUPABASE_SERVICE_KEY=(.+)/)
  const urlMatch = serverEnv.match(/SUPABASE_URL=(.+)/)
  if (keyMatch) serviceKey = keyMatch[1].trim()
  if (urlMatch) supabaseUrl = urlMatch[1].trim()
} catch (e) {
  console.error('Could not read server .env', e)
}

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function audit() {
  const tables = [
    'products',
    'product_images',
    'product_variants',
    'product_categories',
    'categories',
    'orders',
    'order_items',
    'profiles',
    'banners'
  ]

  console.log('Auditing Supabase project:', supabaseUrl)
  for (const t of tables) {
    try {
      const { count, error } = await supabase
        .from(t)
        .select('*', { count: 'exact', head: true })
      if (error) {
        console.log(`${t}: ERROR -> ${error.message}`)
      } else {
        console.log(`${t}: OK -> count=${count ?? 'unknown'}`)
      }
    } catch (e) {
      console.log(`${t}: EXCEPTION -> ${e.message}`)
    }
  }
}

audit()
