import { useState, useEffect, useCallback } from 'react'
import { prioridadesService } from '../services'

export const NIVEL_LABELS = {
    1: 'Urgente',
    2: 'Alta',
    3: 'Media',
    4: 'Baja',
    5: 'Normal',
}

export const DEFAULT_PRIORIDADES = {
    'ERROR PVP':                    1,
    'ERROR CHEQUEO':                1,
    'MARGEN NEGATIVO':              1,
    'STICKER':                      1,
    'CAMBIO PVP / POSICIONAMIENTO': 2,
    'LIBERAR PRECIO':               2,
    'ETIQUETADO PROVEEDOR':         2,
    'HOMOLOGACIÓN':                 3,
    'PROCESO TARIFARIO':            3,
    'ALTA':          4,
    'REACTIVACION':                 4,
    'INACTIVACION TEMPORAL':        4,
    'BAJA STDO':                    4,
    'CAMBIO PARAMETRIZACIÓN':       5,
    'CAMBIO DE PARAMETRIZACION':    5,
    'EXCEPCION CIAL':               5,
    'POSICIONMIENTO':               2,
}

export function usePrioridades(ready = true) {
    const [prioridades, setPrioridades] = useState({ ...DEFAULT_PRIORIDADES })
    const [loading,     setLoading]     = useState(true)

    useEffect(() => {
        if (!ready) return
        prioridadesService.get()
            .then(data => { setPrioridades(data); setLoading(false) })
            .catch(() => setLoading(false))
    }, [ready])

    const getPrioridad = useCallback((peticion) => prioridades[peticion] ?? 5, [prioridades])

    const updatePrioridad = useCallback(async (peticion, nivel) => {
        const next = { ...prioridades, [peticion]: Number(nivel) }
        setPrioridades(next)
        try {
            await prioridadesService.save(next)
        } catch {
            setPrioridades(prioridades) // rollback
        }
    }, [prioridades])

    const resetDefaults = useCallback(async () => {
        const def = { ...DEFAULT_PRIORIDADES }
        setPrioridades(def)
        try {
            await prioridadesService.save(def)
        } catch {}
    }, [])

    return { prioridades, loading, getPrioridad, updatePrioridad, resetDefaults }
}
