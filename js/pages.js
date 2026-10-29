window.App = window.App || {};
(function () {
  var u = App.u, el = u.el, ui = App.ui, S = function () { return App.store; };
  var CANAUX = ['officiel', 'presse_locale', 'presse_nationale', 'reseaux_sociaux'];
  var opt = function (t, c, v) { return ui.opt(t, c, v); };
  var options = function (t, c) { var f = App.SCHEMA.tables[t].fields.find(function (x) { return x.name === c; }); return Object.keys(f.options).map(function (k) { return [k, f.options[k]]; }); };
  var parDateDesc = function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); };
  var aller = function (h) { location.hash = h; };
  var pages = {};

  function tete(titre, texte, actions) {
    return el('div', { class: 'page-head' }, [el('div', null, [el('h1', null, titre), texte ? el('p', null, texte) : null]), actions ? el('div', { class: 'actions' }, actions) : null]);
  }
  function bouton(texte, icone, onclick, cls, attrs) {
    return el('button', Object.assign({ class: 'btn ' + (cls || ''), type: 'button', onclick: onclick }, attrs || {}), [icone ? u.icone(icone) : null, texte]);
  }
  function itemArticle(a, opts) {
    opts = opts || {};
    return el('li', { class: 'item' + (a.statut === 'nouveau' ? ' item-new' : '') }, [
      u.lien(a.titre, a.url, 'item-title'),
      opts.resume && a.resume ? el('p', { class: 'item-text' }, a.resume) : null,
      el('div', { class: 'meta' }, [ui.pill(opt('Articles', 'interet', a.interet), 'pill-' + a.interet), el('span', { class: 'num' }, u.date(a.date)), el('span', null, a.source), a.commune ? el('span', null, a.commune) : null])
    ]);
  }
  function colonnes(t) { return App.SCHEMA.tables[t].fields.filter(function (f) { return !f.hidden; }); }

  /* ================= Synthèse ================= */
  pages.synthese = {
    titre: 'Synthèse', icone: 'synthese',
    rendre: function (c) {
      var sit = S().get('Situation').slice().sort(function (a, b) { return Number(a.ordre || 9) - Number(b.ordre || 9); });
      var g = function (k) { return sit.find(function (r) { return r.cle === k; }) || {}; };
      var arts = S().get('Articles'), cas = S().get('Cas');
      var j7 = u.dateDecalee(-7), today = u.aujourdhui();
      var aTraiter = arts.filter(function (a) { return a.statut === 'nouveau'; }).length;
      var forts = arts.filter(function (a) { return a.interet === '3' && a.date >= j7; }).length;
      var ouverts = cas.filter(function (x) { return x.statut !== 'clos'; });
      var echeances = ouverts.filter(function (x) { return /^\d{4}-\d{2}-\d{2}$/.test(x.echeance) && x.echeance >= today; }).sort(function (a, b) { return a.echeance.localeCompare(b.echeance); });

      var chips = sit.filter(function (r) { return r.cle !== 'synthese' && r.cle !== 'derniere_veille'; }).map(function (r) {
        return el('div', { class: 'chip' + (/crise|rouge|urgence|interdiction|arrêt/i.test(r.valeur + r.libelle) ? ' chip-alerte' : '') }, [
          el('span', { class: 'k' }, r.libelle), el('span', { class: 'v' }, r.valeur), r.detail ? el('span', { class: 'd' }, r.detail) : null,
          el('span', { class: 'd' }, [u.lien(r.source || 'Source', r.url), r.date ? ', ' + u.date(r.date) : ''])
        ]);
      });
      u.append(c, [
        el('section', { class: 'situation', id: 'situation' }, [
          el('div', null, [el('h1', null, 'Situation du jour'), el('p', { class: 'take' }, g('synthese').valeur || 'Pas encore de synthèse.')]),
          el('div', { class: 'dtg' }, [el('span', { class: 'small muted' }, 'Dernière veille'), el('b', null, g('derniere_veille').valeur || '…'), el('span', { class: 'small muted' }, g('derniere_veille').detail || '')]),
          el('div', { class: 'chips' }, chips)
        ]),
        el('div', { class: 'tiles', id: 'tuiles' }, [
          el('a', { class: 'tile', href: '#/fil?statut=nouveau' }, [el('span', { class: 'k' }, 'À traiter'), el('span', { class: 'v' }, u.nombre(aTraiter)), el('span', { class: 'd' }, 'articles non lus')]),
          el('a', { class: 'tile tile-fort', href: '#/fil?interet=3&periode=7' }, [el('span', { class: 'k' }, 'Intérêt fort'), el('span', { class: 'v' }, u.nombre(forts)), el('span', { class: 'd' }, '7 derniers jours')]),
          el('a', { class: 'tile', href: '#/cas' }, [el('span', { class: 'k' }, 'Cas ouverts'), el('span', { class: 'v' }, u.nombre(ouverts.length)), el('span', { class: 'd' }, u.pluriel(ouverts.filter(function (x) { return x.priorite === '3'; }).length, 'prioritaire'))]),
          el('a', { class: 'tile', href: '#/cas' }, [el('span', { class: 'k' }, 'Prochaine échéance'), el('span', { class: 'v', style: 'font-size:26px' }, echeances[0] ? u.date(echeances[0].echeance) : 'Aucune'), el('span', { class: 'd' }, echeances[0] ? echeances[0].titre : '')])
        ]),
        el('h2', { id: 'encarts' }, 'Dernières informations par type de source'),
        el('div', { class: 'grid' }, CANAUX.map(function (k) {
          var l = arts.filter(function (a) { return a.canal === k && a.statut !== 'ecarte'; }).sort(parDateDesc).slice(0, 5);
          return el('article', { class: 'card encart canal-' + k }, [
            el('div', { class: 'card-head' }, [el('h3', null, [el('span', { class: 'swatch' }), opt('Articles', 'canal', k)]), el('a', { class: 'small', href: '#/fil?canal=' + k }, 'Tout voir')]),
            l.length ? el('ul', { class: 'list' }, l.map(function (a) { return itemArticle(a); })) : ui.vide('Rien pour ce type de source.')
          ]);
        })),
        el('div', { class: 'grid-2' }, [
          el('article', { class: 'card' }, [
            el('div', { class: 'card-head' }, [el('h3', null, 'Cas à suivre'), el('a', { class: 'small', href: '#/cas' }, 'Tous les cas')]),
            el('ul', { class: 'list' }, ouverts.sort(function (a, b) { return Number(b.priorite) - Number(a.priorite); }).slice(0, 6).map(function (x) {
              return el('li', { class: 'item' }, [el('a', { class: 'item-title', href: '#/cas?id=' + encodeURIComponent(x.id) }, x.titre), el('div', { class: 'meta' }, [ui.pill(opt('Cas', 'statut', x.statut), 'pill-' + x.statut), el('span', null, x.categorie), x.echeance ? el('span', null, 'Échéance : ' + u.date(x.echeance)) : null])]);
            }))
          ]),
          el('article', { class: 'card' }, [
            el('div', { class: 'card-head' }, [el('h3', null, 'Articles par thème'), el('span', { class: 'small muted' }, '30 derniers jours')]),
            barres(arts.filter(function (a) { return a.date >= u.dateDecalee(-30) && a.statut !== 'ecarte'; }))
          ]),
          el('article', { class: 'card' }, [
            el('div', { class: 'card-head' }, [el('h3', null, 'Réseaux de la DMD'), el('a', { class: 'small', href: '#/reseaux' }, 'Ouvrir')]),
            resumeReseaux()
          ])
        ])
      ]);
    }
  };
  function barres(arts) {
    var n = {};
    arts.forEach(function (a) { n[a.theme] = (n[a.theme] || 0) + 1; });
    var l = Object.keys(n).map(function (k) { return [k, n[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
    if (!l.length) return ui.vide('Aucun article sur la période.');
    var max = l[0][1];
    return el('div', { class: 'bars' }, l.map(function (x) {
      var b = el('div', { class: 'bar' }); b.style.width = (100 * x[1] / max) + '%';
      return el('a', { class: 'bar-row', href: '#/fil?theme=' + x[0] + '&periode=30', style: 'text-decoration:none' }, [el('span', null, opt('Articles', 'theme', x[0])), el('div', { class: 'bar-track' }, b), el('span', { class: 'num', style: 'text-align:right' }, x[1])]);
    }));
  }
  function resumeReseaux() {
    var pubs = S().get('Publications').slice().sort(parDateDesc).slice(0, 4);
    var comptes = [['facebook', 'Facebook', S().param('facebook_url')], ['x', 'X', S().param('x_compte')], ['linkedin', 'LinkedIn', S().param('linkedin_url')]];
    return el('div', { style: 'display:grid;gap:10px' }, [
      el('div', { class: 'meta' }, comptes.map(function (c) { return el('span', { class: 'reseau-head' }, [el('span', { class: 'reseau-logo r-' + c[0], style: 'width:20px;height:20px;font-size:11px' }, c[1][0]), c[2] ? 'configuré' : 'à configurer']); })),
      pubs.length ? el('ul', { class: 'list' }, pubs.map(function (p) { return el('li', { class: 'item' }, [u.lien(p.texte ? p.texte.slice(0, 110) : 'Publication ' + opt('Publications', 'reseau', p.reseau), p.url, 'item-title'), el('div', { class: 'meta' }, [opt('Publications', 'reseau', p.reseau), u.date(p.date)])]); }))
        : ui.vide('Aucune publication enregistrée. Colle le lien d\'une publication de la DMD dans l\'onglet Réseaux.')
    ]);
  }

  /* ================= Fil de veille ================= */
  var FIL_LIMITE = 80;
  pages.fil = {
    titre: 'Fil de veille', icone: 'fil',
    nouveau: function () { ui.formulaire('Articles', null, { avant: function (l) { l.origine = l.origine || 'manuel'; l.ajoute_le = new Date().toISOString().slice(0, 16).replace('T', ' '); } }); },
    rendre: function (c, p) {
      var f = { q: p.q || '', perimetre: p.perimetre || '', canal: p.canal || '', theme: p.theme || '', interet: p.interet || '', statut: p.statut || '', periode: p.periode || '' };
      var limite = FIL_LIMITE;
      var liste = el('div', { class: 'rows', id: 'fil-liste' });
      var compteur = el('span', { class: 'count' });
      var majHash = function () { var q = Object.keys(f).filter(function (k) { return f[k]; }).map(function (k) { return k + '=' + encodeURIComponent(f[k]); }).join('&'); history.replaceState(null, '', '#/fil' + (q ? '?' + q : '')); };
      var filtrer = function () {
        var depuis = f.periode ? u.dateDecalee(-Number(f.periode)) : '';
        var q = u.normaliser(f.q);
        return S().get('Articles').filter(function (a) {
          return (!f.perimetre || (a.perimetre || 'departement') === f.perimetre) && (!f.canal || a.canal === f.canal) && (!f.theme || a.theme === f.theme) && (!f.interet || a.interet === f.interet) &&
            (!f.statut ? a.statut !== 'ecarte' : a.statut === f.statut) && (!depuis || a.date >= depuis) &&
            (!q || u.normaliser([a.titre, a.resume, a.source, a.commune, a.notes].join(' ')).indexOf(q) !== -1);
        }).sort(function (a, b) { return parDateDesc(a, b) || Number(b.interet) - Number(a.interet); });
      };
      var dessiner = function () {
        var l = filtrer();
        compteur.textContent = u.pluriel(l.length, 'article');
        var noeuds = [], per = null;
        l.slice(0, limite).forEach(function (a) {
          var p2 = u.fraicheur(a).periode;
          if (p2 !== per) { per = p2; noeuds.push(el('div', { class: 'periode' }, p2)); }
          noeuds.push(ligneArticle(a));
        });
        liste.replaceChildren.apply(liste, l.length ? noeuds : [el('div', { class: 'row' }, ui.vide('Aucun article pour ces filtres.'))]);
        if (l.length > limite) liste.appendChild(el('div', { class: 'row' }, bouton('Afficher ' + Math.min(80, l.length - limite) + ' de plus', null, function () { limite += 80; dessiner(); })));
      };
      var ctl = function (nom, opts, tous) {
        return ui.select([['', tous]].concat(opts), f[nom], function (v) { f[nom] = v; limite = FIL_LIMITE; majHash(); dessiner(); }, { 'aria-label': tous, id: 'filtre-' + nom });
      };
      var recherche = el('input', { class: 'input search', type: 'search', placeholder: 'Rechercher dans le fil', 'aria-label': 'Rechercher dans le fil', id: 'filtre-q' });
      recherche.value = f.q;
      recherche.addEventListener('input', u.debounce(function () { f.q = recherche.value; majHash(); dessiner(); }, 200));
      var nouveaux = function () { return filtrer().filter(function (a) { return a.statut === 'nouveau'; }); };

      u.append(c, [
        tete('Fil de veille', 'Articles collectés automatiquement toutes les 2 heures, ou ajoutés à la main. Qualifie-les directement dans la ligne.', [
          bouton('Collecter maintenant', 'collecte', function (e) { lancerCollecte(e.currentTarget); }),
          bouton('Excel', 'export', function () { ui.exporterXlsx('veille-dmd82', filtrer(), colonnes('Articles')); }),
          bouton('CSV', 'export', function () { ui.exporterCsv('veille-dmd82', filtrer(), colonnes('Articles')); }, 'hide-narrow'),
          bouton('Ajouter', 'plus', pages.fil.nouveau, 'btn-primary', { id: 'btn-ajouter' })
        ]),
        el('div', { class: 'filters', id: 'filtres' }, [recherche,
          ctl('perimetre', options('Articles', 'perimetre'), 'Tous les périmètres'),
          ctl('canal', options('Articles', 'canal'), 'Tous les types'),
          ctl('theme', options('Articles', 'theme'), 'Tous les thèmes'),
          ctl('interet', options('Articles', 'interet'), 'Tout intérêt'),
          ctl('statut', options('Articles', 'statut'), 'À traiter, lus et retenus'),
          ctl('periode', [['1', '24 heures'], ['7', '7 jours'], ['30', '30 jours'], ['90', '3 mois']], 'Toute période'),
          compteur,
          bouton('Tout marquer lu', null, function () {
            var l = nouveaux();
            if (!l.length) return ui.toast('Aucun article à traiter dans ce filtre.');
            Promise.all(l.map(function (a) { return S().enregistrer('Articles', Object.assign({}, a, { statut: 'lu' })); })).then(function () {
              ui.toast(u.pluriel(l.length, 'article') + ' marqués lus.', { annuler: function () { l.forEach(function (a) { S().enregistrer('Articles', a); }); } });
            }, ui.erreur);
          }, 'btn-sm btn-ghost')
        ]),
        liste
      ]);
      dessiner();
      return { redessiner: dessiner };
    }
  };
  function ligneArticle(a) {
    var maj = function (champ) { return function (v) { var l = Object.assign({}, a); l[champ] = v; ui.enregistrer('Articles', l, 'Article mis à jour.'); }; };
    var casOpts = [['', 'Aucun cas']].concat(S().get('Cas').filter(function (x) { return x.statut !== 'clos' || x.id === a.cas; }).map(function (x) { return [x.id, x.titre.length > 40 ? x.titre.slice(0, 38) + '…' : x.titre]; }));
    var fr = u.fraicheur(a);
    return el('div', { class: 'row' + (a.statut === 'ecarte' ? ' row-ecarte' : '') + (fr.ancien ? ' ancien' : ''), id: 'art-' + a.id, dataset: { id: a.id } }, [
      el('div', { class: 'row-date' }, [u.dateCourte(a.date), el('br'), el('span', { class: 'age' + (fr.recent ? ' age-recent' : '') }, fr.texte), fr.nouveau ? el('div', null, el('span', { class: 'flag-new' }, 'Nouveau')) : null]),
      el('div', { class: 'row-body' }, [
        u.image(a.image, 'row-thumb'),
        el('div', { class: a.statut === 'nouveau' ? 'item-new' : '' }, u.lien(a.titre, a.url, 'item-title')),
        a.resume ? el('p', { class: 'item-text' }, a.resume) : null,
        el('div', { class: 'meta canal-' + a.canal }, [el('span', { class: 'swatch' }), el('span', null, opt('Articles', 'canal', a.canal)), el('span', null, a.source), a.commune ? el('span', null, a.commune) : null, a.perimetre && a.perimetre !== 'departement' ? el('span', null, opt('Articles', 'perimetre', a.perimetre)) : null, el('span', null, opt('Articles', 'theme', a.theme)), a.origine === 'auto' ? el('span', null, 'collecte auto') : null, u.archives(a.url, a.archive)]),
        a.notes ? el('p', { class: 'item-text' }, 'Note : ' + a.notes) : null
      ]),
      el('div', { class: 'row-tools' }, [
        ui.select(options('Articles', 'interet'), a.interet, maj('interet'), { 'aria-label': 'Intérêt' }),
        ui.select(options('Articles', 'statut'), a.statut, maj('statut'), { 'aria-label': 'Traitement' }),
        ui.select(casOpts, a.cas, maj('cas'), { 'aria-label': 'Cas lié', style: 'max-width:180px' }),
        el('button', { class: 'icon-btn', type: 'button', title: 'Modifier', 'aria-label': 'Modifier', onclick: function () { ui.formulaire('Articles', a); } }, u.icone('editer'))
      ])
    ]);
  }
  function lancerCollecte(btn) {
    btn.disabled = true;
    ui.toast('Collecte en cours…');
    App.api.appel('collecter').then(function (r) {
      ui.toast(r.message || (u.pluriel(r.ajoutes, 'article') + ' ajouté' + (r.ajoutes > 1 ? 's' : '') + (r.forts ? ', dont ' + r.forts + ' à fort intérêt' : '') + '.'));
      return S().synchroniser(true);
    }).catch(ui.erreur).then(function () { btn.disabled = false; });
  }

  /* ================= Cas DMD ================= */
  pages.cas = {
    titre: 'Cas DMD', icone: 'cas',
    nouveau: function () { ui.formulaire('Cas', null); },
    rendre: function (c, p) {
      var statut = p.statut || '';
      var grille = el('div', { class: 'grid', id: 'cas-grille' });
      var dessiner = function () {
        var arts = S().get('Articles');
        var l = S().get('Cas').filter(function (x) { return statut ? x.statut === statut : x.statut !== 'clos'; })
          .sort(function (a, b) { return Number(b.priorite) - Number(a.priorite) || String(b.maj).localeCompare(String(a.maj)); });
        grille.replaceChildren.apply(grille, l.length ? l.map(function (x) { return carteCas(x, arts); }) : [ui.vide('Aucun cas pour ce statut.')]);
        if (p.id) { var cible = document.getElementById('cas-' + p.id); if (cible) { cible.scrollIntoView({ block: 'center' }); cible.classList.add('row-hl'); } p.id = null; }
      };
      u.append(c, [
        tete('Cas d\'intérêt DMD', 'Dossiers suivis par la délégation, reliés aux articles du fil. Rattache un article à un cas depuis le fil.', [
          ui.select([['', 'Cas ouverts'], ['en_cours', 'En cours'], ['a_suivre', 'À suivre'], ['clos', 'Clos']], statut, function (v) { statut = v; dessiner(); }, { 'aria-label': 'Statut' }),
          bouton('Excel', 'export', function () { ui.exporterXlsx('cas-dmd82', S().get('Cas'), colonnes('Cas')); }),
          bouton('Nouveau cas', 'plus', pages.cas.nouveau, 'btn-primary', { id: 'btn-ajouter' })
        ]),
        grille
      ]);
      dessiner();
      return { redessiner: dessiner };
    }
  };
  function carteCas(x, arts) {
    var lies = arts.filter(function (a) { return a.cas === x.id; }).sort(parDateDesc);
    var kv = function (k, v) { return v ? el('div', { class: 'kv' }, [el('b', null, k), el('p', null, v)]) : null; };
    return el('article', { class: 'card case', id: 'cas-' + x.id }, [
      el('div', { class: 'card-head' }, [el('h3', null, x.titre), el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Modifier le cas', onclick: function () { ui.formulaire('Cas', x, { avant: function (l) { l.maj = u.aujourdhui(); } }); } }, u.icone('editer'))]),
      el('div', { class: 'meta' }, [ui.pill(opt('Cas', 'statut', x.statut), 'pill-' + x.statut), ui.pill('Priorité ' + opt('Cas', 'priorite', x.priorite).toLowerCase(), 'pill-' + x.priorite), el('span', null, x.categorie), el('span', null, 'Mis à jour le ' + u.date(x.maj))]),
      kv('Situation', x.resume), kv('Intérêt pour la DMD', x.interet_dmd), kv('Notes internes', x.notes),
      lies.length ? el('div', { class: 'kv' }, [el('b', null, 'Articles liés (' + lies.length + ')'), el('ul', { class: 'linked' }, lies.slice(0, 8).map(function (a) { return el('li', null, [el('span', { class: 'num muted' }, u.dateCourte(a.date) + ' '), u.lien(a.titre, a.url)]); }))]) : null,
      el('div', { class: 'due' }, [el('span', null, x.echeance ? 'Échéance : ' + u.date(x.echeance) + (x.echeance_objet ? ', ' + x.echeance_objet : '') : 'Pas d\'échéance'),
        x.statut !== 'clos' ? el('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: function () { ui.enregistrer('Cas', Object.assign({}, x, { statut: 'clos', maj: u.aujourdhui() }), 'Cas clos.'); } }, 'Clore') : null])
    ]);
  }

  /* ================= Réseaux DMD ================= */
  pages.reseaux = {
    titre: 'Réseaux DMD', icone: 'reseaux',
    nouveau: function () { ui.formulaire('Publications', null); },
    rendre: function (c) {
      var pubs = S().get('Publications').slice().sort(parDateDesc);
      var mentions = S().get('Articles').filter(function (a) { return a.canal === 'reseaux_sociaux'; }).sort(parDateDesc).slice(0, 8);
      var recherches = S().get('Sources').filter(function (s) { return s.canal === 'reseaux_sociaux' && s.type === 'recherche'; });
      u.append(c, [
        tete('Réseaux de la DMD', 'Les comptes Facebook, X et LinkedIn de la délégation, les publications à suivre et les mentions repérées par la veille.', [
          bouton('Ajouter une publication', 'plus', pages.reseaux.nouveau, 'btn-primary', { id: 'btn-ajouter' })
        ]),
        el('div', { class: 'grid', id: 'comptes' }, [
          carteReseau('facebook', 'Facebook', 'facebook_url', 'Adresse de la page', 'https://www.facebook.com/...', pubs),
          carteReseau('x', 'X', 'x_compte', 'Nom du compte, sans @', 'DMD82', pubs),
          carteReseau('linkedin', 'LinkedIn', 'linkedin_url', 'Adresse de la page', 'https://www.linkedin.com/company/...', pubs)
        ]),
        el('div', { class: 'grid-2' }, [
          el('article', { class: 'card' }, [
            el('div', { class: 'card-head' }, [el('h3', null, 'Publications enregistrées'), el('span', { class: 'small muted' }, u.pluriel(pubs.length, 'publication'))]),
            pubs.length ? el('ul', { class: 'list' }, pubs.map(function (p) {
              return el('li', { class: 'item' }, [u.lien(p.texte ? p.texte.slice(0, 140) : 'Publication du ' + u.date(p.date), p.url, 'item-title'),
                el('div', { class: 'meta' }, [el('span', { class: 'reseau-logo r-' + p.reseau, style: 'width:18px;height:18px;font-size:10px' }, opt('Publications', 'reseau', p.reseau)[0]), u.date(p.date), p.vues ? u.nombre(p.vues) + ' vues ou réactions' : null,
                  el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Modifier', onclick: function () { ui.formulaire('Publications', p); } }, u.icone('editer'))])]);
            })) : ui.vide('Colle ici le lien des publications de la DMD à garder : annonces, cérémonies, recrutement. Pour LinkedIn, ajoute le code « Intégrer » pour les afficher.')
          ]),
          el('article', { class: 'card' }, [
            el('div', { class: 'card-head' }, [el('h3', null, 'Mentions et signaux'), el('a', { class: 'small', href: '#/fil?canal=reseaux_sociaux' }, 'Dans le fil')]),
            mentions.length ? el('ul', { class: 'list' }, mentions.map(function (a) { return itemArticle(a); })) : ui.vide('Aucun signal.'),
            recherches.length ? el('div', { class: 'kv' }, [el('b', { class: 'small muted' }, 'Recherches en direct'), el('ul', { class: 'linked' }, recherches.map(function (s) { return el('li', null, u.lien(s.nom, s.url)); }))]) : null
          ])
        ])
      ]);
    }
  };
  function carteReseau(code, nom, cle, aide, exemple, pubs) {
    var valeur = S().param(cle);
    var url = code === 'x' ? (valeur ? 'https://x.com/' + valeur.replace(/^@/, '') : '') : valeur;
    var zone = el('div', { class: 'embed-zone', id: 'embed-' + code });
    var config = el('div', { class: 'filters' }, [
      el('input', { class: 'input', id: 'param-' + cle, value: valeur, placeholder: exemple, 'aria-label': aide, style: 'flex:1 1 200px' }),
      bouton('Enregistrer', null, function () {
        var v = u.$('#param-' + cle).value.trim();
        if (code !== 'x' && v && !/^https:\/\//.test(v)) return ui.toast('L\'adresse doit commencer par https://', { erreur: true });
        var p = S().get('Parametres').find(function (r) { return r.cle === cle; }) || { cle: cle, description: aide };
        ui.enregistrer('Parametres', Object.assign({}, p, { valeur: v.replace(/^@/, '') }), nom + ' enregistré.');
      }, 'btn-sm')
    ]);
    var afficher = function () {
      zone.classList.add('loaded'); zone.replaceChildren();
      if (code === 'facebook') {
        var src = 'https://www.facebook.com/plugins/page.php?href=' + encodeURIComponent(url) + '&tabs=timeline&width=500&height=600&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false';
        zone.appendChild(el('iframe', { src: src, title: 'Fil Facebook de la DMD', loading: 'lazy', allow: 'encrypted-media', referrerpolicy: 'no-referrer' }));
      } else if (code === 'x') {
        zone.appendChild(el('a', { class: 'twitter-timeline', href: 'https://twitter.com/' + valeur.replace(/^@/, ''), 'data-height': '600', 'data-dnt': 'true', 'data-theme': document.documentElement.dataset.themeEffectif === 'dark' ? 'dark' : 'light' }, 'Publications de @' + valeur));
        ui.chargerScript('https://platform.twitter.com/widgets.js').then(function () { if (window.twttr && twttr.widgets) twttr.widgets.load(zone); }, function () { zone.appendChild(el('p', { class: 'empty' }, 'X refuse l\'affichage ici. Ouvre le compte directement.')); });
      } else {
        var li = pubs.filter(function (p) { return p.reseau === 'linkedin'; }).slice(0, 5);
        var avecCode = li.map(function (p) { var m = String(p.embed || '').match(/https:\/\/www\.linkedin\.com\/embed\/feed\/update\/[A-Za-z0-9:_-]+/); return m ? m[0] : ''; }).filter(String);
        if (!avecCode.length) zone.appendChild(el('p', { class: 'empty' }, 'LinkedIn ne permet pas d\'afficher le fil d\'une page. Ajoute une publication avec son code « Intégrer cette publication » pour la voir ici.'));
        avecCode.forEach(function (s) { zone.appendChild(el('iframe', { src: s, title: 'Publication LinkedIn de la DMD', loading: 'lazy', style: 'min-height:520px;margin-bottom:10px', referrerpolicy: 'no-referrer' })); });
      }
    };
    if (valeur) zone.append(el('p', null, 'Le fil est chargé à la demande, pour ne pas transmettre ta navigation à ' + nom + ' à chaque ouverture.'), bouton(code === 'linkedin' ? 'Afficher les publications' : 'Afficher le fil', 'oeil', afficher));
    else zone.append(el('p', null, 'Renseigne le compte de la DMD ci-dessus pour afficher son fil.'));
    return el('article', { class: 'card', id: 'reseau-' + code }, [
      el('div', { class: 'card-head' }, [el('h3', { class: 'reseau-head' }, [el('span', { class: 'reseau-logo r-' + code }, nom[0]), nom]), url ? u.lien('Ouvrir le compte', url, 'small') : null]),
      config, zone
    ]);
  }

  /* ================= Risques et catastrophes ================= */
  pages.risques = {
    titre: 'Risques et catastrophes', icone: 'risques',
    nouveau: function () { ui.formulaire('Evenements', { type: 'catastrophe' }); },
    rendre: function (c) {
      var vig = S().get('Sources').filter(function (s) { return s.type === 'vigilance'; });
      var ev = S().get('Evenements').filter(function (e) { return e.type === 'catastrophe'; }).sort(parDateDesc);
      u.append(c, [
        tete('Risques et catastrophes', 'Vigilances officielles en direct, profil de risques du département et épisodes marquants.', [bouton('Ajouter un événement', 'plus', pages.risques.nouveau, 'btn-primary', { id: 'btn-ajouter' })]),
        el('div', { class: 'tiles' }, vig.map(function (s) { return el('a', { class: 'tile', href: s.url, target: '_blank', rel: 'noopener noreferrer' }, [el('span', { class: 'k' }, 'Vigilance'), el('span', { class: 'v', style: 'font-size:22px' }, s.nom), el('span', { class: 'd' }, s.usage)]); })),
        el('div', { class: 'grid-2' }, [
          el('article', { class: 'card' }, [el('div', { class: 'card-head' }, [el('h3', null, 'Profil de risques'), el('span', { class: 'small muted' }, 'Sur 195 communes')]),
            el('div', { class: 'tablebox' }, el('table', { class: 't' }, [el('thead', null, el('tr', null, [el('th', null, 'Risque'), el('th', null, 'Communes'), el('th', null, 'Détail')])),
              el('tbody', null, S().get('Risques').map(function (r) { return el('tr', null, [el('td', null, r.risque), el('td', { class: 'num' }, r.communes || 'Tout le 82'), el('td', null, [r.detail + ' ', u.lien('Source', r.url, 'small muted')])]); }))]))]),
          el('article', { class: 'card' }, [el('div', { class: 'card-head' }, [el('h3', null, 'Catastrophes et épisodes marquants'), el('span', { class: 'small muted' }, u.pluriel(ev.length, 'événement'))]), frise(ev)])
        ])
      ]);
    }
  };
  function frise(liste) {
    if (!liste.length) return ui.vide('Aucun événement.');
    var dec = null, n = [];
    liste.forEach(function (e) {
      var d = String(e.date).slice(0, 3) + '0';
      if (d !== dec) { dec = d; n.push(el('li', { class: 'decade', 'aria-hidden': 'true' }, 'Années ' + d)); }
      n.push(el('li', { class: 'tl tl-' + e.gravite }, [
        el('span', { class: 'tl-date' }, [u.date(e.date), ' · ', e.nature, e.communes ? ' · ' + e.communes : '']),
        el('span', { class: 'tl-title' }, e.titre),
        e.bilan ? el('p', { class: 'item-text' }, e.bilan) : null,
        e.implication ? el('p', { class: 'item-text' }, 'Armées : ' + e.implication) : null,
        el('span', { class: 'meta' }, [u.lien(e.source || 'Source', e.url), el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Modifier', onclick: function () { ui.formulaire('Evenements', e); } }, u.icone('editer'))])
      ]));
    });
    return el('ol', { class: 'timeline' }, n);
  }

  /* ================= Historique sécuritaire ================= */
  pages.historique = {
    titre: 'Historique sécuritaire', icone: 'historique',
    nouveau: function () { ui.formulaire('Evenements', { type: 'securite' }); },
    rendre: function (c) {
      var nature = '';
      var zone = el('div');
      var tous = S().get('Evenements').filter(function (e) { return e.type === 'securite'; });
      var natures = Array.from(new Set(tous.map(function (e) { return e.nature; }))).sort();
      var dessiner = function () { zone.replaceChildren(frise(tous.filter(function (e) { return !nature || e.nature === nature; }).sort(parDateDesc))); };
      u.append(c, [
        tete('Historique sécuritaire', 'Tout ce qui peut appeler un appui des armées à l\'autorité civile (logique des 4i) : catastrophes naturelles, feux, canicules, crises sanitaires, ordre public et colère sociale, terrorisme, sûreté nucléaire, postures Vigipirate et Sentinelle, pertes en opération. Le contexte national (COVID, canicules) est indiqué comme tel. La collecte y verse automatiquement les faits marquants d\'intérêt fort.', [
          ui.select([['', 'Toutes les natures']].concat(natures.map(function (n) { return [n, n]; })), '', function (v) { nature = v; dessiner(); }, { 'aria-label': 'Nature' }),
          bouton('Excel', 'export', function () { ui.exporterXlsx('evenements-dmd82', S().get('Evenements'), colonnes('Evenements')); }),
          bouton('Ajouter', 'plus', pages.historique.nouveau, 'btn-primary', { id: 'btn-ajouter' })
        ]),
        el('article', { class: 'card' }, zone)
      ]);
      dessiner();
    }
  };

  /* ================= Défense dans le 82 ================= */
  pages.defense = {
    titre: 'Défense dans le 82', icone: 'defense',
    rendre: function (c) {
      u.append(c, [
        tete('Défense dans le 82', 'Unités implantées et poids du ministère des Armées dans le département.'),
        el('div', { class: 'tiles' }, S().get('Chiffres').map(function (r) { return el('div', { class: 'tile' }, [el('span', { class: 'k' }, r.libelle), el('span', { class: 'v' }, u.nombre(r.valeur)), el('span', { class: 'd' }, r.unite + ', ' + r.annee)]); })),
        el('article', { class: 'card' }, [el('div', { class: 'card-head' }, [el('h3', null, 'Unités et implantations'), bouton('Ajouter', 'plus', function () { ui.formulaire('Implantations', null); }, 'btn-sm')]),
          el('div', { class: 'tablebox' }, el('table', { class: 't' }, [el('thead', null, el('tr', null, [el('th', null, 'Unité'), el('th', null, 'Commune'), el('th', { class: 'hide-narrow' }, 'Site'), el('th', { class: 'hide-narrow' }, 'Repères'), el('th', null, '')])),
            el('tbody', null, S().get('Implantations').map(function (r) { return el('tr', null, [el('td', null, r.unite), el('td', null, r.commune), el('td', { class: 'hide-narrow' }, r.site), el('td', { class: 'hide-narrow' }, [r.note, r.url ? ' ' : '', r.url ? u.lien('Source', r.url, 'small muted') : null]), el('td', null, el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Modifier', onclick: function () { ui.formulaire('Implantations', r); } }, u.icone('editer')))]); }))])),
          el('p', { class: 'card-note' }, 'Source : ministère des Armées, fiche LPM 2024-2030 Tarn-et-Garonne.')])
      ]);
    }
  };

  /* ================= Sources OSINT ================= */
  pages.sources = {
    titre: 'Sources OSINT', icone: 'sources',
    nouveau: function () { ui.formulaire('Sources', null); },
    rendre: function (c) {
      var src = S().get('Sources');
      u.append(c, [
        tete('Sources OSINT', 'Flux et pages collectés toutes les 2 heures, sites à consulter et recherches prêtes à l\'emploi. « Tester » vérifie qu\'une source répond.', [bouton('Ajouter une source', 'plus', pages.sources.nouveau, 'btn-primary', { id: 'btn-ajouter' })]),
        el('div', { class: 'grid' }, CANAUX.map(function (k) {
          var l = src.filter(function (s) { return s.canal === k; });
          return el('article', { class: 'card encart canal-' + k }, [el('h3', null, [el('span', { class: 'swatch' }), opt('Sources', 'canal', k)]),
            el('ul', { class: 'list' }, l.map(function (s) {
              var collecte = ['rss', 'page', 'youtube', 'podcast'].indexOf(s.type) !== -1;
              return el('li', { class: 'item', style: s.actif === 'non' ? 'opacity:.55' : '' }, [u.lien(s.nom, s.url, 'item-title'),
                el('div', { class: 'meta' }, [ui.pill(opt('Sources', 'type', s.type), collecte ? 'pill-en_cours' : ''), s.usage ? el('span', null, s.usage) : null]),
                collecte ? el('div', { class: 'meta' }, [el('span', null, s.dernier_statut ? s.dernier_statut + (s.derniere_collecte ? ' (' + s.derniere_collecte + ')' : '') : 'Pas encore relevée'),
                  bouton('Tester', null, function (e) { var b = e.currentTarget; b.disabled = true; App.api.appel('testerSource', { id: s.id }).then(function (r) { ui.toast(r.statut); return S().synchroniser(true); }).catch(ui.erreur).then(function () { b.disabled = false; }); }, 'btn-sm'),
                  bouton(s.actif === 'non' ? 'Activer' : 'Désactiver', null, function () { ui.enregistrer('Sources', Object.assign({}, s, { actif: s.actif === 'non' ? 'oui' : 'non' }), s.actif === 'non' ? 'Source activée.' : 'Source désactivée.'); }, 'btn-sm btn-ghost')]) : null,
                el('div', { class: 'meta' }, el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Modifier la source', onclick: function () { ui.formulaire('Sources', s); } }, u.icone('editer')))]);
            }))]);
        })),
        motsCles(),
        parametres()
      ]);
    }
  };
  function motsCles() {
    var m = S().get('MotsCles');
    var groupe = function (type, titre, texte) {
      var l = m.filter(function (x) { return x.type === type; }).sort(function (a, b) { return a.terme.localeCompare(b.terme, 'fr'); });
      return el('div', { class: 'kv' }, [el('b', null, titre + ' (' + l.length + ')'), el('p', { class: 'small muted' }, texte),
        el('div', { class: 'meta', style: 'margin-top:6px' }, l.map(function (x) { return el('button', { class: 'pill pill-plain', type: 'button', style: 'cursor:pointer', title: 'Modifier', onclick: function () { ui.formulaire('MotsCles', x); } }, x.terme + (type === 'theme' ? ' · ' + x.poids : '')); }))]);
    };
    return el('details', { class: 'card fold', id: 'mots-cles' }, [el('summary', null, 'Mots-clés de la collecte'),
      el('p', { class: 'card-note' }, 'Un article d\'une source non locale n\'est gardé que s\'il cite un lieu du 82. Son score est la somme des poids des thèmes trouvés : 6 et plus pour un intérêt fort, 3 et plus pour un intérêt moyen (réglable dans les paramètres).'),
      groupe('lieu', 'Lieux du 82', 'Communes et noms du département.'),
      groupe('theme', 'Thèmes et poids', 'Un clic pour modifier le poids ou le thème.'),
      groupe('exclusion', 'Exclusions', 'Un article qui contient l\'un de ces termes est ignoré.'),
      el('div', null, bouton('Ajouter un mot-clé', 'plus', function () { ui.formulaire('MotsCles', null); }, 'btn-sm'))]);
  }
  function parametres() {
    return el('details', { class: 'card fold', id: 'parametres' }, [el('summary', null, 'Paramètres'),
      el('div', { class: 'tablebox' }, el('table', { class: 't' }, el('tbody', null, S().get('Parametres').map(function (p) {
        var inp = el('input', { class: 'input input-sm', value: p.valeur, 'aria-label': p.description || p.cle, style: 'width:100%' });
        return el('tr', null, [el('td', null, [el('b', null, p.cle), el('div', { class: 'small muted' }, p.description)]), el('td', { style: 'min-width:200px' }, inp),
          el('td', null, bouton('Enregistrer', null, function () { ui.enregistrer('Parametres', Object.assign({}, p, { valeur: inp.value.trim() }), 'Paramètre enregistré.'); }, 'btn-sm'))]);
      }))))]);
  }

  /* ================= Journal ================= */
  pages.journal = {
    titre: 'Historique des modifications', icone: 'journal',
    rendre: function (c) {
      var zone = el('div', { class: 'rows' }, el('div', { class: 'row' }, ui.vide('Chargement…')));
      u.append(c, [tete('Historique des modifications', 'Chaque ajout, modification ou suppression est gardé avec son état avant et après. « Restaurer » remet l\'état d\'avant.'), zone]);
      App.api.appel('historique', { limite: 300 }).then(function (r) {
        if (!r.entrees.length) return zone.replaceChildren(el('div', { class: 'row' }, ui.vide('Aucune modification pour l\'instant.')));
        zone.replaceChildren.apply(zone, r.entrees.map(function (e) {
          var apres = e.apres ? JSON.parse(e.apres) : null, avant = e.avant ? JSON.parse(e.avant) : null;
          var lib = (apres || avant || {}).titre || (apres || avant || {}).nom || (apres || avant || {}).terme || e.cle;
          return el('div', { class: 'row' }, [el('div', { class: 'row-date' }, e.quand), el('div', { class: 'row-body' }, [el('span', { class: 'item-title' }, e.action + ' : ' + (App.SCHEMA.tables[e.table] ? App.SCHEMA.tables[e.table].label : e.table)), el('span', { class: 'item-text' }, lib), el('span', { class: 'meta' }, e.qui)]),
            el('div', { class: 'row-tools' }, e.action === 'collecte' && !avant ? null : bouton('Restaurer', null, function () {
              ui.confirmer('Restaurer cet état ?', avant ? 'La ligne reprendra son contenu d\'avant cette modification.' : 'La ligne ajoutée sera supprimée.', 'Restaurer').then(function (ok) {
                if (ok) App.api.appel('restaurer', { journalId: e.id }).then(function () { ui.toast('Restauré.'); return S().synchroniser(true); }).then(function () { App.app.afficher(); }, ui.erreur);
              });
            }, 'btn-sm'))]);
        }));
      }, function (e) { zone.replaceChildren(el('div', { class: 'row' }, ui.vide('Historique indisponible : ' + e.message))); });
    }
  };

  App.pages = pages;
  App.pagesOrdre = ['synthese', 'fil', 'cas', 'reseaux', 'risques', 'historique', 'defense', 'sources', 'journal'];
})();
