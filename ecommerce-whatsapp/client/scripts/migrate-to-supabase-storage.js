/**
 * Script de Migración: Vercel Blob → Supabase Storage
 *
 * COPIA las imágenes de Vercel Blob a Supabase Storage
 * ACTUALIZA las URLs en la base de datos
 *
 * Uso: cd client && node scripts/migrate-to-supabase-storage.js
 *
 * IMPORTANTE: Antes de ejecutar:
 * 1. Crear los buckets en Supabase Storage: product-images, banners, category-images
 * 2. Configurar políticas RLS para acceso público
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno (usa .env si existe, sino .env.production)
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.production') });

// Configuración Supabase desde variables de entorno
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: Faltan credenciales en .env');
  console.error('Configura VITE_SUPABASE_URL y VITE_SUPABASE_SERVICE_ROLE_KEY en client/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

console.log('=== Config ===');
console.log('Supabase URL:', SUPABASE_URL);
console.log('Service Key:', SUPABASE_SERVICE_KEY.substring(0, 20) + '...');

// Estadísticas
const stats = {
    banners: { total: 0, migrated: 0, errors: 0, skipped: 0 },
    productImages: { total: 0, migrated: 0, errors: 0, skipped: 0 },
    categories: { total: 0, migrated: 0, errors: 0, skipped: 0 },
    startTime: new Date()
};

/**
 * Descarga imagen de URL pública
 */
async function downloadImage(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error(`  ❌ Error descargando: ${error.message}`);
        return null;
    }
}

/**
 * Sube imagen a Supabase Storage
 */
async function uploadToSupabase(buffer, bucket, fileName) {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, buffer, {
                cacheControl: '3600',
                upsert: false,
                contentType: 'image/jpeg'
            });
        
        if (error) throw error;
        
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return urlData.publicUrl;
    } catch (error) {
        console.error(`  ❌ Error subiendo: ${error.message}`);
        return null;
    }
}

/**
 * Verifica si es URL de Vercel Blob
 */
function isVercelBlobUrl(url) {
    return url && (url.includes('blob.vercel-storage.com') || url.includes('.vercel.app/'));
}

/**
 * Genera nombre de archivo único
 */
function generateFileName(prefix, id, ext) {
    return `${prefix}_${id}_${Date.now()}.${ext}`;
}

/**
 * Migra banners
 */
async function migrateBanners() {
    console.log('\n=== Migrando Banners ===');
    
    const { data: banners, error } = await supabase
        .from('banners')
        .select('id, image_url')
        .not('image_url', 'is', null);
    
    if (error) {
        console.error('❌ Error fetching banners:', error);
        return;
    }
    
    stats.banners.total = banners?.length || 0;
    console.log(`Encontrados: ${stats.banners.total} banners`);
    
    for (const banner of banners || []) {
        const oldUrl = banner.image_url;
        
        if (!isVercelBlobUrl(oldUrl)) {
            console.log(`  ⏭️ Saltando (no es Vercel Blob): ${banner.id}`);
            stats.banners.skipped++;
            continue;
        }
        
        console.log(`  📥 Procesando banner ${banner.id}...`);
        
        const buffer = await downloadImage(oldUrl);
        if (!buffer) {
            stats.banners.errors++;
            continue;
        }
        
        const ext = oldUrl.split('.').pop().split('?')[0];
        const newName = generateFileName('banner', banner.id, ext);
        
        const newUrl = await uploadToSupabase(buffer, 'banners', newName);
        if (!newUrl) {
            stats.banners.errors++;
            continue;
        }
        
        await supabase.from('banners').update({ image_url: newUrl }).eq('id', banner.id);
        
        stats.banners.migrated++;
        console.log(`  ✅ Migrado`);
    }
    
    console.log(`\n📊 Banners: ${stats.banners.migrated}/${stats.banners.total} migrados, ${stats.banners.skipped}skippeados, ${stats.banners.errors} errores`);
}

/**
 * Migra imágenes de productos
 */
