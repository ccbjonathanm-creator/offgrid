/* ============================================================
   calculateurs.js — 4 calculateurs off-grid
   ============================================================ */
const Calculateurs = (() => {

  let current = null; // null = menu, sinon 'load'|'solar'|'rain'|'garden'

  // données régionales (France, valeurs indicatives)
  const SUN = [ // heures de soleil crête (kWh/m²/jour) en moyenne annuelle
    { id:'nord', label:'Nord / Est', v:2.9 },
    { id:'ouest', label:'Ouest / Centre', v:3.3 },
    { id:'sudouest', label:'Sud-Ouest', v:3.9 },
    { id:'sud', label:'Sud / Méditerranée', v:4.5 },
  ];
  const RAIN = [ // pluviométrie moyenne mm/an
    { id:'med', label:'Sud / Méditerranée', v:600 },
    { id:'centre', label:'Centre / Bassin parisien', v:700 },
    { id:'nord', label:'Nord / Est', v:850 },
    { id:'ouest', label:'Ouest / Atlantique', v:950 },
    { id:'montagne', label:'Montagne', v:1300 },
  ];

  function store(){ Store.data.calc = Store.data.calc || {}; return Store.data.calc; }
  function persist(){ Store.save(); }

  const MENU = [
    { id:'load',   icon:'🔌', title:'Besoins électriques', sub:'Tes appareils → Wh/jour et kWh/mois' },
    { id:'solar',  icon:'☀️', title:'Panneaux + batteries', sub:'Dimensionne ton système off-grid' },
    { id:'roi',    icon:'💶', title:'Rentabilité (ROI)', sub:'Coût, économies, retour sur investissement', premium:true },
    { id:'rain',   icon:'🌧️', title:'Eau de pluie', sub:'Volume récupérable + cuves' },
    { id:'garden', icon:'🥕', title:'Surface potager', sub:'Combien de m² pour ton objectif' },
  ];

  function render(id){
    if (id) current = id;
    if (!current) return renderMenu();
    // fonctions premium : essai ou licence requis
    if (current === 'roi' && !Licence.guard('Calculateur de rentabilité')){ current = null; return renderMenu(); }
    const R = { load:renderLoad, solar:renderSolar, roi:renderRoi, rain:renderRain, garden:renderGarden };
    (R[current] || renderMenu)();
  }

  function open(id){ current = id; App.go('calculateurs'); }

  function renderMenu(){
    View.set(`
      <div class="section-title" style="margin-top:6px">Calculateurs off-grid</div>
      <p class="hint" style="margin:0 4px 8px">Des estimations réalistes pour dimensionner ton projet. Approximatives : affine avec un pro avant d'acheter.</p>
      ${MENU.map(m=>`<div class="action" data-calc="${m.id}">
        <div class="a-ico">${m.icon}</div>
        <div class="a-body"><div class="a-title">${m.title}${m.premium?' <span class="prem-pill">★ Premium</span>':''}</div><div class="a-sub">${m.sub}</div></div>
        <div class="a-go">›</div>
      </div>`).join('')}
    `);
    View.el.querySelectorAll('[data-calc]').forEach(b=>b.addEventListener('click',()=>{ current=b.dataset.calc; render(); }));
  }

  function header(title){
    return `<div class="qhead" style="margin-bottom:12px">
      <button class="icon-btn" id="c-back" style="width:36px;height:36px">←</button>
      <h2 style="font-size:19px">${title}</h2></div>`;
  }
  function bindBack(){ const b=View.el.querySelector('#c-back'); if(b) b.addEventListener('click',()=>{ current=null; render(); }); }

  /* ---- Localisation réelle (Open-Meteo) ---- */
  function locationBar(kind){
    const g = Geo.get();
    const has = g && ((kind==='sun' && g.sun!=null) || (kind==='rain' && g.rainfall!=null));
    if (has){
      const val = kind==='sun' ? `${String(g.sun).replace('.',',')} kWh/m²/j` : `${g.rainfall.toLocaleString('fr-FR')} mm/an`;
      const lab = kind==='sun' ? 'Ensoleillement réel' : 'Pluviométrie réelle';
      return `<div class="card" style="border-color:rgba(69,176,201,.4);background:rgba(69,176,201,.07);margin-top:0">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:22px">📍</span>
          <div style="flex:1"><b>${g.place}</b><div class="hint">${lab} : <b style="color:var(--water)">${val}</b> · données Open-Meteo</div></div>
        </div>
        <div class="btn-row">
          <button class="btn ghost small" id="loc-change" style="flex:1">Changer de lieu</button>
          <button class="btn ghost small" id="loc-clear" style="flex:1">Moyennes régionales</button>
        </div></div>`;
    }
    return `<div class="card" style="border-style:dashed;margin-top:0">
      <div class="hint">Basé sur des moyennes régionales. Pour un calcul précis à ton adresse :</div>
      <div class="btn-row"><button class="btn small" id="loc-set" style="width:100%">📍 Utiliser ma position réelle</button></div>
    </div>`;
  }

  function bindLocation(reRender){
    const set = View.el.querySelector('#loc-set');
    const change = View.el.querySelector('#loc-change');
    const clr = View.el.querySelector('#loc-clear');
    if (set) set.addEventListener('click', ()=>openLocationPicker(reRender));
    if (change) change.addEventListener('click', ()=>openLocationPicker(reRender));
    if (clr) clr.addEventListener('click', ()=>{ Geo.clear(); reRender(); });
  }

  function openLocationPicker(onDone){
    const back = document.createElement('div'); back.className='sheet-back';
    back.innerHTML = `<div class="sheet">
      <h3>📍 Ta localisation</h3>
      <p class="hint">Ensoleillement et pluviométrie réels via Open-Meteo (gratuit, aucune clé).</p>
      <button class="btn" id="lp-gps">📡 Utiliser ma position GPS</button>
      <div class="section-title" style="margin:16px 0 6px">ou cherche ta commune</div>
      <input type="text" id="lp-city" placeholder="ex. Le Creusot" autocomplete="off">
      <div id="lp-results"></div>
      <div id="lp-status" class="hint" style="margin-top:10px"></div>
      <div class="spacer"></div>
      <button class="btn ghost" id="lp-close">Annuler</button>
    </div>`;
    document.body.appendChild(back);
    const close = ()=>back.remove();
    const status = m => back.querySelector('#lp-status').textContent = m;
    back.addEventListener('click', e=>{ if (e.target===back) close(); });
    back.querySelector('#lp-close').addEventListener('click', close);

    back.querySelector('#lp-gps').addEventListener('click', async ()=>{
      status('Localisation en cours…');
      try{
        const {lat,lon} = await Geo.locate();
        status('Récupération des données climat…');
        await Geo.setLocation(lat, lon, 'Ma position');
        close(); onDone(); App.toast('Localisation activée 📍');
      }catch(e){ status('Échec : ' + e.message + '. Essaie la recherche par commune.'); }
    });

    let t;
    back.querySelector('#lp-city').addEventListener('input', e=>{
      clearTimeout(t);
      const q = e.target.value.trim();
      const box = back.querySelector('#lp-results'); box.innerHTML='';
      if (q.length < 2) return;
      t = setTimeout(async ()=>{
        status('Recherche…');
        try{
          const res = await Geo.searchCity(q);
          status(res.length ? '' : 'Aucune commune trouvée.');
          box.innerHTML = res.map((r,i)=>`<div class="action" data-i="${i}"><div class="a-body"><div class="a-title">${r.place}</div></div><div class="a-go">›</div></div>`).join('');
          box.querySelectorAll('[data-i]').forEach(el=>el.addEventListener('click', async ()=>{
            const r = res[+el.dataset.i];
            status('Récupération des données climat pour ' + r.place + '…');
            try{ await Geo.setLocation(r.lat, r.lon, r.place); close(); onDone(); App.toast('Localisation activée 📍'); }
            catch(err){ status('Échec : ' + err.message); }
          }));
        }catch(err){ status('Recherche indisponible : ' + err.message); }
      }, 400);
    });
  }

  /* ---------------- 1. Besoins électriques ---------------- */
  function renderLoad(){
    const s = store();
    if (!s.load) s.load = { items:[
      {n:'Réfrigérateur', w:150, h:8}, {n:'Éclairage LED', w:60, h:5},
      {n:'Ordinateur portable', w:60, h:4}, {n:'Box internet', w:15, h:24},
    ]};
    const items = s.load.items;

    const rows = items.map((it,i)=>`
      <div class="appliance">
        <input type="text" value="${(it.n||'').replace(/"/g,'&quot;')}" data-i="${i}" data-k="n" placeholder="Appareil">
        <input class="aw" type="number" inputmode="numeric" value="${it.w||''}" data-i="${i}" data-k="w" placeholder="W">
        <input class="ah" type="number" inputmode="decimal" value="${it.h||''}" data-i="${i}" data-k="h" placeholder="h/j">
        <button class="arm" data-rm="${i}" title="Retirer">✕</button>
      </div>`).join('');

    const whDay = items.reduce((a,it)=>a + (+it.w||0)*(+it.h||0), 0);
    const kwhMonth = whDay*30/1000;
    const top = [...items].filter(it=>it.w&&it.h).sort((a,b)=>b.w*b.h-a.w*a.h)[0];

    View.set(`${header('Besoins électriques')}
      <div class="card">
        <div class="hint" style="margin-bottom:6px">Liste tes appareils : puissance (W) et heures d'usage par jour.</div>
        <div class="appliance" style="opacity:.6;font-size:12px"><span style="flex:1">Appareil</span><span class="aw">Watts</span><span class="ah">h/jour</span><span style="width:20px"></span></div>
        ${rows}
        <button class="btn ghost small" id="add-app" style="margin-top:8px">+ Ajouter un appareil</button>
      </div>
      <div class="result">
        <div class="kpi-row">
          <div class="kpi"><div class="k-val">${Math.round(whDay).toLocaleString('fr-FR')}</div><div class="k-lab">Wh / jour</div></div>
          <div class="kpi"><div class="k-val">${kwhMonth.toFixed(1)}</div><div class="k-lab">kWh / mois</div></div>
        </div>
        <div class="r-big">${loadTips(whDay, top)}</div>
        <button class="btn small" id="to-solar" style="width:100%;margin-top:12px">Dimensionner mon solaire pour ${Math.round(whDay)} Wh/j →</button>
      </div>`);

    bindBack();
    View.el.querySelectorAll('input[data-i]').forEach(inp=>inp.addEventListener('input',()=>{
      const i=+inp.dataset.i, k=inp.dataset.k;
      items[i][k] = inp.type==='number' ? (inp.value===''?'':+inp.value) : inp.value;
      persist(); if (k!=='n') renderLoad();
    }));
    View.el.querySelectorAll('[data-rm]').forEach(b=>b.addEventListener('click',()=>{
      items.splice(+b.dataset.rm,1); persist(); renderLoad();
    }));
    View.el.querySelector('#add-app').addEventListener('click',()=>{ items.push({n:'',w:'',h:''}); persist(); renderLoad(); });
    View.el.querySelector('#to-solar').addEventListener('click',()=>{
      store().solar = Object.assign({}, store().solar, { conso: Math.round(whDay) });
      persist(); current='solar'; render();
    });
  }
  function loadTips(wh, top){
    if (!wh) return 'Ajoute tes appareils pour voir ta consommation.';
    let t = `Tu consommes environ <b>${Math.round(wh).toLocaleString('fr-FR')} Wh/jour</b>. `;
    if (top) t += `Ton plus gros poste : <b>${top.n||'un appareil'}</b> (${Math.round(top.w*top.h)} Wh/j). `;
    if (wh > 3000) t += 'Consommation élevée : vise d\'abord la sobriété (LED, appareils A+++, chasse aux veilles) avant d\'agrandir le solaire.';
    else if (wh > 1500) t += 'Consommation moyenne : quelques gestes de sobriété allègeront nettement ton futur solaire.';
    else t += 'Consommation raisonnable : bonne base pour un système off-grid abordable.';
    return t;
  }

  /* ---------------- 2. Panneaux + batteries ---------------- */
  function renderSolar(){
    const s = store();
    if (!s.solar) s.solar = {};
    const c = s.solar;
    if (c.conso==null) c.conso = 2000;
    if (!c.sun)  c.sun  = 'ouest';
    if (!c.days) c.days = 2;
    if (!c.volt) c.volt = 24;
    const g = Geo.get();
    const usingGeo = !!(g && g.sun != null);
    const sun = usingGeo ? g.sun : (SUN.find(x=>x.id===c.sun)||SUN[1]).v;
    const perf = 0.7, dod = 0.8;
    const wc = c.conso>0 ? Math.ceil(c.conso/(sun*perf)/10)*10 : 0;
    const battWh = Math.round(c.conso * (c.days||1) / dod);
    const battAh = c.volt>0 ? Math.round(battWh / c.volt) : 0;
    const nPan = Math.max(0, Math.ceil(wc/400));
    const nBatt = Math.max(0, Math.ceil(battAh/200));

    View.set(`${header('Panneaux + batteries')}
      <div class="card">
        <label class="field"><span class="lab">Consommation journalière <span class="sub">Wh/jour</span></span>
          <input type="number" inputmode="numeric" id="sc-conso" value="${c.conso}"></label>
        ${locationBar('sun')}
        ${usingGeo ? '' : `<label class="field"><span class="lab">Ensoleillement de ta région</span>
          <div class="chips" id="sc-sun">${SUN.map(o=>`<div class="chip ${c.sun===o.id?'on':''}" data-v="${o.id}">${o.label}</div>`).join('')}</div></label>`}
        <label class="field"><span class="lab">Jours d'autonomie souhaités <span class="sub">sans soleil</span></span>
          <div class="toggle" id="sc-days">${[1,2,3,4].map(d=>`<div class="chip ${c.days===d?'on':''}" data-v="${d}">${d} j</div>`).join('')}</div></label>
        <label class="field"><span class="lab">Tension du parc batterie</span>
          <div class="toggle" id="sc-volt">${[12,24,48].map(v=>`<div class="chip ${c.volt===v?'on':''}" data-v="${v}">${v} V</div>`).join('')}</div></label>
      </div>
      <div class="result">
        <div class="kpi-row">
          <div class="kpi"><div class="k-val">${wc.toLocaleString('fr-FR')}</div><div class="k-lab">Wc de panneaux</div></div>
          <div class="kpi"><div class="k-val">${battAh.toLocaleString('fr-FR')}</div><div class="k-lab">Ah @ ${c.volt}V</div></div>
        </div>
        <div class="r-big">
          Pour couvrir <b>${(+c.conso).toLocaleString('fr-FR')} Wh/jour</b>, vise environ <b>${wc.toLocaleString('fr-FR')} Wc</b> de panneaux
          (~<b>${nPan}</b> panneaux de 400 Wc) et <b>${battWh.toLocaleString('fr-FR')} Wh</b> de batteries pour ${c.days} jour(s) d'autonomie,
          soit <b>${battAh.toLocaleString('fr-FR')} Ah</b> en ${c.volt}V (~<b>${nBatt}</b> batteries de 200 Ah).
        </div>
        <p class="hint" style="margin-top:10px">Hypothèses : rendement système 70 %, décharge batterie 80 % (LiFePO4), ensoleillement ${String(sun).replace('.',',')} kWh/m²/j${usingGeo?' (réel)':''}. L'hiver produit 3–4× moins : surdimensionne si tu vises le 100 % annuel.</p>
      </div>`);

    bindBack();
    bindLocation(renderSolar);
    View.el.querySelector('#sc-conso').addEventListener('input',e=>{ c.conso=e.target.value===''?0:+e.target.value; persist(); renderSolar(); });
    View.el.querySelectorAll('#sc-sun .chip').forEach(ch=>ch.addEventListener('click',()=>{ c.sun=ch.dataset.v; persist(); renderSolar(); }));
    View.el.querySelectorAll('#sc-days .chip').forEach(ch=>ch.addEventListener('click',()=>{ c.days=+ch.dataset.v; persist(); renderSolar(); }));
    View.el.querySelectorAll('#sc-volt .chip').forEach(ch=>ch.addEventListener('click',()=>{ c.volt=+ch.dataset.v; persist(); renderSolar(); }));
  }

  /* ---------------- 2 bis. Rentabilité (ROI) ---------------- */
  function estimateSolarCost(){
    const sol = store().solar;
    if (!sol || !sol.conso) return 0;
    const sun = (SUN.find(x=>x.id===sol.sun)||SUN[1]).v;
    const wc = Math.ceil(sol.conso/(sun*0.7)/10)*10;
    const battWh = Math.round(sol.conso*(sol.days||2)/0.8);
    // ~1,2 €/Wc panneaux + ~0,5 €/Wh batteries, +30 % onduleur/pose
    return Math.round((wc*1.2 + battWh*0.5) * 1.3 / 10) * 10;
  }

  function renderRoi(){
    const s = store();
    if (!s.roi) s.roi = {};
    const c = s.roi;
    // pré-remplissages intelligents depuis les autres calculateurs
    if (c.cout == null){ const est = estimateSolarCost(); c.cout = est || 5000; }
    if (c.conso == null){
      const l = s.load; const wh = l && l.items ? l.items.reduce((a,it)=>a+(+it.w||0)*(+it.h||0),0) : 0;
      c.conso = wh ? Math.round(wh*30/1000) : 250;
    }
    if (c.prix == null) c.prix = 0.25;
    if (c.part == null) c.part = 70;

    const consoAn = (+c.conso||0)*12;
    const ecoAn = consoAn * (+c.prix||0) * (+c.part||0)/100;
    const payback = ecoAn>0 ? (+c.cout||0)/ecoAn : 0;
    const net20 = ecoAn*20 - (+c.cout||0);
    const eur = n => Math.round(n).toLocaleString('fr-FR');

    View.set(`${header('Rentabilité (ROI)')}
      <div class="card">
        <div class="hint" style="margin-bottom:6px">Estime en combien de temps ton installation se rembourse grâce aux économies sur ta facture.</div>
        <label class="field"><span class="lab">Coût du système <span class="sub">€, matériel + pose</span></span>
          <input type="number" inputmode="numeric" id="ro-cout" value="${c.cout}">
          ${estimateSolarCost()?`<button class="btn ghost small" id="ro-estim" style="margin-top:8px;width:100%">↺ Estimer depuis mon dimensionnement solaire (${eur(estimateSolarCost())} €)</button>`:''}
        </label>
        <label class="field"><span class="lab">Consommation électrique <span class="sub">kWh/mois</span></span>
          <input type="number" inputmode="numeric" id="ro-conso" value="${c.conso}"></label>
        <label class="field"><span class="lab">Prix du kWh <span class="sub">€ — moyenne France ~0,25</span></span>
          <input type="number" inputmode="decimal" step="0.01" id="ro-prix" value="${c.prix}"></label>
        <label class="field"><span class="lab">Part de ta conso couverte par le système</span>
          <div class="toggle" id="ro-part">${[30,50,70,90].map(p=>`<div class="chip ${c.part===p?'on':''}" data-v="${p}">${p} %</div>`).join('')}</div></label>
      </div>
      <div class="result">
        <div class="kpi-row">
          <div class="kpi"><div class="k-val">${payback>0?payback.toFixed(1).replace('.',','):'—'}</div><div class="k-lab">ans de retour</div></div>
          <div class="kpi"><div class="k-val">${eur(ecoAn)} €</div><div class="k-lab">économie / an</div></div>
        </div>
        <div class="r-big">
          ${payback>0
            ? `Ton système serait remboursé en environ <b>${payback.toFixed(1).replace('.',',')} ans</b>. Sur 20 ans, tu ${net20>=0?'économises':'perds'} environ <b>${eur(Math.abs(net20))} €</b> ${net20>=0?'net':'net (non rentabilisé)'}.`
            : 'Renseigne ta consommation et le prix du kWh pour estimer la rentabilité.'}
        </div>
        <p class="hint" style="margin-top:10px">Estimation simplifiée : hors inflation de l'énergie (qui raccourcit le retour), hors aides/primes, hors remplacement des batteries (~10-15 ans). À affiner avec un devis réel.</p>
      </div>`);

    bindBack();
    const upd = (k,el,num)=>{ el.addEventListener('input',()=>{ c[k]= el.value===''?'':(num? +el.value : el.value); persist(); renderRoi(); }); };
    upd('cout', View.el.querySelector('#ro-cout'), true);
    upd('conso', View.el.querySelector('#ro-conso'), true);
    upd('prix', View.el.querySelector('#ro-prix'), true);
    View.el.querySelectorAll('#ro-part .chip').forEach(ch=>ch.addEventListener('click',()=>{ c.part=+ch.dataset.v; persist(); renderRoi(); }));
    const est = View.el.querySelector('#ro-estim');
    if (est) est.addEventListener('click',()=>{ c.cout = estimateSolarCost(); persist(); renderRoi(); });
  }

  /* ---------------- 3. Eau de pluie ---------------- */
  function renderRain(){
    const s = store();
    if (!s.rain) s.rain = { roof:80, region:'centre', coef:0.8 };
    const c = s.rain;
    const g = Geo.get();
    const usingGeo = !!(g && g.rainfall != null);
    const mm = usingGeo ? g.rainfall : (RAIN.find(x=>x.id===c.region)||RAIN[1]).v;
    const litres = Math.round((+c.roof||0) * mm * (+c.coef||0));
    const cuveM3 = Math.max(1, Math.round(litres/1000 * 0.08)); // ~5-6 semaines de lissage

    View.set(`${header('Eau de pluie')}
      <div class="card">
        <label class="field"><span class="lab">Surface de toit <span class="sub">projetée au sol, m²</span></span>
          <input type="number" inputmode="numeric" id="rc-roof" value="${c.roof}"></label>
        ${locationBar('rain')}
        ${usingGeo ? '' : `<label class="field"><span class="lab">Pluviométrie de ta région</span>
          <div class="chips" id="rc-region">${RAIN.map(o=>`<div class="chip ${c.region===o.id?'on':''}" data-v="${o.id}">${o.label} (${o.v} mm)</div>`).join('')}</div></label>`}
        <label class="field"><span class="lab">Coefficient de récupération <span class="sub">tuile 0,8 · toit plat 0,6</span></span>
          <div class="toggle" id="rc-coef">${[['0.6','0,6'],['0.7','0,7'],['0.8','0,8'],['0.9','0,9']].map(([v,l])=>`<div class="chip ${(+c.coef)===(+v)?'on':''}" data-v="${v}">${l}</div>`).join('')}</div></label>
      </div>
      <div class="result">
        <div class="kpi-row">
          <div class="kpi"><div class="k-val">${(litres/1000).toFixed(1).replace('.',',')}</div><div class="k-lab">m³ / an</div></div>
          <div class="kpi"><div class="k-val">${litres.toLocaleString('fr-FR')}</div><div class="k-lab">litres / an</div></div>
        </div>
        <div class="r-big">
          Avec ${c.roof} m² de toit et ${mm} mm de pluie/an, tu peux récupérer environ <b>${litres.toLocaleString('fr-FR')} litres/an</b>.
          Pour lisser l'année (été sec), prévois une capacité de cuves d'environ <b>${cuveM3} m³</b> (${cuveM3*1000} L).
        </div>
        <p class="hint" style="margin-top:10px">1 mm de pluie sur 1 m² = 1 litre. Usage non potable direct ; filtration + analyse nécessaires pour rendre l'eau potable.</p>
      </div>`);

    bindBack();
    bindLocation(renderRain);
    View.el.querySelector('#rc-roof').addEventListener('input',e=>{ c.roof=e.target.value===''?0:+e.target.value; persist(); renderRain(); });
    View.el.querySelectorAll('#rc-region .chip').forEach(ch=>ch.addEventListener('click',()=>{ c.region=ch.dataset.v; persist(); renderRain(); }));
    View.el.querySelectorAll('#rc-coef .chip').forEach(ch=>ch.addEventListener('click',()=>{ c.coef=+ch.dataset.v; persist(); renderRain(); }));
  }

  /* ---------------- 4. Surface potager ---------------- */
  function renderGarden(){
    const s = store();
    if (!s.garden) s.garden = { pers:2, pct:30, intens:'detente' };
    const c = s.garden;
    // m² pour 100% des légumes d'une personne selon intensité
    const base = c.intens==='intensif' ? 120 : 200;
    const m2 = Math.round((+c.pers||0) * base * (+c.pct||0)/100);

    const cultures = [
      '🍅 Tomates (faciles, productives)','🥒 Courgettes','🥗 Salades (à échelonner)',
      '🥕 Carottes & radis','🫘 Haricots verts','🌿 Herbes aromatiques','🥔 Pommes de terre (rustiques)'
    ];

    View.set(`${header('Surface potager')}
      <div class="card">
        <label class="field"><span class="lab">Personnes dans le foyer</span>
          <div class="toggle" id="gc-pers">${[1,2,3,4,5].map(p=>`<div class="chip ${c.pers===p?'on':''}" data-v="${p}">${p}</div>`).join('')}</div></label>
        <label class="field"><span class="lab">Part de légumes auto-produite visée</span>
          <div class="toggle" id="gc-pct">${[[30,'30 %'],[60,'60 %'],[90,'90 %']].map(([v,l])=>`<div class="chip ${c.pct===v?'on':''}" data-v="${v}">${l}</div>`).join('')}</div></label>
        <label class="field"><span class="lab">Intensité du jardin</span>
          <div class="toggle" id="gc-int">
            <div class="chip ${c.intens==='detente'?'on':''}" data-v="detente">🌼 Détente</div>
            <div class="chip ${c.intens==='intensif'?'on':''}" data-v="intensif">💪 Intensif</div>
          </div></label>
      </div>
      <div class="result">
        <div class="kpi-row">
          <div class="kpi"><div class="k-val">${m2.toLocaleString('fr-FR')}</div><div class="k-lab">m² de potager</div></div>
          <div class="kpi"><div class="k-val">${Math.max(1,Math.round(m2/10))}</div><div class="k-lab">planches de ~10 m²</div></div>
        </div>
        <div class="r-big">
          Pour couvrir <b>${c.pct} %</b> des légumes de <b>${c.pers} personne(s)</b> en mode ${c.intens==='intensif'?'intensif':'détente'},
          vise environ <b>${m2} m²</b> de potager cultivé.
        </div>
        <div class="section-title" style="margin:14px 0 6px">Cultures pour démarrer</div>
        <div class="chips">${cultures.map(x=>`<span class="chip" style="cursor:default">${x}</span>`).join('')}</div>
      </div>`);

    bindBack();
    View.el.querySelectorAll('#gc-pers .chip').forEach(ch=>ch.addEventListener('click',()=>{ c.pers=+ch.dataset.v; persist(); renderGarden(); }));
    View.el.querySelectorAll('#gc-pct .chip').forEach(ch=>ch.addEventListener('click',()=>{ c.pct=+ch.dataset.v; persist(); renderGarden(); }));
    View.el.querySelectorAll('#gc-int .chip').forEach(ch=>ch.addEventListener('click',()=>{ c.intens=ch.dataset.v; persist(); renderGarden(); }));
  }

  return { render, open };
})();
