import React, { useState } from 'react'
import Modal from '../Modal/Modal'
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
function DVal({ val })   { return <div className={styles.dVal}>{val || '—'}</div> }

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
    if (estado === 'seccion')    return <span className={`${styles.estadoChip} ${styles.chipSeccion}`}>En Sección</span>
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

export default function PanelView({ solicitudes, updateSolicitud, showToast, currentUser, prioridades, updatePrioridad, resetDefaults }) {
    const [modalMover,   setModalMover]   = useState(null)
    const [modalResp,    setModalResp]    = useState(null)
    const [modalVer,     setModalVer]     = useState(null)
    const [modalConfig,  setModalConfig]  = useState(false)
    const [filtroEstado,  setFiltroEstado]  = useState('todos')
    const [filtroSeccion, setFiltroSeccion] = useState('todas')
    const [busqueda,      setBusqueda]      = useState('')

    const [respForm, setRespForm] = useState({
        estadoSolicitud: 'Realizado',
        fechaPosicionamiento: '',
        responsableContestacion: '',
        observaciones: '',
        nuevoResponsable: '',
        planAccion: '',
        nuevaAsignacion: '',
        enviar: 'NO',
    })

    const recibidos   = solicitudes.filter(s => s.estado === 'recibido')
    const enSeccion   = solicitudes.filter(s => s.estado === 'seccion')
    const respondidos = solicitudes.filter(s => s.estado === 'respondido')

    const filtered = solicitudes
        .filter(s => filtroEstado === 'todos' || s.estado === filtroEstado)
        .filter(s => filtroSeccion === 'todas' || s.seccion === filtroSeccion)
        .filter(s => {
            if (!busqueda.trim()) return true
            const q = busqueda.toLowerCase()
            return [s.smsDescripcion, s.solicitante, s.correo, s.codtienda, s.peticion, s.empresa]
                .some(v => v?.toLowerCase().includes(q))
        })
        .sort((a, b) => {
            const pa = Number(a.prioridad) || 99
            const pb = Number(b.prioridad) || 99
            if (pa !== pb) return pa - pb
            return b.id.localeCompare(a.id)
        })

    const confirmarMover = () => {
        updateSolicitud(modalMover.id, { estado: 'seccion' })
        showToast(`✓ Movido a ${HOJA_MAP[modalMover.seccion] || 'Sección'}`, 'success')
        setModalMover(null)
    }

    const openResponder = (s) => {
        setModalResp(s)
        setRespForm({
            estadoSolicitud: 'Realizado',
            fechaPosicionamiento: new Date().toISOString().split('T')[0],
            responsableContestacion: currentUser?.email || '',
            observaciones: '',
            nuevoResponsable: '',
            planAccion: '',
            nuevaAsignacion: '',
            enviar: 'NO',
        })
    }

    const confirmarRespuesta = () => {
        if (!respForm.observaciones.trim()) {
            showToast('⚠ Las observaciones son obligatorias', 'error')
            return
        }
        updateSolicitud(modalResp.id, {
            estado: 'respondido',
            fechaRespuesta: new Date().toLocaleDateString('es-ES'),
            ...respForm,
        })
        showToast(
            respForm.enviar === 'SI'
                ? `✓ Respondido — se enviará email a ${modalResp.correo}`
                : '✓ Marcado como respondido',
            'success'
        )
        setModalResp(null)
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

    return (
        <div className={styles.wrap}>
            <div className={styles.header}>
                <div className={styles.title}>PANEL DE GESTIÓN</div>
                <button className={styles.configBtn} onClick={() => setModalConfig(true)}>⚙ Prioridades</button>
                <button className={styles.exportBtn} onClick={openSheetsExport}>📊 Exportar a Sheets</button>
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
                        { key: 'todos',      label: 'Todos',        count: solicitudes.length },
                        { key: 'recibido',   label: 'Recibidos',    count: recibidos.length },
                        { key: 'seccion',    label: 'En Sección',   count: enSeccion.length },
                        { key: 'respondido', label: 'Respondidos',  count: respondidos.length },
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
                    <select
                        className={styles.seccionSelect}
                        value={filtroSeccion}
                        onChange={e => setFiltroSeccion(e.target.value)}
                    >
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
                        {busqueda && (
                            <button className={styles.searchClear} onClick={() => setBusqueda('')}>✕</button>
                        )}
                    </div>
                </div>
            </div>

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
                                <th>Prioridad</th>
                                <th>Fecha</th>
                                <th>Sección</th>
                                <th>Petición</th>
                                <th>Descripción</th>
                                <th>Empresa · Tienda</th>
                                <th>CRF Rec.</th>
                                <th>Mcdna</th>
                                <th>Alcampo</th>
                                <th>Estado</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => {
                                const secClass = SECCION_COLOR[s.seccion] || styles.secDefault
                                const respondido = s.estado === 'respondido'
                                const recibido   = s.estado === 'recibido'
                                return (
                                    <tr key={s.id} className={styles.tableRow} onClick={() => setModalVer(s)}>
                                        <td><PrioridadBadge nivel={s.prioridad} /></td>
                                        <td className={styles.tdDate}>{s.timestamp}</td>
                                        <td><span className={`${styles.secBadge} ${secClass}`}>{s.seccion}</span></td>
                                        <td className={styles.tdPeticion}>{s.peticion}</td>
                                        <td className={styles.tdDesc}>{s.smsDescripcion || '—'}</td>
                                        <td className={styles.tdEmpresa}>{s.empresa}{s.codtienda ? ` · ${s.codtienda}` : ''}</td>
                                        <td className={styles.tdPrice}>{s.pvpRec ? `€${s.pvpRec}` : '—'}</td>
                                        <td className={styles.tdPrice}>{s.pvpMercadona ? `€${s.pvpMercadona}` : '—'}</td>
                                        <td className={styles.tdPrice}>{s.pvpAlcampo ? `€${s.pvpAlcampo}` : '—'}</td>
                                        <td><EstadoBadge estado={s.estado} /></td>
                                        <td className={styles.tdActions} onClick={e => e.stopPropagation()}>
                                            {recibido && (
                                                <button className={`${styles.btnSm} ${styles.btnSmMover}`} onClick={() => setModalMover(s)}>→ Sección</button>
                                            )}
                                            {!respondido && (
                                                <button className={`${styles.btnSm} ${styles.btnSmResp}`} onClick={() => openResponder(s)}>✓ Responder</button>
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

            {/* Modal: Responder */}
            <Modal show={!!modalResp} onClose={() => setModalResp(null)} title="RESPONDER SOLICITUD"
                   footer={<>
                       <button className={styles.btnCancel} onClick={() => setModalResp(null)}>Cancelar</button>
                       <button className={`${styles.btnConfirm} ${styles.green}`} onClick={confirmarRespuesta}>
                           ✓ MARCAR COMO RESPONDIDO
                       </button>
                   </>}>
                {modalResp && <>
                    <DetailGrid s={modalResp} />
                    <div className={styles.respArea}>
                        <div className={styles.respGrid}>
                            <div className={styles.respField}>
                                <label className={styles.respLabel}>Estado solicitud</label>
                                <select value={respForm.estadoSolicitud} onChange={e => setRespForm(f => ({ ...f, estadoSolicitud: e.target.value }))}>
                                    {ESTADO_OPTS.map(o => <option key={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className={styles.respField}>
                                <label className={styles.respLabel}>Fecha posicionamiento</label>
                                <input type="date" value={respForm.fechaPosicionamiento} onChange={e => setRespForm(f => ({ ...f, fechaPosicionamiento: e.target.value }))} />
                            </div>
                            <div className={styles.respField} style={{ gridColumn: '1/-1' }}>
                                <label className={styles.respLabel}>Responsable contestación</label>
                                <input type="text" value={respForm.responsableContestacion} onChange={e => setRespForm(f => ({ ...f, responsableContestacion: e.target.value }))} placeholder="email@carrefour.es" />
                            </div>
                            <div className={styles.respField} style={{ gridColumn: '1/-1' }}>
                                <label className={styles.respLabel}>Observaciones <span style={{ color: 'var(--red)' }}>*</span></label>
                                <textarea value={respForm.observaciones} onChange={e => setRespForm(f => ({ ...f, observaciones: e.target.value }))} placeholder="Escribe la respuesta o resolución de la solicitud..." />
                            </div>
                            <div className={styles.respField}>
                                <label className={styles.respLabel}>Nuevo responsable</label>
                                <input type="text" value={respForm.nuevoResponsable} onChange={e => setRespForm(f => ({ ...f, nuevoResponsable: e.target.value }))} placeholder="email@carrefour.es" />
                            </div>
                            <div className={styles.respField}>
                                <label className={styles.respLabel}>Plan de acción</label>
                                <input type="text" value={respForm.planAccion} onChange={e => setRespForm(f => ({ ...f, planAccion: e.target.value }))} placeholder="Descripción del plan..." />
                            </div>
                            <div className={styles.respField} style={{ gridColumn: '1/-1' }}>
                                <label className={styles.respLabel}>Nueva asignación</label>
                                <input type="text" value={respForm.nuevaAsignacion} onChange={e => setRespForm(f => ({ ...f, nuevaAsignacion: e.target.value }))} placeholder="Persona o equipo asignado..." />
                            </div>
                        </div>

                        <div className={styles.enviarRow}>
                            <div className={styles.enviarLabel}>
                                <span>📧</span>
                                <div>
                                    <strong>Enviar respuesta por email</strong>
                                    <small>Se enviará a {modalResp?.correo}{modalResp?.cc ? ` (CC: ${modalResp.cc})` : ''}</small>
                                </div>
                            </div>
                            <div className={styles.enviarToggle}>
                                {['SI', 'NO'].map(v => (
                                    <label key={v} className={`${styles.toggleOpt} ${respForm.enviar === v ? styles.toggleActive : ''}`}>
                                        <input type="radio" checked={respForm.enviar === v} onChange={() => setRespForm(f => ({ ...f, enviar: v }))} />
                                        {v}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </>}
            </Modal>

            {/* Modal: Configuración de prioridades */}
            <Modal show={modalConfig} onClose={() => setModalConfig(false)} title="CONFIGURACIÓN DE PRIORIDADES"
                   footer={<>
                       <button className={styles.btnCancel} onClick={() => { resetDefaults(); showToast('✓ Prioridades restauradas por defecto', 'success') }}>
                           Restaurar por defecto
                       </button>
                       <button className={`${styles.btnConfirm}`} onClick={() => setModalConfig(false)}>
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

            {/* Modal: Ver detalle */}
            <Modal show={!!modalVer} onClose={() => setModalVer(null)} title="DETALLE SOLICITUD"
                   footer={<button className={styles.btnCancel} style={{ flex: 1 }} onClick={() => setModalVer(null)}>Cerrar</button>}>
                {modalVer && <>
                    <DetailGrid s={modalVer} />
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
