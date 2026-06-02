import React, { useState } from 'react'
import { useAuth, useSolicitudes, useToast, usePrioridades } from './hooks'
import { LoginScreen, Topbar, FormView, PanelView, Toast } from './components'


export default function App() {
  const { user, loading, error, domainError, gsiReady, logout, renderGoogleButton, getInitials } = useAuth()
  const { solicitudes, addSolicitud, updateSolicitud } = useSolicitudes()
  const { toast, showToast } = useToast()
  const { prioridades, getPrioridad, updatePrioridad, resetDefaults } = usePrioridades()
  const [view, setView] = useState('form')

  const pendingCount = solicitudes.filter(s => s.estado === 'recibido').length

  if (!user) {
    return (
        <LoginScreen
            loading={loading}
            error={error}
            domainError={domainError}
            renderGoogleButton={renderGoogleButton}
            gsiReady={gsiReady}
        />
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
        />

        {view === 'form' && (
            <FormView user={user} onSubmit={addSolicitud} showToast={showToast} getPrioridad={getPrioridad} />
        )}

        {view === 'panel' && (
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

        <Toast toast={toast} />
      </>
  )
}
