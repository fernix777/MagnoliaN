-- ==========================================
-- MAGNOLIA NOVEDADES - SUPABASE SCHEMA
-- PostgreSQL Database Schema
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABLES
-- ==========================================

-- Tabla de categorías principales
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de subcategorías
CREATE TABLE IF NOT EXISTS subcategories (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id BIGINT REFERENCES subcategories(id) ON DELETE SET NULL,
  featured BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de imágenes de productos
CREATE TABLE IF NOT EXISTS product_images (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de variantes de productos (color/tamaño)
CREATE TABLE IF NOT EXISTS product_variants (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_type TEXT NOT NULL CHECK(variant_type IN ('color', 'size')),
  variant_value TEXT NOT NULL,
  price_modifier NUMERIC(10, 2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  sku TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de zonas de envío por código postal
CREATE TABLE IF NOT EXISTS shipping_zones (
  id BIGSERIAL PRIMARY KEY,
  postal_code_from TEXT NOT NULL,
  postal_code_to TEXT NOT NULL,
  province TEXT NOT NULL,
  locality TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de tarifas de envío
CREATE TABLE IF NOT EXISTS shipping_rates (
  id BIGSERIAL PRIMARY KEY,
  carrier TEXT NOT NULL CHECK(carrier IN ('oca', 'andreani', 'correo')),
  zone_id BIGINT REFERENCES shipping_zones(id) ON DELETE SET NULL,
  base_price NUMERIC(10, 2) NOT NULL,
  price_per_kg NUMERIC(10, 2) DEFAULT 0,
  estimated_days INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración general
CREATE TABLE IF NOT EXISTS settings (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  type TEXT DEFAULT 'string' CHECK(type IN ('string', 'number', 'boolean', 'json')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ÍNDICES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_carrier ON shipping_rates(carrier);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Trigger para actualizar updated_at en products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS DE LECTURA PÚBLICA
-- ==========================================

-- Productos: Todos pueden leer productos activos
CREATE POLICY "Public read active products"
  ON products FOR SELECT
  USING (active = true);

-- Categorías: Todos pueden leer
CREATE POLICY "Public read categories"
  ON categories FOR SELECT
  USING (true);

-- Subcategorías: Todos pueden leer
CREATE POLICY "Public read subcategories"
  ON subcategories FOR SELECT
  USING (true);

-- Variantes: Todos pueden leer variantes de productos activos
CREATE POLICY "Public read product variants"
  ON product_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_variants.product_id 
      AND products.active = true
    )
  );

-- Imágenes: Todos pueden leer imágenes de productos activos
CREATE POLICY "Public read product images"
  ON product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_images.product_id 
      AND products.active = true
    )
  );

-- Zonas de envío: Todos pueden leer
CREATE POLICY "Public read shipping zones"
  ON shipping_zones FOR SELECT
  USING (true);

-- Tarifas de envío: Todos pueden leer tarifas activas
CREATE POLICY "Public read active shipping rates"
  ON shipping_rates FOR SELECT
  USING (active = true);

-- Settings: Todos pueden leer configuración pública
CREATE POLICY "Public read settings"
  ON settings FOR SELECT
  USING (true);

-- ==========================================
-- POLÍTICAS DE ESCRITURA ADMIN
-- ==========================================

-- Helper function para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Productos: Solo admins pueden insertar
CREATE POLICY "Admin insert products"
  ON products FOR INSERT
  WITH CHECK (is_admin());

-- Productos: Solo admins pueden actualizar
CREATE POLICY "Admin update products"
  ON products FOR UPDATE
  USING (is_admin());

-- Productos: Solo admins pueden eliminar
CREATE POLICY "Admin delete products"
  ON products FOR DELETE
  USING (is_admin());

-- Productos: Admins pueden leer todos los productos (incluso inactivos)
CREATE POLICY "Admin read all products"
  ON products FOR SELECT
  USING (is_admin());

-- Categorías: Solo admins pueden modificar
CREATE POLICY "Admin insert categories"
  ON categories FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admin update categories"
  ON categories FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admin delete categories"
  ON categories FOR DELETE
  USING (is_admin());

-- Subcategorías: Solo admins pueden modificar
CREATE POLICY "Admin insert subcategories"
  ON subcategories FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admin update subcategories"
  ON subcategories FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admin delete subcategories"
  ON subcategories FOR DELETE
  USING (is_admin());

-- Variantes: Solo admins pueden modificar
CREATE POLICY "Admin insert variants"
  ON product_variants FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admin update variants"
  ON product_variants FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admin delete variants"
  ON product_variants FOR DELETE
  USING (is_admin());

-- Imágenes: Solo admins pueden modificar
CREATE POLICY "Admin insert images"
  ON product_images FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admin update images"
  ON product_images FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admin delete images"
  ON product_images FOR DELETE
  USING (is_admin());

-- Zonas de envío: Solo admins pueden modificar
CREATE POLICY "Admin modify shipping zones"
  ON shipping_zones FOR ALL
  USING (is_admin());

-- Tarifas de envío: Solo admins pueden modificar
CREATE POLICY "Admin modify shipping rates"
  ON shipping_rates FOR ALL
  USING (is_admin());

-- Settings: Solo admins pueden modificar
CREATE POLICY "Admin modify settings"
  ON settings FOR ALL
  USING (is_admin());

-- ==========================================
-- DATOS INICIALES
-- ==========================================

-- Insertar configuración inicial
INSERT INTO settings (key, value, type) VALUES
  ('store_name', 'Magnolia Novedades', 'string'),
  ('whatsapp_number', '+5491112345678', 'string'),
  ('store_email', 'contacto@magnolia.com', 'string'),
  ('store_address', 'Buenos Aires, Argentina', 'string'),
  ('welcome_message', 'Bienvenido a Magnolia Novedades - Tu tienda de decoración y accesorios para el hogar', 'string'),
  ('currency', 'ARS', 'string'),
  ('tax_rate', '0', 'number')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- COMENTARIOS
-- ==========================================

COMMENT ON TABLE products IS 'Productos de la tienda';
COMMENT ON TABLE categories IS 'Categorías principales de productos';
COMMENT ON TABLE subcategories IS 'Subcategorías de productos';
COMMENT ON TABLE product_variants IS 'Variantes de productos (color, tamaño)';
COMMENT ON TABLE product_images IS 'Imágenes de productos almacenadas en Supabase Storage';
COMMENT ON TABLE shipping_zones IS 'Zonas de envío por código postal';
COMMENT ON TABLE shipping_rates IS 'Tarifas de envío por carrier';
COMMENT ON TABLE settings IS 'Configuración general de la tienda';
