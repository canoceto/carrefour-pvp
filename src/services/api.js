/**
 * Base HTTP client.
 *
 * Auth flow:
 *   1. Si sessionStorage tiene 'crfpvp_token'  → Bearer <token>  (backend JWT)
 *   2. Si no                                   → X-User-Email    (identificador básico)
 *
 * El backend debe validar el token y devolver uno nuevo en login si implementa JWT.
 * Para conectar un backend diferente solo hay que cambiar VITE_API_URL en .env
 */

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export const isApiMode = () => BASE_URL !== ''

function buildHeaders(extra = {}) {
    const h = {'Content-Type': 'application/json', ...extra}

    const token = sessionStorage.getItem('crfpvp_token')
    if (token) {
        h['Authorization'] = `Bearer ${token}`
    } else {
        try {
            const u = JSON.parse(sessionStorage.getItem('crfpvp_user') || 'null')
            if (u?.email) h['X-User-Email'] = u.email
        } catch {
        }
    }

    return h
}

export class ApiError extends Error {
    constructor(message, status) {
        super(message)
        this.name = 'ApiError'
        this.status = status
    }
}

export async function apiFetch(method, path, body) {
    const opts = {method, headers: buildHeaders()}
    if (body !== undefined) opts.body = JSON.stringify(body)

    let res
    try {
        res = await fetch(`${BASE_URL}${path}`, opts)
    } catch (e) {
        throw new ApiError(`No se puede conectar al servidor: ${e.message}`, 0)
    }

    if (!res.ok) {
        let msg = `Error ${res.status}`
        try {
            const j = await res.json();
            msg = j.message || j.error || msg
        } catch {
        }
        throw new ApiError(msg, res.status)
    }

    return res.status === 204 ? null : res.json()
}

/** Guarda el JWT que devuelva el backend al autenticar */
export function setAuthToken(token) {
    if (token) sessionStorage.setItem('crfpvp_token', token)
    else sessionStorage.removeItem('crfpvp_token')
}
