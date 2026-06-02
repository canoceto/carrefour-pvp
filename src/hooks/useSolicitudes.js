import { useState, useEffect } from 'react'

const STORAGE_KEY = 'crfpvp_solicitudes'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

export function useSolicitudes() {
  const [solicitudes, setSolicitudes] = useState(() => loadFromStorage())

  const addSolicitud = (s) => {
    setSolicitudes(prev => {
      const next = [...prev, s]
      saveToStorage(next)
      return next
    })
  }

  const updateSolicitud = (id, changes) => {
    setSolicitudes(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...changes } : s)
      saveToStorage(next)
      return next
    })
  }

  return { solicitudes, addSolicitud, updateSolicitud }
}
