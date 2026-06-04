import React, { useState } from 'react'
import { useAuth, useSolicitudes, useToast, usePrioridades, useConfig } from './hooks'
import { LoginScreen, Topbar, FormView, PanelView, MetricasView, ConfigView, Toast } from './components'

export default function App() {
  const { user, loading, error, domainError, gsiReady, logout, renderGoogleButton, getInitials } = useAuth()
  const { solicitudes, addSolicitud, updateSolicitud } = useSolicitudes()
  const { toast, showToast } = useToast()
  const { prioridades, getPrioridad, updatePrioridad, resetDefaults } = usePrioridades()
  const { admins, fields, addAdmin, removeAdmin, updateField, resetFields } = useConfig()
  const [view, setView] = useState('form')

  const isAdmin = admins.map(a => a.toLowerCase()).includes(user?.email?.toLowerCase() ?? '')

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
