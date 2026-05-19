-- ==========================================
-- CREAR BUCKETS PARA SUPABASE STORAGE
-- Proyecto: coadlejoezzjvqwhbuqc
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ==========================================

-- 1. Crear bucket: product-images
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('product-images', 'product-images', true, 10485760)
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit;

-- 2. Crear bucket: banners
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('banners', 'banners', true, 10485760)
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit;

-- 3. Crear bucket: category-images
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('category-images', 'category-images', true, 10485760)
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit;

-- ==========================================
-- POLÍTICAS DE SEGURIDAD PARA product-images
-- ==========================================

-- Lectura pública
DROP POLICY IF EXISTS "Public Select Product Images" ON storage.objects;
CREATE POLICY "Public Select Product Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- Upload (solo admins)
DROP POLICY IF EXISTS "Admin Insert Product Images" ON storage.objects;
CREATE POLICY "Admin Insert Product Images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'product-images'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Update (solo admins)
DROP POLICY IF EXISTS "Admin Update Product Images" ON storage.objects;
CREATE POLICY "Admin Update Product Images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'product-images'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Delete (solo admins)
DROP POLICY IF EXISTS "Admin Delete Product Images" ON storage.objects;
CREATE POLICY "Admin Delete Product Images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'product-images'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ==========================================
-- POLÍTICAS DE SEGURIDAD PARA banners
-- ==========================================

-- Lectura pública
DROP POLICY IF EXISTS "Public Select Banners" ON storage.objects;
CREATE POLICY "Public Select Banners"
ON storage.objects FOR SELECT
USING ( bucket_id = 'banners' );

-- Upload (solo admins)
DROP POLICY IF EXISTS "Admin Insert Banners" ON storage.objects;
CREATE POLICY "Admin Insert Banners"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'banners'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Update (solo admins)
DROP POLICY IF EXISTS "Admin Update Banners" ON storage.objects;
CREATE POLICY "Admin Update Banners"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'banners'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Delete (solo admins)
DROP POLICY IF EXISTS "Admin Delete Banners" ON storage.objects;
CREATE POLICY "Admin Delete Banners"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'banners'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ==========================================
-- POLÍTICAS DE SEGURIDAD PARA category-images
-- ==========================================

-- Lectura pública
DROP POLICY IF EXISTS "Public Select Category Images" ON storage.objects;
CREATE POLICY "Public Select Category Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'category-images' );

-- Upload (solo admins)
DROP POLICY IF EXISTS "Admin Insert Category Images" ON storage.objects;
CREATE POLICY "Admin Insert Category Images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'category-images'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Update (solo admins)
DROP POLICY IF EXISTS "Admin Update Category Images" ON storage.objects;
CREATE POLICY "Admin Update Category Images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'category-images'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Delete (solo admins)
DROP POLICY IF EXISTS "Admin Delete Category Images" ON storage.objects;
CREATE POLICY "Admin Delete Category Images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'category-images'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
