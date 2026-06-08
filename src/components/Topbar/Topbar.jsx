import React from 'react'
import styles from './Topbar.module.css'

export default function Topbar({view, setView, user, logout, getInitials, pendingCount, isAdmin, onExportSheets}) {
    return (
        <div className={styles.topbar}>
            <div className={styles.logo}>
                <div className={styles.logoC}>C<span>●</span></div>
                <div className={styles.logoText}>Sistema<br/>PVP</div>
            </div>

            <div className={styles.navTabs}>
                <button
                    className={`${styles.navTab} ${view === 'form' ? styles.active : ''}`}
                    onClick={() => setView('form')}
                >
                    <span>📋</span> Nueva Solicitud
                </button>
                {isAdmin && (
                    <button
                        className={`${styles.navTab} ${view === 'panel' ? styles.active : ''}`}
                        onClick={() => setView('panel')}
                    >
                        <span>🗂️</span> Panel de Gestión
                        {pendingCount > 0 && (
                            <span className={styles.badge}>{pendingCount}</span>
                        )}
                    </button>
                )}
                {isAdmin && (
                    <button
                        className={`${styles.navTab} ${view === 'metricas' ? styles.active : ''}`}
                        onClick={() => setView('metricas')}
                    >
                        <span>📈</span> Métricas
                    </button>
                )}
                {isAdmin && (
                    <button
                        className={`${styles.navTab} ${view === 'competencia' ? styles.active : ''}`}
                        onClick={() => setView('competencia')}
                    >
                        <span>🏪</span> Competencia
                    </button>
                )}
                {isAdmin && (
                    <button
                        className={`${styles.navTab} ${view === 'homologacion' ? styles.active : ''}`}
                        onClick={() => setView('homologacion')}
                    >
                        <span>🏷️</span> Homologación
                    </button>
                )}
                {isAdmin && (
                    <button
                        className={`${styles.navTab} ${view === 'config' ? styles.active : ''}`}
                        onClick={() => setView('config')}
                    >
                        <span>⚙️</span> Configuración
                    </button>
                )}
            </div>

            <div className={styles.right}>
                {user && (
                    <div className={styles.userChip}>
                        <div className={styles.initials}>{getInitials(user.name)}</div>
                        <span className={styles.userName}>{user.given_name || user.name}</span>
                        <button className={styles.logoutBtn} onClick={logout}>Salir</button>
                    </div>
                )}
                <button className={styles.sheetsBtn} onClick={onExportSheets}>
                    📊 Exportar a Sheets
                </button>
            </div>
        </div>
    )
}
