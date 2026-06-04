/**
 * Servicio de configuración (admins + campos del formulario).
 *
 * API endpoints esperados:
 *   GET  /api/config    → { admins: string[], fields: FieldConfig }
 *   PUT  /api/config    → { admins: string[], fields: FieldConfig }
 */

import { apiFetch, isApiMode } from './api'
import { SEED_ADMINS, DEFAULT_FIELD_CONFIG } from '../hooks/useConfig'

const LS_KEY = 'crfpvp_config'

function defaultConfig() {
    return { admins: [...SEED_ADMINS], fields: { ...DEFAULT_FIELD_CONFIG } }
}

function lsRead() {
    try {
        const raw = localStorage.getItem(LS_KEY)
        if (!raw) return defaultConfig()
        const saved = JSON.parse(raw)
        const fields = {}
        Object.keys(DEFAULT_FIELD_CONFIG).forEach(k => {
            fields[k] = { ...DEFAULT_FIELD_CONFIG[k], ...(saved.fields?.[k] || {}) }
        })
        return { admins: saved.admins ?? [...SEED_ADMINS], fields }
    } catch {
        return defaultConfig()
    }
}

function lsWrite(data) { try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {} }

export const configService = {
    async get() {
        if (isApiMode()) return apiFetch('GET', '/api/config')
        return lsRead()
    },

    async save(config) {
        if (isApiMode()) return apiFetch('PUT', '/api/config', config)
        lsWrite(config)
        return config
    },
}
