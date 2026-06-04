import { useState, useEffect, useCallback } from 'react'
import { configService } from '../services'

export const SEED_ADMINS = ['carlosg.anoceto@gmail.com', 'marlis2.mc@gmail.com', 'dev@local.test']

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

export function useConfig() {
    const [config,  setConfig]  = useState({ admins: [...SEED_ADMINS], fields: { ...DEFAULT_FIELD_CONFIG } })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        configService.get()
            .then(data => { setConfig(data); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const persist = useCallback(async (next) => {
        setConfig(next)
        try { await configService.save(next) } catch {}
    }, [])

    const addAdmin = useCallback(async (email) => {
        const e = email.trim().toLowerCase()
        if (!e || config.admins.map(a => a.toLowerCase()).includes(e)) return false
        await persist({ ...config, admins: [...config.admins, e] })
        return true
    }, [config, persist])

    const removeAdmin = useCallback(async (email) => {
        await persist({ ...config, admins: config.admins.filter(a => a !== email) })
    }, [config, persist])

    const updateField = useCallback(async (key, changes) => {
        await persist({
            ...config,
            fields: { ...config.fields, [key]: { ...config.fields[key], ...changes } },
        })
    }, [config, persist])

    const resetFields = useCallback(async () => {
        await persist({ ...config, fields: { ...DEFAULT_FIELD_CONFIG } })
    }, [config, persist])

    return { admins: config.admins, fields: config.fields, loading, addAdmin, removeAdmin, updateField, resetFields }
}
