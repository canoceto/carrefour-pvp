-- Ajusta los permisos de `solicitudes`:
--   - Lectura: los administradores (tabla `app_admins`) ven TODAS las
--     solicitudes; el resto de usuarios solo ven las que ellos mismos
--     enviaron (comparando `correo` con su email autenticado).
--   - Creación: cualquier usuario autenticado puede enviar solicitudes.
--   - Actualización/borrado (gestión desde el Panel): solo administradores.
--
-- Elimina primero TODAS las políticas existentes sobre `solicitudes` (por si
-- quedó alguna de un diseño anterior) y deja únicamente las de abajo.
-- No borra datos.

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'solicitudes'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.solicitudes', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solicitudes_select" ON public.solicitudes
  FOR SELECT TO authenticated
  USING (is_admin() OR correo = (auth.jwt() ->> 'email'));

CREATE POLICY "solicitudes_insert" ON public.solicitudes
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "solicitudes_update_admin" ON public.solicitudes
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "solicitudes_delete_admin" ON public.solicitudes
  FOR DELETE TO authenticated
  USING (is_admin());

-- Verificación: deberían aparecer las 4 políticas de arriba.
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'solicitudes';
