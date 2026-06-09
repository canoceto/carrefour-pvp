import React, { useState, useMemo } from 'react'
import Modal from '../Modal/Modal'
import SolicitanteHistorialModal from '../SolicitanteHistorialModal/SolicitanteHistorialModal'
import SolicitantesListModal from '../SolicitantesListModal/SolicitantesListModal'
import styles from './PanelView.module.css'
import { NIVEL_LABELS, DEFAULT_PRIORIDADES } from '../../hooks/usePrioridades'

const HOJA_MAP = {
    CARNICERIA: 'Carne, Pesca y Panadería',
    PESCADERIA: 'Carne, Pesca y Panadería',
    PANADERIA:  'Carne, Pesca y Panadería',
    FRUTERIA:   'Frutería, Charcutería y Platos',
    CHARCUTERIA:'Frutería, Charcutería y Platos',
    'PLATOS PREPARADOS': 'Frutería, Charcutería y Platos',
}

const SECCION_COLOR = {
    CARNICERIA: styles.secCarniceria,
    FRUTERIA:   styles.secFruteria,
    CHARCUTERIA: styles.secCharcuteria,
    PANADERIA:  styles.secPanaderia,
    PESCADERIA: styles.secPescaderia,
    'PLATOS PREPARADOS': styles.secPlatos,
}

const ESTADO_OPTS = ['Realizado', 'Rechazado', 'Revisado', 'Pendiente']

const SORT_DEFAULT_DIR = {
    prioridad:    'asc',
    fecha:        'desc',
    seccion:      'asc',
    peticion:     'asc',
    descripcion:  'asc',
    homologado:   'desc',
    empresa:      'asc',
    pvpRec:       'desc',
    pvpMercadona: 'desc',
    pvpAlcampo:   'desc',
    estado:       'asc',
}

function sortVal(s, col) {
    switch (col) {
        case 'prioridad':    return Number(s.prioridad) || 99
        case 'fecha':        return s.fecha || s.id || ''
        case 'seccion':      return s.seccion || ''
        case 'peticion':     return s.peticion || ''
        case 'descripcion':  return s.smsDescripcion || ''
        case 'homologado':   return s.homologado || ''
        case 'empresa':      return s.empresa || ''
        case 'pvpRec':       return parseFloat(s.pvpRec) || 0
        case 'pvpMercadona': return parseFloat(s.pvpMercadona) || 0
        case 'pvpAlcampo':   return parseFloat(s.pvpAlcampo) || 0
        case 'estado':       return s.estado || ''
        default:             return ''
    }
}

const SECCIONES_FILTER = [
    { value: 'todas',            label: 'Todas las secciones' },
    { value: 'CARNICERIA',       label: 'Carnicería' },
    { value: 'FRUTERIA',         label: 'Frutería' },
    { value: 'CHARCUTERIA',      label: 'Charcutería' },
    { value: 'PANADERIA',        label: 'Panadería' },
    { value: 'PESCADERIA',       label: 'Pescadería' },
    { value: 'PLATOS PREPARADOS',label: 'Platos Preparados' },
]

function DLabel({ label }) { return <div className={styles.dLabel}>{label}</div> }
function DVal({ val })     { return <div className={styles.dVal}>{val || '—'}</div> }

function lookupPvpPeninsula(fuentes, smsValue) {
    const fuente = fuentes?.pvp_peninsula_pft
    if (!fuente?.records?.length || !fuente.smsCol || !smsValue) return null
    const smsNorm = String(smsValue).trim().toLowerCase()
    return fuente.records.find(r => String(r[fuente.smsCol] ?? '').trim().toLowerCase() === smsNorm) || null
}

const COMP_ROWS = [
    { label: 'MERCADONA', formKey: 'pvpMercadona', pvpKey: 'MERCADONA',    noPromoKey: 'MERCADONA NoPromo' },
    { label: 'LIDL',      formKey: 'pvpLidl',      pvpKey: 'LIDL',         noPromoKey: 'LIDL NoPromo' },
    { label: 'ALCAMPO',   formKey: 'pvpAlcampo',   pvpKey: 'ALCAMPO',      noPromoKey: 'ALCAMPO NoPromo' },
]

function fmtP(v) {
    if (v === '' || v === null || v === undefined) return '—'
    const n = parseFloat(v)
    return isNaN(n) ? String(v) : `€${n.toFixed(2)}`
}

