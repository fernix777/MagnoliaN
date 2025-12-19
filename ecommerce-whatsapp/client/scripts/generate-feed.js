import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conectar a Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('✗ Error: Variables de Supabase no encontradas');
    console.error('  Asegúrate de tener .env.local con:');
    console.error('  VITE_SUPABASE_URL=...');
    console.error('  VITE_SUPABASE_ANON_KEY=...');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getProductsFromSupabase() {
    try {
        // Obtener todos los productos con información de categorías
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                categories:category_id(name),
                subcategories:subcategory_id(name)
            `)
            .eq('active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('✗ Error al obtener productos:', error.message);
            return [];
        }

        // Para cada producto, obtener sus imágenes
        const productsWithImages = await Promise.all(
            (data || []).map(async (product) => {
                const { data: images } = await supabase
                    .from('product_images')
                    .select('*')
                    .eq('product_id', product.id)
                    .order('order', { ascending: true });

                return {
                    ...product,
                    images: images || [],
                    category: product.categories?.name || 'Decoración'
                };
            })
        );

        return productsWithImages;
    } catch (error) {
        console.error('✗ Error de conexión:', error.message);
        return [];
    }
}

function getPrimaryImage(product) {
    if (!product.images || product.images.length === 0) return 'https://www.magnolia-n.com/logo.jpg';
    const primary = product.images.find(img => img.is_primary);
    return primary ? primary.image_url : product.images[0].image_url;
}

function generateProductFeed(products) {
    const now = new Date().toISOString();
    
    let itemsXml = '';
    let validProducts = 0;
    let skippedProducts = 0;
    
    products.forEach((product, index) => {
        // Validar datos del producto
        const validationErrors = validateProductData(product);
        if (validationErrors.length > 0) {
            console.warn(`⚠ Producto "${product.name || 'Sin nombre'}" omitido:`, validationErrors.join(', '));
            skippedProducts++;
            return;
        }
        
        const imageUrl = getPrimaryImage(product);
        const productUrl = `https://www.magnolia-n.com/producto/${product.slug}`;
        
        // Validar URLs
        if (!validateUrl(productUrl)) {
            console.warn(`⚠ URL de producto inválida: ${productUrl}`);
            skippedProducts++;
            return;
        }
        
        if (!validateUrl(imageUrl)) {
            console.warn(`⚠ URL de imagen inválida para ${product.name}: ${imageUrl}`);
        }
        
        // Generar ID único
        const productId = product.id.toString();
        
        // Formatear precio
        const price = product.price && product.price > 0 ? product.price : 1; // Usar 1 ARS como precio mínimo
        const formattedPrice = `${price.toFixed(2)} ARS`;
        
        // Advertir sobre productos sin precio
        if (!product.price || product.price <= 0) {
            console.warn(`⚠ Producto "${product.name}" no tiene precio válido, usando precio mínimo: 1 ARS`);
        }
        
        // Determinar disponibilidad
        const stock = product.stock || 0;
        const availability = stock > 0 ? 'in stock' : 'out of stock';
        
        // Descripción limpia
        let description = product.description || 'Producto de Magnolia Novedades - Decoración y regalos únicos en San Salvador de Jujuy, Argentina';
        if (description.length > 5000) {
            description = description.substring(0, 4997) + '...';
        }
        
        // Categoría del producto
        const category = product.category || 'Decoración';
        
        validProducts++;
        
        itemsXml += `
        <item>
            <g:id>${escapeXml(productId)}</g:id>
            <g:title>${escapeXml(product.name)}</g:title>
            <g:description>${escapeXml(description)}</g:description>
            <g:link>${escapeXml(productUrl)}</g:link>
            <g:image_link>${escapeXml(imageUrl)}</g:image_link>
            <g:availability>${availability}</g:availability>
            <g:price>${formattedPrice}</g:price>
            <g:condition>new</g:condition>
            <g:brand>Magnolia Novedades</g:brand>
            <g:mpn>${escapeXml(productId)}</g:mpn>
            <g:product_type>${escapeXml(category)}</g:product_type>
            <g:google_product_category>Home &amp; Garden &gt; Decor</g:google_product_category>
        </item>`;
    });

    console.log(`✓ Productos válidos: ${validProducts}`);
    if (skippedProducts > 0) {
        console.warn(`⚠ Productos omitidos: ${skippedProducts}`);
    }

    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
    <channel>
        <title>Magnolia Novedades - Catálogo de Productos</title>
        <link>https://www.magnolia-n.com</link>
        <description>Catálogo de productos de Magnolia Novedades - Decoración y regalos únicos en San Salvador de Jujuy, Argentina</description>
        <lastBuildDate>${now}</lastBuildDate>${itemsXml}
    </channel>
</rss>`;

    return feed;
}

function escapeXml(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        // Eliminar caracteres de control que pueden causar problemas
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Normalizar espacios en blanco
        .replace(/\s+/g, ' ')
        .trim();
}

function validateProductData(product) {
    const errors = [];
    
    if (!product.name) {
        errors.push('Falta nombre del producto');
    }
    
    if (!product.slug) {
        errors.push('Falta slug del producto');
    }
    
    if (!product.id) {
        errors.push('Falta ID del producto');
    }
    
    // No validar precio aquí, lo manejaremos en la generación
    
    return errors;
}

function validateUrl(url) {
    try {
        new URL(url);
        return url.startsWith('http://') || url.startsWith('https://');
    } catch {
        return false;
    }
}

async function saveFeed() {
    try {
        console.log('🔄 Obteniendo productos desde Supabase...');
        const products = await getProductsFromSupabase();
        
        if (products.length === 0) {
            console.warn('⚠ No hay productos disponibles');
        } else {
            console.log(`✓ ${products.length} productos encontrados`);
        }

        const feedContent = generateProductFeed(products);
        const publicDir = path.join(__dirname, '../public');
        const feedPath = path.join(publicDir, 'feed.xml');

        // Crear directorio public si no existe
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        fs.writeFileSync(feedPath, feedContent, 'utf8');
        console.log('✓ Feed RSS generado exitosamente en: public/feed.xml');
        console.log(`✓ Disponible en: https://www.magnolia-n.com/feed.xml`);
        console.log(`✓ Productos en el feed: ${products.length}`);
    } catch (error) {
        console.error('✗ Error al generar el feed:', error.message);
        process.exit(1);
    }
}

saveFeed();

