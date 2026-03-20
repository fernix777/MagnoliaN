import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const { data, error } = await supabase.auth.admin.listUsers();
if (error) { console.log('Error:', error.message); process.exit(1); }

const target = 'djfernix+800@gmail.com';
const found = data.users.find(u => u.email === target);
if (found) {
  console.log('✅ Usuario ENCONTRADO:');
  console.log('  ID:', found.id);
  console.log('  Email:', found.email);
  console.log('  Creado:', found.created_at);
  console.log('  Confirmado:', found.email_confirmed_at ? 'Sí' : 'No');
  console.log('  Metadata:', JSON.stringify(found.user_metadata, null, 2));
} else {
  console.log('❌ Usuario NO encontrado:', target);
  // Mostrar los últimos 5 usuarios creados
  const recent = data.users.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  console.log('\nÚltimos 5 usuarios creados:');
  recent.forEach(u => console.log(' -', u.email, '|', u.created_at));
}
