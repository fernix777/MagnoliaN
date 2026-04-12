const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// ============================================
// CONFIGURACIÓN - Proyecto VIEJO (origen)
// ============================================
const OLD_SUPABASE_URL = 'https://jxfqkxbgstvlfangaydp.supabase.co';
const OLD_SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4ZnFreGJnc3R2bGZhbmdheWRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0NTMzNSwiZXhwIjoyMDg2NjIxMzM1fQ.j2EMB9w9OTb0CrEWZfUR_PBDdFxLzF2NaSfWHDHCRH0';

// ============================================
// CONFIGURACIÓN - Proyecto NUEVO (destino)
// ============================================
const NEW_SUPABASE_URL = 'https://dsovrmquhgkquqsvkptc.supabase.co';
const NEW_SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3ZybXF1aGdrcXVxc3ZrcHRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkzNzI1MiwiZXhwIjoyMDkxNTEzMjUyfQ.wXoOTwXEJaEA-PHuQ9TfwnvEWpXAd-VkcRRlzKzqtXw';

// Clientes
const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_SERVICE_KEY);
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_SERVICE_KEY);

async function migrateCustomers() {
    console.log('🚀 Iniciando migración de clientes...\n');

    try {
        // ============================================
        // 1. EXTRAER CLIENTES DEL PROYECTO VIEJO
        // ============================================
        console.log('📥 Paso 1: Extrayendo clientes del proyecto viejo...');

        // Obtener usuarios de auth.users (solo clientes, no admins)
        const { data: oldUsers, error: usersError } = await oldSupabase
            .from('auth.users')
            .select('id, email, raw_user_meta_data, created_at, last_sign_in_at')
            .not('email', 'eq', 'administracion@magnolia.com'); // Excluir admin

        if (usersError) {
            console.log('⚠️  No se pudo acceder a auth.users directamente, intentando via profiles...');
        }

        // Obtener perfiles del proyecto viejo
        const { data: oldProfiles, error: profilesError } = await oldSupabase
            .from('profiles')
            .select('*');

        if (profilesError) {
            console.error('❌ Error obteniendo profiles:', profilesError);
            return;
        }

        console.log(`✅ ${oldProfiles?.length || 0} perfiles encontrados en proyecto viejo`);

        // ============================================
        // 2. EXTRAER ÓRDENES PARA OBTENER CLIENTES ADICIONALES
        // ============================================
        console.log('\n📥 Paso 2: Extrayendo clientes de órdenes...');

        const { data: oldOrders, error: ordersError } = await oldSupabase
            .from('orders')
            .select('customer_info, user_id');

        if (ordersError) {
            console.error('❌ Error obteniendo órdenes:', ordersError);
        }

        // Extraer clientes únicos de las órdenes
        const customersFromOrders = [];
        if (oldOrders) {
            const seenEmails = new Set();
            
            for (const order of oldOrders) {
                const customerInfo = order.customer_info;
                if (customerInfo && customerInfo.email) {
                    if (!seenEmails.has(customerInfo.email)) {
                        seenEmails.add(customerInfo.email);
                        customersFromOrders.push({
                            email: customerInfo.email,
                            name: customerInfo.name || customerInfo.full_name || '',
                            phone: customerInfo.phone || customerInfo.whatsapp || '',
                            address: customerInfo.address || '',
                            city: customerInfo.city || '',
                            source: 'order'
                        });
                    }
                }
            }
        }

        console.log(`✅ ${customersFromOrders.length} clientes adicionales de órdenes`);

        // ============================================
        // 3. PREPARAR DATOS PARA MIGRACIÓN
        // ============================================
        console.log('\n📋 Paso 3: Preparando datos para migración...');

        const customersToMigrate = [];

        // Procesar perfiles
        for (const profile of (oldProfiles || [])) {
            customersToMigrate.push({
                email: profile.email,
                full_name: profile.full_name || profile.name || '',
                phone: profile.phone || profile.whatsapp || '',
                address: profile.address || '',
                city: profile.city || '',
                avatar_url: profile.avatar_url || '',
                source: 'profile'
            });
        }

        // Agregar clientes de órdenes que no estén en profiles
        const existingEmails = new Set(customersToMigrate.map(c => c.email?.toLowerCase()));
        for (const customer of customersFromOrders) {
            if (!existingEmails.has(customer.email?.toLowerCase())) {
                customersToMigrate.push(customer);
            }
        }

        console.log(`📊 Total clientes a migrar: ${customersToMigrate.length}`);

        // ============================================
        // 4. INSERTAR EN PROYECTO NUEVO
        // ============================================
        console.log('\n📤 Paso 4: Insertando clientes en proyecto nuevo...');

        // Verificar tabla customers existe
        const { error: checkError } = await newSupabase
            .from('customers')
            .select('id')
            .limit(1);

        if (checkError && checkError.code === '42P01') {
            console.log('⚠️  Tabla customers no existe. Creando...');
            await createCustomersTable();
        }

        let migrated = 0;
        let errors = 0;

        for (const customer of customersToMigrate) {
            if (!customer.email) continue;

            try {
                // Insertar o actualizar cliente
                const { error: insertError } = await newSupabase
                    .from('customers')
                    .upsert({
                        email: customer.email.toLowerCase().trim(),
                        full_name: customer.full_name,
                        phone: customer.phone,
                        address: customer.address,
                        city: customer.city,
                        avatar_url: customer.avatar_url,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        source: customer.source
                    }, {
                        onConflict: 'email'
                    });

                if (insertError) {
                    console.error(`❌ Error insertando ${customer.email}:`, insertError.message);
                    errors++;
                } else {
                    migrated++;
                    process.stdout.write(`\r✅ Migrados: ${migrated}/${customersToMigrate.length}`);
                }
            } catch (err) {
                console.error(`❌ Error con ${customer.email}:`, err.message);
                errors++;
            }
        }

        console.log(`\n\n🎉 MIGRACIÓN COMPLETADA`);
        console.log(`✅ Clientes migrados: ${migrated}`);
        console.log(`❌ Errores: ${errors}`);

    } catch (error) {
        console.error('\n💥 Error en migración:', error);
    }
}

async function createCustomersTable() {
    const createTableSQL = `
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

        -- Políticas RLS
        ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Admin full access on customers" ON customers
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE auth.users.id = auth.uid()
                    AND auth.users.raw_user_meta_data->>'role' = 'admin'
                )
            );
    `;

    const { error } = await newSupabase.rpc('exec_sql', { sql: createTableSQL });
    if (error) {
        console.log('⚠️  No se pudo crear tabla via RPC. Ejecuta este SQL manualmente en Supabase:');
        console.log(createTableSQL);
    }
}

// Ejecutar
migrateCustomers();
