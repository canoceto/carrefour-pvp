import React, { useState, useEffect, useMemo } from 'react'
import styles from './FormView.module.css'
import { DEFAULT_FIELD_CONFIG } from '../../hooks/useConfig'

const SECCIONES = [
  { value: 'FRUTERIA', label: '🍎 Frutería' },
  { value: 'CARNICERIA', label: '🥩 Carnicería' },
  { value: 'CHARCUTERIA', label: '🍖 Charcutería' },
  { value: 'PLATOS PREPARADOS', label: '🍱 Platos Preparados' },
  { value: 'PANADERIA', label: '🥖 Panadería' },
  { value: 'PESCADERIA', label: '🐟 Pescadería' },
]

const PETICIONES = [
  'ALTA', 'REACTIVACION', 'INACTIVACION TEMPORAL',
  'BAJA STDO', 'ETIQUETADO PROVEEDOR', 'STICKER', 'ERROR PVP',
  'ERROR CHEQUEO', 'CAMBIO PARAMETRIZACIÓN',
  'EXCEPCION CIAL', 'HOMOLOGACIÓN', 'CAMBIO PVP / POSICIONAMIENTO',
  'MARGEN NEGATIVO', 'LIBERAR PRECIO', 'PROCESO TARIFARIO',
]

const EMPRESAS = [
  'PAIS (TODOS)', 'HIPER', 'MARKET', 'ONLINE',
  'EXPRESS', 'CANARIAS', 'PENINSULA', 'TIENDA', 'SUPECO',
]

