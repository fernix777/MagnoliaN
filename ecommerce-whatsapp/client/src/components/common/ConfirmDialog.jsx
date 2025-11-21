import { useState } from 'react'
import './ConfirmDialog.css'

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = '¿Estás seguro?',
    message = 'Esta acción no se puede deshacer.',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger' // 'danger' | 'warning' | 'info'
}) {
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const handleConfirm = async () => {
        setLoading(true)
        await onConfirm()
        setLoading(false)
        onClose()
    }

    return (
        <div className="confirm-dialog-overlay" onClick={onClose}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-dialog-header">
                    <h3>{title}</h3>
                </div>

                <div className="confirm-dialog-body">
                    <p>{message}</p>
                </div>

                <div className="confirm-dialog-footer">
                    <button
                        onClick={onClose}
                        className="btn btn-outline"
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`btn btn-${type}`}
                        disabled={loading}
                    >
                        {loading ? 'Procesando...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
