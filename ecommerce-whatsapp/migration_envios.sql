-- Módulo de Envíos - Magnolia-N
-- Tabla: products — Campos nuevos a agregar
ALTER TABLE products
  ADD COLUMN weight_g   integer, -- peso en gramos (requerido para ambos métodos)
  ADD COLUMN height_cm  integer, -- alto en cm (requerido para Correo Argentino)
  ADD COLUMN width_cm   integer, -- ancho en cm
  ADD COLUMN length_cm  integer; -- largo en cm

-- Tabla: via_cargo_rates — Nueva tabla
CREATE TABLE via_cargo_rates (
  id          serial PRIMARY KEY,
  label       text    NOT NULL, -- ej: "0kg a 5kg"
  min_g       integer NOT NULL, -- peso mínimo en gramos
  max_g       integer NOT NULL, -- peso máximo en gramos
  price       numeric NOT NULL, -- precio en ARS
  updated_at  timestamptz DEFAULT now()
);

-- Datos iniciales (el admin puede editarlos desde el panel)
INSERT INTO via_cargo_rates (label, min_g, max_g, price) VALUES
  ('0kg a 5kg',     0,     5000,  0),
  ('5.1kg a 10kg',  5001,  10000, 0),
  ('10.1kg a 15kg', 10001, 15000, 0),
  ('15.1kg a 20kg', 15001, 20000, 0);

-- Tabla: orders — Campos de envío a agregar
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_method   text,    -- 'via_cargo' | 'correo_argentino'
  ADD COLUMN IF NOT EXISTS shipping_cost     numeric, -- 0 para vía cargo, precio API para correo
  ADD COLUMN IF NOT EXISTS shipping_label_url text,   -- URL del PDF de etiqueta (solo correo argentino)
  ADD COLUMN IF NOT EXISTS tracking_number   text;    -- número de seguimiento correo argentino
