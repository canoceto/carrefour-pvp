import React, { useState, useMemo } from 'react'
import Modal from '../Modal/Modal'
import styles from './ExportModal.module.css'

const SECCIONES_LIST = ['CARNICERIA', 'FRUTERIA', 'CHARCUTERIA', 'PANADERIA', 'PESCADERIA', 'PLATOS PREPARADOS']

const CAMPOS = [
    { key: 'timestamp',               label: 'Fecha / Hora',          group: 'Identificación', def: true  },
    { key: 'solicitante',             label: 'Solicitante',           group: 'Identificación', def: true  },
    { key: 'correo',                  label: 'Correo',                group: 'Identificación', def: true  },
    { key: 'cc',                      label: 'CC',                    group: 'Identificación', def: false },
    { key: 'seccion',                 label: 'Sección',               group: 'Solicitud',      def: true  },
    { key: 'peticion',                label: 'Petición',              group: 'Solicitud',      def: true  },
    { key: 'empresa',                 label: 'Empresa',               group: 'Solicitud',      def: true  },
    { key: 'codtienda',               label: 'Cód. Tienda',           group: 'Solicitud',      def: true  },
    { key: 'prioridad',               label: 'Prioridad',             group: 'Solicitud',      def: true  },
    { key: 'smsDescripcion',          label: 'SMS / Descripción',     group: 'Producto',       def: true  },
    { key: 'planSevilla',             label: 'Plan Sevilla',          group: 'Producto',       def: false },
    { key: 'etiquetadoProveedor',     label: 'Etiq. Proveedor',      group: 'Producto',       def: false },
    { key: 'fechaVigor',              label: 'Fecha Vigor',           group: 'Producto',       def: false },
    { key: 'adjuntoUrl',              label: 'Adjunto / Drive',       group: 'Producto',       def: false },
    { key: 'comentarios',             label: 'Comentarios',           group: 'Producto',       def: false },
    { key: 'pvpActual',               label: 'PVP Actual CRF',        group: 'Precios',        def: true  },
    { key: 'pvpRec',                  label: 'PVP Recomendado',       group: 'Precios',        def: true  },
    { key: 'pvpMercadona',            label: 'PVP Mercadona',         group: 'Precios',        def: true  },
    { key: 'pvpLidl',                 label: 'PVP LIDL',              group: 'Precios',        def: true  },
    { key: 'pvpAlcampo',              label: 'PVP Alcampo',           group: 'Precios',        def: true  },
    { key: 'estado',                  label: 'Estado',                group: 'Respuesta',      def: true  },
    { key: 'estadoSolicitud',         label: 'Estado Solicitud',      group: 'Respuesta',      def: false },
    { key: 'fechaRespuesta',          label: 'Fecha Respuesta',       group: 'Respuesta',      def: false },
    { key: 'fechaPosicionamiento',    label: 'Fecha Posicionamiento', group: 'Respuesta',      def: false },
    { key: 'responsableContestacion', label: 'Responsable',           group: 'Respuesta',      def: false },
    { key: 'observaciones',           label: 'Observaciones',         group: 'Respuesta',      def: false },
    { key: 'nuevoResponsable',        label: 'Nuevo Responsable',     group: 'Respuesta',      def: false },
    { key: 'planAccion',              label: 'Plan de Acción',        group: 'Respuesta',      def: false },
    { key: 'nuevaAsignacion',         label: 'Nueva Asignación',      group: 'Respuesta',      def: false },
    { key: 'enviar',                  label: 'Enviar Email',          group: 'Respuesta',      def: false },
]

const GRUPOS = ['Identificación', 'Solicitud', 'Producto', 'Precios', 'Respuesta']

const ESTADO_CHIPS = [
    { value: 'todos',      label: 'Todos' },
    { value: 'recibido',   label: 'Recibidos' },
    { value: 'seccion',    label: 'En Progreso' },
    { value: 'respondido', label: 'Respondidos' },
]

const SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1RbfhsLHWqqWGKsqV0d7-PQUAedDOVfs9QwfK9nPV-X0/edit'

function getVal(s, key) {
    const v = s[key]
    return (v !== undefined && v !== null && v !== '') ? String(v) : ''
}

