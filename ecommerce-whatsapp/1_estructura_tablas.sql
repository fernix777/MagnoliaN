-- ============================================
-- 1. CREAR ESTRUCTURA DE TABLAS
-- Magnolia Novedades - Migración Supabase
-- ============================================

-- Crear extensión para UUIDs si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SECUENCIAS PARA IDs AUTO-INCREMENTALES
-- ============================================

CREATE SEQUENCE IF NOT EXISTS categories_id_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS subcategories_id_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS products_id_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS product_images_id_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS product_variants_id_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS banners_id_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS orders_id_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS order_items_id_seq START WITH 1;

-- ============================================
-- TABLA: CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
    id BIGINT PRIMARY KEY DEFAULT nextval('categories_id_seq'),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    active BOOLEAN DEFAULT true,
    parent_id BIGINT,
    CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) 
        REFERENCES categories(id) ON DELETE SET NULL
);

-- ============================================
-- TABLA: SUBCATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS subcategories (
    id BIGINT PRIMARY KEY DEFAULT nextval('subcategories_id_seq'),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    category_id BIGINT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    active BOOLEAN DEFAULT true,
    CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id) 
        REFERENCES categories(id) ON DELETE CASCADE
);

-- ============================================
-- TABLA: PRODUCTS
-- ============================================

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
    sale_types TEXT[] DEFAULT ARRAY['unidad'::text, 'caja'::text, 'bulto'::text],
    CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) 
        REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT products_subcategory_id_fkey FOREIGN KEY (subcategory_id) 
        REFERENCES subcategories(id) ON DELETE SET NULL
);

-- ============================================
-- TABLA: PRODUCT_IMAGES
-- ============================================

CREATE TABLE IF NOT EXISTS product_images (
    id BIGINT PRIMARY KEY DEFAULT nextval('product_images_id_seq'),
    product_id BIGINT NOT NULL,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================
-- TABLA: PRODUCT_VARIANTS
-- ============================================

CREATE TABLE IF NOT EXISTS product_variants (
    id BIGINT PRIMARY KEY DEFAULT nextval('product_variants_id_seq'),
    product_id BIGINT NOT NULL,
    variant_type TEXT NOT NULL DEFAULT 'color',
    variant_value TEXT NOT NULL,
    price_modifier NUMERIC(10,2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    sku TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    active BOOLEAN DEFAULT true,
    CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================
-- TABLA: BANNERS
-- ============================================

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

-- ============================================
-- TABLA: ORDERS
-- ============================================

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

-- ============================================
-- TABLA: ORDER_ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT PRIMARY KEY DEFAULT nextval('order_items_id_seq'),
    order_id BIGINT NOT NULL,
    product_id BIGINT,
    quantity INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    product_name TEXT NOT NULL,
    variant_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    selected_color TEXT,
    selected_condition TEXT,
    purchase_type TEXT DEFAULT 'paquete',
    CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) 
        REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE SET NULL
);

-- ============================================
-- TABLA: PRODUCT_CATEGORIES (RELACIÓN M:N)
-- ============================================

CREATE TABLE IF NOT EXISTS product_categories (
    product_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    subcategory_id BIGINT,
    PRIMARY KEY (product_id, category_id),
    CONSTRAINT product_categories_product_id_fkey FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT product_categories_category_id_fkey FOREIGN KEY (category_id) 
        REFERENCES categories(id) ON DELETE CASCADE,
    CONSTRAINT product_categories_subcategory_id_fkey FOREIGN KEY (subcategory_id) 
        REFERENCES subcategories(id) ON DELETE SET NULL
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

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

-- ============================================
-- ACTUALIZAR SECUENCIAS (para empezar en IDs altos y evitar conflictos)
-- ============================================

SELECT setval('categories_id_seq', 50);
SELECT setval('products_id_seq', 500);
SELECT setval('product_images_id_seq', 500);
SELECT setval('product_variants_id_seq', 500);
SELECT setval('banners_id_seq', 50);
SELECT setval('orders_id_seq', 100);
SELECT setval('order_items_id_seq', 500);
SELECT setval('subcategories_id_seq', 50);

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT 'Estructura creada exitosamente' as status;
