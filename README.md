# Off-Grid Autonomie 🌳

PWA mobile (installable, 100 % locale et hors-ligne) pour les personnes qui veulent **sortir du système** et devenir autonomes en **électricité**, **eau**, **alimentation** et **gestion des déchets / chauffage**.

Elle évalue ton niveau d'autonomie, te donne un score par catégorie, te propose un **parcours progressif** (modules + checklists), des **calculateurs** de dimensionnement (solaire, batteries, eau de pluie, potager) et un suivi **gamifié** (badges, objectifs, courbe d'évolution).

---

## Le concept

L'autonomie ne se décrète pas, elle se construit palier par palier. L'app part de **là où tu en es**, chiffre ta dépendance aux réseaux, puis te guide vers un cap **atteignable** :

- **🌱 Un peu autonome** : réduire la dépendance sans tout changer.
- **🌿 Moyennement autonome** : couvrir une grande partie des besoins, tenir une coupure.
- **🌳 Totalement autonome** : viser l'off-grid, vivre hors réseau ou quasi.

Aucun compte, aucun serveur, aucune donnée qui part ailleurs : **tout reste sur ton téléphone**.

---

## Fonctionnalités

- **Bilan off-grid** : questionnaire en 4 catégories (énergie, eau, alimentation, déchets/chauffage).
- **Scores** : un score global 0–100 + un score par catégorie, un niveau actuel et un niveau cible recommandé.
- **Tableau de bord** : jauge circulaire, radar des catégories, barres de détail, progression du parcours, 3–5 prochaines actions priorisées sur ton point faible.
- **Parcours** : 3 niveaux, 17 modules avec explication, checklist d'actions, estimation coût / temps / difficulté, note personnelle, pourcentage d'avancement.
- **Calculateurs** :
  - Besoins électriques (appareils → Wh/jour et kWh/mois + conseils),
  - Dimensionnement panneaux + batteries (Wc, Ah, nb de panneaux/batteries, jours d'autonomie, tension),
  - Eau de pluie (surface toit × pluviométrie × coefficient → litres/an + cuves),
  - Surface potager (personnes × objectif × intensité → m² + cultures de base).
- **Progression / gamification** : courbe d'évolution du score (global + par catégorie), 12 badges, objectifs personnels avec suggestions.
- **Réglages** : export / import de tes données en fichier JSON, remise à zéro.
- **PWA** : installable sur l'écran d'accueil, fonctionne 100 % hors-ligne, mises à jour automatiques.

---

## Stack technique

Volontairement **sans framework et sans build**, dans l'esprit des autres PWA du projet (Coffre, Valise, Prisme) :

- **HTML5 + CSS pur + JavaScript vanilla** (aucune dépendance, aucun `npm install`).
- **Graphiques faits main en SVG** (jauge, radar, barres, courbe) : aucune librairie externe.
- **Stockage** : `localStorage` (profil, réponses, scores, progression, badges, objectifs, historique).
- **PWA** : `manifest.json` + `service-worker.js` (hors-ligne, MAJ auto en "réseau d'abord").
- **Sécurité** : **CSP stricte** (aucun script distant autorisé), tout est embarqué en local.

### Structure des fichiers

```
offgrid_app/
├── index.html            # coquille + navigation (5 onglets) + CSP
├── css/style.css         # thème nature / off-grid, mobile-first
├── js/
│   ├── app.js            # état global, persistance, routeur, badges, réglages
│   ├── charts.js         # helpers SVG (jauge, radar, barres, courbe)
│   ├── questionnaire.js  # questions + calcul des scores
│   ├── dashboard.js      # tableau de bord
│   ├── parcours.js       # 3 niveaux, modules, checklists, notes
│   ├── calculateurs.js   # 4 calculateurs
│   └── progression.js    # historique, badges, objectifs
├── data/
│   ├── modules.js        # contenu des modules (textes, checklists, coûts…)
│   └── badges.js         # définitions et conditions des badges
├── icons/                # icônes PWA (+ generate_icons.py, Pillow)
├── manifest.json
└── service-worker.js
```

---

## Lancer en local

Aucune dépendance à installer. Il faut juste servir le dossier en HTTP (le service worker ne marche pas en `file://`).

```bash
cd offgrid_app
python -m http.server 5064
```

Puis ouvre **http://localhost:5064** dans le navigateur.

Pour régénérer les icônes (optionnel, nécessite Pillow) :

```bash
pip install pillow
python icons/generate_icons.py
```

---

## Déployer en ligne (GitHub Pages, gratuit)

Même méthode que Coffre / Valise / Portail :

1. Créer un dépôt public (ex. `offgrid`) et y copier **le contenu** de `offgrid_app/` **à la racine** du dépôt.
2. Pousser, puis activer **GitHub Pages** (Settings → Pages → branche `main`, dossier `/root`).
3. L'app est en ligne en HTTPS (obligatoire pour installer une PWA), ex. `https://<utilisateur>.github.io/offgrid/`.
4. Sur Android : ouvrir l'URL, menu → **Ajouter à l'écran d'accueil**.

Rattachable à la marque **generationapp.fr** (sous-dossier ou sous-domaine).

---

## Comment la modifier

- **Ajouter / changer un module** : édite `data/modules.js` (un objet par module : `level`, `cat`, `icon`, `title`, `text`, `checklist`, `cost`, `costEur`, `time`, `difficulty`, `calc`). Rien d'autre à toucher, le parcours et le tableau de bord s'adaptent.
- **Changer la logique de score** : tout est dans `js/questionnaire.js` (barèmes `MAP`, poids `WEIGHTS`, seuils de niveau `levelOf`).
- **Ajouter un badge** : ajoute une entrée dans `data/badges.js` avec une condition `cond(ctx)`.
- **Ajouter / ajuster un calculateur** : `js/calculateurs.js` (les valeurs régionales `SUN` et `RAIN` sont en haut).
- **Thème visuel** : variables CSS en haut de `css/style.css`.
- **Version / cache** : après une modif, incrémente `CACHE` dans `service-worker.js` (`offgrid-v1` → `offgrid-v2`) pour forcer la MAJ.

---

## Pistes d'évolution

- **Monétisation SaaS / premium** : modules avancés payants (plans détaillés de tiny house, dimensionnement pro, listes de matériel avec liens), export PDF d'un « plan d'autonomie » personnalisé.
- **Contenu avancé** : fiches détaillées par culture / région, base de matériel avec prix indicatifs, checklists imprimables.
- **Communauté** (nécessiterait un backend, à ajouter plus tard) : partage de setups off-grid, retours d'expérience, comparaison anonyme de scores par région.
- **Données réelles** : brancher une API météo/ensoleillement (ex. Open-Meteo, déjà utilisée dans Valise) pour un dimensionnement solaire et pluie basé sur la localisation exacte.
- **Rappels** : notifications locales pour les objectifs trimestriels et les tâches saisonnières du potager.
- **Mode IA** (BYOK, comme Prisme) : un assistant qui répond aux questions off-grid à partir d'une clé gratuite de l'utilisateur.

---

*100 % local · hors-ligne · sans compte · tes données restent sur ton appareil.*
