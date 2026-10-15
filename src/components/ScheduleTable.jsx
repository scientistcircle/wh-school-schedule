import { formatTime } from '../utils/jakartaTime.js';

export default function ScheduleTable({ lessons, periods }) {
  // Urutkan lesson sesuai display_order periodnya.
  const periodMap = new Map(periods.map((p) => [p.id, p]));
  const rows = [...lessons].sort((a, b) => {
    const oa = periodMap.get(a.period?.id)?.display_order ?? 0;
    const ob = periodMap.get(b.period?.id)?.display_order ?? 0;
    return oa - ob;
  });

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Sesi</th>
            <th>Waktu</th>
            <th>Kelas</th>
            <th>Guru</th>
            <th>Mata Pelajaran</th>
            <th>Ruang</th>
            <th>Catatan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id} className={l.is_cancelled ? 'is-cancelled' : ''}>
              <td><strong>{l.period?.period_name ?? '-'}</strong></td>
              <td>
                {formatTime(l.period?.start_time)}–{formatTime(l.period?.end_time)}
              </td>
              <td>{l.class?.name ?? '-'}</td>
              <td>
                {l.teacher?.name ?? '-'}
                {(l.substitute_teacher?.name || l.substitute_teacher_name) && (
                  <div className="cell-substitute">
                    Pengganti: {l.substitute_teacher?.name ?? l.substitute_teacher_name}
                  </div>
                )}
              </td>
              <td>{l.subject?.name ?? '-'}</td>
              <td>{l.room?.name ?? '-'}</td>
              <td>
                {l.is_cancelled && <span className="tag tag--danger">Dibatalkan</span>}
                {l.notes && <div className="cell-note">{l.notes}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}