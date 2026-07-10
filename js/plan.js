/* ============================================================
   plan.js — génère "Mon plan d'autonomie" (rapport imprimable / PDF)
   Sans librairie : rapport HTML thème clair + window.print()
   ============================================================ */
const Plan = (() => {

  const LL = () => Questionnaire.LEVEL_LABEL;
  const catMeta = [
    { k:'energie', label:'Énergie', icon:'⚡' },
    { k:'eau', label:'Eau', icon:'💧' },
    { k:'alimentation', label:'Alimentation', icon:'🌱' },
    { k:'dechets', label:'Déchets / chauffage', icon:'♻️' },
  ];

  function bar(v){
    const col = v<34?'#c9502e':v<67?'#c98a1e':'#2e8b57';
    return `<div style="background:#e7ede8;border-radius:6px;height:10px;overflow:hidden">
      <div style="width:${v}%;height:100%;background:${col}"></div></div>`;
  }

  // actions prioritaires : modules non terminés du niveau cible et en dessous, par catégorie faible
  function priorities(){
    const s = Store.data.scores;
    const order = ['peu','moyen','total'];
    const target = Store.data.target || s.target;
    const upto = order.slice(0, order.indexOf(target)+1);
    const catScore = { energie:s.energie, eau:s.eau, alimentation:s.alimentation, dechets:s.dechets };
    let mods = MODULES.filter(m => upto.includes(m.level) && !Store.moduleDone(m.id));
    mods.sort((a,b)=>(catScore[a.cat]-catScore[b.cat]) || (order.indexOf(a.level)-order.indexOf(b.level)));
    return mods.slice(0,6);
  }

  function calcSummary(){
    const c = Store.data.calc || {};
    const rows = [];
    if (c.solar && c.solar.conso){
      const g = Geo.get();
      const sunV = (g && g.sun!=null) ? g.sun : 3.3;
      const wc = Math.ceil(c.solar.conso/(sunV*0.7)/10)*10;
      const battWh = Math.round(c.solar.conso*(c.solar.days||2)/0.8);
      const battAh = Math.round(battWh/(c.solar.volt||24));
      rows.push(['☀️ Solaire', `${wc.toLocaleString('fr-FR')} Wc de panneaux · ${battAh.toLocaleString('fr-FR')} Ah @ ${c.solar.volt||24}V (${battWh.toLocaleString('fr-FR')} Wh) pour ${c.solar.days||2} j d'autonomie`]);
    }
    if (c.load && c.load.items){
      const wh = c.load.items.reduce((a,it)=>a+(+it.w||0)*(+it.h||0),0);
      if (wh) rows.push(['🔌 Besoins élec', `${Math.round(wh).toLocaleString('fr-FR')} Wh/jour · ${(wh*30/1000).toFixed(0)} kWh/mois`]);
    }
    if (c.rain && c.rain.roof){
      const g = Geo.get();
      const mm = (g && g.rainfall!=null) ? g.rainfall : 700;
      const litres = Math.round(c.rain.roof*mm*(c.rain.coef||0.8));
      rows.push(['🌧️ Eau de pluie', `${litres.toLocaleString('fr-FR')} litres/an récupérables · cuves ~${Math.max(1,Math.round(litres/1000*0.08))} m³`]);
    }
    if (c.garden && c.garden.pers){
      const base = c.garden.intens==='intensif'?120:200;
      const m2 = Math.round(c.garden.pers*base*(c.garden.pct||30)/100);
      rows.push(['🥕 Potager', `${m2} m² pour couvrir ${c.garden.pct||30} % des légumes de ${c.garden.pers} pers.`]);
    }
    if (c.roi && c.roi.cout){
      const consoAn = (+c.roi.conso||0)*12;
      const ecoAn = consoAn*(+c.roi.prix||0)*(+c.roi.part||0)/100;
      const pay = ecoAn>0 ? (+c.roi.cout/ecoAn).toFixed(1).replace('.',',') : '—';
      rows.push(['💶 Rentabilité', `Système ~${(+c.roi.cout).toLocaleString('fr-FR')} € · économie ~${Math.round(ecoAn).toLocaleString('fr-FR')} €/an · retour ${pay} ans`]);
    }
    return rows;
  }

  function buildHtml(){
    const s = Store.data.scores;
    const g = Geo.get();
    const target = Store.data.target || s.target;
    const date = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });

    const catRows = catMeta.map(c=>`
      <tr><td style="padding:6px 10px 6px 0;white-space:nowrap">${c.icon} ${c.label}</td>
      <td style="width:60%;padding:6px 0">${bar(s[c.k])}</td>
      <td style="padding:6px 0 6px 10px;text-align:right;font-weight:700">${s[c.k]}/100</td></tr>`).join('');

    const prio = priorities();
    const prioHtml = prio.length ? prio.map((m,i)=>`
      <div style="margin:8px 0;padding:10px 12px;background:#f3f7f3;border-left:3px solid #2e8b57;border-radius:6px">
        <b>${i+1}. ${m.icon} ${m.title}</b>
        <div style="color:#556;font-size:13px;margin-top:2px">Coût : ${m.cost}${m.costEur?` (${m.costEur})`:''} · Temps : ${m.time} · ${m.difficulty}</div>
      </div>`).join('') : '<p>Tous les modules de ton niveau cible sont terminés. Bravo !</p>';

    const calc = calcSummary();
    const calcHtml = calc.length ? `<table style="width:100%;border-collapse:collapse">${calc.map(([k,v])=>`
      <tr><td style="padding:6px 10px 6px 0;vertical-align:top;white-space:nowrap;font-weight:600">${k}</td>
      <td style="padding:6px 0;color:#334">${v}</td></tr>`).join('')}</table>`
      : '<p style="color:#778">Utilise les calculateurs de l\'app pour ajouter ici ton dimensionnement solaire, eau et potager.</p>';

    const objs = (Store.data.objectives||[]).filter(o=>!o.done);
    const objHtml = objs.length ? `<ul style="margin:6px 0;padding-left:20px">${objs.map(o=>`<li style="margin:4px 0">${esc(o.text)}</li>`).join('')}</ul>`
      : '<p style="color:#778">Aucun objectif en cours.</p>';

    return `<div id="plan-print">
      <div class="plan-doc">
        <div class="plan-head">
          <div>
            <div class="plan-title">Mon Plan d'Autonomie</div>
            <div class="plan-sub">${date}${g?` · ${esc(g.place)}`:''}</div>
          </div>
          <div class="plan-logo">⛰️ Off-Grid<br><b>Autonomie</b></div>
        </div>

        <div class="plan-score">
          <div class="plan-score-big">${s.global}<span>/100</span></div>
          <div>
            <div style="font-size:15px">Niveau actuel : <b>${LL()[s.level]}</b></div>
            <div style="font-size:15px;color:#2e8b57">Cible visée : <b>${LL()[target]}</b></div>
          </div>
        </div>

        <h3 class="plan-h">Détail par catégorie</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px">${catRows}</table>

        <h3 class="plan-h">Tes actions prioritaires</h3>
        ${prioHtml}

        <h3 class="plan-h">Tes dimensionnements</h3>
        ${calcHtml}

        <h3 class="plan-h">Tes objectifs</h3>
        ${objHtml}

        <div class="plan-foot">
          Généré par Off-Grid Autonomie · Estimations à affiner avec des devis réels avant tout achat.
        </div>
      </div>
    </div>`;
  }

  function open(){
    if (!Store.data.scores){ App.toast('Fais d\'abord ton bilan'); return; }
    if (!Licence.guard('Mon plan d\'autonomie (PDF)')) return;
    const back = document.createElement('div');
    back.id = 'plan-overlay';
    back.innerHTML = `
      <div class="plan-actions">
        <button class="btn ghost small" id="plan-close">← Fermer</button>
        <button class="btn small" id="plan-print-btn">🖨️ Imprimer / Enregistrer en PDF</button>
      </div>
      ${buildHtml()}`;
    document.body.appendChild(back);
    document.body.style.overflow = 'hidden';
    const close = ()=>{ back.remove(); document.body.style.overflow=''; };
    back.querySelector('#plan-close').addEventListener('click', close);
    back.querySelector('#plan-print-btn').addEventListener('click', ()=>{
      App.toast('Choisis « Enregistrer en PDF » dans le menu d\'impression');
      setTimeout(()=>window.print(), 250);
    });
  }

  function esc(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  return { open };
})();
