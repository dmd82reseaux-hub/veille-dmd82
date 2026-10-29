window.App = window.App || {};
/* Tableau de bord en modules, pages Textes officiels et Suivis, outils réseaux (recherches connectées, capture, recherche par Claude). */
(function () {
  var u = App.u, el = u.el, ui = App.ui, S = function () { return App.store; };
  var pages = App.pages;
  var CANAUX = ['officiel', 'presse_locale', 'presse_nationale', 'reseaux_sociaux'];
  var opt = function (t, c, v) { return ui.opt(t, c, v); };
  var options = function (t, c) { var f = App.SCHEMA.tables[t].fields.find(function (x) { return x.name === c; }); return Object.keys(f.options).map(function (k) { return [k, f.options[k]]; }); };
  var parDateDesc = function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); };
  function bouton(texte, icone, onclick, cls, attrs) { return el('button', Object.assign({ class: 'btn ' + (cls || ''), type: 'button', onclick: onclick }, attrs || {}), [icone ? u.icone(icone) : null, texte]); }
  function tete(titre, texte, actions) { return el('div', { class: 'page-head' }, [el('div', null, [el('h1', null, titre), texte ? el('p', null, texte) : null]), actions ? el('div', { class: 'actions' }, actions) : null]); }
  function carte(id, titre, lien, contenu, note) {
    return el('article', { class: 'card module', id: 'mod-' + id }, [el('div', { class: 'card-head' }, [el('h3', null, titre), lien ? el('a', { class: 'small', href: lien[0] }, lien[1]) : (note ? el('span', { class: 'small muted' }, note) : null)]), contenu]);
  }
  function itemArticle(a, une) {
    var meta = el('div', { class: 'meta' }, [ui.pill(opt('Articles', 'interet', a.interet), 'pill-' + a.interet)].concat(u.etiquettesAge(a)).concat([el('span', null, a.source), a.suivis ? el('span', { class: 'suivi-tag' }, a.suivis) : null]));
    var cls = 'item' + (a.statut === 'nouveau' ? ' item-new' : '') + (u.fraicheur(a).ancien ? ' ancien' : '');
    if (une && a.image) return el('li', { class: cls + ' une' }, [u.image(a.image, '', ''), u.lien(a.titre, a.url, 'item-title'), meta]);
    if (a.image) return el('li', { class: cls }, el('div', { class: 'item-img' }, [el('div', { style: 'display:grid;gap:3px;min-width:0' }, [u.lien(a.titre, a.url, 'item-title'), meta]), u.image(a.image, 'thumb', '')]));
    return el('li', { class: cls }, [u.lien(a.titre, a.url, 'item-title'), meta]);
  }
  function itemTexte(t) {
    return el('li', { class: 'item' + (t.statut === 'nouveau' ? ' item-new' : '') }, [u.lien(t.titre, t.url, 'item-title'),
      el('div', { class: 'meta' }, [ui.pill(opt('Textes', 'categorie', t.categorie), 'pill-' + t.interet)].concat(u.etiquettesAge(t)).concat([ el('span', null, opt('Textes', 'source', t.source)), t.suivis ? el('span', { class: 'suivi-tag' }, t.suivis) : null]))]);
  }
  function liste(l, rendu, vide) { return l.length ? el('ul', { class: 'list' }, l.map(rendu)) : ui.vide(vide); }

  /* ================= Modules du tableau de bord ================= */
  var MODULES = [
    { id: 'situation', titre: 'Situation du jour', large: true, rendre: function () { return moduleSituation(); } },
    { id: 'indicateurs', titre: 'Indicateurs', large: true, rendre: function () { return moduleIndicateurs(); } },
    { id: 'geopolitique', titre: 'Géopolitique du jour', large: true, rendre: function () { return App.geo.module(); } },
    { id: 'officiel', titre: 'Sources officielles', rendre: function () { return moduleCanal('officiel'); } },
    { id: 'presse_locale', titre: 'Presse locale', rendre: function () { return moduleCanal('presse_locale'); } },
    { id: 'presse_nationale', titre: 'Presse nationale', rendre: function () { return moduleCanal('presse_nationale'); } },
    { id: 'reseaux_sociaux', titre: 'Réseaux sociaux', rendre: function () { return moduleCanal('reseaux_sociaux'); } },
    { id: 'zone_sud', titre: 'Zone de défense Sud', rendre: function () { return modulePerimetre('zone_sud', 'Zone de défense Sud', 'Rien de nouveau dans la zone Sud depuis deux mois.'); } },
    { id: 'national', titre: 'Armées (national)', rendre: function () { return modulePerimetre('national', 'Armées : actualité nationale', 'Rien de nouveau au niveau national depuis deux mois.'); } },
    { id: 'audio_video', titre: 'À écouter, à voir', rendre: function () {
      var l = S().get('Articles').filter(function (a) { return a.canal === 'audio_video' && a.statut !== 'ecarte' && u.fraicheur(a).jours <= 30; })
        .sort(parDateDesc).slice(0, 6);
      return carte('audio_video', 'À écouter, à voir', ['#/fil?canal=audio_video', 'Tout voir'], liste(l, function (a) {
        var video = /youtube\.com|youtu\.be/.test(a.url || '');
        return el('li', { class: 'item' }, [u.lien(a.titre, a.url, 'item-title'),
          el('div', { class: 'meta' }, [ui.pill(video ? 'Vidéo' : 'Podcast', 'pill-1')].concat(u.etiquettesAge(a)).concat([el('span', null, a.source)]))]);
      }, 'Les nouvelles vidéos et émissions des chaînes et podcasts suivis apparaîtront ici après chaque collecte.'), '30 derniers jours');
    } },
    { id: 'presse_specialisee', titre: 'Presse spécialisée défense', rendre: function () {
      var l = S().get('Articles').filter(function (a) { return a.canal === 'presse_specialisee' && a.statut !== 'ecarte' && u.fraicheur(a).jours <= 60; })
        .sort(function (a, b) { return parDateDesc(a, b) || Number(b.interet) - Number(a.interet); }).slice(0, 6);
      return carte('presse_specialisee', 'Presse spécialisée défense', ['#/fil?canal=presse_specialisee', 'Tout voir'], liste(l, function (a) { return itemArticle(a); }, 'Rien de nouveau dans la presse spécialisée depuis deux mois.'));
    } },
    { id: 'textes', titre: 'Textes officiels', rendre: function () {
      var l = S().get('Textes').filter(function (t) { return t.statut !== 'ecarte' && t.categorie !== 'nomination'; }).sort(parDateDesc).slice(0, 6);
      return carte('textes', 'Textes officiels', ['#/textes', 'Tous les textes'], liste(l, itemTexte, 'Aucun texte collecté. Le Journal officiel est relu toutes les 6 heures.'));
    } },
    { id: 'nominations', titre: 'Nominations', rendre: function () {
      var l = S().get('Textes').filter(function (t) { return t.statut !== 'ecarte' && (t.categorie === 'nomination' || /nomination/i.test(t.resume || '')); }).sort(parDateDesc).slice(0, 6);
      return carte('nominations', 'Nominations', ['#/textes?categorie=nomination', 'Toutes'], liste(l, itemTexte, 'Aucune nomination relevée.'));
    } },
    { id: 'suivis', titre: 'Suivis repérés', rendre: function () {
      var l = S().get('Articles').filter(function (a) { return a.suivis; }).map(function (a) { return { t: 'a', r: a, date: a.date }; })
        .concat(S().get('Textes').filter(function (t) { return t.suivis; }).map(function (t) { return { t: 't', r: t, date: t.date }; }))
        .sort(parDateDesc).slice(0, 7);
      return carte('suivis', 'Personnes et mots-clés suivis', ['#/suivis', 'Gérer les suivis'], liste(l, function (x) { return x.t === 'a' ? itemArticle(x.r) : itemTexte(x.r); }, 'Aucune mention des suivis pour l\'instant.'));
    } },
    { id: 'cas', titre: 'Cas à suivre', rendre: function () {
      var l = S().get('Cas').filter(function (x) { return x.statut !== 'clos'; }).sort(function (a, b) { return Number(b.priorite) - Number(a.priorite); }).slice(0, 6);
      return carte('cas', 'Cas à suivre', ['#/cas', 'Tous les cas'], liste(l, function (x) {
        return el('li', { class: 'item' }, [el('a', { class: 'item-title', href: '#/cas?id=' + encodeURIComponent(x.id) }, x.titre), el('div', { class: 'meta' }, [ui.pill(opt('Cas', 'statut', x.statut), 'pill-' + x.statut), el('span', null, x.categorie), x.echeance ? el('span', null, 'Échéance : ' + u.date(x.echeance)) : null])]);
      }, 'Aucun cas ouvert.'));
    } },
    { id: 'echeances', titre: 'Échéances', rendre: function () {
      var today = u.aujourdhui();
      var l = S().get('Cas').filter(function (x) { return x.statut !== 'clos' && /^\d{4}-\d{2}-\d{2}$/.test(x.echeance) && x.echeance >= today; }).sort(function (a, b) { return a.echeance.localeCompare(b.echeance); });
      return carte('echeances', 'Prochaines échéances', null, liste(l, function (x) { return el('li', { class: 'item' }, [el('span', { class: 'tl-date' }, u.date(x.echeance)), el('a', { class: 'item-title', href: '#/cas?id=' + encodeURIComponent(x.id) }, x.echeance_objet || x.titre)]); }, 'Aucune échéance datée.'));
    } },
    { id: 'reseaux', titre: 'Réseaux de la DMD', rendre: function () {
      var pubs = S().get('Publications').slice().sort(parDateDesc).slice(0, 4);
      var comptes = [['facebook', 'Facebook', S().param('facebook_url')], ['x', 'X', S().param('x_compte')], ['linkedin', 'LinkedIn', S().param('linkedin_url')]];
      return carte('reseaux', 'Réseaux de la DMD', ['#/reseaux', 'Ouvrir'], el('div', { style: 'display:grid;gap:10px' }, [
        el('div', { class: 'meta' }, comptes.map(function (c) { return el('span', { class: 'reseau-head' }, [el('span', { class: 'reseau-logo r-' + c[0], style: 'width:20px;height:20px;font-size:11px' }, c[1][0]), c[2] ? 'configuré' : 'à configurer']); })),
        liste(pubs, function (p) { return el('li', { class: 'item' }, [u.lien(p.texte ? p.texte.slice(0, 110) : 'Publication', p.url, 'item-title'), el('div', { class: 'meta' }, [opt('Publications', 'reseau', p.reseau), u.date(p.date), p.vues ? u.nombre(p.vues) + ' réactions' : null])]); }, 'Aucune publication enregistrée.')
      ]));
    } },
    { id: 'themes', titre: 'Articles par thème', rendre: function () {
      var arts = S().get('Articles').filter(function (a) { return a.date >= u.dateDecalee(-30) && a.statut !== 'ecarte'; });
      var n = {}; arts.forEach(function (a) { n[a.theme] = (n[a.theme] || 0) + 1; });
      var l = Object.keys(n).map(function (k) { return [k, n[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
      var max = l.length ? l[0][1] : 1;
      return carte('themes', 'Articles par thème', null, l.length ? el('div', { class: 'bars' }, l.map(function (x) {
        var b = el('div', { class: 'bar' }); b.style.width = (100 * x[1] / max) + '%';
        return el('a', { class: 'bar-row', href: '#/fil?theme=' + x[0] + '&periode=30', style: 'text-decoration:none' }, [el('span', null, opt('Articles', 'theme', x[0])), el('div', { class: 'bar-track' }, b), el('span', { class: 'num', style: 'text-align:right' }, x[1])]);
      })) : ui.vide('Aucun article sur la période.'), '30 derniers jours');
    } },
    { id: 'vigilances', titre: 'Vigilances en direct', rendre: function () {
      var v = S().get('Sources').filter(function (s) { return s.type === 'vigilance'; });
      return carte('vigilances', 'Vigilances en direct', ['#/risques', 'Risques'], liste(v, function (s) { return el('li', { class: 'item' }, [u.lien(s.nom, s.url, 'item-title'), el('span', { class: 'item-text' }, s.usage)]); }, 'Aucun lien.'));
    } },
    { id: 'historique', titre: 'Derniers événements de sécurité', rendre: function () {
      var l = S().get('Evenements').filter(function (e) { return e.type === 'securite'; }).sort(parDateDesc).slice(0, 4);
      return carte('historique', 'Derniers événements de sécurité', ['#/historique', 'Historique'], liste(l, function (e) { return el('li', { class: 'item' }, [el('span', { class: 'tl-date' }, u.date(e.date) + ' · ' + e.nature), u.lien(e.titre, e.url, 'item-title')]); }, 'Aucun événement.'));
    } }
  ];
  var DEFAUT = ['situation', 'indicateurs', 'officiel', 'presse_locale', 'presse_nationale', 'reseaux_sociaux', 'zone_sud', 'national', 'presse_specialisee', 'geopolitique', 'audio_video', 'textes', 'nominations', 'suivis', 'cas', 'reseaux', 'echeances', 'themes', 'vigilances', 'historique', 'alertes'];
  function config() {
    var c = u.lire('modules', null);
    if (!Array.isArray(c)) c = DEFAUT.map(function (id) { return { id: id, visible: true }; });
    MODULES.forEach(function (m) { if (!c.some(function (x) { return x.id === m.id; })) c.push({ id: m.id, visible: true }); });
    return c.filter(function (x) { return MODULES.some(function (m) { return m.id === x.id; }); });
  }

  function moduleSituation() {
    var sit = S().get('Situation').slice().sort(function (a, b) { return Number(a.ordre || 9) - Number(b.ordre || 9); });
    var g = function (k) { return sit.find(function (r) { return r.cle === k; }) || {}; };
    var photo = S().param('photo_bandeau'), credit = S().param('photo_credit'), lienPhoto = '';
    if (!u.safeUrl(photo)) {
      var une = S().get('Articles').filter(function (a) { return a.image && a.statut !== 'ecarte'; }).sort(function (a, b) { return Number(b.interet) - Number(a.interet) || parDateDesc(a, b); })
        .sort(parDateDesc).find(function (a) { return a.interet === '3'; }) || S().get('Articles').filter(function (a) { return a.image; }).sort(parDateDesc)[0];
      if (une) { photo = une.image; credit = 'Photo : ' + une.source; lienPhoto = une.url; }
    }
    var blasonHero = el('img', { src: 'img/emblem.png', alt: '', class: 'hero-blason' });
    blasonHero.addEventListener('error', function () { blasonHero.remove(); });
    var hero = el('div', { class: 'hero', id: 'bandeau' }, [
      el('span', { class: 'hero-dtg', title: 'Dernière veille (groupe date-heure)' }, g('derniere_veille').valeur || '…'),
      blasonHero,
      el('div', { class: 'hero-in' }, [el('span', { class: 'eyebrow' }, 'Tarn-et-Garonne · ' + new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })),
        el('h1', null, 'Situation du jour'), el('p', null, g('synthese').valeur || 'Pas encore de synthèse.')]),
      credit ? (lienPhoto ? u.lien(credit, lienPhoto, 'hero-credit') : el('span', { class: 'hero-credit' }, credit)) : null
    ]);
    if (u.safeUrl(photo)) {
      var pre = new Image(); pre.referrerPolicy = 'no-referrer';
      pre.onload = function () { hero.style.backgroundImage = 'url("' + photo.replace(/"/g, '%22') + '")'; };
      pre.src = photo;
    }
    return el('section', { class: 'module large', id: 'situation', style: 'display:grid;gap:12px' }, [hero, el('div', { class: 'situation' }, [
      el('div', { class: 'chips' }, sit.filter(function (r) { return r.cle !== 'synthese' && r.cle !== 'derniere_veille'; }).map(function (r) {
        return el('div', { class: 'chip' + (/crise|rouge|urgence|interdiction|arrêt/i.test(r.valeur + r.libelle) ? ' chip-alerte' : '') }, [
          el('span', { class: 'k' }, r.libelle), el('span', { class: 'v' }, r.valeur), r.detail ? el('span', { class: 'd' }, r.detail) : null,
          el('span', { class: 'd' }, [u.lien(r.source || 'Source', r.url), r.date ? ', ' + u.date(r.date) : ''])]);
      }))
    ])]);
  }
  function moduleIndicateurs() {
    var arts = S().get('Articles'), textes = S().get('Textes'), cas = S().get('Cas'), j7 = u.dateDecalee(-7);
    var tuile = function (href, k, v, d, cls) { return el('a', { class: 'tile ' + (cls || ''), href: href }, [el('span', { class: 'k' }, k), el('span', { class: 'v' }, v), el('span', { class: 'd' }, d)]); };
    return el('div', { class: 'tiles module large', id: 'tuiles' }, [
      tuile('#/fil?statut=nouveau', 'Articles à traiter', u.nombre(arts.filter(function (a) { return a.statut === 'nouveau'; }).length), 'non lus'),
      tuile('#/fil?interet=3&periode=7', 'Intérêt fort', u.nombre(arts.filter(function (a) { return a.interet === '3' && a.date >= j7; }).length), '7 derniers jours', 'tile-fort'),
      tuile('#/textes?statut=nouveau', 'Textes officiels', u.nombre(textes.filter(function (t) { return t.statut === 'nouveau'; }).length), 'à lire'),
      tuile('#/suivis', 'Suivis repérés', u.nombre(arts.concat(textes).filter(function (x) { return x.suivis && x.date >= j7; }).length), '7 derniers jours'),
      tuile('#/cas', 'Cas ouverts', u.nombre(cas.filter(function (x) { return x.statut !== 'clos'; }).length), u.pluriel(cas.filter(function (x) { return x.statut !== 'clos' && x.priorite === '3'; }).length, 'prioritaire'))
    ]);
  }
  function du82(a) { return !a.perimetre || a.perimetre === 'departement'; }
  function modulePerimetre(p, titre, vide) {
    var l = S().get('Articles').filter(function (a) { return a.perimetre === p && a.canal !== 'presse_specialisee' && a.canal !== 'audio_video' && a.statut !== 'ecarte' && u.fraicheur(a).jours <= 60; })
      .sort(function (a, b) { return parDateDesc(a, b) || Number(b.interet) - Number(a.interet); }).slice(0, 6);
    return carte(p, titre, ['#/fil?perimetre=' + p, 'Tout voir'], liste(l, function (a) { return itemArticle(a); }, vide));
  }
  function moduleCanal(k) {
    var tous = S().get('Articles').filter(function (a) { return a.canal === k && a.statut !== 'ecarte' && du82(a); }).sort(parDateDesc);
    var l = tous.filter(function (a) { return u.fraicheur(a).jours <= 60; }).slice(0, 5);
    var contenu = l.length ? el('ul', { class: 'list' }, l.map(function (a, i) { return itemArticle(a, i === 0); }))
      : ui.vide(tous.length ? 'Rien depuis deux mois. Dernière information : ' + u.date(tous[0].date) + '.' : 'Rien pour ce type de source.');
    var c = carte(k, opt('Articles', 'canal', k), ['#/fil?canal=' + k, 'Tout voir'], contenu);
    c.classList.add('encart', 'canal-' + k);
    c.querySelector('h3').prepend(el('span', { class: 'swatch' }));
    return c;
  }

  pages.synthese = {
    titre: 'Tableau de bord', icone: 'synthese',
    rendre: function (c) {
      var cfg = config();
      var grille = el('div', { class: 'dash', id: 'modules' });
      cfg.forEach(function (x) {
        if (!x.visible) return;
        var m = MODULES.find(function (y) { return y.id === x.id; });
        var n = m.rendre();
        if (m.large) n.classList.add('large');
        grille.appendChild(n);
      });
      u.append(c, [
        el('div', { class: 'page-head' }, [el('div', null, [el('h1', null, 'Tableau de bord'), el('p', null, 'Veille DMD 82 : modules à afficher, masquer et réordonner selon ton besoin.')]),
          el('div', { class: 'actions' }, [bouton('Personnaliser', 'editer', personnaliser, '', { id: 'btn-personnaliser' })])]),
        grille
      ]);
    }
  };
  function personnaliser() {
    var cfg = config();
    var box = el('div', { class: 'mod-list' });
    var dessiner = function () {
      box.replaceChildren.apply(box, cfg.map(function (x, i) {
        var m = MODULES.find(function (y) { return y.id === x.id; });
        var cb = el('input', { type: 'checkbox', id: 'm-' + x.id });
        cb.checked = x.visible;
        cb.addEventListener('change', function () { x.visible = cb.checked; });
        return el('div', { class: 'mod-row' }, [cb, el('label', { for: 'm-' + x.id }, m.titre),
          el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Monter ' + m.titre, disabled: i === 0, onclick: function () { cfg.splice(i - 1, 0, cfg.splice(i, 1)[0]); dessiner(); } }, '↑'),
          el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Descendre ' + m.titre, disabled: i === cfg.length - 1, onclick: function () { cfg.splice(i + 1, 0, cfg.splice(i, 1)[0]); dessiner(); } }, '↓')]);
      }));
    };
    dessiner();
    var f = ui.fenetre('Personnaliser le tableau de bord', el('div', { style: 'display:grid;gap:10px' }, [el('p', { class: 'small muted', style: 'margin:0' }, 'Coche les modules à afficher et règle leur ordre. Le réglage est propre à cet appareil.'), box]), [
      bouton('Rétablir', null, function () { u.ecrire('modules', null); f.fermer(); App.app.afficher(true); ui.toast('Tableau de bord par défaut.'); }, 'btn-ghost', { style: 'margin-right:auto' }),
      bouton('Annuler', null, function () { f.fermer(); }),
      bouton('Enregistrer', null, function () { u.ecrire('modules', cfg); f.fermer(); App.app.afficher(true); ui.toast('Tableau de bord enregistré.'); }, 'btn-primary')
    ]);
  }

  /* ================= Textes officiels ================= */
  pages.textes = {
    titre: 'Textes officiels', icone: 'journal',
    nouveau: function () { ui.formulaire('Textes', null, { avant: function (l) { l.origine = l.origine || 'manuel'; } }); },
    rendre: function (c, p) {
      var f = { q: p.q || '', source: p.source || '', categorie: p.categorie || '', interet: p.interet || '', statut: p.statut || '' };
      var zone = el('div', { class: 'rows', id: 'textes-liste' });
      var compteur = el('span', { class: 'count' });
      var majHash = function () { var q = Object.keys(f).filter(function (k) { return f[k]; }).map(function (k) { return k + '=' + encodeURIComponent(f[k]); }).join('&'); history.replaceState(null, '', '#/textes' + (q ? '?' + q : '')); };
      var filtrer = function () {
        var q = u.normaliser(f.q);
        return S().get('Textes').filter(function (t) {
          return (!f.source || t.source === f.source) && (!f.categorie || t.categorie === f.categorie) && (!f.interet || t.interet === f.interet) &&
            (!f.statut ? t.statut !== 'ecarte' : t.statut === f.statut) && (!q || u.normaliser([t.titre, t.resume, t.ministere, t.suivis, t.nor].join(' ')).indexOf(q) !== -1);
        }).sort(parDateDesc);
      };
      var dessiner = function () {
        var l = filtrer();
        compteur.textContent = u.pluriel(l.length, 'texte');
        zone.replaceChildren.apply(zone, l.length ? l.slice(0, 150).map(ligneTexte) : [el('div', { class: 'row' }, ui.vide('Aucun texte pour ces filtres. La collecte relit le Journal officiel et les comptes rendus du conseil des ministres toutes les 6 heures.'))]);
      };
      var ctl = function (nom, opts, tous) { return ui.select([['', tous]].concat(opts), f[nom], function (v) { f[nom] = v; majHash(); dessiner(); }, { 'aria-label': tous }); };
      var rech = el('input', { class: 'input search', type: 'search', placeholder: 'Rechercher un nom, un ministère, un NOR', 'aria-label': 'Rechercher dans les textes' });
      rech.value = f.q;
      rech.addEventListener('input', u.debounce(function () { f.q = rech.value; majHash(); dessiner(); }, 200));
      u.append(c, [
        tete('Textes officiels', 'Journal officiel, conseil des ministres et bulletins officiels : textes des ministères suivis (Armées, Intérieur) et tout texte qui cite un suivi.', [
          bouton('Collecter maintenant', 'collecte', function (e) { action(e.currentTarget, 'collecterTextes', 'Collecte des textes en cours…'); }),
          bouton('Tester Légifrance', null, function (e) { action(e.currentTarget, 'testerLegifrance', 'Test en cours…'); }, 'hide-narrow'),
          bouton('Excel', 'export', function () { ui.exporterXlsx('textes-officiels', filtrer(), App.SCHEMA.tables.Textes.fields); }),
          bouton('Ajouter', 'plus', pages.textes.nouveau, 'btn-primary', { id: 'btn-ajouter' })
        ]),
        el('div', { class: 'filters', id: 'filtres-textes' }, [rech, ctl('source', options('Textes', 'source'), 'Toutes les publications'), ctl('categorie', options('Textes', 'categorie'), 'Toutes catégories'),
          ctl('interet', options('Textes', 'interet'), 'Tout intérêt'), ctl('statut', options('Textes', 'statut'), 'À traiter, lus et retenus'), compteur]),
        zone
      ]);
      dessiner();
      return { redessiner: dessiner };
    }
  };
  function ligneTexte(t) {
    var maj = function (champ) { return function (v) { var l = Object.assign({}, t); l[champ] = v; ui.enregistrer('Textes', l, 'Texte mis à jour.'); }; };
    return el('div', { class: 'row' + (t.statut === 'ecarte' ? ' row-ecarte' : ''), id: 'txt-' + t.id }, [
      el('div', { class: 'row-date' }, u.dateCourte(t.date)),
      el('div', { class: 'row-body' }, [
        el('div', { class: t.statut === 'nouveau' ? 'item-new' : '' }, u.lien(t.titre, t.url, 'item-title')),
        t.resume ? el('p', { class: 'item-text' }, t.resume) : null,
        el('div', { class: 'meta' }, [ui.pill(opt('Textes', 'categorie', t.categorie), 'pill-plain'), el('span', null, opt('Textes', 'source', t.source)), t.ministere ? el('span', null, t.ministere) : null, t.nor ? el('span', { class: 'mono' }, t.nor) : null, t.suivis ? el('span', { class: 'suivi-tag' }, t.suivis) : null, u.archives(t.url, t.archive)]),
        t.notes ? el('p', { class: 'item-text' }, t.notes) : null
      ]),
      el('div', { class: 'row-tools' }, [
        ui.select(options('Textes', 'interet'), t.interet, maj('interet'), { 'aria-label': 'Intérêt' }),
        ui.select(options('Textes', 'statut'), t.statut, maj('statut'), { 'aria-label': 'Traitement' }),
        el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Modifier', onclick: function () { ui.formulaire('Textes', t); } }, u.icone('editer'))
      ])
    ]);
  }
  function action(btn, nom, attente) {
    btn.disabled = true; ui.toast(attente);
    App.api.appel(nom).then(function (r) {
      var msg = r.statut || r.message || (typeof r.ajoutes === 'number' ? u.pluriel(r.ajoutes, 'élément') + ' ajouté' + (r.ajoutes > 1 ? 's' : '') + '.' : 'Terminé.');
      if (r.rapport) msg += ' ' + r.rapport.join(' · ');
      ui.toast(msg, { duree: 9000 });
      return App.store.synchroniser(true);
    }).catch(ui.erreur).then(function () { btn.disabled = false; });
  }

  /* ================= Suivis ================= */
  var recherches = {
    nominatif: function (q) { return 'https://www.legifrance.gouv.fr/search/jorf?tab_selection=jorf&searchField=ALL&query=' + encodeURIComponent('"' + q + '" nomination') + '&sortValue=PUBLICATION_DATE_DESC&page=1&init=true'; },
    legifrance: function (q) { return 'https://www.legifrance.gouv.fr/search/jorf?tab_selection=jorf&searchField=ALL&query=' + encodeURIComponent('"' + q + '"') + '&page=1&init=true'; },
    actualites: function (q) { return 'https://news.google.com/search?q=' + encodeURIComponent('"' + q + '"') + '&hl=fr&gl=FR&ceid=FR:fr'; },
    x: function (q) { return 'https://x.com/search?q=' + encodeURIComponent('"' + q + '"') + '&f=live'; },
    facebook: function (q) { return 'https://www.facebook.com/search/posts?q=' + encodeURIComponent(q); },
    linkedin: function (q) { return 'https://www.linkedin.com/search/results/content/?keywords=' + encodeURIComponent('"' + q + '"') + '&sortBy=%22date_posted%22'; }
  };
  App.recherches = recherches;
  function liensRecherche(q, type) {
    return el('div', { class: 'meta search-links' }, (type === 'personne' || type === 'fonction' ? [['nominatif', 'Nominations (JO)']] : []).concat([['legifrance', 'Légifrance'], ['actualites', 'Actualités'], ['x', 'X'], ['facebook', 'Facebook'], ['linkedin', 'LinkedIn']]).map(function (r) {
      return el('a', { class: 'btn btn-sm', href: recherches[r[0]](q), target: '_blank', rel: 'noopener noreferrer' }, r[1]);
    }));
  }
  pages.suivis = {
    titre: 'Suivis', icone: 'oeil',
    nouveau: function () { ui.formulaire('Suivis', null); },
    rendre: function (c) {
      var arts = S().get('Articles'), textes = S().get('Textes');
      var compter = function (s) {
        var termes = [s.valeur].concat(String(s.variantes || '').split(';')).map(u.normaliser).filter(function (t) { return t.length >= 3; });
        var cherche = function (x) { var t = ' ' + u.normaliser([x.titre, x.resume, x.ministere, x.suivis].join(' ')) + ' '; return termes.some(function (m) { return t.indexOf(' ' + m + ' ') !== -1; }); };
        var l = arts.filter(cherche).concat(textes.filter(cherche)).sort(parDateDesc);
        var carriere = textes.filter(cherche).filter(function (t) { return t.categorie === 'nomination' || t.categorie === 'decoration'; }).sort(parDateDesc);
        return { n: l.length, dernier: l[0], carriere: carriere };
      };
      var groupes = [['personne', 'Personnes'], ['fonction', 'Fonctions et postes'], ['mot_cle', 'Mots-clés'], ['ministere', 'Ministères']];
      u.append(c, [
        tete('Suivis', 'Personnes, fonctions, mots-clés et ministères cherchés automatiquement dans la presse, les réseaux et les textes officiels (Journal officiel, conseil des ministres). Pour suivre des nominations, ajoute la personne ou le poste.', [
          bouton('Ajouter un suivi', 'plus', pages.suivis.nouveau, 'btn-primary', { id: 'btn-ajouter' })
        ]),
        el('div', { class: 'grid-2', id: 'suivis-liste' }, groupes.map(function (g) {
          var l = S().get('Suivis').filter(function (s) { return s.type === g[0]; }).sort(function (a, b) { return a.valeur.localeCompare(b.valeur, 'fr'); });
          return el('article', { class: 'card' }, [el('div', { class: 'card-head' }, [el('h3', null, g[1]), el('span', { class: 'small muted' }, u.pluriel(l.length, 'suivi'))]),
            l.length ? el('ul', { class: 'list' }, l.map(function (s) {
              var r = compter(s);
              return el('li', { class: 'item', style: s.actif === 'non' ? 'opacity:.55' : '' }, [
                el('div', { class: 'card-head' }, [el('span', { class: 'item-title' }, s.valeur), el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Modifier ' + s.valeur, onclick: function () { ui.formulaire('Suivis', s); } }, u.icone('editer'))]),
                el('div', { class: 'meta' }, [s.motif ? el('span', null, s.motif) : null, el('span', null, 'Cherché dans : ' + opt('Suivis', 'perimetre', s.perimetre).toLowerCase()),
                  r.n ? el('a', { href: '#/fil?q=' + encodeURIComponent(s.valeur) }, u.pluriel(r.n, 'mention') + ', dernière le ' + u.date(r.dernier.date)) : el('span', null, 'Aucune mention')]),
                s.variantes ? el('div', { class: 'meta' }, 'Variantes : ' + s.variantes) : null,
                r.carriere.length ? el('div', { class: 'kv' }, [el('b', { class: 'small muted' }, 'Nominations et décorations relevées'), el('ul', { class: 'linked' }, r.carriere.slice(0, 5).map(function (t) { return el('li', null, [el('span', { class: 'num muted' }, u.dateCourte(t.date) + ' '), u.lien(t.titre, t.url)]); }))]) : null,
                g[0] !== 'ministere' ? liensRecherche(s.valeur, s.type) : null,
                g[0] !== 'ministere' ? el('div', { class: 'actions', 'data-ecriture': '' }, [bouton(aAlerte(s.valeur) ? 'Alerte en place' : 'M\'alerter pour ce suivi', 'cloche', function () { creerAlerteSuivi(s); }, 'btn-sm', { disabled: aAlerte(s.valeur) })]) : null
              ]);
            })) : ui.vide('Aucun suivi de ce type.')]);
        }))
      ]);
    }
  };

  function aAlerte(valeur) { return S().get('Alertes').some(function (a) { return a.filtre === 'suivi' && a.valeur === valeur && a.actif !== 'non'; }); }
  function creerAlerteSuivi(s) {
    var moi = (u.lire('utilisateur', {}) || {}).email || '';
    ui.formulaire('Alertes', { nom: 'Suivi : ' + s.valeur, destinataires: moi, frequence: 'immediate', portee: 'tout', interet_min: '1', filtre: 'suivi', valeur: s.valeur, actif: 'oui' },
      { titre: 'Alerte pour « ' + s.valeur + ' »' });
  }
  App.creerAlerteSuivi = creerAlerteSuivi;

  /* ================= Outils réseaux (ajoutés à la page Réseaux DMD) ================= */
  var rendreReseaux = pages.reseaux.rendre;
  pages.reseaux.rendre = function (c) {
    rendreReseaux(c);
    var q = el('input', { class: 'input', id: 'rc-q', placeholder: 'Nom, unité, commune, sujet…', 'aria-label': 'Recherche', style: 'flex:1 1 220px' });
    var choix = ui.select([['', 'Ou choisir un suivi']].concat(S().get('Suivis').filter(function (s) { return s.actif !== 'non' && s.type !== 'ministere'; }).map(function (s) { return [s.valeur, s.valeur]; })), '', function (v) { q.value = v; }, { 'aria-label': 'Choisir un suivi', id: 'rc-suivi' });
    var ouvrir = function (r) { return function () { var v = q.value.trim(); if (!v) return ui.toast('Tape un terme ou choisis un suivi.', { erreur: true }); window.open(recherches[r](v), '_blank', 'noopener'); }; };
    var prompt = consigneClaude();
    u.append(c, el('div', { class: 'grid-2', id: 'outils-reseaux' }, [
      el('article', { class: 'card', id: 'recherches-connectees' }, [
        el('div', { class: 'card-head' }, [el('h3', null, 'Recherches connectées'), el('span', { class: 'small muted' }, 'avec ta session DMD')]),
        el('p', { class: 'card-note' }, 'La recherche s\'ouvre dans ton navigateur, où tu es connecté avec les comptes de la DMD. Aucun identifiant n\'est stocké dans le site.'),
        el('div', { class: 'filters' }, [q, choix]),
        el('div', { class: 'actions' }, [bouton('X', null, ouvrir('x')), bouton('Facebook', null, ouvrir('facebook')), bouton('LinkedIn', null, ouvrir('linkedin')), bouton('Actualités', null, ouvrir('actualites'), 'btn-ghost'), bouton('Légifrance', null, ouvrir('legifrance'), 'btn-ghost')])
      ]),
      el('article', { class: 'card', id: 'capture' }, [
        el('div', { class: 'card-head' }, [el('h3', null, 'Ajouter un résultat au fil')]),
        el('p', { class: 'card-note' }, 'Colle le lien d\'une publication trouvée : elle entre dans le fil de veille, type Réseaux sociaux.'),
        formCapture()
      ]),
      el('article', { class: 'card', id: 'recherche-claude' }, [
        el('div', { class: 'card-head' }, [el('h3', null, 'Recherche par Claude')]),
        el('p', { class: 'card-note' }, 'Ouvre une conversation Claude liée à ton ordinateur, avec le navigateur connecté aux comptes DMD, et colle cette consigne. Claude cherche sur le web (Google, Google Actualités), X, Facebook (groupes citoyens compris) et LinkedIn, couvre toutes les familles de la veille, puis remplit « Ajouter un résultat au fil » de ce site. Tu peux en faire une tâche récurrente (chaque matin).'),
        el('textarea', { class: 'input', readonly: true, id: 'consigne-claude', style: 'min-height:150px;font-size:13px' }, prompt),
        el('div', { class: 'actions' }, [bouton('Copier la consigne', null, function () {
          var t = u.$('#consigne-claude');
          (navigator.clipboard ? navigator.clipboard.writeText(t.value) : Promise.reject()).then(function () { ui.toast('Consigne copiée.'); }, function () { t.select(); ui.toast('Sélectionnée : copie avec Ctrl+C.'); });
        })])
      ]),
      el('article', { class: 'card', id: 'facebook-page' }, [
        el('div', { class: 'card-head' }, [el('h3', null, 'Collecte de la page Facebook')]),
        el('p', { class: 'card-note' }, 'Avec un jeton de la page DMD (réglé une fois dans Apps Script, voir le README), le serveur relève toutes les 6 heures les publications de la page et celles qui l\'identifient.'),
        el('div', { class: 'meta', id: 'etat-facebook' }, 'État de la connexion : vérification…'),
        el('div', { class: 'actions' }, [bouton('Collecter maintenant', 'collecte', function (e) { action(e.currentTarget, 'collecterFacebook', 'Lecture de la page Facebook…'); })])
      ])
    ]));
    App.api.appel('etatConnexions').then(function (r) {
      var z = u.$('#etat-facebook'); if (z) z.textContent = 'État de la connexion : ' + (r.facebook ? 'jeton de page en place.' : 'jeton à configurer.');
    }, function () { var z = u.$('#etat-facebook'); if (z) z.textContent = 'État de la connexion : indisponible hors ligne.'; });
  };
  function formCapture() {
    var champs = {
      url: el('input', { class: 'input', type: 'url', id: 'cap-url', placeholder: 'https://…', 'aria-label': 'Lien de la publication' }),
      titre: el('input', { class: 'input', id: 'cap-titre', placeholder: 'Ce que dit la publication', 'aria-label': 'Titre' }),
      reseau: ui.select([['X', 'X'], ['Facebook', 'Facebook'], ['LinkedIn', 'LinkedIn'], ['Instagram', 'Instagram'], ['Autre', 'Autre réseau']], 'X', function () {}, { id: 'cap-reseau', 'aria-label': 'Réseau' }),
      auteur: el('input', { class: 'input', id: 'cap-auteur', placeholder: 'Compte auteur', 'aria-label': 'Compte auteur' }),
      interet: ui.select([['3', 'Intérêt fort'], ['2', 'Intérêt moyen'], ['1', 'Intérêt faible']], '2', function () {}, { id: 'cap-interet', 'aria-label': 'Intérêt' })
    };
    var envoyer = function () {
      var url = champs.url.value.trim(), titre = champs.titre.value.trim();
      if (!/^https?:\/\//.test(url)) return ui.toast('Colle un lien commençant par https://', { erreur: true });
      if (!titre) return ui.toast('Indique ce que dit la publication.', { erreur: true });
      var auteur = champs.auteur.value.trim();
      ui.enregistrer('Articles', { date: u.aujourdhui(), interet: champs.interet.value, titre: titre, resume: '', url: url, canal: 'reseaux_sociaux',
        source: champs.reseau.value + (auteur ? ', ' + auteur : ''), commune: '', theme: 'dmd', cas: '', statut: 'retenu', origine: 'manuel', notes: '' }, 'Ajouté au fil.')
        .then(function () { champs.url.value = ''; champs.titre.value = ''; champs.auteur.value = ''; }, function () {});
    };
    return el('div', { style: 'display:grid;gap:8px' }, [champs.url, champs.titre, el('div', { class: 'filters' }, [champs.reseau, champs.auteur, champs.interet]), el('div', null, bouton('Ajouter au fil', 'plus', envoyer, 'btn-primary', { id: 'cap-envoyer' }))]);
  }
  function consigneClaude() {
    var s = S().get('Suivis').filter(function (x) { return x.actif !== 'non' && x.type !== 'ministere' && x.perimetre !== 'textes'; }).map(function (x) { return x.valeur; });
    return 'Tu fais une veille de sources ouvertes pour la délégation militaire départementale de Tarn-et-Garonne. ' +
      'Utilise le navigateur de mon ordinateur, où je suis connecté avec les comptes de la DMD 82. Couvre quatre canaux : (1) le web (recherche Google et Google Actualités), ' +
      '(2) X, (3) Facebook, y compris les groupes citoyens « Info Trafic 82 », « Actu Montauban », « Tu es de Montauban si… », « Info Castelsarrasin Moissac », (4) LinkedIn. ' +
      'Période : les 7 derniers jours. Reste dans le Tarn-et-Garonne et ses communes (Montauban, Castelsarrasin, Moissac, Caussade, Caylus, Golfech, Valence d\'Agen…) et, si pertinent, la zone de défense Sud. ' +
      'Cherche, pour chaque famille :\n' +
      '- Suivis nommés : ' + (s.length ? s.join(', ') : '(aucun suivi actif)') + '.\n' +
      '- Armées et unités : 17e RGP, 9e RSAM, 31e RG, 11e RPIE, camp de Caylus, exercice, manœuvre, tir, survol de drone, bruit ou explosion signalés, Sentinelle.\n' +
      '- Ordre public et colère sociale : manifestation, appel à manifester, blocage, rassemblement, barrage, opération escargot, grève, agriculteurs, violences.\n' +
      '- Catastrophes et terrain : inondation, crue, orages, grêle, tempête, incendie, feu, canicule, sécheresse, coupure de courant, accident grave, carambolage, évacuation.\n' +
      '- Sécurité et sûreté : préfet, gendarmerie, police, attentat, Vigipirate, Golfech ou sûreté nucléaire, cyberattaque visant une mairie, un hôpital ou une collectivité, personne disparue.\n' +
      'Règles strictes : ne publie rien, n\'aime rien, ne commente rien, ne suis personne, n\'envoie aucun message, ne rejoins aucun groupe. Tu ne fais que lire et recopier. Recoupe une rumeur avant de la retenir.\n' +
      'Pour chaque élément utile, ouvre le site de veille (' + location.origin + location.pathname + '#/reseaux) et remplis « Ajouter un résultat au fil » : lien, résumé en une phrase, canal (officiel, presse, réseaux sociaux), commune, et intérêt (fort, moyen, faible). ' +
      'Termine par un court bilan de ce que tu as ajouté, par famille.';
  }

  /* ================= Alertes par courriel ================= */
  function phraseAlerte(r) {
    var quoi = { tout: 'articles et textes officiels', articles: 'articles de presse et des réseaux', textes: 'textes officiels' }[r.portee] || 'éléments';
    var interet = { 1: '', 2: ' d\'intérêt moyen ou fort', 3: ' d\'intérêt fort' }[r.interet_min] || '';
    var cond = {
      aucun: '', decoration: ' qui portent sur une décoration ou une médaille', nomination_suivi: ' qui nomment une personne ou un poste suivi', suivi: r.valeur ? ' qui citent le suivi « ' + r.valeur + ' »' : ' qui citent un suivi', nomination: ' qui portent sur une nomination',
      canal: r.valeur ? ' de type « ' + opt('Articles', 'canal', r.valeur) + ' »' : '', theme: r.valeur ? ' du thème « ' + opt('Articles', 'theme', r.valeur) + ' »' : '',
      source_texte: r.valeur ? ' publiés dans « ' + opt('Textes', 'source', r.valeur) + ' »' : '', mot_cle: r.valeur ? ' qui contiennent « ' + r.valeur + ' »' : ''
    }[r.filtre] || '';
    var quand = { immediate: 'Dès la collecte', quotidienne: 'Chaque jour à 7h', hebdomadaire: 'Chaque lundi à 7h' }[r.frequence] || '';
    return quand + ', les nouveaux ' + quoi + interet + cond + '.';
  }
  pages.alertes = {
    titre: 'Alertes', icone: 'cloche',
    nouveau: function () { ui.formulaire('Alertes', { destinataires: (u.lire('utilisateur', {}) || {}).email || '' }); },
    rendre: function (c) {
      var regles = S().get('Alertes').slice().sort(function (a, b) { return (a.actif === 'non') - (b.actif === 'non') || a.nom.localeCompare(b.nom, 'fr'); });
      var envois = S().get('Envois').slice().sort(function (a, b) { return String(b.quand).localeCompare(String(a.quand)); }).slice(0, 30);
      u.append(c, [
        tete('Alertes par courriel', 'Chaque alerte dit quoi envoyer, à qui et quand : dès la collecte, en point quotidien à 7h ou en bilan du lundi. Les courriels partent du compte Google qui a installé le site.', [
          bouton('Nouvelle alerte', 'plus', pages.alertes.nouveau, 'btn-primary', { id: 'btn-ajouter' })
        ]),
        el('div', { class: 'card', id: 'modeles-alertes', 'data-ecriture': '' }, [el('h3', null, 'Ajouter une alerte prête à l\'emploi'),
          el('div', { class: 'actions' }, [
            ['Nominations des personnes suivies', { nom: 'Nominations de mes suivis', frequence: 'immediate', portee: 'textes', interet_min: '1', filtre: 'nomination_suivi', valeur: '' }],
            ['Décorations et médailles', { nom: 'Décorations et médailles', frequence: 'quotidienne', portee: 'tout', interet_min: '1', filtre: 'decoration', valeur: '' }],
            ['Toutes les nominations Armées et Intérieur', { nom: 'Nominations Armées et Intérieur', frequence: 'quotidienne', portee: 'textes', interet_min: '2', filtre: 'nomination', valeur: '' }],
            ['Textes qui citent le Tarn-et-Garonne', { nom: 'Le 82 au Journal officiel', frequence: 'immediate', portee: 'textes', interet_min: '1', filtre: 'mot_cle', valeur: 'Tarn-et-Garonne' }]
          ].map(function (m) { return bouton(m[0], 'cloche', function () { ui.formulaire('Alertes', Object.assign({ destinataires: (u.lire('utilisateur', {}) || {}).email || '', actif: 'oui' }, m[1]), { titre: 'Nouvelle alerte : ' + m[0].toLowerCase() }); }, 'btn-sm'); }))]),
        el('div', { class: 'grid', id: 'alertes-liste' }, regles.length ? regles.map(function (r) {
          var sansAdresse = !String(r.destinataires || '').trim();
          return el('article', { class: 'card', id: 'alerte-' + r.id, style: r.actif === 'non' ? 'opacity:.6' : '' }, [
            el('div', { class: 'card-head' }, [el('h3', null, [u.icone('cloche'), r.nom]), el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Modifier l\'alerte', onclick: function () { ui.formulaire('Alertes', r); } }, u.icone('editer'))]),
            el('p', { style: 'margin:0' }, phraseAlerte(r)),
            el('div', { class: 'meta' }, [ui.pill(r.actif === 'non' ? 'Désactivée' : 'Active', r.actif === 'non' ? '' : 'pill-clos'), el('span', null, sansAdresse ? 'Destinataire à renseigner (par défaut : ton adresse à l\'installation)' : 'Pour : ' + r.destinataires)]),
            el('div', { class: 'meta' }, r.derniere_execution ? 'Dernier passage : ' + r.derniere_execution : 'Pas encore passée'),
            el('div', { class: 'actions' }, [
              bouton('Envoyer un essai', null, function (e) {
                var b = e.currentTarget; b.disabled = true;
                App.api.appel('testerAlerte', { id: r.id }).then(function (x) { ui.toast(x.message || 'Essai envoyé.', { duree: 7000 }); return S().synchroniser(true); }).catch(ui.erreur).then(function () { b.disabled = false; });
              }, 'btn-sm'),
              bouton(r.actif === 'non' ? 'Activer' : 'Désactiver', null, function () { ui.enregistrer('Alertes', Object.assign({}, r, { actif: r.actif === 'non' ? 'oui' : 'non' }), r.actif === 'non' ? 'Alerte activée.' : 'Alerte désactivée.'); }, 'btn-sm btn-ghost')
            ])
          ]);
        }) : [ui.vide('Aucune alerte. Crée la première avec « Nouvelle alerte ».')]),
        el('article', { class: 'card', id: 'envois' }, [el('div', { class: 'card-head' }, [el('h3', null, 'Derniers envois'), el('span', { class: 'small muted' }, u.pluriel(envois.length, 'envoi'))]),
          envois.length ? el('div', { class: 'tablebox' }, el('table', { class: 't' }, [el('thead', null, el('tr', null, [el('th', null, 'Quand'), el('th', null, 'Alerte'), el('th', { class: 'hide-narrow' }, 'Destinataires'), el('th', null, 'Éléments'), el('th', null, 'Résultat')])),
            el('tbody', null, envois.map(function (e) { return el('tr', null, [el('td', { class: 'num' }, e.quand), el('td', null, e.alerte), el('td', { class: 'hide-narrow' }, e.destinataires), el('td', { class: 'num' }, e.elements), el('td', null, e.statut)]); }))]))
            : ui.vide('Aucun courriel envoyé pour l\'instant.')]),
        el('p', { class: 'card-note' }, 'Conseils : pour une adresse en def.gouv.fr ou intradef, vérifie que les courriels ne partent pas en indésirables. Le compte Google gratuit permet environ 100 destinataires par jour.')
      ]);
    }
  };
  MODULES.push({ id: 'alertes', titre: 'Dernières alertes envoyées', rendre: function () {
    var l = S().get('Envois').slice().sort(function (a, b) { return String(b.quand).localeCompare(String(a.quand)); }).slice(0, 5);
    return carte('alertes', 'Dernières alertes envoyées', ['#/alertes', 'Gérer'], liste(l, function (e) { return el('li', { class: 'item' }, [el('span', { class: 'item-title' }, e.alerte), el('span', { class: 'meta' }, [e.quand, u.pluriel(Number(e.elements || 0), 'élément'), e.statut])]); }, 'Aucune alerte envoyée pour l\'instant.'));
  } });

  /* ================= Navigation et démonstration ================= */
  App.pagesOrdre = ['synthese', 'fil', 'textes', 'suivis', 'alertes', 'cas', 'reseaux', 'risques', 'historique', 'archives', 'defense', 'sources', 'journal'];
  App.pagesMobile = ['synthese', 'fil', 'textes', 'reseaux'];
  // Partagé avec le tableau de bord opérationnel (tableau.js), qui remplace l'ancienne grille de modules.
  App.tableau = { MODULES: MODULES, carte: carte, liste: liste, itemArticle: itemArticle, itemTexte: itemTexte };
})();
