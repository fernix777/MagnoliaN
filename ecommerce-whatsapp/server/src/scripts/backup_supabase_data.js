import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan SUPABASE_URL / SUPABASE_SERVICE_KEY en server/.env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const TABLES = [
  'categories',
  'subcategories',
  'products',
  'product_images',
  'product_variants',
  'product_categories',
  'orders',
  'order_items',
  'banners',
  'settings',
  'profiles'
]

async function fetchAll(table) {
  const pageSize = 1000
  let from = 0
  let all = []

  while (true) {
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, to)

    if (error) {
      console.warn(`No se pudo leer tabla ${table}: ${error.message}`)
      return null
    }

    const chunk = data || []
    all = all.concat(chunk)

    if (chunk.length < pageSize) {
      break
    }

    from += pageSize
  }

  return all
}

async function run() {
  const backup = {
    generatedAt: new Date().toISOString(),
    tables: {}
  }

  for (const table of TABLES) {
    console.log(`Respaldando tabla ${table}...`)
    const rows = await fetchAll(table)
    if (rows === null) {
      continue
    }
    backup.tables[table] = rows
    console.log(`  Filas: ${rows.length}`)
  }

  const backupDir = path.resolve(__dirname, '../../../backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const now = new Date()
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..+/, '')
  const filename = `supabase_backup_${stamp}.json`
  const filepath = path.join(backupDir, filename)

  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf8')

  console.log(`Backup completado: ${filepath}`)
}

run()

