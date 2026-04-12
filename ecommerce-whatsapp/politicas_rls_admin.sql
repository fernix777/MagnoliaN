-- Políticas RLS para permitir a usuarios admin gestionar productos
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- POLÍTICAS PARA TABLA products
-- ============================================

-- Habilitar RLS (si no está habilitado)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política para admins: permitir SELECT (ya existe, pero la dejamos)
DROP POLICY IF EXISTS "Admins can read all products" ON products;
CREATE POLICY "Admins can read all products"
ON products FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Política para admins: permitir INSERT
DROP POLICY IF EXISTS "Admins can insert products" ON products;
CREATE POLICY "Admins can insert products"
ON products FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Política para admins: permitir UPDATE
DROP POLICY IF EXISTS "Admins can update products" ON products;
CREATE POLICY "Admins can update products"
ON products FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Política para admins: permitir DELETE
DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products"
ON products FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================
-- POLÍTICAS PARA TABLA product_variants
-- ============================================

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage variants" ON product_variants;
CREATE POLICY "Admins can manage variants"
ON product_variants FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================
-- POLÍTICAS PARA TABLA product_images
-- ============================================

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage images" ON product_images;
CREATE POLICY "Admins can manage images"
ON product_images FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================
-- POLÍTICAS PARA TABLA product_categories
-- ============================================

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage product_categories" ON product_categories;
CREATE POLICY "Admins can manage product_categories"
ON product_categories FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
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
