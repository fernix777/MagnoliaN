-- ============================================
-- FIX RLS POLICIES — INSERT/UPDATE/DELETE
-- Project: dqewyrotzskpbymecntt
-- Dado el 400 en POST /products, el problema es
-- que migracion_completa.sql habilita RLS pero NO
-- define políticas de escritura (INSERT/UPDATE/DELETE).
-- Este archivo agrega las políticas faltantes.
-- ============================================

-- -------------------------------------------------------
-- 1. Funciones auxiliares
-- -------------------------------------------------------

-- Función is_admin() — ya debe existir, pero la recreamos
-- por si no fue ejecutada (supabase-schema.sql la define)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin() IS 'Retorna TRUE si el usuario autenticado tiene rol=admin en user_metadata del JWT';

-- -------------------------------------------------------
-- 2. Asegurar RLS habilitado en todas las tablas
-- -------------------------------------------------------

ALTER TABLE products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images  ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items     ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- 3. PRODUCTS — Políticas de escritura para admin
-- -------------------------------------------------------

-- INSERT
DROP POLICY IF EXISTS "Admin insert products" ON products;
CREATE POLICY "Admin insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- UPDATE
DROP POLICY IF EXISTS "Admin update products" ON products;
CREATE POLICY "Admin update products"
  ON products FOR UPDATE
  TO authenticated
  USING (is_admin());

-- DELETE
DROP POLICY IF EXISTS "Admin delete products" ON products;
CREATE POLICY "Admin delete products"
  ON products FOR DELETE
  TO authenticated
  USING (is_admin());

-- SELECT admin (permite leer todos los productos, incluso inactivos)
DROP POLICY IF EXISTS "Admin read all products" ON products;
CREATE POLICY "Admin read all products"
  ON products FOR SELECT
  TO authenticated
  USING (is_admin());

-- SELECT público (clientes ven solo productos activos)
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (active = true);

-- -------------------------------------------------------
-- 4. PRODUCT IMAGES — Políticas de escritura para admin
-- -------------------------------------------------------

-- SELECT público
DROP POLICY IF EXISTS "Anyone can view product images" ON product_images;
CREATE POLICY "Anyone can view product images"
  ON product_images FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT
DROP POLICY IF EXISTS "Admin insert images" ON product_images;
CREATE POLICY "Admin insert images"
  ON product_images FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- UPDATE
DROP POLICY IF EXISTS "Admin update images" ON product_images;
CREATE POLICY "Admin update images"
  ON product_images FOR UPDATE
  TO authenticated
  USING (is_admin());

-- DELETE
DROP POLICY IF EXISTS "Admin delete images" ON product_images;
CREATE POLICY "Admin delete images"
  ON product_images FOR DELETE
  TO authenticated
  USING (is_admin());

-- -------------------------------------------------------
-- 5. PRODUCT VARIANTS — Políticas de escritura para admin
-- -------------------------------------------------------

-- SELECT público
DROP POLICY IF EXISTS "Anyone can view product variants" ON product_variants;
CREATE POLICY "Anyone can view product variants"
  ON product_variants FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT
DROP POLICY IF EXISTS "Admin insert variants" ON product_variants;
CREATE POLICY "Admin insert variants"
  ON product_variants FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- UPDATE
DROP POLICY IF EXISTS "Admin update variants" ON product_variants;
CREATE POLICY "Admin update variants"
  ON product_variants FOR UPDATE
  TO authenticated
  USING (is_admin());

-- DELETE
DROP POLICY IF EXISTS "Admin delete variants" ON product_variants;
CREATE POLICY "Admin delete variants"
  ON product_variants FOR DELETE
  TO authenticated
  USING (is_admin());

-- -------------------------------------------------------
-- 6. PRODUCT CATEGORIES — Políticas completas
-- -------------------------------------------------------

DROP POLICY IF EXISTS "Public read product_categories" ON product_categories;
CREATE POLICY "Public read product_categories"
  ON product_categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin all product_categories" ON product_categories;
CREATE POLICY "Admin all product_categories"
  ON product_categories FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- -------------------------------------------------------
-- 7. CATEGORIES — Políticas de escritura para admin
-- -------------------------------------------------------

-- SELECT público
DROP POLICY IF EXISTS "Public read categories" ON categories;
CREATE POLICY "Public read categories"
  ON categories FOR SELECT
  USING (true);

-- INSERT
DROP POLICY IF EXISTS "Admin insert categories" ON categories;
CREATE POLICY "Admin insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- UPDATE
DROP POLICY IF EXISTS "Admin update categories" ON categories;
CREATE POLICY "Admin update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (is_admin());

-- DELETE
DROP POLICY IF EXISTS "Admin delete categories" ON categories;
CREATE POLICY "Admin delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (is_admin());

-- -------------------------------------------------------
-- 8. SUBCATEGORIES — Políticas de escritura para admin
-- -------------------------------------------------------

-- SELECT público
DROP POLICY IF EXISTS "Public read subcategories" ON subcategories;
CREATE POLICY "Public read subcategories"
  ON subcategories FOR SELECT
  USING (true);

-- INSERT
DROP POLICY IF EXISTS "Admin insert subcategories" ON subcategories;
CREATE POLICY "Admin insert subcategories"
  ON subcategories FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- UPDATE
DROP POLICY IF EXISTS "Admin update subcategories" ON subcategories;
CREATE POLICY "Admin update subcategories"
  ON subcategories FOR UPDATE
  TO authenticated
  USING (is_admin());

-- DELETE
DROP POLICY IF EXISTS "Admin delete subcategories" ON subcategories;
CREATE POLICY "Admin delete subcategories"
  ON subcategories FOR DELETE
  TO authenticated
  USING (is_admin());

-- -------------------------------------------------------
-- 9. BANNERS — Políticas completas
-- -------------------------------------------------------

DROP POLICY IF EXISTS "Public read banners" ON banners;
CREATE POLICY "Public read banners"
  ON banners FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Admin all banners" ON banners;
CREATE POLICY "Admin all banners"
  ON banners FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- -------------------------------------------------------
-- 10. Ordemes — Políticas completas
-- -------------------------------------------------------

DROP POLICY IF EXISTS "Admin all orders" ON orders;
CREATE POLICY "Admin all orders"
  ON orders FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- VERIFICACIÓN
-- ============================================

DO $$
DECLARE
  r record;
BEGIN
  RAISE NOTICE '=== Políticas de products ===';
  FOR r IN (SELECT policyname, permissive, cmd FROM pg_policies WHERE tablename = 'products' ORDER BY cmd, policyname) LOOP
    RAISE NOTICE '  % : % (permisivo=%)', r.policyname, r.cmd, r.permissive;
  END LOOP;
  RAISE NOTICE '=== Fin de verificación ===';
END $$;

SELECT 'RLS policies aplicadas correctamente' AS resultado;
