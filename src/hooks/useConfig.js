import { useState } from 'react'

const CONFIG_KEY = 'crfpvp_config'

export const SEED_ADMINS = ['carlosg.anoceto@gmail.com', 'marlis2.mc@gmail.com','dev@local.test']

export const DEFAULT_FIELD_CONFIG = {
    correo:              { label: 'Correo electrónico',     section: 'Identificación', type: 'text',  required: true,  enabled: true },
    solicitante:         { label: 'Nombre solicitante',     section: 'Identificación', type: 'text',  required: true,  enabled: true },
    fecha:               { label: 'Fecha de la solicitud',  section: 'Identificación', type: 'date',  required: true,  enabled: true },
    cc:                  { label: 'CC (copia de respuesta)',section: 'Identificación', type: 'text',  required: false, enabled: true },
    seccion:             { label: 'Sección',                section: 'Tipo',           type: 'radio', required: true,  enabled: true },
    peticion:            { label: 'Tipo de petición',       section: 'Tipo',           type: 'radio', required: true,  enabled: true },
    empresa:             { label: 'Empresa',                section: 'Tienda',         type: 'radio', required: true,  enabled: true },
    codtienda:           { label: 'Código de tienda',       section: 'Tienda',         type: 'text',  required: true,  enabled: true },
    smsDescripcion:      { label: 'SMS / Descripción',      section: 'Producto',       type: 'text',  required: false, enabled: true },
    comentarios:         { label: 'Comentarios',            section: 'Producto',       type: 'text',  required: false, enabled: true },
    planSevilla:         { label: '¿Plan Sevilla?',         section: 'Producto',       type: 'radio', required: false, enabled: true },
    etiquetadoProveedor: { label: '¿Etiquetado Proveedor?', section: 'Producto',       type: 'radio', required: false, enabled: true },
    fechaVigor:          { label: 'Fecha Vigor Etiquetado', section: 'Producto',       type: 'date',  required: false, enabled: true },
    adjuntoUrl:          { label: 'Adjunto / URL Drive',    section: 'Producto',       type: 'text',  required: false, enabled: true },
    pvpActual:           { label: 'PVP Actual CRF',         section: 'Precios',        type: 'price', required: false, enabled: true },
    pvpRec:              { label: 'PVP Recomendado',        section: 'Precios',        type: 'price', required: true,  enabled: true },
    pvpMercadona:        { label: 'PVP Mercadona',          section: 'Precios',        type: 'price', required: true,  enabled: true },
    pvpLidl:             { label: 'PVP LIDL',               section: 'Precios',        type: 'price', required: false, enabled: true },
    pvpAlcampo:          { label: 'PVP Alcampo',            section: 'Precios',        type: 'price', required: true,  enabled: true },
}

function load() {
    try {
        const raw = localStorage.getItem(CONFIG_KEY)
        if (raw) return JSON.parse(raw)
    } catch {}
    return null
}

function merge(saved) {
    const fields = {}
    Object.keys(DEFAULT_FIELD_CONFIG).forEach(k => {
        fields[k] = { ...DEFAULT_FIELD_CONFIG[k], ...(saved?.fields?.[k] || {}) }
    })
    return {
        admins: saved?.admins ?? [...SEED_ADMINS],
        fields,
    }
}

export function useConfig() {
    const [config, setConfig] = useState(() => merge(load()))

    const persist = (next) => {
        setConfig(next)
        try { localStorage.setItem(CONFIG_KEY, JSON.stringify(next)) } catch {}
    }

    const addAdmin = (email) => {
        const e = email.trim().toLowerCase()
        if (!e || config.admins.map(a => a.toLowerCase()).includes(e)) return false
        persist({ ...config, admins: [...config.admins, e] })
        return true
    }

    const removeAdmin = (email) => {
        persist({ ...config, admins: config.admins.filter(a => a !== email) })
    }

    const updateField = (key, changes) => {
        persist({
            ...config,
            fields: { ...config.fields, [key]: { ...config.fields[key], ...changes } },
        })
    }

    const resetFields = () => {
        persist({ ...config, fields: { ...DEFAULT_FIELD_CONFIG } })
    }

    return { admins: config.admins, fields: config.fields, addAdmin, removeAdmin, updateField, resetFields }
}
