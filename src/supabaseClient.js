import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://necvmvsrpzgnvamraaar.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'PEGA_TU_ANON_KEY_AQUI';

export const supabase = createClient(supabaseUrl, supabaseKey);
