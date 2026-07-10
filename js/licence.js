/* ============================================================
   licence.js — essai gratuit + clé de licence signée (ECDSA P-256)
   La clé privée n'est JAMAIS dans l'app : seul le vendeur peut
   générer une clé valide. L'app ne fait que vérifier la signature.
   ============================================================ */
const Licence = (() => {

  // clé PUBLIQUE de vérification (la privée reste chez le vendeur)
  const PUB = { kty:'EC', crv:'P-256',
    x:'eQiiHFcfw2pSv4wGvrgSbDx_lPgD4cHozqZX3RDUAbs',
    y:'F77mu_bbf7oTPPXI0KcQi1ldANmwbx9oRXLhh5ixgHg' };

  const LKEY = 'offgrid.lic';      // stocké à part : survit à une remise à zéro des données
  const TRIAL_DAYS = 15;
  let state = null;
  let verified = false;

  function load(){
    try{ state = JSON.parse(localStorage.getItem(LKEY)); }catch(e){ state = null; }
    if (!state || !state.device){
      state = { device: genDevice(), firstLaunch: Date.now(), key: null };
      save();
    }
  }
  function save(){ try{ localStorage.setItem(LKEY, JSON.stringify(state)); }catch(e){} }

  function genDevice(){
    const a = new Uint8Array(12); crypto.getRandomValues(a);
    let s = ''; for (const b of a) s += (b % 36).toString(36);
    return s.toUpperCase().slice(0,12);
  }
  function deviceId(){ return state.device; }
  function devicePretty(){ return state.device.replace(/(.{4})/g,'$1 ').trim(); }

  function trialDaysLeft(){ return Math.max(0, Math.ceil(TRIAL_DAYS - (Date.now()-state.firstLaunch)/864e5)); }
  function trialActive(){ return trialDaysLeft() > 0; }
  function isLicensed(){ return verified; }
  function isPremium(){ return verified || trialActive(); }

  function b64urlToBuf(s){
    s = s.replace(/-/g,'+').replace(/_/g,'/'); while (s.length % 4) s += '=';
    const bin = atob(s); const buf = new Uint8Array(bin.length);
    for (let i=0;i<bin.length;i++) buf[i] = bin.charCodeAt(i);
    return buf;
  }

  async function verify(keyB64, device){
    try{
      const pub = await crypto.subtle.importKey('jwk', PUB, {name:'ECDSA',namedCurve:'P-256'}, false, ['verify']);
      const sig = b64urlToBuf(keyB64.trim());
      const data = new TextEncoder().encode(device);
      return await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'}, pub, sig, data);
    }catch(e){ return false; }
  }

  async function init(){
    load();
    verified = state.key ? await verify(state.key, state.device) : false;
    return verified;
  }

  async function activate(keyStr){
    const ok = await verify(keyStr, state.device);
    if (ok){ state.key = keyStr.trim(); save(); verified = true; }
    return ok;
  }

  // mur payant : bloque une fonctionnalité premium hors essai/licence
  function paywall(feature){
    const back = document.createElement('div'); back.className = 'sheet-back';
    const trial = trialActive();
    back.innerHTML = `<div class="sheet">
      <h3>★ Fonction Premium</h3>
      <p class="hint">« ${feature} » fait partie de la version complète d'Off-Grid Autonomie.</p>
      ${trial ? `<div class="result" style="margin-top:8px"><b>Essai en cours</b> : il te reste <b>${trialDaysLeft()} jour(s)</b> pour tout tester gratuitement.</div>`
              : `<div class="result" style="margin-top:8px;background:rgba(226,104,60,.1);border-color:rgba(226,104,60,.4)"><b>Ton essai est terminé.</b> Active ta licence pour débloquer les fonctions premium à vie.</div>`}
      <div class="section-title" style="margin:16px 0 6px">Activer une licence</div>
      <p class="hint">Ton identifiant d'appareil (à communiquer au vendeur) :</p>
      <div class="devbox" id="pw-dev">${devicePretty()}</div>
      <input type="text" id="pw-key" placeholder="Colle ta clé de licence ici" autocomplete="off" style="margin-top:10px">
      <div id="pw-status" class="hint" style="margin-top:8px"></div>
      <div class="btn-row"><button class="btn" id="pw-activate">Activer</button></div>
      <div class="spacer"></div>
      <button class="btn ghost" id="pw-close">${trial?'Continuer l\'essai':'Fermer'}</button>
    </div>`;
    document.body.appendChild(back);
    const close = ()=>back.remove();
    back.addEventListener('click', e=>{ if (e.target===back) close(); });
    back.querySelector('#pw-close').addEventListener('click', close);
    back.querySelector('#pw-dev').addEventListener('click', ()=>{
      navigator.clipboard && navigator.clipboard.writeText(deviceId()); App.toast('Identifiant copié');
    });
    back.querySelector('#pw-activate').addEventListener('click', async ()=>{
      const k = back.querySelector('#pw-key').value.trim();
      const st = back.querySelector('#pw-status');
      if (!k){ st.textContent = 'Colle ta clé de licence.'; return; }
      st.textContent = 'Vérification…';
      const ok = await activate(k);
      if (ok){ close(); App.toast('✓ Licence activée, merci !'); App.go(App.current); }
      else { st.textContent = '❌ Clé invalide pour cet appareil.'; }
    });
  }

  // garde : renvoie true si accès autorisé, sinon ouvre le paywall et renvoie false
  function guard(feature){
    if (isPremium()) return true;
    paywall(feature);
    return false;
  }

  return { init, isPremium, isLicensed, trialActive, trialDaysLeft, deviceId, devicePretty, activate, paywall, guard, TRIAL_DAYS };
})();
