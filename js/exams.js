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
    if (data.length === 0) return container.innerHTML = `<p class="col-span-full text-center text-slate-400 text-sm">Tidak ada jadwal.</p>`;

    container.innerHTML = data.map(ex => {
        // Ikon dinamis berdasarkan mapel
        const icon = ex.subject.toLowerCase().includes('matematika') ? 'calculator' : 
                     ex.subject.toLowerCase().includes('ipa') ? 'flask-conical' : 'book-open';
        
        return `
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div class="flex items-center gap-3 mb-4">
                <div class="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><i data-lucide="${icon}" class="w-5 h-5"></i></div>
                <div>
                    <h3 class="font-bold text-slate-900">${ex.subject}</h3>
                    <p class="text-[10px] text-slate-400 font-medium">${ex.exam_date} • ${ex.start_time} - ${ex.end_time}</p>
                </div>
            </div>

            <div class="space-y-2 mb-4">
                ${ex.targets.map(t => `
                    <div class="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg">
                        <span class="font-bold text-slate-700">${t.class}</span>
                        <a href="${t.link}" target="_blank" class="text-indigo-600 font-bold hover:underline">Link</a>
                    </div>
                `).join('')}
            </div>

            <div class="flex gap-2 text-[10px] font-bold">
                <span class="flex-1 text-center bg-emerald-50 text-emerald-700 py-1.5 rounded-md border border-emerald-100">IN: ${ex.entry_token}</span>
                <span class="flex-1 text-center bg-rose-50 text-rose-600 py-1.5 rounded-md border border-rose-100">OUT: ${ex.exit_token}</span>
            </div>
        </div>
        `;
    }).join('');
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

// Inisialisasi awal
loadExams();
