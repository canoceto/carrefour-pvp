import React, { useMemo, useState } from 'react'
import Modal from '../Modal/Modal'
import styles from './SolicitantesListModal.module.css'

export default function SolicitantesListModal({ show, onClose, solicitudes, onSelectSolicitante }) {
    const [busqueda, setBusqueda] = useState('')

    const solicitantes = useMemo(() => {
        const map = {}
        solicitudes.forEach(s => {
            if (!s.correo) return
            if (!map[s.correo]) {
                map[s.correo] = {
                    correo:     s.correo,
                    nombre:     s.solicitante || s.correo,
                    total:      0,
                    realizado:  0,
                    rechazado:  0,
                    revisado:   0,
                    pendiente:  0,
                    respondido: 0,
                    ultima:     '',
                }
            }
            const e = map[s.correo]
            e.total++
            if (s.estado === 'respondido') e.respondido++
            const r = s.estadoSolicitud
            if (r === 'Realizado') e.realizado++
            else if (r === 'Rechazado') e.rechazado++
            else if (r === 'Revisado') e.revisado++
            else e.pendiente++
            if (!e.ultima || s.id > e.ultima) e.ultima = s.id
        })
        return Object.values(map).sort((a, b) => b.total - a.total)
    }, [solicitudes])

    const filtrados = useMemo(() => {
        if (!busqueda.trim()) return solicitantes
        const q = busqueda.toLowerCase()
        return solicitantes.filter(
            s => s.nombre.toLowerCase().includes(q) || s.correo.toLowerCase().includes(q)
        )
    }, [solicitantes, busqueda])

    const handleSelect = (s) => {
        onClose()
        onSelectSolicitante(s.correo, s.nombre)
    }

    return (
        <Modal
            show={show}
            onClose={onClose}
            title="SOLICITANTES"
            size="lg"
            footer={
                <button className={styles.btnCerrar} onClick={onClose}>Cerrar</button>
            }
        >
            <div className={styles.layout}>
                {/* Buscador */}
                <div className={styles.searchBar}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        className={styles.searchInput}
                        placeholder="Buscar por nombre o correo..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        autoFocus
                    />
                    {busqueda && (
                        <button className={styles.searchClear} onClick={() => setBusqueda('')}>✕</button>
                    )}
                </div>

                {/* Cabecera de columnas */}
                <div className={styles.listHeader}>
                    <div className={styles.colSolicitante}>Solicitante</div>
                    <div className={styles.colNum}>Total</div>
                    <div className={styles.colNum} style={{ color: 'var(--success)' }}>Realizadas</div>
                    <div className={styles.colNum} style={{ color: 'var(--red)' }}>Rechazadas</div>
                    <div className={styles.colNum} style={{ color: 'var(--warning)' }}>Revisadas</div>
                    <div className={styles.colNum}>Pendientes</div>
                    <div className={styles.colBarra}>Tasa respuesta</div>
                </div>

                {/* Lista */}
                <div className={styles.scroll}>
                    {filtrados.length === 0 ? (
                        <div className={styles.empty}>
                            <div className={styles.emptyIcon}>🔍</div>
                            <div>No se encontraron solicitantes</div>
                        </div>
                    ) : (
                        filtrados.map((s, idx) => {
                            const tasa = s.total > 0 ? Math.round((s.respondido / s.total) * 100) : 0
                            return (
                                <button key={s.correo} className={styles.row} onClick={() => handleSelect(s)}>
                                    <div className={styles.colSolicitante}>
                                        <div className={styles.avatar}>{s.nombre[0].toUpperCase()}</div>
                                        <div className={styles.info}>
                                            <div className={styles.nombre}>{s.nombre}</div>
                                            <div className={styles.correo}>{s.correo}</div>
                                        </div>
                                        {idx < 3 && (
                                            <span className={`${styles.rankBadge} ${idx === 0 ? styles.rank1 : idx === 1 ? styles.rank2 : styles.rank3}`}>
                                                #{idx + 1}
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.colNum}>
                                        <span className={styles.numTotal}>{s.total}</span>
                                    </div>
                                    <div className={styles.colNum}>
                                        <span className={styles.numGreen}>{s.realizado || '—'}</span>
                                    </div>
                                    <div className={styles.colNum}>
                                        <span className={styles.numRed}>{s.rechazado || '—'}</span>
                                    </div>
                                    <div className={styles.colNum}>
                                        <span className={styles.numOrange}>{s.revisado || '—'}</span>
                                    </div>
                                    <div className={styles.colNum}>
                                        <span className={styles.numGray}>{s.pendiente || '—'}</span>
                                    </div>
                                    <div className={styles.colBarra}>
                                        <div className={styles.tasaWrap}>
                                            <div className={styles.tasaBar}>
                                                <div
                                                    className={`${styles.tasaFill} ${tasa >= 80 ? styles.tasaGreen : tasa >= 40 ? styles.tasaOrange : styles.tasaRed}`}
                                                    style={{ width: `${tasa}%` }}
                                                />
                                            </div>
                                            <span className={styles.tasaNum}>{tasa}%</span>
                                        </div>
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>

                <div className={styles.footer}>
                    {filtrados.length} solicitante{filtrados.length !== 1 ? 's' : ''}
                    {solicitantes.length !== filtrados.length && ` de ${solicitantes.length} total`}
                    {' · '}Haz click en cualquiera para ver su historial completo
                </div>
            </div>
        </Modal>
    )
}
