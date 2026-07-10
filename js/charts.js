/* ============================================================
   charts.js — graphiques SVG faits main (aucune librairie)
   ============================================================ */
const Charts = (() => {

  const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));

  // couleur selon le score (rouge -> orange -> vert)
  function scoreColor(v){
    v = clamp(v);
    if (v < 34) return '#e2683c';
    if (v < 67) return '#f4b942';
    return '#6fd08a';
  }

  /* ---- Jauge circulaire (score global) ---- */
  function gauge(value, { size = 180, label = 'Autonomie' } = {}){
    value = Math.round(clamp(value));
    const r = size/2 - 16;
    const c = 2 * Math.PI * r;
    const off = c * (1 - value/100);
    const col = scoreColor(value);
    return `
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="gauge">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#12211a" stroke-width="14"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${col}" stroke-width="14"
        stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
        transform="rotate(-90 ${size/2} ${size/2})">
        <animate attributeName="stroke-dashoffset" from="${c.toFixed(1)}" to="${off.toFixed(1)}" dur="0.9s" fill="freeze" calcMode="spline" keySplines="0.2 0.8 0.2 1" keyTimes="0;1"/>
      </circle>
      <text x="50%" y="46%" text-anchor="middle" fill="#eaf3ec" font-size="${size*0.28}" font-weight="800">${value}</text>
      <text x="50%" y="62%" text-anchor="middle" fill="#7a9484" font-size="${size*0.09}">/ 100</text>
      <text x="50%" y="78%" text-anchor="middle" fill="${col}" font-size="${size*0.085}" font-weight="700" letter-spacing="1">${label.toUpperCase()}</text>
    </svg>`;
  }

  /* ---- Radar (4 catégories) ---- */
  function radar(cats, { size = 260 } = {}){
    // cats: [{label, value, color}]
    const n = cats.length;
    const cx = size/2, cy = size/2, R = size/2 - 42;
    const ang = i => (-Math.PI/2) + i * (2*Math.PI/n);
    const pt = (i, rad) => [cx + rad*Math.cos(ang(i)), cy + rad*Math.sin(ang(i))];

    let grid = '';
    [0.25,0.5,0.75,1].forEach(f => {
      const p = cats.map((_,i)=>pt(i,R*f).map(x=>x.toFixed(1)).join(',')).join(' ');
      grid += `<polygon points="${p}" fill="none" stroke="#2c4536" stroke-width="1"/>`;
    });
    let axes = '', labels = '';
    cats.forEach((c,i)=>{
      const [x,y] = pt(i,R);
      axes += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#2c4536" stroke-width="1"/>`;
      const [lx,ly] = pt(i,R+22);
      const anchor = Math.abs(lx-cx) < 8 ? 'middle' : (lx > cx ? 'start' : 'end');
      labels += `<text x="${lx.toFixed(1)}" y="${(ly+4).toFixed(1)}" text-anchor="${anchor}" fill="#a9c1b0" font-size="12">${c.icon||''} ${c.short||c.label}</text>`;
    });
    const poly = cats.map((c,i)=>pt(i,R*clamp(c.value)/100).map(x=>x.toFixed(1)).join(',')).join(' ');
    let dots = '';
    cats.forEach((c,i)=>{ const [x,y]=pt(i,R*clamp(c.value)/100); dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${c.color}"/>`; });

    const pad = 40; // marge latérale pour ne pas couper les étiquettes
    return `
    <svg viewBox="${-pad} 0 ${size+2*pad} ${size}" width="100%" style="max-width:${size+2*pad}px" class="radar">
      ${grid}${axes}
      <polygon points="${poly}" fill="rgba(111,208,138,.22)" stroke="#6fd08a" stroke-width="2"/>
      ${dots}${labels}
    </svg>`;
  }

  /* ---- Barres horizontales (générique) ---- */
  function hbars(items){
    // items: [{label, value, color}]
    return items.map(it => {
      const v = Math.round(clamp(it.value));
      const col = it.color || scoreColor(v);
      return `<div class="cat-row">
        <div class="cat-ico">${it.icon||''}</div>
        <div class="cat-body">
          <div class="cat-head"><b>${it.label}</b><span class="cat-val">${v}/100</span></div>
          <div class="bar"><i style="width:${v}%;background:${col}"></i></div>
        </div>
      </div>`;
    }).join('');
  }

  /* ---- Courbe d'historique (score dans le temps) ---- */
  function line(points, { w = 460, h = 170 } = {}){
    // points: [{date, value}]
    if (!points.length) return '';
    const pad = {l:28, r:12, t:14, b:24};
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const n = points.length;
    const xat = i => pad.l + (n === 1 ? iw/2 : iw * i/(n-1));
    const yat = v => pad.t + ih * (1 - clamp(v)/100);

    let grid = '';
    [0,25,50,75,100].forEach(g => {
      const y = yat(g);
      grid += `<line x1="${pad.l}" y1="${y}" x2="${w-pad.r}" y2="${y}" stroke="#2c4536" stroke-width="1" opacity=".6"/>
               <text x="4" y="${y+4}" fill="#7a9484" font-size="10">${g}</text>`;
    });
    const path = points.map((p,i)=>`${i?'L':'M'}${xat(i).toFixed(1)},${yat(p.value).toFixed(1)}`).join(' ');
    const area = `M${xat(0).toFixed(1)},${yat(points[0].value).toFixed(1)} ` +
      points.map((p,i)=>`L${xat(i).toFixed(1)},${yat(p.value).toFixed(1)}`).join(' ') +
      ` L${xat(n-1).toFixed(1)},${(pad.t+ih).toFixed(1)} L${xat(0).toFixed(1)},${(pad.t+ih).toFixed(1)} Z`;
    let dots = points.map((p,i)=>`<circle cx="${xat(i).toFixed(1)}" cy="${yat(p.value).toFixed(1)}" r="3" fill="#6fd08a"/>`).join('');
    // dates aux extrémités
    const fmt = d => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth()+1}`; };
    let xlab = `<text x="${pad.l}" y="${h-6}" fill="#7a9484" font-size="10">${fmt(points[0].date)}</text>`;
    if (n>1) xlab += `<text x="${w-pad.r}" y="${h-6}" text-anchor="end" fill="#7a9484" font-size="10">${fmt(points[n-1].date)}</text>`;

    return `<svg viewBox="0 0 ${w} ${h}" width="100%" class="linechart">
      ${grid}
      <path d="${area}" fill="rgba(111,208,138,.14)"/>
      <path d="${path}" fill="none" stroke="#6fd08a" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}${xlab}
    </svg>`;
  }

  return { gauge, radar, hbars, line, scoreColor, clamp };
})();
