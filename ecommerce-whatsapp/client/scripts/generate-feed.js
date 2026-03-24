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

// ─────────────────────────────────────────────
// MAPEO DE CATEGORÍAS: product_type → google_product_category
// ─────────────────────────────────────────────
const CATEGORY_MAP = {
    'COTILLON LED': 'Electronics > Electronics Accessories > LED Lighting',
    'LUCES':        'Electronics > Electronics Accessories > LED Lighting',
    'LIBRERIA':     'Office Supplies',
    'COTILLON':     'Arts & Entertainment > Party & Celebration > Party Supplies',
    'REGALERIA':    'Arts & Entertainment > Party & Celebration > Gift Giving',
};
const DEFAULT_CATEGORY = 'Arts & Entertainment > Party & Celebration';

function getGoogleCategory(productType) {
    if (!productType) return DEFAULT_CATEGORY;
    const key = productType.toUpperCase().trim();
    return CATEGORY_MAP[key] ?? DEFAULT_CATEGORY;
}

async function getProductsFromSupabase() {
    try {
        console.log('🔄 Obteniendo TODOS los productos activos para el feed XML...');

        // Obtener todos los productos activos sin límite (igual que el feed principal)
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select(`
                *,
                category:categories(id, name, slug),
                subcategories:subcategory_id(name),
                images:product_images(*),
                product_categories!inner(category_id)
            `)
            .eq('active', true)
            .order('featured', { ascending: false }) // Priorizar destacados
            .order('created_at', { ascending: false }) // Luego los más nuevos

        if (productsError) {
            console.error('✗ Error al obtener productos:', productsError.message);
            return [];
        }

        console.log(`✓ Se encontraron ${products.length} productos activos`);

        // Eliminar duplicados (si un producto está en múltiples categorías) - igual que el feed principal
        const uniqueProducts = Array.from(new Map(products.map(item => [item.id, item])).values());
        console.log(`✓ Productos únicos después de eliminar duplicados: ${uniqueProducts.length}`);

        // Mapear al formato esperado por el resto del script
        const productsWithImages = uniqueProducts.map(product => {
            return {
                ...product,
                images: product.images || [],
                // product_type viene de category.name (el nombre de la categoría principal)
                product_type: product.category?.name || null,
            };
        });

        return productsWithImages;
    } catch (error) {
        console.error('✗ Error de conexión:', error.message);
        return [];
    }
}

// Normaliza URLs de imágenes para mejorar compatibilidad con plataformas externas
// - Convierte extensiones a minúsculas (.JPG → .jpg, .PNG → .png)
// - Conserva cualquier query string existente (el cache buster se agrega más adelante)
function normalizeImageUrl(url) {
    if (!url) return url;
    const [base, query] = url.split('?');
    const normalizedBase = base.replace(/\.(JPG|JPEG|PNG|WEBP|GIF)$/i, ext => ext.toLowerCase());
    return query ? `${normalizedBase}?${query}` : normalizedBase;
}

function getProductImages(product) {
    // 1. Priorizar imágenes de la tabla product_images
    if (product.images && product.images.length > 0) {
        // Filtrar las imágenes para excluir el logo por defecto
        const realImages = product.images.filter(img => img.image_url && !img.image_url.includes('logo.jpg'));

        if (realImages.length > 0) {
            // Preferir imágenes JPEG como principal cuando sea posible
            const jpegImages = realImages.filter(img => /\.(jpe?g)$/i.test((img.image_url || '').split('?')[0]));
            const primaryImg =
                realImages.find(img => img.is_primary) ||
                (jpegImages.length > 0 ? jpegImages[0] : realImages[0]);
            
            // Obtener las adicionales (máximo 10 para Facebook)
            const additional = realImages
                .filter(img => img.id !== primaryImg.id)
                .slice(0, 10)
                .map(img => normalizeImageUrl(img.image_url));

            return {
                primary: normalizeImageUrl(primaryImg.image_url),
                additional
            };
        }
    }

    // 2. Fallback a la columna image_url de la tabla products
    if (product.image_url && !product.image_url.includes('logo.jpg')) {
        return {
            primary: normalizeImageUrl(product.image_url),
            additional: []
        };
    }

    // 3. Si no hay nada, usar el logo
    return {
        primary: 'https://www.magnolia-n.com/hero-banner.jpg',
        additional: []
    };
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

        const { primary, additional } = getProductImages(product);
        // Usar URL limpia (sin query params) para máxima estabilidad con Facebook/Google
        const imageUrl = primary.split('?')[0];
        
        const productUrl = `https://www.magnolia-n.com/producto/${product.slug}`;

        // Validar URLs
        if (!validateUrl(productUrl)) {
            console.warn(`⚠ URL de producto inválida: ${productUrl}`);
            skippedProducts++;
            return;
        }

        // Generar ID único
        const productId = product.id.toString();

        // Formatear precio
        const price = product.base_price && product.base_price > 0 ? product.base_price : 1;
        const formattedPrice = `${price.toFixed(2)} ARS`;

        // Determinar disponibilidad
        const stock = product.stock || 0;
        const availability = stock > 0 ? 'in stock' : 'out of stock';

        // Descripción limpia
        let description = product.description || 'Producto de Magnolia Novedades - Decoración y regalos únicos en San Salvador de Jujuy, Argentina';
        if (description.length > 5000) {
            description = description.substring(0, 4997) + '...';
        }

        // ── CATEGORÍA MEJORADA CON MAPEO ──
        const googleCategory = getGoogleCategory(product.product_type);
        
        // product_type para el feed = nombre de la categoría del producto
        const productType = product.product_type || 'General';

        validProducts++;

        // Generar XML de imágenes adicionales
        let additionalImagesXml = '';
        additional.forEach(imgUrl => {
            const finalImgUrl = imgUrl.split('?')[0];
            additionalImagesXml += `
            <g:additional_image_link>${escapeXml(finalImgUrl)}</g:additional_image_link>`;
        });

        itemsXml += `
        <item>
            <g:id>${escapeXml(productId)}</g:id>
            <g:title>${escapeXml(product.name)}</g:title>
            <g:description>${escapeXml(description)}</g:description>
            <g:link>${escapeXml(productUrl)}</g:link>
            <g:image_link>${escapeXml(imageUrl)}</g:image_link>${additionalImagesXml}
            <g:availability>${availability}</g:availability>
            <g:price>${formattedPrice}</g:price>
            <g:condition>new</g:condition>
            <g:brand>Magnolia Novedades</g:brand>
            <g:mpn>${escapeXml(productId)}</g:mpn>
            <g:product_type>${escapeXml(productType)}</g:product_type>
            <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>
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

