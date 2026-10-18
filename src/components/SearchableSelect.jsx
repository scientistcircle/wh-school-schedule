import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export default function SearchableSelect({
  value, onChange, options, placeholder = '— Pilih —', searchPlaceholder = 'Cari…',
  emptyMessage = 'Tidak ada hasil', disabled = false, required = false,
  clearable = true, autoFocus = false, id,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [coords, setCoords] = useState(null);
  
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => (o.label + ' ' + (o.sublabel ?? '')).toLowerCase().includes(q));
  }, [options, query]);

  // Hitung posisi menu dropdown agar tidak terpotong tabel
  useEffect(() => {
    if (open && triggerRef.current) {
      const updateCoords = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      };
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
      return () => {
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', updateCoords, true);
      };
    } else {
      setCoords(null);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setHighlight(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => { setHighlight(0); }, [query]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (rootRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function onEsc(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${highlight}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlight, open, filtered.length]);

  function pick(opt) { onChange(opt.value); setOpen(false); }

  function onKeyDown(e) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault(); setOpen(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); const opt = filtered[highlight]; if (opt) pick(opt); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'Tab') { setOpen(false); }
  }

  function clear(e) { e.stopPropagation(); onChange(''); }

  return (
    <div className={`ss ${open ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''}`} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className="ss__trigger"
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
      >
        {selected ? (
          <span className="ss__value">
            <span className="ss__label">{selected.label}</span>
            {selected.sublabel && <span className="ss__sublabel">{selected.sublabel}</span>}
          </span>
        ) : (
          <span className="ss__placeholder">{placeholder}</span>
        )}
        <span className="ss__icons">
          {clearable && value && !disabled && (
            <span className="ss__clear" role="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={clear} aria-label="Kosongkan">
              <X size={13} strokeWidth={2.25} />
            </span>
          )}
          <ChevronDown size={15} strokeWidth={2.25} className="ss__chevron" />
        </span>
      </button>

      {/* RENDER MENU MENGGUNAKAN PORTAL AGAR TIDAK TERPOTONG TABEL */}
      {open && coords && createPortal(
        <div 
          ref={menuRef} 
          className="ss__menu" 
          role="listbox"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: coords.width,
            zIndex: 99999
          }}
        >
          <div className="ss__search">
            <Search size={14} strokeWidth={2.25} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              autoComplete="off"
            />
            {query && (
              <button type="button" className="ss__search-clear" onClick={() => setQuery('')} aria-label="Bersihkan">
                <X size={12} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div className="ss__list" ref={listRef}>
            {filtered.length === 0 ? (
              <div className="ss__empty">{emptyMessage}</div>
            ) : (
              filtered.map((opt, i) => {
                const isSelected = opt.value === value;
                const isHl = i === highlight;
                return (
                  <button
                    key={opt.value || `__empty_${i}`}
                    type="button"
                    data-index={i}
                    role="option"
                    aria-selected={isSelected}
                    className={'ss__option' + (isSelected ? ' is-selected' : '') + (isHl ? ' is-highlight' : '')}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => pick(opt)}
                  >
                    <span className="ss__option-text">
                      <span className="ss__option-label">{opt.label}</span>
                      {opt.sublabel && <span className="ss__option-sublabel">{opt.sublabel}</span>}
                    </span>
                    {isSelected && <Check size={14} strokeWidth={2.5} />}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}