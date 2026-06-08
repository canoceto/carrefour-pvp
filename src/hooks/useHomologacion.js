import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { homologacionService } from '../services'

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
    // MM/DD/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        const [m, d, y] = s.split('/')
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
    const [records,   setRecords]   = useState([])
    const [columnMap, setColumnMap] = useState(null)  // { smsCol, fechaCol }
    const [loading,   setLoading]   = useState(true)
    const [error,     setError]     = useState(null)

    useEffect(() => {
        homologacionService.getAll()
            .then(data => {
                setRecords(data.records || [])
                setColumnMap(data.columnMap || null)
                setLoading(false)
            })
            .catch(err => { setError(err.message); setLoading(false) })
    }, [])

    /** Guarda registros normalizados tras el mapeo de columnas */
    const saveFromExcel = useCallback(async (rawRows, headers, map) => {
        const { smsCol, fechaCol } = map
        const smsIdx   = headers.indexOf(smsCol)
        const fechaIdx = headers.indexOf(fechaCol)

        const normalized = rawRows.map((row, i) => {
            const record = { _rowIndex: i }
            headers.forEach((h, idx) => { record[h] = row[idx] ?? '' })
            // Normalizar fecha
            record[fechaCol] = normalizeDate(row[fechaIdx])
            return record
        }).filter(r => r[smsCol] !== '' && r[fechaCol] !== '')

        const result = await homologacionService.saveAll(normalized, map)
        setRecords(result.records)
        setColumnMap(result.columnMap)
        return result
    }, [])

    const clearAll = useCallback(async () => {
        await homologacionService.clearAll()
        setRecords([])
        setColumnMap(null)
    }, [])

    /** Comprueba si un SMS está homologado en una fecha dada ("YYYY-MM-DD") */
    const isHomologado = useCallback((smsValue, fecha) => {
        if (!smsValue || !fecha || !columnMap) return false
        const { smsCol, fechaCol } = columnMap
        const smsNorm = String(smsValue).trim().toLowerCase()
        return records.some(r =>
            String(r[smsCol] ?? '').trim().toLowerCase() === smsNorm &&
            String(r[fechaCol] ?? '').trim() === fecha
        )
    }, [records, columnMap])

    return { records, columnMap, loading, error, saveFromExcel, clearAll, isHomologado }
}
