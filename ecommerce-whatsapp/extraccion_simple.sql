-- ========================================
-- EXTRACCIÓN SIMPLE - PASO A PASO
-- Ejecuta UN QUERY A LA VEZ en el SQL Editor
-- ========================================

-- PASO 1: Listar todas las tablas (ejecutar primero)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ========================================
-- DESPUÉS de ver las tablas, ejecuta UNO por UNO:
-- ========================================

-- Estructura de products:
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'products'
ORDER BY ordinal_position;

-- Estructura de categories:
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'categories'
ORDER BY ordinal_position;

-- Estructura de product_images:
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'product_images'
ORDER BY ordinal_position;

-- Estructura de banners:
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'banners'
ORDER BY ordinal_position;

-- Estructura de product_variants:
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'product_variants'
ORDER BY ordinal_position;

-- Estructura de orders:
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;

-- Estructura de order_items:
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'order_items'
ORDER BY ordinal_position;

-- ========================================
-- CONTAR REGISTROS (ejecutar después)
-- ========================================

SELECT 'products' as tabla, COUNT(*) as total FROM products
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'product_images', COUNT(*) FROM product_images
UNION ALL
SELECT 'banners', COUNT(*) FROM banners
UNION ALL
SELECT 'product_variants', COUNT(*) FROM product_variants
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items;

-- ========================================
-- EXTRAER DATOS - Descargar como CSV
-- Ejecutar uno por uno y descargar resultados
-- ========================================

-- Datos de categories (ejecutar y descargar)
SELECT * FROM categories ORDER BY id;

-- Datos de banners (ejecutar y descargar)
SELECT * FROM banners ORDER BY id;

-- Datos de product_images (ejecutar y descargar)
SELECT * FROM product_images ORDER BY id;

-- Datos de product_variants (ejecutar y descargar)
SELECT * FROM product_variants ORDER BY id;

-- Datos de orders (ejecutar y descargar)
SELECT * FROM orders ORDER BY created_at DESC;

-- Datos de order_items (ejecutar y descargar)
SELECT * FROM order_items ORDER BY id;

-- Datos de products (ejecutar y descargar - si son muchos, usar paginación)
-- Opción A: Si son pocos productos (< 1000)
SELECT * FROM products ORDER BY id;

-- Opción B: Si son muchos productos, ejecutar por partes:
-- SELECT * FROM products ORDER BY id LIMIT 500 OFFSET 0;
-- SELECT * FROM products ORDER BY id LIMIT 500 OFFSET 500;
-- SELECT * FROM products ORDER BY id LIMIT 500 OFFSET 1000;
