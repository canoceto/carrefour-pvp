/**
 * Servicio de configuración (admins + campos del formulario).
 *
 * API endpoints esperados (modo VITE_API_URL):
 *   GET  /api/config    → { admins: string[], fields: FieldConfig }
 *   PUT  /api/config    → { admins: string[], fields: FieldConfig }
 *
 * En modo Supabase usa las tablas `app_admins` y `app_field_config`
 * (ver supabase/schema.sql).
 */

import { apiFetch, isApiMode } from './api'
import { supabase, isSupabaseMode } from './supabaseClient'
import { selectAll } from './supabaseHelpers'
import { SEED_ADMINS, DEFAULT_FIELD_CONFIG } from '../hooks/useConfig'

const LS_KEY        = 'crfpvp_config'
const ADMINS_TABLE  = 'app_admins'
const FIELDS_TABLE  = 'app_field_config'

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
        if (isSupabaseMode()) {
            const [adminRows, fieldRows] = await Promise.all([
                selectAll(ADMINS_TABLE, { columns: 'email', orderBy: 'email' }),
                selectAll(FIELDS_TABLE, { columns: '*', orderBy: 'sort_order' }),
            ])

            const admins = adminRows.map(a => a.email)
            const fields = { ...DEFAULT_FIELD_CONFIG }
            fieldRows.forEach(row => {
                fields[row.field_key] = {
                    label: row.label,
                    section: row.section,
                    type: row.type,
                    required: row.required,
                    enabled: row.enabled,
                }
            })

            return { admins, fields }
        }
        return lsRead()
    },

    async save(config) {
        if (isApiMode()) return apiFetch('PUT', '/api/config', config)
        if (isSupabaseMode()) {
            const current      = await selectAll(ADMINS_TABLE, { columns: 'email', orderBy: 'email' })
            const currentEmails = current.map(a => a.email)
            const nextEmails    = config.admins ?? []

            const toAdd    = nextEmails.filter(e => !currentEmails.includes(e))
            const toRemove = currentEmails.filter(e => !nextEmails.includes(e))

            if (toAdd.length) {
                const { error } = await supabase.from(ADMINS_TABLE)
                    .upsert(toAdd.map(email => ({ email })), { onConflict: 'email', ignoreDuplicates: true })
                if (error) { console.error('configService.save (app_admins insert):', error); throw error }
            }
            if (toRemove.length) {
                const { error } = await supabase.from(ADMINS_TABLE).delete().in('email', toRemove)
                if (error) { console.error('configService.save (app_admins delete):', error); throw error }
            }

            const fieldRows = Object.entries(config.fields ?? {}).map(([field_key, f]) => ({
                field_key,
                label: f.label,
                section: f.section,
                type: f.type,
                required: !!f.required,
                enabled: !!f.enabled,
            }))
            if (fieldRows.length) {
                const { error } = await supabase.from(FIELDS_TABLE).upsert(fieldRows, { onConflict: 'field_key' })
                if (error) { console.error('configService.save (app_field_config upsert):', error); throw error }
            }

            return config
        }
        lsWrite(config)
        return config
    },
}
