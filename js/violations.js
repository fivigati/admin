async function loadViolations() {
  const user = JSON.parse(localStorage.getItem('smart_exam_user'));

  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  // --- PERBAIKAN LOGIKA BANNER PREMIUM LOCK ---
  // Pastikan isPremium hanya bernilai true jika datanya benar-benar 'premium'
  const isPremium = user.plan_type && user.plan_type.toLowerCase().trim() === 'premium';

  if (!isPremium) {
    const tableContainer = document.getElementById('violationsTable');
    if (tableContainer) {
      tableContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center text-center p-12 mx-auto mt-6 max-w-xl bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
          <div class="text-6xl mb-4">🔒</div>
          <h3 class="text-xl font-black tracking-tight text-slate-800">Fitur Premium Terkunci</h3>
          <p class="text-sm text-slate-500 mt-3 leading-relaxed">
            Log dan riwayat pelanggaran siswa secara detail hanya tersedia untuk akun Pro. Tingkatkan langganan Anda untuk membuka akses penuh.
          </p>
        </div>
      `;
    }
    return; // Hentikan fungsi di sini, jangan panggil API
  }
  // --------------------------------------------

  // JIKA AKUN PREMIUM, LANJUTKAN MEMUAT DATA:
  try {
    const result = await apiRequest({
      action: 'getViolations',
      school_npsn: user.school_npsn
    });

    if (!result.success) return;

    const table = document.getElementById('violationsTable');
    if (!table) return; // Keamanan tambahan

    table.innerHTML = '';

    // Jika tidak ada data pelanggaran
    if (!result.data || result.data.length === 0) {
      table.innerHTML = `
        <div class="flex items-center justify-center p-10 text-slate-500 text-sm font-medium">
          Belum ada data pelanggaran.
        </div>
      `;
      return;
    }

    result.data.forEach(violation => {
      table.innerHTML += `
        <div class="grid grid-cols-5 gap-4 border-b border-slate-100 px-6 py-4 items-center hover:bg-slate-50 transition-all">
          <div class="text-xs text-slate-500">
            ${formatDate(violation.timestamp || violation.created_at)}
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-800">${violation.student_name}</p>
            <p class="text-xs text-slate-400 mt-0.5">${violation.student_class} • ${violation.student_room}</p>
          </div>
          <div class="text-sm font-medium text-slate-600">
            ${violation.subject_name || '-'}
          </div>
          <div>
            <span class="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600 border border-rose-100">
              ${violation.violation_type || 'Keluar Aplikasi'}
            </span>
          </div>
          <div class="text-center">
            <button onclick="deleteViolation('${violation.id}')" class="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-all">
              Hapus
            </button>
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error("Gagal memuat log pelanggaran:", error);
  }
}

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

async function deleteViolation(id) {
  const confirmDelete = confirm('Hapus log pelanggaran ini?');
  if (!confirmDelete) return;

  const user = JSON.parse(localStorage.getItem('smart_exam_user'));
  const result = await apiRequest({
    action: 'deleteViolation',
    id,
    school_npsn: user.school_npsn
  });

  alert(result.message);
  loadViolations();
}

async function deleteAllViolations() {
  const confirmDelete = confirm('Apakah Anda yakin ingin menghapus SEMUA data pelanggaran?');
  if (!confirmDelete) return;

  const user = JSON.parse(localStorage.getItem('smart_exam_user'));
  const result = await apiRequest({
    action: 'deleteAllViolations',
    school_npsn: user.school_npsn
  });

  alert(result.message);
  loadViolations();
}

function printViolations() {
  window.print();
}
