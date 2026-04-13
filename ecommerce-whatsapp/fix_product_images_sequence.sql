-- Arreglar la secuencia de IDs de product_images
-- Ejecutar en Supabase SQL Editor

-- 1. Resetear la secuencia al máximo ID actual
SELECT setval('product_images_id_seq', COALESCE((SELECT MAX(id) FROM product_images), 0) + 1);

-- 2. Verificar el estado actual
SELECT 
    'Max ID en tabla' as descripcion, 
    COALESCE(MAX(id), 0) as valor 
FROM product_images
UNION ALL
SELECT 
    'Valor actual secuencia' as descripcion, 
    last_value as valor 
FROM product_images_id_seq;
