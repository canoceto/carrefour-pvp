import React, { useState } from 'react'
import Modal from './Modal'
import styles from './PanelView.module.css'

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

function DetailGrid({ s }) {
  return (
    <div className={styles.detailGrid}>
      {[
        ['Solicitante', s.solicitante], ['Correo', s.correo],
        ['Sección', s.seccion],         ['Petición', s.peticion],
        ['Empresa', s.empresa],          ['Cód. Tienda', s.codtienda],
        ['Producto', s.producto || '—'], ['PVP Rec.', s.pvpRec ? `€${s.pvpRec}` : '—'],
        ['PVP MCDNA', s.pvpMcdna ? `€${s.pvpMcdna}` : '—'],
        ['PVP Alcampo', s.pvpAlcampo ? `€${s.pvpAlcampo}` : '—'],
      ].map(([label, val]) => (
        <div key={label} className={styles.detailItem}>
          <div className={styles.dLabel}>{label}</div>
          <div className={styles.dVal}>{val}</div>
        </div>
      ))}
      {s.comentarios && (
        <div className={styles.detailItem} style={{ gridColumn: '1/-1' }}>
          <div className={styles.dLabel}>Comentarios</div>
          <div className={styles.dVal}>{s.comentarios}</div>
        </div>
      )}
    </div>
  )
}

function ReqCard({ s, onMover, onResponder, onVer }) {
  const secClass = SECCION_COLOR[s.seccion] || styles.secDefault
  const respondido = s.estado === 'respondido'
  const recibido = s.estado === 'recibido'

  return (
    <div className={styles.reqCard} onClick={() => onVer(s)}>
      <div className={styles.cardTop}>
        <span className={`${styles.secBadge} ${secClass}`}>{s.seccion}</span>
        <span className={styles.peticion}>{s.peticion}</span>
      </div>
      <div className={styles.producto}>{s.producto || '(Sin producto)'}</div>
      <div className={styles.empresa}>🏪 {s.empresa} · {s.codtienda}</div>
      <div className={styles.dateTime}>{s.timestamp}</div>
      <div className={styles.prices}>
        {[['CRF Rec', s.pvpRec], ['MCDNA', s.pvpMcdna], ['Alcampo', s.pvpAlcampo]].map(([label, val]) => (
          <div key={label} className={styles.priceChip}>
            <div className={styles.pLabel}>{label}</div>
            <div className={styles.pVal}>{val ? `€${val}` : '—'}</div>
          </div>
        ))}
      </div>

      {respondido ? (
        <div className={styles.respondedBadge}>
          ✓ Respondido · {s.fechaRespuesta}
          {s.observaciones && <em className={styles.obs}>"{s.observaciones}"</em>}
        </div>
      ) : (
        <div className={styles.actions} onClick={e => e.stopPropagation()}>
          {recibido && (
            <button className={`${styles.btnAction} ${styles.btnMover}`} onClick={() => onMover(s)}>
              → Mover a sección
            </button>
          )}
          <button className={`${styles.btnAction} ${styles.btnResponder}`} onClick={() => onResponder(s)}>
            ✓ Responder
          </button>
        </div>
      )}
    </div>
  )
}