export default function FormView({ user, onSubmit, showToast, getPrioridad, fieldConfig, isHomologado }) {
  const fc = (key) => fieldConfig?.[key] ?? DEFAULT_FIELD_CONFIG[key]

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

  const { reqFields, reqRadios } = useMemo(() => {
    const text = [], radio = []
    Object.entries(fieldConfig ?? DEFAULT_FIELD_CONFIG).forEach(([key, cfg]) => {
      if (!cfg.enabled || !cfg.required) return
      // codtienda solo obligatorio cuando la empresa seleccionada es 'TIENDA'
      if (key === 'codtienda' && form.empresa !== 'TIENDA') return
      if (cfg.type === 'radio') radio.push(key)
      else text.push(key)
    })
    return { reqFields: text, reqRadios: radio }
  }, [fieldConfig, form.empresa])

  useEffect(() => {
    const total = reqFields.length + reqRadios.length
    if (total === 0) { setProgress(100); return }
    let filled = 0
    reqFields.forEach(k => { if (form[k]?.toString().trim()) filled++ })
    reqRadios.forEach(k => { if (form[k]) filled++ })
    setProgress(Math.round((filled / total) * 100))
  }, [form, reqFields, reqRadios])

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
    reqFields.forEach(k => { if (!form[k]?.toString().trim()) newErrors[k] = true })
    reqRadios.forEach(k => { if (!form[k]) newErrors[k] = true })

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

  const ic   = (key) => errors[key] ? styles.inputError : ''
  const show = (key) => fc(key).enabled
  const req  = (key) => {
    if (key === 'codtienda') return fc(key).enabled && form.empresa === 'TIENDA'
    return fc(key).required && fc(key).enabled
  }
  const lbl  = (key) => fc(key).label

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
            {show('correo') && (
              <Field label={lbl('correo')} req={req('correo')}>
                <input type="email" value={form.correo} onChange={set('correo')} placeholder="nombre@carrefour.es" className={ic('correo')} />
              </Field>
            )}
            {show('solicitante') && (
              <Field label={lbl('solicitante')} req={req('solicitante')}>
                <input type="text" value={form.solicitante} onChange={set('solicitante')} placeholder="Nombre y apellidos" className={ic('solicitante')} />
              </Field>
            )}
          </div>
          <div className={styles.fieldRow}>
            {show('fecha') && (
              <Field label={lbl('fecha')} req={req('fecha')}>
                <input type="date" value={form.fecha} onChange={set('fecha')} className={ic('fecha')} />
              </Field>
            )}
            {show('cc') && (
              <Field label={lbl('cc')} req={req('cc')}>
                <input type="email" value={form.cc} onChange={set('cc')} placeholder="email@carrefour.es" className={ic('cc')} />
              </Field>
            )}
          </div>
        </div>

        {/* S2: Tipo */}
        <SectionHeader num="2" title="Tipo de solicitud" />
        <div className={styles.card}>
          {show('seccion') && (
            <Field label={lbl('seccion')} req={req('seccion')}>
              <RadioGrid options={SECCIONES} name="seccion" value={form.seccion} onChange={(v) => setRadio('seccion', v)} error={errors.seccion} />
            </Field>
          )}
          <div className={styles.divider} />
          {show('peticion') && (
            <Field label={lbl('peticion')} req={req('peticion')}>
              <RadioGrid options={PETICIONES.map(p => ({ value: p, label: p }))} name="peticion" value={form.peticion} onChange={(v) => setRadio('peticion', v)} error={errors.peticion} />
            </Field>
          )}
        </div>

        {/* S3: Tienda */}
        <SectionHeader num="3" title="Identificación de tienda" />
        <div className={styles.card}>
          {show('empresa') && (
            <Field label={lbl('empresa')} req={req('empresa')}>
              <RadioGrid options={EMPRESAS.map(e => ({ value: e, label: e }))} name="empresa" value={form.empresa} onChange={(v) => setRadio('empresa', v)} error={errors.empresa} />
            </Field>
          )}
          {show('codtienda') && (
            <Field label={lbl('codtienda')} req={req('codtienda')}>
              <input type="text" value={form.codtienda} onChange={set('codtienda')} placeholder="Ej: 32434 o Aluche" className={ic('codtienda')} />
            </Field>
          )}
        </div>

        {/* S4: Producto */}
        <SectionHeader num="4" title="Producto" />
        <div className={styles.card}>
          {show('smsDescripcion') && (
            <Field label={lbl('smsDescripcion')} req={req('smsDescripcion')}>
              <input type="text" value={form.smsDescripcion} onChange={set('smsDescripcion')} placeholder="Ej: 867504 o COSTILLA SEMICARNUDA CRF" className={ic('smsDescripcion')} />
              {form.smsDescripcion && isHomologado && (
                isHomologado(form.smsDescripcion, form.fecha)
                  ? <div className={styles.homBadgeOk}>✓ Homologado hoy</div>
                  : <div className={styles.homBadgeNo}>✗ No homologado hoy</div>
              )}
            </Field>
          )}
          {show('comentarios') && (
            <Field label={lbl('comentarios')} req={req('comentarios')}>
              <textarea value={form.comentarios} onChange={set('comentarios')} placeholder="Observaciones adicionales sobre el producto..." className={ic('comentarios')} />
            </Field>
          )}
          {(show('planSevilla') || show('etiquetadoProveedor')) && (
            <div className={styles.fieldRow}>
              {show('planSevilla') && (
                <Field label={lbl('planSevilla')} req={req('planSevilla')}>
                  <div className={`${styles.radioGrid} ${errors.planSevilla ? styles.radioError : ''}`}>
                    {['Sí', 'No'].map(v => (
                      <label key={v} className={`${styles.radioOpt} ${form.planSevilla === v ? styles.checked : ''}`}>
                        <input type="radio" checked={form.planSevilla === v} onChange={() => setForm(f => ({ ...f, planSevilla: v }))} />
                        <span className={styles.dot} />{v}
                      </label>
                    ))}
                  </div>
                </Field>
              )}
              {show('etiquetadoProveedor') && (
                <Field label={lbl('etiquetadoProveedor')} req={req('etiquetadoProveedor')}>
                  <div className={`${styles.radioGrid} ${errors.etiquetadoProveedor ? styles.radioError : ''}`}>
                    {['Sí', 'No'].map(v => (
                      <label key={v} className={`${styles.radioOpt} ${form.etiquetadoProveedor === v ? styles.checked : ''}`}>
                        <input type="radio" checked={form.etiquetadoProveedor === v} onChange={() => setForm(f => ({ ...f, etiquetadoProveedor: v }))} />
                        <span className={styles.dot} />{v}
                      </label>
                    ))}
                  </div>
                </Field>
              )}
            </div>
          )}
          {show('fechaVigor') && (
            <Field label={lbl('fechaVigor')} req={req('fechaVigor')}>
              <input type="date" value={form.fechaVigor} onChange={set('fechaVigor')} className={ic('fechaVigor')} />
            </Field>
          )}
          {show('adjuntoUrl') && (
            <Field label={lbl('adjuntoUrl')} req={req('adjuntoUrl')}>
              <input type="text" value={form.adjuntoUrl} onChange={set('adjuntoUrl')} placeholder="https://drive.google.com/..." className={ic('adjuntoUrl')} />
            </Field>
          )}
        </div>

        {/* S5: Precios */}
        <SectionHeader num="5" title="Precios" />
        <div className={styles.card}>
          {(show('pvpActual') || show('pvpRec')) && (
            <div className={styles.fieldRow}>
              {show('pvpActual') && (
                <Field label={lbl('pvpActual')} req={req('pvpActual')}>
                  <PriceInput value={form.pvpActual} onChange={set('pvpActual')} error={errors.pvpActual} />
                </Field>
              )}
              {show('pvpRec') && (
                <Field label={lbl('pvpRec')} req={req('pvpRec')}>
                  <PriceInput value={form.pvpRec} onChange={set('pvpRec')} error={errors.pvpRec} />
                </Field>
              )}
            </div>
          )}
          {(show('pvpMercadona') || show('pvpLidl') || show('pvpAlcampo')) && (
            <>
              <div className={styles.divider} />
              <Field label="Precios Competencia">
                <div className={styles.compBlock}>
                  {[
                    { key: 'pvpMercadona', label: 'MERCADONA', cls: styles.badgeMcdna },
                    { key: 'pvpLidl',      label: 'LIDL',      cls: styles.badgeLidl  },
                    { key: 'pvpAlcampo',   label: 'ALCAMPO',   cls: styles.badgeAlcampo },
                  ].filter(({ key }) => show(key)).map(({ key, label, cls }) => (
                    <div key={key} className={styles.compRow}>
                      <span className={`${styles.compBadge} ${cls}`}>
                        {label}{req(key) && <span className={styles.req}> *</span>}
                      </span>
                      <PriceInput value={form[key]} onChange={set(key)} error={errors[key]} freeText />
                    </div>
                  ))}
                </div>
              </Field>
            </>
          )}
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

function PriceInput({ value, onChange, error, freeText = false }) {
  return (
      <div className={styles.priceWrap}>
        <span className={`${styles.sym} ${freeText ? styles.symFree : ''}`}>€</span>
        {freeText ? (
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={onChange}
            placeholder="1.99 o texto"
            className={error ? styles.inputError : ''}
          />
        ) : (
          <input
            type="number"
            value={value}
            onChange={onChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            className={error ? styles.inputError : ''}
          />
        )}
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
