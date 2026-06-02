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
  'ALTA', 'ALTA O REACTIVACION', 'REACTIVACION', 'INACTIVACION TEMPORAL',
  'BAJA STDO', 'ETIQUETADO PROVEEDOR', 'STICKER', 'ERROR PVP',
  'ERROR CHEQUEO', 'CAMBIO PARAMETRIZACIÓN', 'CAMBIO DE PARAMETRIZACION',
  'EXCEPCION CIAL', 'HOMOLOGACIÓN', 'CAMBIO PVP / POSICIONAMIENTO',
  'POSICIONMIENTO', 'MARGEN NEGATIVO', 'LIBERAR PRECIO', 'PROCESO TARIFARIO',
]

const EMPRESAS = [
  'PAIS (TODOS)', 'HIPER', 'MARKET', 'ONLINE',
  'EXPRESS', 'CANARIAS', 'PENINSULA', 'TIENDA', 'SUPECO',
]

const REQUIRED_FIELDS = ['correo', 'solicitante', 'fecha', 'codtienda', 'pvpRec', 'pvpMercadona', 'pvpAlcampo']
const REQUIRED_RADIOS = ['seccion', 'peticion', 'empresa']

export default function FormView({ user, onSubmit, showToast, getPrioridad }) {
  const today = new Date().toISOString().split('T')[0]

  const empty = {
    correo: '', solicitante: '', fecha: today,
    seccion: '', peticion: '', empresa: '', codtienda: '',
    comentarios: '', smsDescripcion: '',
    planSevilla: 'No', etiquetadoProveedor: 'No',
    fechaVigor: '',
    pvpActual: '', pvpRec: '',
    pvpMercadona: '', pvpLidl: '', pvpAlcampo: '',
    adjuntoUrl: '', cc: '',
  }

  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        correo: f.correo || user.email,
        solicitante: f.solicitante || user.name,
      }))
    }
  }, [user])

  useEffect(() => {
    let filled = 0
    const total = REQUIRED_FIELDS.length + REQUIRED_RADIOS.length
    REQUIRED_FIELDS.forEach(k => { if (form[k]?.toString().trim()) filled++ })
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

    onSubmit({
      id: 'SOL-' + Date.now(),
      timestamp: new Date().toLocaleString('es-ES'),
      ...form,
      estado: 'recibido',
      prioridad: getPrioridad ? getPrioridad(form.peticion) : 5,
      nuevoResponsable: '',
      planAccion: '',
      nuevaAsignacion: '',
      estadoSolicitud: '',
      fechaPosicionamiento: '',
      responsableContestacion: '',
      observaciones: '',
      enviar: 'NO',
      fechaRespuesta: '',
    })

    setForm({ ...empty, correo: user?.email || '', solicitante: user?.name || '', fecha: today })
    setErrors({})
    showToast('✓ Solicitud registrada correctamente', 'success')
  }

  const ic = (key) => errors[key] ? styles.inputError : ''

  return (
      <div className={styles.wrap}>
        <div className={styles.hero}>
          <h1>SOLICITUD DE CAMBIO PVP</h1>
          <p>Incidencias / Consultas Pricing — Registra errores, cambios de precio o incidencias de etiquetado.</p>
          <div className={styles.reqNote}><strong>*</strong> Campo obligatorio</div>
        </div>

        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: progress + '%' }} />
        </div>

        {/* S1: Solicitante */}
        <SectionHeader num="1" title="Identificación del solicitante" />
        <div className={styles.card}>
          <div className={styles.fieldRow}>
            <Field label="Correo electrónico" req>
              <input type="email" value={form.correo} onChange={set('correo')} placeholder="nombre@carrefour.es" className={ic('correo')} />
            </Field>
            <Field label="Solicitante" req>
              <input type="text" value={form.solicitante} onChange={set('solicitante')} placeholder="Nombre y apellidos" className={ic('solicitante')} />
            </Field>
          </div>
          <Field label="Fecha de la solicitud" req>
            <input type="date" value={form.fecha} onChange={set('fecha')} className={ic('fecha')} />
          </Field>
        </div>

        {/* S2: Tipo */}
        <SectionHeader num="2" title="Tipo de solicitud" />
        <div className={styles.card}>
          <Field label="Sección" req>
            <RadioGrid options={SECCIONES} name="seccion" value={form.seccion} onChange={(v) => setRadio('seccion', v)} error={errors.seccion} />
          </Field>
          <div className={styles.divider} />
          <Field label="Petición" req>
            <RadioGrid options={PETICIONES.map(p => ({ value: p, label: p }))} name="peticion" value={form.peticion} onChange={(v) => setRadio('peticion', v)} error={errors.peticion} />
          </Field>
        </div>

        {/* S3: Tienda */}
        <SectionHeader num="3" title="Identificación de tienda" />
        <div className={styles.card}>
          <Field label="Empresa" req>
            <RadioGrid options={EMPRESAS.map(e => ({ value: e, label: e }))} name="empresa" value={form.empresa} onChange={(v) => setRadio('empresa', v)} error={errors.empresa} />
          </Field>
          <div className={styles.fieldRow}>
            <Field label="Cód. Tienda" req>
              <input type="text" value={form.codtienda} onChange={set('codtienda')} placeholder="Ej: 32434 o Aluche" className={ic('codtienda')} />
            </Field>
            <Field label="CC" sub="(copia de respuesta)">
              <input type="email" value={form.cc} onChange={set('cc')} placeholder="email@carrefour.es" />
            </Field>
          </div>
          <Field label="Comentarios" sub="(opcional)">
            <textarea value={form.comentarios} onChange={set('comentarios')} placeholder="Observaciones adicionales..." />
          </Field>
        </div>

        {/* S4: Producto */}
        <SectionHeader num="4" title="Producto" />
        <div className={styles.card}>
          <Field label="SMS / Descripción" sub="(código o descripción del producto)">
            <input type="text" value={form.smsDescripcion} onChange={set('smsDescripcion')} placeholder="Ej: 867504 o COSTILLA SEMICARNUDA CRF" />
          </Field>
          <div className={styles.fieldRow}>
            <Field label="¿Plan Sevilla?">
              <div className={styles.radioGrid}>
                {['Sí', 'No'].map(v => (
                    <label key={v} className={`${styles.radioOpt} ${form.planSevilla === v ? styles.checked : ''}`}>
                      <input type="radio" checked={form.planSevilla === v} onChange={() => setForm(f => ({ ...f, planSevilla: v }))} />
                      <span className={styles.dot} />{v}
                    </label>
                ))}
              </div>
            </Field>
            <Field label="¿Etiquetado Proveedor?">
              <div className={styles.radioGrid}>
                {['Sí', 'No'].map(v => (
                    <label key={v} className={`${styles.radioOpt} ${form.etiquetadoProveedor === v ? styles.checked : ''}`}>
                      <input type="radio" checked={form.etiquetadoProveedor === v} onChange={() => setForm(f => ({ ...f, etiquetadoProveedor: v }))} />
                      <span className={styles.dot} />{v}
                    </label>
                ))}
              </div>
            </Field>
          </div>
          <Field label="Fecha Vigor Etiquetado" sub="(si aplica)">
            <input type="date" value={form.fechaVigor} onChange={set('fechaVigor')} />
          </Field>
          <Field label="Adjuntar fichero / URL Drive" sub="(opcional)">
            <input type="text" value={form.adjuntoUrl} onChange={set('adjuntoUrl')} placeholder="https://drive.google.com/..." />
          </Field>
        </div>

        {/* S5: Precios */}
        <SectionHeader num="5" title="Precios" />
        <div className={styles.card}>
          <div className={styles.fieldRow}>
            <Field label="PVP Actual CRF" sub="(opcional)">
              <PriceInput value={form.pvpActual} onChange={set('pvpActual')} />
            </Field>
            <Field label="PVP Recomendado" req>
              <PriceInput value={form.pvpRec} onChange={set('pvpRec')} error={errors.pvpRec} />
            </Field>
          </div>
          <div className={styles.divider} />
          <Field label="Precios Competencia">
            <div className={styles.compBlock}>
              {[
                { key: 'pvpMercadona', label: 'MERCADONA', cls: styles.badgeMcdna, req: true },
                { key: 'pvpLidl',      label: 'LIDL',      cls: styles.badgeLidl,  req: false },
                { key: 'pvpAlcampo',   label: 'ALCAMPO',   cls: styles.badgeAlcampo, req: true },
              ].map(({ key, label, cls, req }) => (
                  <div key={key} className={styles.compRow}>
                <span className={`${styles.compBadge} ${cls}`}>
                  {label}{req && <span className={styles.req}> *</span>}
                </span>
                    <PriceInput value={form[key]} onChange={set(key)} error={req ? errors[key] : false} />
                  </div>
              ))}
            </div>
          </Field>
        </div>

        <button className={styles.btnSubmit} onClick={handleSubmit}>
          📤 ENVIAR SOLICITUD
        </button>
      </div>
  )
}

/* ── helpers ─────────────────────────────── */
function SectionHeader({ num, title }) {
  return (
      <div className={styles.sectionHeader}>
        <div className={styles.sNum}>{num}</div>
        <div className={styles.sTitle}>{title}</div>
      </div>
  )
}

function Field({ label, req, sub, children }) {
  return (
      <div className={styles.field}>
        <label className={styles.label}>
          {label}
          {req && <span className={styles.req}> *</span>}
          {sub && <span className={styles.sub}> {sub}</span>}
        </label>
        {children}
      </div>
  )
}

function PriceInput({ value, onChange, error }) {
  return (
      <div className={styles.priceWrap}>
        <span className={styles.sym}>€</span>
        <input type="number" value={value} onChange={onChange} placeholder="0.00" step="0.01" min="0"
               className={error ? styles.inputError : ''} />
      </div>
  )
}

function RadioGrid({ options, name, value, onChange, error }) {
  return (
      <div className={`${styles.radioGrid} ${error ? styles.radioError : ''}`}>
        {options.map(o => (
            <label key={o.value} className={`${styles.radioOpt} ${value === o.value ? styles.checked : ''}`}>
              <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
              <span className={styles.dot} />{o.label}
            </label>
        ))}
      </div>
  )
}
