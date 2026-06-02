import React, { useState, useEffect } from 'react'
import styles from './FormView.module.css'

const SECCIONES = [
  { value: 'FRUTERIA', label: '🍎 Frutería' },
  { value: 'CARNICERIA', label: '🥩 Carnicería' },
  { value: 'CHARCUTERIA', label: '🍖 Charcutería' },
  { value: 'PLATOS PREPARADOS', label: '🍱 Platos Preparados' },
  { value: 'PANADERIA', label: '🥖 Panadería' },
  { value: 'PESCADERIA', label: '🐟 Pescadería' },
]

const PETICIONES = [
  'ALTA', 'REACTIVACION', 'INACTIVACION TEMPORAL', 'BAJA STDO',
  'ETIQUETADO PROVEEDOR', 'STICKER', 'ERROR PVP', 'ERROR CHEQUEO',
  'CAMBIO PARAMETRIZACIÓN', 'EXCEPCION CIAL', 'HOMOLOGACION',
]

const EMPRESAS = [
  'PAIS (TODOS)', 'HIPER', 'MARKET', 'ONLINE',
  'EXPRESS', 'CANARIAS', 'PENINSULA', 'TIENDA',
]

const REQUIRED_FIELDS = ['correo', 'solicitante', 'fecha', 'codtienda', 'pvpRec', 'pvpMcdna', 'pvpAlcampo']
const REQUIRED_RADIOS = ['seccion', 'peticion', 'empresa']

