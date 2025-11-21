import { supabase } from './config/supabase.js'

console.log('🔍 Probando conexión a Supabase...\n')

async function testConnection() {
    try {
        // Test 1: Verificar configuración
        console.log('📋 Test 1: Verificación de configuración')
        console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
        console.log('Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Configurada' : '✗ No configurada')
        console.log('')

        // Test 2: Probar lectura de settings
        console.log('📋 Test 2: Lectura de tabla settings')
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('*')

        if (settingsError) {
            console.error('✗ Error:', settingsError.message)
            console.log('💡 Tip: ¿Ejecutaste el schema SQL en Supabase?')
        } else {
            console.log('✓ Conexión exitosa!')
            console.log(`✓ ${settings.length} configuraciones encontradas`)
            settings.forEach(s => console.log(`  - ${s.key}: ${s.value}`))
        }
        console.log('')

        // Test 3: Verificar buckets de storage
        console.log('📋 Test 3: Verificación de Storage')
        const { data: buckets, error: bucketsError } = await supabase
            .storage
            .listBuckets()

        if (bucketsError) {
            console.error('✗ Error:', bucketsError.message)
        } else {
            console.log('✓ Storage accesible')
            console.log(`✓ ${buckets.length} buckets encontrados:`)
            buckets.forEach(b => console.log(`  - ${b.name} (${b.public ? 'público' : 'privado'})`))
        }
        console.log('')

        console.log('✅ Todas las pruebas completadas!')

    } catch (error) {
        console.error('❌ Error inesperado:', error)
    }
}

testConnection()
