import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dsovrmquhgkquqsvkptc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3ZybXF1aGdrcXVxc3ZrcHRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkzNzI1MiwiZXhwIjoyMDkxNTEzMjUyfQ.wXoOTwXEJaEA-PHuQ9TfwnvEWpXAd-VkcRRlzKzqtXw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ADMIN_ID = '05bbab85-0d2a-46d6-977d-f01184d524df';
const NEW_PASSWORD = 'Magnolia2026!';

console.log('🔐 Actualizando contraseña del admin...');

const { data, error } = await supabase.auth.admin.updateUserById(ADMIN_ID, {
  password: NEW_PASSWORD,
});

if (error) {
  console.log('❌ Error:', error.message);
} else {
  console.log('✅ Contraseña actualizada correctamente!');
  console.log('📧 Email   : administracion@magnolia.com');
  console.log('🔑 Password:', NEW_PASSWORD);
}
