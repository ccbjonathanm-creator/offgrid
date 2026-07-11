/* ============================================================
   licence.js — essai gratuit (compteur SERVEUR par e-mail) + clé de licence
   signée (ECDSA P-256).

   Essai : la durée (15 j) est désormais suivie CÔTÉ SERVEUR, indexée par
   l'e-mail (haché sur le serveur). But : réinstaller l'app ne redonne pas
   un nouvel essai. Le serveur mémorise la 1re fois qu'il voit l'e-mail.
   Repli honnête : si le serveur est injoignable, on retombe sur un suivi
   local (fail-open) pour ne pas bloquer un utilisateur légitime hors-ligne.

   Licence : la clé est la SIGNATURE DE L'E-MAIL de l'acheteur (normalisé).
   Elle marche sur n'importe quel appareil et survit à une réinstallation.
   La clé privée n'est JAMAIS dans l'app : l'app ne fait que vérifier.
   ============================================================ */
const Licence = (() => {

  // clé PUBLIQUE de vérification (la privée reste chez le vendeur)
  const PUB = { kty:'EC', crv:'P-256',
    x:'eQiiHFcfw2pSv4wGvrgSbDx_lPgD4cHozqZX3RDUAbs',
    y:'F77mu_bbf7oTPPXI0KcQi1ldANmwbx9oRXLhh5ixgHg' };

  const WORKER = 'https://resolv-trials.contactweb71.workers.dev'; // Worker d'essais partagé
  const APP    = 'offgrid';
  const LKEY = 'offgrid.lic';        // état licence (stocké à part : survit à un reset des données)
  const EKEY = 'offgrid.trial_email'; // e-mail d'essai saisi
  const FKEY = 'offgrid.trial_first'; // cache local du first-seen serveur (repli hors-ligne)
  const TRIAL_DAYS = 15;
  let state = null;
  let verified = false;
  let trialEmail = null;
  let serverFirst = null;   // ms, first-seen renvoyé par le serveur (fait foi si connu)
  let serverKnown = false;  // a-t-on eu une réponse serveur cette session ?

  // normalisation IDENTIQUE côté vérif et côté générateur
  const normEmail = e => (e || '').trim().toLowerCase();
  const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail(e));

  function load(){
    try{ state = JSON.parse(localStorage.getItem(LKEY)); }catch(e){ state = null; }
    if (!state || typeof state !== 'object'){
      state = { email:null, key:null, firstLaunch: Date.now() };
      save();
    }
    if (!state.firstLaunch){ state.firstLaunch = Date.now(); save(); }
    try{ trialEmail = localStorage.getItem(EKEY) || null; }catch(e){ trialEmail = null; }
    let f = null; try{ f = parseInt(localStorage.getItem(FKEY)||'', 10); }catch(e){}
    if (Number.isFinite(f)) serverFirst = f;
  }
  function save(){ try{ localStorage.setItem(LKEY, JSON.stringify(state)); }catch(e){} }

  // Interroge le serveur pour connaître le first-seen de cet e-mail (sans rien consommer).
  // Fail-open : en cas d'échec réseau, on garde le cache/local.
  async function fetchTrial(){
    if (!trialEmail) return;
    try{
      const r = await fetch(WORKER + '/api/status', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ app: APP, email: trialEmail })
      });
      if (!r.ok) throw new Error('HTTP_'+r.status);
      const j = await r.json();
      if (typeof j.first === 'number'){
        serverFirst = j.first; serverKnown = true;
        try{ localStorage.setItem(FKEY, String(serverFirst)); }catch(e){}
      }
    }catch(e){ serverKnown = false; /* on garde le repli local */ }
  }

  function hasTrialEmail(){ return !!trialEmail; }
  function getTrialEmail(){ return trialEmail; }
  async function setTrialEmail(e){
    trialEmail = normEmail(e);
    try{ localStorage.setItem(EKEY, trialEmail); }catch(_){}
    await fetchTrial();
  }

  // Point de départ de l'essai : le serveur fait foi ; sinon cache ; sinon local.
  function trialStart(){
    if (Number.isFinite(serverFirst)) return serverFirst;
    return state.firstLaunch;
  }
  function trialDaysLeft(){ return Math.max(0, Math.ceil(TRIAL_DAYS - (Date.now()-trialStart())/864e5)); }
  function trialActive(){ return trialDaysLeft() > 0; }
  function isLicensed(){ return verified; }
  function isPremium(){ return verified || trialActive(); }
  function licensedEmail(){ return verified ? state.email : null; }
  // Faut-il demander l'e-mail au démarrage ? (ni licence, ni e-mail d'essai déjà saisi)
  function needsEmail(){ return !verified && !trialEmail; }

  function b64urlToBuf(s){
    s = s.replace(/-/g,'+').replace(/_/g,'/'); while (s.length % 4) s += '=';
    const bin = atob(s); const buf = new Uint8Array(bin.length);
    for (let i=0;i<bin.length;i++) buf[i] = bin.charCodeAt(i);
    return buf;
  }

  async function verify(keyB64, email){
    try{
      const pub = await crypto.subtle.importKey('jwk', PUB, {name:'ECDSA',namedCurve:'P-256'}, false, ['verify']);
      const sig = b64urlToBuf((keyB64||'').trim());
      const data = new TextEncoder().encode(normEmail(email));
      return await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'}, pub, sig, data);
    }catch(e){ return false; }
  }

  async function init(){
    load();
    verified = (state.key && state.email) ? await verify(state.key, state.email) : false;
    // Si l'essai est en cours (pas de licence) et qu'on a un e-mail, on rafraîchit
    // le first-seen serveur (c'est lui qui empêche la remise à zéro par réinstallation).
    if (!verified && trialEmail) await fetchTrial();
    return verified;
  }

  async function activate(email, keyStr){
    const ok = await verify(keyStr, email);
    if (ok){ state.email = normEmail(email); state.key = (keyStr||'').trim(); save(); verified = true; }
    return ok;
  }

  // Gate e-mail bloquant au démarrage : demande l'e-mail avant d'entrer dans l'app.
  // onDone() est appelé une fois l'e-mail enregistré (ou la licence activée).
  function showEmailGate(onDone){
    const back = document.createElement('div'); back.className = 'sheet-back';
    back.innerHTML = `<div class="sheet">
      <h3>Bienvenue sur Off-Grid Autonomie</h3>
      <p class="hint">Entre ton e-mail pour démarrer ton <b>essai gratuit de ${TRIAL_DAYS} jours</b>. Il sert à garder ton essai même si tu changes ou réinstalles l'application.</p>
      <input type="email" id="ge-email" placeholder="Ton e-mail" autocomplete="email" autocapitalize="off" spellcheck="false" style="margin-top:6px">
      <div id="ge-status" class="hint" style="margin-top:8px"></div>
      <div class="btn-row"><button class="btn" id="ge-go">Commencer l'essai</button></div>
      <div class="spacer"></div>
      <button class="btn ghost" id="ge-licence">J'ai déjà acheté (activer ma licence)</button>
    </div>`;
    document.body.appendChild(back);
    // volontairement NON fermable au clic extérieur : l'e-mail est requis.
    back.querySelector('#ge-go').addEventListener('click', async ()=>{
      const email = back.querySelector('#ge-email').value.trim();
      const st = back.querySelector('#ge-status');
      if (!validEmail(email)){ st.textContent = 'Entre une adresse e-mail valide.'; return; }
      st.textContent = 'Un instant…';
      await setTrialEmail(email);
      back.remove();
      if (typeof onDone === 'function') onDone();
    });
    back.querySelector('#ge-licence').addEventListener('click', ()=>{
      back.remove();
      paywall('Version complète', ()=>{ if (needsEmail()){ showEmailGate(onDone); } else if (typeof onDone==='function'){ onDone(); } });
    });
  }

  // mur payant : bloque une fonctionnalité premium hors essai/licence
  function paywall(feature, onClose){
    const back = document.createElement('div'); back.className = 'sheet-back';
    const trial = trialActive();
    back.innerHTML = `<div class="sheet">
      <h3>★ Fonction Premium</h3>
      <p class="hint">« ${feature} » fait partie de la version complète d'Off-Grid Autonomie.</p>
      ${trial ? `<div class="result" style="margin-top:8px"><b>Essai en cours</b> : il te reste <b>${trialDaysLeft()} jour(s)</b> pour tout tester gratuitement. Déblocage à vie <b>15 €</b>.</div>`
              : `<div class="result" style="margin-top:8px;background:rgba(226,104,60,.1);border-color:rgba(226,104,60,.4)"><b>Ton essai est terminé.</b> Débloque les fonctions premium à vie pour <b>15 €</b> (paiement unique).</div>`}
      <div class="section-title" style="margin:16px 0 6px">Activer une licence — 15 €</div>
      <p class="hint">Saisis l'<b>e-mail utilisé lors de l'achat</b> et la clé qu'on t'a envoyée. Elle marche sur tous tes appareils, même après une réinstallation.</p>
      <input type="email" id="pw-email" placeholder="Ton e-mail d'achat" autocomplete="email" autocapitalize="off" spellcheck="false" style="margin-top:4px">
      <input type="text" id="pw-key" placeholder="Colle ta clé de licence ici" autocomplete="off" style="margin-top:10px">
      <div id="pw-status" class="hint" style="margin-top:8px"></div>
      <div class="btn-row"><button class="btn" id="pw-activate">Activer</button></div>
      <div class="spacer"></div>
      <button class="btn ghost" id="pw-close">${trial?'Continuer l\'essai':'Fermer'}</button>
    </div>`;
    document.body.appendChild(back);
    const close = ()=>{ back.remove(); if (typeof onClose==='function') onClose(); };
    back.addEventListener('click', e=>{ if (e.target===back) close(); });
    back.querySelector('#pw-close').addEventListener('click', close);
    back.querySelector('#pw-activate').addEventListener('click', async ()=>{
      const email = back.querySelector('#pw-email').value.trim();
      const k = back.querySelector('#pw-key').value.trim();
      const st = back.querySelector('#pw-status');
      if (!email){ st.textContent = 'Saisis ton e-mail d\'achat.'; return; }
      if (!k){ st.textContent = 'Colle ta clé de licence.'; return; }
      st.textContent = 'Vérification…';
      const ok = await activate(email, k);
      if (ok){ back.remove(); App.toast('✓ Licence activée, merci !'); App.go(App.current); }
      else { st.textContent = '❌ E-mail ou clé incorrects.'; }
    });
  }

  // garde : renvoie true si accès autorisé, sinon ouvre le paywall et renvoie false
  function guard(feature){
    if (isPremium()) return true;
    paywall(feature);
    return false;
  }

  return { init, isPremium, isLicensed, licensedEmail, trialActive, trialDaysLeft, activate,
           paywall, guard, showEmailGate, needsEmail, hasTrialEmail, getTrialEmail, TRIAL_DAYS };
})();
