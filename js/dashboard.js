/* ============================================================
   dashboard.js — tableau de bord
   ============================================================ */
const Dashboard = (() => {

  function render(){
    const s = Store.data.scores;
    if (!s){
      return View.set(`<div class="empty">
        <div class="e-ico">🧭</div>
        <h2>Bienvenue sur Off-Grid Autonomie</h2>
        <p class="hint">Fais le bilan pour découvrir ton niveau d'autonomie et ton parcours personnalisé.</p>
        <div class="spacer"></div>
        <button class="btn" onclick="App.go('questionnaire')">Commencer le bilan →</button>
      </div>`);
    }

    const LL = Questionnaire.LEVEL_LABEL, LI = Questionnaire.LEVEL_ICON;
    const cats = [
      {label:'Énergie', short:'Énergie', icon:'⚡', value:s.energie, color:'#f4b942'},
      {label:'Eau', short:'Eau', icon:'💧', value:s.eau, color:'#45b0c9'},
      {label:'Alimentation', short:'Alim.', icon:'🌱', value:s.alimentation, color:'#8bc34a'},
      {label:'Déchets/chauffage', short:'Déchets', icon:'♻️', value:s.dechets, color:'#b07d46'},
    ];
    const course = Store.courseProgress();
    const target = Store.data.target || s.target;

    View.set(`
      <div class="hero">
        <div class="gauge-wrap">${Charts.gauge(s.global)}</div>
        <div>
          <span class="level-pill">${LI[s.level]} ${LL[s.level]}</span>
          <span class="target-pill">🎯 Cible : ${LL[target]}</span>
        </div>
      </div>

      <div class="card">
        <div class="section-title" style="margin-top:0">Profil d'autonomie</div>
        <div style="display:flex;justify-content:center">${Charts.radar(cats)}</div>
        ${Charts.hbars(cats)}
      </div>

      <div class="card">
        <div class="cat-head" style="font-size:14px"><b>Progression du parcours</b><span class="cat-val">${course}%</span></div>
        <div class="bar" style="height:11px;margin-top:6px"><i style="width:${course}%;background:linear-gradient(90deg,#4caf6d,#8bc34a)"></i></div>
        <p class="hint" style="margin-top:8px">Objectif : atteindre le niveau <b>${LL[target]}</b>.</p>
      </div>

      <div class="section-title">Tes prochaines actions</div>
      ${renderNext()}
    `);
  }

  // prochaines actions : modules non terminés du niveau cible et en dessous,
  // priorisés par catégorie la plus faible, puis par avancement déjà entamé
  function renderNext(){
    const s = Store.data.scores;
    const order = ['peu','moyen','total'];
    const target = Store.data.target || s.target;
    const upto = order.slice(0, order.indexOf(target)+1);
    const catScore = { energie:s.energie, eau:s.eau, alimentation:s.alimentation, dechets:s.dechets };

    let mods = MODULES.filter(m => upto.includes(m.level) && !Store.moduleDone(m.id));
    mods.sort((a,b)=>{
      // priorité au niveau le plus bas, puis catégorie la plus faible, puis déjà commencé
      const lv = order.indexOf(a.level) - order.indexOf(b.level);
      if (lv) return lv;
      const cs = (catScore[a.cat]||0) - (catScore[b.cat]||0);
      if (cs) return cs;
      return Store.modulePct(b.id) - Store.modulePct(a.id);
    });
    const top = mods.slice(0,5);

    if (!top.length){
      return `<div class="card" style="text-align:center">
        <p class="hint">🎉 Tu as complété tous les modules de ton niveau cible. Monte ta cible dans l'onglet Parcours !</p>
      </div>`;
    }
    return top.map(m=>{
      const pct = Store.modulePct(m.id);
      return `<div class="action" onclick="Parcours.open('${m.id}','${m.level}')">
        <div class="a-ico">${m.icon}</div>
        <div class="a-body">
          <div class="a-title">${m.title}</div>
          <div class="a-sub">${labelLevel(m.level)} · ${m.difficulty} · ${m.time}${pct?` · déjà ${pct}%`:''}</div>
        </div>
        <div class="a-go">›</div>
      </div>`;
    }).join('');
  }

  function labelLevel(lvl){ return (LEVELS.find(l=>l.id===lvl)||{}).label || lvl; }

  return { render };
})();
