-- SOLUCIÓN COMPLETA PARA VARIANTES
-- Ejecutar TODO este script en Supabase SQL Editor

-- 1. Verificar estado actual
SELECT '=== ANTES DE ARREGLAR ===' as paso;
SELECT COUNT(*) as variantes_del_540 FROM product_variants WHERE product_id = 540;
SELECT MAX(id) as max_id FROM product_variants;
SELECT last_value as seq_actual FROM product_variants_id_seq;

-- 2. Deshabilitar RLS temporalmente
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;

-- 3. Eliminar TODAS las variantes del producto 540 (sin restricciones)
DELETE FROM product_variants WHERE product_id = 540;

-- 4. Resetear la secuencia
SELECT setval('product_variants_id_seq', COALESCE((SELECT MAX(id) FROM product_variants), 0) + 1);

-- 5. Insertar una variante de prueba DIRECTAMENTE en SQL
INSERT INTO product_variants (product_id, variant_type, variant_value, sku, price_modifier, stock, active)
VALUES (540, 'color', 'Verde', NULL, 0, 0, true);

-- 6. Verificar que se insertó
SELECT '=== DESPUÉS DE INSERTAR ===' as paso;
SELECT * FROM product_variants WHERE product_id = 540;

-- 7. Volver a habilitar RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- 8. Eliminar y recrear políticas simples
DROP POLICY IF EXISTS "Allow all" ON product_variants;
CREATE POLICY "Allow all"
ON product_variants FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 9. Verificar estado final
SELECT '=== ESTADO FINAL ===' as paso;
SELECT * FROM product_variants WHERE product_id = 540;
