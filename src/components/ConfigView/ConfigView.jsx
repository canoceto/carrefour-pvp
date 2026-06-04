import React, { useState } from 'react'
import styles from './ConfigView.module.css'
import { DEFAULT_FIELD_CONFIG } from '../../hooks/useConfig'

const SECTION_ORDER = ['Identificación', 'Tipo', 'Tienda', 'Producto', 'Precios']

function groupFields(fields) {
    const groups = {}
    SECTION_ORDER.forEach(s => { groups[s] = [] })
    Object.entries(fields).forEach(([key, cfg]) => {
        if (groups[cfg.section]) groups[cfg.section].push({ key, ...cfg })
    })
    return groups
}

function Toggle({ checked, onChange, colorOn = 'blue' }) {
    return (
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`${styles.toggle} ${checked ? (colorOn === 'red' ? styles.toggleRed : styles.toggleOn) : styles.toggleOff}`}
        >
            <span className={styles.toggleKnob} />
        </button>
    )
}

export default function ConfigView({ admins, fields, addAdmin, removeAdmin, updateField, resetFields, currentUser, showToast }) {
    const [newEmail, setNewEmail] = useState('')
    const groups = groupFields(fields)

    const handleAddAdmin = () => {
        if (!newEmail.trim()) return
        const ok = addAdmin(newEmail.trim())
        if (ok) {
            showToast('✓ Administrador añadido', 'success')
            setNewEmail('')
        } else {
            showToast('⚠ Ese correo ya es administrador o no es válido', 'error')
        }
    }

    const handleRemove = (email) => {
        if (email === currentUser?.email) {
            showToast('⚠ No puedes eliminarte a ti mismo', 'error')
            return
        }
        removeAdmin(email)
        showToast('Administrador eliminado', 'success')
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.pageHeader}>
                <div className={styles.pageTitle}>CONFIGURACIÓN</div>
            </div>

            {/* ── Sección: Administradores ── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionIcon}>👤</div>
                    <div>
                        <div className={styles.sectionTitle}>Administradores del sistema</div>
                        <div className={styles.sectionDesc}>Solo estos usuarios tienen acceso al Panel de Gestión, Métricas y Configuración.</div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.adminList}>
                        {admins.map(email => (
                            <div key={email} className={styles.adminRow}>
                                <div className={styles.adminAvatar}>{email[0].toUpperCase()}</div>
                                <span className={styles.adminEmail}>{email}</span>
                                {email === currentUser?.email && (
                                    <span className={styles.youBadge}>Tú</span>
                                )}
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => handleRemove(email)}
                                    title="Eliminar administrador"
                                    disabled={email === currentUser?.email}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className={styles.addAdminRow}>
                        <input
                            className={styles.addAdminInput}
                            type="email"
                            placeholder="nuevo@email.com"
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddAdmin()}
                        />
                        <button className={styles.addAdminBtn} onClick={handleAddAdmin}>
                            + Añadir administrador
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Sección: Campos del formulario ── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionIcon}>📋</div>
                    <div>
                        <div className={styles.sectionTitle}>Campos del formulario</div>
                        <div className={styles.sectionDesc}>Controla qué campos se muestran y si son obligatorios. Los campos ocultos tampoco se validan.</div>
                    </div>
                    <button className={styles.resetBtn} onClick={() => { resetFields(); showToast('✓ Campos restaurados por defecto', 'success') }}>
                        Restaurar por defecto
                    </button>
                </div>

                {SECTION_ORDER.map(seccion => (
                    <div key={seccion} className={styles.fieldGroup}>
                        <div className={styles.fieldGroupTitle}>{seccion}</div>
                        <div className={styles.card}>
                            <div className={styles.fieldTableHeader}>
                                <div className={styles.colLabel}>Campo</div>
                                <div className={styles.colToggle}>Visible</div>
                                <div className={styles.colToggle}>Obligatorio</div>
                            </div>
                            {groups[seccion].map(({ key, label, enabled, required }) => {
                                const isDefault = DEFAULT_FIELD_CONFIG[key]
                                return (
                                    <div key={key} className={`${styles.fieldRow} ${!enabled ? styles.fieldRowDisabled : ''}`}>
                                        <div className={styles.colLabel}>
                                            <span className={styles.fieldLabel}>{label}</span>
                                            {required && enabled && <span className={styles.reqDot}>*</span>}
                                        </div>
                                        <div className={styles.colToggle}>
                                            <Toggle
                                                checked={enabled}
                                                onChange={val => updateField(key, { enabled: val, ...(!val ? { required: false } : {}) })}
                                            />
                                        </div>
                                        <div className={styles.colToggle}>
                                            <Toggle
                                                checked={required && enabled}
                                                onChange={val => updateField(key, { required: val })}
                                                colorOn="red"
                                                disabled={!enabled}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
