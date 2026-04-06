/**
 * Script de reparación para migración fallida
 * Corrige las URLs que no se actualizaron correctamente
 */

import { createClient } from '@supabase/supabase-js';
import { put } from '@vercel/blob';

const supabaseUrl = 'https://prymijhlpoeqhihztuwl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeW1pamhscG9lcWhpaHp0dXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mzk3MDUsImV4cCI6MjA3OTIxNTcwNX0.xn29dwZNae71amG8Y_2RgE3ZPCbCqrTzKSFBNxDARgk';
const BLOB_TOKEN = 'vercel_blob_rw_Jxkj6FeScURdG6UL_sN4ofM9Lt2tqYjP32gEvy7AmENk6pw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

async function repairProductImages() {
    console.log('🔧 Reparando imágenes de productos...');
    
    // Obtener todas las imágenes que todavía están en Supabase
    const { data: images, error } = await supabase
        .from('product_images')
        .select('id, product_id, image_url')
        .like('image_url', '%supabase.co%');
    
    if (error) {
        console.error('❌ Error obteniendo imágenes:', error.message);
        return;
    }
    
    console.log(`📊 Encontradas ${images.length} imágenes por reparar`);
    
    let repaired = 0;
    let errors = 0;
    
    for (const image of images) {
        try {
            console.log(`🔧 Reparando imagen ${image.id} (producto ${image.product_id})`);
            
            // Descargar desde Supabase
            const buffer = await downloadImage(image.image_url);
            if (!buffer) {
                errors++;
                continue;
            }
            
            // Generar nombre único
            const timestamp = Date.now();
            const random = Math.random().toString(36).substr(2, 9);
            const fileName = `products/product_${image.product_id}_${image.id}_${timestamp}_${random}.jpg`;
            
            // Subir a Vercel
            const newUrl = await uploadToVercel(buffer, fileName);
            if (!newUrl) {
                errors++;
                continue;
            }
            
            // Actualizar base de datos
            const { error: updateError } = await supabase
                .from('product_images')
                .update({ image_url: newUrl })
                .eq('id', image.id);
            
            if (updateError) {
                console.error(`❌ Error actualizando ${image.id}:`, updateError.message);
                errors++;
                continue;
            }
            
            repaired++;
            console.log(`✅ Imagen ${image.id} reparada`);
            
            // Pequeña pausa
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } catch (error) {
            console.error(`❌ Error reparando imagen ${image.id}:`, error.message);
            errors++;
        }
    }
    
    console.log(`📊 Productos reparados: ${repaired}, Errores: ${errors}`);
    return { repaired, errors };
}

async function repairCategories() {
    console.log('🔧 Reparando categorías...');
    
    // Obtener categorías que todavía están en Supabase
    const { data: categories, error } = await supabase
        .from('categories')
        .select('id, name, image_url')
        .like('image_url', '%supabase.co%');
    
    if (error) {
        console.error('❌ Error obteniendo categorías:', error.message);
        return;
    }
    
    console.log(`📊 Encontradas ${categories.length} categorías por reparar`);
    
    let repaired = 0;
    let errors = 0;
    
    for (const category of categories) {
        try {
            console.log(`🔧 Reparando categoría ${category.id} (${category.name})`);
            
            // Descargar desde Supabase
            const buffer = await downloadImage(category.image_url);
            if (!buffer) {
                errors++;
                continue;
            }
            
            // Generar nombre único
            const timestamp = Date.now();
            const random = Math.random().toString(36).substr(2, 9);
            const safeName = category.name.replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `categories/category_${safeName}_${timestamp}_${random}.jpg`;
            
            // Subir a Vercel
            const newUrl = await uploadToVercel(buffer, fileName);
            if (!newUrl) {
                errors++;
                continue;
            }
            
            // Actualizar base de datos
            const { error: updateError } = await supabase
                .from('categories')
                .update({ image_url: newUrl })
                .eq('id', category.id);
            
            if (updateError) {
                console.error(`❌ Error actualizando categoría ${category.id}:`, updateError.message);
                errors++;
                continue;
            }
            
            repaired++;
            console.log(`✅ Categoría ${category.id} reparada`);
            
            // Pequeña pausa
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } catch (error) {
            console.error(`❌ Error reparando categoría ${category.id}:`, error.message);
            errors++;
        }
    }
    
    console.log(`📊 Categorías reparadas: ${repaired}, Errores: ${errors}`);
    return { repaired, errors };
}

async function main() {
    console.log('🚀 Iniciando reparación de migración...\n');
    
    const productResults = await repairProductImages();
    console.log('');
    const categoryResults = await repairCategories();
    
    console.log('\n📊 === RESUMEN DE REPARACIÓN ===');
    console.log(`🎯 Productos reparados: ${productResults.repaired}`);
    console.log(`❌ Productos con errores: ${productResults.errors}`);
    console.log(`🎯 Categorías reparadas: ${categoryResults.repaired}`);
    console.log(`❌ Categorías con errores: ${categoryResults.errors}`);
    
    const totalRepaired = productResults.repaired + categoryResults.repaired;
    const totalErrors = productResults.errors + categoryResults.errors;
    
    console.log(`\n🏆 TOTALES:`);
    console.log(`   Reparados: ${totalRepaired}`);
    console.log(`   Errores: ${totalErrors}`);
    console.log(`   Éxito: ${((totalRepaired / (totalRepaired + totalErrors)) * 100).toFixed(2)}%`);
    
    if (totalRepaired > 0) {
        console.log('\n✅ ¡Reparación completada! Regenerando feed...');
        const { execSync } = await import('child_process');
        try {
            execSync('node scripts/generate-feed.js', { stdio: 'inherit' });
            console.log('✅ Feed XML regenerado con URLs de Vercel');
        } catch (error) {
            console.log('⚠️  Error regenerando feed:', error.message);
        }
    }
}

main().catch(console.error);
