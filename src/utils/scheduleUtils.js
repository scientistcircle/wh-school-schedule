// Menggabungkan baris pelajaran yang identik (Kelas Gabungan) menjadi 1 baris.
export function groupLessons(lessons) {
  const groups = new Map();
  
  for (const l of lessons) {
    // Kunci gabungan: Sesi + Guru + Mapel + Ruang + Status Batal
    const key = [
      l.period?.id || l.lesson_period_id,
      l.teacher?.id || l.teacher_id,
      l.subject?.id || l.subject_id,
      l.room?.id || l.room_id,
      l.is_cancelled ? '1' : '0'
    ].join('|');

    if (!groups.has(key)) {
      groups.set(key, {
        ...l,
        classNames: [l.class?.name].filter(Boolean),
        classIds: [l.class?.id].filter(Boolean),
      });
    } else {
      const g = groups.get(key);
      if (l.class?.name) g.classNames.push(l.class.name);
      if (l.class?.id) g.classIds.push(l.class.id);
    }
  }

  return Array.from(groups.values()).map(g => ({
    ...g,
    // Gabungkan nama kelas: "X1, X2, X3"
    classNameDisplay: g.classNames.sort().join(', '),
    // Ambil ID kelas pertama untuk link
    primaryClassId: g.classIds[0]
  }));
}