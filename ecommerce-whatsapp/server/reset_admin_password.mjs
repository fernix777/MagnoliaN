/**
 * reset_admin_password.mjs
 * Resetea la contraseña del usuario admin usando service_role key.
 * Uso: node reset_admin_password.mjs <nueva_contraseña>
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dqewyrotzskpbymecntt.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZXd5cm90enNrcGJ5bWVjbnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEwMDQ0MCwiZXhwIjoyMDk0Njc2NDQwfQ.vLxfjGvFbrHPtMMwzV2hZHM4YLw_eck1EIH5rFrCkLA'

const ADMIN_ID   = '77c8d37b-d817-445b-b850-0c7e98a2e9c4'
const ADMIN_EMAIL = 'administracion@magnolia.com'

const newPassword = process.argv[2]

if (!newPassword) {
  console.error('❌ Uso: node reset_admin_password.mjs <nueva_contraseña>')
  console.error('   Ejemplo: node reset_admin_password.mjs MiNuevaContraseña2026!')
  process.exit(1)
}

if (newPassword.length < 8) {
  console.error('❌ La contraseña debe tener al menos 8 caracteres')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  console.log(`\n🔑 Reseteando contraseña para: ${ADMIN_EMAIL}`)
  console.log(`   ID: ${ADMIN_ID}\n`)

  const { data, error } = await supabase.auth.admin.updateUserById(ADMIN_ID, {
    password: newPassword,
    user_metadata: { role: 'admin', email_verified: true }
  })

  if (error) {
    console.error('❌ Error al resetear contraseña:', error.message)
    return
  }

  console.log('✅ Contraseña actualizada exitosamente')
  console.log(`   Email: ${data.user.email}`)
  console.log(`   Rol: ${data.user.user_metadata?.role}`)
  console.log()

  // Verificar que el login funciona
  console.log('🔍 Verificando login con nueva contraseña...')
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZXd5cm90enNrcGJ5bWVjbnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMDA0NDAsImV4cCI6MjA5NDY3NjQ0MH0.23oKKutBsAHJG8Pz-FkP53ArsKVjY_Kq9wm9K4oGpyE'
  const anonClient = createClient(SUPABASE_URL, anonKey)

  const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: newPassword
  })

  if (loginError) {
    console.error('❌ Login todavía falla:', loginError.message)
    return
  }

  console.log('✅ Login exitoso!')
  console.log(`   Rol en JWT: ${loginData.user.user_metadata?.role}`)

  // Probar INSERT de producto de prueba
  console.log('\n🧪 Probando INSERT de producto de prueba...')
  const { data: prod, error: prodError } = await anonClient
    .from('products')
    .insert([{
      name: 'TEST PRODUCTO DIAGNÓSTICO',
      slug: 'test-diagnostico-' + Date.now(),
      base_price: 1.00,
      stock: 1,
      active: false,
      featured: false,
    }])
    .select()
    .single()

  if (prodError) {
    console.error('❌ INSERT falló:', prodError.message, '| code:', prodError.code)
    if (prodError.code === '42501') {
      console.log('\n⚠️  RLS sigue bloqueando. El JWT no lleva role=admin correctamente.')
      console.log('   Solución: ejecuta el SQL de diagnóstico en Supabase SQL Editor.')
    }
  } else {
    console.log('✅ INSERT de producto OK! ID:', prod.id)
    // Limpieza
    await anonClient.from('products').delete().eq('id', prod.id)
    console.log('🗑️  Producto de prueba eliminado')
  }

  await anonClient.auth.signOut()
  console.log('\n=== DIAGNÓSTICO COMPLETO ===')
}

main().catch(console.error)
