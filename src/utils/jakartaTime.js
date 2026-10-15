import { APP_TIMEZONE, APP_LOCALE } from './constants.js';

const fmtDateLong = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIMEZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const fmtDateShort = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIMEZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const fmtTimeHM = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const fmtDateTime = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIMEZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function toJakartaDateString(input = new Date()) {
  const d = input instanceof Date ? input : new Date(input);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function todayJakarta() {
  return toJakartaDateString(new Date());
}

export function formatDateLong(input) {
  if (!input) return '-';
  return fmtDateLong.format(input instanceof Date ? input : new Date(input));
}

export function formatDateShort(input) {
  if (!input) return '-';
  return fmtDateShort.format(input instanceof Date ? input : new Date(input));
}

export function formatTime(input) {
  if (!input) return '-';
  if (typeof input === 'string' && /^\d{2}:\d{2}/.test(input)) {
    const [h, m] = input.split(':');
    return `${h}.${m}`;
  }
  return fmtTimeHM.format(input instanceof Date ? input : new Date(input));
}

export function formatDateTime(input) {
  if (!input) return '-';
  return fmtDateTime.format(input instanceof Date ? input : new Date(input));
}

export function addDaysToDateString(dateString, days) {
  const [y, m, d] = dateString.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}