/* =====================================================
   STUDENTS MODULE (MENGGUNAKAN INDEKS STATIS)
   ===================================================== */

// Render Tabel Siswa
function renderTabelSiswa(dataList) {
    const tbody = document.getElementById('siswa-tbody');
    
    if (!dataList || dataList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-slate-400 text-sm">Data siswa tidak ditemukan.</td></tr>`;
        return;
    }

    tbody.innerHTML = dataList.map(s => {
        // Logika Status Badge
        const isActive = s.account_status?.toString().toLowerCase() === 'active';
        
        // Render Status (Jika blokir, tampilkan tombol gembok interaktif)
        let statusHtml = '';
        if (isActive) {
            statusHtml = `
                <div class="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs text-emerald-600 border border-emerald-100">
                    <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Aktif
                </div>
            `;
        } else {
            // Tombol ini jika diklik akan memanggil bukaBlokir()
            statusHtml = `
                <button onclick="bukaBlokir('${s.nisn}', '${s.full_name}')" class="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2.5 py-1 text-xs text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors cursor-pointer shadow-sm" title="Klik untuk mengaktifkan & mereset pelanggaran">
                    <i data-lucide="lock" class="w-3.5 h-3.5"></i> Terblokir
                </button>
            `;
        }

        return `
        <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
            
            <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                        ${s.pic_url ? `<img src="${s.pic_url}" class="w-full h-full object-cover">` : 
                        `<i data-lucide="user" class="w-5 h-5 text-slate-400"></i>`}
                    </div>
                    <span class="text-sm text-slate-700">${s.nisn}</span>
                </div>
            </td>
            
            <td class="px-4 py-3">
                <div class="text-sm text-slate-700">${s.full_name}</div>
                <div class="text-xs text-slate-400 mt-0.5">${s.class_name || '-'} • ${s.room_name || '-'}</div>
            </td>
            
            <td class="px-4 py-3 text-xs text-slate-500">${s.description || '-'}</td>
            
            <td class="px-4 py-3 text-center">
                ${statusHtml}
            </td>
            
            <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="editSiswa('${s.nisn}')" class="p-1.5 rounded-md text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Edit">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                    <button onclick="hapusSiswa('${s.nisn}')" class="p-1.5 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Hapus">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
    
    // Jangan lupa render icon Lucide-nya
    lucide.createIcons();
}

// Ambil Data
async function loadDataSiswa() {
    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    
    // Perbaiki pengecekan properti menjadi school_npsn
    if (!user || !user.school_npsn) return;

    // Gunakan apiRequest dengan async/await seperti pada live-session dan violations
    const result = await apiRequest({
        action: 'getStudents',
        school_npsn: user.school_npsn
    });

    // Tangani response dan render tabel
    if (result && result.success) {
        window.currentFilteredData = result.data;
        renderTabelSiswa(result.data);
    }
}

// Pencarian Universal (Nama, Kelas, Ruang, NISN)
function filterStudents() {
    const keyword = document.getElementById('searchUniversalStudents').value.toLowerCase();
    const filtered = window.currentFilteredData.filter(s => 
        s.nisn.toString().toLowerCase().includes(keyword) ||
        s.full_name.toLowerCase().includes(keyword) ||
        s.class_name.toLowerCase().includes(keyword) ||
        s.room_name.toLowerCase().includes(keyword)
    );
    renderTabelSiswa(filtered);
}
// Buka Blokir & Reset Pelanggaran
async function bukaBlokir(nisn, namaSiswa) {
    if (!confirm(`Aktifkan akun dan hapus seluruh sesi pelanggaran untuk ${namaSiswa} (NISN: ${nisn})?`)) return;

    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    
    // Memanggil action resetViolationStudent yang ada di backend (Violations.gs)
    const result = await apiRequest({
        action: 'resetViolationStudent',
        student_nisn: nisn,
        school_npsn: user.school_npsn
    });

    if (result && result.success) {
        // Muat ulang tabel siswa agar statusnya langsung berubah jadi "Aktif"
        loadDataSiswa(); 
    } else {
        alert("Gagal mereset pelanggaran: " + (result?.message || 'Error server'));
    }
}
// Panggil fungsi saat file dieksekusi
loadDataSiswa();
