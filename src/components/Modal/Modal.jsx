import React, { useEffect } from 'react'
import styles from './Modal.module.css'

export default function Modal({ show, onClose, title, footer, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (show) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [show, onClose])

  if (!show) return null

  return (
      <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
        <div className={styles.modal}>
          <div className={styles.header}>
            <h3>{title}</h3>
            <button className={styles.close} onClick={onClose}>✕</button>
          </div>
          <div className={styles.body}>{children}</div>
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      </div>
  )
}
