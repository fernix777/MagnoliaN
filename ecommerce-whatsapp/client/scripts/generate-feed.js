import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar datos de productos desde Supabase o archivo local
// Para este ejemplo, usaremos datos de prueba
const products = [
    {
        id: 1,
        name: 'Producto Destacado 1',
        slug: 'producto-destacado-1',
        description: 'Descripción del primer producto destacado',
        price: 1999.99,
        image: 'https://www.magnolia-n.com/logo.jpg',
        category: 'Decoración'
    },
    {
        id: 2,
        name: 'Producto Destacado 2',
        slug: 'producto-destacado-2',
        description: 'Descripción del segundo producto destacado',
        price: 2499.99,
        image: 'https://www.magnolia-n.com/logo.jpg',
        category: 'Regalos'
    },
    {
        id: 3,
        name: 'Producto Destacado 3',
        slug: 'producto-destacado-3',
        description: 'Descripción del tercer producto destacado',
        price: 1799.99,
        image: 'https://www.magnolia-n.com/logo.jpg',
        category: 'Accesorios'
    }
];

function generateRSSFeed() {
    const now = new Date().toISOString();
    
    let itemsXml = '';
    
    products.forEach(product => {
        itemsXml += `
    <item>
        <title>${escapeXml(product.name)}</title>
        <link>https://www.magnolia-n.com/producto/${product.slug}</link>
        <description>${escapeXml(product.description)}</description>
        <category>${escapeXml(product.category)}</category>
        <price>${product.price.toFixed(2)}</price>
        <image>${product.image}</image>
        <pubDate>${now}</pubDate>
        <guid>https://www.magnolia-n.com/producto/${product.slug}</guid>
    </item>`;
    });

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
    <channel>
        <title>Magnolia Novedades - Productos</title>
        <link>https://www.magnolia-n.com</link>
        <description>Decoración y regalos únicos en San Salvador de Jujuy, Argentina</description>
        <language>es-ar</language>
        <lastBuildDate>${now}</lastBuildDate>
        <image>
            <url>https://www.magnolia-n.com/logo.jpg</url>
            <title>Magnolia Novedades</title>
            <link>https://www.magnolia-n.com</link>
        </image>
        ${itemsXml}
    </channel>
</rss>`;

    return rss;
}

function escapeXml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function saveFeed() {
    try {
        const feedContent = generateRSSFeed();
        const publicDir = path.join(__dirname, '../public');
        const feedPath = path.join(publicDir, 'feed.xml');

        // Crear directorio public si no existe
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        fs.writeFileSync(feedPath, feedContent, 'utf8');
        console.log('✓ Feed RSS generado exitosamente en: public/feed.xml');
        console.log(`✓ Disponible en: https://www.magnolia-n.com/feed.xml`);
    } catch (error) {
        console.error('✗ Error al generar el feed:', error.message);
        process.exit(1);
    }
}

saveFeed();
