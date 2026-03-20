import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar env manualmente
dotenv.config({ path: 'c:/Users/Tienda Ssh/Downloads/MagnoliaN-main/MagnoliaN-fresh/ecommerce-whatsapp/server/.env' });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

console.log('URL:', url);
console.log('KEY:', key ? key.substring(0, 20) + '...' + key.substring(key.length - 10) : 'undefined');

try {
  const supabase = createClient(url, key);
  
  // Test 1: table access
  const { data: d1, error: e1 } = await supabase.from('users').select('id').limit(1);
  console.log('Table fetch:', e1 ? 'ERROR: ' + e1.message : 'SUCCESS');
  
  // Test 2: auth admin
  const { data: d2, error: e2 } = await supabase.auth.admin.listUsers();
  console.log('Admin fetch:', e2 ? 'ERROR: ' + e2.message : `SUCCESS (${d2?.users?.length} users)`);
  
} catch (e) {
  console.error("Crash:", e);
}
