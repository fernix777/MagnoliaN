const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// ============================================
// IMPORTAR CLIENTES AL PROYECTO NUEVO
// ============================================

const NEW_SUPABASE_URL = 'https://dsovrmquhgkquqsvkptc.supabase.co';
const NEW_SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3ZybXF1aGdrcXVxc3ZrcHRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkzNzI1MiwiZXhwIjoyMDkxNTEzMjUyfQ.wXoOTwXEJaEA-PHuQ9TfwnvEWpXAd-VkcRRlzKzqtXw';

const supabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_SERVICE_KEY);

async function importCustomers() {
    console.log('📤 Importando clientes al proyecto nuevo...\n');

    // 1. Leer archivo
    const inputFile = 'clientes_exportados.json';
    if (!fs.existsSync(inputFile)) {
        console.error(`❌ No se encontró ${inputFile}`);
        console.log('💡 Ejecuta primero: node exportar_clientes_viejo.js');
        return;
    }

    const customers = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    console.log(`📊 Clientes a importar: ${customers.length}\n`);

    // 2. Crear tabla si no existe
    console.log('1️⃣ Verificando tabla customers...');
    await ensureTableExists();

    // 3. Importar clientes
    console.log('\n2️⃣ Importando clientes...');
    let success = 0;
    let errors = 0;

    for (const customer of customers) {
        try {
            const { error } = await supabase
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
                    source: customer.source || 'migrated'
                }, {
                    onConflict: 'email'
                });

            if (error) {
                console.error(`\n❌ ${customer.email}: ${error.message}`);
                errors++;
            } else {
                success++;
                process.stdout.write(`\r✅ Importados: ${success}/${customers.length}`);
            }
        } catch (err) {
            console.error(`\n❌ ${customer.email}: ${err.message}`);
            errors++;
        }
    }

    // 4. Verificar
    console.log('\n\n3️⃣ Verificando importación...');
    const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

    console.log(`\n🎉 IMPORTACIÓN COMPLETA`);
    console.log(`✅ Importados exitosamente: ${success}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`📊 Total en base de datos: ${count}`);
}

async function ensureTableExists() {
    // Verificar si tabla existe
    const { error: checkError } = await supabase
        .from('customers')
        .select('id')
        .limit(1);

    if (checkError && checkError.code === '42P01') {
        console.log('   Creando tabla customers...');
        
        // Crear tabla via SQL
        const { error: createError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE TABLE customers (
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
                
                CREATE INDEX idx_customers_email ON customers(email);
                
                ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
            `
        });

        if (createError) {
            console.log('   ⚠️ No se pudo crear automáticamente.');
            console.log('   💡 Ejecuta en SQL Editor:');
            console.log(`
CREATE TABLE customers (
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
            `);
            throw new Error('Tabla no existe');
        }
    }
    console.log('   ✅ Tabla customers lista');
}

importCustomers();
