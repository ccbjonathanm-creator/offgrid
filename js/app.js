/* ============================================================
   app.js — état global, persistance, routeur, badges
   ============================================================ */

/* ---------- Vue (zone d'injection) ---------- */
const View = {
  get el(){ return document.getElementById('view'); },
  set(html){ this.el.innerHTML = html; window.scrollTo(0,0); },
};

/* ---------- Store (état + localStorage) ---------- */
const Store = {
  KEY: 'offgrid.v1',
  data: null,
  _retake: false,

  fresh(){
    return { answers:{}, scores:null, target:null, progress:{}, badges:[], objectives:[], history:[] };
  },
  load(){
    try{
      const raw = localStorage.getItem(this.KEY);
      this.data = raw ? JSON.parse(raw) : this.fresh();
    }catch(e){ this.data = this.fresh(); }
    // garde-fous de structure
    const d = this.data, f = this.fresh();
    for (const k in f) if (d[k] == null) d[k] = f[k];
  },
  save(){ try{ localStorage.setItem(this.KEY, JSON.stringify(this.data)); }catch(e){} },
  reset(){ this.data = this.fresh(); this.save(); },

  // nombre de modules terminés (100 %)
  completedCount(){ return MODULES.filter(m => this.moduleDone(m.id)).length; },

  // enregistre les scores + historise (1 point par jour, on écrase celui du jour)
  setScores(s){
    this.data.scores = s;
    if (!this.data.target) this.data.target = s.target;
    this.data._bilanCompleted = this.completedCount(); // repère l'avancement au moment du bilan
    const today = new Date().toISOString().slice(0,10);
    const h = this.data.history;
    const entry = { date: today, global:s.global, energie:s.energie, eau:s.eau, alimentation:s.alimentation, dechets:s.dechets };
    if (h.length && h[h.length-1].date === today) h[h.length-1] = entry;
    else h.push(entry);
    this.save();
  },

  // --- progression des modules ---
  moduleState(id){
    if (!this.data.progress[id]){
      const m = MODULES.find(x=>x.id===id);
      this.data.progress[id] = { checked: new Array(m ? m.checklist.length : 0).fill(false), note:'' };
    }
    return this.data.progress[id];
  },
  toggleCheck(id, i){
    const st = this.moduleState(id);
    st.checked[i] = !st.checked[i];
    this.save();
  },
  setNote(id, txt){ this.moduleState(id).note = txt; this.save(); },
  modulePct(id){
    const m = MODULES.find(x=>x.id===id); if (!m || !m.checklist.length) return 0;
    const st = this.moduleState(id);
    const done = st.checked.filter(Boolean).length;
    return Math.round(100*done/m.checklist.length);
  },
  moduleDone(id){ return this.modulePct(id) >= 100; },

  // progression globale du parcours (sur le niveau cible et en dessous)
  courseProgress(){
    const order = ['peu','moyen','total'];
    const tgt = this.data.target || 'moyen';
    const upto = order.slice(0, order.indexOf(tgt)+1);
    const mods = MODULES.filter(m => upto.includes(m.level));
    if (!mods.length) return 0;
    const sum = mods.reduce((acc,m)=>acc+this.modulePct(m.id),0);
    return Math.round(sum/mods.length);
  },
};

