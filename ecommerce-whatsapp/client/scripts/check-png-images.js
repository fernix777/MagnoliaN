import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const feedPath = process.argv[2] || path.join(__dirname, '../public/feed.xml');

if (!fs.existsSync(feedPath)) {
  console.error(`✗ No se encontró el archivo: ${feedPath}`);
  console.error('  Uso: node scripts/check-png-images.js [ruta/al/feed.xml]');
  process.exit(1);
}

const xml = fs.readFileSync(feedPath, 'utf8');

const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

const problemProducts = [];
const warningProducts = [];

items.forEach(item => {
  const id = (item.match(/<g:id>(.*?)<\/g:id>/) || [])[1] || '?';
  const title = (item.match(/<g:title>(.*?)<\/g:title>/) || [])[1] || '?';
  const primary = (item.match(/<g:image_link>(.*?)<\/g:image_link>/) || [])[1] || '';
  const extras = [...item.matchAll(/<g:additional_image_link>(.*?)<\/g:additional_image_link>/g)]
    .map(m => m[1]);

  const allImages = [primary, ...extras].filter(Boolean);
  const isPng = url => /\.png$/i.test(url.split('?')[0] || '');
  const isJpg = url => /\.(jpe?g)$/i.test(url.split('?')[0] || '');

  const primaryIsPng = isPng(primary);
  const allArePng = allImages.length > 0 && allImages.every(isPng);
  const hasNoJpg = !allImages.some(isJpg);

  if (allArePng) {
    problemProducts.push({ id, title, primary, extras, reason: 'TODAS son .png' });
  } else if (primaryIsPng) {
    warningProducts.push({ id, title, primary, extras, reason: 'Principal es .png (tiene .jpg adicionales)' });
  } else if (hasNoJpg && allImages.length > 0) {
    // Si no hay ninguna .jpg pero tampoco todas son .png (podría haber .webp, etc.)
    warningProducts.push({ id, title, primary, extras, reason: 'Sin .jpg presentes (puede impactar en Meta)' });
  }
});

console.log('\n════════════════════════════════════════════════════');
console.log('      REPORTE DE IMÁGENES PNG EN EL CATÁLOGO');
console.log('════════════════════════════════════════════════════\n');

if (problemProducts.length === 0 && warningProducts.length === 0) {
  console.log('✅ ¡Todo bien! Ningún producto tiene problemas con imágenes PNG.\n');
  process.exit(0);
}

if (problemProducts.length > 0) {
  console.log(`🔴 CRÍTICO — ${problemProducts.length} producto(s) con TODAS las imágenes en .png:`);
  console.log('   (Meta muy probablemente los rechace)\n');
  problemProducts.forEach(p => {
    console.log(`  • ID ${p.id} — ${p.title}`);
    console.log(`    Principal : ${p.primary}`);
    if (p.extras.length > 0) {
      p.extras.forEach(e => console.log(`    Adicional : ${e}`));
    }
    console.log('');
  });
}

if (warningProducts.length > 0) {
  console.log(`🟡 ADVERTENCIA — ${warningProducts.length} producto(s) con imagen PRINCIPAL en .png o sin .jpg:`);
  console.log('   (Considera subir .jpg y/o ajustar el orden para que la principal sea .jpg)\n');
  warningProducts.forEach(p => {
    console.log(`  • ID ${p.id} — ${p.title}`);
    console.log(`    Principal : ${p.primary}`);
    p.extras.forEach(e => console.log(`    Adicional : ${e}`));
    console.log('');
  });
}

console.log('════════════════════════════════════════════════════');
console.log(`  Total críticos   : ${problemProducts.length}`);
console.log(`  Total advertencias: ${warningProducts.length}`);
console.log('════════════════════════════════════════════════════\n');

console.log('💡 SOLUCIÓN:');
console.log('   Para los productos 🔴 críticos: subí una versión .jpg en Supabase');
console.log('   y actualizá la imagen en tu base de datos.');
console.log('   Para los 🟡 advertencias: el feed ya prioriza .jpg como principal,');
console.log('   pero revisá el orden de las imágenes si persiste la principal en .png.\n');

