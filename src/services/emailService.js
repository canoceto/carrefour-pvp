/**
 * Envío del correo de respuesta al solicitante (con CC) al marcar
 * "ENVIAR = SI" desde el Panel.
 *
 * No hay backend propio: se reutiliza un Google Apps Script desplegado como
 * Web App (ver google-apps-script/EmailResponder.gs) que llama a
 * GmailApp.sendEmail, igual que el script antiguo de Sheets.
 *
 * Configuración (.env):
 *   VITE_RESPUESTA_WEBHOOK_URL    → URL .../exec del Web App
 *   VITE_RESPUESTA_WEBHOOK_SECRET → debe coincidir con RESPUESTA_SECRET del script
 */

const WEBHOOK_URL    = import.meta.env.VITE_RESPUESTA_WEBHOOK_URL ?? ''
const WEBHOOK_SECRET = import.meta.env.VITE_RESPUESTA_WEBHOOK_SECRET ?? ''

export const isEmailConfigured = () => WEBHOOK_URL !== ''

/** Construye el payload de email para una solicitud + el formulario de respuesta. */
export function buildEmailPayload(solicitud, respForm) {
    return {
        correo: solicitud.correo,
        cc: [solicitud.cc, respForm.ccRespuesta].filter(v => v && v.trim()).join(','),
        solicitante: solicitud.solicitante,
        seccion: solicitud.seccion,
        peticion: solicitud.peticion,
        producto: solicitud.smsDescripcion,
        estadoSolicitud: respForm.estadoSolicitud,
        fechaPosicionamiento: respForm.fechaPosicionamiento,
        responsableContestacion: respForm.responsableContestacion,
        observaciones: respForm.observaciones,
    }
}

/**
 * Envía uno o varios correos de respuesta a través del Web App de Apps Script.
 * No lanza: si falla, devuelve { ok: false, error }.
 */
export async function enviarRespuestas(items) {
    if (!isEmailConfigured()) return { ok: false, error: 'not-configured' }
    if (!items.length) return { ok: true, enviados: 0, total: 0 }

    try {
        const res = await fetch(WEBHOOK_URL, {
            method: 'POST',
            // text/plain evita el preflight CORS (Apps Script no responde a OPTIONS);
            // el body sigue siendo JSON y se parsea igual en el Web App.
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ secret: WEBHOOK_SECRET, solicitudes: items }),
        })
        return await res.json()
    } catch (err) {
        return { ok: false, error: err.message }
    }
}
