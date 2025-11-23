import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL e Anon Key são obrigatórias');
}

// Cliente para uso geral (frontend)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Cliente para operações administrativas (backend)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

export default supabase;