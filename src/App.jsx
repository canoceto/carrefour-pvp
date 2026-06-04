import React, { useState } from 'react'
import { useAuth, useSolicitudes, useToast, usePrioridades, useConfig } from './hooks'
import { LoginScreen, Topbar, FormView, PanelView, MetricasView, ConfigView, CompetenciaView, Toast } from './components'
import { isApiMode } from './services'

function DataLoader() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'white', gap: 16, zIndex: 999,
    }}>
      <div style={{
        width: 36, height: 36, border: '3px solid #e5e7eb',
        borderTopColor: '#004a97', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>Cargando datos…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function App() {
  const { user, loading: authLoading, error, domainError, gsiReady, logout, renderGoogleButton, getInitials } = useAuth()
  const { solicitudes, loading: loadingSol, error: errorSol, addSolicitud, updateSolicitud } = useSolicitudes()
  const { toast, showToast } = useToast()
  const { prioridades, loading: loadingPrio, getPrioridad, updatePrioridad, resetDefaults } = usePrioridades()
  const { admins, fields, loading: loadingCfg, addAdmin, removeAdmin, updateField, resetFields } = useConfig()
  const [view, setView] = useState('form')

  const isAdmin = admins.map(a => a.toLowerCase()).includes(user?.email?.toLowerCase() ?? '')
  const pendingCount = solicitudes.filter(s => s.estado === 'recibido').length

  // Pantalla de login
  if (!user) {
    return (
      <LoginScreen
        loading={authLoading}
        error={error}
        domainError={domainError}
        renderGoogleButton={renderGoogleButton}
        gsiReady={gsiReady}
      />
    )
  }

  // Carga inicial de datos (solo en modo API para evitar flash en modo localStorage)
  if (isApiMode() && (loadingSol || loadingPrio || loadingCfg)) {
    return <DataLoader />
  }

  // Error crítico de datos
  if (errorSol) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#E2001A', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Error al cargar datos</div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>{errorSol}</div>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: 20, padding: '8px 20px', background: '#004a97', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <>
      <Topbar
        view={view}
        setView={setView}
        user={user}
        logout={logout}
        getInitials={getInitials}
        pendingCount={pendingCount}
        isAdmin={isAdmin}
      />

      {view === 'form' && (
        <FormView
          user={user}
          onSubmit={addSolicitud}
          showToast={showToast}
          getPrioridad={getPrioridad}
          fieldConfig={fields}
        />
      )}

      {isAdmin && view === 'metricas' && (
        <MetricasView solicitudes={solicitudes} />
      )}

      {isAdmin && view === 'panel' && (
        <PanelView
          solicitudes={solicitudes}
          updateSolicitud={updateSolicitud}
          showToast={showToast}
          currentUser={user}
          prioridades={prioridades}
          updatePrioridad={updatePrioridad}
          resetDefaults={resetDefaults}
        />
      )}

      {isAdmin && view === 'competencia' && (
        <CompetenciaView solicitudes={solicitudes} />
      )}

      {isAdmin && view === 'config' && (
        <ConfigView
          admins={admins}
          fields={fields}
          addAdmin={addAdmin}
          removeAdmin={removeAdmin}
          updateField={updateField}
          resetFields={resetFields}
          currentUser={user}
          showToast={showToast}
        />
      )}

      <Toast toast={toast} />
    </>
  )
}
