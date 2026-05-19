-- Script para resetear todas las secuencias de IDs
-- Ejecutar si hay errores de duplicados al insertar

-- product_variants
SELECT setval('product_variants_id_seq', COALESCE((SELECT MAX(id) FROM product_variants), 0) + 1);

-- product_images
SELECT setval('product_images_id_seq', COALESCE((SELECT MAX(id) FROM product_images), 0) + 1);

-- products
SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 0) + 1);

-- orders
SELECT setval('orders_id_seq', COALESCE((SELECT MAX(id) FROM orders), 0) + 1);

-- order_items
SELECT setval('order_items_id_seq', COALESCE((SELECT MAX(id) FROM order_items), 0) + 1);

-- Verificar estado
SELECT 'product_variants' as tabla, last_value as secuencia FROM product_variants_id_seq
UNION ALL
SELECT 'product_images', last_value FROM product_images_id_seq
UNION ALL
SELECT 'products', last_value FROM products_id_seq
UNION ALL
SELECT 'orders', last_value FROM orders_id_seq
UNION ALL
SELECT 'order_items', last_value FROM order_items_id_seq;
