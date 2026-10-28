window.App = window.App || {};
/* Page Archives (délinquance, catastrophes naturelles, fonds d'archives, copies archivées) et analyse d'un courriel Légifrance. */
(function () {
  var u = App.u, el = u.el, ui = App.ui, S = function () { return App.store; };
  var pages = App.pages;
  function bouton(texte, icone, onclick, cls, attrs) { return el('button', Object.assign({ class: 'btn ' + (cls || ''), type: 'button', onclick: onclick }, attrs || {}), [icone ? u.icone(icone) : null, texte]); }
  /** Fenêtre de détail réutilisable (liste de lignes libellé/valeur ou tableau). */
  function detail(titre, contenu) {
    var f = ui.fenetre(titre, contenu, [bouton('Fermer', null, function () { f.fermer(); }, 'btn-primary')]);
    f.modal.style.width = 'min(760px, 100%)';
  }
  function action(btn, nom, attente) {
    btn.disabled = true; ui.toast(attente);
    App.api.appel(nom).then(function (r) { ui.toast(r.message || r.statut || 'Terminé.', { duree: 9000 }); return S().synchroniser(true); })
      .catch(ui.erreur).then(function () { btn.disabled = false; });
  }

  /** Petite courbe d'une série de valeurs (SVG, couleurs du thème). */
  function courbe(valeurs) {
    var w = 120, h = 28, v = valeurs.map(function (x) { return x == null ? null : Number(x); });
    var ok = v.filter(function (x) { return x != null && !isNaN(x); });
    if (ok.length < 2) return el('span', { class: 'muted small' }, '');
    var min = Math.min.apply(null, ok), max = Math.max.apply(null, ok), pas = w / (v.length - 1);
    var pts = v.map(function (x, i) { return x == null ? null : [i * pas, h - 3 - (max === min ? (h - 6) / 2 : (x - min) / (max - min) * (h - 6))]; }).filter(Boolean);
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h); svg.setAttribute('width', w); svg.setAttribute('height', h); svg.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    p.setAttribute('points', pts.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' '));
    p.setAttribute('fill', 'none'); p.setAttribute('stroke', 'var(--accent)'); p.setAttribute('stroke-width', '2'); p.setAttribute('stroke-linejoin', 'round'); p.setAttribute('stroke-linecap', 'round');
    var dernier = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dernier.setAttribute('cx', pts[pts.length - 1][0]); dernier.setAttribute('cy', pts[pts.length - 1][1]); dernier.setAttribute('r', '2.5'); dernier.setAttribute('fill', 'var(--accent)');
    svg.appendChild(p); svg.appendChild(dernier);
    return svg;
  }

  /* ================= Archives ================= */
  pages.archives = {
    titre: 'Archives', icone: 'historique',
    rendre: function (c) {
      var del = S().get('Delinquance').filter(function (d) { return d.perimetre === '82' || /tarn/i.test(d.lieu); });
      var acc = S().get('AccidentsRoute');
      var cat = S().get('CatNat');
      var fonds = S().get('Sources').filter(function (s) { return s.type === 'archive'; });
      var archives = S().get('Articles').concat(S().get('Textes')).filter(function (x) { return x.archive; }).length;
      u.append(c, [
        el('div', { class: 'page-head' }, [el('div', null, [el('h1', null, 'Archives sécuritaires'), el('p', null, 'Séries officielles sur le département, fonds d\'archives à consulter, et copies archivées des articles retenus pour qu\'un lien mort ne fasse pas perdre une information.')])]),
        carteDelinquance(del),
        carteAccidents(acc),
        carteCatNat(cat),
        el('div', { class: 'grid-2' }, [
          el('article', { class: 'card', id: 'fonds' }, [el('div', { class: 'card-head' }, [el('h3', null, 'Fonds d\'archives'), el('span', { class: 'small muted' }, u.pluriel(fonds.length, 'fonds', 'fonds'))]),
            el('ul', { class: 'list' }, fonds.map(function (s) { return el('li', { class: 'item' }, [u.lien(s.nom, s.url, 'item-title'), el('span', { class: 'item-text' }, s.usage)]); }))]),
          el('article', { class: 'card', id: 'copies' }, [el('div', { class: 'card-head' }, [el('h3', null, 'Copies archivées des liens')]),
            el('p', { style: 'margin:0' }, [el('b', null, u.nombre(archives)), ' article' + (archives > 1 ? 's et textes ont' : ' ou texte a') + ' une copie sur la Wayback Machine.']),
            el('p', { class: 'card-note' }, 'Chaque heure, le serveur demande à la Wayback Machine d\'Internet Archive une copie des liens d\'intérêt moyen ou fort. archive.today bloque les robots par un captcha : son lien sert à consulter ou à archiver à la main.'),
            el('div', { class: 'actions' }, [bouton('Archiver maintenant', 'collecte', function (e) { action(e.currentTarget, 'archiverMaintenant', 'Archivage en cours…'); })]),
            el('div', { class: 'kv' }, [el('b', { class: 'small muted' }, 'Archiver une page à la main'), formArchive()])])
        ])
      ]);
    }
  };

  function formArchive() {
    var inp = el('input', { class: 'input', type: 'url', placeholder: 'https://…', 'aria-label': 'Adresse à archiver', id: 'arch-url', style: 'flex:1 1 220px' });
    var ouvrir = function (fn) { return function () { var v = inp.value.trim(); if (!/^https?:\/\//.test(v)) return ui.toast('Colle une adresse commençant par https://', { erreur: true }); window.open(fn(v), '_blank', 'noopener'); }; };
    return el('div', { class: 'filters' }, [inp,
      bouton('archive.today', null, ouvrir(function (v) { return 'https://archive.ph/?run=1&url=' + encodeURIComponent(v); }), 'btn-sm'),
      bouton('Wayback', null, ouvrir(function (v) { return 'https://web.archive.org/save/' + v; }), 'btn-sm'),
      bouton('Voir les copies', null, ouvrir(function (v) { return 'https://archive.ph/' + v; }), 'btn-sm btn-ghost')]);
  }

  /** Carte générique pour une série annuelle par indicateur (Délinquance, Accidents de la route…). */
  function carteSerie(opts) {
    var data = opts.data;
    var annees = Array.from(new Set(data.map(function (d) { return d.annee; }))).sort();
    var inds = Array.from(new Set(data.map(function (d) { return d.indicateur; }))).sort(function (a, b) { return a.localeCompare(b, 'fr'); });
    var val = function (ind, an) { var r = data.find(function (d) { return d.indicateur === ind && d.annee === an; }); return r && r.nombre !== '' ? Number(r.nombre) : null; };
    var corps;
    if (!data.length) {
      corps = el('div', { class: 'embed-zone', style: 'min-height:120px' }, [el('p', null, opts.vide),
        bouton('Importer maintenant', 'export', function (e) { action(e.currentTarget, opts.action, opts.attente); })]);
    } else {
      var dernier = annees[annees.length - 1], avant = annees[annees.length - 2];
      corps = el('div', { class: 'tablebox' }, el('table', { class: 't' }, [
        el('thead', null, el('tr', null, [el('th', null, 'Indicateur'), el('th', { class: 'num' }, dernier), el('th', { class: 'num' }, 'Évolution sur un an'), el('th', { class: 'hide-narrow' }, annees[0] + ' à ' + dernier)])),
        el('tbody', null, inds.map(function (ind) {
          var a = val(ind, dernier), b = val(ind, avant);
          var evo = a != null && b ? Math.round((a - b) / b * 1000) / 10 : null;
          var tr = el('tr', { class: 'ligne-detail', tabindex: '0', role: 'button', title: 'Voir toutes les années', onclick: function () { detailSerie(opts.titre, ind, data, annees); } }, [el('td', null, ind), el('td', { class: 'num' }, a == null ? 'non diffusé' : u.nombre(a)),
            el('td', { class: 'num', style: evo == null ? '' : 'color:' + (evo > 0 ? 'var(--fort)' : 'var(--ok)') }, evo == null ? '' : (evo > 0 ? '+' : '') + evo.toLocaleString('fr-FR') + ' %'),
            el('td', { class: 'hide-narrow' }, courbe(annees.map(function (an) { return val(ind, an); })))]);
          tr.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); tr.click(); } });
          return tr;
        }))]));
    }
    return el('article', { class: 'card', id: opts.id }, [
      el('div', { class: 'card-head' }, [el('h3', null, opts.titre), el('span', { class: 'small muted' }, 'Source : ' + opts.source)]),
      corps,
      data.length && opts.note ? el('p', { class: 'card-note' }, opts.note) : null,
      data.length ? el('div', { class: 'actions' }, [bouton('Actualiser', 'collecte', function (e) { action(e.currentTarget, opts.action, opts.attente); }, 'btn-sm'), bouton('Excel', 'export', function () { ui.exporterXlsx(opts.id + '-82', data, App.SCHEMA.tables[opts.table].fields); }, 'btn-sm')]) : null
    ]);
  }

  /** Détail d'un indicateur : toutes les années, valeur et taux. */
  function detailSerie(titreSerie, ind, data, annees) {
    var lignes = data.filter(function (d) { return d.indicateur === ind; });
    var parAn = {}; lignes.forEach(function (d) { parAn[d.annee] = d; });
    var unite = (lignes[0] || {}).unite || '';
    detail(ind, el('div', { style: 'display:grid;gap:10px' }, [
      el('p', { class: 'small muted', style: 'margin:0' }, titreSerie + (unite ? ' · ' + unite : '')),
      el('div', { class: 'tablebox' }, el('table', { class: 't' }, [
        el('thead', null, el('tr', null, [el('th', null, 'Année'), el('th', { class: 'num' }, 'Nombre'), el('th', { class: 'num' }, 'Taux')])),
        el('tbody', null, annees.slice().reverse().map(function (an) {
          var r = parAn[an];
          return el('tr', null, [el('td', null, an), el('td', { class: 'num' }, r && r.nombre !== '' ? u.nombre(Number(r.nombre)) : 'non diffusé'), el('td', { class: 'num' }, r && r.taux ? r.taux : '')]);
        }))]))
    ]));
  }

  function carteDelinquance(del) {
    return carteSerie({
      data: del, id: 'delinquance', table: 'Delinquance', titre: 'Délinquance enregistrée dans le Tarn-et-Garonne', source: 'SSMSI, ministère de l\'Intérieur',
      vide: 'Les chiffres officiels de la délinquance enregistrée par la police et la gendarmerie (SSMSI, depuis 2016) sont importés par le serveur au déploiement, puis chaque mois.',
      note: 'Faits enregistrés par la police et la gendarmerie, pas la délinquance réelle. Une hausse peut traduire davantage de plaintes ou de contrôles. Valeurs non diffusées : secret statistique.',
      action: 'importerDelinquance', attente: 'Import des statistiques…'
    });
  }

  function carteAccidents(acc) {
    return carteSerie({
      data: acc, id: 'accidents', table: 'AccidentsRoute', titre: 'Accidents corporels de la circulation', source: 'open data du Tarn-et-Garonne (82 Aménagement)',
      vide: 'Les accidents corporels de la circulation routière, recensés commune par commune, sont importés par le serveur au déploiement, puis chaque mois.',
      note: 'Jeu de données départemental : vérifie les premiers résultats avec « Tester cette source » dans l\'onglet Sources avant de t\'y fier pleinement.',
      action: 'importerAccidents', attente: 'Import des accidents, environ une minute…'
    });
  }

  function carteCatNat(cat) {
    if (!cat.length) {
      return el('article', { class: 'card', id: 'catnat' }, [el('div', { class: 'card-head' }, [el('h3', null, 'Catastrophes naturelles reconnues'), el('span', { class: 'small muted' }, 'Source : base GASPAR, Géorisques')]),
        el('div', { class: 'embed-zone', style: 'min-height:120px' }, [el('p', null, 'Tous les arrêtés de catastrophe naturelle des 195 communes (inondations, coulées de boue, sécheresse, tempêtes) sont importés par le serveur au déploiement, puis chaque mois.'),
          bouton('Importer maintenant', 'export', function (e) { action(e.currentTarget, 'importerCatNat', 'Import des arrêtés, environ une minute…'); })])]);
    }
    var parRisque = {}, parAnnee = {}, parCommune = {};
    var evts = {};
    cat.forEach(function (x) {
      parRisque[x.risque] = (parRisque[x.risque] || 0) + 1;
      parCommune[x.commune] = (parCommune[x.commune] || 0) + 1;
      var k = x.risque + '|' + x.debut;
      if (!evts[k]) evts[k] = { risque: x.risque, debut: x.debut, fin: x.fin, arrete: x.arrete, communes: [] };
      evts[k].communes.push(x.commune);
      var an = String(x.debut).slice(0, 4); if (an) parAnnee[an] = (parAnnee[an] || 0) + 1;
    });
    var connues = Object.keys(parAnnee).sort(), annees = [];
    for (var y = Number(connues[0]); y <= Number(connues[connues.length - 1]); y++) { annees.push(String(y)); parAnnee[y] = parAnnee[y] || 0; }
    var max = Math.max.apply(null, annees.map(function (a) { return parAnnee[a]; }));
    var barres = el('div', { class: 'catnat-bars', role: 'img', 'aria-label': 'Nombre d\'arrêtés par année de l\'événement' }, annees.map(function (a) {
      var b = el('div', { class: 'cb', title: a + ' : ' + parAnnee[a] + ' arrêtés communaux' }); b.style.height = (parAnnee[a] ? Math.max(2, 100 * parAnnee[a] / max) : 0) + '%';
      return el('div', { class: 'cb-col' }, [b, el('span', { class: 'cb-l' }, a.slice(2))]);
    }));
    var top = function (o, n) { return Object.keys(o).map(function (k) { return [k, o[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, n); };
    var recents = Object.keys(evts).map(function (k) { return evts[k]; }).sort(function (a, b) { return String(b.debut).localeCompare(String(a.debut)); }).slice(0, 12);
    return el('article', { class: 'card', id: 'catnat' }, [
      el('div', { class: 'card-head' }, [el('h3', null, 'Catastrophes naturelles reconnues'), el('span', { class: 'small muted' }, u.nombre(cat.length) + ' arrêtés communaux, source GASPAR')]),
      el('div', { class: 'small muted' }, 'Arrêtés par année de l\'événement'), barres,
      el('div', { class: 'grid' }, [
        el('div', { class: 'kv' }, [el('b', null, 'Par risque'), el('ul', { class: 'linked' }, top(parRisque, 8).map(function (x) { return el('li', null, x[0] + ' : ' + u.nombre(x[1])); }))]),
        el('div', { class: 'kv' }, [el('b', null, 'Communes les plus touchées'), el('ul', { class: 'linked' }, top(parCommune, 8).map(function (x) { return el('li', null, x[0] + ' : ' + u.nombre(x[1])); }))]),
        el('div', { class: 'kv' }, [el('b', null, 'Derniers événements reconnus'), el('ul', { class: 'linked' }, recents.map(function (e) {
          var li = el('li', { class: 'ligne-detail', tabindex: '0', role: 'button', title: 'Voir les communes et l\'arrêté', onclick: function () { detailCatNat(e); } }, u.date(e.debut) + ' · ' + e.risque + ' · ' + u.pluriel(e.communes.length, 'commune'));
          li.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); li.click(); } });
          return li;
        }))])
      ]),
      el('div', { class: 'actions' }, [bouton('Actualiser', 'collecte', function (e) { action(e.currentTarget, 'importerCatNat', 'Import des arrêtés, environ une minute…'); }, 'btn-sm'), bouton('Excel', 'export', function () { ui.exporterXlsx('catnat-82', cat, App.SCHEMA.tables.CatNat.fields); }, 'btn-sm')])
    ]);
  }

  /** Détail d'un événement de catastrophe naturelle : communes, arrêté, dates. */
  function detailCatNat(e) {
    var com = e.communes.slice().sort(function (a, b) { return a.localeCompare(b, 'fr'); });
    detail(e.risque + ' du ' + u.date(e.debut), el('div', { class: 'kv-detail', style: 'display:grid;gap:14px' }, [
      el('div', { class: 'grid-2' }, [
        el('div', { class: 'kv' }, [el('b', { class: 'small muted' }, 'Période'), el('span', null, u.date(e.debut) + (e.fin && e.fin !== e.debut ? ' au ' + u.date(e.fin) : ''))]),
        el('div', { class: 'kv' }, [el('b', { class: 'small muted' }, 'Arrêté de reconnaissance'), el('span', null, (e.arrete || 'référence non précisée') + (e.jo ? ' · JO du ' + u.date(e.jo) : ''))])
      ]),
      el('div', { class: 'kv' }, [el('b', { class: 'small muted' }, u.pluriel(com.length, 'commune') + ' reconnue' + (com.length > 1 ? 's' : '')),
        el('div', { class: 'chips-communes' }, com.map(function (c) { return el('span', { class: 'chip-commune' }, c); }))])
    ]));
  }

  /* ================= Analyse d'un courriel Légifrance ================= */
  var rendreTextes = pages.textes.rendre;
  pages.textes.rendre = function (c, p) {
    var r = rendreTextes(c, p);
    var actions = c.querySelector('.page-head .actions');
    if (actions) actions.insertBefore(bouton('Analyser un courriel Légifrance', 'journal', analyseCourriel, '', { id: 'btn-courriel' }), actions.firstChild);
    var note = el('p', { class: 'card-note', id: 'note-legifrance' }, ['Trois entrées pour le Journal officiel : les courriels Légifrance reçus sur le compte Google du site, lus à chaque collecte ; un courriel collé ici avec « Analyser un courriel Légifrance » ; l\'API Légifrance si les clés PISTE sont en place. Pour un nom, la page Suivis propose une recherche « Nominations (JO) ».']);
    var filtres = c.querySelector('#filtres-textes');
    if (filtres) filtres.parentNode.insertBefore(note, filtres);
    return r;
  };

  function decoderEml(txt) {
    var t = String(txt);
    var m = t.match(/Content-Type:\s*text\/html[\s\S]*?\r?\n\r?\n([\s\S]*?)(\r?\n--|$)/i);
    if (!m) return t;
    var entete = t.slice(Math.max(0, m.index), m.index + 300);
    var corps = m[1];
    if (/base64/i.test(entete)) { try { corps = decodeURIComponent(escape(atob(corps.replace(/\s+/g, '')))); } catch (e) { /* laissé tel quel */ } }
    else if (/quoted-printable/i.test(entete)) {
      corps = corps.replace(/=\r?\n/g, '');
      try { corps = decodeURIComponent(corps.replace(/%/g, '%25').replace(/=([0-9A-F]{2})/gi, '%$1')); } catch (e) { corps = corps.replace(/=([0-9A-F]{2})/gi, function (x, h) { return String.fromCharCode(parseInt(h, 16)); }); }
    }
    return corps;
  }

  function analyseCourriel() {
    var contenu = { html: '' };
    var zone = el('textarea', { class: 'input', id: 'courriel-texte', placeholder: 'Ouvre le courriel Légifrance, sélectionne tout (Ctrl+A), copie (Ctrl+C) et colle ici (Ctrl+V). Tu peux aussi choisir un fichier .eml ou .html.', style: 'min-height:140px' });
    zone.addEventListener('paste', function (e) {
      var h = e.clipboardData && e.clipboardData.getData('text/html');
      if (h) { e.preventDefault(); contenu.html = h; zone.value = (e.clipboardData.getData('text/plain') || '').slice(0, 4000); analyser(); }
    });
    zone.addEventListener('input', function () { contenu.html = ''; });
    var fichier = el('input', { type: 'file', accept: '.eml,.html,.htm,.txt', id: 'courriel-fichier', 'aria-label': 'Fichier du courriel' });
    fichier.addEventListener('change', function () {
      var f = fichier.files[0]; if (!f) return;
      var lec = new FileReader();
      lec.onload = function () { contenu.html = /\.eml$/i.test(f.name) ? decoderEml(lec.result) : lec.result; zone.value = 'Fichier : ' + f.name; analyser(); };
      lec.readAsText(f);
    });
    var resultat = el('div', { id: 'courriel-resultat', style: 'display:grid;gap:8px' });
    var liste = [];
    var existants = S().get('Textes');
    var dejaVu = function (t) { return existants.some(function (x) { return (t.id && x.nor === t.id) || (t.url && x.url === t.url); }); };
    function analyser() {
      var brut = contenu.html || zone.value;
      if (!brut.trim()) return ui.toast('Colle d\'abord le courriel.', { erreur: true });
      var suivis = App.LF.preparerSuivis(S().get('Suivis'));
      liste = App.LF.analyser(brut).map(function (t) { var n = App.LF.noter(t, suivis); return { t: t, n: n, coche: n.garder && !dejaVu(t), deja: dejaVu(t) }; })
        .sort(function (a, b) { return b.n.interet - a.n.interet || (b.n.garder - a.n.garder); });
      var gardes = liste.filter(function (x) { return x.n.garder; }).length;
      resultat.replaceChildren(
        el('p', { class: 'small', style: 'margin:0' }, liste.length ? u.pluriel(liste.length, 'texte') + ' trouvé' + (liste.length > 1 ? 's' : '') + ', ' + gardes + ' dans le périmètre (Armées, Intérieur, défense, sécurité, suivis). Les plus importants sont en tête.' : 'Aucun texte reconnu. Essaie de copier tout le courriel, ou enregistre-le en .eml et choisis le fichier.'),
        el('div', { class: 'mod-list', style: 'max-height:45vh' }, liste.map(function (x, i) {
          var cb = el('input', { type: 'checkbox', id: 'lf-' + i, disabled: x.deja });
          cb.checked = x.coche; cb.addEventListener('change', function () { x.coche = cb.checked; });
          return el('div', { class: 'mod-row', style: 'grid-template-columns:auto 1fr;align-items:start' + (x.n.garder ? '' : ';opacity:.6') }, [cb, el('label', { for: 'lf-' + i, style: 'display:grid;gap:2px' }, [
            el('span', { style: 'font-weight:600' }, x.t.titre),
            el('span', { class: 'meta' }, [ui.pill({ 3: 'Fort', 2: 'Moyen', 1: 'Faible' }[x.n.interet], 'pill-' + x.n.interet), el('span', null, ui.opt('Textes', 'categorie', x.n.categorie)), x.t.ministere ? el('span', null, x.t.ministere) : null, el('span', null, x.deja ? 'déjà dans les textes' : x.n.raison)])])]);
        })));
    }
    var f = ui.fenetre('Analyser un courriel Légifrance', el('div', { style: 'display:grid;gap:10px' }, [zone, el('div', { class: 'filters' }, [fichier, bouton('Analyser', null, analyser, 'btn-sm')]), resultat]), [
      bouton('Annuler', null, function () { f.fermer(); }),
      bouton('Ajouter les textes cochés', 'plus', function () {
        var choisis = liste.filter(function (x) { return x.coche && !x.deja; });
        if (!choisis.length) return ui.toast('Aucun texte coché.', { erreur: true });
        var date = (function () {
          var m = String(choisis[0].t.dateJo || '').match(/(\d{1,2})(?:er)? (\S+) (\d{4})/);
          var mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
          var i = m ? mois.indexOf(m[2].toLowerCase()) : -1;
          return i >= 0 ? m[3] + '-' + String(i + 1).padStart(2, '0') + '-' + m[1].padStart(2, '0') : u.aujourdhui();
        })();
        var suite = Promise.resolve();
        choisis.forEach(function (x) {
          suite = suite.then(function () {
            return S().enregistrer('Textes', { date: date, source: 'jorf', categorie: x.n.categorie, interet: String(x.n.interet), titre: x.t.titre, resume: '', ministere: x.t.ministere || '', nature: x.t.nature || '',
              nor: x.t.id || '', url: x.t.url, suivis: x.n.suivis.join(', '), statut: 'nouveau', origine: 'manuel', notes: 'Courriel Légifrance analysé : ' + x.n.raison, ajoute_le: new Date().toISOString().slice(0, 16).replace('T', ' ') });
          });
        });
        suite.then(function () { f.fermer(); ui.toast(u.pluriel(choisis.length, 'texte') + ' ajouté' + (choisis.length > 1 ? 's' : '') + ' aux textes officiels.'); }, ui.erreur);
      }, 'btn-primary', { id: 'btn-ajouter-textes' })
    ]);
    f.modal.style.width = 'min(820px, 100%)';
  }
})();
