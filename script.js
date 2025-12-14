/* ============================================================
   script.js for CHECKMyXy
   - Works for: index.html, teacher.html, student.html, info.html
   - Navigation on teacher.html & student.html uses hash (location.hash)
   - Storage keys:
     * checkmyxy_questions
     * checkmyxy_results
     * checkmyxy_currentStudent
   ============================================================ */

// Import Firestore
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* -------------------------- Utilities ----------------------- */
const KEY_Q = 'checkmyxy_questions';
const KEY_R = 'checkmyxy_results';
const KEY_CUR = 'checkmyxy_currentStudent';

async function load(key, fallback = null) {
  try {
    const col = collection(window.db, key);
    const snapshot = await getDocs(col);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data.length ? data : fallback;
  } catch (e) {
    console.error('Error loading from Firestore:', e);
    return fallback;
  }
}

async function save(key, val) {
  try {
    const col = collection(window.db, key);
    // Hapus semua dokumen lama
    const snapshot = await getDocs(col);
    snapshot.docs.forEach(async (d) => await deleteDoc(d.ref));
    // Tambah data baru
    for (const item of val) {
      await addDoc(col, item);
    }
  } catch (e) {
    console.error('Error saving to Firestore:', e);
  }
}
function genId() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}
function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* -------------------- Initialize sample questions -------------- */
async function ensureSampleQuestions() {
  const ex = await load(KEY_Q, null);
  if (ex && ex.length) return;
  const sample = [
    // Stage 1 - mudah
    { id: genId(), stage:1, type:'mcq', text:'Dari pernyataan dibawah ini mana yang termasuk SPLDV? (i) x^2+3=2 dan x+2y+4 (ii) 2x+4y=6 dan 8x+y=4 (iii) 4x+6y=3', options:['(i) dan (ii)','(i) dan (iii)','(ii)','(ii) dan (iii)'], answer:'(ii)', score:4, explain:'SPLDV adalah sistem yang terdiri dari dua persamaan linear dengan dua variabel. Pernyataan (ii) memenuhi syarat karena memiliki dua persamaan linear dengan variabel x dan y. Pernyataan (i) tidak termasuk SPLDV karena mengandung x^2, sehingga bukan persamaan linear. Pernyataan (iii) tidak termasuk SPLDV karena hanya memiliki satu persamaan.' },
    { id: genId(), stage:1, type:'short', text:'1 gorengan dan 1 es teh harganya Rp5.000. 2 gorengan dan 1 es teh harganya Rp7.000.Berapakah harga 1 gorengan? (Tulis jawaban dengan format: Rpx.xxx)', answer:'Rp2.000', score:4, explain:'Misalkan: g = harga 1 gorengan; e = harga 1 es teh; Sehingga g + e = 5.000...(i) 2g + e = 7.000...(ii); kurangi pers (i) dan (ii) diperoleh -g = -2.000 g = 2.000 Diperoleh bahwa harga 1 gorengan adalah Rp2.000.' },
    { id: genId(), stage:1, type:'tf', text:'Tentukan apakah pernyataan berikut BENAR atau SALAH! Metode Substitusi dan Metode Eliminasi adalah cara untuk menyelesaikan SPLDV. Metode Substitusi dilakukan dengan mengganti salah satu variabel menggunakan ekspresi dari persamaan lain. Metode Eliminasi dilakukan dengan menghilangkan salah satu variabel melalui penjumlahan atau pengurangan persamaan.', answer:'Benar', score:4, explain:'Metode Substitusi (Mengganti salah satu variabel dengan ekspresi dari persamaan lain). Metode Eliminasi (Menghilangkan salah satu variabel dengan menjumlahkan atau mengurangkan persamaan).' },
    { id: genId(), stage:1, type:'mcq', text: 'Tentukan nilai x dan y dari : x+y=10 dan x-y=2', options:['6 dan 4','4 dan 6','2 dan 8','8 dan 2'], answer:'6 dan 4', score:4, explain:'diperoleh persamaan x + y = 10...(i) dan x - y = 2...(ii) kurangi pers. (i) dan (ii), diperoleh 2y = 8; y = 4 Diperoleh bahwa nilai y yang memenuhi adalah 4. Substitusi y = 4 ke dalam persamaan (i): x + 4 = 10; x = 6 Diperoleh bahwa nilai x yang memenuhi adalah 6; Jadi, x = 6 dan y = 4' },
    { id: genId(), stage:1, type:'tf', text:'Tentukan apakah pernyataan berikut BENAR atau SALAH! Diketahui: Harga 1 apel dan 2 pisang adalah Rp9.000. Harga 1 apel dan 1 pisang adalah Rp6.000. Diperoleh bahwa harga 1 pisang adalah Rp4.000', answer:'Salah', score:4, explain:'Misalkan: a = harga 1 apel b = harga 1 pisang; Sehingga a + 2b = 9.000...(i) dan a + b = 6.000...(ii) → b = 3.000; Diperoleh bahwa harga 1 pisang adalah Rp3.000.' },
     
    // Stage 2 - sedang
    { id: genId(), stage:2, type:'mcq', text:'Harga 2 buku dan 3 pensil adalah Rp18.000. Harga 1 buku dan 1 pensil adalah Rp7.000. Tentukan harga satu buku!', options:['Rp6.000','Rp4.500','Rp3.000','Rp5.000'], answer:'Rp3.000', score:7, explain:'Misalkan, b = harga 1 buku; p = harga 1 pensil. Diketahui: 2b + 3p = 18.000...(i) dan b + p = 7.000...(ii) (kalikan 3) Sehingga diperoleh persamaan 2b + 3p = 18.000 dan 3b + 3p = 21.000. Kurangi kedua pers. diperoleh -b = -3.000 → b = 3.000. Diperoleh bahwa harga 1 buku adalah Rp3.000' },
    { id: genId(), stage:2, type:'tf', text:'Tentukan apakah pernyataan berikut BENAR atau SALAH! Sebuah kantin menjual 2 roti dan 3 gelas teh dengan harga Rp19.000. Sedangkan 4 roti dan 2 gelas teh harganya Rp26.000. Maka harga satu roti adalah Rp6.500.', answer:'Salah', score:7, explain:'Misalkan: r = harga 1 roti; t = harga 1 gelas teh. Diketahui 4r + 2t = 26.000...(ii) kalikan 3 dan 2r + 3t = 19.000...(i) kalikan 2. Sehingga 12r + 6t = 78.000 dan 4r + 6t = 38.000. Kurangi kedua pers. Diperoleh 8r = 40.000 → r = 5.000. Diperoleh bahwa harga 1 gelas teh adalah Rp5.000' },
    { id: genId(), stage:2, type:'short', text:'Di sebuah area parkir terdapat 40 kendaraan, yaitu mobil dan motor. Jumlah seluruh roda kendaraan tersebut adalah 124. Berapa banyak mobil yang ada di parkiran?', answer:'22', score:7, explain:'Misalkan: m = banyak mobil; s = banyak motor. Diketahui: Total kendaraan 40. Total roda 124. Mobil punya 4 roda. Motor punya 2 roda. Sehingga m + s = 40...(i) (kalikan 2) dan 4m + 2s = 124...(ii). Diperoleh 2m + 2s = 80 dan 4m + 2s = 124 → -2m = -44 → m = 22. Sehingga terdapat 22 mobil diparkiran.' },
    { id: genId(), stage:2, type:'mcq', text:'Di sebuah peternakan terdapat ayam dan kambing. Jumlah seluruh hewan ada 56 ekor. Jika jumlah ayam 8 ekor lebih banyak daripada kambing, tentukan jumlah masing-masing hewan!', options:['22 ekor dan 33 ekor','33 ekor dan 14 ekor','24 ekor dan 32 ekor','21 ekor dan 44 ekor'], answer:'24 ekor dan 32 ekor', score:7, explain:'Misalkan, x = jumlah ayam; y = jumlah kambing. Diketahui: x + y = 56...(i) dan x - y = 8...(ii) kurangi → 2y = 48 → y = 24 Diperoleh bahwa jumlah kambing adalah 24 ekor. Substitusi y = 24 kedalam persamaan (ii) x - 24 = 8 → x = 32. Diperoleh bahwa jumlah ayam adalah 32 ekor. jadi, x = 24 ekor & y = 32 ekor' },
    { id: genId(), stage:2, type:'tf', text:'Tentukan apakah pernyataan berikut BENAR atau SALAH! 3 tiket konser + 2 minuman = Rp150.000; 1 tiket + 4 minuman = Rp80.000 sehingga 2 tiket + 5 minuman = Rp133.000', answer:'Benar', score:7, explain:'Misalkan, t = harga 1 tiket konser; m = harga 1 minuman. Diketahui 3t + 2m = 150.000...(i) (kalikan 2) dan t + 4m = 80.000...(ii) Sehingga diperoleh persamaan 6t + 4m = 300.000 dan t + 4m = 80.000 kurangi → 5t = 220.000 → t = 44.000. Diperoleh bahwa harga 1 tiket adalah 44.000. Substitusi t = 44.000 ke dalam persamaan (ii): 44.000 + 4m = 80.000 → 4m = 36.000 → m = 9.000. Diperoleh bahwa harga 1 minuman adalah 9.000. Sehingga, harga 2 tiket dan 5 minuman adalah Rp133.000' },
     
    // Stage 3 - sulit
    { id: genId(), stage:3, type:'short', text:'Di tempat parkir sebuah pertokoan terdapat 75 kendaraan yang terdiri dari mobil dan sepeda motor. Banyak roda seluruhnya ada 210. Jika tarif parkir untuk mobil Rp5.000 dan sepeda motor Rp2.000, maka pendapatan uang parkir saat itu adalah… (Tulis jawaban dengan format: Rpx.xxx)', answer:'Rp240.000', score:9, explain:'Misalkan: m = jumlah mobil ; s = jumlah motor. Diketahui: m + s = 75...(i) kalikan 2 dan 4m + 2s = 210...(ii) Sehingga, 2m + 2s = 150 dan 4m + 2s = 210 → -2m = -60 → m = 30Diperoleh bahwa jumlah mobil dalam parkiran adalah 30. Substitusi m = 30.000 kedalam persamaan (i) 30 + s = 75 → s = 45 Diperoleh bahwa jumlah motor dalam parkiran adalah 45. Jadi, pendapatan yang diperoleh adalah Rp240.000' },
    { id: genId(), stage:3, type:'mcq', text:'Harga 4 buah compact disc dan 5 buah kaset Rp. 200.000,00, sedangkan harga 2 buah compact disk dan 3 buah kaset yang sama Rp. 110.000,00. Harga 6 buah compact disc dan 5 buah kaset adalah...', options:['Rp150.000','Rp250.000','Rp350.000','Rp450.000'], answer:'Rp250.000', score:9, explain:'Misalkan: c = harga satu compact disc; k = harga satu kaset. Diketahui: 4c + 5k = 200.000...(i) dan 2c + 3k = 110.000...(ii) kalikan 2. Sehingga 4c + 5k = 200.000 dan 4c + 6k = 220.000 → k = 20.000. Diperoleh bahwa harga satu kaset adalah 20.000. Substitusi k = 20.000 kedalam persamaan (ii) 2c + 3(20.000)= 110.000 → 2c + 60.000 = 110.000 → 2c = 50.000 → c = 25.000. Diperoleh bahwa harga satu compact disc adalah 25.000. Jadi, harga 6 compact disc dan 5 kaset adalah Rp250.000' },
    { id: genId(), stage:3, type:'tf', text:'Tentukan apakah pernyataan berikut BENAR atau SALAH! Dalam sebuah lomba terdapat 50 peserta laki-laki dan 20 peserta perempuan. Jika 8 laki-laki dipindahkan dan 5 perempuan ditambahkan, maka jumlah laki-laki menjadi sama dengan jumlah perempuan. Selain itu, jika seperempat laki-laki dipindahkan dan 3 perempuan mengundurkan diri, maka jumlah laki-laki yang tersisa akan menjadi 6 orang lebih banyak daripada jumlah perempuan yang tersisa.', answer:'Salah', score:9, explain:'Misalkan: L = laki-laki awal; P = perempuan awal. Diketahui: L - P = 13...(1) kalikan 4 dan 3L - 4P = 12...(2) Sehingga 4L - 4P = 52 dan 3L - 4P = 12 → L = 40. Diperoleh bahwa jumlah awal peserta laki-laki adalah sebanyak 40. Substitusi L = 40 kedalam persamaan (i) 40 - P = 13 → P = 27. Diperoleh bahwa jumlah awal peserta perempuan adalah sebanyak 27 orang. Jadi, P = 27 dan L = 40' },
    { id: genId(), stage:3, type:'short', text:'Hari ini seorang pedagang majalah berhasil menjual majalah A dan majalah B sebanyak 28 eksemplar. Harga 1 majalah A adalah Rp6.000 dan harga 1 majalah B adalah Rp9.000. Jika hasil penjualan kedua majalah hari ini adalah Rp216.000 maka banyak majalah A dan majalah B yang terjual hari ini berturut-turut adalah...', answer:'12 dan 16', score:9, explain:'Misalkan: A = jumlah majalah A ; B = jumlah majalah B. Diketahui: A + B = 28...(i)  dan 6.000A + 9.000B = 216.000...(ii) bagi persamaan (ii) dengan 3.000. Sehingga, 2A + 3B = 72...(iii) dari persamaan 1 diperoleh A = 28 - B. Substitusi A = 28 - B kedalam persamaan (iii) 2A + 3B = 72 → 2(28 - B) + 3B = 72 → 56 - 2B + 3B = 72 → B = 16. Diperoleh bahwa jumlah majalah B dalam adalah 16. Substitusi B = 16 kedalam persamaan (iii) 2A + 3B = 72 2A + 3(16) = 72 → 2A + 48 =72 → 2A = 24 → A = 12. Diperoleh bahwa jumlah majalah A dalam adalah 12. Jadi, A = 12 dan B = 16' },
    { id: genId(), stage:3, type:'mcq', text:'Budi membeli 2 kaos dan sebuah sweater di pasar dengan harga Rp300.000. Sesampai dirumah ternyata salah satu kaos sobek, sehingga ia memutuskan untuk menukarkan satu kaos dengan sebuah sweater. Karena sweater lebih mahal maka ia harus membayar lagi Rp60.000. Harga masing-masing sweater dan kaos, berturut-turut adalah', options:['Rp240.000 dan Rp160.000', 'Rp100.000 dan Rp140.000','Rp80.000 dan Rp200.000','Rp140.000 dan Rp80.000'], answer:'Rp140.000 dan Rp80.000', score:9, explain:'Misalkan: k = Harga satu kaos; s = Harga satu sweater. Diketahui: 2k + s = 300.000...(i) dan -k + s = 60.000...(ii) → 3k = 240.000 → k = 80.000 Diperoleh bahwa harga satu kaos adalah 80.000. Substitusi k = 20.000 kedalam persamaan (i) 2(80.000) + s = 300.000 → 160.000 + s = 300.000 → s = 140.000. Diperoleh bahwa harga satu sweater adalah 140.000. Jadi, sweater Rp140.000 dan kaos  Rp80.000' },
  ];
  await save(KEY_Q, sample);
}
ensureSampleQuestions();

