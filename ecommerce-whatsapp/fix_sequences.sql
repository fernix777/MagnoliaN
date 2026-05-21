-- ============================================
-- ARREGLAR SECUENCIAS DESINCRONIZADAS
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Product images
SELECT setval('product_images_id_seq', COALESCE((SELECT MAX(id) FROM product_images), 0) + 1);

-- Product variants  
SELECT setval('product_variants_id_seq', COALESCE((SELECT MAX(id) FROM product_variants), 0) + 1);

-- Products
SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 0) + 1);

-- Orders
SELECT setval('orders_id_seq', COALESCE((SELECT MAX(id) FROM orders), 0) + 1);

-- Order items
SELECT setval('order_items_id_seq', COALESCE((SELECT MAX(id) FROM order_items), 0) + 1);

-- Verificar que se arregló
SELECT 'product_images_id_seq' as tabla, last_value FROM product_images_id_seq
UNION ALL
SELECT 'product_variants_id_seq', last_value FROM product_variants_id_seq
UNION ALL
SELECT 'products_id_seq', last_value FROM products_id_seq;

SELECT 'Secuencias arregladas correctamente' as resultado;