# WH School Schedule

**School Timetable & Daily Information** — sistem informasi jadwal sekolah digital untuk lingkungan pondok pesantren.

Menggantikan penyebaran jadwal harian melalui WhatsApp: admin memperbarui jadwal di dashboard, santri melihat versi terbaru melalui browser. Perubahan disiarkan realtime tanpa refresh.

---

## 1. Persyaratan

- **Node.js 18** atau lebih baru
- **npm 9** atau lebih baru
- Akun **Supabase** gratis
- Akun **Cloudflare** gratis — untuk deployment
- Akun **GitHub** gratis
- Editor: **VS Code** direkomendasikan

Cek versi: `node -v` dan `npm -v`

---

## 2. Menjalankan di Laptop

```bash
git clone <url-repo>
cd wh-school-schedule
npm install
cp .env.example .env.local     # Windows: copy .env.example .env.local
# Isi .env.local dengan kredensial Supabase (lihat bagian 6)
npm run dev