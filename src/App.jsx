import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useSolicitudes } from './hooks/useSolicitudes'
import { useToast } from './hooks/useToast'
import LoginScreen from './components/LoginScreen'
import Topbar from './components/Topbar'
import FormView from './components/FormView'
import PanelView from './components/PanelView'
import Toast from './components/Toast'

export default function App() {
  const { user, loading, error, domainError, gsiReady, logout, renderGoogleButton, getInitials } = useAuth()
  const { solicitudes, addSolicitud, updateSolicitud } = useSolicitudes()
  const { toast, showToast } = useToast()
  const [view, setView] = useState('form')

  const pendingCount = solicitudes.filter(s => s.estado === 'recibido').length

  // Show login if no user
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
        <FormView
          user={user}
          onSubmit={addSolicitud}
          showToast={showToast}
        />
      )}

      {view === 'panel' && (
        <PanelView
          solicitudes={solicitudes}
          updateSolicitud={updateSolicitud}
          showToast={showToast}
        />
      )}

      <Toast toast={toast} />
    </>
  )
}
