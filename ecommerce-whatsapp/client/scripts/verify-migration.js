import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dsovrmquhgkquqsvkptc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3ZybXF1aGdrcXVxc3ZrcHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzcyNTIsImV4cCI6MjA5MTUxMzI1Mn0.BYHmFiUuuvZaAUNXINKiqSt4TMYoSDQUFd_HyDx-H7A';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Verificar URLs de imágenes
const { data: images } = await supabase
    .from('product_images')
    .select('image_url')
    .limit(5);

console.log('=== URLs de Imágenes ===');
(images || []).forEach((img, i) => {
    console.log(`${i + 1}. ${img.image_url.substring(0, 80)}...`);
});

// Verificar que sean de Supabase Storage
const supabaseUrls = (images || []).filter(img => 
    img.image_url.includes('supabase.co/storage/v1/object/public/')
);

console.log('\n=== Resultado ===');
console.log('Total verificadas:', images?.length || 0);
console.log('URLs de Supabase Storage:', supabaseUrls.length);
console.log('✅ Todas migrating:' , supabaseUrls.length === (images?.length || 0) ? 'OK' : 'ERROR');