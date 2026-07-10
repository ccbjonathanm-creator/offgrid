/* ============================================================
   questionnaire.js — bilan off-grid + calcul des scores
   ============================================================ */
const Questionnaire = (() => {

  /* ---------- Définition des questions (config) ---------- */
  const CATS = [
    {
      id:'energie', icon:'⚡', short:'Énergie', label:'Énergie / électricité', color:'#f4b942',
      fields:[
        { id:'e_source', type:'choice', q:'Ta source principale d\'électricité ?',
          opts:[['reseau','Réseau (EDF…)'],['solaire','Solaire'],['eolien','Éolien'],['hydro','Hydro'],['groupe','Groupe électrogène'],['autre','Autre']] },
        { id:'e_conso', type:'number', q:'Consommation mensuelle approximative', sub:'en kWh/mois (laisse vide si tu ne sais pas)', unit:'kWh/mois', ph:'ex. 250' },
        { id:'e_bat', type:'toggle', q:'As-tu des batteries de stockage ?', opts:[['oui','Oui'],['non','Non']] },
        { id:'e_bat_cap', type:'number', q:'Capacité des batteries', sub:'optionnel, en Wh', unit:'Wh', ph:'ex. 5000', showIf:a=>a.e_bat==='oui' },
        { id:'e_obj', type:'choice', q:'Ton objectif énergie ?',
          opts:[['reduire','Réduire ma facture'],['partiel','Couvrir une bonne partie'],['total','100 % hors réseau']] },
      ]
    },
    {
      id:'eau', icon:'💧', short:'Eau', label:'Eau', color:'#45b0c9',
      fields:[
        { id:'w_source', type:'choice', q:'Ta source principale d\'eau ?',
          opts:[['reseau','Réseau municipal'],['pluie','Eau de pluie'],['puits','Puits / forage'],['riviere','Rivière / lac'],['autre','Autre']] },
        { id:'w_cuve', type:'number', q:'Volume de cuves de stockage', sub:'0 si aucune, en litres', unit:'litres', ph:'ex. 2000' },
        { id:'w_filtre', type:'toggle', q:'Filtration / traitement de l\'eau ?', opts:[['oui','Oui'],['non','Non']] },
        { id:'w_obj', type:'choice', q:'Ton objectif eau ?',
          opts:[['reduire','Réduire la dépendance'],['partiel','Grande partie autonome'],['total','Autonomie totale']] },
      ]
    },
    {
      id:'alimentation', icon:'🌱', short:'Alim.', label:'Alimentation / jardin', color:'#8bc34a',
      fields:[
        { id:'a_surface', type:'choice', q:'Ta surface de culture ?',
          opts:[['aucun','Aucune'],['balcon','Balcon / jardinières'],['petit','Petit potager (10–30 m²)'],['moyen','Potager moyen (30–100 m²)'],['grand','Grand (100 m²+)']] },
        { id:'a_animaux', type:'toggle', q:'As-tu des animaux (poules, lapins…) ?', opts:[['oui','Oui'],['non','Non']] },
        { id:'a_animaux_type', type:'text', q:'Lesquels et combien ?', sub:'optionnel', ph:'ex. 4 poules', showIf:a=>a.a_animaux==='oui' },
        { id:'a_pct', type:'number', q:'% de ta nourriture produite toi-même', sub:'estimation, de 0 à 100', unit:'%', ph:'ex. 15', min:0, max:100 },
        { id:'a_obj', type:'choice', q:'Quelle part d\'alimentation veux-tu couvrir ?',
          opts:[['reduire','Un peu (herbes, légumes d\'été)'],['partiel','Une bonne partie'],['total','Un maximum']] },
      ]
    },
    {
      id:'dechets', icon:'♻️', short:'Déchets', label:'Déchets / chauffage / cuisine', color:'#b07d46',
      fields:[
        { id:'d_compost', type:'toggle', q:'Fais-tu du compost ?', opts:[['oui','Oui'],['non','Non']] },
        { id:'d_toilettes', type:'toggle', q:'Toilettes sèches ?', opts:[['oui','Oui'],['non','Non']] },
        { id:'d_chauffage', type:'choice', q:'Ton chauffage principal ?',
          opts:[['electrique','Électrique'],['gaz','Gaz'],['bois','Bois'],['solaire','Solaire thermique'],['pac','Pompe à chaleur'],['autre','Autre']] },
        { id:'d_cuisine', type:'choice', q:'Ta cuisson ?',
          opts:[['electrique','Électrique'],['gaz','Gaz'],['bois','Bois / rocket'],['solaire','Solaire'],['autre','Autre']] },
      ]
    },
  ];

  /* ---------- Barèmes de score ---------- */
  const MAP = {
    e_source:{reseau:0,groupe:15,hydro:75,eolien:75,solaire:80,autre:40},
    e_conso: v => v==null||v===''? 50 : (v<150?100 : v<300?70 : v<500?40 : 20),
    e_bat:{oui:100,non:0},
    w_source:{reseau:0,riviere:50,pluie:80,puits:90,autre:40},
    w_cuve: v => { v = +v||0; return v>=10000?100 : v>=5000?85 : v>=1000?60 : v>0?35 : 0; },
    w_filtre:{oui:100,non:0},
    a_surface:{aucun:0,balcon:25,petit:50,moyen:75,grand:100},
    a_animaux:{oui:100,non:0},
    d_compost:{oui:100,non:0},
    d_toilettes:{oui:100,non:0},
    d_chauffage:{electrique:30,gaz:20,bois:100,solaire:100,pac:60,autre:45},
    d_cuisine:{electrique:40,gaz:40,bois:100,solaire:100,autre:50},
  };

  // poids interne de chaque catégorie
  const WEIGHTS = { energie:0.30, eau:0.25, alimentation:0.25, dechets:0.20 };

  function pick(map, key, def=0){ return map[key] != null ? map[key] : def; }

  function computeScores(a){
    a = a || {};
    // Énergie : source .4 / conso .3 / batteries .3
    const energie = Math.round(
      0.40*pick(MAP.e_source, a.e_source) +
      0.30*MAP.e_conso(a.e_conso) +
      0.30*pick(MAP.e_bat, a.e_bat)
    );
    // Eau : source .5 / cuves .3 / filtration .2
    const eau = Math.round(
      0.50*pick(MAP.w_source, a.w_source) +
      0.30*MAP.w_cuve(a.w_cuve) +
      0.20*pick(MAP.w_filtre, a.w_filtre)
    );
    // Alimentation : % perso .55 / surface .3 / animaux .15
    const pct = Math.max(0, Math.min(100, +a.a_pct || 0));
    const alimentation = Math.round(
      0.55*pct +
      0.30*pick(MAP.a_surface, a.a_surface) +
      0.15*pick(MAP.a_animaux, a.a_animaux)
    );
    // Déchets/chauffage : compost .3 / toilettes .2 / chauffage .3 / cuisine .2
    const dechets = Math.round(
      0.30*pick(MAP.d_compost, a.d_compost) +
      0.20*pick(MAP.d_toilettes, a.d_toilettes) +
      0.30*pick(MAP.d_chauffage, a.d_chauffage) +
      0.20*pick(MAP.d_cuisine, a.d_cuisine)
    );
    const global = Math.round(
      WEIGHTS.energie*energie + WEIGHTS.eau*eau +
      WEIGHTS.alimentation*alimentation + WEIGHTS.dechets*dechets
    );
    return { energie, eau, alimentation, dechets, global,
             level: levelOf(global), target: recommendedTarget(global) };
  }

  function levelOf(g){ return g<=33 ? 'peu' : g<=66 ? 'moyen' : 'total'; }
  // cible = le palier juste au-dessus (cap atteignable), plafonné à "total"
  function recommendedTarget(g){ return g<=33 ? 'moyen' : g<=66 ? 'total' : 'total'; }

  const LEVEL_LABEL = { peu:'Un peu autonome', moyen:'Moyennement autonome', total:'Totalement autonome' };
  const LEVEL_ICON  = { peu:'🌱', moyen:'🌿', total:'🌳' };

  /* ---------- Rendu du questionnaire (multi-étapes) ---------- */
  let step = 0; // 0..3 catégories, 4 = résultat

  function render(){
    const a = Store.data.answers;
    const done = !!Store.data.scores;
    // si déjà rempli et qu'on revient dessus, proposer de repartir du récap
    if (done && step === 0 && !Store._retake){ step = 4; }
    if (step >= CATS.length) return renderResult();

    const cat = CATS[step];
    const visible = cat.fields.filter(f => !f.showIf || f.showIf(a));
    const prog = CATS.map((_,i)=> i<step?'done':i===step?'cur':'').map(c=>`<i class="${c}"></i>`).join('');

    let html = `<div class="qstep">
      <div class="qprog">${prog}</div>
      <div class="qhead"><span class="qi">${cat.icon}</span><h2>${cat.label}</h2></div>
      <p class="hint">Étape ${step+1} sur ${CATS.length}. Réponds au mieux, tu pourras revenir plus tard.</p>`;

    visible.forEach(f => { html += renderField(f, a[f.id]); });

    html += `<div class="btn-row">
        ${step>0 ? `<button class="btn ghost" id="q-prev">← Retour</button>` : ''}
        <button class="btn" id="q-next">${step<CATS.length-1?'Suivant →':'Voir mon score →'}</button>
      </div></div>`;

    View.set(html);
    bind(cat, visible);
  }

  function renderField(f, val){
    const id = f.id;
    let inner = '';
    if (f.type === 'choice' || f.type === 'toggle'){
      const cls = f.type==='toggle' ? 'toggle' : 'chips';
      inner = `<div class="${cls}" data-field="${id}">` +
        f.opts.map(([v,lab])=>`<div class="chip ${val===v?'on':''}" data-val="${v}">${lab}</div>`).join('') +
        `</div>`;
    } else if (f.type === 'number'){
      inner = `<input type="number" inputmode="decimal" data-field="${id}" value="${val!=null?val:''}"
                 placeholder="${f.ph||''}" ${f.min!=null?`min="${f.min}"`:''} ${f.max!=null?`max="${f.max}"`:''}>`;
    } else if (f.type === 'text'){
      inner = `<input type="text" data-field="${id}" value="${val!=null?String(val).replace(/"/g,'&quot;'):''}" placeholder="${f.ph||''}">`;
    }
    return `<label class="field">
      <span class="lab">${f.q}${f.sub?` <span class="sub">— ${f.sub}</span>`:''}</span>
      ${inner}
    </label>`;
  }

  function bind(cat, visible){
    // chips / toggles
    View.el.querySelectorAll('[data-field] .chip').forEach(chip=>{
      chip.addEventListener('click', ()=>{
        const wrap = chip.closest('[data-field]');
        const field = wrap.dataset.field;
        wrap.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));
        chip.classList.add('on');
        Store.data.answers[field] = chip.dataset.val;
        Store.save();
        // certains champs conditionnels apparaissent/disparaissent
        if (cat.fields.some(f=>f.showIf)) render();
      });
    });
    // inputs
    View.el.querySelectorAll('input[data-field]').forEach(inp=>{
      inp.addEventListener('input', ()=>{
        const v = inp.type==='number' ? (inp.value===''?'':+inp.value) : inp.value;
        Store.data.answers[inp.dataset.field] = v;
        Store.save();
      });
    });
    const next = View.el.querySelector('#q-next');
    if (next) next.addEventListener('click', ()=>{ step++; Store._retake=true; render(); });
    const prev = View.el.querySelector('#q-prev');
    if (prev) prev.addEventListener('click', ()=>{ step--; render(); });
  }

  function renderResult(){
    const a = Store.data.answers;
    const s = computeScores(a);
    Store.setScores(s);   // enregistre + historise
    Store._retake = false;

    const cats = [
      {label:'Énergie', icon:'⚡', value:s.energie, color:'#f4b942'},
      {label:'Eau', icon:'💧', value:s.eau, color:'#45b0c9'},
      {label:'Alimentation', icon:'🌱', value:s.alimentation, color:'#8bc34a'},
      {label:'Déchets/chauffage', icon:'♻️', value:s.dechets, color:'#b07d46'},
    ];

    View.set(`
      <div class="hero">
        <div class="gauge-wrap">${Charts.gauge(s.global)}</div>
        <div>
          <span class="level-pill">${LEVEL_ICON[s.level]} Niveau : ${LEVEL_LABEL[s.level]}</span>
        </div>
        <p class="hint" style="margin-top:14px">${resultMsg(s)}</p>
      </div>
      <div class="card">
        <div class="section-title" style="margin-top:0">Détail par catégorie</div>
        ${Charts.hbars(cats)}
      </div>
      <div class="card" style="text-align:center">
        <div class="section-title" style="margin-top:0">Ta cible recommandée</div>
        <p class="hint">Pour progresser, vise le palier <b style="color:var(--sun)">${LEVEL_LABEL[s.target]}</b>. Ton parcours est prêt.</p>
        <div class="btn-row">
          <button class="btn ghost small" id="r-retake" style="flex:0 0 auto">Refaire le bilan</button>
          <button class="btn" id="r-go">Voir mon parcours →</button>
        </div>
      </div>
    `);
    View.el.querySelector('#r-go').addEventListener('click', ()=>{ Store.data.target = s.target; Store.save(); App.go('parcours'); });
    View.el.querySelector('#r-retake').addEventListener('click', ()=>{ step=0; Store._retake=true; render(); });
    App.refreshBadges();
  }

  function resultMsg(s){
    const worst = [['énergie',s.energie],['eau',s.eau],['alimentation',s.alimentation],['déchets/chauffage',s.dechets]]
      .sort((a,b)=>a[1]-b[1])[0];
    return `Ton point le plus faible : <b>${worst[0]}</b> (${worst[1]}/100). C'est là que tu gagneras le plus de points en premier.`;
  }

  function restart(){ step = 0; Store._retake = true; }

  return { render, computeScores, levelOf, restart, CATS, LEVEL_LABEL, LEVEL_ICON,
           get step(){return step;}, set step(v){step=v;} };
})();
