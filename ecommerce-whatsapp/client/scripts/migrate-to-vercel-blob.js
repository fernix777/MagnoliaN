/**
 * Script de Migración Segura: Supabase → Vercel Blob
 * 
 * ✅ COPIA las imágenes a Vercel Blob
 * ✅ MANTIENE todo en Supabase como respaldo
 * ✅ ACTUALIZA URLs en la base de datos
 * ✅ VERIFICA que todo funcione
 * 
 * Uso: node scripts/migrate-to-vercel-blob.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { put } from '@vercel/blob';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Supabase
const supabaseUrl = 'https://prymijhlpoeqhihztuwl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeW1pamhscG9lcWhpaHp0dXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mzk3MDUsImV4cCI6MjA3OTIxNTcwNX0.xn29dwZNae71amG8Y_2RgE3ZPCbCqrTzKSFBNxDARgk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Configuración de Vercel Blob
const BLOB_TOKEN = 'vercel_blob_rw_Jxkj6FeScURdG6UL_sN4ofM9Lt2tqYjP32gEvy7AmENk6pw';

// Estadísticas
const stats = {
    banners: { total: 0, migrated: 0, errors: 0 },
    products: { total: 0, migrated: 0, errors: 0 },
    categories: { total: 0, migrated: 0, errors: 0 },
    startTime: new Date(),
    endTime: null
};

// Función para extraer path de URL de Supabase
function extractSupabasePath(url) {
    if (!url || !url.includes('supabase.co')) return null;
    
    try {
        const urlObj = new URL(url);
        // Ej: /storage/v1/object/public/banners/banner.jpg
        return urlObj.pathname;
    } catch (error) {
        console.error('Error extrayendo path de URL:', error);
        return null;
    }
}

// Función para generar nuevo nombre de archivo
function generateNewFileName(originalPath, prefix = '') {
    if (!originalPath) return null;
    
    // Extraer nombre y extensión
    const parts = originalPath.split('/');
    const fileName = parts[parts.length - 1];
    const [name, ext] = fileName.split('.');
    
    // Generar nombre único con timestamp
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    
    return `${prefix}${name}_${timestamp}_${random}.${ext}`;
}

// Función para descargar imagen de Supabase
async function downloadImage(supabasePath) {
    try {
        console.log(`  📥 Descargando: ${supabasePath}`);
        
        const { data, error } = await supabase.storage
            .from('public')
            .download(supabasePath.replace('/storage/v1/object/public/', ''));
        
        if (error) {
            console.error(`  ❌ Error descargando ${supabasePath}:`, error.message);
            return null;
        }
        
        return data;
    } catch (error) {
        console.error(`  ❌ Error en downloadImage:`, error.message);
        return null;
    }
}

// Función para subir a Vercel Blob
async function uploadToVercelBlob(imageData, fileName, folder) {
    try {
        console.log(`  📤 Subiendo a Vercel: ${folder}/${fileName}`);
        
        const blob = await put(`${folder}/${fileName}`, imageData, {
            access: 'public',
            token: BLOB_TOKEN
        });
        
        console.log(`  ✅ Subido exitosamente: ${blob.url}`);
        return blob.url;
    } catch (error) {
        console.error(`  ❌ Error subiendo a Vercel:`, error.message);
        return null;
    }
}

// Función para actualizar URL en base de datos
async function updateUrlInDatabase(table, id, column, newUrl) {
    try {
        console.log(`  🔄 Actualizando ${table}[${id}}.${column}`);
        
        const { error } = await supabase
            .from(table)
            .update({ [column]: newUrl })
            .eq('id', id);
        
        if (error) {
            console.error(`  ❌ Error actualizando ${table}:`, error.message);
            return false;
        }
        
        console.log(`  ✅ Actualizado exitosamente`);
        return true;
    } catch (error) {
        console.error(`  ❌ Error en updateUrlInDatabase:`, error.message);
        return false;
    }
}

// Función para verificar que la nueva URL funcione
async function verifyNewUrl(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.error(`  ❌ Error verificando URL ${url}:`, error.message);
        return false;
    }
}

// Migrar banners
async function migrateBanners() {
    console.log('\n🎯 Migrando BANNERS...');
    
    try {
        const { data: banners, error } = await supabase
            .from('banners')
            .select('id, image_url, title');
        
        if (error) {
            console.error('❌ Error obteniendo banners:', error.message);
            return;
        }
        
        stats.banners.total = banners.length;
        console.log(`📊 Encontrados ${banners.length} banners`);
        
        for (const banner of banners) {
            if (!banner.image_url || !banner.image_url.includes('supabase.co')) {
                console.log(`  ⏭️  Banner ${banner.id} ya está migrado o no tiene imagen`);
                continue;
            }
            
            const supabasePath = extractSupabasePath(banner.image_url);
            if (!supabasePath) {
                console.log(`  ❌ No se pudo extraer path del banner ${banner.id}`);
                stats.banners.errors++;
                continue;
            }
            
            // Descargar de Supabase
            const imageData = await downloadImage(supabasePath);
            if (!imageData) {
                stats.banners.errors++;
                continue;
            }
            
            // Generar nuevo nombre
            const newFileName = generateNewFileName(supabasePath, 'banner_');
            
            // Subir a Vercel Blob
            const newUrl = await uploadToVercelBlob(imageData, newFileName, 'banners');
            if (!newUrl) {
                stats.banners.errors++;
                continue;
            }
            
            // Verificar que funcione
            const isValid = await verifyNewUrl(newUrl);
            if (!isValid) {
                console.log(`  ❌ Nueva URL no es válida: ${newUrl}`);
                stats.banners.errors++;
                continue;
            }
            
            // Actualizar base de datos
            const updated = await updateUrlInDatabase('banners', banner.id, 'image_url', newUrl);
            if (updated) {
                stats.banners.migrated++;
                console.log(`  ✅ Banner ${banner.id} migrado exitosamente`);
            } else {
                stats.banners.errors++;
            }
            
            // Pequeña pausa para no sobrecargar
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
    } catch (error) {
        console.error('❌ Error en migrateBanners:', error.message);
    }
}

// Migrar imágenes de productos
async function migrateProductImages() {
    console.log('\n🎯 Migrando IMÁGENES DE PRODUCTOS...');
    
    try {
        const { data: images, error } = await supabase
            .from('product_images')
            .select('id, image_url, product_id');
        
        if (error) {
            console.error('❌ Error obteniendo imágenes de productos:', error.message);
            return;
        }
        
        stats.products.total = images.length;
        console.log(`📊 Encontradas ${images.length} imágenes de productos`);
        
        for (const image of images) {
            if (!image.image_url || !image.image_url.includes('supabase.co')) {
                console.log(`  ⏭️  Imagen ${image.id} ya está migrada o no tiene URL`);
                continue;
            }
            
            const supabasePath = extractSupabasePath(image.image_url);
            if (!supabasePath) {
                console.log(`  ❌ No se pudo extraer path de imagen ${image.id}`);
                stats.products.errors++;
                continue;
            }
            
            // Descargar de Supabase
            const imageData = await downloadImage(supabasePath);
            if (!imageData) {
                stats.products.errors++;
                continue;
            }
            
            // Generar nuevo nombre
            const newFileName = generateNewFileName(supabasePath, `product_${image.product_id}_`);
            
            // Subir a Vercel Blob
            const newUrl = await uploadToVercelBlob(imageData, newFileName, 'products');
            if (!newUrl) {
                stats.products.errors++;
                continue;
            }
            
            // Verificar que funcione
            const isValid = await verifyNewUrl(newUrl);
            if (!isValid) {
                console.log(`  ❌ Nueva URL no es válida: ${newUrl}`);
                stats.products.errors++;
                continue;
            }
            
            // Actualizar base de datos
            const updated = await updateUrlInDatabase('product_images', image.id, 'image_url', newUrl);
            if (updated) {
                stats.products.migrated++;
                console.log(`  ✅ Imagen ${image.id} (producto ${image.product_id}) migrada`);
            } else {
                stats.products.errors++;
            }
            
            // Pequeña pausa
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
    } catch (error) {
        console.error('❌ Error en migrateProductImages:', error.message);
    }
}

// Migrar categorías
async function migrateCategories() {
    console.log('\n🎯 Migrando CATEGORÍAS...');
    
    try {
        const { data: categories, error } = await supabase
            .from('categories')
            .select('id, image_url, name');
        
        if (error) {
            console.error('❌ Error obteniendo categorías:', error.message);
            return;
        }
        
        stats.categories.total = categories.length;
        console.log(`📊 Encontradas ${categories.length} categorías`);
        
        for (const category of categories) {
            if (!category.image_url || !category.image_url.includes('supabase.co')) {
                console.log(`  ⏭️  Categoría ${category.id} ya está migrada o no tiene imagen`);
                continue;
            }
            
            const supabasePath = extractSupabasePath(category.image_url);
            if (!supabasePath) {
                console.log(`  ❌ No se pudo extraer path de categoría ${category.id}`);
                stats.categories.errors++;
                continue;
            }
            
            // Descargar de Supabase
            const imageData = await downloadImage(supabasePath);
            if (!imageData) {
                stats.categories.errors++;
                continue;
            }
            
            // Generar nuevo nombre
            const newFileName = generateNewFileName(supabasePath, `category_${category.name}_`);
            
            // Subir a Vercel Blob
            const newUrl = await uploadToVercelBlob(imageData, newFileName, 'categories');
            if (!newUrl) {
                stats.categories.errors++;
                continue;
            }
            
            // Verificar que funcione
            const isValid = await verifyNewUrl(newUrl);
            if (!isValid) {
                console.log(`  ❌ Nueva URL no es válida: ${newUrl}`);
                stats.categories.errors++;
                continue;
            }
            
            // Actualizar base de datos
            const updated = await updateUrlInDatabase('categories', category.id, 'image_url', newUrl);
            if (updated) {
                stats.categories.migrated++;
                console.log(`  ✅ Categoría ${category.id} (${category.name}) migrada`);
            } else {
                stats.categories.errors++;
            }
            
            // Pequeña pausa
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
    } catch (error) {
        console.error('❌ Error en migrateCategories:', error.message);
    }
}

// Función principal
async function migrateToVercelBlob() {
    console.log('🚀 Iniciando Migración Segura: Supabase → Vercel Blob');
    console.log('⏰ Hora de inicio:', stats.startTime.toISOString());
    console.log('📋 Modo: COPIA SEGURA (Supabase se mantiene como respaldo)');
    
    try {
        // Verificar conexión con Vercel Blob
        console.log('\n🔍 Verificando conexión con Vercel Blob...');
        const testFile = new File(['test'], 'migration-test.txt', { type: 'text/plain' });
        const testBlob = await put('migration/test.txt', testFile, {
            access: 'public',
            token: BLOB_TOKEN
        });
        
        if (testBlob.url) {
            console.log('✅ Conexión con Vercel Blob verificada');
        } else {
            throw new Error('No se pudo conectar con Vercel Blob');
        }
        
        // Ejecutar migraciones en orden
        await migrateBanners();
        await migrateProductImages();
        await migrateCategories();
        
        // Estadísticas finales
        stats.endTime = new Date();
        const duration = stats.endTime - stats.startTime;
        
        console.log('\n📊 === RESUMEN DE MIGRACIÓN ===');
        console.log(`⏰ Tiempo total: ${(duration / 1000).toFixed(2)} segundos`);
        console.log('');
        
        console.log('🎯 BANNERS:');
        console.log(`   Total: ${stats.banners.total}`);
        console.log(`   Migrados: ${stats.banners.migrated}`);
        console.log(`   Errores: ${stats.banners.errors}`);
        console.log('');
        
        console.log('🎯 PRODUCTOS:');
        console.log(`   Total: ${stats.products.total}`);
        console.log(`   Migrados: ${stats.products.migrated}`);
        console.log(`   Errores: ${stats.products.errors}`);
        console.log('');
        
        console.log('🎯 CATEGORÍAS:');
        console.log(`   Total: ${stats.categories.total}`);
        console.log(`   Migrados: ${stats.categories.migrated}`);
        console.log(`   Errores: ${stats.categories.errors}`);
        console.log('');
        
        const totalMigrated = stats.banners.migrated + stats.products.migrated + stats.categories.migrated;
        const totalErrors = stats.banners.errors + stats.products.errors + stats.categories.errors;
        const totalProcessed = totalMigrated + totalErrors;
        
        console.log('🏆 TOTALES:');
        console.log(`   Procesadas: ${totalProcessed}`);
        console.log(`   Migradas: ${totalMigrated}`);
        console.log(`   Errores: ${totalErrors}`);
        console.log(`   Éxito: ${((totalMigrated / totalProcessed) * 100).toFixed(2)}%`);
        console.log('');
        
        if (totalErrors > 0) {
            console.log('⚠️  Hubo errores. Revisa los logs arriba para más detalles.');
        }
        
        if (totalMigrated > 0) {
            console.log('✅ ¡Migración completada exitosamente!');
            console.log('🔄 Supabase se mantiene como respaldo.');
            console.log('🌐 Las imágenes ahora sirven desde Vercel Blob CDN.');
        }
        
        // Generar feed actualizado
        console.log('\n🔄 Generando feed XML actualizado...');
        const { execSync } = await import('child_process');
        try {
            execSync('node scripts/generate-feed.js', { stdio: 'inherit' });
            console.log('✅ Feed XML actualizado con nuevas URLs');
        } catch (error) {
            console.log('⚠️  Error generando feed:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Error fatal en la migración:', error.message);
        process.exit(1);
    }
}

// Ejecutar migración
migrateToVercelBlob().catch(console.error);
