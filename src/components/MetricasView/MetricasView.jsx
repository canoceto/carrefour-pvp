import React, { useMemo, useState } from 'react'
import styles from './MetricasView.module.css'
import ExportModal from '../ExportModal/ExportModal'

const SECCION_COLORS = {
    CARNICERIA:          '#E2001A',
    FRUTERIA:            '#2e7d32',
    CHARCUTERIA:         '#7b1fa2',
    PANADERIA:           '#e65100',
    PESCADERIA:          '#0277bd',
    'PLATOS PREPARADOS': '#5d4037',
}

const PRIO_META = {
    1: { color: '#b91c1c', bg: '#fef2f2', bar: '#ef4444', label: 'Urgente' },
    2: { color: '#c2410c', bg: '#fff7ed', bar: '#f97316', label: 'Alta' },
    3: { color: '#a16207', bg: '#fefce8', bar: '#eab308', label: 'Media' },
    4: { color: '#1d4ed8', bg: '#eff6ff', bar: '#3b82f6', label: 'Baja' },
    5: { color: '#5e6d8a', bg: '#f8f9fb', bar: '#94a3b8', label: 'Normal' },
}

function groupBy(arr, key) {
    return arr.reduce((acc, item) => {
        const k = item[key] || 'Desconocido'
        acc[k] = (acc[k] || 0) + 1
        return acc
    }, {})
}

function sortDesc(obj) {
    return Object.entries(obj).sort((a, b) => b[1] - a[1])
}

function parseFechaES(str) {
    if (!str) return null
    const [d, m, y] = str.split('/')
    if (!d || !m || !y) return null
    return new Date(Number(y), Number(m) - 1, Number(d))
}

/* ── sub-components ────────────────────────────── */

function DonutChart({ segments, total }) {
    if (total === 0) {
        return (
            <div className={styles.donutWrap}>
                <div className={styles.donutEmpty} />
                <div className={styles.donutHole}><span className={styles.donutN}>0</span><span className={styles.donutSub}>total</span></div>
            </div>
        )
    }
    let deg = 0
    const gradient = segments
        .filter(s => s.value > 0)
        .map(s => {
            const start = deg
            deg += (s.value / total) * 360
            return `${s.color} ${start}deg ${deg}deg`
        }).join(', ')

    return (
        <div className={styles.donutWrap}>
            <div className={styles.donut} style={{ background: `conic-gradient(${gradient})` }} />
            <div className={styles.donutHole}>
                <span className={styles.donutN}>{total}</span>
                <span className={styles.donutSub}>total</span>
            </div>
        </div>
    )
}

function HBar({ label, value, max, color }) {
    const pct = max > 0 ? Math.max(1.5, (value / max) * 100) : 0
    return (
        <div className={styles.hBar}>
            <div className={styles.hBarHead}>
                <span className={styles.hBarLabel}>{label}</span>
                <span className={styles.hBarVal}>{value}</span>
            </div>
            <div className={styles.hBarTrack}>
                <div className={styles.hBarFill} style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    )
}

function KpiCard({ icon, label, value, sub, accent }) {
    return (
        <div className={styles.kpiCard} style={{ '--accent': accent }}>
            <div className={styles.kpiIcon}>{icon}</div>
            <div className={styles.kpiValue} style={{ color: accent }}>{value}</div>
            <div className={styles.kpiLabel}>{label}</div>
            {sub && <div className={styles.kpiSub}>{sub}</div>}
        </div>
    )
}

/* ── main component ────────────────────────────── */

