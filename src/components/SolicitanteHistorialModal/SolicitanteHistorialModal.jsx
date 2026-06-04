import React, { useMemo } from 'react'
import Modal from '../Modal/Modal'
import styles from './SolicitanteHistorialModal.module.css'

const SECCION_COLOR = {
    CARNICERIA:           styles.secCarniceria,
    FRUTERIA:             styles.secFruteria,
    CHARCUTERIA:          styles.secCharcuteria,
    PANADERIA:            styles.secPanaderia,
    PESCADERIA:           styles.secPescaderia,
    'PLATOS PREPARADOS':  styles.secPlatos,
}

const RESULTADO_CLS = {
    Realizado: styles.resRealizado,
    Rechazado: styles.resRechazado,
    Revisado:  styles.resRevisado,
    Pendiente: styles.resPendiente,
}

function EstadoChip({ estado }) {
    if (estado === 'respondido') return <span className={`${styles.chip} ${styles.chipResp}`}>Respondido</span>
    if (estado === 'seccion')    return <span className={`${styles.chip} ${styles.chipSec}`}>En Progreso</span>
    return <span className={`${styles.chip} ${styles.chipRec}`}>Recibido</span>
}

function ResultadoBadge({ val }) {
    return <span className={`${styles.resultBadge} ${RESULTADO_CLS[val] || ''}`}>{val}</span>
}

export default function SolicitanteHistorialModal({ show, onClose, onBack, correo, solicitante, solicitudes }) {
    const historial = useMemo(() => {
        if (!correo) return []
        return [...solicitudes]
            .filter(s => s.correo === correo)
            .sort((a, b) => b.id.localeCompare(a.id))
    }, [correo, solicitudes])

    const stats = useMemo(() => {
        const total     = historial.length
        const realizado = historial.filter(s => s.estadoSolicitud === 'Realizado').length
        const rechazado = historial.filter(s => s.estadoSolicitud === 'Rechazado').length
        const revisado  = historial.filter(s => s.estadoSolicitud === 'Revisado').length
        const pendiente = historial.filter(s => !s.estadoSolicitud || s.estadoSolicitud === 'Pendiente').length
        const tasaResp  = total > 0 ? Math.round((historial.filter(s => s.estado === 'respondido').length / total) * 100) : 0
        return { total, realizado, rechazado, revisado, pendiente, tasaResp }
    }, [historial])

    const patrones = useMemo(() => {
        const counts = {}
        historial.forEach(s => {
            if (s.peticion) counts[s.peticion] = (counts[s.peticion] || 0) + 1
        })
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 7)
    }, [historial])

    const maxPatron = patrones[0]?.[1] || 1

    const seccionesUsadas = useMemo(() => {
        const counts = {}
        historial.forEach(s => {
            if (s.seccion) counts[s.seccion] = (counts[s.seccion] || 0) + 1
        })
        return Object.entries(counts).sort((a, b) => b[1] - a[1])
    }, [historial])

    if (!show) return null

    return (
        <Modal
            show={show}
            onClose={onClose}
            title={`HISTORIAL: ${solicitante || correo}`}
            size="lg"
            footer={<>
                {onBack && (
                    <button className={styles.btnVolver} onClick={onBack}>
                        ← Solicitantes
                    </button>
                )}
                <button className={styles.btnCerrar} onClick={onClose}>
                    Cerrar
                </button>
            </>}
        >
            <div className={styles.layout}>
                {historial.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>📭</div>
                        <div>No hay solicitudes registradas para este correo</div>
                    </div>
                ) : (
                    <>
                        {/* Cabecera del solicitante */}
                        <div className={styles.solicitanteHeader}>
                            <div className={styles.avatar}>{(solicitante || correo)[0].toUpperCase()}</div>
                            <div>
                                <div className={styles.solicitanteNombre}>{solicitante || '—'}</div>
                                <div className={styles.solicitanteCorreo}>{correo}</div>
                            </div>
                        </div>

                        <div className={styles.scroll}>
                            {/* Stats */}
                            <div className={styles.statsGrid}>
                                {[
                                    { label: 'Total solicitudes', value: stats.total,     cls: styles.statNeutral },
                                    { label: 'Realizadas',         value: stats.realizado, cls: styles.statGreen   },
                                    { label: 'Rechazadas',         value: stats.rechazado, cls: styles.statRed     },
                                    { label: 'Revisadas',          value: stats.revisado,  cls: styles.statOrange  },
                                    { label: 'Pendientes',         value: stats.pendiente, cls: styles.statGray    },
                                    { label: 'Tasa respuesta',     value: `${stats.tasaResp}%`, cls: stats.tasaResp >= 80 ? styles.statGreen : styles.statOrange },
                                ].map(({ label, value, cls }) => (
                                    <div key={label} className={styles.statCard}>
                                        <div className={styles.statLabel}>{label}</div>
                                        <div className={`${styles.statValue} ${cls}`}>{value}</div>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.columnas}>
                                {/* Patrones de petición */}
                                <div className={styles.panel}>
                                    <div className={styles.panelTitle}>TIPOS DE PETICIÓN MÁS FRECUENTES</div>
                                    <div className={styles.patronesList}>
                                        {patrones.map(([peticion, count]) => (
                                            <div key={peticion} className={styles.patronRow}>
                                                <div className={styles.patronLabel} title={peticion}>{peticion}</div>
                                                <div className={styles.barWrap}>
                                                    <div
                                                        className={styles.barFill}
                                                        style={{ width: `${Math.max(4, (count / maxPatron) * 100)}%` }}
                                                    />
                                                </div>
                                                <div className={styles.patronCount}>{count}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Secciones */}
                                <div className={styles.panel}>
                                    <div className={styles.panelTitle}>SECCIONES SOLICITADAS</div>
                                    <div className={styles.seccionesList}>
                                        {seccionesUsadas.map(([seccion, count]) => (
                                            <div key={seccion} className={styles.seccionRow}>
                                                <span className={`${styles.secBadge} ${SECCION_COLOR[seccion] || styles.secDefault}`}>
                                                    {seccion}
                                                </span>
                                                <span className={styles.seccionCount}>{count} solicitud{count !== 1 ? 'es' : ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Tabla de todas las solicitudes */}
                            <div className={styles.panel}>
                                <div className={styles.panelTitle}>
                                    TODAS LAS SOLICITUDES
                                    <span className={styles.panelCount}>{historial.length}</span>
                                </div>
                                <div className={styles.tableWrap}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Petición</th>
                                                <th>Sección</th>
                                                <th>Descripción</th>
                                                <th>Empresa · Tienda</th>
                                                <th>Estado</th>
                                                <th>Resultado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {historial.map(s => (
                                                <tr key={s.id} className={styles.tableRow}>
                                                    <td className={styles.tdDate}>{s.timestamp}</td>
                                                    <td className={styles.tdPeticion}>{s.peticion}</td>
                                                    <td>
                                                        <span className={`${styles.secBadge} ${SECCION_COLOR[s.seccion] || styles.secDefault}`}>
                                                            {s.seccion}
                                                        </span>
                                                    </td>
                                                    <td className={styles.tdDesc}>{s.smsDescripcion || '—'}</td>
                                                    <td className={styles.tdEmpresa}>
                                                        {s.empresa}{s.codtienda ? ` · ${s.codtienda}` : ''}
                                                    </td>
                                                    <td><EstadoChip estado={s.estado} /></td>
                                                    <td>
                                                        {s.estadoSolicitud
                                                            ? <ResultadoBadge val={s.estadoSolicitud} />
                                                            : <span className={styles.sinResultado}>—</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    )
}
