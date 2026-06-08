/**
 * Servicio de homologaciones.
 *
 * API endpoints esperados:
 *   GET    /api/homologaciones           → HomologacionRecord[]
 *   POST   /api/homologaciones/bulk      → HomologacionRecord[]  (body: { records, columnMap })
 *   DELETE /api/homologaciones           → 204
 */

import { apiFetch, isApiMode } from './api'

const LS_KEY     = 'crfpvp_homologaciones'
const LS_MAP_KEY = 'crfpvp_homologaciones_map'

function lsRead()         { try { return JSON.parse(localStorage.getItem(LS_KEY)     || '[]')   } catch { return [] } }
function lsReadMap()      { try { return JSON.parse(localStorage.getItem(LS_MAP_KEY) || 'null') } catch { return null } }
function lsWrite(data)    { try { localStorage.setItem(LS_KEY,     JSON.stringify(data))  } catch {} }
function lsWriteMap(data) { try { localStorage.setItem(LS_MAP_KEY, JSON.stringify(data))  } catch {} }

export const homologacionService = {
    async getAll() {
        if (isApiMode()) {
            const data = await apiFetch('GET', '/api/homologaciones')
            return data
        }
        return { records: lsRead(), columnMap: lsReadMap() }
    },

    async saveAll(records, columnMap) {
        if (isApiMode()) {
            return apiFetch('POST', '/api/homologaciones/bulk', { records, columnMap })
        }
        lsWrite(records)
        lsWriteMap(columnMap)
        return { records, columnMap }
    },

    async clearAll() {
        if (isApiMode()) {
            return apiFetch('DELETE', '/api/homologaciones')
        }
        lsWrite([])
        lsWriteMap(null)
        return null
    },
}
