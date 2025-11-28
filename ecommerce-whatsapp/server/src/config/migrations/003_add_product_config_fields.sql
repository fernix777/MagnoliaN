-- Add product configuration fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_colors BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_types TEXT[] DEFAULT ARRAY['unidad', 'caja', 'bulto'];

-- Comments on columns
COMMENT ON COLUMN products.has_colors IS 'Indica si el producto tiene opciones de color disponibles';
COMMENT ON COLUMN products.sale_types IS 'Array de tipos de venta disponibles: unidad, caja, bulto';
