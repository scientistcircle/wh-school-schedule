import { supabase } from './supabaseClient.js';

// =====================================================================
// MASTER DATA (classes, teachers, subjects, rooms)
// =====================================================================

export async function listMaster(table) {
  const { data, error } = await supabase.from(table).select('*').order('name');
  return { data: data ?? [], error };
}

export async function listActiveMaster(table) {
  const { data, error } = await supabase
    .from(table).select('*').eq('is_active', true).order('name');
  return { data: data ?? [], error };
}

export async function createMaster(table, payload) {
  const { data, error } = await supabase
    .from(table).insert(payload).select().single();
  return { data, error };
}

export async function updateMaster(table, id, payload) {
  const { data, error } = await supabase
    .from(table).update(payload).eq('id', id).select().single();
  return { data, error };
}

export async function deleteMaster(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  return { error };
}

// =====================================================================
// SCHOOL DAYS
// =====================================================================

export async function listSchoolDays({ limit = 100 } = {}) {
  const { data, error } = await supabase
    .from('school_days')
    .select('id, schedule_date, status, published_at, updated_at, notes')
    .order('schedule_date', { ascending: false })
    .limit(limit);
  return { data: data ?? [], error };
}

export async function getSchoolDayByDate(dateString) {
  const { data, error } = await supabase
    .from('school_days')
    .select('*')
    .eq('schedule_date', dateString)
    .maybeSingle();
  return { data, error };
}

export async function createSchoolDay(dateString, notes = null) {
  const { data, error } = await supabase
    .from('school_days')
    .insert({ schedule_date: dateString, status: 'draft', notes })
    .select()
    .single();
  return { data, error };
}

export async function updateSchoolDayMeta(id, payload) {
  const { data, error } = await supabase
    .from('school_days').update(payload).eq('id', id).select().single();
  return { data, error };
}

export async function setSchoolDayStatus(id, status) {
  const patch = {
    status,
    published_at: status === 'published' ? new Date().toISOString() : null,
  };
  const { data, error } = await supabase
    .from('school_days').update(patch).eq('id', id).select().single();
  return { data, error };
}

export async function deleteSchoolDay(id) {
  const { error } = await supabase.from('school_days').delete().eq('id', id);
  return { error };
}

// Salin seluruh isi hari ke tanggal baru (kecuali guru piket).
export async function copyDayToDate(sourceDayId, targetDate) {
  // 1. Buat hari baru
  const { data: newDay, error: dayErr } = await supabase
    .from('school_days')
    .insert({ schedule_date: targetDate, status: 'draft',
              notes: 'Disalin dari jadwal sebelumnya.' })
    .select().single();
  if (dayErr) return { error: dayErr };

  // 2. Copy activities
  const { data: acts, error: actsErr } = await supabase
    .from('daily_activities')
    .select('activity_name, activity_code, start_time, end_time, display_order')
    .eq('school_day_id', sourceDayId);
  if (actsErr) return { error: actsErr };
  if (acts.length) {
    const { error } = await supabase.from('daily_activities')
      .insert(acts.map((a) => ({ ...a, school_day_id: newDay.id })));
    if (error) return { error };
  }

  // 3. Copy periods
  const { data: periods, error: perErr } = await supabase
    .from('lesson_periods')
    .select('id, period_code, period_name, start_time, end_time, display_order')
    .eq('school_day_id', sourceDayId);
  if (perErr) return { error: perErr };
  if (periods.length) {
    const { error } = await supabase.from('lesson_periods')
      .insert(periods.map((p) => ({
        school_day_id: newDay.id,
        period_code: p.period_code,
        period_name: p.period_name,
        start_time: p.start_time,
        end_time: p.end_time,
        display_order: p.display_order,
      })));
    if (error) return { error };
  }

  // 4. Copy lessons — perlu re-map lesson_period_id
  const { data: newPeriods, error: npErr } = await supabase
    .from('lesson_periods')
    .select('id, period_code')
    .eq('school_day_id', newDay.id);
  if (npErr) return { error: npErr };

  const codeToNewId = new Map(newPeriods.map((p) => [p.period_code, p.id]));
  const codeToOldId = new Map(periods.map((p) => [p.period_code, p.id]));

  const { data: lessons, error: lesErr } = await supabase
    .from('lessons')
    .select(`
      lesson_period_id, class_id, teacher_id, subject_id, room_id,
      substitute_teacher_id, substitute_teacher_name, notes, is_cancelled
    `)
    .eq('school_day_id', sourceDayId);
  if (lesErr) return { error: lesErr };

  if (lessons.length) {
    const oldIdToCode = new Map(
      [...codeToOldId.entries()].map(([code, id]) => [id, code])
    );
    const payload = lessons
      .map((l) => {
        const code = oldIdToCode.get(l.lesson_period_id);
        const newPeriodId = code ? codeToNewId.get(code) : null;
        if (!newPeriodId) return null;
        return {
          school_day_id: newDay.id,
          lesson_period_id: newPeriodId,
          class_id: l.class_id,
          teacher_id: l.teacher_id,
          subject_id: l.subject_id,
          room_id: l.room_id,
          substitute_teacher_id: l.substitute_teacher_id,
          substitute_teacher_name: l.substitute_teacher_name,
          notes: l.notes,
          is_cancelled: l.is_cancelled,
        };
      })
      .filter(Boolean);

    if (payload.length) {
      const { error } = await supabase.from('lessons').insert(payload);
      if (error) return { error };
    }
  }

  return { data: newDay, error: null };
}

