import { useState } from 'react'

const STORAGE_KEY = 'crfpvp_prioridades'

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
    'ALTA O REACTIVACION':          4,
    'ALTA':                         4,
    'REACTIVACION':                 4,
    'INACTIVACION TEMPORAL':        4,
    'BAJA STDO':                    4,
    'CAMBIO PARAMETRIZACIÓN':       5,
    'CAMBIO DE PARAMETRIZACION':    5,
    'EXCEPCION CIAL':               5,
    'POSICIONMIENTO':               2,
}

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) return { ...DEFAULT_PRIORIDADES, ...JSON.parse(raw) }
    } catch {}
    return { ...DEFAULT_PRIORIDADES }
}

function save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

export function usePrioridades() {
    const [prioridades, setPrioridades] = useState(() => load())

    const getPrioridad = (peticion) => prioridades[peticion] ?? 5

    const updatePrioridad = (peticion, nivel) => {
        setPrioridades(prev => {
            const next = { ...prev, [peticion]: Number(nivel) }
            save(next)
            return next
        })
    }

    const resetDefaults = () => {
        setPrioridades({ ...DEFAULT_PRIORIDADES })
        save({ ...DEFAULT_PRIORIDADES })
    }

    return { prioridades, getPrioridad, updatePrioridad, resetDefaults }
}
