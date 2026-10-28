window.App = window.App || {};
(function () {
  'use strict';
  var u = App.u, el = u.el, ui = App.ui, store = App.store;
  var missions = {
    conseiller: ['Conseiller', 'Anticiper les crises et éclairer la décision.'],
    appuyer: ['Appuyer', 'Soutenir le recrutement et les partenariats.'],
    rayonner: ['Rayonner', 'Renforcer le lien Armées-Nation.'],
    honorer: ['Honorer', 'Transmettre la mémoire et soutenir la solidarité.']
  };
  function peutEcrire() { return !App.role || App.role() !== 'lecteur'; }
  function bouton(t, fn, primary) { return el('button', { type: 'button', class: 'btn' + (primary ? ' btn-primary' : ''), onclick: fn }, t); }
  function action(t, fn, primary) { return peutEcrire() ? bouton(t, fn, primary) : null; }
  function entete(t, p, actions) { return el('div', { class: 'page-head' }, [el('div', null, [el('div', { class: 'eyebrow' }, 'DMD 82 / Territoire et partenaires'), el('h1', null, t), el('p', null, p)]), el('div', { class: 'actions' }, actions || [])]); }
  function label(t, f, v) { return ui.opt(t, f, v); }
  function options(t, f) { var field = App.SCHEMA.tables[t].fields.find(function (x) { return x.name === f; }); return Object.keys(field.options).map(function (k) { return [k, field.options[k]]; }); }
  function modifier(t, r) { return action('Modifier', function () { ui.formulaire(t, r); }); }
  function rechercher(url, t) { return u.lien(t, url, 'btn btn-sm'); }
  function rechercheLiens(r) {
    return el('div', { class: 'actions' }, [
      rechercher('https://www.google.com/search?q=' + encodeURIComponent(r.recherche), 'Web'),
      rechercher('https://news.google.com/search?q=' + encodeURIComponent(r.recherche) + '&hl=fr&gl=FR&ceid=FR:fr', 'Actualités'),
      rechercher('https://www.facebook.com/search/posts/?q=' + encodeURIComponent(r.nom + ' Tarn-et-Garonne'), 'Facebook'),
      rechercher('https://www.linkedin.com/search/results/content/?keywords=' + encodeURIComponent(r.nom), 'LinkedIn'),
      rechercher('https://x.com/search?q=' + encodeURIComponent(r.nom + ' Tarn-et-Garonne') + '&f=live', 'X')
    ]);
  }
  App.pages.ecosysteme = {
    titre: 'Écosystème DMD', icone: 'defense',
    nouveau: function () { if (peutEcrire()) ui.formulaire('Organismes', null, { titre: 'Ajouter un organisme' }); },
    rendre: function (c, params) {
      params = params || {};
      var famille = '', mission = params.mission || '', q = '';
      var resultats = el('div', { class: 'eco-grid' }), compteur = el('p', { class: 'small muted', role: 'status' });
      var search = el('input', { class: 'input', type: 'search', placeholder: 'Rechercher un organisme ou un sujet', 'aria-label': 'Rechercher un organisme' });
      search.addEventListener('input', function () { q = u.normaliser(search.value); dessiner(); });
      var selectMission = ui.select([['', 'Toutes les missions']].concat(options('Organismes', 'mission')), mission, function (v) { mission = v; dessiner(); }, { 'aria-label': 'Mission DMD' });
      function dessiner() {
        var rows = store.get('Organismes').filter(function (r) {
          var texte = u.normaliser([r.nom, r.perimetre, r.recherche, r.notes].join(' '));
          var trouve = !q || q.split(' ').every(function (mot) { return mot.length <= 3 ? (' ' + texte + ' ').includes(' ' + mot + ' ') : texte.includes(mot); });
          return (!famille || r.famille === famille) && (!mission || r.mission === mission) && trouve;
        });
        compteur.textContent = rows.length + ' organismes et réseaux / références à actualiser auprès des partenaires';
        resultats.replaceChildren.apply(resultats, rows.length ? rows.map(function (r) {
          var related = store.get('Articles').filter(function (a) { return u.normaliser(a.titre + ' ' + a.resume).includes(u.normaliser(r.nom)); }).length;
          return el('article', { class: 'card eco-card mission-' + r.mission }, [
            el('div', { class: 'meta' }, [ui.pill(label('Organismes', 'famille', r.famille)), el('span', { class: 'mission-label' }, label('Organismes', 'mission', r.mission))]),
            el('h2', null, r.nom), el('p', null, r.perimetre),
            el('div', { class: 'eco-reference' }, [el('span', null, label('Organismes', 'verification', r.verification)), el('small', null, r.reference)]),
            r.notes ? el('p', { class: 'small muted' }, r.notes) : null,
            el('details', null, [el('summary', null, 'Expression de recherche'), el('p', { class: 'mono' }, r.recherche)]),
            rechercheLiens(r),
            el('div', { class: 'actions eco-footer' }, [r.url ? u.lien('Site institutionnel', r.url, 'small') : null, r.contact ? u.lien('Contact', r.contact, 'small') : null,
              el('a', { class: 'small', href: '#/fil?q=' + encodeURIComponent(r.nom) }, related + ' mentions locales'),
              action('Signaler', function () { signaler({ organisme: r.id, mission: r.mission }); }), modifier('Organismes', r)])
          ]);
        }) : [ui.vide('Aucun organisme ne correspond à ces filtres.')]);
      }
      u.append(c, [entete('L’écosystème de la DMD', 'Des recherches institutionnelles organisées selon vos missions et vos partenaires.', [action('Ajouter un organisme', App.pages.ecosysteme.nouveau, true)]),
        el('div', { class: 'mission-grid' }, Object.keys(missions).map(function (m, i) { return el('button', { type: 'button', class: 'mission-card mission-' + m, onclick: function () { mission = mission === m ? '' : m; selectMission.value = mission; dessiner(); } }, [el('span', { class: 'mission-number' }, '0' + (i + 1)), el('strong', null, missions[m][0]), el('span', null, missions[m][1])]); })),
        el('aside', { class: 'eco-note' }, 'Périmètre issu de vos documents. Le calendrier 2024-2025, les effectifs et les objectifs historiques ne constituent pas une situation actualisée. Les recherches sur les réseaux s’ouvrent dans votre session.'),
        el('div', { class: 'eco-filters' }, [search, ui.select([['', 'Toutes les familles']].concat(options('Organismes', 'famille')), '', function (v) { famille = v; dessiner(); }, { 'aria-label': 'Famille de partenaires' }), selectMission]), compteur, resultats]);
      dessiner(); return { redessiner: dessiner };
    }
  };
  function signaler(base) { if (peutEcrire()) ui.formulaire('Signalements', base || null, { titre: 'Signaler une information', avant: verifierSignalement }); }
  function verifierSignalement(l) {
    if (l.statut === 'confirme' && !u.safeUrl(l.preuve)) throw new Error('Un lien de corroboration est nécessaire pour confirmer ce signalement.');
  }
  App.pages.signalements = {
    titre: 'Signalements', icone: 'fil', nouveau: function () { signaler(); },
    rendre: function (c) {
      var statut = 'a_verifier', liste = el('div', { class: 'eco-grid' });
      function dessiner() {
        var rows = store.get('Signalements').filter(function (r) { return !statut || r.statut === statut; }).slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
        liste.replaceChildren.apply(liste, rows.length ? rows.map(function (r) {
          var org = store.trouver('Organismes', r.organisme);
          return el('article', { class: 'card eco-card' }, [el('div', { class: 'meta' }, [ui.pill(label('Signalements', 'statut', r.statut)), u.date(r.date), org ? org.nom : '']), el('h2', null, r.titre), el('p', null, r.resume),
            el('p', { class: 'small muted' }, 'Source : ' + r.source), r.notes ? el('p', null, r.notes) : null,
            el('div', { class: 'actions' }, [u.lien('Publication source', r.url, 'btn'), r.preuve ? u.lien('Corroboration', r.preuve, 'btn') : null,
              action('Vérifier ou modifier', function () { signaler(r); }), action('Supprimer', function () { ui.confirmer('Supprimer ce signalement', 'Supprimer cette information de la file de vérification ?', 'Supprimer').then(function (ok) { if (ok) ui.supprimer('Signalements', r.id, 'Signalement'); }); })])]);
        }) : [el('div', { class: 'card eco-empty' }, [u.icone('fil'), el('h2', null, 'La file est vide'), el('p', null, 'Ajoutez un lien, un résumé factuel et sa source. Corroborez l’information avant de la confirmer.'), action('Signaler une information', function () { signaler(); }, true)])]);
      }
      u.append(c, [entete('Signalements à vérifier', 'Conserver la source, la date et la trace de vérification de chaque information.', [action('Signaler une information', function () { signaler(); }, true)]),
        el('aside', { class: 'eco-note' }, 'Pour les groupes Facebook, consultez avec vos droits habituels et ajoutez manuellement les informations utiles. Limitez les données personnelles et ne recopiez pas de contenu privé sans autorisation.'),
        ui.select([['', 'Tous les statuts']].concat(options('Signalements', 'statut')), statut, function (v) { statut = v; dessiner(); }, { 'aria-label': 'Statut de vérification' }), liste]);
      dessiner(); return { redessiner: dessiner };
    }
  };
  App.pages.opsec = {
    titre: 'OPSEC défensive', icone: 'defense', nouveau: function () { if (peutEcrire()) ui.formulaire('ControlesOPSEC', null); },
    rendre: function (c) {
      var liste = el('div', { class: 'eco-grid' }), bilan = el('div', { class: 'eco-note', role: 'status' });
      function dessiner() {
        var rows = store.get('ControlesOPSEC');
        bilan.textContent = rows.filter(function (r) { return r.statut === 'conforme'; }).length + ' conformes / ' + rows.length + ' contrôles. ' + rows.filter(function (r) { return r.statut === 'a_corriger'; }).length + ' points à corriger.';
        liste.replaceChildren.apply(liste, rows.map(function (r) { return el('article', { class: 'card eco-card' }, [el('div', { class: 'meta' }, [ui.pill(label('ControlesOPSEC', 'statut', r.statut)), r.date ? u.date(r.date) : 'Non contrôlé']), el('h2', null, r.titre), el('p', null, r.action), el('p', { class: 'small muted' }, r.perimetre), r.support ? u.lien('Support contrôlé', r.support) : null, r.constat ? el('p', null, r.constat) : null, modifier('ControlesOPSEC', r)]); }));
      }
      u.append(c, [entete('Protéger nos publications', 'Une grille de contrôle pour les supports de votre organisme, dans un périmètre autorisé.', [action('Ajouter un contrôle', App.pages.opsec.nouveau, true)]), bilan, liste,
        el('section', { class: 'card exercice' }, [el('div', { class: 'eyebrow' }, 'Sensibilisation / Scénario fictif'), el('h2', null, 'Une demande urgente de partenaire'),
          el('p', null, 'Dans un exercice sur table, le « capitaine Martin » d’une unité fictive reçoit un message d’un prestataire fictif demandant une liste de participants et un changement de coordonnées de paiement. Aucune personne ni organisation réelle n’est visée.'),
          el('ol', null, [el('li', null, 'Relever les signaux : urgence, demande inhabituelle, domaine ressemblant et changement de coordonnées.'), el('li', null, 'Vérifier par un canal connu et appliquer la procédure interne. Ne transmettre aucune donnée.'), el('li', null, 'Débriefer : qui alerter, quelles preuves conserver et quelle procédure améliorer ?')]),
          el('details', null, [el('summary', null, 'Fiche d’animation'), el('p', null, 'Durée indicative : 15 minutes. Rôles : animateur et participants volontaires. Réussite : demande suspendue, vérification indépendante et alerte au bon interlocuteur. Exercice sur table, sans envoi de messages ni collecte d’identifiants.')])])]);
      dessiner(); return { redessiner: dessiner };
    }
  };
  App.pagesOrdre.splice(App.pagesOrdre.indexOf('fil') + 1, 0, 'ecosysteme', 'signalements');
  App.pagesOrdre.splice(App.pagesOrdre.indexOf('sources'), 0, 'opsec');
  var rendreSynthese = App.pages.synthese.rendre;
  App.pages.synthese.rendre = function (c, params) {
    var ctrl = rendreSynthese(c, params);
    var raccourcis = el('nav', { class: 'eco-shortcuts', 'aria-label': 'Outils de veille DMD' }, [
      el('a', { href: '#/ecosysteme' }, 'Explorer l’écosystème'),
      el('a', { href: '#/signalements' }, 'Vérifier les signalements'),
      el('a', { href: '#/opsec' }, 'Contrôler nos publications')
    ]);
    c.insertBefore(raccourcis, c.children[1] || null);
    return ctrl;
  };
  // Ajouter ces données à la recherche globale sans modifier les autres rubriques.
  App.rechercheEcosysteme = function () { return [
    ['Organismes', 'Organisme', function (r) { return r.nom; }, function (r) { return r.perimetre; }, function (r) { return '#/ecosysteme'; }],
    ['Signalements', 'Signalement', function (r) { return r.titre; }, function (r) { return r.source; }, function () { return '#/signalements'; }]
  ]; };
})();
