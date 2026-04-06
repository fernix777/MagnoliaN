/**
 * Script para verificar el estado de la migración
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://prymijhlpoeqhihztuwl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeW1pamhscG9lcWhpaHp0dXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mzk3MDUsImV4cCI6MjA3OTIxNTcwNX0.xn29dwZNae71amG8Y_2RgE3ZPCbCqrTzKSFBNxDARgk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkMigrationStatus() {
    console.log('🔍 Verificando estado de la migración...\n');
    
    // Verificar banners
    console.log('🎯 BANNERS:');
    const { data: banners, error: bannerError } = await supabase
        .from('banners')
        .select('id, title, image_url')
        .limit(3);
    
    if (bannerError) {
        console.error('❌ Error banners:', bannerError.message);
    } else {
        banners.forEach(banner => {
            const isVercel = banner.image_url.includes('blob.vercel-storage.com');
            const status = isVercel ? '✅' : '❌';
            console.log(`  ${status} Banner ${banner.id}: ${banner.image_url.substring(0, 80)}...`);
        });
    }
    
    // Verificar productos
    console.log('\n🎯 PRODUCTOS:');
    const { data: products, error: productError } = await supabase
        .from('product_images')
        .select('id, product_id, image_url')
        .limit(3);
    
    if (productError) {
        console.error('❌ Error productos:', productError.message);
    } else {
        products.forEach(product => {
            const isVercel = product.image_url.includes('blob.vercel-storage.com');
            const status = isVercel ? '✅' : '❌';
            console.log(`  ${status} Producto ${product.product_id} - Imagen ${product.id}: ${product.image_url.substring(0, 80)}...`);
        });
    }
    
    // Verificar categorías
    console.log('\n🎯 CATEGORÍAS:');
    const { data: categories, error: categoryError } = await supabase
        .from('categories')
        .select('id, name, image_url')
        .limit(3);
    
    if (categoryError) {
        console.error('❌ Error categorías:', categoryError.message);
    } else {
        categories.forEach(category => {
            if (!category.image_url) {
                console.log(`  ⏭️  Categoría ${category.id}: Sin imagen`);
                return;
            }
            const isVercel = category.image_url.includes('blob.vercel-storage.com');
            const status = isVercel ? '✅' : '❌';
            console.log(`  ${status} Categoría ${category.id} (${category.name}): ${category.image_url.substring(0, 80)}...`);
        });
    }
    
    // Contar totales
    console.log('\n📊 CONTANDO TOTALES:');
    
    const { count: bannersCount } = await supabase
        .from('banners')
        .select('*', { count: 'exact', head: true })
        .like('image_url', '%blob.vercel-storage.com%');
    
    const { count: productsCount } = await supabase
        .from('product_images')
        .select('*', { count: 'exact', head: true })
        .like('image_url', '%blob.vercel-storage.com%');
    
    const { count: categoriesCount } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .like('image_url', '%blob.vercel-storage.com%');
    
    console.log(`  ✅ Banners migrados: ${bannersCount}`);
    console.log(`  ✅ Productos migrados: ${productsCount}`);
    console.log(`  ✅ Categorías migradas: ${categoriesCount}`);
    
    console.log('\n🎯 Si ves ✅ en todos, la migración fue exitosa.');
    console.log('📝 Si ves ❌, las URLs no se actualizaron correctamente.');
}

checkMigrationStatus().catch(console.error);
