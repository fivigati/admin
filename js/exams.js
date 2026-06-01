async function loadExams() {
    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    
    // Panggil API untuk mengambil data dari sheet exams
    const result = await apiRequest({
        action: 'getExams', // Pastikan backend punya case 'getExams'
        school_npsn: user.school_npsn
    });

    if (result && result.success) {
        renderExams(result.data);
    }
}

function renderExams(data) {
    const container = document.getElementById('exams-container');
    if (data.length === 0) {
        container.innerHTML = `<div class="col-span-full p-10 text-center text-slate-400 text-sm">Belum ada jadwal ujian.</div>`;
        return;
    }

    container.innerHTML = data.map(ex => `
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div class="flex justify-between items-start mb-4">
                <div class="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                    <i data-lucide="book-open" class="w-6 h-6"></i>
                </div>
                <span class="text-[10px] font-bold px-2 py-1 rounded-full ${ex.exam_status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}">
                    ${ex.exam_status.toUpperCase()}
                </span>
            </div>
            
            <h3 class="font-bold text-slate-900">${ex.subject}</h3>
            <p class="text-xs text-slate-500 mb-4">${ex.target_class}</p>
            
            <div class="space-y-2 text-xs text-slate-600 border-t pt-4">
                <div class="flex items-center gap-2"><i data-lucide="calendar" class="w-3.5 h-3.5"></i> ${ex.exam_date}</div>
                <div class="flex items-center gap-2"><i data-lucide="clock" class="w-3.5 h-3.5"></i> ${ex.start_time} - ${ex.end_time}</div>
                <div class="flex items-center gap-2 font-mono font-bold text-indigo-600">
                    <i data-lucide="key" class="w-3.5 h-3.5"></i> M: ${ex.entry_token} | K: ${ex.exit_token}
                </div>
            </div>
            
            <div class="mt-5 flex gap-2">
                <a href="${ex.exam_link}" target="_blank" class="flex-1 text-center py-2 bg-slate-100 rounded-lg text-xs font-bold hover:bg-slate-200">Link Ujian</a>
                <button onclick="hapusUjian('${ex.id}')" class="px-3 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}
