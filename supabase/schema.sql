-- =====================================================================================
-- Carrefour PVP — Esquema Supabase
-- =====================================================================================
-- Diseño granular basado en las estructuras reales usadas por la app
-- (src/components/FormView, src/hooks/usePrioridades.js, src/hooks/useConfig.js,
--  src/hooks/useHomologacion.js) y en los ficheros fuente de
--  "Fwd_ Te paso la info":
--    - Datos_Tabla_Homologos_PFT_20260601.xlsx
--    - PVP_Peninsula_PFT_Resumen_20260521.xlsb
--    - Homologos_Drive 12032026.xlsx (hoja ARTICULOS)
--    - sms_dashboard_fyv12032026.xlsx
--
-- Criterio: columnas reales para los campos que la app consulta/filtra/ordena;
-- columnas JSONB ("extra"/"competencia"/"tiendas") para la "cola larga" de campos
-- de los Excel que hoy no se usan en lógica pero conviene conservar sin forzar
-- migraciones cada vez que el origen añade/quita columnas.
-- =====================================================================================


-- =====================================================================================
-- 1. SOLICITUDES — formulario principal (FormView / PanelView)
-- =====================================================================================
CREATE TABLE solicitudes (
  id                       TEXT PRIMARY KEY,            -- 'SOL-' || epoch ms (generado en cliente)
  ts_creacion              TIMESTAMPTZ DEFAULT NOW(),    -- momento real de creación (BD)
  timestamp_local          TEXT,                         -- texto formateado es-ES mostrado en UI

  -- Identificación del solicitante
  correo                   TEXT NOT NULL,
  solicitante              TEXT,
  fecha                    DATE,                         -- fecha indicada en el formulario
  cc                       TEXT,

  -- Clasificación de la petición
  seccion                  TEXT,
  peticion                 TEXT,
  empresa                  TEXT,
  codtienda                TEXT,

  -- Datos del producto / petición
  comentarios              TEXT,
  sms_descripcion          TEXT,                         -- "SMS / Descripción" del producto
  plan_sevilla             TEXT,
  etiquetado_proveedor     TEXT,
  fecha_vigor              DATE,
  adjunto_url              TEXT,

  -- Precios indicados en el formulario
  pvp_actual               NUMERIC,
  pvp_rec                  NUMERIC,
  pvp_mercadona            NUMERIC,
  pvp_lidl                 NUMERIC,
  pvp_alcampo              NUMERIC,

  -- Resultado de homologación (snapshot tomado al crear/editar la solicitud)
  homologado               TEXT,                         -- 'Sí' | 'No'
  homologado_fuentes       TEXT[] DEFAULT '{}',          -- nombres de fuentes donde se encontró el SMS

  -- Flujo / estado
  estado                   TEXT DEFAULT 'recibido',      -- recibido | seccion | respondido
  prioridad                SMALLINT DEFAULT 5,           -- 1 (Urgente) .. 5 (Normal)

  -- Datos de la respuesta (PanelView / RespForm)
  nuevo_responsable        TEXT,
  plan_accion              TEXT,
  nueva_asignacion         TEXT,
  estado_solicitud         TEXT,
  fecha_posicionamiento    DATE,
  responsable_contestacion TEXT,
  observaciones            TEXT,
  cc_respuesta             TEXT,
  enviar                   TEXT DEFAULT 'NO',            -- 'NO' | 'SI'
  fecha_respuesta          TEXT,

  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_solicitudes_estado   ON solicitudes (estado);
CREATE INDEX idx_solicitudes_seccion  ON solicitudes (seccion);
CREATE INDEX idx_solicitudes_fecha    ON solicitudes (fecha);
CREATE INDEX idx_solicitudes_correo   ON solicitudes (correo);
CREATE INDEX idx_solicitudes_sms      ON solicitudes (sms_descripcion);


-- =====================================================================================
-- 2. CONFIGURACIÓN — admins, campos del formulario y prioridades por tipo de petición
-- =====================================================================================

-- usePrioridades.js → DEFAULT_PRIORIDADES (peticion -> nivel 1..5)
CREATE TABLE prioridades (
  peticion   TEXT PRIMARY KEY,
  nivel      SMALLINT NOT NULL DEFAULT 5 CHECK (nivel BETWEEN 1 AND 5)
);

-- useConfig.js → SEED_ADMINS
CREATE TABLE app_admins (
  email      TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- useConfig.js → DEFAULT_FIELD_CONFIG (metadatos por campo del formulario)
CREATE TABLE app_field_config (
  field_key  TEXT PRIMARY KEY,        -- p.ej. 'correo', 'pvpMercadona', ...
  label      TEXT NOT NULL,
  section    TEXT,
  type       TEXT NOT NULL DEFAULT 'text',   -- 'text' | 'date' | 'radio' | 'price'
  required   BOOLEAN NOT NULL DEFAULT false,
  enabled    BOOLEAN NOT NULL DEFAULT true,
  sort_order SMALLINT
);


-- =====================================================================================
-- 3. HOMOLOGACIÓN — metadatos de cada fuente cargada
-- =====================================================================================
-- Una fila por fuente (homologos_drive, datos_homologos_pft, pvp_peninsula_pft,
-- sms_dashboard). 'fecha' es la fecha que representa la carga vigente y se usa
-- para casar con solicitudes.fecha en isHomologado().
CREATE TABLE homologacion_fuentes (
  id          TEXT PRIMARY KEY,        -- 'homologos_drive' | 'datos_homologos_pft' | 'pvp_peninsula_pft' | 'sms_dashboard'
  nombre      TEXT NOT NULL,
  file_name   TEXT,
  fecha       DATE,
  sms_col     TEXT,
  solo_consulta BOOLEAN NOT NULL DEFAULT false,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);


-- =====================================================================================
-- 4. HOMÓLOGOS DRIVE — hoja ARTICULOS (fuente 'homologos_drive')
-- =====================================================================================
CREATE TABLE homologos_drive_articulos (
  id                          BIGSERIAL PRIMARY KEY,
  fuente_fecha                DATE,                  -- = homologacion_fuentes.fecha de esta carga
  sms                         BIGINT,
  descripcion                 TEXT,
  seccion                     TEXT,
  aplicar                     TEXT,
  estado                      TEXT,
  competidor                  TEXT,
  cod_competidor              TEXT,
  descripcion_competidor      TEXT,
  unidades_crf                NUMERIC,
  gramos_crf                  NUMERIC,
  unidades_competidor         NUMERIC,
  gramos_competidor           NUMERIC,
  palabras_clave              TEXT,
  palabras_prohibidas         TEXT,
  calculo_coeficiente         TEXT,
  coeficiente_homologado      NUMERIC,
  coeficiente_total           NUMERIC,
  coeficiente                 NUMERIC,
  coeficiente_formato         NUMERIC,
  coeficiente_calidad         NUMERIC,
  motivo_coeficiente_calidad  TEXT,
  tipo_pvp_a_utilizar         TEXT,
  comentarios                 TEXT,
  panelista                   TEXT,
  alarmar_top_venta           TEXT,
  campana                     TEXT,
  extra                       JSONB DEFAULT '{}',    -- resto de columnas de la hoja ARTICULOS
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_homologos_drive_sms   ON homologos_drive_articulos (sms);
CREATE INDEX idx_homologos_drive_fecha ON homologos_drive_articulos (fuente_fecha);


-- =====================================================================================
-- 5. HOMÓLOGOS PFT — Datos_Tabla_Homologos_PFT (fuente 'datos_homologos_pft')
-- =====================================================================================
CREATE TABLE homologos_pft (
  id                              BIGSERIAL PRIMARY KEY,
  fuente_fecha                    DATE,
  sms                             BIGINT,
  ean_carrefour                   BIGINT,
  descripcion_carrefour           TEXT,
  estado_compra                   TEXT,
  valor_ud_medida                 TEXT,
  unidad_medida                   TEXT,
  tipo_marca                      TEXT,
  descripcion_banner              TEXT,
  cod_banner                      TEXT,
  ean_competidor                  BIGINT,
  descripcion_competidor          TEXT,
  valor_ud_medida_competidor      TEXT,
  unidad_medida_competidor        TEXT,
  chequeo_original                TEXT,
  chequeo_homologado              TEXT,
  coeficiente                     NUMERIC,
  coef_corrector_formato          NUMERIC,
  coef_corrector_calidad          NUMERIC,
  motivo_coef_corrector_calidad   TEXT,
  fecha_alta                      DATE,
  observaciones                   TEXT,
  responsable                     TEXT,
  sector                          TEXT,
  seccion                         TEXT,
  grupo_familia                   TEXT,
  familia                         TEXT,
  sub_familia                     TEXT,
  solo_canarias                   BOOLEAN DEFAULT false,
  extra                           JSONB DEFAULT '{}',
  updated_at                      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_homologos_pft_sms   ON homologos_pft (sms);
CREATE INDEX idx_homologos_pft_fecha ON homologos_pft (fuente_fecha);


-- =====================================================================================
-- 6. PVP PENÍNSULA PFT — Resumen (fuente 'pvp_peninsula_pft', solo consulta)
-- =====================================================================================
-- Usada en PanelView para: localizar SMS -> mostrar ID_UDS / UDS, y comparar
-- precios de Mercadona / LIDL / Alcampo (con y sin promo) frente a los precios
-- introducidos en el formulario. El resto de competidores y precios por tienda
-- (~190 columnas) se guardan en JSONB.
CREATE TABLE pvp_peninsula_pft (
  id                       BIGSERIAL PRIMARY KEY,
  fuente_fecha             DATE,
  sms                      BIGINT,
  ean                      BIGINT,
  product_desc             TEXT,
  descripcion_larga        TEXT,
  ind_compra               TEXT,
  seccion                  TEXT,
  grupo_familia            TEXT,
  familia                  TEXT,
  subfamilia               TEXT,
  marca                    TEXT,
  tipo_marca               TEXT,

  id_uds                   TEXT,
  uds                      TEXT,

  pvp_ponderado            NUMERIC,
  pvp_moda                 NUMERIC,
  pvp_min                  NUMERIC,
  pvp_max                  NUMERIC,

  -- Competidores destacados (comparativa directa en PanelView)
  pvp_mercadona            NUMERIC,
  pvp_mercadona_no_promo   NUMERIC,
  pvp_lidl                 NUMERIC,
  pvp_lidl_no_promo        NUMERIC,
  pvp_alcampo              NUMERIC,
  pvp_alcampo_no_promo     NUMERIC,

  -- Resto de competidores con/sin promo (AHORRAMAS, ALDI, DIA, EROSKI, etc.)
  competencia              JSONB DEFAULT '{}',
  -- Precios/recuentos por tienda y zona (Nº TIENDAS..., PVP Gran Canaria, Tenerife, etc.)
  tiendas                  JSONB DEFAULT '{}',
  -- Cualquier otra columna no mapeada (costes, márgenes, fechas de promo, etc.)
  extra                    JSONB DEFAULT '{}',

  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pvp_peninsula_sms   ON pvp_peninsula_pft (sms);
CREATE INDEX idx_pvp_peninsula_fecha ON pvp_peninsula_pft (fuente_fecha);


-- =====================================================================================
-- 7. SMS DASHBOARD — atributos de producto (fuente 'sms_dashboard')
-- =====================================================================================
CREATE TABLE sms_dashboard (
  id                  BIGSERIAL PRIMARY KEY,
  fuente_fecha        DATE,
  sms                 BIGINT,
  desc_producto_crf   TEXT,
  cliente             TEXT,
  producto            TEXT,
  variedad_crf        TEXT,
  categoria_crf       TEXT,
  presentacion_crf    TEXT,
  calibre_crf         TEXT,
  tratamiento_crf     TEXT,
  origen_crf          TEXT,
  gramaje_crf         TEXT,
  marca_crf           TEXT,
  piezas_crf          TEXT,
  precio_crf          TEXT,
  top                 TEXT,
  campana             TEXT,
  creado              TEXT,
  actualizado         TEXT,
  extra               JSONB DEFAULT '{}',
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sms_dashboard_sms   ON sms_dashboard (sms);
CREATE INDEX idx_sms_dashboard_fecha ON sms_dashboard (fuente_fecha);


-- =====================================================================================
-- 8. updated_at automático
-- =====================================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_solicitudes_updated_at
  BEFORE UPDATE ON solicitudes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_homologos_drive_updated_at
  BEFORE UPDATE ON homologos_drive_articulos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_homologos_pft_updated_at
  BEFORE UPDATE ON homologos_pft
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_pvp_peninsula_updated_at
  BEFORE UPDATE ON pvp_peninsula_pft
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_sms_dashboard_updated_at
  BEFORE UPDATE ON sms_dashboard
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_homologacion_fuentes_updated_at
  BEFORE UPDATE ON homologacion_fuentes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================================
-- 9. Row Level Security
-- =====================================================================================
-- La app inicia sesión en Google Identity Services y, con el mismo id_token,
-- llama a supabase.auth.signInWithIdToken({ provider: 'google', token }) (ver
-- src/hooks/useAuth.js). Esto crea una sesión real de Supabase, por lo que
-- auth.role() = 'authenticated' y auth.jwt() ->> 'email' quedan disponibles
-- en las políticas de abajo sin necesidad de backend propio.
--
-- Reglas solicitadas:
--   - Lectura: cualquier usuario autenticado, en todas las tablas.
--   - Escritura en `solicitudes`: cualquier usuario autenticado.
--   - Escritura en tablas de referencia/homologación: solo administradores
--     (emails presentes en `app_admins`).
-- =====================================================================================

-- Helper: ¿el usuario autenticado actual es administrador?
-- SECURITY DEFINER para que la subconsulta a app_admins no dependa de que el
-- usuario tenga permiso de SELECT directo sobre esa tabla.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_admins WHERE email = (auth.jwt() ->> 'email')
  );
$$;

-- ── solicitudes: lectura y escritura para cualquier usuario autenticado ─────────────
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solicitudes_all_authenticated" ON solicitudes
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── tablas de referencia / homologación: lectura para todos, escritura solo admin ──
ALTER TABLE prioridades              ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_admins                ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_field_config          ENABLE ROW LEVEL SECURITY;
ALTER TABLE homologacion_fuentes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE homologos_drive_articulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE homologos_pft             ENABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_peninsula_pft         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_dashboard             ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prioridades_select_authenticated" ON prioridades
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "prioridades_write_admin" ON prioridades
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "app_admins_select_authenticated" ON app_admins
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_admins_write_admin" ON app_admins
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "app_field_config_select_authenticated" ON app_field_config
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_field_config_write_admin" ON app_field_config
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "homologacion_fuentes_select_authenticated" ON homologacion_fuentes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "homologacion_fuentes_write_admin" ON homologacion_fuentes
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "homologos_drive_articulos_select_authenticated" ON homologos_drive_articulos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "homologos_drive_articulos_write_admin" ON homologos_drive_articulos
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "homologos_pft_select_authenticated" ON homologos_pft
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "homologos_pft_write_admin" ON homologos_pft
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "pvp_peninsula_pft_select_authenticated" ON pvp_peninsula_pft
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "pvp_peninsula_pft_write_admin" ON pvp_peninsula_pft
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "sms_dashboard_select_authenticated" ON sms_dashboard
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sms_dashboard_write_admin" ON sms_dashboard
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
