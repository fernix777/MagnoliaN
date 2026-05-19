/**
 * Ejecuta el SQL de schema en el nuevo proyecto de Supabase
 *
 * Uso: node server/src/scripts/setup-new-project.mjs
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../..', '.env') })

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const SQL_FILE = join(__dirname, '../..', 'new-project-schema.sql')
const sql = readFileSync(SQL_FILE, 'utf-8')

console.log('Proyecto:', SUPABASE_URL)
console.log('Ejecutando SQL desde:', SQL_FILE)
console.log(`Tamaño del SQL: ${sql.split('\n').length} líneas`)
console.log('')

async function runSQL(query) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ query })
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`HTTP ${resp.status}: ${text.substring(0, 500)}`)
  }
  return resp
}

async function main() {
  // Dividir en bloques separados por ';' al final de línea
  const blocks = sql
    .split('\n')
    .join(' ')
    .replace(/\s+/g, ' ')
    .split(';')
    .map(b => b.trim())
    .filter(Boolean)

  console.log(`Bloques SQL a ejecutar: ${blocks.length}`)
  console.log('')

  let ok = 0, fail = 0

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (!block || block.length < 10) continue
    try {
      await runSQL(block + ';')
      ok++
      if (i % 20 === 0) console.log(`  ${i}/${blocks.length}...`)
    } catch (e) {
      fail++
      const msg = e.message.substring(0, 120)
      console.log(`  ❌ Bloque ${i}: ${msg}`)
    }
  }

  console.log('')
  console.log(`✅ Éxitos: ${ok}  |  ❌ Errores: ${fail}`)
}

main().catch(console.error)
