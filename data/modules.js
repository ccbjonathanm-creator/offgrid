/* ============================================================
   modules.js — contenu du parcours (3 niveaux)
   Chaque module : id, level, cat, icon, title, text, checklist,
   cost/time/difficulty, calc (calculateur lié éventuel)
   ============================================================ */
const MODULES = [

  /* ===================== NIVEAU : UN PEU ===================== */
  {
    id:'p-conso', level:'peu', cat:'energie', icon:'🔌',
    title:'Comprendre sa consommation électrique',
    text:`On ne réduit bien que ce qu'on mesure. Repère tes gros postes (chauffage, eau chaude, frigo, congélateur, plaques). Un simple wattmètre à brancher (10–20 €) révèle les appareils gourmands et les consommations "cachées" en veille. C'est l'étape zéro de tout projet off-grid : chaque watt économisé, c'est du solaire et des batteries en moins à acheter plus tard.`,
    checklist:[
      'Relever ma consommation annuelle en kWh (facture ou compteur Linky)',
      'Lister mes 5 appareils les plus gourmands',
      'Mesurer 2–3 appareils au wattmètre',
      'Traquer les veilles (box, chargeurs, TV)',
      'Noter un objectif de réduction (ex. -15 %)',
    ],
    cost:'Faible', costEur:'10–20 €', time:'2–3 h', difficulty:'Facile', calc:'load',
  },
  {
    id:'p-solaire', level:'peu', cat:'energie', icon:'☀️',
    title:'Installer ses premiers panneaux (kit débutant)',
    text:`Un kit solaire "plug & play" ou une petite station portable (300–800 Wc) permet de se faire la main sans gros investissement ni travaux. Idéal pour alimenter un frigo d'appoint, recharger téléphones/ordinateurs, ou tenir une coupure. Tu apprends les bases (Wc, Wh, régulateur, onduleur) avant de dimensionner plus grand.`,
    checklist:[
      'Choisir entre station portable et kit à poser',
      'Vérifier une zone bien ensoleillée (sud, sans ombre)',
      'Calculer ce que je veux alimenter (Wh/jour)',
      'Acheter et installer le kit',
      'Suivre la production quelques jours',
    ],
    cost:'Moyen', costEur:'300–800 €', time:'1–2 jours', difficulty:'Facile', calc:'solar',
  },
  {
    id:'p-potager', level:'peu', cat:'alimentation', icon:'🥕',
    title:'Démarrer un petit potager',
    text:`Balcon en jardinières ou 10–20 m² de terre : commence petit pour ne pas te décourager. Vise des cultures faciles et rentables (tomates, courgettes, salades, radis, herbes aromatiques). L'objectif n'est pas l'autonomie tout de suite, mais d'apprendre le geste, le rythme des saisons et d'avoir tes premières récoltes.`,
    checklist:[
      'Choisir un emplacement (min. 6 h de soleil)',
      'Préparer le sol ou les bacs (terreau/compost)',
      'Semer 4–5 cultures faciles',
      'Mettre en place un arrosage régulier',
      'Récolter et noter ce qui a marché',
    ],
    cost:'Faible', costEur:'30–100 €', time:'Quelques week-ends', difficulty:'Facile', calc:'garden',
  },
  {
    id:'p-compost', level:'peu', cat:'dechets', icon:'🪱',
    title:'Mettre en place un compost simple',
    text:`Un composteur (acheté ou fait en palettes) transforme tes déchets de cuisine et de jardin en terreau gratuit. Tu réduis tes poubelles de 30 % et tu nourris ton potager. Règle d'or : alterner matières vertes (épluchures) et brunes (carton, feuilles mortes), aérer, garder humide comme une éponge.`,
    checklist:[
      'Installer un composteur (acheté ou palettes)',
      'Séparer un bac à déchets organiques en cuisine',
      'Équilibrer vert / brun',
      'Brasser toutes les 2–3 semaines',
      'Récolter mon premier compost mûr',
    ],
    cost:'Faible', costEur:'0–60 €', time:'2 h + suivi', difficulty:'Facile',
  },
  {
    id:'p-pluie', level:'peu', cat:'eau', icon:'🌧️',
    title:'Récupérer l\'eau de pluie (basique)',
    text:`Une ou deux cuves de 300–1000 L reliées à une gouttière couvrent l'arrosage du potager et une partie du nettoyage extérieur. C'est le premier geste eau : gratuit à l'usage, il allège ta facture et te rend moins dépendant du réseau pour les usages non potables.`,
    checklist:[
      'Repérer une descente de gouttière exploitable',
      'Choisir 1–2 cuves (récup ou neuves)',
      'Installer un collecteur filtrant',
      'Prévoir un trop-plein',
      'Brancher un arrosoir / une pompe basse pression',
    ],
    cost:'Faible', costEur:'50–200 €', time:'1 jour', difficulty:'Facile', calc:'rain',
  },

  /* ===================== NIVEAU : MOYEN ===================== */
  {
    id:'m-solaire', level:'moyen', cat:'energie', icon:'🔆',
    title:'Dimensionner un solaire pour 50–80 % de sa conso',
    text:`On passe du gadget au vrai système. À partir de ta consommation réelle (Wh/jour) et de l'ensoleillement de ta région, tu calcules la puissance crête (Wc) nécessaire pour couvrir la majorité de tes besoins sur l'année. Prévois large : l'hiver produit 3 à 4 fois moins que l'été.`,
    checklist:[
      'Calculer ma conso journalière moyenne (Wh/jour)',
      'Choisir mon ensoleillement régional',
      'Dimensionner la puissance en Wc',
      'Choisir onduleur/régulateur MPPT adapté',
      'Planifier la pose (toit/sol) et le budget',
    ],
    cost:'Élevé', costEur:'1 500–5 000 €', time:'Plusieurs semaines', difficulty:'Moyen', calc:'solar',
  },
  {
    id:'m-batteries', level:'moyen', cat:'energie', icon:'🔋',
    title:'Ajouter des batteries pour tenir sans réseau',
    text:`Les batteries (LiFePO4 de préférence, durables et sûres) stockent le surplus solaire du jour pour la nuit et les jours sans soleil. Tu choisis le nombre de jours d'autonomie visés. Plus tu en veux, plus le parc batterie grossit : c'est le poste le plus cher, à dimensionner avec soin.`,
    checklist:[
      'Définir mes jours d\'autonomie souhaités (1–3)',
      'Calculer la capacité en Wh puis en Ah (12/24/48V)',
      'Choisir la techno (LiFePO4 recommandé)',
      'Vérifier la compatibilité onduleur/régulateur',
      'Installer dans un lieu ventilé et hors gel',
    ],
    cost:'Élevé', costEur:'1 000–4 000 €', time:'1–2 jours', difficulty:'Moyen', calc:'solar',
  },
  {
    id:'m-potager', level:'moyen', cat:'alimentation', icon:'🧑‍🌾',
    title:'Potager 4 saisons (30–100 m²)',
    text:`Objectif : produire une part sérieuse de tes légumes toute l'année. Tu organises des planches de culture, une rotation, du paillage, et tu étales les semis pour récolter en continu. Un petit tunnel ou une serre prolonge la saison. C'est un vrai engagement de temps hebdomadaire.`,
    checklist:[
      'Planifier des planches permanentes + allées',
      'Mettre en place une rotation des cultures',
      'Pailler pour économiser l\'eau et le désherbage',
      'Échelonner les semis (printemps/été/automne)',
      'Installer un châssis ou petit tunnel',
    ],
    cost:'Moyen', costEur:'200–800 €', time:'Saisonnier', difficulty:'Moyen', calc:'garden',
  },
  {
    id:'m-poules', level:'moyen', cat:'alimentation', icon:'🐔',
    title:'Poules + compost avancé',
    text:`3–5 poules fournissent des œufs quasi toute l'année, mangent tes restes et produisent du fumier précieux. Couplées à un compost avancé (plusieurs bacs en rotation, montée en température), elles bouclent le cycle déchets → sol → nourriture. Prévoir un poulailler sécurisé contre les prédateurs.`,
    checklist:[
      'Construire/acheter un poulailler sécurisé',
      'Aménager un parcours enherbé',
      'Adopter 3–5 poules adaptées',
      'Organiser 2–3 bacs à compost en rotation',
      'Recycler restes et fientes vers le potager',
    ],
    cost:'Moyen', costEur:'300–900 €', time:'Quelques week-ends', difficulty:'Moyen',
  },
  {
    id:'m-pluie', level:'moyen', cat:'eau', icon:'🛢️',
    title:'Récupération d\'eau de pluie sérieuse',
    text:`On passe à plusieurs m³ de stockage (cuves aériennes ou enterrée) pour couvrir l'arrosage toute la saison sèche et des usages domestiques non potables (WC, lave-linge, nettoyage). Le dimensionnement dépend de ta surface de toit et de la pluviométrie locale.`,
    checklist:[
      'Calculer le volume récupérable par an',
      'Choisir cuves aériennes ou citerne enterrée',
      'Installer filtration amont + pompe',
      'Brancher les usages non potables (WC, extérieur)',
      'Prévoir l\'entretien (filtres, décantation)',
    ],
    cost:'Élevé', costEur:'800–3 000 €', time:'Plusieurs jours', difficulty:'Moyen', calc:'rain',
  },
  {
    id:'m-bois', level:'moyen', cat:'dechets', icon:'🔥',
    title:'Chauffage bois / poêle à bois (bases)',
    text:`Un poêle à bois performant (rendement 75 %+) réduit fortement ta dépendance à l'électricité ou au gaz pour le chauffage. Le bois est une énergie locale et stockable. Pense à l'approvisionnement (stère, séchage 18–24 mois) et au ramonage réglementaire deux fois par an.`,
    checklist:[
      'Choisir un poêle adapté à la surface à chauffer',
      'Vérifier conduit et sécurité (installateur qualifié)',
      'Organiser un stock de bois sec (abri ventilé)',
      'Apprendre l\'allumage inversé (moins de fumée)',
      'Planifier le ramonage 2×/an',
    ],
    cost:'Élevé', costEur:'1 500–4 000 €', time:'1–2 jours (pose)', difficulty:'Moyen',
  },

  /* ===================== NIVEAU : TOTAL ===================== */
  {
    id:'t-solaire', level:'total', cat:'energie', icon:'⚡',
    title:'Système 100 % solaire (ou hybride) toute l\'année',
    text:`Le vrai off-grid : couvrir 100 % de tes besoins, y compris en décembre. Cela impose de surdimensionner le solaire (facteur hiver), un gros parc batterie, et souvent un appoint (groupe électrogène ou petit éolien) pour les longues périodes sans soleil. On raisonne "pire mois" et sobriété énergétique poussée.`,
    checklist:[
      'Dimensionner sur le pire mois (décembre)',
      'Prévoir un appoint (groupe ou éolien)',
      'Basculer les gros usages en journée solaire',
      'Installer un suivi de production/consommation',
      'Supprimer/remplacer les appareils énergivores',
    ],
    cost:'Élevé', costEur:'6 000–15 000 €', time:'Projet de plusieurs mois', difficulty:'Difficile', calc:'solar',
  },
  {
    id:'t-eau', level:'total', cat:'eau', icon:'🚰',
    title:'Eau : puits/forage ou gros système pluie + potable',
    text:`Autonomie eau complète : un forage/puits ou un grand système de pluie couplé à une filtration potable (préfiltre, charbon actif, UV ou osmose). Attention à la réglementation (déclaration de forage, analyses de potabilité). C'est le pilier survie : sans eau, rien ne tient.`,
    checklist:[
      'Étudier la ressource (nappe, pluviométrie)',
      'Déclarer le forage / vérifier la légalité',
      'Installer une chaîne de filtration potable',
      'Faire analyser l\'eau (potabilité)',
      'Prévoir un pompage autonome (solaire)',
    ],
    cost:'Élevé', costEur:'3 000–12 000 €', time:'Plusieurs mois', difficulty:'Difficile', calc:'rain',
  },
  {
    id:'t-alim', level:'total', cat:'alimentation', icon:'🌾',
    title:'Autonomie alimentaire avancée',
    text:`Grand potager, vergers, petits élevages, et surtout la conservation : sans conserves, séchage, lacto-fermentation et cave, tu ne passes pas l'hiver. On vise aussi la production de ses propres semences. C'est un mode de vie à temps plein, pas un loisir.`,
    checklist:[
      'Étendre potager + verger (fruitiers, petits fruits)',
      'Ajouter des protéines (poules, lapins, ruche…)',
      'Maîtriser conserves, séchage, lacto-fermentation',
      'Aménager une cave / réserve alimentaire',
      'Produire une partie de mes semences',
    ],
    cost:'Moyen', costEur:'500–3 000 €', time:'Continu (mode de vie)', difficulty:'Difficile', calc:'garden',
  },
  {
    id:'t-toilettes', level:'total', cat:'dechets', icon:'🚽',
    title:'Toilettes sèches & gestion complète des déchets',
    text:`Les toilettes sèches suppriment l'eau potable gaspillée dans les WC (jusqu'à 30 % de la conso d'un foyer) et produisent, après compostage long, un amendement. Couplées à un compost bien géré et au tri/valorisation de tout l'organique, tu approches le zéro déchet organique.`,
    checklist:[
      'Installer des toilettes sèches (litière ou séparation)',
      'Mettre en place un composteur dédié long (12–24 mois)',
      'Gérer la litière (sciure, copeaux)',
      'Valoriser tout l\'organique du foyer',
      'Réduire les emballages et déchets entrants',
    ],
    cost:'Faible', costEur:'50–500 €', time:'1–2 jours', difficulty:'Moyen',
  },
  {
    id:'t-chauffage', level:'total', cat:'dechets', icon:'🌲',
    title:'Chauffage 100 % bois / biomasse ou solaire thermique',
    text:`Se chauffer et chauffer l'eau sans réseau : poêle bouilleur, masse thermique (poêle de masse, rocket stove), ou solaire thermique pour l'eau chaude sanitaire. L'idéal combine une maison très bien isolée (le premier "chauffage", c'est l'isolation) et une source locale renouvelable.`,
    checklist:[
      'Renforcer l\'isolation (le meilleur kWh est celui non consommé)',
      'Choisir poêle de masse / bouilleur / rocket',
      'Installer un solaire thermique pour l\'eau chaude',
      'Sécuriser l\'approvisionnement bois pluriannuel',
      'Mesurer et ajuster le confort réel',
    ],
    cost:'Élevé', costEur:'3 000–10 000 €', time:'Projet long', difficulty:'Difficile',
  },
  {
    id:'t-habitat', level:'total', cat:'energie', icon:'🏡',
    title:'Planifier un projet d\'habitat off-grid',
    text:`Tiny house, cabane, rénovation autonome : c'est le projet qui fait tenir tous les autres ensemble. On y pense l'implantation (soleil, eau, accès), la réglementation (PLU, permis), le budget global et la phase-par-phase. Mieux vaut un plan réaliste sur 2–3 ans qu'un rêve intenable.`,
    checklist:[
      'Définir le type d\'habitat et le lieu',
      'Vérifier la réglementation (PLU, permis, zonage)',
      'Chiffrer le projet global et le phaser',
      'Prioriser eau > énergie > chaleur > nourriture',
      'Établir un calendrier réaliste (2–3 ans)',
    ],
    cost:'Élevé', costEur:'Variable', time:'Années', difficulty:'Difficile',
  },
];

// helpers
const ModulesByLevel = lvl => MODULES.filter(m => m.level === lvl);
const LEVELS = [
  { id:'peu',   label:'Un peu',        icon:'🌱', desc:'Réduire la dépendance, sans tout changer.' },
  { id:'moyen', label:'Moyennement',   icon:'🌿', desc:'Couvrir une grande partie, tenir une coupure.' },
  { id:'total', label:'Totalement',    icon:'🌳', desc:'Viser l\'autonomie maximale, vivre off-grid.' },
];