// =====================================================================
// DAILY ACTIVITIES
// =====================================================================

export async function listActivities(dayId) {
  const { data, error } = await supabase
    .from('daily_activities')
    .select('*')
    .eq('school_day_id', dayId)
    .order('display_order');
  return { data: data ?? [], error };
}

export async function createActivity(dayId, payload) {
  const { data, error } = await supabase
    .from('daily_activities')
    .insert({ ...payload, school_day_id: dayId })
    .select().single();
  return { data, error };
}

export async function updateActivity(id, payload) {
  const { data, error } = await supabase
    .from('daily_activities').update(payload).eq('id', id).select().single();
  return { data, error };
}

export async function deleteActivity(id) {
  const { error } = await supabase.from('daily_activities').delete().eq('id', id);
  return { error };
}

// =====================================================================
// DUTY TEACHERS
// =====================================================================

export async function listDuty(dayId) {
  const { data, error } = await supabase
    .from('duty_teachers')
    .select('id, display_order, teacher:teacher_id(id, name)')
    .eq('school_day_id', dayId)
    .order('display_order');
  return { data: data ?? [], error };
}

export async function addDuty(dayId, teacherId, displayOrder = 0) {
  const { data, error } = await supabase
    .from('duty_teachers')
    .insert({ school_day_id: dayId, teacher_id: teacherId, display_order: displayOrder })
    .select().single();
  return { data, error };
}

export async function removeDuty(id) {
  const { error } = await supabase.from('duty_teachers').delete().eq('id', id);
  return { error };
}

// =====================================================================
// LESSON PERIODS
// =====================================================================

export async function listPeriods(dayId) {
  const { data, error } = await supabase
    .from('lesson_periods')
    .select('*')
    .eq('school_day_id', dayId)
    .order('display_order');
  return { data: data ?? [], error };
}

export async function createPeriod(dayId, payload) {
  const { data, error } = await supabase
    .from('lesson_periods')
    .insert({ ...payload, school_day_id: dayId })
    .select().single();
  return { data, error };
}

export async function updatePeriod(id, payload) {
  const { data, error } = await supabase
    .from('lesson_periods').update(payload).eq('id', id).select().single();
  return { data, error };
}

export async function deletePeriod(id) {
  const { error } = await supabase.from('lesson_periods').delete().eq('id', id);
  return { error };
}

// =====================================================================
// LESSONS (dipakai di Tahap 5B-2, untuk sekarang hanya baca)
// =====================================================================
export async function createLesson(payload) {
  const { data, error } = await supabase
    .from('lessons').insert(payload).select().single();
  return { data, error };
}

export async function updateLesson(id, payload) {
  const { data, error } = await supabase
    .from('lessons').update(payload).eq('id', id).select().single();
  return { data, error };
}

export async function deleteLesson(id) {
  const { error } = await supabase.from('lessons').delete().eq('id', id);
  return { error };
}

export async function listLessons(dayId) {
  const { data, error } = await supabase
    .from('lessons')
    .select(`
      id, notes, is_cancelled, substitute_teacher_name,
      lesson_period_id, class_id, teacher_id, subject_id, room_id,
      substitute_teacher_id
    `)
    .eq('school_day_id', dayId);
  return { data: data ?? [], error };
}