-- ============================================
-- MIGRACIÓN MANUAL DE CLIENTES
-- Ejecutar en SQL Editor de Supabase
-- ============================================

-- 1. PRIMERO: Crear tabla customers en el proyecto NUEVO
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    source VARCHAR(50),
    notes TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Habilitar RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Política para admin
CREATE POLICY "Admin full access on customers" ON customers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- ============================================
-- 2. EXTRAER DATOS DEL PROYECTO VIEJO
--    Ve a tu proyecto viejo en Supabase y ejecuta:
-- ============================================

-- Ejecutar en PROYECTO VIEJO - Exportar perfiles:
/*
SELECT 
    email,
    full_name,
    phone,
    address,
    city,
    avatar_url
FROM profiles
WHERE email != 'administracion@magnolia.com'
ORDER BY created_at DESC;
*/

-- Ejecutar en PROYECTO VIEJO - Exportar clientes de órdenes:
/*
SELECT DISTINCT
    customer_info->>'email' as email,
    customer_info->>'name' as full_name,
    customer_info->>'phone' as phone,
    customer_info->>'address' as address,
    customer_info->>'city' as city
FROM orders
WHERE customer_info->>'email' IS NOT NULL
ORDER BY customer_info->>'email';
*/

-- ============================================
-- 3. IMPORTAR AL PROYECTO NUEVO
--    Después de obtener los datos, usa INSERT:
-- ============================================

-- Ejemplo de inserción (repetir para cada cliente):
/*
INSERT INTO customers (email, full_name, phone, address, city, source)
VALUES (
    'cliente@email.com',
    'Nombre Cliente',
    '123456789',
    'Dirección 123',
    'Ciudad',
    'migrated'
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    updated_at = NOW();
*/

-- ============================================
-- 4. VERIFICAR IMPORTACIÓN
-- ============================================

SELECT COUNT(*) as total_customers FROM customers;
SELECT * FROM customers ORDER BY created_at DESC LIMIT 10;
