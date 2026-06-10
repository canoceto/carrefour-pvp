/**
 * Servicio de solicitudes.
 *
 * API endpoints esperados (modo VITE_API_URL):
 *   GET    /api/solicitudes           → Solicitud[]
 *   POST   /api/solicitudes           → Solicitud  (body: Solicitud)
 *   PATCH  /api/solicitudes/:id       → Solicitud  (body: Partial<Solicitud>)
 *   DELETE /api/solicitudes/:id       → 204
 *
 * En modo Supabase usa la tabla `solicitudes` (ver supabase/schema.sql).
 */

import { apiFetch, isApiMode } from './api'
import { supabase, isSupabaseMode } from './supabaseClient'
import { selectAll } from './supabaseHelpers'

const LS_KEY = 'crfpvp_solicitudes'
const TABLE  = 'solicitudes'

// [claveJS, columnaDB, tipo]
const FIELD_MAP = [
    ['timestamp',               'timestamp_local',          'text'],
    ['correo',                  'correo',                    'text'],
    ['solicitante',             'solicitante',               'text'],
    ['fecha',                   'fecha',                      'date'],
    ['cc',                      'cc',                         'text'],
    ['seccion',                 'seccion',                    'text'],
    ['peticion',                'peticion',                   'text'],
    ['empresa',                 'empresa',                    'text'],
    ['codtienda',               'codtienda',                  'text'],
    ['comentarios',             'comentarios',                'text'],
    ['smsDescripcion',          'sms_descripcion',            'text'],
    ['planSevilla',             'plan_sevilla',               'text'],
    ['etiquetadoProveedor',     'etiquetado_proveedor',       'text'],
    ['fechaVigor',              'fecha_vigor',                 'date'],
    ['adjuntoUrl',              'adjunto_url',                'text'],
    ['pvpActual',               'pvp_actual',                  'number'],
    ['pvpRec',                  'pvp_rec',                     'number'],
    ['pvpMercadona',            'pvp_mercadona',               'number'],
    ['pvpLidl',                 'pvp_lidl',                    'number'],
    ['pvpAlcampo',              'pvp_alcampo',                 'number'],
    ['homologado',              'homologado',                 'text'],
    ['homologadoFuentes',       'homologado_fuentes',         'array'],
    ['estado',                  'estado',                     'text'],
    ['prioridad',               'prioridad',                   'number'],
    ['nuevoResponsable',        'nuevo_responsable',          'text'],
    ['planAccion',              'plan_accion',                'text'],
    ['nuevaAsignacion',         'nueva_asignacion',           'text'],
    ['estadoSolicitud',         'estado_solicitud',           'text'],
    ['fechaPosicionamiento',    'fecha_posicionamiento',       'date'],
    ['responsableContestacion', 'responsable_contestacion',   'text'],
    ['observaciones',           'observaciones',              'text'],
    ['ccRespuesta',             'cc_respuesta',               'text'],
    ['enviar',                  'enviar',                     'text'],
    ['fechaRespuesta',          'fecha_respuesta',            'text'],
]

function toDb(solicitud) {
    const row = {}
    if ('id' in solicitud) row.id = solicitud.id
    for (const [jsKey, dbKey, type] of FIELD_MAP) {
        if (!(jsKey in solicitud)) continue
        let val = solicitud[jsKey]
        if (type === 'date')   val = val || null
        if (type === 'number') val = (val === '' || val === undefined) ? null : val
        if (type === 'array')  val = Array.isArray(val) ? val : []
        row[dbKey] = val ?? null
    }
    return row
}

function fromDb(row) {
    if (!row) return null
    const obj = { id: row.id }
    for (const [jsKey, dbKey, type] of FIELD_MAP) {
        let val = row[dbKey]
        if (type === 'array') {
            obj[jsKey] = val ?? []
        } else {
            obj[jsKey] = val ?? ''
        }
    }
    return obj
}

function lsRead()      { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] } }
function lsWrite(data) { try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {} }

export const solicitudesService = {
    async getAll() {
        if (isApiMode()) return apiFetch('GET', '/api/solicitudes')
        if (isSupabaseMode()) {
            const rows = await selectAll(TABLE, { orderBy: 'ts_creacion', ascending: true })
            return rows.map(fromDb)
        }
        return lsRead()
    },

    async create(solicitud) {
        if (isApiMode()) return apiFetch('POST', '/api/solicitudes', solicitud)
        if (isSupabaseMode()) {
            const { data, error } = await supabase.from(TABLE).insert(toDb(solicitud)).select().single()
            if (error) throw error
            return fromDb(data)
        }
        const list = lsRead()
        lsWrite([...list, solicitud])
        return solicitud
    },

    async update(id, changes) {
        if (isApiMode()) return apiFetch('PATCH', `/api/solicitudes/${encodeURIComponent(id)}`, changes)
        if (isSupabaseMode()) {
            const { data, error } = await supabase.from(TABLE).update(toDb(changes)).eq('id', id).select().single()
            if (error) throw error
            return fromDb(data)
        }
        const list    = lsRead()
        const current = list.find(s => s.id === id)
        const updated = current ? { ...current, ...changes } : null
        lsWrite(list.map(s => s.id === id ? { ...s, ...changes } : s))
        return updated
    },

    async remove(id) {
        if (isApiMode()) return apiFetch('DELETE', `/api/solicitudes/${encodeURIComponent(id)}`)
        if (isSupabaseMode()) {
            const { error } = await supabase.from(TABLE).delete().eq('id', id)
            if (error) throw error
            return null
        }
        lsWrite(lsRead().filter(s => s.id !== id))
        return null
    },
}
