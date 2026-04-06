/**
 * Script FINAL de migración forzada
 * Usa SERVICE ROLE key para poder actualizar
 */

import { createClient } from '@supabase/supabase-js';
import { put } from '@vercel/blob';

// Usar service role key si la tenemos, si no, intentar con anon key
const supabaseUrl = 'https://prymijhlpoeqhihztuwl.supabase.co';
// Service role key con permisos completos
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeW1pamhscG9lcWhpaHp0dXdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzYzOTcwNSwiZXhwIjoyMDc5MjE1NzA1fQ.98VJKF196N7wLLBZijMWkch568B7vQi1sUWNqagFcxM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BLOB_TOKEN = 'vercel_blob_rw_Jxkj6FeScURdG6UL_sN4ofM9Lt2tqYjP32gEvy7AmENk6pw';

async function downloadImage(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return Buffer.from(await response.arrayBuffer());
    } catch (error) {
        console.error(`❌ Error descargando ${url}:`, error.message);
        return null;
    }
}

async function uploadToVercel(buffer, fileName) {
    try {
        const blob = await put(fileName, buffer, {
            access: 'public',
            token: BLOB_TOKEN
        });
        return blob.url;
    } catch (error) {
        console.error(`❌ Error subiendo a Vercel:`, error.message);
        return null;
    }
}

async function forceUpdateProductImages() {
    console.log('🔥 FORZANDO actualización de imágenes de productos...');
    
    // Obtener imágenes que necesitan migración
    const { data: images, error } = await supabase
        .from('product_images')
        .select('id, product_id, image_url')
        .like('image_url', '%supabase.co%')
        .limit(50); // Procesar en lotes pequeños
    
    if (error) {
        console.error('❌ Error obteniendo imágenes:', error.message);
        console.log('🔑 Probando con anon key...');
        
        // Si falla con service key, intentar con anon key
        const anonClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeW1pamhscG9lcWhpaHp0dXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mzk3MDUsImV4cCI6MjA3OTIxNTcwNX0.xn29dwZNae71amG8Y_2RgE3ZPCbCqrTzKSFBNxDARgk');
        
        const { data: anonImages, error: anonError } = await anonClient
            .from('product_images')
            .select('id, product_id, image_url')
            .like('image_url', '%supabase.co%')
            .limit(50);
        
        if (anonError) {
            console.error('❌ Ni siquiera con anon key funciona:', anonError.message);
            return { images: [], error: anonError };
        }
        
        return { images: anonImages, error: null };
    }
    
    return { images, error: null };
}

async function updateWithSQL(imageId, newUrl) {
    try {
        // Intentar actualizar directamente con service role key
        const { error } = await supabase
            .from('product_images')
            .update({ image_url: newUrl })
            .eq('id', imageId);
        
        if (error) {
            console.error(`❌ Error UPDATE ${imageId}:`, error.message);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error(`❌ Error SQL ${imageId}:`, error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 INICIANDO MIGRACIÓN FORZADA FINAL...\n');
    
    const { images, error } = await forceUpdateProductImages();
    
    if (error || !images) {
        console.error('❌ No se pudieron obtener las imágenes');
        console.log('🔍 Esto puede ser por:');
        console.log('   - RLS policies bloqueando updates');
        console.log('   - API key sin permisos de escritura');
        console.log('   - Configuración de Supabase');
        
        console.log('\n💡 SOLUCIÓN MANUAL:');
        console.log('1. Ve a Supabase Dashboard');
        console.log('2. Settings → API');
        console.log('3. Genera nuevo service_role key');
        console.log('4. O desactiva RLS temporalmente');
        
        return;
    }
    
    console.log(`📊 Procesando ${images.length} imágenes...`);
    
    let success = 0;
    let failed = 0;
    
    for (const image of images.slice(0, 5)) { // Probar solo 5 primero
        try {
            console.log(`🔄 Procesando imagen ${image.id} (producto ${image.product_id})`);
            
            // Descargar
            const buffer = await downloadImage(image.image_url);
            if (!buffer) {
                failed++;
                continue;
            }
            
            // Subir a Vercel
            const timestamp = Date.now();
            const fileName = `products/product_${image.product_id}_${image.id}_${timestamp}.jpg`;
            const newUrl = await uploadToVercel(buffer, fileName);
            if (!newUrl) {
                failed++;
                continue;
            }
            
            // Intentar actualizar
            console.log(`  📝 Actualizando: ${image.image_url.substring(0, 60)}...`);
            console.log(`  ➡️ A: ${newUrl.substring(0, 60)}...`);
            
            const updated = await updateWithSQL(image.id, newUrl);
            
            if (updated) {
                success++;
                console.log(`  ✅ Imagen ${image.id} actualizada`);
            } else {
                failed++;
                console.log(`  ❌ Imagen ${image.id} falló`);
            }
            
        } catch (error) {
            console.error(`❌ Error procesando ${image.id}:`, error.message);
            failed++;
        }
    }
    
    console.log(`\n📊 RESULTADOS:`);
    console.log(`   ✅ Exitosas: ${success}`);
    console.log(`   ❌ Fallidas: ${failed}`);
    
    if (success > 0) {
        console.log(`\n🎉 ¡Algunas imágenes se actualizaron!`);
        console.log(`📝 Para las demás, necesitarás permisos de admin en Supabase`);
    } else {
        console.log(`\n⚠️  Ninguna imagen se actualizó`);
        console.log(`🔑 Necesitas SERVICE ROLE key o desactivar RLS`);
    }
}

main().catch(console.error);