/* -------------------- Page init on DOM ready ------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  await ensureSampleQuestions();
  teacherInit();
  studentInit();
  // Index/info pages don't need heavy logic
});

/* ========================= TEACHER ============================ */
function teacherInit(){
  // detect relevant elements
  const loginForm = document.getElementById('teacher-login-form');
  if(!loginForm) return; // not on teacher.html

  // Views
  const viewLogin = document.getElementById('view-login');
  const viewDashboard = document.getElementById('view-dashboard');
  const viewAddQ = document.getElementById('view-addquestion');
  const viewQuestions = document.getElementById('view-questions');
  const viewResults = document.getElementById('view-results');
  const viewStudentDetail = document.getElementById('view-studentdetail');

  // default: ensure hash
  if(!location.hash) location.hash = '#login';
  handleTeacherHash();
  window.addEventListener('hashchange', handleTeacherHash);

  // Login submit
  loginForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const pass = document.getElementById('t-password').value.trim();
    // simple demo password
    if(pass !== 'teacher123'){
      alert('Password salah (demo: teacher123).');
      return;
    }
    // go to dashboard
    location.hash = '#dashboard';
  });

  // Reset sample data
  const btnReset = document.getElementById('btn-sample-reset');
  if(btnReset) btnReset.addEventListener('click', ()=>{
    if(!confirm('Reset all questions & results?')) return;
    localStorage.removeItem(KEY_Q);
    localStorage.removeItem(KEY_R);
    ensureSampleQuestions();
    alert('Data direset ke sample.');
    if(location.hash !== '#dashboard') location.hash = '#dashboard'; else renderDashboard();
  });

  // Add question form
  const addForm = document.getElementById('add-question-form');
  if(addForm){
    addForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const Qs = await load(KEY_Q, []);
      const q = {
        id: genId(),
        stage: parseInt(document.getElementById('q-stage').value, 10),
        type: document.getElementById('q-type').value,
        text: document.getElementById('q-text').value.trim(),
        options: (document.getElementById('q-options').value||'').split('||').map(s=>s.trim()).filter(s=>s),
        answer: document.getElementById('q-answer').value.trim(),
        score: parseInt(document.getElementById('q-score').value, 10) || 1,
        explain: document.getElementById('q-explain').value.trim()
      };
      Qs.push(q);
      await save(KEY_Q, Qs);
      alert('Soal ditambahkan.');
      addForm.reset();
      // go to questions list
      location.hash = '#questions';
    });
  }

  // Export questions
  const exportBtn = document.getElementById('export-questions');
  if(exportBtn) exportBtn.addEventListener('click', ()=>{
    const qs = load(KEY_Q, []);
    const b = new Blob([JSON.stringify(qs, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = url; a.download = 'checkmyxy_questions.json'; a.click(); URL.revokeObjectURL(url);
  });

  // Logout
  const logoutBtn = document.getElementById('teacher-logout');
  if(logoutBtn) logoutBtn.addEventListener('click', ()=>{
    location.hash = '#login';
    // clear any UI if needed
  });

  // render function for hash views
  function handleTeacherHash(){
    const h = location.hash.replace('#','');
    // hide all
    [viewLogin, viewDashboard, viewAddQ, viewQuestions, viewResults, viewStudentDetail].forEach(v=>{ if(v) v.classList.add('hidden'); });
    // show by hash
    switch(h){
      case 'login': if(viewLogin) viewLogin.classList.remove('hidden'); break;
      case 'dashboard': if(viewDashboard) { viewDashboard.classList.remove('hidden'); renderDashboard(); } else location.hash='#login'; break;
      case 'addquestion': if(viewAddQ) viewAddQ.classList.remove('hidden'); break;
      case 'questions': if(viewQuestions) { viewQuestions.classList.remove('hidden'); renderQuestions(); } break;
      case 'results': if(viewResults) { viewResults.classList.remove('hidden'); renderResults(); } break;
      case 'studentdetail': if(viewStudentDetail) { viewStudentDetail.classList.remove('hidden'); } break;
      default: // if hash is teacher.html#something else (e.g. teacher.html#questions)
        // some browsers include page name in hash; try includes
        if(location.hash.includes('dashboard')) { location.hash='#dashboard'; }
        else if(location.hash.includes('questions')) { location.hash='#questions'; }
        else if(location.hash.includes('results')) { location.hash='#results'; }
        else { location.hash = '#login'; }
    }
  }

  /* ---------- Dashboard renderer ---------- */
  async function renderDashboard(){
    const questions = await load(KEY_Q, []);
    const results = await load(KEY_R, []);
    // count classes
    const classes = Array.from(new Set(results.map(r=>r.className).filter(Boolean)));
    const students = Array.from(new Set(results.map(r=> r.className + '||' + r.student))).map(s=> { const [cl, name] = s.split('||'); return s; });
    // show stats
    const elClasses = document.getElementById('stat-classes');
    const elStudents = document.getElementById('stat-students');
    const elResults = document.getElementById('stat-results');
    const elQuestions = document.getElementById('stat-questions');
    if(elClasses) elClasses.textContent = classes.length;
    if(elStudents) elStudents.textContent = (new Set(results.map(r=> r.className + '||' + r.student))).size;
    if(elResults) elResults.textContent = results.length;
    if(elQuestions) elQuestions.textContent = questions.length;
  }

  /* ---------- Questions list ---------- */
  async function renderQuestions(){
    const qs = await load(KEY_Q, []);
    const el = document.getElementById('questions-list');
    if(!el) return;
    el.innerHTML = '';
    if(qs.length === 0){ el.innerHTML = '<p>Tidak ada soal.</p>'; return; }
    qs.forEach(q => {
      const div = document.createElement('div');
      div.className = 'card';
      div.style.marginBottom = '10px';
      div.innerHTML = `
        <strong>Stage ${q.stage} — ${q.type.toUpperCase()}</strong>
        <p>${escapeHtml(q.text)}</p>
        <p style="font-size:13px;color:#555">Jawaban: <b>${escapeHtml(q.answer)}</b> | Skor: ${q.score}</p>
        <p style="font-size:13px;color:#666"><em>${escapeHtml(q.explain||'')}</em></p>
        <div style="margin-top:8px;">
          <button class="btn delete-q" data-id="${q.id}">Hapus</button>
        </div>
      `;
      el.appendChild(div);
    });
    // bind deletion
    el.querySelectorAll('.delete-q').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const id = btn.dataset.id;
        if(!confirm('Hapus soal ini?')) return;
        const filtered = (await load(KEY_Q, [])).filter(x => x.id !== id);
        await save(KEY_Q, filtered);
        renderQuestions();
      });
    });
  }

  /* ---------- Results grouped by class ---------- */
  async function renderResults(){
    const results = await load(KEY_R, []);
    const el = document.getElementById('classes-list');
    if(!el) return;
    el.innerHTML = '';
    if(results.length === 0){ el.innerHTML = '<p>Belum ada hasil siswa.</p>'; return; }

    // group by class
    const byClass = {};
    results.forEach(r => {
      if(!r.className) return;
      if(!byClass[r.className]) byClass[r.className] = [];
      byClass[r.className].push(r);
    });

    Object.keys(byClass).forEach(cls => {
      const students = Array.from(new Set(byClass[cls].map(x=>x.student)));
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<h3>Kelas ${escapeHtml(cls)} — ${students.length} siswa</h3>`;
      students.forEach(st => {
        const recs = byClass[cls].filter(r => r.student === st);
        // compute accumulated final % as average of available stage percentages
        const avg = Math.round(recs.reduce((s,r)=>s + (r.percentage||0), 0) / recs.length);
        const html = document.createElement('div');
        html.style.borderTop = '1px dashed #eee';
        html.style.padding = '8px 0';
        html.innerHTML = `<strong>${escapeHtml(st)}</strong> — stages: [${recs.map(x=>x.stage).join(', ')}] — final: ${avg}% 
          <div style="margin-top:6px">
            <button class="btn view-student" data-st="${escapeHtml(st)}" data-cl="${escapeHtml(cls)}">Lihat</button>
          </div>`;
        card.appendChild(html);
      });
      el.appendChild(card);
    });

    // bind view-student
    el.querySelectorAll('.view-student').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const st = btn.dataset.st;
        const cl = btn.dataset.cl;
        showStudentDetail(st, cl);
      });
    });
  }

  async function showStudentDetail(student, className){
    // prepare detail view: set hash and render content
    location.hash = '#studentdetail';
    const container = document.getElementById('student-detail-content');
    container.innerHTML = '';
    const results = (await load(KEY_R, [])).filter(r => r.student === student && r.className === className);
    if(results.length === 0){ container.innerHTML = '<p>Tidak ada data.</p>'; return; }
    container.innerHTML = `<h3>${escapeHtml(student)} — Kelas ${escapeHtml(className)}</h3>`;
    results.forEach(r=>{
      const div = document.createElement('div');
      div.className = 'result-card';
      div.style.margin='8px 0';
      div.innerHTML = `<strong>Stage ${r.stage}</strong> — ${r.percentage}% (${r.correct}/${r.total}) <br>
        <small>${new Date(r.timestamp).toLocaleString()}</small>
        <div style="margin-top:6px">
          <button class="btn view-detail" data-ts="${r.timestamp}">Detail</button>
          <button class="btn ghost delete-result" data-ts="${r.timestamp}">Hapus</button>
        </div>`;
      container.appendChild(div);
    });
    // bind buttons
    container.querySelectorAll('.view-detail').forEach(b=>{
      b.addEventListener('click', async ()=>{
        const ts = Number(b.dataset.ts);
        const rec = (await load(KEY_R, [])).find(rr => rr.timestamp === ts);
        if(!rec) return alert('Data tidak ditemukan.');
        // show details in modal-like alert (or custom UI)
        let s = `Detail hasil ${rec.student} — Stage ${rec.stage}\nSkor: ${rec.percentage}% (${rec.correct}/${rec.total})\n\nPembahasan:\n`;
        rec.detail.forEach((d,i)=> s += `${i+1}. ${d.qText}\nJawaban Anda: ${d.given}\nKunci: ${d.kunci}\nPembahasan: ${d.explain}\n\n`);
        alert(s);
      });
    });
    container.querySelectorAll('.delete-result').forEach(b=>{
      b.addEventListener('click', async ()=>{
        if(!confirm('Hapus hasil ini?')) return;
        const ts = Number(b.dataset.ts);
        const all = await load(KEY_R, []);
        const filtered = all.filter(rr => rr.timestamp !== ts);
        await save(KEY_R, filtered);
        renderResults();
        showStudentDetail(student, className);
      });
    });
  }

} // end teacherInit



/* ========================= STUDENT ============================ */
function studentInit(){
  const loginView = document.getElementById('student-login-view');
  if(!loginView) return; // not on student.html

  // Elements
  const loginForm = document.getElementById('student-login-form');
  const dashView = document.getElementById('student-dashboard-view');
  const stage1Btn = document.getElementById('stage1-btn');
  const stage2Btn = document.getElementById('stage2-btn');
  const stage3Btn = document.getElementById('stage3-btn');
  const stage1Status = document.getElementById('stage1-status');
  const stage2Status = document.getElementById('stage2-status');
  const stage3Status = document.getElementById('stage3-status');
  const helloEl = document.getElementById('student-hello');
  const finalBox = document.getElementById('final-result-box');
  const finalScoreEl = document.getElementById('final-score');
  const finalRewardEl = document.getElementById('final-reward');

  const quizView = document.getElementById('stage-question-view');
  const questionBox = document.getElementById('question-box');
  const btnBack = document.getElementById('btn-back');
  const btnNext = document.getElementById('btn-next');
  const btnFinish = document.getElementById('btn-finish');

  const resultView = document.getElementById('stage-result-view');

  // Hash default & change listener
  if(!location.hash) location.hash = '#login';
  handleStudentHash();
  window.addEventListener('hashchange', handleStudentHash);

  // login handler
  loginForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = document.getElementById('s-name').value.trim();
    const cls = document.getElementById('s-class').value.trim();
    if(!name || !cls) return alert('Masukkan nama dan kelas.');
    localStorage.setItem(KEY_CUR, JSON.stringify({ name, className: cls }));
    // after login go to dashboard hash
    location.hash = '#dashboard';
  });

  // logout
  const logoutBtn = document.getElementById('student-logout');
  if(logoutBtn) logoutBtn.addEventListener('click', ()=>{
    if(confirm('Keluar dan hapus session?')) {
      localStorage.removeItem(KEY_CUR);
      location.hash = '#login';
      location.reload();
    }
  });

  // stage buttons
  if(stage1Btn) stage1Btn.addEventListener('click', ()=> startStage(1));
  if(stage2Btn) stage2Btn.addEventListener('click', ()=> startStage(2));
  if(stage3Btn) stage3Btn.addEventListener('click', ()=> startStage(3));

  // quiz navigation
  let QUIZ = null; // { stage, questions, idx, answers }
  if(btnBack) btnBack.addEventListener('click', ()=> {
    saveCurrentAnswer();
    if(QUIZ && QUIZ.idx > 0) { QUIZ.idx--; renderQuizQuestion(); }
  });
  if(btnNext) btnNext.addEventListener('click', ()=> {
    saveCurrentAnswer();
    if(QUIZ && QUIZ.idx < QUIZ.questions.length - 1) { QUIZ.idx++; renderQuizQuestion(); }
  });
  if(btnFinish) btnFinish.addEventListener('click', ()=> {
    if(!QUIZ) return;
    saveCurrentAnswer();
    finishQuiz();
  });

  // view result back to dashboard
  const resBack = document.querySelector('#stage-result-view button');
  if(resBack) resBack.addEventListener('click', ()=> {
    location.hash = '#dashboard';
  });

  // initial render
  renderStudentDashboard();

  /* ------------------ Hash handler --------------------- */
  function handleStudentHash(){
    const h = location.hash.replace('#','');
    // hide all views
    [loginView, dashView, quizView, resultView].forEach(v => { if(v) v.classList.add('hidden'); });
    switch(h){
      case 'login': if(loginView) loginView.classList.remove('hidden'); break;
      case 'dashboard': renderStudentDashboard(); if(dashView) dashView.classList.remove('hidden'); break;
      case 'quiz': if(quizView) quizView.classList.remove('hidden'); break;
      case 'result': if(resultView) resultView.classList.remove('hidden'); break;
      default:
        if(location.hash.includes('dashboard')) { location.hash = '#dashboard'; }
        else location.hash = '#login';
    }
  }

  /* ------------------ Rendering student dashboard ---------------- */
  async function renderStudentDashboard(){
    const cur = JSON.parse(localStorage.getItem(KEY_CUR) || 'null'); // localStorage untuk session
    if(!cur) { // no session -> show login
      location.hash = '#login';
      return;
    }
    // show dashboard
    if(loginView) loginView.classList.add('hidden');
    if(dashView) dashView.classList.remove('hidden');

    helloEl.textContent = `Halo, ${cur.name} — Kelas ${cur.className}`;

    // determine completed stages for this student
    const results = await load(KEY_R, []);
    const myResults = results.filter(r => r.student === cur.name && r.className === cur.className);
    const doneStages = myResults.map(r => r.stage);

    // update stage statuses and button enable/disable
    // Stage 1
    if(doneStages.includes(1)){
      stage1Status.textContent = 'Sudah dikerjakan';
      stage1Btn.textContent = 'Lihat Hasil';
      stage1Btn.disabled = false;
    } else {
      stage1Status.textContent = 'Belum dikerjakan';
      stage1Btn.textContent = 'Mulai';
      stage1Btn.disabled = false;
    }
    // Stage 2
    if(doneStages.includes(2)){
      stage2Status.textContent = 'Sudah dikerjakan';
      stage2Btn.textContent = 'Lihat Hasil';
      stage2Btn.disabled = false;
      document.getElementById('stage-2-card').classList.remove('locked');
    } else {
      if(doneStages.includes(1)){
        stage2Status.textContent = 'Belum dikerjakan';
        stage2Btn.textContent = 'Mulai';
        stage2Btn.disabled = false;
        document.getElementById('stage-2-card').classList.remove('locked');
      } else {
        stage2Status.textContent = 'Terkunci - selesaikan Stage 1';
        stage2Btn.textContent = 'Mulai';
        stage2Btn.disabled = true;
        document.getElementById('stage-2-card').classList.add('locked');
      }
    }
    // Stage 3
    if(doneStages.includes(3)){
      stage3Status.textContent = 'Sudah dikerjakan';
      stage3Btn.textContent = 'Lihat Hasil';
      stage3Btn.disabled = false;
      document.getElementById('stage-3-card').classList.remove('locked');
    } else {
      if(doneStages.includes(2)){
        stage3Status.textContent = 'Belum dikerjakan';
        stage3Btn.textContent = 'Mulai';
        stage3Btn.disabled = false;
        document.getElementById('stage-3-card').classList.remove('locked');
      } else {
        stage3Status.textContent = 'Terkunci - selesaikan Stage 2';
        stage3Btn.textContent = 'Mulai';
        stage3Btn.disabled = true;
        document.getElementById('stage-3-card').classList.add('locked');
      }
    }

    // Render final accumulative result
    renderFinalSummaryFor(cur.name, cur.className);
  }

  function renderFinalSummaryFor(name, className){
    const results = load(KEY_R, []);
    const my = results.filter(r => r.student === name && r.className === className);
    if(!my.length){
      finalBox.classList.add('hidden');
      return;
    }
    const avg = Math.round(my.reduce((s,r)=>s + (r.percentage||0), 0) / my.length);
    finalBox.classList.remove('hidden');
    finalScoreEl.textContent = avg + '%';
    let reward = '';
    if(avg === 100) reward = 'Mantap, kamu keren 🤩';
    else if(avg >= 75) reward = 'Bagus! 👍';
    else reward = 'Semangat — jangan menyerah, belajar lagi';
    finalRewardEl.textContent = reward;
  }

  /* ------------------ Start a stage (or view result if already done) ---------------- */
  async function startStage(stage){
    const cur = JSON.parse(localStorage.getItem(KEY_CUR) || 'null'); // localStorage
    if(!cur) return alert('Silakan login terlebih dahulu.');
    const results = await load(KEY_R, []);
    const existing = results.find(r => r.student === cur.name && r.className === cur.className && r.stage === stage);
    if(existing){
      // user already did this stage -> show stored result
      showResult(existing);
      return;
    }
    // otherwise prepare quiz object
    const questions = (await load(KEY_Q, [])).filter(q => q.stage === stage);
    if(!questions || questions.length === 0) return alert('Belum ada soal pada stage ini.');
    // build QUIZ object
    QUIZ = {
      stage,
      questions,
      idx: 0,
      answers: Array(questions.length).fill('')
    };
    // navigate to quiz hash
    location.hash = '#quiz';
    // render first question
    renderQuizQuestion();
  }

  /* ------------------ Render quiz question ---------------- */
  function renderQuizQuestion(){
    if(!QUIZ) return;
    // show quiz view, hide dash
    document.getElementById('student-dashboard-view').classList.add('hidden');
    document.getElementById('stage-question-view').classList.remove('hidden');

    const q = QUIZ.questions[QUIZ.idx];
    questionBox.innerHTML = ''; // clear
    const html = document.createElement('div');
    html.innerHTML = `<h3>Stage ${QUIZ.stage} — Soal ${QUIZ.idx+1} dari ${QUIZ.questions.length}</h3>
      <p class="quiz-question">${escapeHtml(q.text)}</p>`;
    // options
    const opts = document.createElement('div');
    opts.className = 'quiz-options';
    if(q.type === 'mcq'){
      q.options.forEach(opt => {
        const label = document.createElement('label');
        label.className = 'quiz-option';
        label.innerHTML = `<input type="radio" name="ans" value="${escapeHtml(opt)}"> ${escapeHtml(opt)}`;
        opts.appendChild(label);
      });
    } else if(q.type === 'tf'){
      ['Benar','Salah'].forEach(opt=>{
        const label = document.createElement('label');
        label.className = 'quiz-option';
        label.innerHTML = `<input type="radio" name="ans" value="${escapeHtml(opt)}"> ${escapeHtml(opt)}`;
        opts.appendChild(label);
      });
    } else {
      const inp = document.createElement('input');
      inp.type = 'text'; inp.id = 'short-ans'; inp.placeholder = 'Jawaban singkat...'; inp.className='quiz-option';
      opts.appendChild(inp);
    }
    html.appendChild(opts);
    // attach to questionBox
    questionBox.appendChild(html);

    // restore previous answer if any
    const prev = QUIZ.answers[QUIZ.idx];
    if(prev){
      if(q.type === 'short'){
        const short = document.getElementById('short-ans');
        if(short) short.value = prev;
      } else {
        document.querySelectorAll('input[name=ans]').forEach(r => { if(r.value === prev) r.checked = true; });
      }
    }

    // update nav btns
    btnBack.disabled = (QUIZ.idx === 0);
    btnNext.disabled = (QUIZ.idx === QUIZ.questions.length - 1);
    btnFinish.classList.toggle('hidden', QUIZ.idx !== QUIZ.questions.length - 1);
  }

  function saveCurrentAnswer(){
    if(!QUIZ) return;
    const q = QUIZ.questions[QUIZ.idx];
    let given = '';
    if(q.type === 'short'){
      const short = document.getElementById('short-ans');
      given = short ? short.value.trim() : '';
    } else {
      const sel = document.querySelector('input[name=ans]:checked');
      given = sel ? sel.value : '';
    }
    QUIZ.answers[QUIZ.idx] = given;
  }

  /* ------------------ Finish quiz & score ---------------- */
  async function finishQuiz(){
    if(!QUIZ) return;
    // compute per question
    const questions = QUIZ.questions;
    let correct = 0, wrong = 0, totalScore = 0, earned = 0;
    const detail = [];
    for(let i=0;i<questions.length;i++){
      const q = questions[i];
      const given = (QUIZ.answers[i]||'').toString().trim();
      const key = (q.answer||'').toString().trim();
      totalScore += (q.score || 1);
      // comparison: case-insensitive for strings and exact number match
      let isCorrect = false;
      if(q.type === 'short'){
        if(given.toLowerCase() === key.toLowerCase()) isCorrect = true;
        else if(!isNaN(given) && !isNaN(key) && Number(given) === Number(key)) isCorrect = true;
      } else {
        if(given && given.toLowerCase() === key.toLowerCase()) isCorrect = true;
      }
      if(isCorrect){
        correct++; earned += (q.score || 1);
      } else wrong++;
      detail.push({ qText: q.text, given: given || '-', kunci: key, isCorrect, explain: q.explain || '' });
    }
    const percentage = Math.round((earned / totalScore) * 100);

    // save result
    const cur = JSON.parse(localStorage.getItem(KEY_CUR) || 'null'); // localStorage
    const results = await load(KEY_R, []);
    const rec = {
      timestamp: Date.now(),
      student: cur.name,
      className: cur.className,
      stage: QUIZ.stage,
      correct, wrong, total: questions.length, percentage, detail
    };
    results.push(rec);
    await save(KEY_R, results);

    // show result view (reuse stage-result-view)
    showResult(rec);
    // After finishing, update dashboard statuses (unlock next stage in UI)
    renderStudentDashboard();
  }

  /* ------------------ Show previously saved result ---------------- */
  function showResult(rec){
    // navigate to result view
    if(location.hash !== '#result') location.hash = '#result';
    // hide quiz & dashboard
    document.getElementById('stage-question-view').classList.add('hidden');
    document.getElementById('student-dashboard-view').classList.add('hidden');
    // show stage result area
    document.getElementById('stage-result-view').classList.remove('hidden');
    // populate values
    document.getElementById('stage-result-title').textContent = `Hasil Stage ${rec.stage}`;
    document.getElementById('r-correct').textContent = rec.correct;
    document.getElementById('r-wrong').textContent = rec.wrong;
    document.getElementById('r-score').textContent = rec.percentage + '%';
    // feedback
    let fb = '';
    if(rec.percentage === 100) fb = 'Mantap, kamu keren 🤩';
    else if(rec.percentage >= 75) fb = 'Bagus! 👍';
    else fb = 'Semangat — jangan menyerah, belajar lagi';
    document.getElementById('r-feedback').textContent = fb;
    // explanations
    const exBox = document.getElementById('r-explanations');
    exBox.innerHTML = '';
    rec.detail.forEach((d,i)=>{
      const el = document.createElement('div');
      el.className = 'result-card';
      el.innerHTML = `<strong>${i+1}. ${escapeHtml(d.qText)}</strong>
        <p>Jawaban Anda: <b>${escapeHtml(d.given)}</b> — Kunci: <b>${escapeHtml(d.kunci)}</b></p>
        <p><em>Pembahasan: ${escapeHtml(d.explain||'-')}</em></p>`;
      exBox.appendChild(el);
    });
  }

} // end studentInit


/* ========================= END OF FILE ============================ */

/* Notes:
 - This single script handles teacher.html and student.html features
 - It uses location.hash to show the correct "view" inside each page
 - All data persisted in localStorage; for production you would replace with server-side storage
 - UI elements are simple; style and enhancements live in style.css
*/

