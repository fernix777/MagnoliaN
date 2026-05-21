import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dqewyrotzskpbymecntt.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZXd5cm90enNrcGJ5bWVjbnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEwMDQ0MCwiZXhwIjoyMDk0Njc2NDQwfQ.vLxfjGvFbrHPtMMwzV2hZHM4YLw_eck1EIH5rFrCkLA'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  console.log('=== DIAGNÓSTICO DE USUARIOS Y ROLES ===\n')

  // 1. Listar todos los usuarios con service_role
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()

  if (usersError) {
    console.error('❌ No se pudo listar usuarios:', usersError.message)
    return
  }

  const users = usersData?.users || []
  console.log(`Total de usuarios: ${users.length}\n`)

  for (const u of users) {
    const role = u.user_metadata?.role ?? '(sin rol)'
    const confirmed = u.email_confirmed_at ? '✅ confirmado' : '⚠️  NO confirmado'
    console.log(`📧 ${u.email}`)
    console.log(`   rol: ${role}`)
    console.log(`   email: ${confirmed}`)
    console.log(`   user_metadata: ${JSON.stringify(u.user_metadata)}`)
    console.log(`   id: ${u.id}`)
    console.log()
  }

  // 2. Verificar qué usuarios tienen rol 'admin'
  const admins = users.filter(u => u.user_metadata?.role === 'admin')
  console.log(`\n👑 Usuarios con rol='admin': ${admins.length}`)
  admins.forEach(u => console.log(`   → ${u.email}`))

  if (admins.length === 0) {
    console.log('\n⚠️  NO HAY USUARIOS CON ROL ADMIN — eso explica por qué RLS bloquea la creación de productos.')
    console.log('Ejecuta el script fix_admin_user.mjs para crear/actualizar el usuario admin.')
  }
}

main().catch(console.error)
