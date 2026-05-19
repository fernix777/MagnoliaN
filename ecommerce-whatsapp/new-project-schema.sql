-- ==========================================
-- MAGNOLIA NOVEDADES - SCHEMA COMPLETO
-- Proyecto Supabase: coadlejoezzjvqwhbuqc
-- ==========================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- SECUENCIAS IDs AUTO-INCREMENTALES
-- ==========================================
CREATE SEQUENCE IF NOT EXISTS categories_id_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS subcategories_id_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS products_id_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS product_images_id_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS product_variants_id_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS banners_id_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS orders_id_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS order_items_id_seq START WITH 1;

-- ==========================================
-- TABLAS
-- ==========================================

-- Tabla categorías principales
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT PRIMARY KEY DEFAULT nextval('categories_id_seq'),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    active BOOLEAN DEFAULT true,
    parent_id BIGINT
        REFERENCES categories(id) ON DELETE SET NULL
);

-- Tabla subcategorías
CREATE TABLE IF NOT EXISTS subcategories (
    id BIGINT PRIMARY KEY DEFAULT nextval('subcategories_id_seq'),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    category_id BIGINT NOT NULL
        REFERENCES categories(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    active BOOLEAN DEFAULT true
);

-- Tabla productos
CREATE TABLE IF NOT EXISTS products (
    id BIGINT PRIMARY KEY DEFAULT nextval('products_id_seq'),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    base_price NUMERIC(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category_id BIGINT,
    subcategory_id BIGINT,
    featured BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    units_per_box INTEGER DEFAULT 12,
    boxes_per_bundle INTEGER DEFAULT 40,
    price_box NUMERIC(10,2),
    price_bundle NUMERIC(10,2),
    has_colors BOOLEAN DEFAULT true,
    sale_types TEXT[] DEFAULT ARRAY['unidad'::text, 'paquete'::text, 'bulto'::text],
    CONSTRAINT products_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT products_subcategory_id_fkey
        FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
);

-- Tabla imágenes de productos
CREATE TABLE IF NOT EXISTS product_images (
    id BIGINT PRIMARY KEY DEFAULT nextval('product_images_id_seq'),
    product_id BIGINT NOT NULL
        REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Product Categories (relación M:N)
CREATE TABLE IF NOT EXISTS product_categories (
    product_id BIGINT NOT NULL
        REFERENCES products(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL
        REFERENCES categories(id) ON DELETE CASCADE,
    subcategory_id BIGINT
        REFERENCES subcategories(id) ON DELETE SET NULL,
    PRIMARY KEY (product_id, category_id)
);

-- Tabla variantes de productos (color/size)
CREATE TABLE IF NOT EXISTS product_variants (
    id BIGINT PRIMARY KEY DEFAULT nextval('product_variants_id_seq'),
    product_id BIGINT NOT NULL
        REFERENCES products(id) ON DELETE CASCADE,
    variant_type TEXT NOT NULL DEFAULT 'color'
        CHECK(variant_type IN ('color', 'size')),
    variant_value TEXT NOT NULL,
    price_modifier NUMERIC(10,2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    sku TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    active BOOLEAN DEFAULT true
);

-- Tabla banners
CREATE TABLE IF NOT EXISTS banners (
    id BIGINT PRIMARY KEY DEFAULT nextval('banners_id_seq'),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    link TEXT,
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla ordenes
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT PRIMARY KEY DEFAULT nextval('orders_id_seq'),
    user_id UUID,
    customer_info JSONB NOT NULL DEFAULT '{}',
    total NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla items de orden
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT PRIMARY KEY DEFAULT nextval('order_items_id_seq'),
    order_id BIGINT NOT NULL
        REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT
        REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    product_name TEXT NOT NULL,
    variant_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    selected_color TEXT,
    selected_condition TEXT,
    purchase_type TEXT DEFAULT 'paquete'
);

-- Tabla configuracion
CREATE TABLE IF NOT EXISTS settings (
    id BIGSERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    type TEXT DEFAULT 'string'
        CHECK(type IN ('string', 'number', 'boolean', 'json')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- INDICES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(active);
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(active);
CREATE INDEX IF NOT EXISTS idx_banners_order ON banners(display_order);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- ==========================================
-- TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Helper para verificar si usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- === LECTURAS PÚBLICAS ===

-- Products: lectura de activos
DROP POLICY IF EXISTS "Public read active products" ON products;
CREATE POLICY "Public read active products"
    ON products FOR SELECT USING (active = true);

-- Categories: lectura pública
DROP POLICY IF EXISTS "Public read categories" ON categories;
CREATE POLICY "Public read categories"
    ON categories FOR SELECT USING (true);

-- Subcategories: lectura pública
DROP POLICY IF EXISTS "Public read subcategories" ON subcategories;
CREATE POLICY "Public read subcategories"
    ON subcategories FOR SELECT USING (true);

-- Product Variants: leer variantes de productos activos
DROP POLICY IF EXISTS "Public read product variants" ON product_variants;
CREATE POLICY "Public read product variants"
    ON product_variants FOR SELECT
    USING (EXISTS (SELECT 1 FROM products
                   WHERE products.id = product_variants.product_id
                     AND products.active = true));

-- Product Images: leer imágenes de productos activos
DROP POLICY IF EXISTS "Public read product images" ON product_images;
CREATE POLICY "Public read product images"
    ON product_images FOR SELECT
    USING (EXISTS (SELECT 1 FROM products
                   WHERE products.id = product_images.product_id
                     AND products.active = true));

-- Banners: leer públicos activos
DROP POLICY IF EXISTS "Public read active banners" ON banners;
CREATE POLICY "Public read active banners"
    ON banners FOR SELECT USING (active = true);

-- Orders: cada usuario lee sus propias órdenes
DROP POLICY IF EXISTS "Users read own orders" ON orders;
CREATE POLICY "Users read own orders"
    ON orders FOR SELECT USING (auth.uid() = user_id);

-- Settings: lectura pública
DROP POLICY IF EXISTS "Public read settings" ON settings;
CREATE POLICY "Public read settings"
    ON settings FOR SELECT USING (true);

-- === ESCRITURA ADMIN ===

-- Products
DROP POLICY IF EXISTS "Admin insert products" ON products;
CREATE POLICY "Admin insert products" ON products FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admin update products" ON products;
CREATE POLICY "Admin update products" ON products FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Admin delete products" ON products;
CREATE POLICY "Admin delete products" ON products FOR DELETE USING (is_admin());

-- Categories
DROP POLICY IF EXISTS "Admin insert categories" ON categories;
CREATE POLICY "Admin insert categories" ON categories FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admin update categories" ON categories;
CREATE POLICY "Admin update categories" ON categories FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Admin delete categories" ON categories;
CREATE POLICY "Admin delete categories" ON categories FOR DELETE USING (is_admin());

-- Subcategories
DROP POLICY IF EXISTS "Admin insert subcategories" ON subcategories;
CREATE POLICY "Admin insert subcategories" ON subcategories FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admin update subcategories" ON subcategories;
CREATE POLICY "Admin update subcategories" ON subcategories FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Admin delete subcategories" ON subcategories;
CREATE POLICY "Admin delete subcategories" ON subcategories FOR DELETE USING (is_admin());

-- Product Variants
DROP POLICY IF EXISTS "Admin insert variants" ON product_variants;
CREATE POLICY "Admin insert variants" ON product_variants FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admin update variants" ON product_variants;
CREATE POLICY "Admin update variants" ON product_variants FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Admin delete variants" ON product_variants;
CREATE POLICY "Admin delete variants" ON product_variants FOR DELETE USING (is_admin());

-- Product Images
DROP POLICY IF EXISTS "Admin insert images" ON product_images;
CREATE POLICY "Admin insert images" ON product_images FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admin update images" ON product_images;
CREATE POLICY "Admin update images" ON product_images FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Admin delete images" ON product_images;
CREATE POLICY "Admin delete images" ON product_images FOR DELETE USING (is_admin());

-- Product Categories
DROP POLICY IF EXISTS "Admin insert product_categories" ON product_categories;
CREATE POLICY "Admin insert product_categories" ON product_categories FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admin delete product_categories" ON product_categories;
CREATE POLICY "Admin delete product_categories" ON product_categories FOR DELETE USING (is_admin());

-- Banners
DROP POLICY IF EXISTS "Admin insert banners" ON banners;
CREATE POLICY "Admin insert banners" ON banners FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admin update banners" ON banners;
CREATE POLICY "Admin update banners" ON banners FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Admin delete banners" ON banners;
CREATE POLICY "Admin delete banners" ON banners FOR DELETE USING (is_admin());

-- Orders (crear y modificar por usuario autenticado)
DROP POLICY IF EXISTS "Users insert own orders" ON orders;
CREATE POLICY "Users insert own orders"
    ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own orders" ON orders;
CREATE POLICY "Users update own orders"
    ON orders FOR UPDATE USING (auth.uid() = user_id);

-- Order Items
DROP POLICY IF EXISTS "Admin insert order_items" ON order_items;
CREATE POLICY "Admin insert order_items" ON order_items FOR INSERT WITH CHECK (is_admin());

-- Settings
DROP POLICY IF EXISTS "Admin modify settings" ON settings;
CREATE POLICY "Admin modify settings" ON settings FOR ALL USING (is_admin());

-- ==========================================
-- DATOS INICIALES
-- ==========================================
INSERT INTO settings (key, value, type) VALUES
    ('store_name', 'Magnolia Novedades', 'string'),
    ('whatsapp_number', '+5493885171795', 'string'),
    ('store_email', 'contacto@magnolia.com', 'string'),
    ('store_address', 'Buenos Aires, Argentina', 'string'),
    ('welcome_message',
     'Bienvenido a Magnolia Novedades - Tu tienda de decoración y accesorios para el hogar',
     'string'),
    ('currency', 'ARS', 'string'),
    ('tax_rate', '0', 'number')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE products IS 'Productos de la tienda';
COMMENT ON TABLE categories IS 'Categorías principales de productos';
COMMENT ON TABLE subcategories IS 'Subcategorías de productos';
COMMENT ON TABLE product_variants IS 'Variantes de productos (color, tamaño)';
COMMENT ON TABLE product_images IS 'Imágenes de productos almacenadas en Supabase Storage';
COMMENT ON TABLE bannerS IS 'Banners animados del sitio web';
COMMENT ON TABLE settings IS 'Configuración general de la tienda';
