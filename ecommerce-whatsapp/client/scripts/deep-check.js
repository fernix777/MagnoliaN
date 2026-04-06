/**
 * Verificación directa de URLs en la base de datos
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://prymijhlpoeqhihztuwl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeW1pamhscG9lcWhpaHp0dXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mzk3MDUsImV4cCI6MjA3OTIxNTcwNX0.xn29dwZNae71amG8Y_2RgE3ZPCbCqrTzKSFBNxDARgk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSpecificImage() {
    console.log('🔍 Verificando imagen específica del producto 177...\n');
    
    // Verificar imagen específica que sabemos que existe
    const { data: images, error } = await supabase
        .from('product_images')
        .select('id, product_id, image_url')
        .eq('product_id', 177)
        .limit(5);
    
    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }
    
    console.log('📊 Imágenes del producto 177:');
    images.forEach((img, index) => {
        const isVercel = img.image_url.includes('blob.vercel-storage.com');
        const isSupabase = img.image_url.includes('supabase.co');
        const status = isVercel ? '✅ Vercel' : isSupabase ? '❌ Supabase' : '❓ Otro';
        
        console.log(`  ${index + 1}. ID: ${img.id}`);
        console.log(`     ${status}: ${img.image_url}`);
        console.log('');
    });
    
    // Contar todas las imágenes de productos
    const { count: totalImages } = await supabase
        .from('product_images')
        .select('*', { count: 'exact', head: true });
    
    const { count: vercelImages } = await supabase
        .from('product_images')
        .select('*', { count: 'exact', head: true })
        .like('image_url', '%blob.vercel-storage.com%');
    
    const { count: supabaseImages } = await supabase
        .from('product_images')
        .select('*', { count: 'exact', head: true })
        .like('image_url', '%supabase.co%');
    
    console.log('📊 ESTADÍSTICAS GLOBALES:');
    console.log(`   Total imágenes: ${totalImages}`);
    console.log(`   En Vercel: ${vercelImages}`);
    console.log(`   En Supabase: ${supabaseImages}`);
    console.log(`   % Migradas: ${((vercelImages / totalImages) * 100).toFixed(2)}%`);
    
    // Verificar una imagen que debería estar en Vercel
    const { data: testImage } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('id', 483)
        .single();
    
    if (testImage) {
        console.log('\n🧪 TEST - Imagen 483:');
        console.log(`   URL: ${testImage.image_url}`);
        console.log(`   Es Vercel: ${testImage.image_url.includes('blob.vercel-storage.com') ? '✅' : '❌'}`);
    }
}

checkSpecificImage().catch(console.error);