async function migrateProductImages() {
    console.log('\n=== Migrando Imágenes de Productos ===');
    
    const { data: images, error } = await supabase
        .from('product_images')
        .select('id, image_url, product_id')
        .not('image_url', 'is', null);
    
    if (error) {
        console.error('❌ Error fetching images:', error);
        return;
    }
    
    stats.productImages.total = images?.length || 0;
    console.log(`Encontradas: ${stats.productImages.total} imágenes`);
    
    for (const img of images || []) {
        const oldUrl = img.image_url;
        
        if (!isVercelBlobUrl(oldUrl)) {
            stats.productImages.skipped++;
            continue;
        }
        
        console.log(`  📥 Procesando imagen ${img.id} (product ${img.product_id})...`);
        
        const buffer = await downloadImage(oldUrl);
        if (!buffer) {
            stats.productImages.errors++;
            continue;
        }
        
        const ext = oldUrl.split('.').pop().split('?')[0];
        const newName = generateFileName('p' + img.product_id, img.id, ext);
        
        const newUrl = await uploadToSupabase(buffer, 'product-images', newName);
        if (!newUrl) {
            stats.productImages.errors++;
            continue;
        }
        
        await supabase.from('product_images').update({ image_url: newUrl }).eq('id', img.id);
        
        stats.productImages.migrated++;
    }
    
    console.log(`\n📊 Imágenes: ${stats.productImages.migrated}/${stats.productImages.total} migradas, ${stats.productImages.skipped} skippeadas, ${stats.productImages.errors} errores`);
}

/**
 * Migra categorías
 */
async function migrateCategories() {
    console.log('\n=== Migrando Categorías ===');
    
    const { data: categories, error } = await supabase
        .from('categories')
        .select('id, image_url')
        .not('image_url', 'is', null);
    
    if (error) {
        console.error('❌ Error fetching categories:', error);
        return;
    }
    
    stats.categories.total = categories?.length || 0;
    console.log(`Encontradas: ${stats.categories.total} categorías`);
    
    for (const cat of categories || []) {
        const oldUrl = cat.image_url;
        
        if (!isVercelBlobUrl(oldUrl)) {
            stats.categories.skipped++;
            continue;
        }
        
        console.log(`  📥 Procesando categoría ${cat.id}...`);
        
        const buffer = await downloadImage(oldUrl);
        if (!buffer) {
            stats.categories.errors++;
            continue;
        }
        
        const ext = oldUrl.split('.').pop().split('?')[0];
        const newName = generateFileName('cat', cat.id, ext);
        
        const newUrl = await uploadToSupabase(buffer, 'category-images', newName);
        if (!newUrl) {
            stats.categories.errors++;
            continue;
        }
        
        await supabase.from('categories').update({ image_url: newUrl }).eq('id', cat.id);
        
        stats.categories.migrated++;
    }
    
    console.log(`\n📊 Categorías: ${stats.categories.migrated}/${stats.categories.total} migradas, ${stats.categories.skipped} skippeadas, ${stats.categories.errors} errores`);
}

/**
 * MAIN
 */
async function main() {
    console.log('🚀 Iniciando migración: Vercel Blob → Supabase Storage');
    console.log('Started:', stats.startTime);
    
    try {
        await migrateBanners();
        await migrateCategories();
        await migrateProductImages();
        
        const totalMigrated = stats.banners.migrated + stats.productImages.migrated + stats.categories.migrated;
        const totalErrors = stats.banners.errors + stats.productImages.errors + stats.categories.errors;
        const skipped = stats.banners.skipped + stats.productImages.skipped + stats.categories.skipped;
        
        console.log('\n========================================');
        console.log('========== RESUMEN ==========');
        console.log('Total migrados:', totalMigrated);
        console.log('Total skipped:', skipped);
        console.log('Total errores:', totalErrors);
        console.log('Duración:', (new Date() - stats.startTime) / 1000, 'segundos');
        console.log('========================================');
        
        if (totalErrors > 0) {
            console.log('\n⚠️ Revisa los errores arriba antes de reintentar.');
        }
        
    } catch (error) {
        console.error('❌ Error en migración:', error);
    }
}

main();