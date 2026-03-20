// Vercel Serverless Function: POST /api/auth/register
// Registra al usuario en Supabase Auth (Admin API) durante el checkout
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { email, first_name, last_name, phone, address, city, state, zip, country } = req.body || {}

    if (!email || !first_name || !last_name || !phone) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: email, first_name, last_name, phone' })
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !serviceKey) {
        return res.status(500).json({ error: 'Supabase environment variables not configured' })
    }

    // Verificar si el usuario ya existe consultando la API de Admin de Supabase
    const listRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
        {
            headers: {
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`
            }
        }
    )
    const listData = await listRes.json()
    if (listData.users && listData.users.length > 0) {
        return res.status(400).json({ error: 'Ya existe una cuenta con este email', code: 'email_exists' })
    }

    // Usar el número de teléfono limpio como contraseña
    const purePhone = phone.replace(/\D/g, '')
    const tempPassword = purePhone.length >= 6 ? purePhone : (purePhone + '123456').substring(0, 6)

    // Crear usuario en Supabase Auth vía Admin REST API
    const createRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`
            },
            body: JSON.stringify({
                email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                    full_name: `${first_name} ${last_name}`.trim(),
                    first_name,
                    last_name,
                    phone,
                    address: address || '',
                    city: city || '',
                    state: state || '',
                    zip: zip || '',
                    country: country || 'AR'
                }
            })
        }
    )

    if (!createRes.ok) {
        const err = await createRes.json()
        console.error('Error creating user (serverless):', err)
        return res.status(500).json({ error: 'No se pudo crear la cuenta', detail: err })
    }

    const newUser = await createRes.json()

    return res.status(201).json({
        message: 'Cuenta creada exitosamente',
        user: {
            id: newUser.id,
            email: newUser.email,
            first_name,
            last_name,
            phone
        },
        tempPassword
    })
}
