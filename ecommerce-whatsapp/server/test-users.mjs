import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const anonSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  const email = `test_user_passwd_${Date.now()}@example.com`;
  const plainPassword = "123123123";

  console.log('Testing creation with password:', plainPassword, 'for email:', email);

  // Crear
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: plainPassword,
      email_confirm: true,
  });

  if (createError) {
      console.log('Creation failed:', createError.message);
      return;
  }
  
  console.log('Created successfully. ID:', newUser.user.id);
  
  // SignIn
  const { data: signInData, error: signInError } = await anonSupabase.auth.signInWithPassword({
      email: email,
      password: plainPassword
  });
  
  if (signInError) {
      console.log('SignIn failed:', signInError.message);
  } else {
      console.log('SignIn SUCCEEDED!');
  }
}

test();
