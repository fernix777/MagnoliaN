-- ==========================================
-- E-COMMERCE WHATSAPP - DATABASE SCHEMA
-- ==========================================

-- Tabla de usuarios administradores
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de categorías principales
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de subcategorías
CREATE TABLE IF NOT EXISTS subcategories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  category_id INTEGER,
  subcategory_id INTEGER,
  featured BOOLEAN DEFAULT 0,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
);

-- Tabla de imágenes de productos
CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Tabla de variantes de productos (color/tamaño)
CREATE TABLE IF NOT EXISTS product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  variant_type TEXT NOT NULL CHECK(variant_type IN ('color', 'size')),
  variant_value TEXT NOT NULL,
  price_modifier REAL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  sku TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Tabla de zonas de envío por código postal
CREATE TABLE IF NOT EXISTS shipping_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  postal_code_from TEXT NOT NULL,
  postal_code_to TEXT NOT NULL,
  province TEXT NOT NULL,
  locality TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tarifas de envío
CREATE TABLE IF NOT EXISTS shipping_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  carrier TEXT NOT NULL CHECK(carrier IN ('oca', 'andreani', 'correo')),
  zone_id INTEGER,
  base_price REAL NOT NULL,
  price_per_kg REAL DEFAULT 0,
  estimated_days INTEGER,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (zone_id) REFERENCES shipping_zones(id) ON DELETE SET NULL
);

-- Tabla de configuración general
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  type TEXT DEFAULT 'string' CHECK(type IN ('string', 'number', 'boolean', 'json')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
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

-- Insertar configuración inicial
INSERT OR IGNORE INTO settings (key, value, type) VALUES
  ('store_name', 'Deco & Hogar', 'string'),
  ('whatsapp_number', '+5491112345678', 'string'),
  ('store_email', 'contacto@tienda.com', 'string'),
  ('store_address', 'Buenos Aires, Argentina', 'string'),
  ('welcome_message', 'Bienvenido a nuestra tienda de decoración y accesorios para el hogar', 'string'),
  ('currency', 'ARS', 'string'),
  ('tax_rate', '0', 'number');