/* ---------- App (routeur + orchestration) ---------- */
const App = {
  current: 'dashboard',

  async boot(){
    Store.load();
    await Licence.init();
    // routeur par onglets
    document.querySelectorAll('.tab').forEach(t=>{
      t.addEventListener('click', ()=>this.go(t.dataset.view));
    });
    document.getElementById('btn-reset').addEventListener('click', ()=>this.settings());
    // première visite -> questionnaire, sinon dashboard
    this.go(Store.data.scores ? 'dashboard' : 'questionnaire');
    this.refreshBadges(true);
    this.registerSW();
  },

  go(view){
    this.current = view;
    document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.view===view));
    if (view==='questionnaire'){ if (!Store._retake) Questionnaire.step = Store.data.scores ? 4 : 0; }
    const R = {
      dashboard: ()=>Dashboard.render(),
      questionnaire: ()=>Questionnaire.render(),
      parcours: ()=>Parcours.render(),
      calculateurs: ()=>Calculateurs.render(),
      progression: ()=>Progression.render(),
    };
    (R[view] || R.dashboard)();
  },

  // recalcule les badges débloqués, toast si nouveau
  refreshBadges(silent){
    if (!Store.data.scores) return;
    const ctx = {
      scores: Store.data.scores,
      answers: Store.data.answers,
      progress: Store.data.progress,
      modulePct: id=>Store.modulePct(id),
      moduleDone: id=>Store.moduleDone(id),
    };
    const before = new Set(Store.data.badges);
    const now = BADGES.filter(b=>{ try{ return b.cond(ctx); }catch(e){ return false; } }).map(b=>b.id);
    Store.data.badges = now;
    Store.save();
    if (!silent){
      const fresh = now.filter(id=>!before.has(id));
      if (fresh.length){
        const b = BADGES.find(x=>x.id===fresh[0]);
        this.toast(`${b.icon} Badge débloqué : ${b.name}`);
      }
    }
  },

  toast(msg){
    let t = document.getElementById('toast');
    if (!t){ t = document.createElement('div'); t.id='toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(this._tt); this._tt = setTimeout(()=>t.classList.remove('show'), 2600);
  },

  // feuille réglages (export / import / reset)
  settings(){
    const back = document.createElement('div');
    back.className = 'sheet-back';
    back.innerHTML = `<div class="sheet">
      <h3>⚙️ Réglages</h3>
      <p class="hint">App 100 % locale : tes données restent sur cet appareil, aucun compte, aucun serveur.</p>
      <div class="btn-row"><button class="btn ghost" id="s-export">Exporter mes données</button></div>
      <div class="btn-row"><button class="btn ghost" id="s-import">Importer une sauvegarde</button></div>
      <input type="file" id="s-file" accept="application/json" hidden>
      <div class="section-title" style="margin:14px 0 6px">Licence</div>
      <div class="result" style="margin-top:0">${App.licenceStatusText()}</div>
      <div class="btn-row"><button class="btn ghost" id="s-licence">${Licence.isLicensed()?'Voir ma licence':'Activer / gérer ma licence'}</button></div>
      <div class="section-title" style="margin:14px 0 6px">Données</div>
      <div class="btn-row"><button class="btn danger" id="s-reset">Tout effacer</button></div>
      <div class="spacer"></div>
      <button class="btn ghost" id="s-close">Fermer</button>
      <p class="hint" style="text-align:center;margin-top:12px">Off-Grid Autonomie · v1</p>
    </div>`;
    document.body.appendChild(back);
    const close = ()=>back.remove();
    back.addEventListener('click', e=>{ if (e.target===back) close(); });
    back.querySelector('#s-close').addEventListener('click', close);
    back.querySelector('#s-export').addEventListener('click', ()=>{
      const blob = new Blob([JSON.stringify(Store.data,null,2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url;
      a.download = `offgrid-sauvegarde-${new Date().toISOString().slice(0,10)}.json`;
      a.click(); URL.revokeObjectURL(url);
      this.toast('Sauvegarde exportée');
    });
    back.querySelector('#s-import').addEventListener('click', ()=>back.querySelector('#s-file').click());
    back.querySelector('#s-file').addEventListener('change', e=>{
      const file = e.target.files[0]; if (!file) return;
      const r = new FileReader();
      r.onload = ()=>{ try{
        const d = JSON.parse(r.result);
        if (!d || typeof d!=='object') throw 0;
        Store.data = Object.assign(Store.fresh(), d); Store.save();
        close(); this.go('dashboard'); this.toast('Sauvegarde importée');
      }catch(err){ this.toast('Fichier invalide'); } };
      r.readAsText(file);
    });
    back.querySelector('#s-licence').addEventListener('click', ()=>{ close(); Licence.paywall('Version complète'); });
    back.querySelector('#s-reset').addEventListener('click', ()=>{
      if (confirm('Effacer toutes tes données off-grid ?')){
        Store.reset(); Questionnaire.step=0; Store._retake=true;
        close(); this.go('questionnaire'); this.toast('Données effacées');
      }
    });
  },

  licenceStatusText(){
    if (Licence.isLicensed()) return '✓ <b>Version complète activée</b> · merci pour ton achat !';
    if (Licence.trialActive()) return `⏳ <b>Essai gratuit</b> : ${Licence.trialDaysLeft()} jour(s) restant(s). Toutes les fonctions premium sont débloquées.`;
    return '🔒 <b>Essai terminé</b>. Active une licence pour débloquer le ROI et le plan PDF.';
  },

  registerSW(){
    if ('serviceWorker' in navigator){
      navigator.serviceWorker.register('service-worker.js').catch(()=>{});
    }
  },
};

document.addEventListener('DOMContentLoaded', ()=>App.boot());