export default function FormView({ user, onSubmit, showToast }) {
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    correo: '', solicitante: '', fecha: today,
    seccion: '', peticion: '', empresa: '', codtienda: '',
    comentarios: '', producto: '', pvpActual: '', pvpRec: '',
    fechaVigor: '', pvpMcdna: '', pvpLidl: '', pvpAlcampo: '',
  })

  const [errors, setErrors] = useState({})
  const [progress, setProgress] = useState(0)

  // Auto-fill from Google user
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        correo: f.correo || user.email,
        solicitante: f.solicitante || user.name,
      }))
    }
  }, [user])

  // Progress calculation
  useEffect(() => {
    let filled = 0
    const total = REQUIRED_FIELDS.length + REQUIRED_RADIOS.length
    REQUIRED_FIELDS.forEach(k => { if (form[k]?.trim?.() || form[k]) filled++ })
    REQUIRED_RADIOS.forEach(k => { if (form[k]) filled++ })
    setProgress(Math.round((filled / total) * 100))
  }, [form])

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors(er => ({ ...er, [key]: false }))
  }

  const setRadio = (key, value) => {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(er => ({ ...er, [key]: false }))
  }

  const handleSubmit = () => {
    const newErrors = {}
    REQUIRED_FIELDS.forEach(k => { if (!form[k]?.toString().trim()) newErrors[k] = true })
    REQUIRED_RADIOS.forEach(k => { if (!form[k]) newErrors[k] = true })

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      showToast('Completa todos los campos obligatorios *', 'error')
      return
    }

    const now = new Date()
    onSubmit({
      id: 'SOL-' + Date.now(),
      timestamp: now.toLocaleString('es-ES'),
      ...form,
      pvpRec: form.pvpRec,
      estado: 'recibido',
      fechaRespuesta: '',
      responsable: '',
      observaciones: '',
    })

    setForm({
      correo: user?.email || '', solicitante: user?.name || '',
      fecha: today, seccion: '', peticion: '', empresa: '', codtienda: '',
      comentarios: '', producto: '', pvpActual: '', pvpRec: '',
      fechaVigor: '', pvpMcdna: '', pvpLidl: '', pvpAlcampo: '',
    })
    setErrors({})
    showToast('✓ Solicitud registrada correctamente', 'success')
  }

  const inputClass = (key) => errors[key] ? styles.inputError : ''

  return (
    <div className={styles.wrap}>
      {/* Hero */}
      <div className={styles.hero}>
        <h1>SOLICITUD DE CAMBIO PVP</h1>
        <p>Registra errores, cambios de precio o incidencias de etiquetado.</p>
        <div className={styles.reqNote}><strong>*</strong> Campo obligatorio</div>
      </div>

      {/* Progress */}
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: progress + '%' }} />
      </div>

      {/* Section 1 */}
      <div className={styles.sectionHeader}>
        <div className={styles.sNum}>1</div>
        <div className={styles.sTitle}>Identificación del solicitante</div>
      </div>
      <div className={styles.card}>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>Correo <span className={styles.req}>*</span></label>
            <input type="email" value={form.correo} onChange={set('correo')} placeholder="nombre@carrefour.es" className={inputClass('correo')} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Solicitante <span className={styles.req}>*</span></label>
            <input type="text" value={form.solicitante} onChange={set('solicitante')} placeholder="Nombre y apellidos" className={inputClass('solicitante')} />
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Fecha de la solicitud <span className={styles.req}>*</span></label>
          <input type="date" value={form.fecha} onChange={set('fecha')} className={inputClass('fecha')} />
        </div>
      </div>

      {/* Section 2 */}
      <div className={styles.sectionHeader}>
        <div className={styles.sNum}>2</div>
        <div className={styles.sTitle}>Tipo de solicitud</div>
      </div>
      <div className={styles.card}>
        <div className={styles.field}>
          <label className={styles.label}>Sección <span className={styles.req}>*</span></label>
          <div className={`${styles.radioGrid} ${errors.seccion ? styles.radioError : ''}`}>
            {SECCIONES.map(s => (
              <label key={s.value} className={`${styles.radioOpt} ${form.seccion === s.value ? styles.checked : ''}`}>
                <input type="radio" name="seccion" value={s.value} checked={form.seccion === s.value} onChange={() => setRadio('seccion', s.value)} />
                <span className={styles.dot} />{s.label}
              </label>
            ))}
          </div>
        </div>
        <div className={styles.divider} />
        <div className={styles.field}>
          <label className={styles.label}>Petición <span className={styles.req}>*</span></label>
          <div className={`${styles.radioGrid} ${errors.peticion ? styles.radioError : ''}`}>
            {PETICIONES.map(p => (
              <label key={p} className={`${styles.radioOpt} ${form.peticion === p ? styles.checked : ''}`}>
                <input type="radio" name="peticion" value={p} checked={form.peticion === p} onChange={() => setRadio('peticion', p)} />
                <span className={styles.dot} />{p}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3 */}
      <div className={styles.sectionHeader}>
        <div className={styles.sNum}>3</div>
        <div className={styles.sTitle}>Identificación de tienda</div>
      </div>
      <div className={styles.card}>
        <div className={styles.field}>
          <label className={styles.label}>Empresa <span className={styles.req}>*</span></label>
          <div className={`${styles.radioGrid} ${errors.empresa ? styles.radioError : ''}`}>
            {EMPRESAS.map(e => (
              <label key={e} className={`${styles.radioOpt} ${form.empresa === e ? styles.checked : ''}`}>
                <input type="radio" name="empresa" value={e} checked={form.empresa === e} onChange={() => setRadio('empresa', e)} />
                <span className={styles.dot} />{e}
              </label>
            ))}
          </div>
        </div>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>Cód. Tienda <span className={styles.req}>*</span></label>
            <input type="text" value={form.codtienda} onChange={set('codtienda')} placeholder="Ej: 32434 o Aluche" className={inputClass('codtienda')} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Comentarios <span className={styles.sub}>(opcional)</span></label>
            <input type="text" value={form.comentarios} onChange={set('comentarios')} placeholder="Observaciones..." />
          </div>
        </div>
      </div>

      {/* Section 4 */}
      <div className={styles.sectionHeader}>
        <div className={styles.sNum}>4</div>
        <div className={styles.sTitle}>Producto y precios</div>
      </div>
      <div className={styles.card}>
        <div className={styles.field}>
          <label className={styles.label}>Producto <span className={styles.sub}>(opcional)</span></label>
          <input type="text" value={form.producto} onChange={set('producto')} placeholder="Nombre o código del producto" />
        </div>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>PVP Actual CRF <span className={styles.sub}>(opcional)</span></label>
            <div className={styles.priceWrap}>
              <span className={styles.sym}>€</span>
              <input type="number" value={form.pvpActual} onChange={set('pvpActual')} placeholder="0.00" step="0.01" min="0" />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>PVP Recomendado <span className={styles.req}>*</span></label>
            <div className={styles.priceWrap}>
              <span className={styles.sym}>€</span>
              <input type="number" value={form.pvpRec} onChange={set('pvpRec')} placeholder="0.00" step="0.01" min="0" className={inputClass('pvpRec')} />
            </div>
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Fecha Vigor Etiquetado <span className={styles.sub}>(opcional)</span></label>
          <input type="date" value={form.fechaVigor} onChange={set('fechaVigor')} />
        </div>
        <div className={styles.divider} />
        <div className={styles.field}>
          <label className={styles.label}>Precios Competencia</label>
          <div className={styles.compBlock}>
            {[
              { key: 'pvpMcdna', label: 'MCDNA', cls: styles.badgeMcdna, req: true },
              { key: 'pvpLidl',  label: 'LIDL',  cls: styles.badgeLidl,  req: false },
              { key: 'pvpAlcampo', label: 'ALCAMPO', cls: styles.badgeAlcampo, req: true },
            ].map(({ key, label, cls, req }) => (
              <div key={key} className={styles.compRow}>
                <span className={`${styles.compBadge} ${cls}`}>
                  {label}{req && <span className={styles.req}> *</span>}
                </span>
                <div className={styles.priceWrap}>
                  <span className={styles.sym}>€</span>
                  <input type="number" value={form[key]} onChange={set(key)} placeholder="0.00" step="0.01" min="0" className={req ? inputClass(key) : ''} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className={styles.btnSubmit} onClick={handleSubmit}>
        📤 ENVIAR SOLICITUD
      </button>
    </div>
  )
}
