-- ==========================================
-- SUPABASE STORAGE - POLÍTICAS DE SEGURIDAD
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ==========================================

-- ==========================================
-- BUCKET: product-images
-- ==========================================

-- Política: Lectura pública de imágenes de productos
CREATE POLICY "Public Access to Product Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- Política: Solo admins pueden subir imágenes
CREATE POLICY "Admin Upload Product Images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Política: Solo admins pueden actualizar imágenes
CREATE POLICY "Admin Update Product Images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Política: Solo admins pueden eliminar imágenes
CREATE POLICY "Admin Delete Product Images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ==========================================
-- BUCKET: category-images
-- ==========================================

-- Política: Lectura pública de imágenes de categorías
CREATE POLICY "Public Access to Category Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'category-images' );

-- Política: Solo admins pueden subir imágenes
CREATE POLICY "Admin Upload Category Images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'category-images' 
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Política: Solo admins pueden actualizar imágenes
CREATE POLICY "Admin Update Category Images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'category-images'
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Política: Solo admins pueden eliminar imágenes
CREATE POLICY "Admin Delete Category Images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'category-images'
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ==========================================
-- BUCKET: logos
-- ==========================================

-- Política: Lectura pública de logos
CREATE POLICY "Public Access to Logos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'logos' );

-- Política: Solo admins pueden subir logos
CREATE POLICY "Admin Upload Logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos' 
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Política: Solo admins pueden actualizar logos
CREATE POLICY "Admin Update Logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos'
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Política: Solo admins pueden eliminar logos
CREATE POLICY "Admin Delete Logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos'
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
