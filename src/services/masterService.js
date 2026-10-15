import { supabase } from './supabaseClient.js';

export async function getActiveClasses() {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, grade_level, display_order')
    .eq('is_active', true)
    .order('display_order');
  return { data: data ?? [], error };
}

export async function getClassById(id) {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, grade_level, display_order')
    .eq('id', id)
    .maybeSingle();
  return { data, error };
}