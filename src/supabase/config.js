import { createClient } from '@supabase/supabase-js';

// Obtener credenciales de Supabase desde variables de entorno
const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo-project.supabase.co';
// Limpiar cualquier '/rest/v1' o diagonal final que se haya copiado por error
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-anon-key';

// Instancia del cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