export default function PanelView({ solicitudes, updateSolicitud, showToast }) {
  const [modalMover, setModalMover]   = useState(null)
  const [modalResp, setModalResp]     = useState(null)
  const [modalVer, setModalVer]       = useState(null)
  const [respObs, setRespObs]         = useState('')
  const [respResponsable, setRespResponsable] = useState('')

  const recibidos  = solicitudes.filter(s => s.estado === 'recibido')
  const enSeccion  = solicitudes.filter(s => s.estado === 'seccion')
  const respondidos = solicitudes.filter(s => s.estado === 'respondido')

  const confirmarMover = () => {
    updateSolicitud(modalMover.id, { estado: 'seccion' })
    showToast(`✓ Movido a ${HOJA_MAP[modalMover.seccion] || 'Sección'}`, 'success')
    setModalMover(null)
  }

  const confirmarRespuesta = () => {
    updateSolicitud(modalResp.id, {
      estado: 'respondido',
      fechaRespuesta: new Date().toLocaleDateString('es-ES'),
      observaciones: respObs,
      responsable: respResponsable,
    })
    showToast('✓ Marcado como respondido', 'success')
    setModalResp(null)
    setRespObs(''); setRespResponsable('')
  }

  const openSheetsExport = () => {
    const url = 'https://docs.google.com/spreadsheets/d/1RbfhsLHWqqWGKsqV0d7-PQUAedDOVfs9QwfK9nPV-X0/edit'
    const header = 'Marca temporal\tCorreo\tSECCIÓN\tPETICIÓN\tEMPRESA\tCOD TIENDA\tCOMENTARIOS\tPRODUCTO\tPVP ACTUAL CRF\tPVP RECOMENDADO\tFECHA VIGOR\tPVP MCDNA\tPVP LIDL\tPVP ALCAMPO\n'
    const rows = solicitudes.map(s => [
      s.timestamp, s.correo, s.seccion, s.peticion, s.empresa, s.codtienda,
      s.comentarios, s.producto, s.pvpActual, s.pvpRec, s.fechaVigor,
      s.pvpMcdna, s.pvpLidl, s.pvpAlcampo,
    ].join('\t')).join('\n')
    navigator.clipboard.writeText(header + rows).then(() => {
      showToast('📋 Datos copiados — pega en Sheets con Ctrl+V', 'success')
      setTimeout(() => window.open(url, '_blank'), 1200)
    }).catch(() => window.open(url, '_blank'))
  }

  const EmptyCol = () => (
    <div className={styles.emptyCol}><div className={styles.eIcon}>📭</div>Sin solicitudes</div>
  )

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>PANEL DE GESTIÓN</div>
        <button className={styles.exportBtn} onClick={openSheetsExport}>📊 Exportar a Sheets</button>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        {[
          ['Total recibidas', solicitudes.length, ''],
          ['Pendientes', recibidos.length, styles.red],
          ['En proceso', enSeccion.length, styles.orange],
          ['Respondidas', respondidos.length, styles.green],
        ].map(([label, val, cls]) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statLabel}>{label}</div>
            <div className={`${styles.statValue} ${cls}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Kanban */}
      <div className={styles.kanban}>
        {[
          { title: 'Formularios Recibidos', dot: styles.dotRed,    items: recibidos,  estado: 'recibido' },
          { title: 'En Sección',            dot: styles.dotOrange, items: enSeccion,  estado: 'seccion' },
          { title: 'Respondidos',           dot: styles.dotGreen,  items: respondidos,estado: 'respondido' },
        ].map(({ title, dot, items, estado }) => (
          <div key={title} className={styles.column}>
            <div className={styles.colHeader}>
              <div className={styles.colTitle}>
                <div className={`${styles.colDot} ${dot}`} />
                {title}
              </div>
              <span className={styles.colCount}>{items.length}</span>
            </div>
            <div>
              {items.length === 0 ? <EmptyCol /> : items.map(s => (
                <ReqCard
                  key={s.id} s={s}
                  onMover={setModalMover}
                  onResponder={(s) => { setModalResp(s); setRespObs(''); setRespResponsable('') }}
                  onVer={setModalVer}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Mover */}
      <Modal
        show={!!modalMover}
        onClose={() => setModalMover(null)}
        title="MOVER A SECCIÓN"
        footer={
          <>
            <button className={styles.btnCancel} onClick={() => setModalMover(null)}>Cancelar</button>
            <button className={styles.btnConfirm} onClick={confirmarMover}>✓ MOVER A SECCIÓN</button>
          </>
        }
      >
        {modalMover && (
          <>
            <p className={styles.modalInfo}>
              La solicitud se moverá a la hoja: <strong style={{ color: 'var(--blue)' }}>{HOJA_MAP[modalMover.seccion]}</strong>
            </p>
            <DetailGrid s={modalMover} />
          </>
        )}
      </Modal>

      {/* Modal: Responder */}
      <Modal
        show={!!modalResp}
        onClose={() => setModalResp(null)}
        title="RESPONDER SOLICITUD"
        footer={
          <>
            <button className={styles.btnCancel} onClick={() => setModalResp(null)}>Cancelar</button>
            <button className={`${styles.btnConfirm} ${styles.green}`} onClick={confirmarRespuesta}>✓ MARCAR COMO RESPONDIDO</button>
          </>
        }
      >
        {modalResp && (
          <>
            <DetailGrid s={modalResp} />
            <div className={styles.respArea}>
              <label className={styles.respLabel}>Observaciones de respuesta</label>
              <textarea value={respObs} onChange={e => setRespObs(e.target.value)} placeholder="Escribe aquí la respuesta o comentario..." />
              <div style={{ marginTop: 12 }}>
                <label className={styles.respLabel}>Responsable</label>
                <input type="text" value={respResponsable} onChange={e => setRespResponsable(e.target.value)} placeholder="Tu nombre / email" />
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Modal: Ver detalle */}
      <Modal
        show={!!modalVer}
        onClose={() => setModalVer(null)}
        title="DETALLE SOLICITUD"
        footer={
          <button className={styles.btnCancel} style={{ flex: 1 }} onClick={() => setModalVer(null)}>Cerrar</button>
        }
      >
        {modalVer && (
          <>
            <DetailGrid s={modalVer} />
            {modalVer.estado === 'respondido' && modalVer.observaciones && (
              <div className={styles.detailGrid} style={{ marginTop: 16 }}>
                <div className={styles.detailItem} style={{ gridColumn: '1/-1' }}>
                  <div className={styles.dLabel}>Respuesta</div>
                  <div className={styles.dVal} style={{ color: 'var(--success)' }}>{modalVer.observaciones}</div>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.dLabel}>Responsable</div>
                  <div className={styles.dVal}>{modalVer.responsable || '—'}</div>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.dLabel}>Fecha respuesta</div>
                  <div className={styles.dVal}>{modalVer.fechaRespuesta}</div>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
