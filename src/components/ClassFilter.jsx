import { useEffect, useMemo, useState } from 'react';

// Dropdown + search untuk memilih kelas di halaman per-sesi.
export default function ClassFilter({ classes, value, onChange }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query) return classes;
    const q = query.toLowerCase();
    return classes.filter((c) => c.name.toLowerCase().includes(q));
  }, [classes, query]);

  useEffect(() => {
    // Kalau kelas terpilih hilang dari hasil filter, jangan paksa reset.
    // Pengguna tetap bisa melihat kelas terpilih di dropdown.
  }, [filtered, value]);

  return (
    <div className="class-filter">
      <input
        type="search"
        className="class-filter__search"
        placeholder="Cari kelas…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        className="class-filter__select"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">— Semua kelas —</option>
        {filtered.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}