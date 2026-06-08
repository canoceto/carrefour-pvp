import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { homologacionService } from '../services'

/**
 * Fuentes de homologación admitidas. Cada una se sube y guarda de forma
 * independiente: tiene su propio fichero, fecha de carga (el día que
 * representa esos datos) y columna de código SMS.
 */
export const FUENTES_HOMOLOGACION = [
    { id: 'homologos_drive',      nombre: 'Homólogos Drive',      hint: 'Maestro de homólogos y coeficientes (hoja ARTÍCULOS)' },
    { id: 'homologacion_inversa', nombre: 'Homologación Inversa', hint: 'SMS homologados / sin match frente a la competencia' },
    { id: 'sms_dashboard',        nombre: 'SMS Dashboard',        hint: 'Panel de SMS creados / actualizados' },
]

/** Normaliza fechas de Excel a "YYYY-MM-DD" */
function normalizeDate(value) {
    if (!value && value !== 0) return ''
    // Serial numérico de Excel
    if (typeof value === 'number') {
        const date = XLSX.SSF.parse_date_code(value)
        if (date) {
            const m = String(date.m).padStart(2, '0')
            const d = String(date.d).padStart(2, '0')
            return `${date.y}-${m}-${d}`
        }
    }
    const s = String(value).trim()
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        const [d, m, y] = s.split('/')
        return `${y}-${m}-${d}`
    }
    // Intentar con Date nativo
    const dt = new Date(s)
    if (!isNaN(dt)) return dt.toISOString().split('T')[0]
    return s
}

/** Parsea un archivo Excel y devuelve { headers, rows } */
export function parseExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => {
            try {
                const wb = XLSX.read(e.target.result, { type: 'binary', cellDates: false })
                const ws = wb.Sheets[wb.SheetNames[0]]
                const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
                if (data.length === 0) return resolve({ headers: [], rows: [] })
                const headers = data[0].map(h => String(h).trim())
                const rows = data.slice(1).filter(r => r.some(c => c !== ''))
                resolve({ headers, rows })
            } catch (err) {
                reject(err)
            }
        }
        reader.onerror = reject
        reader.readAsBinaryString(file)
    })
}

export function useHomologacion() {
    const [fuentes, setFuentes] = useState({})  // { [fuenteId]: { nombre, fileName, fecha, smsCol, records, updatedAt } }
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState(null)

    useEffect(() => {
        homologacionService.getAll()
            .then(data => { setFuentes(data || {}); setLoading(false) })
            .catch(err => { setError(err.message); setLoading(false) })
    }, [])

    /** Guarda (o reemplaza) los registros de una fuente concreta tras el mapeo de columnas */
    const saveFuente = useCallback(async (fuenteId, rawRows, headers, map) => {
        const { smsCol, fecha, fileName } = map
        const smsIdx = headers.indexOf(smsCol)

        const records = rawRows.map((row, i) => {
            const record = { _rowIndex: i }
            headers.forEach((h, idx) => { record[h] = row[idx] ?? '' })
            return record
        }).filter(r => String(r[smsCol] ?? '').trim() !== '')

        const meta = FUENTES_HOMOLOGACION.find(f => f.id === fuenteId)
        const fuente = {
            nombre: meta?.nombre ?? fuenteId,
            fileName: fileName ?? '',
            fecha: normalizeDate(fecha),
            smsCol,
            records,
            updatedAt: new Date().toISOString(),
        }

        const saved = await homologacionService.saveFuente(fuenteId, fuente)
        setFuentes(prev => ({ ...prev, [fuenteId]: saved }))
        return saved
    }, [])

    const clearFuente = useCallback(async (fuenteId) => {
        await homologacionService.clearFuente(fuenteId)
        setFuentes(prev => {
            const next = { ...prev }
            delete next[fuenteId]
            return next
        })
    }, [])

    /**
     * Comprueba si un SMS está homologado para una fecha dada ("YYYY-MM-DD"),
     * buscando en todas las fuentes cuya fecha de carga coincida con esa fecha.
     * Devuelve { homologado, fuentes } donde `fuentes` indica dónde se encontró.
     */
    const isHomologado = useCallback((smsValue, fecha) => {
        if (!smsValue || !fecha) return { homologado: false, fuentes: [] }
        const smsNorm = String(smsValue).trim().toLowerCase()

        const encontradas = Object.entries(fuentes)
            .filter(([, f]) => f && f.smsCol && f.fecha === fecha)
            .filter(([, f]) => f.records.some(r => String(r[f.smsCol] ?? '').trim().toLowerCase() === smsNorm))
            .map(([id, f]) => ({ id, nombre: f.nombre }))

        return { homologado: encontradas.length > 0, fuentes: encontradas }
    }, [fuentes])

    return { fuentes, loading, error, saveFuente, clearFuente, isHomologado }
}