function PvpPenInfo({ record, solicitud }) {
    const hasFormPrices = COMP_ROWS.some(r => solicitud?.[r.formKey])
    if (!record && !hasFormPrices) return null

    const idUds = record?.['ID_UDS'] ?? record?.['ID UDS'] ?? ''
    const uds   = record?.['UDS'] ?? ''

    return (
        <div className={styles.pvpPenBox}>
            <div className={styles.pvpPenTitle}>PVP Península PFT{!record && ' · artículo no encontrado en la fuente cargada'}</div>

            {(idUds !== '' || uds !== '') && (
                <div className={styles.pvpPenMeta}>
                    {idUds !== '' && <span><span className={styles.pvpPenLabel}>ID_UDS</span> <strong>{idUds}</strong></span>}
                    {uds   !== '' && <span><span className={styles.pvpPenLabel}>UDS</span> <strong>{uds}</strong></span>}
                </div>
            )}

            <table className={styles.pvpCompTable}>
                <thead>
                    <tr>
                        <th className={styles.pvpCompTh}>Competidor</th>
                        <th className={styles.pvpCompTh}>Formulario</th>
                        <th className={styles.pvpCompTh}>PFT con promo</th>
                        <th className={styles.pvpCompTh}>PFT sin promo</th>
                    </tr>
                </thead>
                <tbody>
                    {COMP_ROWS.map(({ label, formKey, pvpKey, noPromoKey }) => {
                        const formVal  = solicitud?.[formKey] ?? ''
                        const conPromo = record?.[pvpKey]     ?? ''
                        const sinPromo = record?.[noPromoKey] ?? ''
                        const hasForm  = formVal !== '' && formVal !== null && formVal !== undefined
                        return (
                            <tr key={label} className={styles.pvpCompRow}>
                                <td className={styles.pvpCompName}>
                                    {label}{hasForm && <span className={styles.pvpCompStar}> *</span>}
                                </td>
                                <td className={`${styles.pvpCompVal} ${hasForm ? styles.pvpCompFormVal : ''}`}>
                                    {fmtP(formVal)}
                                </td>
                                <td className={styles.pvpCompVal}>{fmtP(conPromo)}</td>
                                <td className={styles.pvpCompVal}>{fmtP(sinPromo)}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

function DetailGrid({ s }) {
    const items = [
        ['Solicitante', s.solicitante], ['Correo', s.correo],
        ['Sección', s.seccion],         ['Petición', s.peticion],
        ['Empresa', s.empresa],         ['Cód. Tienda', s.codtienda],
        ['SMS/Descripción', s.smsDescripcion], ['PVP Actual CRF', s.pvpActual ? `€${s.pvpActual}` : '—'],
        ['PVP Recomendado', s.pvpRec ? `€${s.pvpRec}` : '—'],
        ['PVP Mercadona', s.pvpMercadona ? `€${s.pvpMercadona}` : '—'],
        ['PVP LIDL', s.pvpLidl ? `€${s.pvpLidl}` : '—'],
        ['PVP Alcampo', s.pvpAlcampo ? `€${s.pvpAlcampo}` : '—'],
        ['Plan Sevilla', s.planSevilla], ['Etiq. Proveedor', s.etiquetadoProveedor],
        ['Fecha Vigor', s.fechaVigor],
    ]
    return (
        <div className={styles.detailGrid}>
            {items.map(([label, val]) => (
                <div key={label} className={styles.detailItem}>
                    <DLabel label={label} /><DVal val={val} />
                </div>
            ))}
            {s.homologado && (
                <div className={styles.detailItem} style={{ gridColumn: '1/-1' }}>
                    <DLabel label="Homologación" />
                    {s.homologado === 'Sí'
                        ? <DVal val={`✓ Homologado — encontrado en: ${(s.homologadoFuentes || []).join(', ') || '—'}`} />
                        : <DVal val="✗ No homologado en la fecha de la solicitud" />
                    }
                </div>
            )}
            {s.comentarios && (
                <div className={styles.detailItem} style={{ gridColumn: '1/-1' }}>
                    <DLabel label="Comentarios" /><DVal val={s.comentarios} />
                </div>
            )}
            {s.adjuntoUrl && (
                <div className={styles.detailItem} style={{ gridColumn: '1/-1' }}>
                    <DLabel label="Fichero adjunto" />
                    <a href={s.adjuntoUrl} target="_blank" rel="noreferrer" className={styles.driveLink}>📎 Ver en Drive</a>
                </div>
            )}
        </div>
    )
}

function EstadoBadge({ estado }) {
    if (estado === 'respondido') return <span className={`${styles.estadoChip} ${styles.chipRespondido}`}>Respondido</span>
    if (estado === 'seccion')    return <span className={`${styles.estadoChip} ${styles.chipSeccion}`}>En Progreso</span>
    return <span className={`${styles.estadoChip} ${styles.chipRecibido}`}>Recibido</span>
}

const PRIO_CLS = ['', styles.p1, styles.p2, styles.p3, styles.p4, styles.p5]

function PrioridadBadge({ nivel }) {
    const n = Number(nivel) || 5
    return (
        <span className={`${styles.prioBadge} ${PRIO_CLS[n]}`}>
            P{n} <span className={styles.prioLabel}>{NIVEL_LABELS[n]}</span>
        </span>
    )
}

/* ── Formulario de respuesta reutilizable ── */
function RespForm({ form, onChange, modalResp, bulkMode, selectedCount }) {
    const set = (key) => (e) => onChange(f => ({ ...f, [key]: e.target.value }))
    return (
        <div className={styles.respArea}>
            <div className={styles.respGrid}>
                <div className={styles.respField}>
                    <label className={styles.respLabel}>Estado solicitud</label>
                    <select value={form.estadoSolicitud} onChange={set('estadoSolicitud')}>
                        {ESTADO_OPTS.map(o => <option key={o}>{o}</option>)}
                    </select>
                </div>
                <div className={styles.respField}>
                    <label className={styles.respLabel}>Fecha posicionamiento</label>
                    <input type="date" value={form.fechaPosicionamiento} onChange={set('fechaPosicionamiento')} />
                </div>
                <div className={styles.respField} style={{ gridColumn: '1/-1' }}>
                    <label className={styles.respLabel}>Responsable contestación</label>
                    <input type="text" value={form.responsableContestacion} onChange={set('responsableContestacion')} placeholder="email@carrefour.es" />
                </div>
                <div className={styles.respField} style={{ gridColumn: '1/-1' }}>
                    <label className={styles.respLabel}>Observaciones <span style={{ color: 'var(--red)' }}>*</span></label>
                    <textarea value={form.observaciones} onChange={set('observaciones')} placeholder="Escribe la respuesta o resolución de la solicitud..." />
                </div>
                <div className={styles.respField}>
                    <label className={styles.respLabel}>Nuevo responsable</label>
                    <input type="text" value={form.nuevoResponsable} onChange={set('nuevoResponsable')} placeholder="email@carrefour.es" />
                </div>
                <div className={styles.respField}>
                    <label className={styles.respLabel}>Plan de acción</label>
                    <input type="text" value={form.planAccion} onChange={set('planAccion')} placeholder="Descripción del plan..." />
                </div>
                <div className={styles.respField} style={{ gridColumn: '1/-1' }}>
                    <label className={styles.respLabel}>Nueva asignación</label>
                    <input type="text" value={form.nuevaAsignacion} onChange={set('nuevaAsignacion')} placeholder="Persona o equipo asignado..." />
                </div>
                <div className={styles.respField} style={{ gridColumn: '1/-1' }}>
                    <label className={styles.respLabel}>CC respuesta <span style={{ fontWeight: 400, color: 'var(--gray-400)', textTransform: 'none' }}>(compañeros en copia)</span></label>
                    <input type="text" value={form.ccRespuesta} onChange={set('ccRespuesta')} placeholder="email1@carrefour.es, email2@carrefour.es" />
                </div>
            </div>
            <div className={styles.enviarRow}>
                <div className={styles.enviarLabel}>
                    <span>📧</span>
                    <div>
                        <strong>Enviar respuesta por email</strong>
                        <small>
                            {bulkMode
                                ? `Se enviará a los correos de las ${selectedCount} solicitudes`
                                : `Para: ${modalResp?.correo}${modalResp?.cc ? ` · CC solicitante: ${modalResp.cc}` : ''}${form.ccRespuesta ? ` · CC: ${form.ccRespuesta}` : ''}`
                            }
                        </small>
                    </div>
                </div>
                <div className={styles.enviarToggle}>
                    {['SI', 'NO'].map(v => (
                        <label key={v} className={`${styles.toggleOpt} ${form.enviar === v ? styles.toggleActive : ''}`}>
                            <input type="radio" checked={form.enviar === v} onChange={() => onChange(f => ({ ...f, enviar: v }))} />
                            {v}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    )
}

/* ══════════════════════════════════════════ */

export default function PanelView({ solicitudes, updateSolicitud, showToast, currentUser, prioridades, updatePrioridad, resetDefaults, fuentes }) {
    const [modalMover,         setModalMover]         = useState(null)
    const [modalResp,          setModalResp]          = useState(null)   // null | solicitud | 'bulk'
    const [modalVer,           setModalVer]           = useState(null)
    const [modalConfig,        setModalConfig]        = useState(false)
    const [modalHistorial,     setModalHistorial]     = useState(null)   // null | {correo, solicitante}
    const [modalSolicitantes,  setModalSolicitantes]  = useState(false)
    const [bulkMode,           setBulkMode]           = useState(false)

    const [filtroEstado,     setFiltroEstado]     = useState('todos')
    const [filtroSeccion,    setFiltroSeccion]    = useState('todas')
    const [busqueda,      setBusqueda]      = useState('')
    const [sortState,     setSortState]     = useState({ col: 'fecha', dir: 'desc' })

    const handleSort = (col) => {
        setSortState(prev =>
            prev.col === col
                ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                : { col, dir: SORT_DEFAULT_DIR[col] ?? 'asc' }
        )
    }

    // Selección múltiple — persiste aunque cambien los filtros
    const [selected, setSelected] = useState(new Set())

    const [respForm, setRespForm] = useState({
        estadoSolicitud: 'Realizado',
        fechaPosicionamiento: '',
        responsableContestacion: '',
        observaciones: '',
        nuevoResponsable: '',
        planAccion: '',
        nuevaAsignacion: '',
        ccRespuesta: '',
        enviar: 'NO',
    })

    const emptyRespForm = () => ({
        estadoSolicitud: 'Realizado',
        fechaPosicionamiento: new Date().toISOString().split('T')[0],
        responsableContestacion: currentUser?.email || '',
        observaciones: '',
        nuevoResponsable: '',
        planAccion: '',
        nuevaAsignacion: '',
        ccRespuesta: '',
        enviar: 'NO',
    })

    const recibidos     = solicitudes.filter(s => s.estado === 'recibido')
    const enSeccion     = solicitudes.filter(s => s.estado === 'seccion')
    const respondidos   = solicitudes.filter(s => s.estado === 'respondido')

    const filtered = useMemo(() => solicitudes
        .filter(s => filtroEstado === 'todos' || s.estado === filtroEstado)
        .filter(s => filtroSeccion === 'todas' || s.seccion === filtroSeccion)
        .filter(s => {
            if (!busqueda.trim()) return true
            const q = busqueda.toLowerCase()
            return [s.smsDescripcion, s.solicitante, s.correo, s.codtienda, s.peticion, s.empresa]
                .some(v => v?.toLowerCase().includes(q))
        })
        .sort((a, b) => {
            const va = sortVal(a, sortState.col)
            const vb = sortVal(b, sortState.col)
            let cmp = typeof va === 'number' ? va - vb : va.localeCompare(vb, 'es')
            if (cmp !== 0) return sortState.dir === 'asc' ? cmp : -cmp
            // Tiebreaker: prioridad ASC → fecha DESC
            const pa = Number(a.prioridad) || 99, pb = Number(b.prioridad) || 99
            if (pa !== pb) return pa - pb
            return (b.fecha || b.id).localeCompare(a.fecha || a.id)
        }), [solicitudes, filtroEstado, filtroSeccion, busqueda, sortState])

    // Solo los no-respondidos son seleccionables
    const selectableFiltered = filtered.filter(s => s.estado !== 'respondido')
    const allVisibleSelected = selectableFiltered.length > 0 && selectableFiltered.every(s => selected.has(s.id))
    const someVisibleSelected = selectableFiltered.some(s => selected.has(s.id))

    const toggleSelect = (id) => {
        setSelected(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const toggleAll = () => {
        setSelected(prev => {
            const next = new Set(prev)
            if (allVisibleSelected) {
                selectableFiltered.forEach(s => next.delete(s.id))
            } else {
                selectableFiltered.forEach(s => next.add(s.id))
            }
            return next
        })
    }

    const clearSelection = () => setSelected(new Set())

    /* ── Acciones ── */

    const confirmarMover = () => {
        updateSolicitud(modalMover.id, { estado: 'seccion' })
        showToast(`✓ Movido a ${HOJA_MAP[modalMover.seccion] || 'Sección'}`, 'success')
        setModalMover(null)
    }

    const openResponder = (s) => {
        setBulkMode(false)
        setModalResp(s)
        setRespForm(emptyRespForm())
    }

    const openBulkResponder = () => {
        setBulkMode(true)
        setModalResp('bulk')
        setRespForm(emptyRespForm())
    }

    const confirmarRespuesta = () => {
        if (!respForm.observaciones.trim()) {
            showToast('⚠ Las observaciones son obligatorias', 'error')
            return
        }
        const fecha = new Date().toLocaleDateString('es-ES')
        const update = { estado: 'respondido', fechaRespuesta: fecha, ...respForm }

        if (bulkMode) {
            selected.forEach(id => updateSolicitud(id, update))
            showToast(`✓ ${selected.size} solicitudes marcadas como respondidas`, 'success')
            clearSelection()
            setBulkMode(false)
        } else {
            updateSolicitud(modalResp.id, update)
            showToast(
                respForm.enviar === 'SI'
                    ? `✓ Respondido — se enviará email a ${modalResp.correo}`
                    : '✓ Marcado como respondido',
                'success'
            )
        }
        setModalResp(null)
    }

    const closeRespModal = () => {
        setModalResp(null)
        setBulkMode(false)
    }

    const openSheetsExport = () => {
        const url = 'https://docs.google.com/spreadsheets/d/1RbfhsLHWqqWGKsqV0d7-PQUAedDOVfs9QwfK9nPV-X0/edit'
        const header = [
            'Marca temporal','Correo','SECCIÓN','PETICIÓN','EMPRESA','COD TIENDA','COMENTARIOS',
            'SMS/DESCRIPCION','PLAN SEVILLA','ETIQUETADO PROVEEDOR','FECHA VIGOR ETIQUETADO',
            'PVP ACTUAL CRF','PVP RECOMENDADO','PVP MERCADONA','PVP LIDL','PVP ALCAMPO',
            'Adjuntar fichero','PRIORIDAD','NUEVO RESPONSABLE','PLAN DE ACCION','NUEVA ASIGNACION',
            'ESTADO SOLICITUD','FECHA POSICIONAMIENTO','RESPONSABLE CONTESTACION','OBSERVACIONES','ENVIAR','CC',
        ].join('\t')
        const rows = solicitudes.map(s => [
            s.timestamp, s.correo, s.seccion, s.peticion, s.empresa, s.codtienda, s.comentarios,
            s.smsDescripcion, s.planSevilla, s.etiquetadoProveedor, s.fechaVigor,
            s.pvpActual, s.pvpRec, s.pvpMercadona, s.pvpLidl, s.pvpAlcampo,
            s.adjuntoUrl, s.prioridad, s.nuevoResponsable, s.planAccion, s.nuevaAsignacion,
            s.estadoSolicitud, s.fechaPosicionamiento, s.responsableContestacion, s.observaciones,
            s.enviar, s.cc,
        ].join('\t')).join('\n')
        navigator.clipboard.writeText(header + '\n' + rows).then(() => {
            showToast('📋 Datos copiados — pega en Sheets con Ctrl+V', 'success')
            setTimeout(() => window.open(url, '_blank'), 1200)
        }).catch(() => window.open(url, '_blank'))
    }

    /* ── Render ── */

    const respModalTitle = bulkMode
        ? `RESPONDER ${selected.size} SOLICITUDES`
        : 'RESPONDER SOLICITUD'

    return (
        <div className={styles.wrap}>
            <div className={styles.header}>
                <div className={styles.title}>PANEL DE GESTIÓN</div>
                <button className={styles.configBtn} onClick={() => setModalConfig(true)}>⚙ Prioridades</button>
                <button className={styles.solicitantesBtn} onClick={() => setModalSolicitantes(true)}>👥 Solicitantes</button>
                <a
                    href="https://docs.google.com/spreadsheets/d/1RbfhsLHWqqWGKsqV0d7-PQUAedDOVfs9QwfK9nPV-X0/edit"
                    target="_blank"
                    rel="noreferrer"
                    className={styles.exportBtn}
                >📊 Exportar masivos</a>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
                {[
                    ['Total recibidas', solicitudes.length, ''],
                    ['Pendientes',       recibidos.length,  styles.red],
                    ['En proceso',       enSeccion.length,  styles.orange],
                    ['Respondidas',      respondidos.length, styles.green],
                ].map(([label, val, cls]) => (
                    <div key={label} className={styles.statCard}>
                        <div className={styles.statLabel}>{label}</div>
                        <div className={`${styles.statValue} ${cls}`}>{val}</div>
                    </div>
                ))}
            </div>

            {/* Filter bar */}
            <div className={styles.filterBar}>
                <div className={styles.estadoTabs}>
                    {[
                        { key: 'todos',      label: 'Todos',       count: solicitudes.length },
                        { key: 'recibido',   label: 'Recibidos',   count: recibidos.length },
                        { key: 'seccion',    label: 'En Progreso',  count: enSeccion.length },
                        { key: 'respondido', label: 'Respondidos', count: respondidos.length },
                    ].map(({ key, label, count }) => (
                        <button
                            key={key}
                            className={`${styles.estadoTab} ${filtroEstado === key ? styles.tabActive : ''}`}
                            onClick={() => setFiltroEstado(key)}
                        >
                            {label}
                            <span className={`${styles.tabCount} ${filtroEstado === key ? styles.tabCountActive : ''}`}>{count}</span>
                        </button>
                    ))}
                </div>
                <div className={styles.filterRight}>
                    <select className={styles.seccionSelect} value={filtroSeccion} onChange={e => setFiltroSeccion(e.target.value)}>
                        {SECCIONES_FILTER.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                    <div className={styles.searchWrap}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            className={styles.searchInput}
                            placeholder="Buscar producto, solicitante, tienda..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                        />
                        {busqueda && <button className={styles.searchClear} onClick={() => setBusqueda('')}>✕</button>}
                    </div>
                </div>
            </div>

            {/* Barra de acción masiva */}
            {selected.size > 0 && (
                <div className={styles.bulkBar}>
                    <div className={styles.bulkLeft}>
                        <div className={styles.bulkCount}>{selected.size}</div>
                        <span className={styles.bulkCountLabel}>
                            solicitud{selected.size !== 1 ? 'es' : ''} seleccionada{selected.size !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className={styles.bulkActions}>
                        <button className={styles.bulkRespBtn} onClick={openBulkResponder}>
                            ✓ Responder todas ({selected.size})
                        </button>
                        <button className={styles.bulkClearBtn} onClick={clearSelection}>
                            ✕ Deseleccionar
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className={styles.tableWrap}>
                {filtered.length === 0 ? (
                    <div className={styles.emptyTable}>
                        <div className={styles.eIcon}>📭</div>
                        <div>Sin solicitudes con estos filtros</div>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.thCheck}>
                                    <input
                                        type="checkbox"
                                        className={styles.checkbox}
                                        checked={allVisibleSelected}
                                        ref={el => { if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected }}
                                        onChange={toggleAll}
                                        title="Seleccionar todos los visibles"
                                    />
                                </th>
                                {[
                                    { col: 'prioridad',    label: 'Prioridad' },
                                    { col: 'fecha',        label: 'Fecha' },
                                    { col: 'seccion',      label: 'Sección' },
                                    { col: 'peticion',     label: 'Petición' },
                                    { col: 'descripcion',  label: 'Descripción' },
                                    { col: 'homologado',   label: 'Homologado' },
                                    { col: 'empresa',      label: 'Empresa · Tienda' },
                                    { col: 'pvpRec',       label: 'CRF Rec.' },
                                    { col: 'pvpMercadona', label: 'Mcdna' },
                                    { col: 'pvpAlcampo',   label: 'Alcampo' },
                                    { col: 'estado',       label: 'Estado' },
                                ].map(({ col, label }) => {
                                    const active = sortState.col === col
                                    return (
                                        <th
                                            key={col}
                                            className={`${styles.thSortable} ${active ? styles.thSortActive : ''}`}
                                            onClick={() => handleSort(col)}
                                        >
                                            {label}
                                            <span className={styles.sortIcon}>
                                                {active ? (sortState.dir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
                                            </span>
                                        </th>
                                    )
                                })}
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => {
                                const secClass   = SECCION_COLOR[s.seccion] || styles.secDefault
                                const respondido = s.estado === 'respondido'
                                const recibido   = s.estado === 'recibido'
                                const isSelected = selected.has(s.id)
                                return (
                                    <tr
                                        key={s.id}
                                        className={`${styles.tableRow} ${isSelected ? styles.rowSelected : ''}`}
                                        onClick={() => setModalVer(s)}
                                    >
                                        <td className={styles.tdCheck} onClick={e => e.stopPropagation()}>
                                            {!respondido && (
                                                <input
                                                    type="checkbox"
                                                    className={styles.checkbox}
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(s.id)}
                                                />
                                            )}
                                        </td>
                                        <td><PrioridadBadge nivel={s.prioridad} /></td>
                                        <td className={styles.tdDate}>{s.timestamp}</td>
                                        <td><span className={`${styles.secBadge} ${secClass}`}>{s.seccion}</span></td>
                                        <td className={styles.tdPeticion}>{s.peticion}</td>
                                        <td className={styles.tdDesc}>{s.smsDescripcion || '—'}</td>
                                        <td>
                                            {s.homologado === 'Sí' ? (
                                                <span className={`${styles.homBadge} ${styles.homBadgeSi}`} title={`Homologado en: ${(s.homologadoFuentes || []).join(', ') || '—'}`}>
                                                    ✓ Sí
                                                </span>
                                            ) : s.homologado === 'No' ? (
                                                <span className={`${styles.homBadge} ${styles.homBadgeNo}`}>✗ No</span>
                                            ) : (
                                                <span className={`${styles.homBadge} ${styles.homBadgeUnk}`}>—</span>
                                            )}
                                        </td>
                                        <td className={styles.tdEmpresa}>{s.empresa}{s.codtienda ? ` · ${s.codtienda}` : ''}</td>
                                        <td className={styles.tdPrice}>{s.pvpRec ? `€${s.pvpRec}` : '—'}</td>
                                        <td className={styles.tdPrice}>{s.pvpMercadona ? `€${s.pvpMercadona}` : '—'}</td>
                                        <td className={styles.tdPrice}>{s.pvpAlcampo ? `€${s.pvpAlcampo}` : '—'}</td>
                                        <td><EstadoBadge estado={s.estado} /></td>
                                        <td className={styles.tdActions} onClick={e => e.stopPropagation()}>
                                            {recibido && (
                                                <button className={`${styles.btnSm} ${styles.btnSmMover}`} onClick={() => setModalMover(s)}>Activar</button>
                                            )}
                                            {!respondido && (
                                                <button className={`${styles.btnSm} ${styles.btnSmResp}`} onClick={() => openResponder(s)}>Responder</button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
                <div className={styles.tableFooter}>
                    {filtered.length} solicitud{filtered.length !== 1 ? 'es' : ''} mostrada{filtered.length !== 1 ? 's' : ''}
                    {solicitudes.length !== filtered.length && ` de ${solicitudes.length} total`}
                    {selected.size > 0 && <span className={styles.footerSel}> · {selected.size} seleccionada{selected.size !== 1 ? 's' : ''}</span>}
                </div>
            </div>

            {/* Modal: Mover */}
            <Modal show={!!modalMover} onClose={() => setModalMover(null)} title="MOVER A SECCIÓN"
                   footer={<>
                       <button className={styles.btnCancel} onClick={() => setModalMover(null)}>Cancelar</button>
                       <button className={styles.btnConfirm} onClick={confirmarMover}>✓ MOVER A SECCIÓN</button>
                   </>}>
                {modalMover && <>
                    <p className={styles.modalInfo}>
                        La solicitud se moverá a: <strong style={{ color: 'var(--blue)' }}>{HOJA_MAP[modalMover.seccion] || 'Sección'}</strong>
                    </p>
                    <DetailGrid s={modalMover} />
                </>}
            </Modal>

            {/* Modal: Responder (individual o masivo) */}
            <Modal show={!!modalResp} onClose={closeRespModal} title={respModalTitle}
                   footer={<>
                       <button className={styles.btnCancel} onClick={closeRespModal}>Cancelar</button>
                       <button className={`${styles.btnConfirm} ${styles.green}`} onClick={confirmarRespuesta}>
                           {bulkMode ? `✓ RESPONDER ${selected.size} SOLICITUDES` : '✓ MARCAR COMO RESPONDIDO'}
                       </button>
                   </>}>
                {modalResp && (
                    bulkMode ? (
                        <div className={styles.bulkSummary}>
                            <div className={styles.bulkSummaryIcon}>📋</div>
                            <div>
                                <div className={styles.bulkSummaryTitle}>{selected.size} solicitudes seleccionadas</div>
                                <div className={styles.bulkSummaryText}>
                                    La misma respuesta se aplicará a todas las solicitudes seleccionadas.
                                    Los datos de cada solicitud (correo, tienda, precios) se conservan individualmente.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <DetailGrid s={modalResp} />
                    )
                )}
                <RespForm
                    form={respForm}
                    onChange={setRespForm}
                    modalResp={modalResp}
                    bulkMode={bulkMode}
                    selectedCount={selected.size}
                />
            </Modal>

            {/* Modal: Configuración de prioridades */}
            <Modal show={modalConfig} onClose={() => setModalConfig(false)} title="CONFIGURACIÓN DE PRIORIDADES"
                   footer={<>
                       <button className={styles.btnCancel} onClick={() => { resetDefaults(); showToast('✓ Prioridades restauradas por defecto', 'success') }}>
                           Restaurar por defecto
                       </button>
                       <button className={styles.btnConfirm} onClick={() => setModalConfig(false)}>
                           ✓ GUARDAR Y CERRAR
                       </button>
                   </>}>
                <p className={styles.modalInfo}>
                    Define la prioridad asignada automáticamente al crear una solicitud según el tipo de petición.
                </p>
                <div className={styles.configGrid}>
                    {Object.keys(prioridades || DEFAULT_PRIORIDADES).map(peticion => (
                        <div key={peticion} className={styles.configRow}>
                            <span className={styles.configPeticion}>{peticion}</span>
                            <div className={styles.configNiveles}>
                                {[1, 2, 3, 4, 5].map(n => {
                                    const current = (prioridades || DEFAULT_PRIORIDADES)[peticion]
                                    return (
                                        <button
                                            key={n}
                                            className={`${styles.nivelBtn} ${PRIO_CLS[n]} ${current === n ? styles.nivelActive : ''}`}
                                            onClick={() => updatePrioridad(peticion, n)}
                                            title={NIVEL_LABELS[n]}
                                        >
                                            P{n}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>


            {/* Lista de todos los solicitantes */}
            <SolicitantesListModal
                show={modalSolicitantes}
                onClose={() => setModalSolicitantes(false)}
                solicitudes={solicitudes}
                onSelectSolicitante={(correo, solicitante) => setModalHistorial({ correo, solicitante, fromList: true })}
            />

            {/* Historial por solicitante */}
            <SolicitanteHistorialModal
                show={!!modalHistorial}
                onClose={() => setModalHistorial(null)}
                onBack={modalHistorial?.fromList
                    ? () => { setModalHistorial(null); setModalSolicitantes(true) }
                    : undefined}
                correo={modalHistorial?.correo}
                solicitante={modalHistorial?.solicitante}
                solicitudes={solicitudes}
            />

            {/* Modal: Ver detalle */}
            <Modal show={!!modalVer} onClose={() => setModalVer(null)} title="DETALLE SOLICITUD"
                   footer={<>
                       <button
                           className={styles.btnHistorial}
                           onClick={() => {
                               const s = modalVer
                               setModalVer(null)
                               setModalHistorial({ correo: s.correo, solicitante: s.solicitante })
                           }}
                       >
                           📊 Historial del solicitante
                       </button>
                       <button className={styles.btnCancel} style={{ flex: 1 }} onClick={() => setModalVer(null)}>Cerrar</button>
                   </>}>
                {modalVer && <>
                    <DetailGrid s={modalVer} />
                    <PvpPenInfo record={lookupPvpPeninsula(fuentes, modalVer.smsDescripcion)} solicitud={modalVer} />
                    {modalVer.estado === 'respondido' && (
                        <div className={styles.respResumen}>
                            <div className={styles.detailGrid}>
                                <div className={styles.detailItem} style={{ gridColumn: '1/-1' }}>
                                    <DLabel label="Estado solicitud" />
                                    <div className={`${styles.dVal} ${styles.estadoBadge}`}>{modalVer.estadoSolicitud}</div>
                                </div>
                                <div className={styles.detailItem}>
                                    <DLabel label="Fecha posicionamiento" /><DVal val={modalVer.fechaPosicionamiento} />
                                </div>
                                <div className={styles.detailItem}>
                                    <DLabel label="Responsable" /><DVal val={modalVer.responsableContestacion} />
                                </div>
                                <div className={styles.detailItem} style={{ gridColumn: '1/-1' }}>
                                    <DLabel label="Observaciones" />
                                    <div className={styles.dVal} style={{ color: 'var(--success)' }}>{modalVer.observaciones}</div>
                                </div>
                                {modalVer.nuevoResponsable && <div className={styles.detailItem}><DLabel label="Nuevo responsable" /><DVal val={modalVer.nuevoResponsable} /></div>}
                                {modalVer.planAccion && <div className={styles.detailItem}><DLabel label="Plan acción" /><DVal val={modalVer.planAccion} /></div>}
                            </div>
                        </div>
                    )}
                </>}
            </Modal>
        </div>
    )
}
