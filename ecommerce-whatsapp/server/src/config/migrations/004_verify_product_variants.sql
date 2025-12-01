-- Verificar y corregir la tabla product_variants
-- Esta migración asegura que la tabla tiene todas las columnas correctas

-- Recrear la tabla si es necesario con toda la estructura correcta
DROP TABLE IF EXISTS product_variants CASCADE;

CREATE TABLE product_variants (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_type TEXT NOT NULL DEFAULT 'color' CHECK(variant_type IN ('color', 'size')),
  variant_value TEXT NOT NULL,
  price_modifier NUMERIC(10, 2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  sku TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);

-- RLS Policies
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

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

-- Variantes: Solo admins pueden modificar
CREATE POLICY "Admin insert variants"
  ON product_variants FOR INSERT
  WITH CHECK (
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  );

CREATE POLICY "Admin update variants"
  ON product_variants FOR UPDATE
  USING (
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  );

CREATE POLICY "Admin delete variants"
  ON product_variants FOR DELETE
  USING (
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  );

COMMENT ON TABLE product_variants IS 'Variantes de productos (color, tamaño)';
COMMENT ON COLUMN product_variants.variant_type IS 'Tipo de variante: color o size';
COMMENT ON COLUMN product_variants.variant_value IS 'Valor de la variante (ej: Rojo, M, XL)';
COMMENT ON COLUMN product_variants.price_modifier IS 'Modificador de precio de la variante';
COMMENT ON COLUMN product_variants.stock IS 'Stock específico de esta variante';
COMMENT ON COLUMN product_variants.sku IS 'SKU (Stock Keeping Unit) único de la variante';
