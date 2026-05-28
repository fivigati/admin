async function loadViolations() {
  const user = JSON.parse(localStorage.getItem('smart_exam_user'));
  if (!user) { window.location.href = 'index.html'; return; }

  const table = document.getElementById('violationsTable');
  if (!table) return;

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

  // 2. JIKA PREMIUM: LOAD DATA
  const result = await apiRequest({ action: 'getViolations', school_npsn: user.school_npsn });
  if (!result.success) return;

  table.innerHTML = '';

  // 3. JIKA DATA KOSONG
  if (!result.data || result.data.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="5" class="py-16 text-center text-slate-400">
          <i data-lucide="shield-check" class="w-12 h-12 mx-auto mb-3 text-emerald-200"></i>
          <p class="text-sm font-semibold text-slate-600">Tidak ada pelanggaran hari ini</p>
          <p class="text-xs mt-1">Siswa terpantau aman dan tertib.</p>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  // 4. JIKA ADA DATA
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
// 2. FETCH DATA DENGAN FILTER TANGGAL
  const result = await apiRequest({ 
    action: 'getViolations', 
    school_npsn: user.school_npsn,
    date: selectedDate // Kirim tanggal ke backend
  });

  if (!result.success) return;

  const table = document.getElementById('violationsTable');
  table.innerHTML = '';

  // 3. JIKA DATA KOSONG
  if (!result.data || result.data.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="5" class="py-16 text-center text-slate-400">
          <p class="text-sm">Tidak ada pelanggaran pada tanggal ${selectedDate}</p>
        </td>
      </tr>
    `;
    return;
  }
// FUNGSI PENDUKUNG (TETAP SAMA)
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function deleteViolation(id) {
  if (!confirm('Hapus log pelanggaran ini?')) return;
  const user = JSON.parse(localStorage.getItem('smart_exam_user'));
  const result = await apiRequest({ action: 'deleteViolation', id, school_npsn: user.school_npsn });
  alert(result.message);
  loadViolations();
}

async function deleteAllViolations() {
  if (!confirm('Hapus semua data pelanggaran?')) return;
  const user = JSON.parse(localStorage.getItem('smart_exam_user'));
  const result = await apiRequest({ action: 'deleteAllViolations', school_npsn: user.school_npsn });
  alert(result.message);
  loadViolations();
}

function printViolations() { window.print(); }

// Tambahkan ini di bagian bawah file untuk mendeteksi perubahan tanggal
document.getElementById('dateFilter').addEventListener('change', loadViolations);

// Set default tanggal hari ini saat halaman dimuat
document.getElementById('dateFilter').value = new Date().toISOString().split('T')[0];

loadViolations();
setInterval(loadViolations, 5000);
