import React from 'react'
import styles from './Topbar.module.css'

export default function Topbar({ view, setView, user, logout, getInitials, pendingCount }) {
    return (
        <div className={styles.topbar}>
            <div className={styles.logo}>
                <div className={styles.logoC}>C<span>●</span></div>
                <div className={styles.logoText}>Sistema<br />PVP</div>
            </div>

            <div className={styles.navTabs}>
                <button
                    className={`${styles.navTab} ${view === 'form' ? styles.active : ''}`}
                    onClick={() => setView('form')}
                >
                    <span>📋</span> Nueva Solicitud
                </button>
                <button
                    className={`${styles.navTab} ${view === 'panel' ? styles.active : ''}`}
                    onClick={() => setView('panel')}
                >
                    <span>🗂️</span> Panel de Gestión
                    {pendingCount > 0 && (
                        <span className={styles.badge}>{pendingCount}</span>
                    )}
                </button>
            </div>

            <div className={styles.right}>
                {user && (
                    <div className={styles.userChip}>
                        <div className={styles.initials}>{getInitials(user.name)}</div>
                        <span className={styles.userName}>{user.given_name || user.name}</span>
                        <button className={styles.logoutBtn} onClick={logout}>Salir</button>
                    </div>
                )}
                <a
                    href="https://docs.google.com/spreadsheets/d/1RbfhsLHWqqWGKsqV0d7-PQUAedDOVfs9QwfK9nPV-X0/edit"
                    target="_blank"
                    rel="noreferrer"
                    className={styles.sheetsBtn}
                >
                    📊 Ver Sheets
                </a>
            </div>
        </div>
    )
}
