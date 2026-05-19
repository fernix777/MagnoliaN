require('dotenv').config({ path: './server/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_KEY en server/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  const email = 'administracion@magnolia.com';
  const password = '123456';

  console.log(`Intentando crear usuario: ${email}`);

  // 1. Crear el usuario en auth.users
  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Auto-confirmar el email
    user_metadata: {
      role: 'admin'
    }
  });

  if (error) {
    if (error.message.includes('already registered')) {
        console.log('El usuario ya existe. Actualizando su contraseña y rol...');
        
        // Obtener el usuario para actualizarlo
        const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
             console.error('Error al listar usuarios:', listError.message);
             return;
        }
        
        const existingUser = usersData.users.find(u => u.email === email);
        if (existingUser) {
            const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
                existingUser.id,
                { 
                    password: password,
                    user_metadata: { role: 'admin' }
                }
            );
            if (updateError) {
                console.error('Error al actualizar usuario:', updateError.message);
            } else {
                console.log('Usuario actualizado exitosamente a administrador.');
            }
        }
    } else {
        console.error('Error al crear usuario:', error.message);
    }
  } else {
    console.log('✅ Administrador creado exitosamente!');
    console.log(`ID: ${data.user.id}`);
  }
}

createAdmin();
