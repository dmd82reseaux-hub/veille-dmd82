/* Généré par tools/gen.py depuis schema.json : ne pas modifier à la main. */
window.App = window.App || {};
App.SCHEMA = {
 "version": 11,
 "espace": "veille",
 "tables": {
  "Articles": {
   "label": "Fil de veille",
   "key": "id",
   "prefix": "a",
   "sort": "-date",
   "fields": [
    {
     "name": "id",
     "label": "Identifiant",
     "type": "id"
    },
    {
     "name": "date",
     "label": "Date",
     "type": "date",
     "required": true,
     "default": "today"
    },
    {
     "name": "interet",
     "label": "Intérêt",
     "type": "enum",
     "options": {
      "3": "Fort",
      "2": "Moyen",
      "1": "Faible"
     },
     "default": "2"
    },
    {
     "name": "titre",
     "label": "Titre",
     "type": "text",
     "required": true
    },
    {
     "name": "resume",
     "label": "Résumé",
     "type": "longtext"
    },
    {
     "name": "url",
     "label": "Lien",
     "type": "url"
    },
    {
     "name": "image",
     "label": "Image (adresse)",
     "type": "url"
    },
    {
     "name": "canal",
     "label": "Type de source",
     "type": "enum",
     "options": {
      "officiel": "Sources officielles",
      "presse_locale": "Presse locale",
      "presse_nationale": "Presse nationale",
      "reseaux_sociaux": "Réseaux sociaux",
      "presse_specialisee": "Presse spécialisée défense",
      "audio_video": "Podcasts et vidéos"
     },
     "default": "presse_locale"
    },
    {
     "name": "source",
     "label": "Source",
     "type": "text"
    },
    {
     "name": "commune",
     "label": "Commune",
     "type": "text"
    },
    {
     "name": "perimetre",
     "label": "Périmètre",
     "type": "enum",
     "options": {
      "departement": "Tarn-et-Garonne",
      "zone_sud": "Zone de défense Sud",
      "national": "Armées (national)"
     },
     "default": "departement"
    },
    {
     "name": "theme",
     "label": "Thème",
     "type": "enum",
     "options": {
      "armees": "Armées et unités",
      "ordre_public": "Ordre public",
      "risques": "Risques et catastrophes",
      "infrastructures": "Sites sensibles",
      "lien_armee_nation": "Lien armée-nation",
      "securite_publique": "Sécurité publique",
      "institutions": "Institutions",
      "jeunesse": "Jeunesse et citoyenneté",
      "dmd": "DMD 82",
      "cyber": "Cyber",
      "ecosysteme": "Écosystème DMD",
      "geopolitique": "Géopolitique"
     },
     "default": "armees"
    },
    {
     "name": "cas",
     "label": "Cas lié",
     "type": "ref",
     "table": "Cas"
    },
    {
     "name": "statut",
     "label": "Traitement",
     "type": "enum",
     "options": {
      "nouveau": "Nouveau",
      "lu": "Lu",
      "retenu": "Retenu",
      "ecarte": "Écarté"
     },
     "default": "nouveau"
    },
    {
     "name": "origine",
     "label": "Origine",
     "type": "enum",
     "options": {
      "auto": "Collecte automatique",
      "manuel": "Saisie",
      "claude": "Recherche Claude"
     },
     "default": "manuel"
    },
    {
     "name": "suivis",
     "label": "Suivis trouvés",
     "type": "text",
     "readonly": true
    },
    {
     "name": "score",
     "label": "Score",
     "type": "number",
     "hidden": true
    },
    {
     "name": "ajoute_le",
     "label": "Ajouté le",
     "type": "datetime",
     "hidden": true
    },
    {
     "name": "archive",
     "label": "Copie archivée",
     "type": "url",
     "readonly": true
    },
    {
     "name": "notes",
     "label": "Notes",
     "type": "longtext"
    }
   ]
  },
  "Cas": {
   "label": "Cas DMD",
   "key": "id",
   "prefix": "c",
   "sort": "-priorite",
   "fields": [
    {
     "name": "id",
     "label": "Identifiant",
     "type": "id"
    },
    {
     "name": "titre",
     "label": "Titre",
     "type": "text",
     "required": true
    },
    {
     "name": "categorie",
     "label": "Catégorie",
     "type": "enum",
     "options": {
      "Ordre public": "Ordre public",
      "Unités": "Unités",
      "Lien armée-nation": "Lien armée-nation",
      "Risques naturels": "Risques naturels",
      "Sites sensibles": "Sites sensibles",
      "Jeunesse": "Jeunesse",
      "Cyber": "Cyber",
      "Autre": "Autre"
     },
     "default": "Autre"
    },
    {
     "name": "statut",
     "label": "Statut",
     "type": "enum",
     "options": {
      "en_cours": "En cours",
      "a_suivre": "À suivre",
      "clos": "Clos"
     },
     "default": "a_suivre"
    },
    {
     "name": "priorite",
     "label": "Priorité",
     "type": "enum",
     "options": {
      "3": "Haute",
      "2": "Moyenne",
      "1": "Basse"
     },
     "default": "2"
    },
    {
     "name": "ouvert",
     "label": "Ouvert le",
     "type": "date",
     "default": "today"
    },
    {
     "name": "maj",
     "label": "Mis à jour le",
     "type": "date",
     "default": "today"
    },
    {
     "name": "resume",
     "label": "Situation",
     "type": "longtext"
    },
    {
     "name": "interet_dmd",
     "label": "Intérêt pour la DMD",
     "type": "longtext"
    },
    {
     "name": "echeance",
     "label": "Échéance",
     "type": "text"
    },
    {
     "name": "echeance_objet",
     "label": "Objet de l'échéance",
     "type": "text"
    },
    {
     "name": "notes",
     "label": "Notes internes",
     "type": "longtext"
    }
   ]
  },
  "Textes": {
   "label": "Textes officiels",
   "key": "id",
   "prefix": "t",
   "sort": "-date",
   "fields": [
    {
     "name": "id",
     "label": "Identifiant",
     "type": "id"
    },
    {
     "name": "date",
     "label": "Date de publication",
     "type": "date",
     "required": true,
     "default": "today"
    },
    {
     "name": "source",
     "label": "Publication",
     "type": "enum",
     "options": {
      "jorf": "Journal officiel",
      "conseil": "Conseil des ministres",
      "bo_armees": "BO des armées",
      "bodmr": "BODMR",
      "boen": "BO Éducation nationale",
      "bo_interieur": "Textes de l'Intérieur",
      "autre": "Autre"
     },
     "default": "jorf"
    },
    {
     "name": "categorie",
     "label": "Catégorie",
     "type": "enum",
     "options": {
      "nomination": "Nomination",
      "decoration": "Décoration",
      "texte_general": "Texte général",
      "compte_rendu": "Compte rendu",
      "autre": "Autre"
     },
     "default": "texte_general"
    },
    {
     "name": "interet",
     "label": "Intérêt",
     "type": "enum",
     "options": {
      "3": "Fort",
      "2": "Moyen",
      "1": "Faible"
     },
     "default": "2"
    },
    {
     "name": "titre",
     "label": "Titre",
     "type": "text",
     "required": true
    },
    {
     "name": "resume",
     "label": "Extrait ou résumé",
     "type": "longtext"
    },
    {
     "name": "ministere",
     "label": "Ministère",
     "type": "text"
    },
    {
     "name": "nature",
     "label": "Nature",
     "type": "text"
    },
    {
     "name": "nor",
     "label": "NOR ou référence",
     "type": "text"
    },
    {
     "name": "url",
     "label": "Lien",
     "type": "url"
    },
    {
     "name": "suivis",
     "label": "Suivis trouvés",
     "type": "text"
    },
    {
     "name": "statut",
     "label": "Traitement",
     "type": "enum",
     "options": {
      "nouveau": "Nouveau",
      "lu": "Lu",
      "retenu": "Retenu",
      "ecarte": "Écarté"
     },
     "default": "nouveau"
    },
    {
     "name": "origine",
     "label": "Origine",
     "type": "enum",
     "options": {
      "auto": "Collecte automatique",
      "manuel": "Saisie",
      "claude": "Recherche Claude"
     },
     "default": "manuel"
    },
    {
     "name": "ajoute_le",
     "label": "Ajouté le",
     "type": "datetime",
     "hidden": true
    },
    {
     "name": "archive",
     "label": "Copie archivée",
     "type": "url",
     "readonly": true
    },
    {
     "name": "notes",
     "label": "Notes",
     "type": "longtext"
    }
   ]
  },
  "Suivis": {
   "label": "Suivis",
   "key": "id",
   "prefix": "s",
   "sort": "type",
   "fields": [
    {
     "name": "id",
     "label": "Identifiant",
     "type": "id"
    },
    {
     "name": "type",
     "label": "Type",
     "type": "enum",
     "options": {
      "personne": "Personne",
      "mot_cle": "Mot-clé",
      "ministere": "Ministère",
      "fonction": "Fonction ou poste"
     },
     "default": "personne"
    },
    {
     "name": "valeur",
     "label": "Nom, mot-clé ou intitulé",
     "type": "text",
     "required": true
    },
    {
     "name": "variantes",
     "label": "Variantes (séparées par ;)",
     "type": "text"
    },
    {
     "name": "perimetre",
     "label": "Chercher dans",
     "type": "enum",
     "options": {
      "tout": "Tout",
      "textes": "Textes officiels",
      "presse": "Presse et réseaux"
     },
     "default": "tout"
    },
    {
     "name": "motif",
     "label": "Pourquoi le suivre",
     "type": "text"
    },
    {
     "name": "actif",
     "label": "Actif",
     "type": "enum",
     "options": {
      "oui": "Oui",
      "non": "Non"
     },
     "default": "oui"
    }
   ]
  },
  "Alertes": {
   "label": "Alertes",
   "key": "id",
   "prefix": "al",
   "sort": "nom",
   "fields": [
    {
     "name": "id",
     "label": "Identifiant",
     "type": "id"
    },
    {
     "name": "nom",
     "label": "Nom de l'alerte",
     "type": "text",
     "required": true
    },
    {
     "name": "destinataires",
     "label": "Destinataires (adresses séparées par ;)",
     "type": "text",
     "required": true
    },
    {
     "name": "frequence",
     "label": "Envoi",
     "type": "enum",
     "options": {
      "immediate": "Dès que c'est collecté",
      "quotidienne": "Point quotidien à 7h",
      "hebdomadaire": "Bilan du lundi à 7h"
     },
     "default": "immediate"
    },
    {
     "name": "portee",
     "label": "Porte sur",
     "type": "enum",
     "options": {
      "tout": "Articles, textes officiels et géopolitique du matin",
      "articles": "Articles (presse, réseaux)",
      "textes": "Textes officiels"
     },
     "default": "tout"
    },
    {
     "name": "interet_min",
     "label": "Intérêt minimum",
     "type": "enum",
     "options": {
      "1": "Tout",
      "2": "Moyen et fort",
      "3": "Fort seulement"
     },
     "default": "3"
    },
    {
     "name": "filtre",
     "label": "Condition supplémentaire",
     "type": "enum",
     "options": {
      "aucun": "Aucune",
      "suivi": "Cite un suivi",
      "nomination": "Nomination",
      "nomination_suivi": "Nomination d'un suivi",
      "decoration": "Décoration ou médaille",
      "canal": "Type de source",
      "theme": "Thème",
      "source_texte": "Publication officielle",
      "mot_cle": "Contient un mot",
      "perimetre": "Périmètre (82, zone Sud, national)"
     },
     "default": "aucun"
    },
    {
     "name": "valeur",
     "label": "Valeur de la condition (nom du suivi, type, thème, mot…)",
     "type": "text"
    },
    {
     "name": "actif",
     "label": "Active",
     "type": "enum",
     "options": {
      "oui": "Oui",
      "non": "Non"
     },
     "default": "oui"
    },
    {
     "name": "derniere_execution",
     "label": "Dernier envoi",
     "type": "datetime",
     "readonly": true
    }
   ]
  },
  "Envois": {
   "label": "Envois d'alertes",
   "key": "id",
   "prefix": "en",
   "sort": "-quand",
   "fields": [
    {
     "name": "id",
     "label": "Identifiant",
     "type": "id"
    },
    {
     "name": "quand",
     "label": "Envoyé le",
     "type": "datetime"
    },
    {
     "name": "alerte",
     "label": "Alerte",
     "type": "text"
    },
    {
     "name": "destinataires",
     "label": "Destinataires",
     "type": "text"
    },
    {
     "name": "objet",
     "label": "Objet",
     "type": "text"
    },
    {
     "name": "elements",
     "label": "Éléments",
     "type": "number"
    },
    {
     "name": "statut",
     "label": "Résultat",
     "type": "text"
    }
   ]
  },
  "Evenements": {
   "label": "Événements",
   "key": "id",
   "prefix": "e",
   "sort": "-date",
   "fields": [
    {
     "name": "id",
     "label": "Identifiant",
     "type": "id"
    },
    {
     "name": "date",
     "label": "Date (AAAA, AAAA-MM ou AAAA-MM-JJ)",
     "type": "text",
     "required": true
    },
    {
     "name": "type",
     "label": "Type",
     "type": "enum",
     "options": {
      "catastrophe": "Catastrophe",
      "securite": "Sécurité"
     },
     "default": "catastrophe"
    },
    {
     "name": "nature",
     "label": "Nature",
     "type": "text"
    },
    {
     "name": "titre",
     "label": "Titre",
     "type": "text",
     "required": true
    },
    {
     "name": "communes",
     "label": "Communes",
     "type": "text"
    },
    {
     "name": "bilan",
     "label": "Bilan",
     "type": "longtext"
    },
    {
     "name": "implication",
     "label": "Implication des armées",
     "type": "longtext"
    },
    {
     "name": "source",
     "label": "Source",
     "type": "text"
    },
    {
     "name": "url",
     "label": "Lien",
     "type": "url"
    },
    {
     "name": "gravite",
     "label": "Gravité",
     "type": "enum",
     "options": {
      "3": "Majeure",
      "2": "Notable",
      "1": "Limitée"
     },
     "default": "2"
    }
   ]
  },
  "Publications": {
   "label": "Publications DMD",
   "key": "id",
   "prefix": "p",
   "sort": "-date",
   "fields": [
    {
     "name": "id",
     "label": "Identifiant",
     "type": "id"
    },
    {
     "name": "date",
     "label": "Date",
     "type": "date",
     "default": "today"
    },
    {
     "name": "reseau",
     "label": "Réseau",
     "type": "enum",
     "options": {
      "facebook": "Facebook",
      "x": "X",
      "linkedin": "LinkedIn"
     },
     "default": "facebook"
    },
    {
     "name": "texte",
     "label": "Texte ou résumé",
     "type": "longtext"
    },
    {
     "name": "image",
     "label": "Image (adresse)",
     "type": "url"
    },
    {
     "name": "url",
     "label": "Lien de la publication",
     "type": "url",
     "required": true
    },
    {
     "name": "embed",
     "label": "Code d'intégration (LinkedIn)",
     "type": "longtext"
    },
    {
     "name": "vues",
     "label": "Réactions et commentaires",
     "type": "number"
    },
    {
     "name": "origine",
     "label": "Origine",
     "type": "enum",
     "options": {
      "manuel": "Saisie",
      "auto": "Collecte Facebook"
     },
     "default": "manuel"
    },
    {
     "name": "notes",
     "label": "Notes",
     "type": "longtext"
    }
   ]
  },
  "Situation": {
   "label": "Situation du jour",
   "key": "cle",
   "sort": "ordre",
   "fields": [
    {
     "name": "cle",
     "label": "Clé",
     "type": "text",
     "required": true
    },
    {
     "name": "ordre",
     "label": "Ordre",
     "type": "number"
    },
    {
     "name": "libelle",
     "label": "Libellé",
     "type": "text"
    },
    {
     "name": "valeur",
     "label": "Valeur",
     "type": "text"
    },
    {
     "name": "detail",
     "label": "Détail",
     "type": "longtext"
    },
    {
     "name": "date",
     "label": "Date",
     "type": "date",
     "default": "today"
    },
    {
     "name": "source",
     "label": "Source",
     "type": "text"
    },
    {
     "name": "url",
     "label": "Lien",
     "type": "url"
    }
   ]
  },
  "Sources": {
   "label": "Sources OSINT",
   "key": "id",
   "prefix": "o",
   "sort": "canal",
   "fields": [
    {
     "name": "id",
     "label": "Identifiant",
     "type": "id"
    },
    {
     "name": "canal",
     "label": "Type de source",
     "type": "enum",
     "options": {
      "officiel": "Sources officielles",
      "presse_locale": "Presse locale",
      "presse_nationale": "Presse nationale",
      "reseaux_sociaux": "Réseaux sociaux",
      "presse_specialisee": "Presse spécialisée défense",
      "audio_video": "Podcasts et vidéos"
     },
     "default": "presse_locale"
    },
    {
     "name": "nom",
     "label": "Nom",
     "type": "text",
     "required": true
    },
    {
     "name": "type",
     "label": "Usage",
     "type": "enum",
     "options": {
      "rss": "Flux RSS collecté",
      "page": "Page d'actualités collectée",
      "site": "Site à consulter",
      "recherche": "Recherche",
      "vigilance": "Vigilance",
      "archive": "Fonds d'archives",
      "youtube": "Chaîne YouTube collectée",
      "podcast": "Podcast collecté"
     },
     "default": "site"
    },
    {
     "name": "url",
     "label": "Adresse",
     "type": "url",
     "required": true
    },
    {
     "name": "motif",
     "label": "Motif des liens (page collectée)",
     "type": "text"
    },
    {
     "name": "usage",
     "label": "Ce qu'on y trouve",
     "type": "text"
    },
    {
     "name": "destination",
     "label": "Alimente",
     "type": "enum",
     "options": {
      "articles": "Fil de veille",
      "textes": "Textes officiels",
      "geopolitique": "Géopolitique du jour"
     },
     "default": "articles"
    },
    {
     "name": "lecture",
     "label": "Lire chaque page pour chercher les suivis",
     "type": "enum",
     "options": {
      "non": "Non",
      "oui": "Oui"
     },
     "default": "non"
    },
    {
     "name": "portee",
     "label": "Périmètre retenu",
     "type": "enum",
     "options": {
      "departement": "Tarn-et-Garonne : un lieu du 82 est exigé",
      "zone_sud": "Zone Sud : un lieu du 82 ou de la zone est exigé",
      "national": "Armées, national : un sujet de défense est exigé",
      "specialisee": "Presse spécialisée : un sujet de défense suffit (seuil bas)",
      "tout": "Tout garder : source choisie à faible volume"
     },
     "default": "departement"
    },
    {
     "name": "theme",
     "label": "Thème par défaut des éléments",
     "type": "enum",
     "options": {
      "": "Selon les mots-clés",
      "armees": "Armées et unités",
      "ordre_public": "Ordre public",
      "risques": "Risques et catastrophes",
      "infrastructures": "Sites sensibles",
      "lien_armee_nation": "Lien armée-nation",
      "securite_publique": "Sécurité publique",
      "institutions": "Institutions",
      "jeunesse": "Jeunesse et citoyenneté",
      "dmd": "DMD 82",
      "cyber": "Cyber",
      "ecosysteme": "Écosystème DMD",
      "geopolitique": "Géopolitique"
     },
     "default": ""
    },
    {
     "name": "local",
     "label": "Source locale (pas de filtre géographique)",
     "type": "enum",
     "options": {
      "oui": "Oui",
      "non": "Non"
     },
     "default": "non"
    },
    {
     "name": "actif",
     "label": "Actif",
     "type": "enum",
     "options": {
      "oui": "Oui",
      "non": "Non"
     },
     "default": "oui"
    },
    {
     "name": "dernier_statut",
     "label": "Dernier relevé",
     "type": "text",
     "readonly": true
    },
    {
     "name": "derniere_collecte",
     "label": "Dernière collecte",
     "type": "datetime",
     "readonly": true
    }
   ]
  },
  "MotsCles": {
   "label": "Mots-clés",
   "key": "id",
   "prefix": "m",
   "sort": "type",
   "fields": [
    {
     "name": "id",
     "label": "Identifiant",
     "type": "id"
    },
    {
     "name": "terme",
     "label": "Terme",
     "type": "text",
     "required": true
    },
    {
     "name": "type",
     "label": "Rôle",
     "type": "enum",
     "options": {
      "lieu": "Lieu du 82",
      "theme": "Thème",
      "exclusion": "Exclusion",
      "lieu_zone": "Lieu de la zone Sud"
     },
     "default": "theme"
    },
    {
     "name": "theme",
     "label": "Thème associé",
     "type": "enum",
     "options": {
      "armees": "Armées et unités",
      "ordre_public": "Ordre public",
      "risques": "Risques et catastrophes",
      "infrastructures": "Sites sensibles",
      "lien_armee_nation": "Lien armée-nation",
      "securite_publique": "Sécurité publique",
      "institutions": "Institutions",
      "jeunesse": "Jeunesse et citoyenneté",
      "dmd": "DMD 82",
      "cyber": "Cyber",
      "ecosysteme": "Écosystème DMD",
      "geopolitique": "Géopolitique"
     }
    },
    {
     "name": "poids",
     "label": "Poids",
     "type": "number",
     "default": "2"
    }
   ]
  },
  "Risques": {
   "label": "Profil de risques",
   "key": "risque",
   "fields": [
    {
     "name": "risque",
     "label": "Risque",
     "type": "text",
     "required": true
    },
    {
     "name": "communes",
     "label": "Communes concernées",
     "type": "number"
    },
    {
     "name": "detail",
     "label": "Détail",
     "type": "longtext"
    },
    {
     "name": "source",
     "label": "Source",
     "type": "text"
    },
    {
     "name": "url",
     "label": "Lien",
     "type": "url"
    }
   ]
  },
  "Implantations": {
   "label": "Unités et implantations",
   "key": "id",
   "prefix": "i",
   "fields": [
    {
     "name": "id",
     "label": "Identifiant",
     "type": "id"
    },
    {
     "name": "unite",
     "label": "Unité",
     "type": "text",
     "required": true
    },
    {
     "name": "commune",
     "label": "Commune",
     "type": "text"
    },
    {
     "name": "site",
     "label": "Site",
     "type": "text"
    },
    {
     "name": "note",
     "label": "Repères",
     "type": "longtext"
    },
    {
     "name": "source",
     "label": "Source",
     "type": "text"
    },
    {
     "name": "url",
     "label": "Lien",
     "type": "url"
    }
   ]
  },
  "Chiffres": {
   "label": "Chiffres défense",
   "key": "indicateur",
   "fields": [
    {
     "name": "indicateur",
     "label": "Indicateur",
     "type": "text",
     "required": true
    },
    {
     "name": "libelle",
     "label": "Libellé",
     "type": "text"
    },
    {
     "name": "valeur",
     "label": "Valeur",
     "type": "number"
    },
    {
     "name": "unite",
     "label": "Unité",
     "type": "text"
    },
    {
     "name": "annee",
     "label": "Année",
     "type": "text"
    },
    {
     "name": "source",
     "label": "Source",
     "type": "text"
    },
    {
     "name": "url",
     "label": "Lien",
     "type": "url"
    }
   ]
  },
  "Parametres": {
   "label": "Paramètres",
   "key": "cle",
   "fields": [
    {
     "name": "cle",
     "label": "Clé",
     "type": "text",
     "required": true
    },
    {
     "name": "valeur",
     "label": "Valeur",
     "type": "text"
    },
    {
     "name": "description",
     "label": "Description",
     "type": "text",
     "readonly": true
    }
   ]
  },
  "Delinquance": {
   "label": "Délinquance enregistrée",
   "key": "cle",
   "sort": "-annee",
   "fields": [
    {
     "name": "cle",
     "label": "Clé",
     "type": "text",
     "required": true
    },
    {
     "name": "annee",
     "label": "Année",
     "type": "text"
    },
    {
     "name": "perimetre",
     "label": "Code du territoire",
     "type": "text"
    },
    {
     "name": "lieu",
     "label": "Territoire",
     "type": "text"
    },
    {
     "name": "indicateur",
     "label": "Indicateur",
     "type": "text"
    },
    {
     "name": "unite",
     "label": "Unité de compte",
     "type": "text"
    },
    {
     "name": "nombre",
     "label": "Nombre",
     "type": "number"
    },
    {
     "name": "taux",
     "label": "Taux pour mille",
     "type": "text"
    }
   ]
  },
  "CatNat": {
   "label": "Catastrophes naturelles reconnues",
   "key": "cle",
   "sort": "-debut",
   "fields": [
    {
     "name": "cle",
     "label": "Clé",
     "type": "text",
     "required": true
    },
    {
     "name": "code_insee",
     "label": "Code INSEE",
     "type": "text"
    },
    {
     "name": "commune",
     "label": "Commune",
     "type": "text"
    },
    {
     "name": "risque",
     "label": "Risque",
     "type": "text"
    },
    {
     "name": "debut",
     "label": "Début de l'événement",
     "type": "text"
    },
    {
     "name": "fin",
     "label": "Fin de l'événement",
     "type": "text"
    },
    {
     "name": "arrete",
     "label": "Date de l'arrêté",
     "type": "text"
    },
    {
     "name": "jo",
     "label": "Publication au JO",
     "type": "text"
    }
   ]
  },
  "Utilisateurs": {
   "label": "Utilisateurs",
   "key": "email",
   "sort": "nom",
   "fields": [
    {
     "name": "email",
     "label": "Adresse électronique",
     "type": "text",
     "required": true
    },
    {
     "name": "nom",
     "label": "Nom affiché",
     "type": "text"
    },
    {
     "name": "role",
     "label": "Rôle",
     "type": "enum",
     "options": {
      "admin": "Administrateur",
      "contributeur": "Contributeur",
      "lecteur": "Lecteur"
     },
     "default": "contributeur"
    },
    {
     "name": "actif",
     "label": "Accès",
     "type": "enum",
     "options": {
      "oui": "Autorisé",
      "non": "Suspendu"
     },
     "default": "oui"
    },
    {
     "name": "derniere_connexion",
     "label": "Dernière connexion",
     "type": "datetime",
     "readonly": true
    }
   ]
  },
  "AccidentsRoute": {
   "label": "Accidents corporels de la circulation",
   "key": "cle",
   "sort": "-annee",
   "fields": [
    {
     "name": "cle",
     "label": "Clé",
     "type": "text",
     "required": true
    },
    {
     "name": "annee",
     "label": "Année",
     "type": "text"
    },
    {
     "name": "lieu",
     "label": "Territoire",
     "type": "text"
    },
    {
     "name": "indicateur",
     "label": "Indicateur",
     "type": "text"
    },
    {
     "name": "unite",
     "label": "Unité de compte",
     "type": "text"
    },
    {
     "name": "nombre",
     "label": "Nombre",
     "type": "number"
    }
   ]
  },
  "Organismes": {
   "label": "Organismes",
   "key": "id",
   "prefix": "org",
   "sort": "nom",
   "fields": [
    {
     "name": "id",
     "label": "Identifiant",
     "type": "id"
    },
    {
     "name": "nom",
     "label": "Organisme",
     "type": "text",
     "required": true
    },
    {
     "name": "famille",
     "label": "Famille",
     "type": "enum",
     "options": {
      "defense": "Armées et réserve",
      "etat": "État et gestion de crise",
      "securite": "Sécurité et secours",
      "jeunesse": "Jeunesse et enseignement",
      "economie": "Monde économique",
      "memoire": "Mémoire et solidarité",
      "elus": "Collectivités et élus"
     },
     "required": true
    },
    {
     "name": "mission",
     "label": "Mission principale",
     "type": "enum",
     "options": {
      "conseiller": "Conseiller",
      "appuyer": "Appuyer",
      "rayonner": "Rayonner",
      "honorer": "Honorer"
     },
     "required": true
    },
    {
     "name": "perimetre",
     "label": "Périmètre public",
     "type": "longtext"
    },
    {
     "name": "recherche",
     "label": "Expression de recherche",
     "type": "text",
     "required": true
    },
    {
     "name": "url",
     "label": "Site institutionnel",
     "type": "url"
    },
    {
     "name": "contact",
     "label": "Page de contact institutionnelle",
     "type": "url"
    },
    {
     "name": "reference",
     "label": "Référence documentaire",
     "type": "text"
    },
    {
     "name": "date_reference",
     "label": "Date de référence",
     "type": "date"
    },
    {
     "name": "verification",
     "label": "État de vérification",
     "type": "enum",
     "options": {
      "document": "Document fourni, actualité à confirmer",
      "web": "Source officielle consultée"
     },
     "default": "document"
    },
    {
     "name": "notes",
     "label": "Points à confirmer",
     "type": "longtext"
    }
   ]
  },
  "Signalements": {
   "label": "Signalements à vérifier",
   "key": "id",
   "prefix": "sig",
   "sort": "-date",
   "fields": [
    {
     "name": "id",
     "label": "Identifiant",
     "type": "id"
    },
    {
     "name": "titre",
     "label": "Titre",
     "type": "text",
     "required": true
    },
    {
     "name": "date",
     "label": "Date de publication",
     "type": "date",
     "required": true,
     "default": "today"
    },
    {
     "name": "url",
     "label": "Lien de la publication",
     "type": "url",
     "required": true
    },
    {
     "name": "source",
     "label": "Source",
     "type": "text",
     "required": true
    },
    {
     "name": "organisme",
     "label": "Organisme",
     "type": "ref",
     "table": "Organismes"
    },
    {
     "name": "mission",
     "label": "Mission",
     "type": "enum",
     "options": {
      "conseiller": "Conseiller",
      "appuyer": "Appuyer",
      "rayonner": "Rayonner",
      "honorer": "Honorer"
     }
    },
    {
     "name": "theme",
     "label": "Thème",
     "type": "text"
    },
    {
     "name": "resume",
     "label": "Résumé factuel",
     "type": "longtext",
     "required": true
    },
    {
     "name": "statut",
     "label": "Vérification",
     "type": "enum",
     "options": {
      "a_verifier": "À vérifier",
      "confirme": "Confirmé",
      "ecarte": "Écarté"
     },
     "default": "a_verifier",
     "required": true
    },
    {
     "name": "preuve",
     "label": "Lien de corroboration",
     "type": "url"
    },
    {
     "name": "notes",
     "label": "Vérification et contexte",
     "type": "longtext"
    }
   ]
  },
  "ControlesOPSEC": {
   "label": "Contrôles OPSEC",
   "key": "id",
   "prefix": "ops",
   "sort": "titre",
   "fields": [
    {
     "name": "id",
     "label": "Identifiant",
     "type": "id"
    },
    {
     "name": "titre",
     "label": "Point de contrôle",
     "type": "text",
     "required": true
    },
    {
     "name": "support",
     "label": "Support appartenant à votre organisme",
     "type": "url"
    },
    {
     "name": "perimetre",
     "label": "Autorisation et périmètre",
     "type": "longtext",
     "required": true
    },
    {
     "name": "date",
     "label": "Date du contrôle",
     "type": "date",
     "default": "today",
     "required": true
    },
    {
     "name": "statut",
     "label": "Résultat",
     "type": "enum",
     "options": {
      "a_controler": "À contrôler",
      "conforme": "Conforme",
      "a_corriger": "À corriger",
      "sans_objet": "Sans objet"
     },
     "default": "a_controler",
     "required": true
    },
    {
     "name": "constat",
     "label": "Constat sans donnée personnelle",
     "type": "longtext"
    },
    {
     "name": "action",
     "label": "Action corrective",
     "type": "longtext"
    }
   ]
  },
  "SurveillancePages": {
   "label": "Pages surveillées",
   "key": "id",
   "prefix": "veillepage",
   "sort": "nom",
   "fields": [
    {
     "name": "id",
     "label": "Identifiant",
     "type": "id"
    },
    {
     "name": "nom",
     "label": "Page",
     "type": "text",
     "required": true
    },
    {
     "name": "url",
     "label": "Adresse publique",
     "type": "url",
     "required": true,
     "readonly": true
    },
    {
     "name": "destinataires",
     "label": "Courriels destinataires",
     "type": "text",
     "required": true
    },
    {
     "name": "actif",
     "label": "Surveillance quotidienne",
     "type": "enum",
     "options": {
      "oui": "Active",
      "non": "En pause"
     },
     "default": "oui",
     "required": true
    }
   ]
  },
  "EtatsPages": {
   "label": "État des contrôles de pages",
   "key": "id",
   "prefix": "etatpage",
   "sort": "id",
   "fields": [
    {
     "name": "id",
     "label": "Identifiant",
     "type": "id"
    },
    {
     "name": "dernier_controle",
     "label": "Dernier contrôle",
     "type": "text"
    },
    {
     "name": "dernier_succes",
     "label": "Dernière lecture réussie",
     "type": "text"
    },
    {
     "name": "derniere_modification",
     "label": "Dernier changement",
     "type": "text"
    },
    {
     "name": "statut",
     "label": "État",
     "type": "text"
    },
    {
     "name": "detail",
     "label": "Détail",
     "type": "longtext"
    },
    {
     "name": "reference",
     "label": "Référence",
     "type": "longtext",
     "hidden": true
    }
   ]
  },
  "ChangementsPages": {
   "label": "Changements de pages",
   "key": "id",
   "prefix": "changepage",
   "sort": "-quand",
   "fields": [
    {
     "name": "id",
     "label": "Identifiant",
     "type": "id"
    },
    {
     "name": "surveillance",
     "label": "Page",
     "type": "text"
    },
    {
     "name": "quand",
     "label": "Détecté le",
     "type": "text"
    },
    {
     "name": "titre",
     "label": "Titre",
     "type": "text"
    },
    {
     "name": "details",
     "label": "Changements",
     "type": "longtext"
    },
    {
     "name": "url",
     "label": "Lien",
     "type": "url"
    },
    {
     "name": "destinataires",
     "label": "Destinataires",
     "type": "text"
    },
    {
     "name": "envoi",
     "label": "Courriel",
     "type": "text"
    },
    {
     "name": "erreur",
     "label": "Détail d’envoi",
     "type": "longtext"
    }
   ]
  },
  "Geopolitique": {
   "label": "Géopolitique du jour",
   "key": "id",
   "prefix": "g",
   "sort": "-date",
   "fields": [
    {
     "name": "id",
     "label": "Identifiant",
     "type": "id"
    },
    {
     "name": "date",
     "label": "Date",
     "type": "date",
     "required": true,
     "default": "today"
    },
    {
     "name": "rang",
     "label": "Rang",
     "type": "number"
    },
    {
     "name": "region",
     "label": "Région",
     "type": "enum",
     "options": {
      "europe": "Europe et Russie",
      "moyen_orient": "Proche et Moyen-Orient",
      "afrique": "Afrique",
      "asie": "Asie et Indo-Pacifique",
      "ameriques": "Amériques",
      "monde": "Monde et multilatéral"
     },
     "default": "monde"
    },
    {
     "name": "titre",
     "label": "Titre",
     "type": "text",
     "required": true
    },
    {
     "name": "url",
     "label": "Lien",
     "type": "url"
    },
    {
     "name": "source",
     "label": "Source",
     "type": "text"
    },
    {
     "name": "reprises",
     "label": "Sources concordantes",
     "type": "number"
    },
    {
     "name": "resume",
     "label": "Résumé de la source",
     "type": "longtext"
    },
    {
     "name": "ajoute_le",
     "label": "Ajouté le",
     "type": "datetime",
     "hidden": true
    }
   ]
  }
 }
};
