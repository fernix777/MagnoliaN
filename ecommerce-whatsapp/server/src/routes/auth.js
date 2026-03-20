import express from 'express'
import bcrypt from 'bcryptjs'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// Registro de usuario
router.post('/register', async (req, res) => {
    try {
        const {
            email,
            first_name,
            last_name,
            phone,
            address,
            city,
            state,
            zip,
            country
        } = req.body

        // Validaciones básicas
        if (!email || !first_name || !last_name || !phone) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios: email, first_name, last_name, phone'
            })
        }

        // Verificar si el usuario ya existe
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single()

        if (existingUser) {
            return res.status(400).json({
                error: 'Ya existe una cuenta con este email'
            })
        }

        // Convertir el teléfono a string de solo números (si tiene menos de 6 caracteres, rellenamos para cumplir con Supabase)
        const purePhone = phone.replace(/\D/g, '')
        const tempPassword = purePhone.length >= 6 ? purePhone : (purePhone + '123456').substring(0, 6)
        const hashedPassword = await bcrypt.hash(tempPassword, 10)

        // Crear usuario en Supabase Auth
        const { data: newUserAuth, error: insertError } = await supabase.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true, // Auto-confirmar para checkout
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
        });

        if (insertError) {
            console.error('Error al crear usuario auth:', insertError)
            return res.status(500).json({
                error: 'No se pudo crear la cuenta'
            })
        }

        // No devolver la contraseña
        const userWithoutPassword = { 
            id: newUserAuth.user.id, 
            email, 
            first_name, 
            last_name, 
            phone 
        };

        res.status(201).json({
            message: 'Cuenta creada exitosamente',
            user: userWithoutPassword,
            tempPassword // Para desarrollo, en producción no se debería devolver
        })

    } catch (error) {
        console.error('Error en registro:', error)
        res.status(500).json({
            error: 'Error interno del servidor'
        })
    }
})

export default router
