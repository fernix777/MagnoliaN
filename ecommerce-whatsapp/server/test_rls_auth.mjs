import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dqewyrotzskpbymecntt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZXd5cm90enNrcGJ5bWVjbnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMDA0NDAsImV4cCI6MjA5NDY3NjQ0MH0.23oKKutBsAHJG8Pz-FkP53ArsKVjY_Kq9wm9K4oGpyE'

const supabase = createClient(SUPABASE_URL, ANON_KEY)

async function test() {
  // Test 1: INSERT with anon key (no auth) - should fail with RLS
  console.log('=== Test 1: INSERT con anon key ===')
  const testData = {
    name: 'ANON TEST',
    slug: 'anon-test-' + Date.now(),
    base_price: 100.00,
    stock: 10,
    active: false,
    featured: false,
    has_colors: false,
    sale_types: ['unidad'],
    units_per_box: 12,
    boxes_per_bundle: 40
  }

  const { data: ins1, error: err1 } = await supabase
    .from('products')
    .insert(testData)
    .select()
    .single()

  console.log('INSERT OK:', !!ins1)
  console.log('Error code:', err1?.code)
  console.log('Error msg:', err1?.message)
  console.log()

  // Test 2: Login as admin then INSERT
  console.log('=== Test 2: Login admin ===')
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'administracion@magnolia.com'
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Magnolia2026!'

  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  })

  if (loginErr) {
    console.log('❌ Login falló:', loginErr.message)
    console.log()
    // Try to list admin users to find correct credentials
    console.log('Probando listar admins...')
    return
  }

  console.log('✅ Login exitoso')
  console.log('Email:', loginData.user.email)
  console.log('Role:', loginData.user.user_metadata?.role)
  console.log()

  // Test 3: INSERT after login
  console.log('=== Test 3: INSERT después del login ===')
  const testData2 = {
    name: 'LOGIN TEST',
    slug: 'login-test-' + Date.now(),
    base_price: 100.00,
    stock: 10,
    active: false,
    featured: false,
    has_colors: false,
    sale_types: ['unidad'],
    units_per_box: 12,
    boxes_per_bundle: 40
  }

  const { data: ins2, error: err2 } = await supabase
    .from('products')
    .insert(testData2)
    .select()
    .single()

  console.log('INSERT OK:', !!ins2)
  console.log('Error code:', err2?.code)
  console.log('Error msg:', err2?.message)
  console.log('Error details:', err2?.details)
  console.log('Error hint:', err2?.hint)
  console.log()

  if (ins2?.id) {
    await supabase.from('products').delete().eq('id', ins2.id)
    console.log('Test product deleted.')
  }
  console.log('=== DONE ===')
}

test().catch(console.error)
