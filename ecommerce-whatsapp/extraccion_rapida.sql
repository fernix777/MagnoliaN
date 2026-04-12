-- ========================================
-- EXTRACCIÓN RÁPIDA DE DATOS - PROYECTO VIEJO
-- Ejecutar en SQL Editor del proyecto viejo
-- ========================================

-- 1. LISTAR TODAS LAS TABLAS
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ========================================
-- 2. EXTRAER ESTRUCTURA DE CADA TABLA
-- Copia y pega el resultado en un archivo
-- ========================================

-- Products
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'products'
ORDER BY ordinal_position;

-- Categories
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'categories'
ORDER BY ordinal_position;

-- Product Images
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'product_images'
ORDER BY ordinal_position;

-- Banners
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'banners'
ORDER BY ordinal_position;

-- Product Variants
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'product_variants'
ORDER BY ordinal_position;

-- Orders
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'orders'
ORDER BY ordinal_position;

-- Order Items
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'order_items'
ORDER BY ordinal_position;

-- ========================================
-- 3. CONTAR REGISTROS (para saber si usar paginación)
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
-- 4. EXTRAER DATOS (ejecutar uno por uno)
-- Descargar resultados como CSV
-- ========================================

-- Products (si son menos de 1000)
SELECT * FROM products ORDER BY id;

-- Categories
SELECT * FROM categories ORDER BY id;

-- Banners
SELECT * FROM banners ORDER BY id;

-- Product Images
SELECT * FROM product_images ORDER BY id;

-- Product Variants
SELECT * FROM product_variants ORDER BY id;

-- Orders
SELECT * FROM orders ORDER BY created_at DESC;

-- Order Items
SELECT * FROM order_items ORDER BY id;

-- ========================================
-- 5. SI PRODUCTS TIENE MUCHOS DATOS (>1000)
-- Usar paginación:
-- ========================================

-- Página 1 (filas 1-1000)
-- SELECT * FROM products ORDER BY id LIMIT 1000 OFFSET 0;

-- Página 2 (filas 1001-2000)
-- SELECT * FROM products ORDER BY id LIMIT 1000 OFFSET 1000;

-- Página 3 (filas 2001-3000)
-- SELECT * FROM products ORDER BY id LIMIT 1000 OFFSET 2000;

-- Y así sucesivamente...

-- ========================================
-- 6. VERIFICAR RELACIONES (Foreign Keys)
-- ========================================

SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;
