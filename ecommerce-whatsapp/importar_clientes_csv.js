const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// ============================================
// CONFIGURACIÓN - Proyecto NUEVO
// ============================================
const NEW_SUPABASE_URL = 'https://dsovrmquhgkquqsvkptc.supabase.co';
const NEW_SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3ZybXF1aGdrcXVxc3ZrcHRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkzNzI1MiwiZXhwIjoyMDkxNTEzMjUyfQ.wXoOTwXEJaEA-PHuQ9TfwnvEWpXAd-VkcRRlzKzqtXw';

const supabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_SERVICE_KEY);

// Archivos CSV
const CSV_FILE_1 = 'Supabase Snippet Fetch Profile Contact Details.csv';
const CSV_FILE_2 = 'Supabase Snippet Fetch Profile Contact Details (1).csv';

function parseCSV(content) {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index]?.replace(/^"|"$/g, '').replace(/""/g, '"') || null;
        });
        return obj;
    });
}

async function importCustomers() {
    console.log('📥 Importando clientes desde CSVs...\n');

    // 1. Leer ambos CSVs
    console.log('1️⃣ Leyendo archivos CSV...');
    
    const csv1Content = fs.readFileSync(CSV_FILE_1, 'utf8');
    const csv2Content = fs.readFileSync(CSV_FILE_2, 'utf8');
    
    const customers1 = parseCSV(csv1Content);
    const customers2 = parseCSV(csv2Content);
    
    console.log(`   CSV 1: ${customers1.length} clientes`);
    console.log(`   CSV 2: ${customers2.length} clientes`);

    // 2. Combinar y eliminar duplicados (por email)
    console.log('\n2️⃣ Combinando y eliminando duplicados...');
    
    const allCustomers = new Map();
    
    // Agregar del primer CSV (básico)
    for (const c of customers1) {
        if (!c.email) continue;
        const email = c.email.toLowerCase().trim();
        if (email === 'administracion@magnolia.com') continue; // Skip admin
        
        allCustomers.set(email, {
            email: email,
            full_name: c.full_name === 'null' ? null : c.full_name,
            phone: c.phone === 'null' ? null : c.phone,
            address: null,
            city: null,
            created_at: c.created_at
        });
    }
    
    // Agregar/actualizar del segundo CSV (con direcciones)
    for (const c of customers2) {
        if (!c.email) continue;
        const email = c.email.toLowerCase().trim();
        if (email === 'administracion@magnolia.com') continue;
        
        const existing = allCustomers.get(email);
        if (existing) {
            // Actualizar con datos más completos
            existing.address = c.address === 'null' ? null : c.address;
            existing.city = c.city === 'null' ? null : c.city;
            if (c.phone && c.phone !== 'null') {
                existing.phone = c.phone;
            }
        } else {
            allCustomers.set(email, {
                email: email,
                full_name: c.full_name === 'null' ? null : c.full_name,
                phone: c.phone === 'null' ? null : c.phone,
                address: c.address === 'null' ? null : c.address,
                city: c.city === 'null' ? null : c.city,
                created_at: new Date().toISOString()
            });
        }
    }
    
    const customersToImport = Array.from(allCustomers.values());
    console.log(`   Total únicos: ${customersToImport.length} clientes`);

    // 3. Crear tabla si no existe
    console.log('\n3️⃣ Verificando tabla customers...');
    await ensureTableExists();

    // 4. Importar a Supabase
    console.log('\n4️⃣ Importando a Supabase...');
    let success = 0;
    let errors = 0;

    for (const customer of customersToImport) {
        try {
            const { error } = await supabase
                .from('customers')
                .upsert({
                    email: customer.email,
                    full_name: customer.full_name,
                    phone: customer.phone,
                    address: customer.address,
                    city: customer.city,
                    created_at: customer.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    source: 'csv_import'
                }, {
                    onConflict: 'email'
                });

            if (error) {
                console.error(`\n❌ ${customer.email}: ${error.message}`);
                errors++;
            } else {
                success++;
                process.stdout.write(`\r✅ Importados: ${success}/${customersToImport.length}`);
            }
        } catch (err) {
            console.error(`\n❌ ${customer.email}: ${err.message}`);
            errors++;
        }
    }

    // 5. Verificar
    console.log('\n\n5️⃣ Verificando importación...');
    const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

    console.log(`\n🎉 IMPORTACIÓN COMPLETA`);
    console.log(`✅ Importados: ${success}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`📊 Total en BD: ${count}`);
}

async function ensureTableExists() {
    const { error: checkError } = await supabase
        .from('customers')
        .select('id')
        .limit(1);

    if (checkError && checkError.code === '42P01') {
        console.log('   Creando tabla customers...');
        
        const { error } = await supabase.rpc('exec_sql', {
            sql: `
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
                CREATE INDEX idx_customers_email ON customers(email);
                ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
            `
        });

        if (error) {
            console.log('   ⚠️ No se pudo crear automáticamente');
            console.log('   Ejecuta este SQL manualmente en Supabase:');
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
CREATE INDEX idx_customers_email ON customers(email);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
            `);
        }
    } else {
        console.log('   ✅ Tabla customers lista');
    }
}

// Ejecutar
importCustomers();
