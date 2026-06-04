import React, { useMemo, useState } from 'react'
import styles from './CompetenciaView.module.css'

const SECCIONES_ORDER = ['CARNICERIA','FRUTERIA','CHARCUTERIA','PANADERIA','PESCADERIA','PLATOS PREPARADOS']
const SECCION_COLORS = {
    CARNICERIA:          '#E2001A',
    FRUTERIA:            '#2e7d32',
    CHARCUTERIA:         '#7b1fa2',
    PANADERIA:           '#e65100',
    PESCADERIA:          '#0277bd',
    'PLATOS PREPARADOS': '#5d4037',
}

const COMPS = [
    { key: 'pvpMercadona', label: 'Mercadona', short: 'Mcdna',   color: '#1a7340', pale: '#f0fdf4', border: '#86efac' },
    { key: 'pvpLidl',      label: 'Lidl',      short: 'Lidl',    color: '#0050aa', pale: '#eff6ff', border: '#93c5fd' },
    { key: 'pvpAlcampo',   label: 'Alcampo',   short: 'Alcampo', color: '#c2410c', pale: '#fff7ed', border: '#fdba74' },
]

const num = v => { const n = parseFloat(v); return isNaN(n) ? null : n }
const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0
const fmt = v => v != null ? (v >= 0 ? `+€${v.toFixed(2)}` : `-€${Math.abs(v).toFixed(2)}`) : '—'

/* ── sub-components ── */

function MiniBar({ value, max, color, negative }) {
    const pct = max > 0 ? Math.min(100, Math.abs(value) / max * 100) : 0
    return (
        <div className={styles.miniBarWrap}>
            <div className={styles.miniBarTrack}>
                <div
                    className={styles.miniBarFill}
                    style={{ width: `${pct}%`, background: value < 0 ? '#009f6b' : color }}
                />
            </div>
        </div>
    )
}

function PosicionamientoDonut({ barato, igual, caro, total }) {
    if (total === 0) return <div className={styles.donutEmpty} />
    let deg = 0
    const segs = [
        { v: barato, color: '#009f6b' },
        { v: igual,  color: '#3b82f6' },
        { v: caro,   color: '#E2001A' },
    ].filter(s => s.v > 0)
    const grad = segs.map(s => {
        const start = deg
        deg += (s.v / total) * 360
        return `${s.color} ${start}deg ${deg}deg`
    }).join(', ')
    return (
        <div className={styles.miniDonutWrap}>
            <div className={styles.miniDonut} style={{ background: `conic-gradient(${grad})` }} />
            <div className={styles.miniDonutHole} />
        </div>
    )
}

