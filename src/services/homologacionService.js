/**
 * Servicio de homologaciones.
 *
 * Cada "fuente" se sube y se guarda de forma independiente, identificada por
 * un id fijo (ver FUENTES_HOMOLOGACION en useHomologacion.js).
 *
 * API endpoints esperados:
 *   GET    /api/homologaciones                → { [fuenteId]: HomologacionFuente }
 *   PUT    /api/homologaciones/:fuenteId      → HomologacionFuente  (body: HomologacionFuente)
 *   DELETE /api/homologaciones/:fuenteId      → 204
 */

import { apiFetch, isApiMode } from './api'

const LS_KEY = 'crfpvp_homologaciones'

function lsRead()      { try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} } }
function lsWrite(data) { try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {} }

export const homologacionService = {
    async getAll() {
        if (isApiMode()) return apiFetch('GET', '/api/homologaciones')
        const data = lsRead()
        return Array.isArray(data) ? {} : data
    },

    async saveFuente(fuenteId, fuente) {
        if (isApiMode()) {
            return apiFetch('PUT', `/api/homologaciones/${encodeURIComponent(fuenteId)}`, fuente)
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
        const all = lsRead()
        const data = Array.isArray(all) ? {} : all
        delete data[fuenteId]
        lsWrite(data)
        return null
    },
}
