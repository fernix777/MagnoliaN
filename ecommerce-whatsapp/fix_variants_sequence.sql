-- Verificar y arreglar todo para product_variants

-- 1. Ver variantes del producto 540
SELECT 'Variantes actuales' as info, * FROM product_variants WHERE product_id = 540;

-- 2. Ver constraints únicos
SELECT tc.constraint_name, tc.table_name, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'product_variants' AND tc.constraint_type = 'UNIQUE';

-- 3. Verificar secuencia
SELECT 'Secuencia actual' as info, last_value FROM product_variants_id_seq;

-- 4. Verificar max ID
SELECT 'Max ID en tabla' as info, COALESCE(MAX(id), 0) as max_id FROM product_variants;

-- 5. Resetear secuencia si es necesario (descomentar si max_id >= last_value)
-- SELECT setval('product_variants_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM product_variants));

-- 6. Eliminar TODAS las variantes del producto 540
DELETE FROM product_variants WHERE product_id = 540;

-- 7. Verificar que se eliminaron
SELECT 'Después de DELETE' as info, COUNT(*) as cantidad FROM product_variants WHERE product_id = 540;