export default function CompetenciaView({ solicitudes }) {
    const [seccionFiltro, setSeccionFiltro] = useState('todas')

    const base = useMemo(() =>
        seccionFiltro === 'todas' ? solicitudes : solicitudes.filter(s => s.seccion === seccionFiltro)
    , [solicitudes, seccionFiltro])

    const data = useMemo(() => {
        // ── Por competidor ──────────────────────────────────────────────────
        const comp = COMPS.map(c => {
            const conDatos = base.filter(s => num(s[c.key]) != null && num(s.pvpRec) != null)
            const brechas = conDatos.map(s => num(s.pvpRec) - num(s[c.key]))
            const avgRec  = conDatos.length ? conDatos.reduce((a, s) => a + num(s.pvpRec), 0) / conDatos.length : null
            const avgComp = conDatos.length ? conDatos.reduce((a, s) => a + num(s[c.key]), 0) / conDatos.length : null
            const avgBrecha = brechas.length ? brechas.reduce((a, b) => a + b, 0) / brechas.length : null

            const POS_THRESH = 0.02
            let barato = 0, igual = 0, caro = 0
            conDatos.forEach(s => {
                const r = num(s.pvpRec), co = num(s[c.key])
                const ratio = r / co
                if (ratio < 1 - POS_THRESH) barato++
                else if (ratio > 1 + POS_THRESH) caro++
                else igual++
            })

            return { ...c, conDatos: conDatos.length, total: base.length, avgRec, avgComp, avgBrecha, barato, igual, caro }
        })

        // ── Secciones × Competidores ────────────────────────────────────────
        const seccionesPresentes = SECCIONES_ORDER.filter(s => base.some(r => r.seccion === s))
        const matrix = seccionesPresentes.map(sec => {
            const rows = base.filter(r => r.seccion === sec)
            const cells = COMPS.map(c => {
                const conDatos = rows.filter(r => num(r[c.key]) != null && num(r.pvpRec) != null)
                const brechas  = conDatos.map(r => num(r.pvpRec) - num(r[c.key]))
                const avg      = brechas.length ? brechas.reduce((a, b) => a + b, 0) / brechas.length : null
                return { count: conDatos.length, avg }
            })
            return { sec, total: rows.length, cells }
        })
        const maxMatrixCount = Math.max(...matrix.flatMap(r => r.cells.map(c => c.count)), 1)

        // ── Brecha por tipo de petición ─────────────────────────────────────
        const petMap = {}
        base.forEach(s => {
            if (!s.peticion) return
            if (!petMap[s.peticion]) petMap[s.peticion] = { brechas: [], count: 0 }
            COMPS.forEach(c => {
                const r = num(s.pvpRec), co = num(s[c.key])
                if (r != null && co != null) {
                    petMap[s.peticion].brechas.push(Math.abs(r - co))
                    petMap[s.peticion].count++
                }
            })
        })
        const petBrechas = Object.entries(petMap)
            .map(([pet, v]) => ({
                pet,
                count: v.count,
                avgBrecha: v.brechas.length ? v.brechas.reduce((a, b) => a + b, 0) / v.brechas.length : 0
            }))
            .filter(p => p.count > 0)
            .sort((a, b) => b.avgBrecha - a.avgBrecha)
            .slice(0, 8)
        const maxPetBrecha = Math.max(...petBrechas.map(p => p.avgBrecha), 0.01)

        // ── Top referencias con mayor brecha ────────────────────────────────
        const refs = base
            .map(s => {
                const pares = COMPS.map(c => {
                    const r = num(s.pvpRec), co = num(s[c.key])
                    return (r != null && co != null) ? { comp: c.label, brecha: r - co, abs: Math.abs(r - co) } : null
                }).filter(Boolean)
                if (!pares.length) return null
                const max = pares.reduce((a, b) => a.abs > b.abs ? a : b)
                return { desc: s.smsDescripcion || '—', seccion: s.seccion, pvpRec: num(s.pvpRec), brecha: max.brecha, abs: max.abs, comp: max.comp }
            })
            .filter(Boolean)
            .sort((a, b) => b.abs - a.abs)
            .slice(0, 10)

        return { comp, matrix, maxMatrixCount, petBrechas, maxPetBrecha, refs }
    }, [base])

    const secciones = SECCIONES_ORDER.filter(s => solicitudes.some(r => r.seccion === s))
    const hasData = base.some(s => COMPS.some(c => num(s[c.key]) != null))

    if (solicitudes.length === 0 || !hasData) {
        return (
            <div className={styles.empty}>
                <div className={styles.emptyIcon}>🏪</div>
                <div className={styles.emptyTitle}>Sin datos de competencia</div>
                <div className={styles.emptySub}>Los análisis aparecerán cuando las solicitudes incluyan precios de Mercadona, Lidl o Alcampo.</div>
            </div>
        )
    }

    return (
        <div className={styles.wrap}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <div className={styles.title}>ANÁLISIS DE COMPETENCIA</div>
                    <div className={styles.subtitle}>Cruce de PVP recomendado vs precios de competidores</div>
                </div>
                <div className={styles.filterRow}>
                    <label className={styles.filterLabel}>Sección:</label>
                    <select className={styles.filterSelect} value={seccionFiltro} onChange={e => setSeccionFiltro(e.target.value)}>
                        <option value="todas">Todas</option>
                        {secciones.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* ── 1. Cards por competidor ── */}
            <div className={styles.compCards}>
                {data.comp.map(c => (
                    <div key={c.key} className={styles.compCard} style={{ borderTopColor: c.color }}>
                        <div className={styles.compCardHeader}>
                            <div className={styles.compName} style={{ color: c.color }}>{c.label}</div>
                            <div className={styles.compCoverage}>
                                {c.conDatos} solicitudes
                                <span className={styles.compPct}>{pct(c.conDatos, c.total)}%</span>
                            </div>
                        </div>

                        <div className={styles.compPrices}>
                            <div className={styles.priceItem}>
                                <div className={styles.priceLabel}>PVP medio CRF rec.</div>
                                <div className={styles.priceVal}>€{c.avgRec?.toFixed(2) ?? '—'}</div>
                            </div>
                            <div className={styles.priceItem}>
                                <div className={styles.priceLabel}>PVP medio {c.label}</div>
                                <div className={styles.priceVal}>€{c.avgComp?.toFixed(2) ?? '—'}</div>
                            </div>
                            <div className={styles.priceItem}>
                                <div className={styles.priceLabel}>Brecha media</div>
                                <div className={`${styles.priceVal} ${c.avgBrecha != null ? (c.avgBrecha > 0 ? styles.brechaPos : styles.brechaNeg) : ''}`}>
                                    {fmt(c.avgBrecha)}
                                </div>
                            </div>
                        </div>

                        {/* Posicionamiento */}
                        <div className={styles.posSection}>
                            <div className={styles.posSectionTitle}>Posicionamiento CRF</div>
                            <div className={styles.posRow}>
                                <PosicionamientoDonut
                                    barato={c.barato} igual={c.igual} caro={c.caro}
                                    total={c.barato + c.igual + c.caro}
                                />
                                <div className={styles.posLegend}>
                                    {[
                                        { label: 'CRF más barato', v: c.barato, color: '#009f6b' },
                                        { label: 'A la par (±2%)',  v: c.igual,  color: '#3b82f6' },
                                        { label: 'CRF más caro',   v: c.caro,   color: '#E2001A' },
                                    ].map(({ label, v, color }) => (
                                        <div key={label} className={styles.posItem}>
                                            <div className={styles.posDot} style={{ background: color }} />
                                            <span className={styles.posLabel}>{label}</span>
                                            <span className={styles.posCount} style={{ color }}>{v}</span>
                                            <span className={styles.posPct}>
                                                {pct(v, c.barato + c.igual + c.caro)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── 2. Matriz Secciones × Competidores ── */}
            <div className={styles.card}>
                <div className={styles.cardTitle}>Solicitudes con datos de competencia por sección</div>
                <div className={styles.matrixWrap}>
                    <table className={styles.matrix}>
                        <thead>
                            <tr>
                                <th className={styles.matrixThSec}>Sección</th>
                                <th className={styles.matrixThTotal}>Total sol.</th>
                                {COMPS.map(c => (
                                    <th key={c.key} className={styles.matrixThComp} style={{ color: c.color }}>
                                        {c.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.matrix.map(({ sec, total, cells }) => (
                                <tr key={sec} className={styles.matrixRow}>
                                    <td className={styles.matrixSec}>
                                        <div className={styles.secDot} style={{ background: SECCION_COLORS[sec] || '#888' }} />
                                        {sec}
                                    </td>
                                    <td className={styles.matrixTotal}>{total}</td>
                                    {cells.map((cell, i) => {
                                        const intensity = data.maxMatrixCount > 0 ? cell.count / data.maxMatrixCount : 0
                                        const bg = cell.count === 0 ? 'transparent'
                                            : `${COMPS[i].color}${Math.round(intensity * 40 + 10).toString(16).padStart(2,'0')}`
                                        return (
                                            <td key={COMPS[i].key} className={styles.matrixCell} style={{ background: bg }}>
                                                {cell.count > 0 && (
                                                    <div className={styles.matrixCellInner}>
                                                        <span className={styles.matrixCount}>{cell.count}</span>
                                                        {cell.avg != null && (
                                                            <span className={`${styles.matrixAvg} ${cell.avg > 0 ? styles.brechaPos : styles.brechaNeg}`}>
                                                                {fmt(cell.avg)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {cell.count === 0 && <span className={styles.matrixEmpty}>—</span>}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className={styles.matrixNote}>
                    Cada celda muestra nº de solicitudes con datos de ese competidor · Brecha media (PVP CRF rec. − PVP competidor) · <span style={{color:'#009f6b'}}>verde = CRF más barato</span> · <span style={{color:'#E2001A'}}>rojo = CRF más caro</span>
                </div>
            </div>

            {/* ── 3. Brecha por tipo de petición + Top referencias ── */}
            <div className={styles.row2}>
                <div className={styles.card}>
                    <div className={styles.cardTitle}>Tipos de petición con mayor diferencia de precio</div>
                    <div className={styles.barList}>
                        {data.petBrechas.map(({ pet, avgBrecha, count }) => (
                            <div key={pet} className={styles.petRow}>
                                <div className={styles.petHead}>
                                    <span className={styles.petLabel}>{pet}</span>
                                    <span className={styles.petMeta}>{count} comparaciones</span>
                                    <span className={`${styles.petBrecha} ${avgBrecha > 0.5 ? styles.brechaPos : styles.brechaNeg}`}>
                                        Ø {avgBrecha >= 0 ? '+' : ''}€{avgBrecha.toFixed(2)}
                                    </span>
                                </div>
                                <div className={styles.hBarTrack}>
                                    <div className={styles.hBarFill}
                                        style={{ width: `${(avgBrecha / data.maxPetBrecha) * 100}%`, background: avgBrecha > 0 ? '#E2001A' : '#009f6b' }} />
                                </div>
                            </div>
                        ))}
                        {data.petBrechas.length === 0 && (
                            <div className={styles.noData}>Sin comparaciones disponibles</div>
                        )}
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardTitle}>Referencias con mayor brecha de precio</div>
                    <div className={styles.refList}>
                        {data.refs.map((r, i) => (
                            <div key={i} className={styles.refRow}>
                                <div className={styles.refRank}>{i + 1}</div>
                                <div className={styles.refInfo}>
                                    <div className={styles.refDesc}>{r.desc}</div>
                                    <div className={styles.refMeta}>
                                        <span className={styles.refSec} style={{ background: SECCION_COLORS[r.seccion] || '#888' }}>
                                            {r.seccion}
                                        </span>
                                        <span className={styles.refComp}>vs {r.comp}</span>
                                        {r.pvpRec != null && <span className={styles.refPvp}>CRF rec. €{r.pvpRec.toFixed(2)}</span>}
                                    </div>
                                </div>
                                <div className={`${styles.refBrecha} ${r.brecha > 0 ? styles.brechaPos : styles.brechaNeg}`}>
                                    {fmt(r.brecha)}
                                </div>
                            </div>
                        ))}
                        {data.refs.length === 0 && (
                            <div className={styles.noData}>Sin referencias con datos de competencia</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
