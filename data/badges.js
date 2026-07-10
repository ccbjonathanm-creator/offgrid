/* ============================================================
   badges.js — définitions des badges et leurs conditions
   cond(ctx) reçoit : { scores, progress, modulePct(id), moduleDone(id), answers }
   ============================================================ */
const BADGES = [
  { id:'first_panels', icon:'🔆', name:'Premiers panneaux',
    cond:c => c.moduleDone('p-solaire') || (c.answers.e_source && c.answers.e_source!=='reseau') },
  { id:'solar50', icon:'☀️', name:'50 % solaire',
    cond:c => c.scores.energie >= 50 },
  { id:'compost100', icon:'🪱', name:'100 % compost',
    cond:c => c.moduleDone('p-compost') || c.answers.d_compost==='oui' },
  { id:'rain_on', icon:'🌧️', name:'Eau de pluie activée',
    cond:c => c.moduleDone('p-pluie') || (c.answers.w_cuve && +c.answers.w_cuve>0) },
  { id:'garden50', icon:'🥬', name:'Potager lancé',
    cond:c => c.scores.alimentation >= 50 },
  { id:'water_auto', icon:'💧', name:'Eau maîtrisée',
    cond:c => c.scores.eau >= 60 },
  { id:'poules', icon:'🐔', name:'Basse-cour',
    cond:c => c.moduleDone('m-poules') || c.answers.a_animaux==='oui' },
  { id:'bois', icon:'🔥', name:'Chaleur autonome',
    cond:c => c.answers.d_chauffage==='bois' || c.answers.d_chauffage==='solaire' || c.moduleDone('m-bois') },
  { id:'level_moyen', icon:'🌿', name:'Moyennement autonome',
    cond:c => c.scores.global >= 34 },
  { id:'offgrid80', icon:'🌳', name:'Off-grid 80 %',
    cond:c => c.scores.global >= 80 },
  { id:'offgrid100', icon:'🏆', name:'Off-grid 100 %',
    cond:c => c.scores.global >= 100 },
  { id:'finisher', icon:'✅', name:'Parcours bouclé',
    cond:c => MODULES.every(m => c.moduleDone(m.id)) },
];
