-- ============================================
-- IMPORTAR CLIENTES DESDE CSV
-- Ejecutar en SQL Editor del Proyecto NUEVO
-- ============================================

-- 1. Crear tabla customers
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    source VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Política para admin
CREATE POLICY IF NOT EXISTS "Admin full access on customers" ON customers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 2. Insertar clientes (ejecutar cada bloque)

-- Clientes básicos del CSV 1
INSERT INTO customers (email, full_name, phone, address, city, created_at, source) VALUES
('dra.ceciliaruiz@hotmail.com', NULL, '3815340014', NULL, NULL, '2026-04-06 16:31:32.188566+00', 'csv_import'),
('cintyalabrujita091@gmail.com', NULL, '3885045130', NULL, NULL, '2026-04-06 12:43:25.994506+00', 'csv_import'),
('armengolyanina2018@gmail.com', NULL, '3794022929', NULL, NULL, '2026-04-01 04:39:15.101103+00', 'csv_import'),
('mivana580@gmail.com', NULL, '3878613727', NULL, NULL, '2026-03-30 20:43:22.815273+00', 'csv_import'),
('chettocarla@gmail.com', NULL, '1170541641', NULL, NULL, '2026-03-28 20:37:06.918685+00', 'csv_import'),
('thiagoponce427@gmail.com', NULL, '2920407913', NULL, NULL, '2026-03-28 19:40:14.111847+00', 'csv_import'),
('gabivrojo@gmail.com', NULL, '1164104033', NULL, NULL, '2026-03-28 15:51:22.930672+00', 'csv_import'),
('adrianasoledadguzman08@gmail.com', NULL, '3854983817', NULL, NULL, '2026-03-26 10:17:37.523763+00', 'csv_import'),
('mcl.66@hotmail.com', NULL, '+543416167672', NULL, NULL, '2026-03-24 12:42:54.906375+00', 'csv_import'),
('lucianaelianav05@gmail.com', NULL, '2995576262', NULL, NULL, '2026-03-24 00:34:31.514531+00', 'csv_import'),
('luisruizdiaz6116@gmail.com', NULL, '1127772880', NULL, NULL, '2026-03-20 15:41:57.061008+00', 'csv_import'),
('djfernix+1000@gmail.com', NULL, '3765016298', NULL, NULL, '2026-03-20 15:30:32.001217+00', 'csv_import'),
('djfernix+900@gmail.com', NULL, '3765016299', NULL, NULL, '2026-03-20 14:58:18.329379+00', 'csv_import'),
('djfernix+700@gmail.com', NULL, '3765016293', NULL, NULL, '2026-03-20 05:24:12.170174+00', 'csv_import'),
('djfernix+600@gmail.com', NULL, '3765016293', NULL, NULL, '2026-03-20 05:13:57.4722+00', 'csv_import'),
('djfernix+500@gmail.com', NULL, '03765016293', NULL, NULL, '2026-03-20 05:03:59.611596+00', 'csv_import'),
('nicanorbenicio@yahoo.com.ar', NULL, NULL, NULL, NULL, '2026-03-20 03:31:53.921971+00', 'csv_import'),
('eugeniagissellebonanni60@gmail.com', NULL, NULL, NULL, NULL, '2026-03-20 01:14:12.960228+00', 'csv_import'),
('tromina279@gmail.com', NULL, NULL, NULL, NULL, '2026-03-19 21:23:11.460355+00', 'csv_import'),
('burgosmelinamarina7@gmail.com', NULL, NULL, NULL, NULL, '2026-03-19 13:51:32.782726+00', 'csv_import')
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = NOW();

-- Más clientes del CSV 2 (con direcciones)
INSERT INTO customers (email, full_name, phone, address, city, source) VALUES
('administracion@magnolia.com', NULL, '01165793538', 'Lopez y Planes 7450', 'San Salvador de Jujuy', 'csv_import'),
('adrianasoledadguzman08@gmail.com', NULL, '3854983817', 'Manzana 104 lote 25 barrio 25 de mayo', 'La banda', 'csv_import'),
('armengolyanina2018@gmail.com', NULL, '3794022929', 'Barrio universitario Agustín maza 5255', 'Corrientes', 'csv_import'),
('bordonveronica807@gmail.com', NULL, '3875125652', 'Barrio Solis Pizarro Ampliacion el ñandu 1819', 'Salta Capital', 'csv_import'),
('camic45@gmail.com', NULL, '388556663', 'Lima 567', 'Caba', 'csv_import'),
('cely9007@gmail.com', NULL, '01172285323', 'palpala 987', 'San Salvador de Jujuy', 'csv_import'),
('cely9007@gmail.com', NULL, '03884148755', 'LIBERTAD 121', 'San Salvador de Jujuy', 'csv_import'),
('cely9007@gmail.com', NULL, '1172285323', 'LIBERTAD 121', 'CABA', 'csv_import'),
('chettocarla@gmail.com', NULL, '1170541641', 'Bragado 6290', 'Wilde', 'csv_import'),
('cintyalabrujita091@gmail.com', NULL, '3885045130', 'Catamontaña y Batalla de Quera', 'San Salvador de Jujuy', 'csv_import'),
('dani34@gmail.com', NULL, '113528559', 'Lima 345', 'Caba', 'csv_import'),
('djfernix@gmail.com', NULL, '01165793538', 'Lopez y Planes 7450', 'San Salvador de Jujuy', 'csv_import'),
('djfernix+1000@gmail.com', NULL, '3765016298', 'corrientes 3973 pb', 'San Salvador de Jujuy', 'csv_import'),
('djfernix+500@gmail.com', NULL, '03765016293', 'av internacional 280', 'San Salvador de Jujuy', 'csv_import'),
('dra.ceciliaruiz@hotmail.com', NULL, '3815340014', 'barrio alto verde 2 mza K lote 27', 'yerba buena', 'csv_import'),
('gabivrojo@gmail.com', NULL, '1164104033', 'General pinto', 'Lanus', 'csv_import'),
('johanaflores2509@gmail.com', NULL, '2966355589', 'Avenida gendarmeria mza 163A Casa 17', 'Río Turbio', 'csv_import'),
('lucianaelianav05@gmail.com', NULL, '2995576262', 'Barrio mosconi grupo 6 duplex 123', 'Plaza Huincul', 'csv_import'),
('luisruizdiaz6116@gmail.com', NULL, '1127772880', 'Conzejal Gomez 4575', 'Gregorio de Laferrere', 'csv_import'),
('majoq56@gmail.com', NULL, '3885060025', 'Manzana 3 lote 23', 'San Salvador de Jujuy', 'csv_import')
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    updated_at = NOW();

-- 3. Verificar importación
SELECT COUNT(*) as total FROM customers;
SELECT * FROM customers ORDER BY created_at DESC LIMIT 10;
