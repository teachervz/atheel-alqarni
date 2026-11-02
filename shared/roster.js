/* ================================================================
   👩‍🎓 قائمة الطالبات — تُقرأ من لوحة الإدارة (admin/index.html)
   مشتركة بين جميع الدروس:
   • Roster.load(grade)        أسماء شعب صف الدرس
   • Roster.watch(fn)          تحديث الأسماء إذا عُدّلت في اللوحة أثناء فتح الدرس
   • Roster.attendance(el, g)  شريحة التحضير كاملة (للدروس التي لا تملك شريحة تحضير خاصة)
   • Roster.draw               قرعة الأسماء من الحاضرات بدون تكرار (اختصار: ق)
   • Roster.present()/select() للدروس التي لها قرعة خاصة بها
   ================================================================ */
const Roster = (() => {
  const KEY = 'atheel-admin-v1';
  const ADMIN_URL = '../admin/index.html';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };

  /* { 'الثاني متوسط أ': ['اسم', ...] } — شعب صف الدرس، أو كل الشعب إن لم يوجد صف بهذا الاسم */
  function load(grade) {
    let db = null;
    try { db = JSON.parse(read()); } catch (e) {}
    const grades = db && Array.isArray(db.grades) ? db.grades : [];
    const mine = grades.filter(g => g.name === grade);
    const out = {};
    (mine.length ? mine : grades).forEach(g => (g.sections || []).forEach(s => {
      out[`${g.name} ${s.name}`] = (s.students || []).map(st => st.name);
    }));
    return out;
  }

  function watch(fn) {
    let last = read();
    const check = () => { const now = read(); if (now !== last) { last = now; fn(); } };
    addEventListener('storage', e => { if (e.key === KEY) check(); });
    addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
  }

  /* ---------- حالة التحضير (نفس مفاتيح الحفظ في بقية الدروس) ---------- */
  const st = { grade: '', classes: {}, cur: null, students: [], att: [], key: '' };
  function useGrade(grade) {
    st.grade = grade; st.classes = load(grade);
    let c = null; try { c = localStorage.getItem('att-class'); } catch (e) {}
    st.cur = st.classes[c] ? c : Object.keys(st.classes)[0] || null;
    loadAtt();
  }
  function loadAtt() {
    st.students = st.classes[st.cur] || [];
    st.key = 'att-' + new Date().toISOString().slice(0, 10) + '-' + st.cur;
    st.att = st.students.map(() => 'p');                 // p حاضرة | a غائبة | l متأخرة
    try { const sv = JSON.parse(localStorage.getItem(st.key)); if (Array.isArray(sv) && sv.length === st.students.length) st.att = sv; } catch (e) {}
  }
  const saveAtt = () => { try { localStorage.setItem(st.key, JSON.stringify(st.att)); } catch (e) {} };

  /* ---------- الأنماط (مقاسات مسرح 1920×1080) ---------- */
  const CSS = `
  .rs{display:flex;flex-direction:column;gap:22px;height:100%;min-height:0;font-family:'Tajawal','Cairo',sans-serif;direction:rtl;color:inherit}
  .rs-sw{flex-shrink:0;display:flex;flex-wrap:wrap;gap:12px;align-items:center;font-size:28px;font-weight:800}
  .rs-sw>span{color:#2b1558;background:rgba(255,255,255,.85);border-radius:999px;padding:4px 18px}
  .rs-sw button{font:inherit;font-size:26px;border:3px solid #ddd3fb;background:#fff;border-radius:999px;padding:6px 24px;cursor:pointer;color:#2b1558}
  .rs-sw button.on{background:#7048e8;border-color:#7048e8;color:#fff}
  .rs-sw small{opacity:.7}
  .rs-bar{flex-shrink:0;display:flex;flex-wrap:wrap;gap:12px;align-items:center}
  .rs-tag{color:#2b1558;background:#fff;border-radius:16px;padding:8px 20px;font-size:26px;font-weight:800;box-shadow:0 6px 18px -8px rgba(76,40,160,.35)}
  .rs-tag.ok{color:#15803d}.rs-tag.late{color:#b45309}.rs-tag.bad{color:#be123c}
  .rs-bar .sp{flex:1}
  .rs-btn{font:inherit;font-size:24px;font-weight:800;border:none;border-radius:16px;padding:10px 22px;cursor:pointer;background:#efe9ff;color:#2b1558}
  .rs-btn.pri{background:#7048e8;color:#fff}
  .rs-btn:hover{filter:brightness(.96)}
  .rs-grid{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:14px;align-content:start;padding:4px}
  .rs-grid::-webkit-scrollbar{width:14px}
  .rs-grid::-webkit-scrollbar-thumb{background:#ddd3fb;border-radius:8px;border:3px solid transparent;background-clip:padding-box}
  .rs-stu{font:inherit;display:grid;grid-template-columns:56px 1fr;align-items:center;column-gap:14px;row-gap:2px;background:#fff;border:3px solid #dcfce7;border-radius:20px;padding:10px 16px;cursor:pointer;text-align:right;transition:transform .15s}
  .rs-stu:active{transform:scale(.97)}
  .rs-stu .av{grid-row:1/3;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;font-size:28px;font-weight:900;color:#fff;background:#22c55e;flex:none}
  .rs-stu .nm{min-width:0;overflow-wrap:anywhere;font-size:26px;font-weight:800;color:#2b1558;line-height:1.3}
  .rs-stu .s{font-size:20px;font-weight:800;white-space:nowrap}
  .rs-stu[data-s=a]{border-color:#fecdd3;background:#fff1f2}.rs-stu[data-s=a] .av{background:#f43f5e}.rs-stu[data-s=a] .nm{opacity:.6}
  .rs-stu[data-s=l]{border-color:#fde68a;background:#fffbeb}.rs-stu[data-s=l] .av{background:#f59e0b}
  .rs-tip{flex-shrink:0;margin:0;font-size:24px;text-align:center;align-self:center;color:#6b5a93;background:rgba(255,255,255,.85);border-radius:999px;padding:4px 22px}
  .rs-empty{flex:1;display:grid;place-items:center;text-align:center;font-size:34px;font-weight:800;opacity:.8;line-height:1.8}
  .rs-empty a{color:inherit;text-decoration:underline}
  #rsDraw{position:fixed;inset:0;z-index:9999;background:rgba(20,10,45,.7);display:none;align-items:center;justify-content:center;font-family:'Tajawal','Cairo',sans-serif;direction:rtl}
  #rsDraw.on{display:flex}
  #rsDraw .card{background:#fff;border-radius:3vmin;padding:4vmin 5vmin;width:min(80vw,120vmin);text-align:center;box-shadow:0 4vmin 10vmin rgba(0,0,0,.4);color:#2b1558}
  #rsDraw h3{font-size:4vmin;margin:0}
  #rsDraw .info{font-size:2.4vmin;color:#6b5a93;margin-top:1vmin}
  #rsDraw .name{font-size:9vmin;font-weight:900;min-height:14vmin;display:grid;place-items:center;margin:3vmin 0;border-radius:2.5vmin;background:#f7f3ff;transition:color .2s,background .2s}
  #rsDraw .name.win{color:#7048e8;background:#fff6cc}
  #rsDraw .picked{display:flex;flex-wrap:wrap;gap:1vmin;justify-content:center;min-height:4vmin;margin-bottom:2.5vmin}
  #rsDraw .picked span{background:#efe9ff;border-radius:99px;padding:.4vmin 1.8vmin;font-size:2.2vmin;font-weight:700}
  #rsDraw .acts{display:flex;gap:1.5vmin;justify-content:center}
  #rsDraw .acts button{font:inherit;font-size:2.8vmin;font-weight:800;border:none;border-radius:1.6vmin;padding:1.2vmin 3.5vmin;cursor:pointer;background:#efe9ff;color:#2b1558}
  #rsDraw .acts button.pri{background:#7048e8;color:#fff}
  #rsDraw small.k{display:block;margin-top:2vmin;font-size:1.8vmin;color:#9a8cc0}`;
  let styled = false;
  const style = () => { if (styled) return; styled = true; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); };

  /* ---------- شريحة التحضير ---------- */
  const hosts = [];
  function attendance(host, grade) {
    style();
    if (st.grade !== grade) useGrade(grade);
    if (!hosts.includes(host)) hosts.push(host);
    paint(host);
  }
  function paint(host) {
    const today = new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' });
    const LBL = { p: '✅ حاضرة', a: '❌ غائبة', l: '⏰ متأخرة' }, NEXT = { p: 'a', a: 'l', l: 'p' };
    const names = Object.keys(st.classes);
    if (!names.length) {
      host.innerHTML = `<div class="rs"><div class="rs-empty"><div>📋 لا توجد أسماء طالبات بعد<br><a href="${ADMIN_URL}" target="_blank">أضيفيها من لوحة الإدارة ←</a></div></div></div>`;
      return;
    }
    host.innerHTML = `<div class="rs">
      <div class="rs-sw"><span>👩‍🏫 الشعبة:</span>${names.map(c => `<button class="${c === st.cur ? 'on' : ''}" data-c="${esc(c)}">${esc(c)} <small>(${st.classes[c].length})</small></button>`).join('')}</div>
      ${st.students.length ? `
      <div class="rs-bar">
        <span class="rs-tag">📅 ${today}</span>
        <span class="rs-tag ok"></span><span class="rs-tag late"></span><span class="rs-tag bad"></span>
        <span class="sp"></span>
        <button class="rs-btn" data-act="all">✅ تحضير الكل</button>
        <button class="rs-btn" data-act="copy">📋 نسخ الغائبات</button>
        <button class="rs-btn pri" data-act="draw">🎯 قرعة</button>
      </div>
      <div class="rs-grid scroll">${st.students.map((n, k) => `<button class="rs-stu" data-k="${k}"><span class="av">${esc(n.replace(/^ال/, '')[0] || '؟')}</span><span class="nm">${esc(n)}</span><span class="s"></span></button>`).join('')}</div>
      <p class="rs-tip">👆 اضغطي على اسم الطالبة لتغيير حالتها: حاضرة ← غائبة ← متأخرة</p>`
      : `<div class="rs-empty"><div>لا توجد طالبات في هذه الشعبة بعد<br><a href="${ADMIN_URL}" target="_blank">أضيفيهن من لوحة الإدارة ←</a></div></div>`}
    </div>`;
    const q = s => host.querySelector(s), qa = s => [...host.querySelectorAll(s)];
    const update = () => {
      qa('.rs-stu').forEach((b, k) => { b.dataset.s = st.att[k]; b.querySelector('.s').textContent = LBL[st.att[k]]; });
      const n = v => st.att.filter(x => x === v).length;
      q('.rs-tag.ok').textContent = '✅ حاضرة: ' + n('p');
      q('.rs-tag.late').textContent = '⏰ متأخرة: ' + n('l');
      q('.rs-tag.bad').textContent = '❌ غائبة: ' + n('a');
    };
    qa('.rs-sw button').forEach(b => b.onclick = () => select(b.dataset.c));
    if (!st.students.length) return;
    qa('.rs-stu').forEach(b => b.onclick = () => { const k = +b.dataset.k; st.att[k] = NEXT[st.att[k]]; saveAtt(); update(); });
    q('[data-act=all]').onclick = () => { st.att.fill('p'); saveAtt(); update(); };
    q('[data-act=draw]').onclick = () => opener ? opener() : draw.show();
    q('[data-act=copy]').onclick = e => {
      const pick = v => st.students.filter((n, k) => st.att[k] === v);
      const abs = pick('a'), late = pick('l');
      const txt = `التحضير — ${st.cur} — ${today}\nالغائبات (${abs.length}): ${abs.join('، ') || 'لا يوجد'}\nالمتأخرات (${late.length}): ${late.join('، ') || 'لا يوجد'}`;
      try { navigator.clipboard.writeText(txt); } catch (err) {}
      const b = e.currentTarget, old = b.textContent; b.textContent = '✔️ تم النسخ'; setTimeout(() => b.textContent = old, 1600);
    };
    update();
  }

  /* ---------- 🎯 القرعة: بدون تكرار حتى تنتهي جميع الحاضرات ---------- */
  const draw = {
    open: false, spinning: false, picked: [], tm: null, el: null,
    avail: () => st.students.filter((n, k) => st.att[k] !== 'a'),
    mount() {
      if (this.el) return;
      style();
      this.el = document.createElement('div'); this.el.id = 'rsDraw';
      this.el.innerHTML = `<div class="card"><h3></h3><div class="info"></div><div class="name">من ستجيب الآن؟ 🤔</div><div class="picked"></div>
        <div class="acts"><button class="pri" data-a="spin">🎲 اسحبي اسمًا</button><button data-a="reset">↺ جولة جديدة</button><button data-a="hide">✕ إغلاق</button></div>
        <small class="k">Space = سحب &nbsp;|&nbsp; Esc = إغلاق</small></div>`;
      this.el.onclick = e => { const a = e.target.dataset.a; if (a) this[a](); else if (e.target === this.el) this.hide(); };
      document.body.appendChild(this.el);
    },
    info() {
      const av = this.avail();
      this.el.querySelector('h3').textContent = '🎯 قرعة الأسماء' + (st.cur ? ' — ' + st.cur : '');
      this.el.querySelector('.info').textContent = !st.students.length ? 'لا توجد أسماء — أضيفيها من لوحة الإدارة'
        : av.length ? `اختيرت ${this.picked.filter(n => av.includes(n)).length} من ${av.length} طالبة حاضرة` : 'لا توجد طالبات حاضرات — راجعي التحضير';
      this.el.querySelector('.picked').innerHTML = this.picked.map(n => `<span>${esc(n)}</span>`).join('');
    },
    show() { if (!st.grade) return; this.mount(); this.el.classList.add('on'); this.open = true; this.info(); },
    hide() { if (!this.el) return; this.el.classList.remove('on'); this.open = false; clearTimeout(this.tm); this.spinning = false; },
    toggle() { this.open ? this.hide() : this.show(); },
    reset() { this.picked = []; const nm = this.el.querySelector('.name'); nm.textContent = 'جولة جديدة! 🎲'; nm.classList.remove('win'); this.info(); },
    spin() {
      if (this.spinning) return;
      const av = this.avail(); if (!av.length) return this.info();
      let pool = av.filter(n => !this.picked.includes(n));
      if (!pool.length) { this.picked = []; pool = av.slice(); }
      const winner = pool[Math.floor(Math.random() * pool.length)];
      const nm = this.el.querySelector('.name'); nm.classList.remove('win'); this.spinning = true;
      let n = 0;
      const tick = () => {
        nm.textContent = av[Math.floor(Math.random() * av.length)];
        if (n++ < 22) this.tm = setTimeout(tick, 45 + n * n * 0.35);
        else { nm.textContent = winner; nm.classList.add('win'); this.picked.push(winner); this.spinning = false; this.info(); }
      };
      tick();
    }
  };

  /* ---------- للدروس التي لها قرعة خاصة بها: الشعبة الحالية وأسماء الحاضرات ---------- */
  const listeners = [];
  let opener = null;                  // نافذة القرعة الخاصة بالدرس (إن وُجدت)
  const changed = () => listeners.forEach(f => f());
  function select(c) {
    if (!st.classes[c] || c === st.cur) return;
    st.cur = c; try { localStorage.setItem('att-class', c); } catch (e) {}
    loadAtt(); draw.picked = []; hosts.forEach(paint); changed();
  }

  /* زر القرعة في شريط التحكم + اختصارات لوحة المفاتيح (تسبق أوامر التنقل) */
  function drawButton(after) {
    const b = document.createElement('button');
    b.className = after.className.replace(/\bclap\b/, '').trim();   // نفس شكل أزرار الشريط
    b.title = 'قرعة الأسماء (ق)'; b.textContent = '🎯';
    b.onclick = () => draw.toggle();
    after.insertAdjacentElement('afterend', b);
  }
  addEventListener('keydown', e => {
    if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (draw.open) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (e.key === ' ' || e.key === 'Enter') draw.spin();
      else if (e.key === 'Escape' || e.key === 'ق') draw.hide();
    } else if (e.key === 'ق' && st.grade && !opener) { e.preventDefault(); e.stopImmediatePropagation(); draw.show(); }
  }, true);

  /* تحديث شريحة التحضير إذا عُدّلت الأسماء في لوحة الإدارة */
  watch(() => { if (!st.grade) return; const keep = st.cur; useGrade(st.grade); if (st.classes[keep]) { st.cur = keep; loadAtt(); } draw.picked = []; hosts.forEach(paint); changed(); });

  return {
    KEY, load, watch, attendance, draw, drawButton, use: useGrade, select,
    current: () => st.cur, sections: () => Object.keys(st.classes), present: () => draw.avail(),
    onChange: fn => listeners.push(fn), customDraw: fn => { opener = fn; }
  };
})();
