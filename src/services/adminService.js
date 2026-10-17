import { supabase } from './supabaseClient.js';
import { addDaysToDateString } from '../utils/jakartaTime.js';

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
  const { data: newDay, error: dayErr } = await supabase
    .from('school_days')
    .insert({ schedule_date: dateString, status: 'draft', notes })
    .select()
    .single();

  if (dayErr) return { data: null, error: dayErr };

  const [y, m, d] = dateString.split('-').map(Number);
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();

  let defaultPeriods = [];

  if (dayOfWeek >= 1 && dayOfWeek <= 4) {
    defaultPeriods = [
      { period_code: 'KBM1', period_name: 'KBM 1', start_time: '08:00:00', end_time: '09:40:00', display_order: 1 },
      { period_code: 'KBM2', period_name: 'KBM 2', start_time: '10:00:00', end_time: '11:40:00', display_order: 2 },
      { period_code: 'KBM3', period_name: 'KBM 3', start_time: '12:45:00', end_time: '13:45:00', display_order: 3 },
    ];
  } else if (dayOfWeek === 5) {
    defaultPeriods = [
      { period_code: 'KBM1', period_name: 'KBM 1', start_time: '08:00:00', end_time: '09:00:00', display_order: 1 },
      { period_code: 'KBM2', period_name: 'KBM 2', start_time: '09:20:00', end_time: '11:00:00', display_order: 2 },
    ];
  } else if (dayOfWeek === 6) {
    defaultPeriods = [
      { period_code: 'KBM1', period_name: 'KBM 1', start_time: '08:00:00', end_time: '09:00:00', display_order: 1 },
      { period_code: 'KBM2', period_name: 'KBM 2', start_time: '10:00:00', end_time: '10:50:00', display_order: 2 },
      { period_code: 'KBM3', period_name: 'KBM 3', start_time: '10:50:00', end_time: '11:40:00', display_order: 3 },
    ];
  }

  if (defaultPeriods.length > 0) {
    const periodsPayload = defaultPeriods.map(p => ({
      ...p,
      school_day_id: newDay.id
    }));

    const { error: periodErr } = await supabase
      .from('lesson_periods')
      .insert(periodsPayload);

    if (periodErr) {
      console.error('Gagal membuat sesi default:', periodErr);
      return { data: newDay, error: periodErr };
    }
  }

  return { data: newDay, error: null };
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

export async function copyDayToDate(sourceDayId, targetDate) {
  const { data: newDay, error: dayErr } = await supabase
    .from('school_days')
    .insert({ schedule_date: targetDate, status: 'draft',
              notes: 'Disalin dari jadwal sebelumnya.' })
    .select().single();
  if (dayErr) return { error: dayErr };

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

// FITUR BARU: SALIN 1 MINGGU PENUH
export async function copyWeekToWeek(sourceStartDate, targetStartDate) {
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (let i = 0; i < 6; i++) {
    const sourceDate = addDaysToDateString(sourceStartDate, i);
    const targetDate = addDaysToDateString(targetStartDate, i);

    const { data: sourceDay } = await getSchoolDayByDate(sourceDate);
    if (!sourceDay) {
      skippedCount++;
      continue; 
    }

    const { data: targetDay } = await getSchoolDayByDate(targetDate);
    if (targetDay) {
      skippedCount++; 
      continue; 
    }

    const { error } = await copyDayToDate(sourceDay.id, targetDate);
    if (error) {
      failCount++;
      errors.push(`${targetDate}: ${error.message}`);
    } else {
      successCount++;
    }
  }

  return { successCount, failCount, skippedCount, errors };
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
// LESSONS
// =====================================================================

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

export async function bulkUpsertLessons(dayId, periodId, rows) {
  const payload = rows.map((r) => ({
    school_day_id: dayId,
    lesson_period_id: periodId,
    class_id: r.class_id,
    teacher_id: r.teacher_id,
    subject_id: r.subject_id,
    room_id: r.room_id,
    substitute_teacher_id: r.substitute_teacher_id ?? null,
    substitute_teacher_name: r.substitute_teacher_name ?? null,
    notes: r.notes ?? null,
    is_cancelled: r.is_cancelled ?? false,
  }));

  if (payload.length === 0) return { data: [], error: null };

  const { data, error } = await supabase
    .from('lessons')
    .upsert(payload, { onConflict: 'lesson_period_id,class_id' })
    .select();

  return { data: data ?? [], error };
}

// =====================================================================
// USER & ADMIN MANAGEMENT
// =====================================================================

export async function fetchAllUsers() {
  const { data, error } = await supabase.rpc('get_all_users');
  return { data: data ?? [], error };
}

export async function createNewAdmin(email, password, displayName) {
  const { data, error } = await supabase.rpc('admin_create_user', {
    user_email: email,
    user_password: password,
    user_display_name: displayName
  });
  return { data, error };
}

export async function updateUserRole(userId, newRole) {
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);
  return { error };
}

export async function deleteAdminUser(userId) {
  const { error } = await supabase.rpc('admin_delete_user', { 
    target_user_id: userId 
  });
  return { error };
}