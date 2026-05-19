import { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function ViaCargoRates() {
    const [rates, setRates] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadRates()
    }, [])

    const loadRates = async () => {
        try {
            const res = await fetch('/api/via-cargo/tarifas')
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.error || 'Error del servidor')
            }
            setRates(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Via Cargo error:', error.message)
            toast.error(`Error al cargar tarifas: ${error.message}`)
            setRates([])
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (id, value) => {
        setRates(rates.map(r => r.id === id ? { ...r, price: value } : r))
    }

    const handleSave = async (id, price) => {
        setSaving(true)
        try {
            const res = await fetch(`/api/via-cargo/tarifas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: Number(price) })
            })
            if (!res.ok) throw new Error()
            toast.success('Tarifa actualizada')
        } catch (error) {
            toast.error('Error al actualizar tarifa')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <Toaster position="top-right" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Tarifas Vía Cargo</h1>
                <Link to="/admin/dashboard" className="btn btn-outline">Volver al Dashboard</Link>
            </div>

            {loading ? <LoadingSpinner /> : (
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <p style={{ marginBottom: '20px', color: '#666' }}>Actualiza los costos de envío para los diferentes rangos de peso de Vía Cargo.</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Rango</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Precio (ARS)</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rates.map(rate => (
                                <tr key={rate.id}>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{rate.label}</td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                                        <input
                                            type="number"
                                            value={rate.price}
                                            onChange={(e) => handleChange(rate.id, e.target.value)}
                                            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '120px' }}
                                        />
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                                        <button 
                                            onClick={() => handleSave(rate.id, rate.price)}
                                            disabled={saving}
                                            className="btn btn-primary btn-sm"
                                        >
                                            Guardar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
