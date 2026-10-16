import { supabase } from './supabaseClient.js';

// Hapus seluruh master data. Urutan penting: hapus anak dulu (lessons),
// baru induk (teachers, subjects, rooms, classes).
export async function resetAllData() {
  const results = [];

  // 1. Hapus lessons (anak dari periods & master)
  {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .not('id', 'is', null);
    results.push({ step: 'lessons', error });
  }

  // 2. Hapus duty_teachers
  {
    const { error } = await supabase
      .from('duty_teachers')
      .delete()
      .not('id', 'is', null);
    results.push({ step: 'duty_teachers', error });
  }

  // 3. Hapus daily_activities
  {
    const { error } = await supabase
      .from('daily_activities')
      .delete()
      .not('id', 'is', null);
    results.push({ step: 'daily_activities', error });
  }

  // 4. Hapus lesson_periods
  {
    const { error } = await supabase
      .from('lesson_periods')
      .delete()
      .not('id', 'is', null);
    results.push({ step: 'lesson_periods', error });
  }

  // 5. Hapus school_days
  {
    const { error } = await supabase
      .from('school_days')
      .delete()
      .not('id', 'is', null);
    results.push({ step: 'school_days', error });
  }

  // 6. Hapus master data
  for (const table of ['classes', 'teachers', 'subjects', 'rooms']) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null);
    results.push({ step: table, error });
  }

  // 7. Hapus pengumuman
  {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .not('id', 'is', null);
    results.push({ step: 'announcements', error });
  }

  const errors = results.filter((r) => r.error);
  return {
    ok: errors.length === 0,
    errors,
    steps: results,
  };
}

// Hapus hanya salah satu tabel master (untuk reset terpisah).
export async function resetTable(table) {
  const allowed = ['classes', 'teachers', 'subjects', 'rooms', 'announcements'];
  if (!allowed.includes(table)) {
    return { error: new Error(`Tabel ${table} tidak boleh direset sendiri.`) };
  }
  const { error } = await supabase.from(table).delete().not('id', 'is', null);
  return { error };
}