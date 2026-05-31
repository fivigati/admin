/* =====================================================
   STUDENTS MANAGEMENT MODULE
   ===================================================== */

// 1. Memuat data siswa ke tabel
async function loadDataSiswa() {
    const tbody = document.getElementById('siswa-tbody');
    tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Memuat data...</td></tr>';

    google.script.run
        .withSuccessHandler(res => {
            if (res.success) {
                // Simpan data global untuk filter/hapus massal
                window.currentFilteredData = res.data; 
                renderTabelSiswa(res.data);
            }
        })
        .getStudents({ school_npsn: CURRENT_NPSN }); // Pakai variabel global NPSN yang sudah kita bahas
}

// 2. Render ke HTML
function renderTabelSiswa(dataList) {
    const tbody = document.getElementById('siswa-tbody');
    // Cek apakah akun premium (misal disimpan di variabel global atau config)
    const isPremium = true; 

    tbody.innerHTML = dataList.map(s => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-3 font-bold text-slate-700">${s.nisn}</td>
            <td class="p-3">
                <div class="font-bold text-slate-800">${s.full_name}</div>
                <div class="text-[10px] text-slate-400">${s.class_name} | ${s.room_name}</div>
            </td>
            <td class="p-3 text-[10px] text-slate-500">${s.description || '-'}</td>
            <td class="p-3">
                <span class="px-2 py-1 rounded-full text-[9px] font-bold uppercase ${s.account_status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}">
                    ${s.account_status}
                </span>
            </td>
            <td class="p-3 text-center space-x-2">
                <button onclick="editSiswa('${s.nisn}')" class="text-indigo-600"><i class="fas fa-edit"></i></button>
                <button onclick="hapusSiswa('${s.nisn}')" class="text-rose-600"><i class="fas fa-trash"></i></button>
                ${isPremium ? 
                    `<button onclick="bukaBlokir('${s.nisn}')" class="text-amber-600"><i class="fas fa-unlock"></i></button>` : 
                    `<i class="fas fa-lock text-slate-300"></i>`
                }
            </td>
        </tr>
    `).join('');
}

// 3. Fungsi Bulk Import
function prosesImport() {
    const rawData = document.getElementById('excelPasteArea').value;
    const lines = rawData.split('\n');
    
    const studentList = lines.map(line => {
        const [nisn, grade_level, full_name, class_name, description, room_name] = line.split('\t');
        if (!nisn) return null;
        return { 
            nisn, school_npsn: CURRENT_NPSN, grade_level, full_name, class_name, description, room_name 
        };
    }).filter(s => s !== null);

    google.script.run
        .withSuccessHandler(() => {
            showNotif('Data siswa berhasil diimport!', 'success');
            tutupModalImport();
            loadDataSiswa();
        })
        .saveStudent(studentList);
}
