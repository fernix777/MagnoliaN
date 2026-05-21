-- ============================================
-- LIMPIAR TODO EXCEPTO USUARIOS DE AUTH
-- Magnolia Novedades - Preparación para Migración
-- ============================================

-- Desactivar triggers temporariamente para evitar errores de FK
SET session_replication_role = 'replica';

-- ============================================
-- BORRAR DATOS EN ORDEN (respetando dependencias FK)
-- ============================================

-- 1. Tablas hijas primero (las que tienen FK a otras)
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE order_tracking CASCADE;
TRUNCATE TABLE notifications CASCADE;

-- 2. Órdenes (depende de users, pero users se preserva)
TRUNCATE TABLE orders CASCADE;

-- 3. Productos y relacionados
TRUNCATE TABLE product_images CASCADE;
TRUNCATE TABLE product_variants CASCADE;
-- Nota: product_categories no existe aún, se creará después

-- 4. Productos principales
TRUNCATE TABLE products CASCADE;

-- 5. Estructura de categorías
TRUNCATE TABLE subcategories CASCADE;
TRUNCATE TABLE categories CASCADE;

-- 6. Banners y administración
TRUNCATE TABLE banners CASCADE;
TRUNCATE TABLE admin_users CASCADE;

-- ============================================
-- REACTIVAR TRIGGERS
-- ============================================

SET session_replication_role = 'origin';

-- ============================================
-- VERIFICAR LIMPIEZA
-- ============================================

SELECT 'LIMPIEZA COMPLETADA' as estado;

-- Mostrar conteos (solo users y profiles deberían tener datos)
SELECT 
    'users' as tabla, 
    count(*) as registros,
    'PRESERVAR' as accion
FROM users
UNION ALL
SELECT 
    'profiles', 
    count(*),
    'PRESERVAR'
FROM profiles
UNION ALL
SELECT 
    'products', 
    count(*),
    'BORRADO'
FROM products
UNION ALL
SELECT 
    'categories', 
    count(*),
    'BORRADO'
FROM categories
UNION ALL
SELECT 
    'banners', 
    count(*),
    'BORRADO'
FROM banners
UNION ALL
SELECT 
    'orders', 
    count(*),
    'BORRADO'
FROM orders
UNION ALL
SELECT 
    'order_items', 
    count(*),
    'BORRADO'
FROM order_items
UNION ALL
SELECT 
    'product_images', 
    count(*),
    'BORRADO'
FROM product_images
UNION ALL
SELECT 
    'product_variants', 
    count(*),
    'BORRADO'
FROM product_variants
UNION ALL
SELECT 
    'subcategories', 
    count(*),
    'BORRADO'
FROM subcategories
ORDER BY accion DESC, tabla;
