/* ============================================================
   parcours.js — 3 niveaux, modules, checklists, notes
   ============================================================ */
const Parcours = (() => {

  let curLevel = null;   // niveau affiché
  let openId = null;     // module déplié

  const COST_ICO = { 'Faible':'🟢', 'Moyen':'🟡', 'Élevé':'🔴' };
  const DIFF_ICO = { 'Facile':'😊', 'Moyen':'😐', 'Difficile':'😤' };

  function render(){
    if (!curLevel) curLevel = Store.data.target || 'moyen';
    const target = Store.data.target || 'moyen';

    const tabs = LEVELS.map(l=>{
      const on = l.id===curLevel ? 'on' : '';
      const isTarget = l.id===target ? ' 🎯' : '';
      return `<div class="chip ${on}" data-lvl="${l.id}">${l.icon} ${l.label}${isTarget}</div>`;
    }).join('');

    const lv = LEVELS.find(l=>l.id===curLevel);
    const mods = ModulesByLevel(curLevel);
    const doneCount = mods.filter(m=>Store.moduleDone(m.id)).length;
    const isTarget = curLevel===target;

    View.set(`
      <div class="section-title" style="margin-top:6px">Choisis ton niveau</div>
      <div class="level-tabs">${tabs}</div>
      <div class="card" style="margin-top:10px">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:26px">${lv.icon}</span>
          <div style="flex:1">
            <b>${lv.label} autonome</b>
            <div class="hint">${lv.desc}</div>
          </div>
        </div>
        <div class="cat-head" style="margin-top:12px"><span class="muted">${doneCount}/${mods.length} modules complétés</span>
          <button class="btn small ${isTarget?'ghost':''}" id="set-target" ${isTarget?'disabled':''}>
            ${isTarget?'✓ Ta cible':'Définir comme cible 🎯'}</button></div>
      </div>
      <div id="mods">${mods.map(renderModule).join('')}</div>
    `);
    bind();
    if (openId){
      const node = View.el.querySelector(`.mod[data-id="${openId}"]`);
      if (node){ node.classList.add('open'); node.scrollIntoView({block:'center'}); }
    }
  }

  function renderModule(m){
    const pct = Store.modulePct(m.id);
    const st = Store.moduleState(m.id);
    const checks = m.checklist.map((c,i)=>`
      <div class="check ${st.checked[i]?'on':''}" data-id="${m.id}" data-i="${i}">
        <div class="box">${st.checked[i]?'✓':''}</div>
        <div class="ctext">${c}</div>
      </div>`).join('');

    const calcBtn = m.calc ? `<button class="btn ghost small" data-calc="${m.calc}" style="margin-top:12px;width:100%">🧮 Ouvrir le calculateur associé</button>` : '';

    return `<div class="mod ${openId===m.id?'open':''}" data-id="${m.id}">
      <div class="mod-head" data-toggle="${m.id}">
        <span class="m-ico">${m.icon}</span>
        <span class="m-title">${m.title}</span>
        <span class="m-pct">${pct}%</span>
      </div>
      <div class="mod-mini-bar"><i style="width:${pct}%"></i></div>
      <div class="mod-body">
        <p class="hint" style="margin:12px 0">${m.text}</p>
        <div class="meta-row">
          <span class="meta">${COST_ICO[m.cost]||'💶'} Coût : <b>${m.cost}</b>${m.costEur?` (${m.costEur})`:''}</span>
          <span class="meta">⏱️ Temps : <b>${m.time}</b></span>
          <span class="meta">${DIFF_ICO[m.difficulty]||''} <b>${m.difficulty}</b></span>
        </div>
        <div class="section-title" style="margin:6px 0 4px">Checklist</div>
        ${checks}
        <div class="section-title" style="margin:16px 0 4px">Ma note</div>
        <textarea data-note="${m.id}" placeholder="Idées, matériel acheté, avancement…">${(st.note||'').replace(/</g,'&lt;')}</textarea>
        ${calcBtn}
      </div>
    </div>`;
  }

  function bind(){
    // changement de niveau affiché
    View.el.querySelectorAll('[data-lvl]').forEach(t=>t.addEventListener('click',()=>{
      curLevel = t.dataset.lvl; openId = null; render();
    }));
    // définir comme cible
    const st = View.el.querySelector('#set-target');
    if (st && !st.disabled) st.addEventListener('click',()=>{
      Store.data.target = curLevel; Store.save(); App.toast('Cible mise à jour 🎯'); render();
    });
    // déplier / replier un module
    View.el.querySelectorAll('[data-toggle]').forEach(h=>h.addEventListener('click',()=>{
      const mod = h.closest('.mod'); const id = h.dataset.toggle;
      const willOpen = !mod.classList.contains('open');
      View.el.querySelectorAll('.mod.open').forEach(o=>{ if(o!==mod) o.classList.remove('open'); });
      mod.classList.toggle('open', willOpen);
      openId = willOpen ? id : null;
    }));
    // cocher une action
    View.el.querySelectorAll('.check').forEach(c=>c.addEventListener('click',()=>{
      const id=c.dataset.id, i=+c.dataset.i;
      Store.toggleCheck(id, i);
      // maj visuelle locale sans tout re-render
      c.classList.toggle('on');
      c.querySelector('.box').textContent = c.classList.contains('on') ? '✓' : '';
      const pct = Store.modulePct(id);
      const mod = c.closest('.mod');
      mod.querySelector('.m-pct').textContent = pct+'%';
      mod.querySelector('.mod-mini-bar > i').style.width = pct+'%';
      App.refreshBadges();
    }));
    // notes
    View.el.querySelectorAll('[data-note]').forEach(t=>t.addEventListener('input',()=>{
      Store.setNote(t.dataset.note, t.value);
    }));
    // ouvrir calculateur associé
    View.el.querySelectorAll('[data-calc]').forEach(b=>b.addEventListener('click',()=>{
      Calculateurs.open(b.dataset.calc);
    }));
  }

  // appelé depuis le dashboard (prochaines actions)
  function open(id, level){
    curLevel = level || (MODULES.find(m=>m.id===id)||{}).level || 'peu';
    openId = id;
    App.go('parcours');
  }

  return { render, open };
})();
