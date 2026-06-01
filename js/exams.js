// --- 1. INISIALISASI & LOAD DATA ---
async function loadExams() {
    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    if (!user || !user.school_npsn) return;

    const container = document.getElementById('exams-container');
    container.innerHTML = `<div class="col-span-full text-center text-slate-400 p-10">Memuat jadwal ujian...</div>`;

    const result = await apiRequest({
        action: 'getExams',
        school_npsn: user.school_npsn
    });

    if (result && result.success) {
        renderExams(result.data);
    } else {
        container.innerHTML = `<div class="col-span-full text-center text-rose-500 p-10">Gagal memuat data.</div>`;
    }
}

// --- 2. RENDER UI CARDS ---
function renderExams(data) {
    const container = document.getElementById('exams-container');
    if (!data || data.length === 0) {
        container.innerHTML = `<div class="col-span-full p-10 text-center text-slate-400 text-sm">Belum ada jadwal ujian yang dibuat.</div>`;
        return;
    }

    container.innerHTML = data.map(ex => `
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div class="flex justify-between items-start mb-4">
                <div class="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                    <i data-lucide="book-open" class="w-6 h-6"></i>
                </div>
                <span class="text-[10px] font-bold px-2 py-1 rounded-full ${ex.exam_status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}">
                    ${ex.exam_status ? ex.exam_status.toUpperCase() : 'ACTIVE'}
                </span>
            </div>
            
            <h3 class="font-bold text-slate-900">${ex.subject}</h3>
            <p class="text-xs text-slate-500 mb-4">${ex.target_class || 'Semua Kelas'}</p>
            
            <div class="space-y-2 text-xs text-slate-600 border-t pt-4">
                <div class="flex items-center gap-2"><i data-lucide="calendar" class="w-3.5 h-3.5"></i> ${ex.exam_date}</div>
                <div class="flex items-center gap-2"><i data-lucide="clock" class="w-3.5 h-3.5"></i> ${ex.start_time} - ${ex.end_time}</div>
                <div class="flex items-center gap-2 font-mono font-bold text-indigo-600">
                    <i data-lucide="key" class="w-3.5 h-3.5"></i> M: ${ex.entry_token} | K: ${ex.exit_token}
                </div>
            </div>
            
            <div class="mt-5 flex gap-2">
                <a href="${ex.exam_link}" target="_blank" class="flex-1 text-center py-2 bg-slate-100 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">Link Ujian</a>
                <button onclick="hapusUjian('${ex.id}')" class="px-3 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

// --- 3. MANAJEMEN TARGET KELAS DI MODAL ---
let targetList = [];

function bukaModalJadwal() {
    targetList = [];
    document.getElementById('targetTags').innerHTML = '';
    document.getElementById('modalTambahJadwal').classList.remove('hidden');
}

function tutupModalJadwal() {
    document.getElementById('modalTambahJadwal').classList.add('hidden');
}

function tambahTarget() {
    const input = document.getElementById('inputKelas');
    const val = input.value.trim();
    if(val && !targetList.includes(val)) {
        targetList.push(val);
        renderTags();
        input.value = '';
    }
}

function renderTags() {
    document.getElementById('targetTags').innerHTML = targetList.map(t => `
        <span class="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
            ${t} <i data-lucide="x" class="w-3 h-3 cursor-pointer" onclick="hapusTarget('${t}')"></i>
        </span>
    `).join('');
    lucide.createIcons();
}

function hapusTarget(t) {
    targetList = targetList.filter(item => item !== t);
    renderTags();
}

// --- 4. SIMPAN & HAPUS UJIAN ---
async function simpanJadwal(e) {
    e.preventDefault();
    if(targetList.length === 0) return alert("Tambahkan minimal satu target kelas!");

    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    const payload = {
        action: 'saveExams',
        school_npsn: user.school_npsn,
        subject: document.getElementById('examSubject').value,
        exam_date: document.getElementById('examDate').value,
        start_time: document.getElementById('startTime').value,
        end_time: document.getElementById('endTime').value,
        duration: document.getElementById('examDuration').value,
        exam_link: document.getElementById('examLink').value,
        entry_token: document.getElementById('entryToken').value,
        exit_token: document.getElementById('exitToken').value,
        targets: targetList
    };

    const res = await apiRequest(payload);
    if(res.success) {
        tutupModalJadwal();
        loadExams();
    } else {
        alert("Gagal: " + (res.message || 'Terjadi kesalahan'));
    }
}

async function hapusUjian(id) {
    if(!confirm("Yakin ingin menghapus jadwal ujian ini?")) return;
    
    const res = await apiRequest({ action: 'deleteExam', id: id });
    if(res.success) {
        loadExams();
    } else {
        alert("Gagal menghapus jadwal.");
    }
}

// Auto-refresh (30 detik sekali)
setInterval(() => {
    const view = document.getElementById('view-exams');
    if (view && !view.classList.contains('hidden')) loadExams();
}, 30000);
