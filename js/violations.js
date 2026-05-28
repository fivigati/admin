async function loadViolations() {
  const user = JSON.parse(localStorage.getItem('smart_exam_user'));
  if (!user) { window.location.href = 'index.html'; return; }

  // --- CEK PLAN: TAMPILKAN BANNER JIKA BUKAN PREMIUM ---
  if (user.plan_type && user.plan_type.toLowerCase() !== 'premium') {
    const table = document.getElementById('violationsTable');
    if (table) {
      table.innerHTML = `
        <tr>
          <td colspan="7" class="py-12">
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
    }
    return; // Hentikan fungsi agar tidak memanggil API
  }

  const result = await apiRequest({ action: 'getViolations', school_npsn: user.school_npsn });
  if (!result.success) return;

  const table = document.getElementById('violationsTable');
  table.innerHTML = '';

  result.data.forEach(v => {
    table.innerHTML += `
      <tr class="hover:bg-slate-50 transition-all">
        <td class="px-5 py-4 text-xs text-slate-500">${formatDate(v.timestamp)}</td>
        <td class="px-5 py-4">
          <p class="text-sm font-semibold text-slate-800">${v.student_name}</p>
          <p class="text-xs text-slate-400">${v.student_class} • ${v.student_room}</p>
        </td>
        <td class="px-5 py-4 text-sm text-slate-600">${v.subject_name || '-'}</td>
        <td class="px-5 py-4">
          <span class="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">${v.violation_type}</span>
        </td>
        <td class="px-5 py-4 text-center">
          <button onclick="deleteViolation('${v.id}')" class="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">Hapus</button>
        </td>
      </tr>
    `;
  });
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

// Tambahkan ini di bagian paling bawah file js/violations.js
loadViolations();

// Jika Ibu ingin halaman pelanggaran juga ter-update otomatis seperti Live Session:
setInterval(() => {
  loadViolations();
}, 5000);
