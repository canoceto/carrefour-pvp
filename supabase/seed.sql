-- =====================================================================================
-- Carrefour PVP — Datos iniciales
-- =====================================================================================
-- Refleja los valores por defecto definidos en:
--   - src/hooks/useConfig.js       (SEED_ADMINS, DEFAULT_FIELD_CONFIG)
--   - src/hooks/usePrioridades.js  (DEFAULT_PRIORIDADES)
--
-- is_admin() (ver schema.sql) consulta app_admins por email, así que esta tabla
-- debe estar poblada para que las políticas de escritura admin funcionen.
-- =====================================================================================

-- ── Administradores ─────────────────────────────────────────────────────────────────
INSERT INTO app_admins (email) VALUES
  ('carlosg.anoceto@gmail.com'),
  ('marlis2.mc@gmail.com'),
  ('dev@local.test')
ON CONFLICT (email) DO NOTHING;

-- ── Prioridades por tipo de petición ────────────────────────────────────────────────
INSERT INTO prioridades (peticion, nivel) VALUES
  ('ERROR PVP',                    1),
  ('ERROR CHEQUEO',                1),
  ('MARGEN NEGATIVO',              1),
  ('STICKER',                      1),
  ('CAMBIO PVP / POSICIONAMIENTO', 2),
  ('LIBERAR PRECIO',               2),
  ('ETIQUETADO PROVEEDOR',         2),
  ('POSICIONMIENTO',               2),
  ('HOMOLOGACIÓN',                 3),
  ('PROCESO TARIFARIO',            3),
  ('ALTA',                         4),
  ('REACTIVACION',                 4),
  ('INACTIVACION TEMPORAL',        4),
  ('BAJA STDO',                    4),
  ('CAMBIO PARAMETRIZACIÓN',       5),
  ('CAMBIO DE PARAMETRIZACION',    5),
  ('EXCEPCION CIAL',               5)
ON CONFLICT (peticion) DO UPDATE SET nivel = EXCLUDED.nivel;

-- ── Configuración de campos del formulario ──────────────────────────────────────────
INSERT INTO app_field_config (field_key, label, section, type, required, enabled, sort_order) VALUES
  ('correo',              'Correo electrónico',     'Identificación', 'text',  true,  true,  1),
  ('solicitante',         'Nombre solicitante',     'Identificación', 'text',  true,  true,  2),
  ('fecha',               'Fecha de la solicitud',  'Identificación', 'date',  true,  true,  3),
  ('cc',                  'CC (copia de respuesta)','Identificación', 'text',  false, true,  4),
  ('seccion',             'Sección',                'Tipo',           'radio', true,  true,  5),
  ('peticion',            'Tipo de petición',       'Tipo',           'radio', true,  true,  6),
  ('empresa',             'Empresa',                'Tienda',         'radio', true,  true,  7),
  ('codtienda',           'Código de tienda',       'Tienda',         'text',  true,  true,  8),
  ('smsDescripcion',      'SMS / Descripción',      'Producto',       'text',  false, true,  9),
  ('comentarios',         'Comentarios',            'Producto',       'text',  false, true,  10),
  ('planSevilla',         '¿Plan Sevilla?',         'Producto',       'radio', false, true,  11),
  ('etiquetadoProveedor', '¿Etiquetado Proveedor?', 'Producto',       'radio', false, true,  12),
  ('fechaVigor',          'Fecha Vigor Etiquetado', 'Producto',       'date',  false, true,  13),
  ('adjuntoUrl',          'Adjunto / URL Drive',    'Producto',       'text',  false, true,  14),
  ('pvpActual',           'PVP Actual CRF',         'Precios',        'price', false, true,  15),
  ('pvpRec',              'PVP Recomendado',        'Precios',        'price', true,  true,  16),
  ('pvpMercadona',        'PVP Mercadona',          'Precios',        'price', true,  true,  17),
  ('pvpLidl',             'PVP LIDL',               'Precios',        'price', false, true,  18),
  ('pvpAlcampo',          'PVP Alcampo',            'Precios',        'price', true,  true,  19)
ON CONFLICT (field_key) DO UPDATE SET
  label      = EXCLUDED.label,
  section    = EXCLUDED.section,
  type       = EXCLUDED.type,
  required   = EXCLUDED.required,
  enabled    = EXCLUDED.enabled,
  sort_order = EXCLUDED.sort_order;
