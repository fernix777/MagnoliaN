import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dsovrmquhgkquqsvkptc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3ZybXF1aGdrcXVxc3ZrcHRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkzNzI1MiwiZXhwIjoyMDkxNTEzMjUyfQ.wXoOTwXEJaEA-PHuQ9TfwnvEWpXAd-VkcRRlzKzqtXw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('📋 Listando todos los usuarios en Supabase Auth...\n');

const { data, error } = await supabase.auth.admin.listUsers();

if (error) {
  console.log('❌ Error:', error.message);
  process.exit(1);
}

if (data.users.length === 0) {
  console.log('⚠️  No hay usuarios registrados en Supabase Auth.');
} else {
  console.log(`✅ Total usuarios encontrados: ${data.users.length}\n`);
  data.users.forEach((u, i) => {
    console.log(`--- Usuario ${i + 1} ---`);
    console.log('  Email   :', u.email);
    console.log('  ID      :', u.id);
    console.log('  Confirm.:', u.email_confirmed_at ? '✅ Confirmado' : '❌ Sin confirmar');
    console.log('  Role    :', u.user_metadata?.role ?? '(sin role)');
    console.log('  Creado  :', u.created_at);
    console.log('  Metadata:', JSON.stringify(u.user_metadata));
    console.log('');
  });
}
