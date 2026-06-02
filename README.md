# Carrefour — Sistema PVP

Aplicación React + Vite para gestión de solicitudes de cambio de PVP.

## Instalación

```bash
npm install
npm run dev
```

## Build para producción (GitHub Pages)

```bash
npm run build
# El output estará en /dist — sube esa carpeta a GitHub Pages
```

## Configuración Google Auth

Abre `src/hooks/useAuth.js` y edita:

```js
export const GOOGLE_CLIENT_ID = 'TU_CLIENT_ID.apps.googleusercontent.com'
export const ALLOWED_DOMAIN = 'carrefour.es'  // solo cuentas corporativas
```

## Estructura del proyecto

```
src/
├── App.jsx                  # Componente raíz
├── index.css                # Variables CSS globales
├── main.jsx                 # Entry point
├── hooks/
│   ├── useAuth.js           # Google Identity Services
│   ├── useSolicitudes.js    # Estado + localStorage
│   └── useToast.js          # Notificaciones
└── components/
    ├── LoginScreen.jsx/css  # Pantalla de login
    ├── Topbar.jsx/css       # Barra de navegación
    ├── FormView.jsx/css     # Formulario de solicitud
    ├── PanelView.jsx/css    # Panel kanban de gestión
    ├── Modal.jsx/css        # Modal reutilizable
    └── Toast.jsx/css        # Notificación toast
```

## Deploy en GitHub Pages

1. En `vite.config.js`, asegúrate de que `base` coincide con tu repo:
   ```js
   base: '/nombre-del-repo/'
   ```
2. `npm run build`
3. Sube la carpeta `/dist` como rama `gh-pages` o usa la Action de GitHub
