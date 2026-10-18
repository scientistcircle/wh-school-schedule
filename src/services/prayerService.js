// Menggunakan API Aladhan dengan metode Kemenag RI (method=20)
// Default kota diset ke Jakarta, Anda bisa mengubahnya nanti (misal: "Jombang", "Kediri", dll)

export async function getPrayerTimes(city = 'Jakarta', country = 'Indonesia') {
  const url = `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=20`;
  
  try {
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.code === 200) {
      const t = result.data.timings;
      // Membersihkan format waktu (terkadang API mengembalikan "04:30 (WIB)")
      const cleanTime = (timeStr) => timeStr.split(' ')[0];
      
      return {
        data: {
          imsak: cleanTime(t.Imsak),
          subuh: cleanTime(t.Fajr),
          terbit: cleanTime(t.Sunrise),
          dzuhur: cleanTime(t.Dhuhr),
          ashar: cleanTime(t.Asr),
          maghrib: cleanTime(t.Maghrib),
          isya: cleanTime(t.Isha),
        },
        error: null
      };
    }
    return { data: null, error: new Error('Gagal mengambil jadwal sholat.') };
  } catch (error) {
    return { data: null, error };
  }
}