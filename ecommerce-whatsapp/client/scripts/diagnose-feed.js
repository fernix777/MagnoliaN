/**
 * Script para diagnosticar problemas con el feed
 */

import { createClient } from '@supabase/supabase-js'

console.log('🔍 Diagnosticando problemas del feed...')

// Intentar con diferentes configuraciones
const configs = [
    {
        name: 'Anon Key actual',
        url: 'https://prymijhlpoeqhihztuwl.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeW1pamhscG9lcWhpaHp0dXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mzk3MDUsImV4cCI6MjA3OTIxNTcwNX0.xn29dwZNae71amG8Y_2RgE3ZPCbCqrTzKSFBNxDARgk'
    }
]

async function testConnection() {
    for (const config of configs) {
        console.log(`\n📡 Probando configuración: ${config.name}`)
        
        const supabase = createClient(config.url, config.key)
        
        try {
            // Test 1: Conexión básica
            console.log('  🔗 Test de conexión básica...')
            const { data, error } = await supabase
                .from('products')
                .select('count')
                .limit(1)
            
            if (error) {
                console.log(`  ❌ Error de conexión: ${error.message}`)
                continue
            }
            
            console.log('  ✅ Conexión exitosa')
            
            // Test 2: Contar productos activos
            console.log('  📊 Contando productos activos...')
            const { count, error: countError } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('active', true)
            
            if (countError) {
                console.log(`  ❌ Error contando productos: ${countError.message}`)
                continue
            }
            
            console.log(`  ✅ Productos activos: ${count}`)
            
            // Test 3: Obtener productos recientes (últimos 5)
            console.log('  🕐 Obteniendo productos recientes...')
            const { data: recentProducts, error: recentError } = await supabase
                .from('products')
                .select('id, name, created_at, active')
                .eq('active', true)
                .order('created_at', { ascending: false })
                .limit(5)
            
            if (recentError) {
                console.log(`  ❌ Error obteniendo recientes: ${recentError.message}`)
                continue
            }
            
            console.log('  ✅ Productos recientes:')
            recentProducts.forEach((product, index) => {
                const date = new Date(product.created_at).toLocaleDateString('es-AR')
                console.log(`    ${index + 1}. ${product.name} (${date})`)
            })
            
            // Test 4: Verificar si hay productos nuevos en los últimos 7 días
            console.log('  🆕 Verificando productos nuevos (últimos 7 días)...')
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
            
            const { data: newProducts, error: newError } = await supabase
                .from('products')
                .select('id, name, created_at')
                .eq('active', true)
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: false })
            
            if (newError) {
                console.log(`  ❌ Error verificando nuevos: ${newError.message}`)
            } else {
                console.log(`  ✅ Productos nuevos (7 días): ${newProducts.length}`)
                if (newProducts.length > 0) {
                    newProducts.forEach((product, index) => {
                        const date = new Date(product.created_at).toLocaleDateString('es-AR')
                        console.log(`    ${index + 1}. ${product.name} (${date})`)
                    })
                }
            }
            
            console.log(`\n🎉 Configuración ${config.name} funciona correctamente`)
            return true
            
        } catch (error) {
            console.log(`  ❌ Error inesperado: ${error.message}`)
        }
    }
    
    console.log('\n❌ Ninguna configuración funcionó')
    console.log('\n🔧 Posibles soluciones:')
    console.log('1. Verificar la API key en el dashboard de Supabase')
    console.log('2. Generar una nueva API key si la actual está expirada')
    console.log('3. Verificar que el proyecto de Supabase esté activo')
    console.log('4. Revisar los Row Level Security (RLS) policies')
    
    return false
}

testConnection()
