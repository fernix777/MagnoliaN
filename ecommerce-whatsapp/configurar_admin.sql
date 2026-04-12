-- =====================================================
-- CONFIGURAR ADMIN: administracion@magnolia.com
-- =====================================================

-- 1. Primero, crear el usuario en auth (si no existe)
-- Esto debe hacerse desde el panel de Supabase o con la API de auth
-- Vamos a usar la función de SQL para crear el usuario

-- Crear usuario en auth.users
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
)
VALUES (
    gen_random_uuid(),
    'administracion@magnolia.com',
    crypt('AdminMagnolia2024!', gen_salt('bf')),  -- Contraseña temporal
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin","name":"Administrador"}'
)
ON CONFLICT (email) DO UPDATE SET
    raw_app_meta_data = '{"provider":"email","providers":["email"]}',
    raw_user_meta_data = '{"role":"admin","name":"Administrador"}',
    updated_at = NOW()
RETURNING id, email;

-- 2. Crear/Actualizar perfil en tabla profiles (si existe)
-- Verificar si existe tabla profiles
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        INSERT INTO profiles (id, email, role, name, created_at, updated_at)
        SELECT 
            id,
            email,
            'admin',
            'Administrador',
            NOW(),
            NOW()
        FROM auth.users 
        WHERE email = 'administracion@magnolia.com'
        ON CONFLICT (id) DO UPDATE SET
            role = 'admin',
            updated_at = NOW();
    END IF;
END $$;

-- 3. Configurar políticas RLS para panel de admin
-- Verificar si existe tabla users
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        -- Actualizar rol en users
        UPDATE users 
        SET role = 'admin', 
            is_admin = true,
            updated_at = NOW()
        WHERE email = 'administracion@magnolia.com';
        
        -- Si no existe, crearlo
        INSERT INTO users (email, role, is_admin, created_at, updated_at)
        SELECT 'administracion@magnolia.com', 'admin', true, NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'administracion@magnolia.com');
    END IF;
END $$;

-- =====================================================
-- INSTRUCCIONES:
-- =====================================================
-- 1. Ve a SQL Editor en Supabase
-- 2. Pega este script completo
-- 3. Ejecuta
-- 4. El usuario administracion@magnolia.com será admin
-- 5. Contraseña temporal: AdminMagnolia2024!
-- 6. IMPORTANTE: Cambiar la contraseña después del primer login
-- =====================================================
