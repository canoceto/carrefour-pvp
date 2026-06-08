import React, { useState, useMemo, useRef } from 'react'
import styles from './HomologacionView.module.css'
import { parseExcelFile } from '../../hooks/useHomologacion'

const today = () => new Date().toISOString().split('T')[0]

function UploadModal({ show, onClose, onConfirm }) {
    const [step,    setStep]    = useState('idle')  // idle | mapping | loading
    const [headers, setHeaders] = useState([])
    const [rows,    setRows]    = useState([])
    const [smsCol,  setSmsCol]  = useState('')
    const [fechaCol,setFechaCol]= useState('')
    const [error,   setError]   = useState('')
    const fileRef = useRef()

    const reset = () => {
        setStep('idle'); setHeaders([]); setRows([])
        setSmsCol(''); setFechaCol(''); setError('')
    }

    const handleFile = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setError('')
        try {
            const { headers: h, rows: r } = await parseExcelFile(file)
            if (h.length === 0) { setError('El archivo está vacío o no tiene encabezados.'); return }
            setHeaders(h)
            setRows(r)
            // Auto-detectar columnas por nombre
            const autoSms   = h.find(c => /sms|codigo|código|descripci/i.test(c)) || ''
            const autoFecha = h.find(c => /fecha|date|dia|día/i.test(c))           || ''
            setSmsCol(autoSms)
            setFechaCol(autoFecha)
            setStep('mapping')
        } catch (err) {
            setError('No se pudo leer el archivo: ' + err.message)
        }
        e.target.value = ''
    }

    const handleConfirm = async () => {
        if (!smsCol || !fechaCol) { setError('Debes seleccionar ambas columnas.'); return }
        if (smsCol === fechaCol)  { setError('Las columnas deben ser diferentes.'); return }
        setStep('loading')
        try {
            await onConfirm(rows, headers, { smsCol, fechaCol })
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
                    <span>SUBIR EXCEL DE HOMOLOGACIÓN</span>
                    <button className={styles.modalClose} onClick={() => { reset(); onClose() }}>✕</button>
                </div>

                {step === 'idle' && (
                    <div className={styles.modalBody}>
                        <div className={styles.uploadZone} onClick={() => fileRef.current?.click()}>
                            <div className={styles.uploadIcon}>📂</div>
                            <div className={styles.uploadText}>Haz clic para seleccionar un archivo Excel</div>
                            <div className={styles.uploadSub}>.xlsx · .xls · .csv</div>
                        </div>
                        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display: 'none' }} />
                        {error && <div className={styles.uploadError}>{error}</div>}
                    </div>
                )}

                {step === 'mapping' && (
                    <div className={styles.modalBody}>
                        <div className={styles.mappingInfo}>
                            Archivo cargado: <strong>{rows.length} filas</strong> · <strong>{headers.length} columnas</strong>
                        </div>
                        <div className={styles.mappingGrid}>
                            <div className={styles.mappingField}>
                                <label className={styles.mappingLabel}>Columna SMS / Código producto</label>
                                <select className={styles.mappingSelect} value={smsCol} onChange={e => setSmsCol(e.target.value)}>
                                    <option value="">— seleccionar —</option>
                                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                            <div className={styles.mappingField}>
                                <label className={styles.mappingLabel}>Columna Fecha homologación</label>
                                <select className={styles.mappingSelect} value={fechaCol} onChange={e => setFechaCol(e.target.value)}>
                                    <option value="">— seleccionar —</option>
                                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className={styles.previewWrap}>
                            <div className={styles.previewTitle}>Vista previa (primeras 5 filas)</div>
                            <div className={styles.previewScroll}>
                                <table className={styles.previewTable}>
                                    <thead>
                                        <tr>{headers.map(h => (
                                            <th key={h} className={`${styles.previewTh} ${h === smsCol ? styles.previewColSms : h === fechaCol ? styles.previewColFecha : ''}`}>
                                                {h}
                                                {h === smsCol   && <span className={styles.previewTag}>SMS</span>}
                                                {h === fechaCol && <span className={styles.previewTagFecha}>Fecha</span>}
                                            </th>
                                        ))}</tr>
                                    </thead>
                                    <tbody>
                                        {rows.slice(0, 5).map((row, i) => (
                                            <tr key={i}>{headers.map((h, idx) => (
                                                <td key={h} className={`${styles.previewTd} ${h === smsCol ? styles.previewColSms : h === fechaCol ? styles.previewColFecha : ''}`}>
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
                            <button className={styles.btnConfirm} onClick={handleConfirm} disabled={!smsCol || !fechaCol}>
                                ✓ Importar {rows.length} registros
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

export default function HomologacionView({ records, columnMap, saveFromExcel, clearAll }) {
    const [showUpload,  setShowUpload]  = useState(false)
    const [filterFecha, setFilterFecha] = useState(today())
    const [busqueda,    setBusqueda]    = useState('')

    const smsCol   = columnMap?.smsCol
    const fechaCol = columnMap?.fechaCol

    const filtered = useMemo(() => {
        if (!records.length || !smsCol) return []
        return records.filter(r => {
            const fechaMatch  = !filterFecha || String(r[fechaCol] ?? '') === filterFecha
            const searchMatch = !busqueda    || Object.values(r).some(v =>
                String(v).toLowerCase().includes(busqueda.toLowerCase())
            )
            return fechaMatch && searchMatch
        })
    }, [records, smsCol, fechaCol, filterFecha, busqueda])

    const totalHoy = useMemo(() => {
        const t = today()
        if (!records.length || !fechaCol) return 0
        return records.filter(r => String(r[fechaCol] ?? '') === t).length
    }, [records, fechaCol])

    const otherCols = columnMap
        ? Object.keys(records[0] || {}).filter(k => k !== '_rowIndex' && k !== smsCol && k !== fechaCol)
        : []

    return (
        <div className={styles.wrap}>
            <div className={styles.header}>
                <div className={styles.title}>HOMOLOGACIÓN</div>
                <div className={styles.headerActions}>
                    <button className={styles.uploadBtn} onClick={() => setShowUpload(true)}>
                        📂 Subir Excel
                    </button>
                    {records.length > 0 && (
                        <button className={styles.clearBtn} onClick={() => { if (window.confirm('¿Eliminar todos los registros de homologación?')) clearAll() }}>
                            🗑 Limpiar todo
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total registros</div>
                    <div className={styles.statValue}>{records.length}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Homologados hoy</div>
                    <div className={`${styles.statValue} ${styles.statGreen}`}>{totalHoy}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Fecha filtrada</div>
                    <div className={styles.statValue}>{filterFecha || '—'}</div>
                </div>
                {columnMap && (
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Columna SMS</div>
                        <div className={styles.statValueSm}>{smsCol}</div>
                    </div>
                )}
            </div>

            {/* Filtros */}
            <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Fecha</label>
                    <input
                        type="date"
                        className={styles.filterDate}
                        value={filterFecha}
                        onChange={e => setFilterFecha(e.target.value)}
                    />
                    {filterFecha && (
                        <button className={styles.filterClear} onClick={() => setFilterFecha('')}>✕</button>
                    )}
                </div>
                <div className={styles.searchBox}>
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
            </div>

            {/* Tabla */}
            {records.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>📋</div>
                    <div className={styles.emptyTitle}>Sin datos de homologación</div>
                    <div className={styles.emptySub}>Sube un Excel diariamente para cargar los registros</div>
                    <button className={styles.uploadBtnLg} onClick={() => setShowUpload(true)}>📂 Subir Excel</button>
                </div>
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>{smsCol || 'SMS'}</th>
                                <th className={styles.th}>{fechaCol || 'Fecha'}</th>
                                {otherCols.map(c => <th key={c} className={styles.th}>{c}</th>)}
                                <th className={styles.th}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={3 + otherCols.length} className={styles.emptyRow}>
                                        Sin registros con estos filtros
                                    </td>
                                </tr>
                            ) : filtered.map((r, i) => {
                                const esHoy = String(r[fechaCol] ?? '') === today()
                                return (
                                    <tr key={i} className={`${styles.tableRow} ${esHoy ? styles.rowHoy : ''}`}>
                                        <td className={styles.tdSms}>{r[smsCol] ?? '—'}</td>
                                        <td className={styles.tdFecha}>{r[fechaCol] ?? '—'}</td>
                                        {otherCols.map(c => <td key={c} className={styles.tdOther}>{r[c] ?? '—'}</td>)}
                                        <td>
                                            {esHoy
                                                ? <span className={styles.badgeHom}>✓ Homologado</span>
                                                : <span className={styles.badgeOld}>Otro día</span>
                                            }
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    <div className={styles.tableFooter}>
                        {filtered.length} de {records.length} registros
                    </div>
                </div>
            )}

            <UploadModal
                show={showUpload}
                onClose={() => setShowUpload(false)}
                onConfirm={saveFromExcel}
            />
        </div>
    )
}
