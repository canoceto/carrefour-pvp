import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseMode } from '../services/supabaseClient'

export const GOOGLE_CLIENT_ID = '628635003355-h1ouuvb7ck5416mv2khc3igkkc1a5dd2.apps.googleusercontent.com'

// Dominio corporativo permitido. Ej: 'carrefour.es'  (vacío = cualquier cuenta)
export const ALLOWED_DOMAIN = ''

const USER_KEY = 'crfpvp_user'

function parseJwt(token) {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    )
    return JSON.parse(json)
}

function getInitials(name) {
    if (!name) return '?'
    return name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// Intercambia el id_token de Google por una sesión de Supabase (Google está dado de
// alta como provider OAuth en Supabase). Sin esto las políticas RLS no reconocerían
// al usuario como "authenticated". Requiere registrar GOOGLE_CLIENT_ID en Supabase:
// Authentication > Providers > Google > Authorized Client IDs.
async function syncSupabaseSession(idToken) {
    if (!isSupabaseMode()) return
    try {
        const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
        })
        if (error) console.error('Supabase auth (Google id_token):', error.message)
    } catch (err) {
        console.error('Supabase auth (Google id_token):', err)
    }
}

export function useAuth() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [domainError, setDomainError] = useState(false)
    const [gsiReady, setGsiReady] = useState(false)
    // Indica si la sesión de Supabase está lista para ser usada por las queries con RLS.
    // Empieza en 0 (no listo) en modo Supabase y se incrementa con cada cambio de sesión
    // (sesión inicial, login, logout, refresh de token), para que los hooks de datos
    // puedan (re)cargar una vez la sesión "authenticated" esté disponible.
    const [sessionVersion, setSessionVersion] = useState(() => (isSupabaseMode() ? 0 : 1))

    useEffect(() => {
        if (!isSupabaseMode()) return
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            setSessionVersion(v => v + 1)
        })
        return () => subscription.unsubscribe()
    }, [])

    const loginWithPayload = useCallback((payload) => {
        const email = payload.email || ''
        const domain = email.split('@')[1] || ''

        if (ALLOWED_DOMAIN && domain !== ALLOWED_DOMAIN) {
            setDomainError(true)
            setError(`Acceso denegado. Solo se permiten cuentas @${ALLOWED_DOMAIN}.`)
            setLoading(false)
            return
        }

        const u = {
            name: payload.name || email,
            email,
            picture: payload.picture || '',
            given_name: payload.given_name || '',
            family_name: payload.family_name || '',
        }

        try { sessionStorage.setItem(USER_KEY, JSON.stringify(u)) } catch {}
        setUser(u)
        setLoading(false)
    }, [])

    const handleCredential = useCallback((response) => {
        try {
            const payload = parseJwt(response.credential)
            loginWithPayload(payload)
            syncSupabaseSession(response.credential)
        } catch {
            setError('Error al procesar las credenciales. Inténtalo de nuevo.')
            setLoading(false)
        }
    }, [loginWithPayload])

    // Init Google Auth
    useEffect(() => {
        // En desarrollo local, saltar el login y usar un usuario de prueba
        if (import.meta.env.DEV) {
            setUser({ name: 'Dev User', email: 'dev@local.test', picture: '', given_name: 'Dev', family_name: 'User' })
            setLoading(false)
            return
        }

        // Check session storage first
        try {
            const saved = sessionStorage.getItem(USER_KEY)
            if (saved) {
                setUser(JSON.parse(saved))
                setLoading(false)
                return
            }
        } catch {}

        // Wait for GSI script
        const tryInit = () => {
            if (window.google?.accounts?.id) {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleCredential,
                    auto_select: true,
                    cancel_on_tap_outside: false,
                    context: 'signin',
                    itp_support: true,
                })
                setGsiReady(true)
                setLoading(false)

                // Try One Tap silent sign-in
                window.google.accounts.id.prompt((notification) => {
                    setLoading(false)
                })
            } else {
                setTimeout(tryInit, 300)
            }
        }

        tryInit()
    }, [handleCredential])

    // Render Google button into a DOM node
    const renderGoogleButton = useCallback((el) => {
        if (!el || !gsiReady || !window.google?.accounts?.id) return
        window.google.accounts.id.renderButton(el, {
            type: 'standard',
            size: 'large',
            theme: 'outline',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 320,
        })
    }, [gsiReady])

    const logout = useCallback(() => {
        try { sessionStorage.removeItem(USER_KEY) } catch {}
        if (window.google?.accounts?.id) {
            window.google.accounts.id.disableAutoSelect()
        }
        if (isSupabaseMode()) {
            supabase.auth.signOut().catch(() => {})
        }
        setUser(null)
    }, [])

    return {
        user,
        loading,
        error,
        domainError,
        gsiReady,
        sessionVersion,
        logout,
        renderGoogleButton,
        getInitials,
    }
}
