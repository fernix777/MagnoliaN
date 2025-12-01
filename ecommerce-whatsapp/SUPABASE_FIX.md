# Solución del Error de product_variants

## Problema
Error: "Could not find the 'variant_type' column of 'product_variants' in the schema cache"

## Causa
La tabla `product_variants` en tu Supabase o no existe, o está mal configurada sin la columna `variant_type`.

## Solución

### Paso 1: Acceder a Supabase
1. Ve a https://supabase.com/
2. Ingresa en tu proyecto
3. Ve a "SQL Editor" o "SQL"

### Paso 2: Ejecutar el SQL de Corrección
Copia y ejecuta TODO este SQL en el SQL Editor de Supabase:

```sql
-- Recrear la tabla product_variants si es necesario
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

-- Habilitar RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura
DROP POLICY IF EXISTS "Public read product variants" ON product_variants;
CREATE POLICY "Public read product variants"
  ON product_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_variants.product_id 
      AND products.active = true
    )
  );

-- Políticas de escritura para admins
DROP POLICY IF EXISTS "Admin insert variants" ON product_variants;
CREATE POLICY "Admin insert variants"
  ON product_variants FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin update variants" ON product_variants;
CREATE POLICY "Admin update variants"
  ON product_variants FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Admin delete variants" ON product_variants;
CREATE POLICY "Admin delete variants"
  ON product_variants FOR DELETE
  USING (true);
```

### Paso 3: Prueba
Después de ejecutar el SQL, intenta crear o editar un producto en tu aplicación.

### Si el error persiste
Si aún tienes problemas:
1. Verifica que `variant_type` aparezca en las columnas de `product_variants` en el editor de tablas de Supabase
2. Asegúrate de que RLS está habilitado pero las políticas permitan inserciones
3. Revisa que no haya otras políticas bloqueando las operaciones

## Cambios Realizados en el Código
- ✅ Sincronización correcta entre `selectedColors` y `formData.variants` en ProductForm
- ✅ Cargar productos existentes sin perder datos
- ✅ Guardar variantes con todos los datos (sku, precio, stock)
- ✅ Mejorada manejo de errores en productService
