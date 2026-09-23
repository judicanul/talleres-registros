-- ==============================================================================
-- Esquema de Base de Datos para Taller Automotriz (Mini-SaaS) en Supabase
-- ==============================================================================

-- 1. Crear la tabla principal de registros de servicio
CREATE TABLE IF NOT EXISTS public.registros_servicio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa VARCHAR(20) NOT NULL,
    cliente_nombre VARCHAR(150) NOT NULL,
    cliente_telefono VARCHAR(50),
    vehiculo_modelo VARCHAR(150) NOT NULL,
    vehiculo_kilometraje INTEGER DEFAULT 0,
    servicio_detalle TEXT NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'En fila',
    hora_ingreso TIMESTAMPTZ DEFAULT now(),
    danos_previos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Índices recomendados para búsquedas rápidas y ordenamiento
CREATE INDEX IF NOT EXISTS idx_registros_placa ON public.registros_servicio(placa);
CREATE INDEX IF NOT EXISTS idx_registros_estado ON public.registros_servicio(estado);
CREATE INDEX IF NOT EXISTS idx_registros_hora_ingreso ON public.registros_servicio(hora_ingreso DESC);

-- 3. Configurar Row Level Security (RLS)
ALTER TABLE public.registros_servicio ENABLE ROW LEVEL SECURITY;

-- Políticas para acceso público/anon (adecuado para prototipo / mini-saas del taller)
DROP POLICY IF EXISTS "Permitir lectura pública" ON public.registros_servicio;
CREATE POLICY "Permitir lectura pública" 
ON public.registros_servicio 
FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Permitir inserción pública" ON public.registros_servicio;
CREATE POLICY "Permitir inserción pública" 
ON public.registros_servicio 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualización pública" ON public.registros_servicio;
CREATE POLICY "Permitir actualización pública" 
ON public.registros_servicio 
FOR UPDATE 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Permitir eliminación pública" ON public.registros_servicio;
CREATE POLICY "Permitir eliminación pública" 
ON public.registros_servicio 
FOR DELETE 
TO anon, authenticated 
USING (true);

-- 4. Habilitar Supabase Realtime para la tabla
-- Esto permite que los cambios (INSERT, UPDATE) se transmitan en vivo al Dashboard
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'registros_servicio'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.registros_servicio;
  END IF;
END $$;

-- 5. Datos de prueba opcionales (Seed Data)
INSERT INTO public.registros_servicio (placa, cliente_nombre, cliente_telefono, vehiculo_modelo, vehiculo_kilometraje, servicio_detalle, estado, danos_previos)
VALUES 
(
  'XYZ-987', 
  'Carlos Mendoza', 
  '+52 999 456 7890', 
  'Nissan Versa 2021', 
  48500, 
  'Afinación mayor y cambio de balatas delanteras', 
  'En fila', 
  '[{"id": "d-1", "x": 26.5, "y": 32.4, "tipo": "Rayón en puerta delantera izq."}]'::jsonb
),
(
  'ABC-123', 
  'Mariana López', 
  '+52 999 123 9988', 
  'Volkswagen Jetta 2019', 
  62000, 
  'Revisión de ruidos extraños en suspensión delantera', 
  'En revisión', 
  '[{"id": "d-2", "x": 75.2, "y": 18.0, "tipo": "Abolladura en salpicadera der."}]'::jsonb
)
ON CONFLICT DO NOTHING;
