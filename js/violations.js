// --- INISIALISASI ---
const dateFilter = document.getElementById('dateFilter');
if (dateFilter) {
  dateFilter.value = new Date().toISOString().split('T')[0];
  dateFilter.addEventListener('change', () => {
    // Saat ganti tanggal, panggil loadViolations (dengan loading)
    loadViolations(true); 
  });
}
// --- 2. FUNGSI UTAMA ---
async function loadViolations(showLoading = false) {
  const user = JSON.parse(localStorage.getItem('smart_exam_user'));
  if (!user) { window.location.href = 'index.html'; return; }

  const table = document.getElementById('violationsTable');
  if (!table) return;

  // Tampilkan loading HANYA JIKA showLoading bernilai true
  if (showLoading) {
    table.innerHTML = `<tr><td colspan="5" class="py-16 text-center"><div class="flex flex-col items-center justify-center text-slate-400 animate-pulse"><i data-lucide="loader-circle" class="w-10 h-10 mb-2 animate-spin text-indigo-500"></i><p class="text-sm font-medium">Sedang memuat data...</p></div></td></tr>`;
    lucide.createIcons();
  }

  // 1. CEK PLAN: TAMPILKAN BANNER JIKA BUKAN PREMIUM
  if (user.plan_type && user.plan_type.toLowerCase().trim() !== 'premium') {
    table.innerHTML = `
      <tr>
        <td colspan="5" class="py-16 text-center">
          <div class="flex flex-col items-center justify-center p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl mx-4">
            <div class="text-5xl mb-3">🔒</div>
            <h3 class="text-lg font-bold text-slate-800">Fitur Premium Terkunci</h3>
            <p class="text-sm text-slate-500 max-w-sm mt-2">
              Log dan riwayat pelanggaran hanya tersedia untuk akun Pro. Silakan upgrade untuk membuka akses.
            </p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

 // --- AMBIL TANGGAL DENGAN AMAN ---
  const selectedDate = dateFilter ? dateFilter.value : new Date().toISOString().split('T')[0];

  // --- FETCH DATA ---
  const result = await apiRequest({ 
    action: 'getViolations', 
    school_npsn: user.school_npsn,
    date: selectedDate 
  });

  if (!result.success) return;

  table.innerHTML = '';

  // --- JIKA DATA KOSONG ---
  if (!result.data || result.data.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="5" class="py-16 text-center text-slate-400">
          <i data-lucide="shield-check" class="w-12 h-12 mx-auto mb-3 text-emerald-200"></i>
          <p class="text-sm font-semibold text-slate-600">Tidak ada pelanggaran pada tanggal ${selectedDate}</p>
          <p class="text-xs mt-1">Siswa terpantau aman dan tertib.</p>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  // --- RENDER DATA ---
  result.data.forEach(v => {
    table.innerHTML += `
      <tr class="hover:bg-slate-50 transition-all border-b border-slate-100">
        <td class="px-6 py-4 text-xs text-slate-500">${formatDate(v.timestamp || v.created_at)}</td>
        <td class="px-6 py-4">
          <p class="text-sm font-semibold text-slate-800">${v.student_name}</p>
          <p class="text-xs text-slate-400">${v.student_class} • ${v.student_room}</p>
        </td>
        <td class="px-6 py-4 text-sm text-slate-600">${v.subject_name || '-'}</td>
        <td class="px-6 py-4">
          <span class="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">${v.violation_type}</span>
        </td>
        <td class="px-6 py-4 text-center">
          <button onclick="deleteViolation('${v.id}')" class="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">Hapus</button>
        </td>
      </tr>
    `;
  });
  lucide.createIcons();
}

// --- FUNGSI PENDUKUNG ---
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function deleteViolation(id) {
  if (!confirm('Hapus log pelanggaran ini?')) return;
  const user = JSON.parse(localStorage.getItem('smart_exam_user'));
  const result = await apiRequest({ action: 'deleteViolation', id, school_npsn: user.school_npsn });
  alert(result.message);
  loadViolations(true); // Refresh
}
async function deleteAllViolations() {
  if (!confirm('Hapus semua data pelanggaran?')) return;
  const user = JSON.parse(localStorage.getItem('smart_exam_user'));
  const result = await apiRequest({ action: 'deleteAllViolations', school_npsn: user.school_npsn });
  alert(result.message);
  loadViolations(true);
}

async function printViolations() {
  const user = JSON.parse(localStorage.getItem('smart_exam_user'));
  
  // 1. Ambil data sekolah terbaru dari backend
  const res = await apiRequest({ action: 'getSchoolConfig', school_npsn: user.school_npsn });
  const sc = res.data; // Data sekolah dari sheet schools

  const datePicker = document.getElementById("dateFilter");
  const tglTerpilih = datePicker ? datePicker.value : new Date().toLocaleDateString();
  const rows = document.querySelectorAll("#violationsTable tr");
  
  let tableContent = "";
  rows.forEach(row => {
    const cols = row.querySelectorAll("td");
    if(cols.length === 5) {
      tableContent += `<tr>
        <td style="padding: 8px; border: 1px solid black; text-align: center;">${cols[0].innerText}</td>
        <td style="padding: 8px; border: 1px solid black;">${cols[1].innerText}</td>
        <td style="padding: 8px; border: 1px solid black; text-align: center;">${cols[2].innerText}</td>
        <td style="padding: 8px; border: 1px solid black;">${cols[3].innerText}</td>
      </tr>`;
    }
  });

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Berita Acara - ${sc.school_name}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: "Times New Roman", serif; color: black; }
          .kop-container { display: flex; align-items: center; border-bottom: 4px double black; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }
          .logo { width: 80px; margin-right: 15px; }
          .kop-text { flex-grow: 1; text-align: center; }
          .kop-text h2 { margin: 0; font-size: 12pt; }
          .kop-text h1 { margin: 0; font-size: 16pt; font-weight: bold; }
          .title { text-align: center; font-weight: bold; text-decoration: underline; margin: 20px 0; font-size: 14pt; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid black; padding: 8px; }
        </style>
      </head>
      <body>
        <div class="kop-container">
          <img src="${sc.logo_url}" class="logo">
          <div class="kop-text">
            <h2>${sc.education_department.toUpperCase()}</h2>
            <h1>${sc.school_name.toUpperCase()}</h1>
            <p>${sc.address}</p>
          </div>
        </div>
        <div class="title">BERITA ACARA LAPORAN PELANGGARAN UJIAN</div>
        <p>Pada hari ini, tanggal <b>${tglTerpilih}</b>, dilaporkan pelanggaran sebagai berikut:</p>
        <table>
          <thead>
            <tr><th>Waktu</th><th>Identitas Siswa</th><th>Mapel</th><th>Keterangan</th></tr>
          </thead>
          <tbody>${tableContent}</tbody>
        </table>
        <div style="margin-top:50px; text-align:right;">
          <p>${kotaSekolah}, ${new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
          <p>Pengawas Ujian,</p><br><br><br>
          <p><b>( ____________________ )</b></p>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// --- INISIALISASI ---
loadViolations(true);
setInterval(() => loadViolations(false), 5000);
