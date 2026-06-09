import React, { useState, useMemo, useRef } from 'react'
import styles from './HomologacionView.module.css'
import { parseExcelFile, FUENTES_HOMOLOGACION } from '../../hooks/useHomologacion'

const today = () => new Date().toISOString().split('T')[0]

function UploadModal({ show, fuenteMeta, onClose, onConfirm }) {
    const [step,      setStep]      = useState('idle')  // idle | mapping | loading
    const [headers,   setHeaders]   = useState([])
    const [rows,      setRows]      = useState([])
    const [smsCol,    setSmsCol]    = useState('')
    const [fecha,     setFecha]     = useState(today())
    const [fileName,  setFileName]  = useState('')
    const [error,     setError]     = useState('')
    const [headerRow, setHeaderRow] = useState(0)
    const fileRef    = useRef()
    const cachedFile = useRef(null)

    const reset = () => {
        setStep('idle'); setHeaders([]); setRows([])
        setSmsCol(''); setFecha(today()); setFileName(''); setError('')
        setHeaderRow(0); cachedFile.current = null
    }

    const applyParse = async (file, hRow) => {
        const { headers: h, rows: r, headerRow: detected } = await parseExcelFile(file, hRow)
        if (h.length === 0) throw new Error('El archivo está vacío o no tiene encabezados.')
        setHeaders(h)
        setRows(r)
        setHeaderRow(detected)
        const autoSms = h.find(c => /^sms$/i.test(c)) || h.find(c => /sms|codigo|código/i.test(c)) || ''
        setSmsCol(autoSms)
    }

    const handleFile = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setError('')
        cachedFile.current = file
        try {
            await applyParse(file, 'auto')
            setFileName(file.name)
            setStep('mapping')
        } catch (err) {
            setError('No se pudo leer el archivo: ' + err.message)
        }
        e.target.value = ''
    }

    const handleHeaderRowChange = async (newRow) => {
        if (!cachedFile.current) return
        try {
            await applyParse(cachedFile.current, newRow)
        } catch (err) {
            setError('Error al releer el archivo: ' + err.message)
        }
    }

    const handleConfirm = async () => {
        if (!smsCol) { setError('Debes seleccionar la columna del código SMS.'); return }
        if (!fecha)  { setError('Debes indicar la fecha que representa esta carga.'); return }
        setStep('loading')
        try {
            await onConfirm(rows, headers, { smsCol, fecha, fileName })
            reset()
            onClose()
        } catch (err) {
            setError('Error al guardar: ' + err.message)
            setStep('mapping')
        }
    }

    if (!show) return null

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <span>SUBIR EXCEL · {fuenteMeta?.nombre?.toUpperCase()}</span>
                    <button className={styles.modalClose} onClick={() => { reset(); onClose() }}>✕</button>
                </div>

                {step === 'idle' && (
                    <div className={styles.modalBody}>
                        <div className={styles.uploadZone} onClick={() => fileRef.current?.click()}>
                            <div className={styles.uploadIcon}>📂</div>
                            <div className={styles.uploadText}>Haz clic para seleccionar un archivo Excel</div>
                            <div className={styles.uploadSub}>.xlsx · .xls · .xlsb · .csv</div>
                        </div>
                        <input ref={fileRef} type="file" accept=".xlsx,.xls,.xlsb,.csv" onChange={handleFile} style={{ display: 'none' }} />
                        {error && <div className={styles.uploadError}>{error}</div>}
                    </div>
                )}

                {step === 'mapping' && (
                    <div className={styles.modalBody}>
                        <div className={styles.mappingInfo}>
                            Archivo cargado: <strong>{fileName}</strong> · <strong>{rows.length} filas</strong> · <strong>{headers.length} columnas</strong>
                        </div>
                        <div className={styles.mappingGrid}>
                            <div className={styles.mappingField}>
                                <label className={styles.mappingLabel}>Columna del código SMS</label>
                                <select className={styles.mappingSelect} value={smsCol} onChange={e => setSmsCol(e.target.value)}>
                                    <option value="">— seleccionar —</option>
                                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                            <div className={styles.mappingField}>
                                <label className={styles.mappingLabel}>Fecha que representa esta carga</label>
                                <input
                                    type="date"
                                    className={styles.mappingSelect}
                                    value={fecha}
                                    onChange={e => setFecha(e.target.value)}
                                />
                            </div>
                            <div className={styles.mappingField}>
                                <label className={styles.mappingLabel}>Fila de encabezados</label>
                                <select
                                    className={styles.mappingSelect}
                                    value={headerRow}
                                    onChange={e => handleHeaderRowChange(Number(e.target.value))}
                                >
                                    <option value={0}>Fila 1 (primera fila)</option>
                                    <option value={1}>Fila 2 (segunda fila)</option>
                                    <option value={2}>Fila 3 (tercera fila)</option>
                                </select>
                            </div>
                        </div>
                        <div className={styles.mappingNote}>
                            Esta fecha es el "día" de esta fuente: las solicitudes creadas ese mismo día se compararán contra estos registros.
                        </div>

                        {/* Preview */}
                        <div className={styles.previewWrap}>
                            <div className={styles.previewTitle}>Vista previa (primeras 5 filas)</div>
                            <div className={styles.previewScroll}>
                                <table className={styles.previewTable}>
                                    <thead>
                                        <tr>{headers.map(h => (
                                            <th key={h} className={`${styles.previewTh} ${h === smsCol ? styles.previewColSms : ''}`}>
                                                {h}
                                                {h === smsCol && <span className={styles.previewTag}>SMS</span>}
                                            </th>
                                        ))}</tr>
                                    </thead>
                                    <tbody>
                                        {rows.slice(0, 5).map((row, i) => (
                                            <tr key={i}>{headers.map((h, idx) => (
                                                <td key={h} className={`${styles.previewTd} ${h === smsCol ? styles.previewColSms : ''}`}>
                                                    {row[idx] ?? ''}
                                                </td>
                                            ))}</tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {error && <div className={styles.uploadError}>{error}</div>}
                        <div className={styles.modalFooter}>
                            <button className={styles.btnCancel} onClick={() => { reset(); onClose() }}>Cancelar</button>
                            <button className={styles.btnConfirm} onClick={handleConfirm} disabled={!smsCol || !fecha}>
                                ✓ Guardar {rows.length} registros
                            </button>
                        </div>
                    </div>
                )}

                {step === 'loading' && (
                    <div className={styles.modalBody}>
                        <div className={styles.loadingMsg}>Guardando registros…</div>
                    </div>
                )}
            </div>
        </div>
    )
}

function SourceTable({ fuente }) {
    const [busqueda, setBusqueda] = useState('')

    const cols = useMemo(() => {
        if (!fuente?.records?.length) return []
        const first = fuente.records[0]
        const rest = Object.keys(first).filter(k => k !== '_rowIndex' && k !== fuente.smsCol)
        return [fuente.smsCol, ...rest]
    }, [fuente])

    const filtered = useMemo(() => {
        if (!fuente?.records?.length) return []
        if (!busqueda) return fuente.records
        const q = busqueda.toLowerCase()
        return fuente.records.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)))
    }, [fuente, busqueda])

    if (!fuente?.records?.length) return null

    const LIMIT = 200
    const visible = filtered.slice(0, LIMIT)

    return (
        <div className={styles.sourceTableArea}>
            <div className={styles.searchBox} style={{ maxWidth: 320 }}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Buscar en todos los campos…"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                />
                {busqueda && <button className={styles.searchClear} onClick={() => setBusqueda('')}>✕</button>}
            </div>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>{cols.map(c => (
                            <th key={c} className={`${styles.th} ${c === fuente.smsCol ? styles.previewColSms : ''}`}>
                                {c}{c === fuente.smsCol && <span className={styles.previewTag}>SMS</span>}
                            </th>
                        ))}</tr>
                    </thead>
                    <tbody>
                        {visible.length === 0 ? (
                            <tr><td colSpan={cols.length} className={styles.emptyRow}>Sin registros con esta búsqueda</td></tr>
                        ) : visible.map((r, i) => (
                            <tr key={i} className={styles.tableRow}>
                                {cols.map(c => <td key={c} className={c === fuente.smsCol ? styles.tdSms : styles.tdOther}>{r[c] ?? '—'}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className={styles.tableFooter}>
                    {visible.length} de {filtered.length} registros{filtered.length > LIMIT ? ' (mostrando los primeros ' + LIMIT + ')' : ''}
                </div>
            </div>
        </div>
    )
}

function SourceCard({ meta, fuente, onUpload, onClear }) {
    const [expanded, setExpanded] = useState(false)
    const cargada = !!fuente
    const esHoy = cargada && fuente.fecha === today()

    return (
        <div className={styles.sourceCard}>
            <div className={styles.sourceCardHeader}>
                <div>
                    <div className={styles.sourceName}>{meta.nombre}</div>
                    <div className={styles.sourceHint}>{meta.hint}</div>
                </div>
                {cargada
                    ? <span className={`${styles.sourceBadge} ${esHoy ? styles.sourceBadgeHoy : styles.sourceBadgeOld}`}>
                        {esHoy ? '✓ Vigente hoy' : '⏳ Otro día'}
                      </span>
                    : <span className={styles.sourceBadgeEmpty}>Sin datos</span>
                }
            </div>

            {cargada ? (
                <div className={styles.sourceMeta}>
                    <div className={styles.sourceMetaItem}>
                        <span className={styles.sourceMetaLabel}>Fecha de la carga</span>
                        <span className={styles.sourceMetaVal}>{fuente.fecha || '—'}</span>
                    </div>
                    <div className={styles.sourceMetaItem}>
                        <span className={styles.sourceMetaLabel}>Registros</span>
                        <span className={styles.sourceMetaVal}>{fuente.records.length}</span>
                    </div>
                    <div className={styles.sourceMetaItem}>
                        <span className={styles.sourceMetaLabel}>Columna SMS</span>
                        <span className={styles.sourceMetaVal}>{fuente.smsCol}</span>
                    </div>
                    <div className={styles.sourceMetaItem}>
                        <span className={styles.sourceMetaLabel}>Fichero</span>
                        <span className={styles.sourceMetaVal} title={fuente.fileName}>{fuente.fileName || '—'}</span>
                    </div>
                </div>
            ) : (
                <div className={styles.sourceEmptyMsg}>
                    Sube el Excel diario de esta fuente para incluirla en la comprobación de homologación.
                </div>
            )}

            <div className={styles.sourceActions}>
                <button className={styles.uploadBtn} onClick={onUpload}>
                    📂 {cargada ? 'Reemplazar Excel' : 'Subir Excel'}
                </button>
                {cargada && (
                    <>
                        <button className={styles.btnCancel} onClick={() => setExpanded(e => !e)}>
                            {expanded ? '▲ Ocultar registros' : '▼ Ver registros'}
                        </button>
                        <button className={styles.clearBtn} onClick={onClear}>🗑 Limpiar</button>
                    </>
                )}
            </div>

            {expanded && <SourceTable fuente={fuente} />}
        </div>
    )
}

function fuenteEstado(fuente) {
    if (!fuente) return 'vacia'
    return fuente.fecha === today() ? 'hoy' : 'otro'
}

const ESTADO_ICONO = { vacia: '○', otro: '⏳', hoy: '✓' }

export default function HomologacionView({ fuentes, saveFuente, clearFuente }) {
    const [uploadFor, setUploadFor] = useState(null)  // fuenteId | null
    const [activeTab, setActiveTab] = useState(FUENTES_HOMOLOGACION[0].id)

    const totalRegistros = useMemo(
        () => Object.values(fuentes).reduce((acc, f) => acc + (f?.records?.length || 0), 0),
        [fuentes]
    )
    const vigentesHoy = useMemo(
        () => Object.values(fuentes).filter(f => f && f.fecha === today()).length,
        [fuentes]
    )

    const uploadMeta = FUENTES_HOMOLOGACION.find(f => f.id === uploadFor)

    return (
        <div className={styles.wrap}>
            <div className={styles.header}>
                <div className={styles.title}>HOMOLOGACIÓN</div>
            </div>

            <div className={styles.intro}>
                Sube cada día el Excel de cada una de estas fuentes. Cuando se registre una nueva solicitud, la
                aplicación buscará automáticamente su código SMS en las fuentes cuya <strong>fecha de carga coincida
                con la fecha de la solicitud</strong>, marcará si está homologado o no y guardará en qué fuente(s) se encontró.
            </div>

            {/* Stats */}
            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Fuentes vigentes hoy</div>
                    <div className={`${styles.statValue} ${vigentesHoy === FUENTES_HOMOLOGACION.length ? styles.statGreen : ''}`}>
                        {vigentesHoy} / {FUENTES_HOMOLOGACION.length}
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total registros cargados</div>
                    <div className={styles.statValue}>{totalRegistros}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Fecha de hoy</div>
                    <div className={styles.statValue}>{today()}</div>
                </div>
            </div>

            {/* Tabs de fuentes */}
            <div className={styles.sourceTabsRow}>
                {FUENTES_HOMOLOGACION.map(meta => {
                    const estado = fuenteEstado(fuentes[meta.id])
                    return (
                        <button
                            key={meta.id}
                            className={`${styles.sourceTab} ${activeTab === meta.id ? styles.sourceTabActive : ''}`}
                            onClick={() => setActiveTab(meta.id)}
                        >
                            <span className={`${styles.sourceTabIcon} ${styles['sourceTabIcon_' + estado]}`}>{ESTADO_ICONO[estado]}</span>
                            {meta.nombre}
                            {fuentes[meta.id] && (
                                <span className={`${styles.sourceTabCount} ${activeTab === meta.id ? styles.sourceTabCountActive : ''}`}>
                                    {fuentes[meta.id].records.length}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {(() => {
                const meta = FUENTES_HOMOLOGACION.find(f => f.id === activeTab)
                return (
                    <SourceCard
                        key={meta.id}
                        meta={meta}
                        fuente={fuentes[meta.id]}
                        onUpload={() => setUploadFor(meta.id)}
                        onClear={() => {
                            if (window.confirm(`¿Eliminar los registros cargados de "${meta.nombre}"?`)) clearFuente(meta.id)
                        }}
                    />
                )
            })()}

            <UploadModal
                show={!!uploadFor}
                fuenteMeta={uploadMeta}
                onClose={() => setUploadFor(null)}
                onConfirm={(rows, headers, map) => saveFuente(uploadFor, rows, headers, map)}
            />
        </div>
    )
}