export default function ExportModal({ show, onClose, solicitudes, title = 'EXPORTAR DATOS' }) {
    const [camposSelec,     setCamposSelec]     = useState(() => new Set(CAMPOS.filter(c => c.def).map(c => c.key)))
    const [filtroEstado,    setFiltroEstado]    = useState('todos')
    const [filtroSecciones, setFiltroSecciones] = useState(new Set())
    const [filtroPrios,     setFiltroPrios]     = useState(new Set())
    const [fechaDesde,      setFechaDesde]      = useState('')
    const [fechaHasta,      setFechaHasta]      = useState('')
    const [copied,          setCopied]          = useState(false)
    const [colsOpen,        setColsOpen]        = useState(false)

    const toggleCampo = (key) => setCamposSelec(prev => {
        const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next
    })

    const toggleGrupo = (grupo) => {
        const keys = CAMPOS.filter(c => c.group === grupo).map(c => c.key)
        const allOn = keys.every(k => camposSelec.has(k))
        setCamposSelec(prev => {
            const next = new Set(prev)
            allOn ? keys.forEach(k => next.delete(k)) : keys.forEach(k => next.add(k))
            return next
        })
    }

    const toggleSeccion = (sec) => setFiltroSecciones(prev => {
        const next = new Set(prev); next.has(sec) ? next.delete(sec) : next.add(sec); return next
    })

    const togglePrio = (p) => setFiltroPrios(prev => {
        const next = new Set(prev); next.has(p) ? next.delete(p) : next.add(p); return next
    })

    const selectAll  = () => setCamposSelec(new Set(CAMPOS.map(c => c.key)))
    const selectNone = () => setCamposSelec(new Set())

    const cols = CAMPOS.filter(c => camposSelec.has(c.key))

    const filas = useMemo(() => solicitudes.filter(s => {
        if (filtroEstado !== 'todos' && s.estado !== filtroEstado) return false
        if (filtroSecciones.size > 0 && !filtroSecciones.has(s.seccion)) return false
        if (filtroPrios.size > 0 && !filtroPrios.has(Number(s.prioridad))) return false
        if (fechaDesde && s.fecha && s.fecha < fechaDesde) return false
        if (fechaHasta && s.fecha && s.fecha > fechaHasta) return false
        return true
    }), [solicitudes, filtroEstado, filtroSecciones, filtroPrios, fechaDesde, fechaHasta])

    const buildTSV = () => {
        const header = cols.map(c => c.label).join('\t')
        const rows   = filas.map(s => cols.map(c => getVal(s, c.key)).join('\t')).join('\n')
        return header + '\n' + rows
    }

    const buildCSV = () => {
        const esc = (v) => {
            if (!v) return ''
            const str = String(v)
            return (str.includes(',') || str.includes('"') || str.includes('\n'))
                ? `"${str.replace(/"/g, '""')}"`
                : str
        }
        const header = cols.map(c => esc(c.label)).join(',')
        const rows   = filas.map(s => cols.map(c => esc(getVal(s, c.key))).join(',')).join('\n')
        return '﻿' + header + '\n' + rows
    }

    const handleCopiarSheets = () => {
        navigator.clipboard.writeText(buildTSV()).then(() => {
            setCopied(true)
            setTimeout(() => { setCopied(false); window.open(SHEETS_URL, '_blank') }, 1200)
        }).catch(() => window.open(SHEETS_URL, '_blank'))
    }

    const handleCSV = () => {
        const blob = new Blob([buildCSV()], { type: 'text/csv;charset=utf-8;' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `reporte-pvp-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <Modal show={show} onClose={onClose} title={title} size="lg"
               footer={
                   <div className={styles.foot}>
                       <span className={styles.footInfo}>
                           {filas.length} fila{filas.length !== 1 ? 's' : ''} · {cols.length} columna{cols.length !== 1 ? 's' : ''}
                       </span>
                       <button className={styles.btnCSV} onClick={handleCSV} disabled={cols.length === 0 || filas.length === 0}>
                           ⬇ Descargar CSV
                       </button>
                       <button
                           className={`${styles.btnSheets} ${copied ? styles.btnCopied : ''}`}
                           onClick={handleCopiarSheets}
                           disabled={cols.length === 0 || filas.length === 0}
                       >
                           {copied ? '✓ Copiado!' : '📊 Copiar y abrir Sheets'}
                       </button>
                   </div>
               }>

            <div className={styles.layout}>

                {/* ── Filtros ── */}
                <div className={styles.filtersRow}>
                    <div className={styles.filterGroup}>
                        <div className={styles.filterLabel}>Estado</div>
                        <div className={styles.chips}>
                            {ESTADO_CHIPS.map(({ value, label }) => (
                                <button key={value}
                                    className={`${styles.chip} ${filtroEstado === value ? styles.chipOn : ''}`}
                                    onClick={() => setFiltroEstado(value)}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.filterGroup}>
                        <div className={styles.filterLabel}>Sección <span className={styles.hint}>vacío = todas</span></div>
                        <div className={styles.chips}>
                            {SECCIONES_LIST.map(sec => (
                                <button key={sec}
                                    className={`${styles.chip} ${filtroSecciones.has(sec) ? styles.chipOn : ''}`}
                                    onClick={() => toggleSeccion(sec)}>
                                    {sec.charAt(0) + sec.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.filterGroup}>
                        <div className={styles.filterLabel}>Prioridad <span className={styles.hint}>vacío = todas</span></div>
                        <div className={styles.chips}>
                            {[1,2,3,4,5].map(p => (
                                <button key={p}
                                    className={`${styles.chip} ${filtroPrios.has(p) ? styles.chipOn : ''}`}
                                    onClick={() => togglePrio(p)}>
                                    P{p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.filterGroup}>
                        <div className={styles.filterLabel}>Rango de fechas</div>
                        <div className={styles.dateRow}>
                            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
                            <span>—</span>
                            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* ── Columnas ── */}
                <div className={styles.columnsSection}>
                    <div className={styles.columnsSectionHead} onClick={() => setColsOpen(o => !o)} style={{ cursor: 'pointer' }}>
                        <span className={styles.collapseToggle}>
                            <span className={colsOpen ? styles.chevronOpen : styles.chevron}>›</span>
                            Columnas
                            <span className={styles.colsCount}>{camposSelec.size} / {CAMPOS.length}</span>
                        </span>
                        {colsOpen && (
                            <div className={styles.colActions} onClick={e => e.stopPropagation()}>
                                <button className={styles.linkBtn} onClick={selectAll}>Todas</button>
                                <span>·</span>
                                <button className={styles.linkBtn} onClick={selectNone}>Ninguna</button>
                            </div>
                        )}
                    </div>
                    {colsOpen && <div className={styles.columnsGrid}>
                        {GRUPOS.map(grupo => {
                            const groupCols = CAMPOS.filter(c => c.group === grupo)
                            const allOn  = groupCols.every(c => camposSelec.has(c.key))
                            const someOn = groupCols.some(c => camposSelec.has(c.key))
                            return (
                                <div key={grupo} className={styles.grupoCol}>
                                    <label className={styles.grupoHead}>
                                        <input
                                            type="checkbox"
                                            className={styles.chk}
                                            checked={allOn}
                                            ref={el => { if (el) el.indeterminate = someOn && !allOn }}
                                            onChange={() => toggleGrupo(grupo)}
                                        />
                                        <span className={styles.grupoName}>{grupo}</span>
                                    </label>
                                    {groupCols.map(campo => (
                                        <label key={campo.key} className={styles.campoRow}>
                                            <input
                                                type="checkbox"
                                                className={styles.chk}
                                                checked={camposSelec.has(campo.key)}
                                                onChange={() => toggleCampo(campo.key)}
                                            />
                                            <span className={styles.campoLabel}>{campo.label}</span>
                                        </label>
                                    ))}
                                </div>
                            )
                        })}
                    </div>}
                </div>

                {/* ── Vista previa ── */}
                <div className={styles.previewSection}>
                    <div className={styles.previewHead}>
                        Vista previa
                        <span className={styles.previewCount}>{filas.length} filas · {cols.length} col.</span>
                    </div>

                    {cols.length === 0 ? (
                        <div className={styles.previewEmpty}>Selecciona al menos una columna</div>
                    ) : filas.length === 0 ? (
                        <div className={styles.previewEmpty}>Sin datos con los filtros aplicados</div>
                    ) : (
                        <>
                            <div className={styles.previewScroll}>
                                <table className={styles.previewTable}>
                                    <thead>
                                        <tr>{cols.map(c => <th key={c.key}>{c.label}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        {filas.slice(0, 10).map((s, i) => (
                                            <tr key={s.id || i}>
                                                {cols.map(c => (
                                                    <td key={c.key} title={getVal(s, c.key)}>
                                                        {getVal(s, c.key) || <span className={styles.empty}>—</span>}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filas.length > 10 && (
                                <div className={styles.previewMore}>
                                    Mostrando 10 de {filas.length} filas — el export incluye todas
                                </div>
                            )}
                        </>
                    )}
                </div>

            </div>
        </Modal>
    )
}
