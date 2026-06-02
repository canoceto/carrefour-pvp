import React from 'react'
import styles from './Toast.module.css'

export default function Toast({ toast }) {
    return (
        <div className={`${styles.toast} ${toast.visible ? styles.show : ''} ${styles[toast.type]}`}>
            <span className={styles.icon}>{toast.type === 'success' ? '✓' : '⚠'}</span>
            <span>{toast.msg}</span>
        </div>
    )
}
