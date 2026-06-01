/* =====================================================
   STUDENTS MODULE (MENGGUNAKAN INDEKS STATIS)
   ===================================================== */

// Render Tabel Siswa
function renderTabelSiswa(dataList) {
    const tbody = document.getElementById('siswa-tbody');
    
    if (!dataList || dataList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-slate-400">Data siswa tidak ditemukan.</td></tr>`;
        return;
    }

    tbody.innerHTML = dataList.map(s => {
        // Logika Status Badge
        const isActive = s.account_status?.toString().toLowerCase() === 'active';
        const badgeClass = isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600';
        const badgeText = isActive ? 'Aktif' : 'Blokir';
        
        return `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-3 font-black text-slate-700">${s.nisn}</td>
            <td class="p-3 flex items-center gap-3">
                <div class="w-10 h-12 rounded overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                    ${s.pic_url ? `<img src="${s.pic_url}" class="w-full h-full object-cover">` : 
                    `<div class="flex items-center justify-center h-full text-slate-400"><i class="fas fa-user text-sm"></i></div>`}
                </div>
                <div>
                    <div class="font-bold text-slate-800">${s.full_name}</div>
                    <div class="text-[10px] text-slate-400">${s.class_name || '-'} | ${s.room_name || '-'}</div>
                </div>
            </td>
            <td class="p-3 text-[10px] text-slate-500">${s.description || '-'}</td>
            <td class="p-3">
                <span class="px-2 py-1 rounded-full text-[9px] font-bold uppercase ${badgeClass}">
                    ${badgeText}
                </span>
            </td>
            <td class="p-3 text-center text-slate-400">
                <button onclick="editSiswa('${s.nisn}')" class="hover:text-indigo-600 transition p-1"><i class="fas fa-edit"></i></button>
                <button onclick="hapusSiswa('${s.nisn}')" class="hover:text-rose-600 transition p-1"><i class="fas fa-trash"></i></button>
                <button onclick="bukaBlokir('${s.nisn}')" class="hover:text-amber-600 transition p-1 ${!isActive ? '' : 'opacity-30 cursor-not-allowed'}"><i class="fas fa-unlock"></i></button>
            </td>
        </tr>
        `;
    }).join('');
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
