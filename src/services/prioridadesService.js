/**
 * Servicio de prioridades.
 *
 * API endpoints esperados (modo VITE_API_URL):
 *   GET  /api/prioridades    → { [peticion]: nivel }
 *   PUT  /api/prioridades    → { [peticion]: nivel }  (body: objeto completo)
 *
 * En modo Supabase usa la tabla `prioridades` (ver supabase/schema.sql).
 */

import { apiFetch, isApiMode } from './api'
import { supabase, isSupabaseMode } from './supabaseClient'
import { selectAll } from './supabaseHelpers'
import { DEFAULT_PRIORIDADES } from '../hooks/usePrioridades'

const LS_KEY = 'crfpvp_prioridades'
const TABLE  = 'prioridades'

function lsRead()      { try { const r = localStorage.getItem(LS_KEY); return r ? { ...DEFAULT_PRIORIDADES, ...JSON.parse(r) } : { ...DEFAULT_PRIORIDADES } } catch { return { ...DEFAULT_PRIORIDADES } } }
function lsWrite(data) { try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {} }

export const prioridadesService = {
    async get() {
        if (isApiMode()) return apiFetch('GET', '/api/prioridades')
        if (isSupabaseMode()) {
            const rows = await selectAll(TABLE, { columns: 'peticion, nivel', orderBy: 'peticion' })
            const result = { ...DEFAULT_PRIORIDADES }
            rows.forEach(({ peticion, nivel }) => { result[peticion] = nivel })
            return result
        }
        return lsRead()
    },

    async save(prioridades) {
        if (isApiMode()) return apiFetch('PUT', '/api/prioridades', prioridades)
        if (isSupabaseMode()) {
            const rows = Object.entries(prioridades).map(([peticion, nivel]) => ({ peticion, nivel: Number(nivel) }))
            const { error } = await supabase.from(TABLE).upsert(rows, { onConflict: 'peticion' })
            if (error) throw error
            return prioridades
        }
        lsWrite(prioridades)
        return prioridades
    },
}