export default function MetricasView({ solicitudes }) {
    const [modalExport, setModalExport] = useState(false)

    const m = useMemo(() => {
        const total       = solicitudes.length
        const respondidas = solicitudes.filter(s => s.estado === 'respondido')
        const recibidas   = solicitudes.filter(s => s.estado === 'recibido')
        const enSeccion   = solicitudes.filter(s => s.estado === 'seccion')
        const urgentes    = solicitudes.filter(s => Number(s.prioridad) === 1 && s.estado !== 'respondido')
        const tasaResp    = total ? Math.round((respondidas.length / total) * 100) : 0

        // Tiempo medio de respuesta en días
        const tiempos = respondidas.map(s => {
            const ini = s.fecha ? new Date(s.fecha) : null
            const fin = parseFechaES(s.fechaRespuesta)
            if (!ini || !fin || isNaN(ini) || isNaN(fin)) return null
            return Math.max(0, (fin - ini) / 86400000)
        }).filter(t => t !== null)
        const tiempoMedio = tiempos.length
            ? (tiempos.reduce((a, b) => a + b, 0) / tiempos.length).toFixed(1)
            : null

        // Agrupaciones
        const porSeccion    = groupBy(solicitudes, 'seccion')
        const porPeticion   = groupBy(solicitudes, 'peticion')
        const porEmpresa    = groupBy(solicitudes, 'empresa')
        const respPorSeccion = groupBy(respondidas, 'seccion')

        // Referencias únicas tratadas (por smsDescripcion)
        const referencias = new Set(solicitudes.map(s => s.smsDescripcion).filter(Boolean)).size

        // Peticiones gestionadas = han salido de "recibido" (en progreso + respondidas)
        const gestionadas = enSeccion.length + respondidas.length

        // Tendencia por mes (fecha ISO "YYYY-MM-DD")
        const mesesMap = {}
        solicitudes.forEach(s => {
            if (!s.fecha) return
            const mes = s.fecha.substring(0, 7)
            if (!mesesMap[mes]) mesesMap[mes] = { total: 0, resp: 0 }
            mesesMap[mes].total++
            if (s.estado === 'respondido') mesesMap[mes].resp++
        })
        const meses = Object.entries(mesesMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-8)

        return {
            total, respondidas: respondidas.length,
            recibidas: recibidas.length, enSeccion: enSeccion.length,
            urgentes: urgentes.length, tasaResp, tiempoMedio,
            referencias, gestionadas,
            porSeccion, porPeticion, porEmpresa, respPorSeccion, meses,
        }
    }, [solicitudes])

    if (solicitudes.length === 0) {
        return (
            <div className={styles.empty}>
                <div className={styles.emptyIcon}>📊</div>
                <div className={styles.emptyTitle}>Sin datos aún</div>
                <div className={styles.emptySub}>
                    Las métricas aparecerán aquí una vez se registren solicitudes desde el formulario.
                </div>
            </div>
        )
    }

    const maxPeticion = Math.max(...Object.values(m.porPeticion), 1)
    const maxEmpresa  = Math.max(...Object.values(m.porEmpresa), 1)
    const maxSeccion  = Math.max(...Object.values(m.porSeccion), 1)
    const maxMes      = m.meses.length ? Math.max(...m.meses.map(([, v]) => v.total), 1) : 1

    return (
        <div className={styles.wrap}>
            <div className={styles.header}>
                <div>
                    <div className={styles.title}>MÉTRICAS</div>
                    <div className={styles.subtitle}>Análisis de solicitudes de cambio PVP</div>
                </div>
                <button className={styles.reportBtn} onClick={() => setModalExport(true)}>
                    📄 Generar Reporte
                </button>
            </div>

            <ExportModal
                show={modalExport}
                onClose={() => setModalExport(false)}
                solicitudes={solicitudes}
                title="GENERAR REPORTE"
            />

            {/* KPIs */}
            <div className={styles.kpiRow}>
                <KpiCard icon="📋" label="Total solicitudes" value={m.total} accent="var(--blue-dark)" />
                <KpiCard
                    icon="✅" label="Tasa de respuesta" value={`${m.tasaResp}%`}
                    sub={`${m.respondidas} de ${m.total} respondidas`}
                    accent="var(--success)"
                />
                <KpiCard
                    icon="🔴" label="Urgentes pendientes" value={m.urgentes}
                    sub="P1 sin responder"
                    accent={m.urgentes > 0 ? 'var(--red)' : 'var(--success)'}
                />
                <KpiCard
                    icon="⏱" label="Tiempo medio respuesta"
                    value={m.tiempoMedio !== null ? `${m.tiempoMedio}d` : '—'}
                    sub={m.tiempoMedio !== null ? 'días promedio' : 'Sin datos suficientes'}
                    accent="var(--blue)"
                />
                <KpiCard
                    icon="🏷️" label="Referencias tratadas"
                    value={m.referencias}
                    sub="productos únicos"
                    accent="#7b1fa2"
                />
                <KpiCard
                    icon="⚙️" label="Peticiones gestionadas"
                    value={m.gestionadas}
                    sub={`${m.total ? Math.round((m.gestionadas / m.total) * 100) : 0}% del total en proceso`}
                    accent="#e65100"
                />
            </div>

            {/* Fila: estado + prioridad */}
            <div className={styles.row2}>

                {/* Estado */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>Distribución por estado</div>
                    <div className={styles.donutSection}>
                        <DonutChart
                            total={m.total}
                            segments={[
                                { value: m.recibidas,  color: '#E2001A' },
                                { value: m.enSeccion,  color: '#f59e0b' },
                                { value: m.respondidas, color: '#009f6b' },
                            ]}
                        />
                        <div className={styles.legend}>
                            {[
                                { label: 'Recibidas',   val: m.recibidas,   color: '#E2001A' },
                                { label: 'En Progreso',  val: m.enSeccion,   color: '#f59e0b' },
                                { label: 'Respondidas', val: m.respondidas, color: '#009f6b' },
                            ].map(({ label, val, color }) => (
                                <div key={label} className={styles.legendItem}>
                                    <div className={styles.legendDot} style={{ background: color }} />
                                    <div>
                                        <div className={styles.legendLabel}>{label}</div>
                                        <div className={styles.legendVal}>
                                            {val}
                                            <span className={styles.legendPct}>
                                                {' '}({m.total ? Math.round((val / m.total) * 100) : 0}%)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Prioridad */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>Distribución por prioridad</div>
                    <div className={styles.prioList}>
                        {[1, 2, 3, 4, 5].map(n => {
                            const total = solicitudes.filter(s => Number(s.prioridad) === n).length
                            const resp  = solicitudes.filter(s => Number(s.prioridad) === n && s.estado === 'respondido').length
                            const pendN = total - resp
                            const maxP  = Math.max(...[1,2,3,4,5].map(p => solicitudes.filter(s => Number(s.prioridad) === p).length), 1)
                            const { color, bg, bar, label } = PRIO_META[n]
                            return (
                                <div key={n} className={styles.prioRow}>
                                    <div className={styles.prioBadge} style={{ background: bg, color }}> P{n}</div>
                                    <div className={styles.prioBody}>
                                        <div className={styles.prioHead}>
                                            <span className={styles.prioName}>{label}</span>
                                            <span className={styles.prioCount}>
                                                {total} sol.
                                                {pendN > 0 && <span style={{ color: '#E2001A' }}> · {pendN} pend.</span>}
                                            </span>
                                        </div>
                                        <div className={styles.hBarTrack}>
                                            <div className={styles.hBarFill} style={{ width: `${maxP > 0 ? (total / maxP) * 100 : 0}%`, background: bar }} />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Secciones */}
            <div className={styles.card}>
                <div className={styles.cardTitle}>Solicitudes por sección</div>
                <div className={styles.secGrid}>
                    {sortDesc(m.porSeccion).map(([sec, total]) => {
                        const resp    = m.respPorSeccion[sec] || 0
                        const pend    = total - resp
                        const tasaSec = total ? Math.round((resp / total) * 100) : 0
                        const color   = SECCION_COLORS[sec] || 'var(--blue)'
                        const barPct  = (total / maxSeccion) * 100
                        return (
                            <div key={sec} className={styles.secCard}>
                                <div className={styles.secTop}>
                                    <div className={styles.secDot} style={{ background: color }} />
                                    <div className={styles.secName}>{sec}</div>
                                    <div className={styles.secNum} style={{ color }}>{total}</div>
                                </div>
                                <div className={styles.hBarTrack} style={{ marginTop: 8 }}>
                                    <div className={styles.hBarFill} style={{ width: `${barPct}%`, background: color }} />
                                </div>
                                <div className={styles.secMeta}>
                                    <span className={styles.secResp}>✓ {resp} resp.</span>
                                    {pend > 0 && <span className={styles.secPend}>⏳ {pend} pend.</span>}
                                    <span className={styles.secTasa}>{tasaSec}%</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Petición + Empresa */}
            <div className={styles.row2}>
                <div className={styles.card}>
                    <div className={styles.cardTitle}>Top tipos de petición</div>
                    <div className={styles.barList}>
                        {sortDesc(m.porPeticion).slice(0, 9).map(([k, v]) => (
                            <HBar key={k} label={k} value={v} max={maxPeticion} color="var(--blue)" />
                        ))}
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardTitle}>Por empresa / región</div>
                    <div className={styles.barList}>
                        {sortDesc(m.porEmpresa).map(([k, v]) => (
                            <HBar key={k} label={k} value={v} max={maxEmpresa} color="#7b1fa2" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Tendencia temporal */}
            {m.meses.length > 1 && (
                <div className={styles.card}>
                    <div className={styles.cardTitle}>Tendencia mensual de solicitudes</div>
                    <div className={styles.timeline}>
                        {m.meses.map(([mes, data]) => {
                            const barH   = (data.total / maxMes) * 100
                            const respH  = data.total ? (data.resp / data.total) * 100 : 0
                            const [y, mo] = mes.split('-')
                            const label  = new Date(Number(y), Number(mo) - 1)
                                .toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
                            return (
                                <div key={mes} className={styles.tlCol}>
                                    <div className={styles.tlBarWrap}>
                                        <div className={styles.tlBar} style={{ height: `${barH}%` }}>
                                            <div className={styles.tlResp} style={{ height: `${respH}%` }} />
                                        </div>
                                    </div>
                                    <div className={styles.tlCount}>{data.total}</div>
                                    <div className={styles.tlLabel}>{label}</div>
                                </div>
                            )
                        })}
                    </div>
                    <div className={styles.tlLegend}>
                        <div className={styles.tlLegItem}>
                            <div className={styles.tlDot} style={{ background: 'var(--blue)' }} />Total
                        </div>
                        <div className={styles.tlLegItem}>
                            <div className={styles.tlDot} style={{ background: 'var(--success)' }} />Respondidas
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
