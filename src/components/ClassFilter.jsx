import { useMemo } from 'react';
import SearchableSelect from './SearchableSelect.jsx';

export default function ClassFilter({ classes, value, onChange }) {
  const options = useMemo(
    () =>
      classes.map((c) => ({
        value: c.id,
        label: c.name,
        sublabel: c.grade_level ? `Tingkat ${c.grade_level}` : undefined,
      })),
    [classes]
  );

  return (
    <div className="class-filter">
      <SearchableSelect
        value={value ?? ''}
        onChange={(v) => onChange(v || null)}
        options={options}
        placeholder="— Semua kelas —"
        searchPlaceholder="Cari kelas…"
      />
    </div>
  );
}