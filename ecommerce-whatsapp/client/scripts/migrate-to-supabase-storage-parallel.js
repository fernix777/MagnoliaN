/**
 * Script de Migración: Vercel Blob → Supabase Storage (PARALELO)
 *
 * Procesa imágenes en paralelo para acelerar migración
 *
 * Uso: cd client && node scripts/migrate-to-supabase-storage-parallel.js
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.production') });

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: Faltan credenciales en .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

const stats = { migrated: 0, errors: 0, skipped: 0, total: 0 };

function isVercelBlobUrl(url) {
    return url && (url.includes('blob.vercel-storage.com') || url.includes('.vercel.app/'));
}

function generateFileName(prefix, id, ext) {
    return `${prefix}_${id}_${Date.now()}.${ext}`;
}

async function downloadImage(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        return null;
    }
}

async function uploadToSupabase(buffer, bucket, fileName) {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, buffer, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' });
        
        if (error) throw error;
        
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return urlData.publicUrl;
    } catch (error) {
        return null;
    }
}

async function processImage(img) {
    const oldUrl = img.image_url;
    if (!isVercelBlobUrl(oldUrl)) {
        stats.skipped++;
        return;
    }
    
    const buffer = await downloadImage(oldUrl);
    if (!buffer) {
        stats.errors++;
        return;
    }
    
    const ext = oldUrl.split('.').pop().split('?')[0] || 'jpg';
    const newName = generateFileName('p' + img.product_id, img.id, ext);
    
    const newUrl = await uploadToSupabase(buffer, 'product-images', newName);
    if (!newUrl) {
        stats.errors++;
        return;
    }
    
    await supabase.from('product_images').update({ image_url: newUrl }).eq('id', img.id);
    stats.migrated++;
    
    if (stats.migrated % 20 === 0) {
        console.log(`  📊 Progresando: ${stats.migrated}/${stats.total}`);
    }
}

async function main() {
    console.log('🚀 Migración PARALELA: Vercel Blob → Supabase Storage');
    console.log('Started:', new Date());
    
    // Obtener imágenes pendientes
    const { data: images } = await supabase
        .from('product_images')
        .select('id, image_url, product_id')
        .not('image_url', 'is', null);
    
    stats.total = images?.length || 0;
    console.log(`Encontradas: ${stats.total} imágenes`);
    
    // Filtrar solo las de Vercel Blob
    const pending = (images || []).filter(img => isVercelBlobUrl(img.image_url));
    console.log('Por migrar:', pending.length);
    
    // Procesar en batches de 5 en paralelo
    const batchSize = 5;
    for (let i = 0; i < pending.length; i += batchSize) {
        const batch = pending.slice(i, i + batchSize);
        await Promise.all(batch.map(processImage));
        
        console.log(`  📊 Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(pending.length/batchSize)} - Migrados: ${stats.migrated}`);
    }
    
    console.log('\n========================================');
    console.log('========== RESUMEN ==========');
    console.log('Total migrados:', stats.migrated);
    console.log('Total skippeados:', stats.skipped);
    console.log('Total errores:', stats.errors);
    console.log('========================================');
}

main().catch(console.error);