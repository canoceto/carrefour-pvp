/**
 * Servicio de prioridades.
 *
 * API endpoints esperados:
 *   GET  /api/prioridades    → { [peticion]: nivel }
 *   PUT  /api/prioridades    → { [peticion]: nivel }  (body: objeto completo)
 */

import { apiFetch, isApiMode } from './api'
import { DEFAULT_PRIORIDADES } from '../hooks/usePrioridades'

const LS_KEY = 'crfpvp_prioridades'

function lsRead()      { try { const r = localStorage.getItem(LS_KEY); return r ? { ...DEFAULT_PRIORIDADES, ...JSON.parse(r) } : { ...DEFAULT_PRIORIDADES } } catch { return { ...DEFAULT_PRIORIDADES } } }
function lsWrite(data) { try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {} }

export const prioridadesService = {
    async get() {
        if (isApiMode()) return apiFetch('GET', '/api/prioridades')
        return lsRead()
    },

    async save(prioridades) {
        if (isApiMode()) return apiFetch('PUT', '/api/prioridades', prioridades)
        lsWrite(prioridades)
        return prioridades
    },
}
