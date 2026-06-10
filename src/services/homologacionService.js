/**
 * Servicio de homologaciones.
 *
 * Cada "fuente" se sube y se guarda de forma independiente, identificada por
 * un id fijo (ver FUENTES_HOMOLOGACION en useHomologacion.js).
 *
 * API endpoints esperados (modo VITE_API_URL):
 *   GET    /api/homologaciones                → { [fuenteId]: HomologacionFuente }
 *   PUT    /api/homologaciones/:fuenteId      → HomologacionFuente  (body: HomologacionFuente)
 *   DELETE /api/homologaciones/:fuenteId      → 204
 *
 * En modo Supabase, los metadatos de cada fuente viven en `homologacion_fuentes`
 * y los `records` (filas dinámicas con las cabeceras originales del Excel) se
 * guardan tal cual en la columna `extra` (JSONB) de la tabla correspondiente
 * (ver supabase/schema.sql). Para `pvp_peninsula_pft` además se extraen a
 * columnas propias los campos que usa PanelView (ID_UDS, UDS, precios de
 * Mercadona/LIDL/Alcampo con y sin promo).
 */

import { apiFetch, isApiMode } from './api'
import { supabase, isSupabaseMode } from './supabaseClient'
import { selectAll, insertInBatches, deleteAll } from './supabaseHelpers'

const LS_KEY = 'crfpvp_homologaciones'

const FUENTE_TABLES = {
    homologos_drive:     'homologos_drive_articulos',
    datos_homologos_pft: 'homologos_pft',
    pvp_peninsula_pft:   'pvp_peninsula_pft',
    sms_dashboard:       'sms_dashboard',
}

const SOLO_CONSULTA = new Set(['pvp_peninsula_pft'])

function lsRead()      { try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} } }
function lsWrite(data) { try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {} }

function toNumericOrNull(v) {
    if (v === '' || v === null || v === undefined) return null
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
    return isNaN(n) ? null : n
}

function toBigIntOrNull(v) {
    if (v === '' || v === null || v === undefined) return null
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
    return isNaN(n) ? null : Math.trunc(n)
}

/** Convierte los `records` (filas dinámicas con cabeceras de Excel) en filas para Supabase. */
function recordsToRows(fuenteId, fuente) {
    const { records, smsCol, fecha } = fuente
    return records.map(record => {
        const row = {
            fuente_fecha: fecha || null,
            sms: toBigIntOrNull(record[smsCol]),
            extra: record,
        }
        if (fuenteId === 'pvp_peninsula_pft') {
            row.id_uds = record['ID_UDS'] ?? record['ID UDS'] ?? null
            row.uds    = record['UDS'] ?? null
            row.pvp_mercadona          = toNumericOrNull(record['MERCADONA'])
            row.pvp_mercadona_no_promo = toNumericOrNull(record['MERCADONA NoPromo'])
            row.pvp_lidl               = toNumericOrNull(record['LIDL'])
            row.pvp_lidl_no_promo      = toNumericOrNull(record['LIDL NoPromo'])
            row.pvp_alcampo            = toNumericOrNull(record['ALCAMPO'])
            row.pvp_alcampo_no_promo   = toNumericOrNull(record['ALCAMPO NoPromo'])
        }
        return row
    })
}

export const homologacionService = {
    async getAll() {
        if (isApiMode()) return apiFetch('GET', '/api/homologaciones')
        if (isSupabaseMode()) {
            const metas = await selectAll('homologacion_fuentes', { columns: '*', orderBy: 'id' })

            const result = {}
            for (const meta of metas) {
                const table = FUENTE_TABLES[meta.id]
                if (!table) continue
                const rows = await selectAll(table, { columns: 'extra', orderBy: 'id' })
                result[meta.id] = {
                    nombre: meta.nombre,
                    fileName: meta.file_name ?? '',
                    fecha: meta.fecha ?? '',
                    smsCol: meta.sms_col ?? '',
                    records: rows.map(r => r.extra ?? {}),
                    updatedAt: meta.updated_at,
                }
            }
            return result
        }
        const data = lsRead()
        return Array.isArray(data) ? {} : data
    },

    async saveFuente(fuenteId, fuente) {
        if (isApiMode()) {
            return apiFetch('PUT', `/api/homologaciones/${encodeURIComponent(fuenteId)}`, fuente)
        }
        if (isSupabaseMode()) {
            const table = FUENTE_TABLES[fuenteId]
            if (!table) throw new Error(`Fuente de homologación desconocida: ${fuenteId}`)

            const { error: metaErr } = await supabase.from('homologacion_fuentes').upsert({
                id: fuenteId,
                nombre: fuente.nombre,
                file_name: fuente.fileName ?? '',
                fecha: fuente.fecha || null,
                sms_col: fuente.smsCol ?? '',
                solo_consulta: SOLO_CONSULTA.has(fuenteId),
                updated_at: fuente.updatedAt || new Date().toISOString(),
            }, { onConflict: 'id' })
            if (metaErr) throw metaErr

            // Reemplazo completo de los registros de esta fuente
            await deleteAll(table)
            await insertInBatches(table, recordsToRows(fuenteId, fuente))

            return fuente
        }

        const all = lsRead()
        const data = Array.isArray(all) ? {} : all
        data[fuenteId] = fuente
        lsWrite(data)
        return fuente
    },

    async clearFuente(fuenteId) {
        if (isApiMode()) {
            return apiFetch('DELETE', `/api/homologaciones/${encodeURIComponent(fuenteId)}`)
        }
        if (isSupabaseMode()) {
            const table = FUENTE_TABLES[fuenteId]
            if (table) await deleteAll(table)
            const { error } = await supabase.from('homologacion_fuentes').delete().eq('id', fuenteId)
            if (error) throw error
            return null
        }
        const all = lsRead()
        const data = Array.isArray(all) ? {} : all
        delete data[fuenteId]
        lsWrite(data)
        return null
    },
}
