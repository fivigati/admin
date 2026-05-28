// --- INISIALISASI ---
const dateFilter = document.getElementById('dateFilter');
if (dateFilter) {
  dateFilter.value = new Date().toISOString().split('T')[0];
  dateFilter.addEventListener('change', () => {
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
    // Tambahkan data-class dan data-room agar universalFilter bisa mendeteksi kelas/ruang
    table.innerHTML += `
      <tr class="hover:bg-slate-50 transition-all border-b border-slate-100" 
          data-class="${v.student_class}" 
          data-room="${v.student_room}">
        <td class="px-6 py-4 text-xs text-slate-500">${formatDate(v.timestamp || v.created_at)}</td>
        <td class="px-6 py-4">
          <p class="text-sm font-semibold text-slate-800">${v.student_name}</p>
          <p class="text-xs text-slate-400">${v.student_class} • ${v.student_room}</p>
        </td>
        <td class="px-6 py-4 text-sm text-slate-600">${v.subject_name || v.exam_id || '-'}</td>
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
universalFilter();
}

// --- FUNGSI PENDUKUNG ---
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function deleteViolation(id) {
  if (!confirm('Hapus log?')) return;
  const user = JSON.parse(localStorage.getItem('smart_exam_user'));
  await apiRequest({ action: 'deleteViolation', id, school_npsn: user.school_npsn });
  loadViolations(true);
}

async function deleteAllViolations() {
  if (!confirm('Hapus semua?')) return;
  const user = JSON.parse(localStorage.getItem('smart_exam_user'));
  await apiRequest({ action: 'deleteAllViolations', school_npsn: user.school_npsn });
  loadViolations(true);
}

// --- FUNGSI PRINT FINAL ---
async function printViolations() {
  const user = JSON.parse(localStorage.getItem('smart_exam_user'));
  const res = await apiRequest({ action: 'getSchoolConfig', school_npsn: user.school_npsn });

  const sc = res.data && res.data.school ? res.data.school : (res.data || res); 

  if (!sc || !sc.school_name) {
    console.error("Struktur data sekolah yang diterima:", res);
    alert("Data sekolah gagal dimuat. Cek console untuk detail.");
    return;
  }
  
  const kotaSekolah = sc.city || "Malang";
  const tglTerpilih = dateFilter ? dateFilter.value : new Date().toLocaleDateString();
  const rows = document.querySelectorAll("#violationsTable tr");
  
  let tableContent = "";
  rows.forEach(row => {
    if(row.style.display !== 'none') {
      const cols = row.querySelectorAll("td");
      if(cols.length >= 4) {
        tableContent += `<tr><td style="border:1px solid black; text-align:center;">${cols[0].innerText}</td><td style="border:1px solid black;">${cols[1].innerText}</td><td style="border:1px solid black; text-align:center;">${cols[2].innerText}</td><td style="border:1px solid black;">${cols[3].innerText}</td></tr>`;
      }
    }
  });

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Berita Acara - ${sc.school_name}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: "Times New Roman", serif; color: black; line-height: 1.2; }
          .kop-container { display: flex; align-items: center; border-bottom: 4px double black; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }
          .logo { width: 80px; margin-right: 15px; }
          .kop-text { flex-grow: 1; text-align: center; }
          .kop-text h2 { margin: 0; font-size: 12pt; }
          .kop-text h1 { margin: 0; font-size: 16pt; font-weight: bold; }
          .title { text-align: center; font-weight: bold; text-decoration: underline; margin: 20px 0; font-size: 14pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid black; padding: 8px; font-size: 10pt; }
          .footer { margin-top: 40px; float: right; width: 300px; text-align: center; }
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
        <div class="footer">
          <p>${kotaSekolah}, ........................... 20....</p>
          <p>Pengawas Ujian,</p><br><br><br>
          <p><b>( ........................................... )</b></p>
        </div>
        <script>window.onload = function() { window.print(); window.close(); }<\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// Fungsi untuk update filter dropdown secara otomatis
function updateFilters(data) {
  const classSet = new Set(data.map(item => item.student_class));
  const roomSet = new Set(data.map(item => item.student_room));

  const classFilter = document.getElementById('filterClass');
  const roomFilter = document.getElementById('filterRoom');

  // Reset & isi ulang dropdown
  classFilter.innerHTML = '<option value="">Semua Kelas</option>';
  classSet.forEach(c => classFilter.innerHTML += `<option value="${c}">${c}</option>`);

  roomFilter.innerHTML = '<option value="">Semua Ruang</option>';
  roomSet.forEach(r => roomFilter.innerHTML += `<option value="${r}">${r}</option>`);
}

function universalFilter() {
  const searchTerm = document.getElementById('searchUniversal').value.toLowerCase();
  const rows = document.querySelectorAll('#violationsTable tr');
  rows.forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(searchTerm) ? '' : 'none';
  });
}

// --- INTERVAL ---
loadViolations(true);
setInterval(() => {
  const searchInput = document.getElementById('searchUniversal');
  if (!searchInput || searchInput.value === "") loadViolations(false);
}, 5000);
