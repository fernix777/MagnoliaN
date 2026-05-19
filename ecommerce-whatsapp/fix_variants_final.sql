-- ARREGLAR RLS PARA PRODUCT_VARIANTS
-- Ejecutar en Supabase SQL Editor

-- 1. Deshabilitar RLS
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar TODAS las políticas
DROP POLICY IF EXISTS "Admins can manage variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can read variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can insert variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can update variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can delete variants" ON product_variants;
DROP POLICY IF EXISTS "Anyone can view product variants" ON product_variants;
DROP POLICY IF EXISTS "Allow all operations" ON product_variants;

-- 3. Limpiar variantes del producto 540
DELETE FROM product_variants WHERE product_id = 540;

-- 4. Volver a habilitar RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- 5. Crear política simple
CREATE POLICY "Allow all operations"
ON product_variants FOR ALL
TO public
USING (true)
WITH CHECK (true);
