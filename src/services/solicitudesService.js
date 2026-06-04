/**
 * Servicio de solicitudes.
 *
 * API endpoints esperados:
 *   GET    /api/solicitudes           → Solicitud[]
 *   POST   /api/solicitudes           → Solicitud  (body: Solicitud)
 *   PATCH  /api/solicitudes/:id       → Solicitud  (body: Partial<Solicitud>)
 *   DELETE /api/solicitudes/:id       → 204
 */

import { apiFetch, isApiMode } from './api'

const LS_KEY = 'crfpvp_solicitudes'

function lsRead()      { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] } }
function lsWrite(data) { try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {} }

export const solicitudesService = {
    async getAll() {
        if (isApiMode()) return apiFetch('GET', '/api/solicitudes')
        return lsRead()
    },

    async create(solicitud) {
        if (isApiMode()) return apiFetch('POST', '/api/solicitudes', solicitud)
        const list = lsRead()
        lsWrite([...list, solicitud])
        return solicitud
    },

    async update(id, changes) {
        if (isApiMode()) return apiFetch('PATCH', `/api/solicitudes/${encodeURIComponent(id)}`, changes)
        const list    = lsRead()
        const current = list.find(s => s.id === id)
        const updated = current ? { ...current, ...changes } : null
        lsWrite(list.map(s => s.id === id ? { ...s, ...changes } : s))
        return updated
    },

    async remove(id) {
        if (isApiMode()) return apiFetch('DELETE', `/api/solicitudes/${encodeURIComponent(id)}`)
        lsWrite(lsRead().filter(s => s.id !== id))
        return null
    },
}
