import { useState, useCallback } from 'react'

export function useToast() {
  const [toast, setToast] = useState({ visible: false, msg: '', type: 'success' })

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ visible: true, msg, type })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500)
  }, [])

  return { toast, showToast }
}
