import { useState, useEffect, useCallback } from 'react'
import { solicitudesService } from '../services'

export function useSolicitudes(ready = true) {
    const [solicitudes, setSolicitudes] = useState([])
    const [loading,     setLoading]     = useState(true)
    const [error,       setError]       = useState(null)

    useEffect(() => {
        if (!ready) return
        solicitudesService.getAll()
            .then(data => { setSolicitudes(data); setLoading(false) })
            .catch(err => { setError(err.message); setLoading(false) })
    }, [ready])

    const addSolicitud = useCallback(async (solicitud) => {
        // Optimistic: muestra inmediatamente en la UI
        setSolicitudes(prev => [...prev, solicitud])
        try {
            const saved = await solicitudesService.create(solicitud)
            // Reemplaza con la respuesta del servidor (por si el backend añade campos)
            setSolicitudes(prev => prev.map(s => s.id === solicitud.id ? saved : s))
        } catch (err) {
            // Rollback
            setSolicitudes(prev => prev.filter(s => s.id !== solicitud.id))
            throw err
        }
    }, [])

    const updateSolicitud = useCallback(async (id, changes) => {
        // Optimistic
        setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s))
        try {
            await solicitudesService.update(id, changes)
        } catch (err) {
            // Recargar estado desde la fuente en caso de error
            solicitudesService.getAll()
                .then(setSolicitudes)
                .catch(() => {})
            throw err
        }
    }, [])

    return { solicitudes, loading, error, addSolicitud, updateSolicitud }
}
