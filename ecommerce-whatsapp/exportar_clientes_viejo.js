const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// ============================================
// EXPORTAR CLIENTES DEL PROYECTO VIEJO
// ============================================

const OLD_SUPABASE_URL = 'https://jxfqkxbgstvlfangaydp.supabase.co';
const OLD_SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4ZnFreGJnc3R2bGZhbmdheWRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA0NTMzNSwiZXhwIjoyMDg2NjIxMzM1fQ.j2EMB9w9OTb0CrEWZfUR_PBDdFxLzF2NaSfWHDHCRH0';

const supabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_SERVICE_KEY);

async function exportCustomers() {
    console.log('📥 Exportando clientes del proyecto viejo...\n');

    const customers = [];

    // 1. Exportar de profiles
    console.log('1️⃣ Exportando perfiles...');
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');

    if (profileError) {
        console.error('❌ Error:', profileError);
    } else {
        console.log(`✅ ${profiles?.length || 0} perfiles encontrados`);
        
        for (const p of (profiles || [])) {
            if (p.email && p.email !== 'administracion@magnolia.com') {
                customers.push({
                    email: p.email,
                    full_name: p.full_name || p.name || '',
                    phone: p.phone || p.whatsapp || '',
                    address: p.address || '',
                    city: p.city || '',
                    avatar_url: p.avatar_url || '',
                    source: 'profile'
                });
            }
        }
    }

    // 2. Exportar de órdenes
    console.log('\n2️⃣ Exportando clientes de órdenes...');
    const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('customer_info');

    if (orderError) {
        console.error('❌ Error:', orderError);
    } else {
        const seen = new Set(customers.map(c => c.email.toLowerCase()));
        let newCustomers = 0;

        for (const order of (orders || [])) {
            const info = order.customer_info;
            if (info && info.email) {
                const email = info.email.toLowerCase().trim();
                if (!seen.has(email)) {
                    seen.add(email);
                    customers.push({
                        email: info.email,
                        full_name: info.name || info.full_name || '',
                        phone: info.phone || info.whatsapp || '',
                        address: info.address || '',
                        city: info.city || '',
                        source: 'order'
                    });
                    newCustomers++;
                }
            }
        }
        console.log(`✅ ${newCustomers} clientes nuevos de órdenes`);
    }

    // 3. Guardar a archivo
    const outputFile = 'clientes_exportados.json';
    fs.writeFileSync(outputFile, JSON.stringify(customers, null, 2));

    console.log(`\n🎉 EXPORTACIÓN COMPLETA`);
    console.log(`📊 Total clientes: ${customers.length}`);
    console.log(`💾 Guardado en: ${outputFile}`);
    console.log(`\n📋 Resumen:`);
    console.log(`- De profiles: ${customers.filter(c => c.source === 'profile').length}`);
    console.log(`- De órdenes: ${customers.filter(c => c.source === 'order').length}`);
}

exportCustomers();
