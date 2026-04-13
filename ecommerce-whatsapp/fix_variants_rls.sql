-- Arreglar políticas RLS para product_variants
-- Ejecutar en Supabase SQL Editor

-- Eliminar política antigua que no funciona
DROP POLICY IF EXISTS "Admins can manage variants" ON product_variants;

-- Crear políticas separadas que sí funcionan
DROP POLICY IF EXISTS "Admins can read variants" ON product_variants;
CREATE POLICY "Admins can read variants"
ON product_variants FOR SELECT
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS "Admins can insert variants" ON product_variants;
CREATE POLICY "Admins can insert variants"
ON product_variants FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS "Admins can update variants" ON product_variants;
CREATE POLICY "Admins can update variants"
ON product_variants FOR UPDATE
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS "Admins can delete variants" ON product_variants;
CREATE POLICY "Admins can delete variants"
ON product_variants FOR DELETE
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
