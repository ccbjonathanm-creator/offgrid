/* ============================================================
   progression.js — historique, badges, objectifs
   ============================================================ */
const Progression = (() => {

  const CAT_KEYS = [
    { k:'global', label:'Global', color:'#6fd08a' },
    { k:'energie', label:'Énergie', color:'#f4b942' },
    { k:'eau', label:'Eau', color:'#45b0c9' },
    { k:'alimentation', label:'Alim.', color:'#8bc34a' },
    { k:'dechets', label:'Déchets', color:'#b07d46' },
  ];
  let curSerie = 'global';

  const SUGGESTED = [
    'Installer 4 panneaux solaires',
    'Mettre en place 2 cuves de 1000 L',
    'Couvrir 50 % des légumes d\'été',
    'Adopter 3 poules',
    'Passer au chauffage bois',
  ];

  function render(){
    const s = Store.data.scores;
    View.set(`
      ${s ? renderHistory() : ''}
      ${renderBadges()}
      ${renderObjectives()}
    `);
    bind();
  }

  /* ---- Historique ---- */
  function renderHistory(){
    const h = Store.data.history;
    const serie = CAT_KEYS.find(c=>c.k===curSerie);
    const pts = h.map(e=>({ date:e.date, value:e[curSerie] }));
    const chips = CAT_KEYS.map(c=>`<div class="chip ${c.k===curSerie?'on':''}" data-serie="${c.k}">${c.label}</div>`).join('');
    const chart = pts.length ? Charts.line(pts) :
      `<div class="empty" style="padding:20px"><p class="hint">Refais le bilan régulièrement pour voir ta courbe évoluer.</p></div>`;
    const delta = h.length>1 ? (h[h.length-1][curSerie] - h[0][curSerie]) : 0;
    const deltaTxt = h.length>1 ? `<span style="color:${delta>=0?'var(--green-2)':'var(--danger)'}">${delta>=0?'▲ +':'▼ '}${delta} pts depuis le début</span>` : `<span class="muted">${h.length} relevé(s)</span>`;

    return `<div class="card">
      <div class="cat-head" style="font-size:14px"><b>Évolution du score</b>${deltaTxt}</div>
      <div class="chips" style="margin:10px 0">${chips}</div>
      ${chart}
    </div>`;
  }

  /* ---- Badges ---- */
  function renderBadges(){
    const got = new Set(Store.data.badges);
    const total = BADGES.length, n = got.size;
    const grid = BADGES.map(b=>`<div class="badge ${got.has(b.id)?'got':''}">
        <div class="b-ico">${b.icon}</div><div class="b-name">${b.name}</div></div>`).join('');
    return `<div class="section-title">Badges (${n}/${total})</div>
      <div class="card"><div class="badge-grid">${grid}</div></div>`;
  }

  /* ---- Objectifs ---- */
  function renderObjectives(){
    const objs = Store.data.objectives;
    const list = objs.length ? objs.map(o=>`
      <div class="obj ${o.done?'done':''}" data-id="${o.id}">
        <div class="box" style="width:22px;height:22px;border-radius:7px;border:2px solid ${o.done?'var(--green)':'var(--line)'};background:${o.done?'var(--green)':'transparent'};display:flex;align-items:center;justify-content:center;color:#0b1a10;font-size:14px;flex:none" data-toggle="${o.id}">${o.done?'✓':''}</div>
        <div class="otext">${escapeHtml(o.text)}${o.due?`<div class="a-sub">📅 ${o.due}</div>`:''}</div>
        <button class="odel" data-del="${o.id}">🗑️</button>
      </div>`).join('') :
      `<p class="hint" style="text-align:center;padding:8px">Aucun objectif pour l'instant. Fixe-toi un cap concret ci-dessous.</p>`;

    const sugg = SUGGESTED.filter(t=>!objs.some(o=>o.text===t))
      .map(t=>`<div class="chip" data-sugg="${escapeHtml(t)}">+ ${t}</div>`).join('');

    return `<div class="section-title">Mes objectifs</div>
      <div class="card">
        ${list}
        <div class="spacer"></div>
        <input type="text" id="obj-text" placeholder="Nouvel objectif (ex. installer 4 panneaux)">
        <div class="btn-row"><button class="btn small" id="obj-add" style="width:100%">Ajouter cet objectif</button></div>
        ${sugg ? `<div class="section-title" style="margin:14px 0 6px">Suggestions</div><div class="chips">${sugg}</div>`:''}
      </div>`;
  }

  function bind(){
    View.el.querySelectorAll('[data-serie]').forEach(c=>c.addEventListener('click',()=>{ curSerie=c.dataset.serie; render(); }));

    View.el.querySelectorAll('[data-toggle]').forEach(b=>b.addEventListener('click',()=>{
      const o = Store.data.objectives.find(x=>x.id===b.dataset.toggle);
      if (o){ o.done=!o.done; Store.save(); render(); }
    }));
    View.el.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{
      Store.data.objectives = Store.data.objectives.filter(x=>x.id!==b.dataset.del);
      Store.save(); render();
    }));
    const add = View.el.querySelector('#obj-add');
    if (add) add.addEventListener('click',()=>{
      const t = View.el.querySelector('#obj-text').value.trim();
      if (!t) return;
      addObj(t);
    });
    View.el.querySelectorAll('[data-sugg]').forEach(c=>c.addEventListener('click',()=>addObj(c.dataset.sugg)));
  }

  function addObj(text){
    Store.data.objectives.push({ id:'o'+Date.now(), text, done:false, due:'' });
    Store.save(); App.toast('Objectif ajouté'); render();
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  return { render };
})();
