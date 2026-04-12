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
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !serviceKey) {
        console.error('[API Register] Missing env vars:', { supabaseUrl: !!supabaseUrl, serviceKey: !!serviceKey })
        return res.status(500).json({ error: 'Supabase environment variables not configured' })
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

    const responseBody = await createRes.json()

    if (!createRes.ok) {
        // Supabase devuelve 422 cuando el email ya existe
        const isEmailExists = 
            createRes.status === 422 || 
            responseBody?.msg?.includes('already') ||
            responseBody?.message?.includes('already') ||
            responseBody?.error_description?.includes('already')
        
        if (isEmailExists) {
            console.log('Email already exists:', email)
            return res.status(400).json({ error: 'Ya existe una cuenta con este email', code: 'email_exists' })
        }
        
        console.error('Error creating user (serverless):', responseBody)
        return res.status(500).json({ error: 'No se pudo crear la cuenta', detail: responseBody })
    }

    return res.status(201).json({
        message: 'Cuenta creada exitosamente',
        user: {
            id: responseBody.id,
            email: responseBody.email,
            first_name,
            last_name,
            phone
        },
        tempPassword
    })
}
