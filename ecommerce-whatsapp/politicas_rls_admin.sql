-- Políticas RLS para permitir a usuarios admin gestionar productos
-- Ejecutar en Supabase SQL Editor
-- Usa auth.jwt() que es accesible desde el contexto RLS

-- ============================================
-- POLÍTICAS PARA TABLA products
-- ============================================

-- Habilitar RLS (si no está habilitado)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Verificar si el usuario es admin desde el JWT
-- El rol está en auth.jwt() -> user_metadata -> role

-- Política para admins: permitir SELECT
DROP POLICY IF EXISTS "Admins can read all products" ON products;
CREATE POLICY "Admins can read all products"
ON products FOR SELECT
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Política para admins: permitir INSERT
DROP POLICY IF EXISTS "Admins can insert products" ON products;
CREATE POLICY "Admins can insert products"
ON products FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Política para admins: permitir UPDATE
DROP POLICY IF EXISTS "Admins can update products" ON products;
CREATE POLICY "Admins can update products"
ON products FOR UPDATE
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Política para admins: permitir DELETE
DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products"
ON products FOR DELETE
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ============================================
-- POLÍTICAS PARA TABLA product_variants
-- ============================================

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage variants" ON product_variants;
CREATE POLICY "Admins can manage variants"
ON product_variants FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ============================================
-- POLÍTICAS PARA TABLA product_images
-- ============================================

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage images" ON product_images;
CREATE POLICY "Admins can manage images"
ON product_images FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ============================================
-- POLÍTICAS PARA TABLA product_categories
-- ============================================

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage product_categories" ON product_categories;
CREATE POLICY "Admins can manage product_categories"
ON product_categories FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ============================================
-- POLÍTICAS PARA TABLA product_images (ADMIN)
-- ============================================

DROP POLICY IF EXISTS "Admins can insert images" ON product_images;
CREATE POLICY "Admins can insert images"
ON product_images FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS "Admins can update images" ON product_images;
CREATE POLICY "Admins can update images"
ON product_images FOR UPDATE
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS "Admins can delete images" ON product_images;
CREATE POLICY "Admins can delete images"
ON product_images FOR DELETE
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ============================================
-- POLÍTICA PARA USUARIOS ANÓNIMOS/CLIENTES
-- (Permitir ver productos activos)
-- ============================================

DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products"
ON products FOR SELECT
USING (active = true);

DROP POLICY IF EXISTS "Anyone can view product images" ON product_images;
CREATE POLICY "Anyone can view product images"
ON product_images FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can view product variants" ON product_variants;
CREATE POLICY "Anyone can view product variants"
ON product_variants FOR SELECT
TO anon, authenticated
USING (true);
