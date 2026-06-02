import React, { useEffect, useRef } from 'react'
import styles from './LoginScreen.module.css'

export default function LoginScreen({ loading, error, domainError, renderGoogleButton, gsiReady }) {
  const btnRef = useRef(null)

  useEffect(() => {
    if (gsiReady && btnRef.current) {
      renderGoogleButton(btnRef.current)
    }
  }, [gsiReady, renderGoogleButton])

  return (
      <div className={styles.screen}>
        <div className={styles.circles}>
          <span /><span /><span />
        </div>

        <div className={styles.box}>
          <div className={styles.logo}>
            <div className={styles.logoC}>C<span>●</span></div>
            <div className={styles.logoText}>
              <div className={styles.l1}>SISTEMA PVP</div>
              <div className={styles.l2}>Carrefour España</div>
            </div>
          </div>

          <div className={styles.title}>Acceso Corporativo</div>
          <div className={styles.subtitle}>
            Inicia sesión con tu cuenta Google de Carrefour para acceder al sistema de solicitudes PVP.
          </div>

          {loading && (
              <div className={styles.loadingWrap}>
                <div className={styles.spin} />
                <p>Verificando sesión corporativa...</p>
              </div>
          )}

          {!loading && (
              <div className={styles.btnArea}>
                {/* Google renders its button here */}
                <div ref={btnRef} className={styles.gsiWrapper} />
              </div>
          )}

          {domainError && (
              <div className={styles.domainWarning}>
                ⚠️ Solo se permiten cuentas corporativas <strong>@carrefour.es</strong>.
                Por favor usa tu cuenta de empresa.
              </div>
          )}

          {error && !domainError && (
              <div className={styles.errorBox}>{error}</div>
          )}

          <div className={styles.divider}><span>acceso restringido</span></div>
          <div className={styles.note}>
            Este sistema es de uso exclusivo para empleados de <strong>Carrefour España</strong>.<br />
            Tus datos de sesión no se almacenan en servidores externos.
          </div>
        </div>
      </div>
  )
}
