import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import './ImageUploader.css'

export default function ImageUploader({ images, onChange, maxImages = 10 }) {
    const [draggedIndex, setDraggedIndex] = useState(null)

    const onDrop = (acceptedFiles) => {
        // Validar número máximo de imágenes
        if (images.length + acceptedFiles.length > maxImages) {
            alert(`Máximo ${maxImages} imágenes permitidas`)
            return
        }

        // Validar tamaño de cada archivo
        const validFiles = acceptedFiles.filter(file => {
            if (file.size > 5 * 1024 * 1024) {
                alert(`${file.name} es muy grande. Máximo 5MB por imagen.`)
                return false
            }
            return true
        })

        // Crear objetos de imagen con preview
        const newImages = validFiles.map((file, index) => ({
            file,
            preview: URL.createObjectURL(file),
            is_primary: images.length === 0 && index === 0,
            display_order: images.length + index
        }))

        onChange([...images, ...newImages])
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        multiple: true
    })

    const removeImage = (index) => {
        // Marcar como eliminada si tiene id de BD, o remover si es solo preview sin guardar
        const image = images[index]
        if (image.id) {
            onChange(images.map((img, i) => i === index ? { ...img, _deleted: true } : img))
        } else {
            const newImages = images.filter((_, i) => i !== index)
            onChange(newImages)
        }
    }

    const setPrimary = (index) => {
        // No permitir marcar como principal una imagen marcada para eliminar
        if (images[index]._deleted) return
        const newImages = images.map((img, i) => ({
            ...img,
            is_primary: i === index
        }))
        onChange(newImages)
    }

    const handleDragStart = (index) => {
        setDraggedIndex(index)
    }

    const handleDragOver = (e, index) => {
        e.preventDefault()

            if (draggedIndex === null || draggedIndex === index) return

            // No permitir reordenar imagen marcada para eliminar
            if (newImages[draggedIndex]._deleted) return

            const newImages = [...images]
            const draggedImage = newImages[draggedIndex]

            // Remover de posición original
            newImages.splice(draggedIndex, 1)

            // Insertar en nueva posición
            newImages.splice(index, 0, draggedImage)

        // Actualizar display_order
        newImages.forEach((img, i) => {
            img.display_order = i
        })

        onChange(newImages)
        setDraggedIndex(index)
    }

    const handleDragEnd = () => {
        setDraggedIndex(null)
    }

    return (
        <div className="image-uploader">
            <div className="upload-info">
                <p>Imágenes del producto ({images.filter(img => !img._deleted).length}/{maxImages})</p>
                <span>Arrastra para reordenar. Click en ⭐ para marcar como principal. × para eliminar.</span>
            </div>

            {images.length > 0 && (
                <div className="images-preview">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className={`image-preview-item ${image.is_primary ? 'primary' : ''} ${image._deleted ? 'deleted' : ''}`}
                            draggable={!image._deleted}
                            onDragStart={() => !image._deleted && handleDragStart(index)}
                            onDragOver={(e) => !image._deleted && handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                        >
                            <img
                                src={image.preview || image.image_url}
                                alt={`Preview ${index + 1}`}
                            />

                            <div className="image-overlay">
                                <button
                                    type="button"
                                    onClick={() => setPrimary(index)}
                                    className={`primary-btn ${image.is_primary ? 'active' : ''}`}
                                    title="Marcar como principal"
                                >
                                    ⭐
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="remove-btn"
                                    title="Eliminar imagen"
                                >
                                    ×
                                </button>
                            </div>

                            {image._deleted && (
                                <div className="deleted-overlay"></div>
                            )}
                            {image._deleted && (
                                <span className="deleted-badge">Eliminada</span>
                            )}
                            {image.is_primary && !image._deleted && (
                                <span className="primary-badge">Principal</span>
                            )}

                            <span className="order-badge">{index + 1}</span>
                        </div>
                    ))}
                </div>
            )}

            {images.length < maxImages && (
                <div
                    {...getRootProps()}
                    className={`dropzone ${isDragActive ? 'active' : ''}`}
                >
                    <input {...getInputProps()} />
                    <div className="dropzone-content">
                        <div className="upload-icon">📷</div>
                        {isDragActive ? (
                            <p>Suelta las imágenes aquí...</p>
                        ) : (
                            <>
                                <p>Arrastra imágenes aquí o click para seleccionar</p>
                                <span>JPG, PNG o WebP (máx. 5MB cada una)</span>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
