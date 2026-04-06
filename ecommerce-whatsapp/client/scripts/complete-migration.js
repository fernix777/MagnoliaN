/**
 * Script COMPLETO de migración con SERVICE ROLE KEY
 * Migrará todas las imágenes restantes
 */

import { createClient } from '@supabase/supabase-js';
import { put } from '@vercel/blob';

const supabaseUrl = 'https://prymijhlpoeqhihztuwl.supabase.co';
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

async function migrateAllProductImages() {
    console.log('🚀 MIGRANDO TODAS las imágenes de productos...\n');
    
    // Obtener TODAS las imágenes que necesitan migración
    const { data: images, error } = await supabase
        .from('product_images')
        .select('id, product_id, image_url')
        .like('image_url', '%supabase.co%');
    
    if (error) {
        console.error('❌ Error obteniendo imágenes:', error.message);
        return;
    }
    
    console.log(`📊 Encontradas ${images.length} imágenes por migrar`);
    
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        try {
            console.log(`🔄 [${i + 1}/${images.length}] Imagen ${image.id} (producto ${image.product_id})`);
            
            // Descargar desde Supabase
            const buffer = await downloadImage(image.image_url);
            if (!buffer) {
                failed++;
                continue;
            }
            
            // Subir a Vercel
            const timestamp = Date.now();
            const random = Math.random().toString(36).substr(2, 9);
            const fileName = `products/product_${image.product_id}_${image.id}_${timestamp}_${random}.jpg`;
            const newUrl = await uploadToVercel(buffer, fileName);
            if (!newUrl) {
                failed++;
                continue;
            }
            
            // Actualizar base de datos
            const { error: updateError } = await supabase
                .from('product_images')
                .update({ image_url: newUrl })
                .eq('id', image.id);
            
            if (updateError) {
                console.error(`  ❌ Error actualizando ${image.id}:`, updateError.message);
                failed++;
                continue;
            }
            
            success++;
            console.log(`  ✅ Imagen ${image.id} migrada exitosamente`);
            
            // Pequeña pausa para no sobrecargar
            if (i % 10 === 0) {
                console.log(`  ⏸️  Pausa (${success + failed}/${images.length} procesadas)`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
        } catch (error) {
            console.error(`❌ Error procesando ${image.id}:`, error.message);
            failed++;
        }
    }
    
    console.log(`\n📊 RESULTADOS FINALES:`);
    console.log(`   ✅ Migradas: ${success}`);
    console.log(`   ❌ Fallidas: ${failed}`);
    console.log(`   📊 Total: ${images.length}`);
    console.log(`   🎯 Éxito: ${((success / images.length) * 100).toFixed(2)}%`);
    
    return { success, failed, total: images.length };
}

async function migrateAllCategories() {
    console.log('\n🏷️ MIGRANDO categorías...\n');
    
    const { data: categories, error } = await supabase
        .from('categories')
        .select('id, name, image_url')
        .like('image_url', '%supabase.co%');
    
    if (error) {
        console.error('❌ Error obteniendo categorías:', error.message);
        return;
    }
    
    console.log(`📊 Encontradas ${categories.length} categorías por migrar`);
    
    let success = 0;
    let failed = 0;
    
    for (const category of categories) {
        try {
            console.log(`🔄 Categoría ${category.id} (${category.name})`);
            
            // Descargar desde Supabase
            const buffer = await downloadImage(category.image_url);
            if (!buffer) {
                failed++;
                continue;
            }
            
            // Subir a Vercel
            const timestamp = Date.now();
            const random = Math.random().toString(36).substr(2, 9);
            const safeName = category.name.replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `categories/category_${safeName}_${timestamp}_${random}.jpg`;
            const newUrl = await uploadToVercel(buffer, fileName);
            if (!newUrl) {
                failed++;
                continue;
            }
            
            // Actualizar base de datos
            const { error: updateError } = await supabase
                .from('categories')
                .update({ image_url: newUrl })
                .eq('id', category.id);
            
            if (updateError) {
                console.error(`  ❌ Error actualizando categoría ${category.id}:`, updateError.message);
                failed++;
                continue;
            }
            
            success++;
            console.log(`  ✅ Categoría ${category.id} migrada`);
            
        } catch (error) {
            console.error(`❌ Error procesando categoría ${category.id}:`, error.message);
            failed++;
        }
    }
    
    console.log(`\n📊 CATEGORÍAS:`);
    console.log(`   ✅ Migradas: ${success}`);
    console.log(`   ❌ Fallidas: ${failed}`);
    
    return { success, failed, total: categories.length };
}

async function main() {
    console.log('🎯 MIGRACIÓN COMPLETA CON SERVICE ROLE KEY');
    console.log('⏰ Inicio:', new Date().toISOString());
    console.log('🔑 Usando SERVICE ROLE key con permisos completos\n');
    
    // Migrar productos
    const productResults = await migrateAllProductImages();
    
    // Migrar categorías
    const categoryResults = await migrateAllCategories();
    
    // Resumen final
    console.log('\n🏆 === RESUMEN COMPLETO DE MIGRACIÓN ===');
    console.log(`🎯 PRODUCTOS: ${productResults.success}/${productResults.total} (${((productResults.success / productResults.total) * 100).toFixed(2)}%)`);
    console.log(`🏷️ CATEGORÍAS: ${categoryResults.success}/${categoryResults.total} (${((categoryResults.success / categoryResults.total) * 100).toFixed(2)}%)`);
    
    const totalSuccess = productResults.success + categoryResults.success;
    const totalProcessed = productResults.total + categoryResults.total;
    
    console.log(`\n🌟 TOTALES:`);
    console.log(`   ✅ Migradas: ${totalSuccess}`);
    console.log(`   📊 Total: ${totalProcessed}`);
    console.log(`   🎯 Éxito global: ${((totalSuccess / totalProcessed) * 100).toFixed(2)}%`);
    console.log(`   ⏰ Fin: ${new Date().toISOString()}`);
    
    if (totalSuccess > 0) {
        console.log('\n🎉 ¡MIGRACIÓN COMPLETADA!');
        console.log('🔄 Regenerando feed XML...');
        
        const { execSync } = await import('child_process');
        try {
            execSync('node scripts/generate-feed.js', { stdio: 'inherit' });
            console.log('✅ Feed XML actualizado con URLs de Vercel');
        } catch (error) {
            console.log('⚠️  Error regenerando feed:', error.message);
        }
        
        console.log('\n📋 PRÓXIMOS PASOS:');
        console.log('1. Verifica que el feed XML tenga URLs de Vercel');
        console.log('2. Testea el sitio web');
        console.log('3. Monitorea Meta/Facebook para actualización');
        console.log('4. Considera eliminar imágenes viejas de Supabase (backup)');
    }
}

main().catch(console.error);
