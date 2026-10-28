window.App = window.App || {};
/*
 * Tableau de bord opérationnel, pensé pour un écran de PC : tout l'essentiel sans défiler.
 * Rangée 1 : bandeau de situation (dernière veille, posture, indicateurs, prochaine échéance).
 * Rangée 2 : le Tarn-et-Garonne à gauche (à la une et articles avec photo et aperçu), zone Sud et armées à droite.
 * Rangée 3 : géopolitique du jour. Rangée 4 : textes officiels, échéances et cas, suivis cités.
 * Rangée 5 : à écouter et à voir, alertes. Les autres modules restent disponibles dans « Personnaliser ».
 */
(function () {
  var u = App.u, el = u.el, ui = App.ui, S = function () { return App.store; };
  var T = App.tableau;
  var opt = function (t, c, v) { return ui.opt(t, c, v); };
  var options = function (t, c) { var f = App.SCHEMA.tables[t].fields.find(function (x) { return x.name === c; }); return Object.keys(f.options).map(function (k) { return [k, f.options[k]]; }); };
  var parDate = function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')) || Number(b.interet) - Number(a.interet); };
  var actifs = function (a) { return a.statut !== 'ecarte'; };
  var du82 = function (a) { return !a.perimetre || a.perimetre === 'departement'; };
  var MOTS_VIDES = ['le', 'la', 'les', 'l', 'de', 'du', 'des', 'd', 'et', 'en', 'au', 'aux', 'via', 'a'];

  /* ---------- Vignettes : photo de l'article, sinon pastille de la source ---------- */
  function initiales(source) {
    var mots = String(source || '?').replace(/\(.*?\)/g, ' ').split(/[^A-Za-zÀ-ÿ0-9]+/).filter(function (m) { return m && MOTS_VIDES.indexOf(m.toLowerCase()) === -1; });
    if (mots.length === 1) return mots[0].slice(0, 4).toUpperCase();
    return mots.slice(0, 3).map(function (m) { return m.charAt(0); }).join('').toUpperCase() || '?';
  }
  function pastille(a, cls) {
    return el('div', { class: 'vg vg-vide canal-' + (a.canal || 'presse_locale') + ' ' + (cls || ''), 'aria-hidden': 'true' }, el('span', null, initiales(a.source)));
  }
  function vignette(a, cls, siEchec) {
    var boite = el('div', { class: 'vg ' + (cls || '') });
    if (!u.safeUrl(a.image)) return siEchec ? null : pastille(a, cls);
    var img = el('img', { src: a.image, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' });
    img.addEventListener('error', function () { if (siEchec) { boite.remove(); siEchec(); } else boite.replaceWith(pastille(a, cls)); });
    boite.appendChild(img);
    return boite;
  }
  function meta(a, sansInteret) {
    return el('div', { class: 'meta' }, [sansInteret ? null : ui.pill(opt('Articles', 'interet', a.interet), 'pill-' + a.interet)].concat(u.etiquettesAge(a)).concat([
      el('span', { class: 'src' }, a.source), a.commune ? el('span', null, a.commune) : null, a.suivis ? el('span', { class: 'suivi-tag' }, a.suivis) : null]));
  }
  function classes(a, base) { return base + ' int-' + (a.interet || '1') + (a.statut === 'nouveau' ? ' item-new' : ''); }

  /** Article avec photo, titre, début du texte et repères. */
  function itemRiche(a) {
    return el('li', { class: classes(a, 'ri') }, [vignette(a, 'vg-m'), el('div', { class: 'ri-corps' }, [
      u.lien(a.titre, a.url, 'item-title clamp-2'), a.resume ? el('p', { class: 'apercu clamp-2' }, a.resume) : null, meta(a)])]);
  }
  /** Article compact pour les colonnes latérales. */
  function itemCompact(a) {
    return el('li', { class: classes(a, 'rc') }, [vignette(a, 'vg-s'), el('div', { class: 'ri-corps' }, [u.lien(a.titre, a.url, 'item-title clamp-3'), meta(a, a.interet !== '3')])]);
  }
  /** Article à la une : grande photo et résumé. */
  function aLaUne(a) {
    // Sans photo, l'article à la une prend toute la largeur au lieu d'afficher une grande pastille.
    var carte = el('article', { class: classes(a, 'lead') });
    var sansPhoto = function () { carte.classList.add('lead-sans-photo'); };
    var v = vignette(a, 'vg-l', sansPhoto);
    if (!v) sansPhoto();
    return u.append(carte, [v, el('div', { class: 'lead-corps' }, [
      el('span', { class: 'eyebrow' }, [opt('Articles', 'canal', a.canal), a.commune ? ' · ' + a.commune : '', ' · ', opt('Articles', 'theme', a.theme)]),
      u.lien(a.titre, a.url, 'lead-titre'), a.resume ? el('p', { class: 'apercu clamp-4' }, a.resume) : null, meta(a)])]);
  }

  /* ---------- Carte avec onglets ---------- */
  function carteOnglets(id, titre, onglets, lien, rendre) {
    var cle = 'onglet-' + id, choix = u.lire(cle, onglets[0][0]);
    if (!onglets.some(function (o) { return o[0] === choix; })) choix = onglets[0][0];
    var corps = el('div', { class: 'carte-corps' });
    var barre = el('div', { class: 'onglets', role: 'tablist', 'aria-label': titre });
    var dessiner = function () {
      barre.replaceChildren.apply(barre, onglets.map(function (o) {
        return el('button', { type: 'button', role: 'tab', class: 'onglet', 'aria-selected': String(o[0] === choix), onclick: function () { choix = o[0]; u.ecrire(cle, choix); dessiner(); } },
          [o[1], o[2] != null ? el('span', { class: 'onglet-n' }, String(o[2])) : null]);
      }));
      corps.replaceChildren(rendre(choix));
    };
    dessiner();
    return el('article', { class: 'card module', id: 'mod-' + id }, [
      el('div', { class: 'card-head' }, [el('h3', null, titre), lien ? el('a', { class: 'small', href: lien[0] }, lien[1]) : null]), barre, corps]);
  }
  function carteSimple(id, titre, lien, contenu) {
    return el('article', { class: 'card module', id: 'mod-' + id }, [el('div', { class: 'card-head' }, [el('h3', null, titre), lien ? el('a', { class: 'small', href: lien[0] }, lien[1]) : null]), contenu]);
  }
  function liste(l, rendu, vide, cls) { return l.length ? el('ul', { class: 'list ' + (cls || '') }, l.map(rendu)) : ui.vide(vide); }

  /* ---------- Bandeau de situation ---------- */
  function bandeau() {
    var sit = S().get('Situation').slice().sort(function (a, b) { return Number(a.ordre || 9) - Number(b.ordre || 9); });
    var g = function (k) { return sit.find(function (r) { return r.cle === k; }) || {}; };
    var arts = S().get('Articles'), textes = S().get('Textes'), cas = S().get('Cas'), j7 = u.dateDecalee(-7), today = u.aujourdhui();
    var echeance = cas.filter(function (x) { return x.statut !== 'clos' && /^\d{4}-\d{2}-\d{2}$/.test(x.echeance) && x.echeance >= today; }).sort(function (a, b) { return a.echeance.localeCompare(b.echeance); })[0];
    var kpi = function (href, k, v, d, cls) { return el('a', { class: 'kpi ' + (cls || ''), href: href }, [el('span', { class: 'kpi-v' }, v), el('span', { class: 'kpi-k' }, k), d ? el('span', { class: 'kpi-d' }, d) : null]); };
    var forts = arts.filter(function (a) { return a.interet === '3' && a.date >= j7 && actifs(a); }).length;
    return el('section', { class: 'bandeau-op', id: 'mod-bandeau', 'aria-label': 'Situation' }, [
      el('div', { class: 'bo-veille' }, [el('span', { class: 'bo-k' }, 'Dernière veille'), el('span', { class: 'bo-dtg' }, g('derniere_veille').valeur || '…'),
        el('span', { class: 'bo-jour' }, new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))]),
      el('div', { class: 'bo-situation' }, [
        g('synthese').valeur ? el('p', { class: 'bo-synthese clamp-2' }, g('synthese').valeur) : null,
        el('div', { class: 'bo-chips' }, sit.filter(function (r) { return r.cle !== 'synthese' && r.cle !== 'derniere_veille'; }).map(function (r) {
          var alerte = /crise|rouge|urgence|interdiction|arrêt|renforc/i.test(r.valeur + ' ' + r.libelle);
          return el('div', { class: 'bo-chip' + (alerte ? ' bo-alerte' : ''), title: [r.detail, r.source, r.date ? u.date(r.date) : ''].filter(Boolean).join(' · ') }, [
            el('span', { class: 'bo-k' }, r.libelle), u.lien(r.valeur, r.url, 'bo-v')]);
        }))]),
      el('div', { class: 'bo-kpis' }, [
        kpi('#/fil?statut=nouveau', 'à traiter', u.nombre(arts.filter(function (a) { return a.statut === 'nouveau'; }).length)),
        kpi('#/fil?interet=3&periode=7', 'intérêt fort, 7 j', u.nombre(forts), null, forts ? 'kpi-fort' : ''),
        kpi('#/textes?statut=nouveau', 'textes à lire', u.nombre(textes.filter(function (t) { return t.statut === 'nouveau'; }).length)),
        kpi('#/suivis', 'suivis cités, 7 j', u.nombre(arts.concat(textes).filter(function (x) { return x.suivis && x.date >= j7; }).length)),
        echeance ? el('a', { class: 'kpi kpi-echeance', href: '#/cas?id=' + encodeURIComponent(echeance.id) }, [el('span', { class: 'kpi-k' }, 'Prochaine échéance'),
          el('span', { class: 'kpi-date' }, u.date(echeance.echeance)), el('span', { class: 'kpi-d clamp-2' }, echeance.echeance_objet || echeance.titre)]) : null
      ])
    ]);
  }

  /* ---------- Tarn-et-Garonne ---------- */
  function une82() {
    var tous = S().get('Articles').filter(function (a) { return du82(a) && actifs(a) && a.canal !== 'audio_video' && a.canal !== 'presse_specialisee'; });
    var compte = function (k) { return tous.filter(function (a) { return (!k || a.canal === k) && u.fraicheur(a).jours <= 7; }).length; };
    var onglets = [['', 'Tout', compte('')], ['officiel', 'Officiel', compte('officiel')], ['presse_locale', 'Presse locale', compte('presse_locale')], ['presse_nationale', 'Presse nationale', compte('presse_nationale')], ['reseaux_sociaux', 'Réseaux', compte('reseaux_sociaux')]];
    var c = carteOnglets('une82', 'Tarn-et-Garonne', onglets, ['#/fil?perimetre=departement', 'Fil complet'], function (k) {
      var l = tous.filter(function (a) { return !k || a.canal === k; }).sort(parDate);
      if (!l.length) return ui.vide('Rien pour ce type de source.');
      var recents = l.filter(function (a) { return u.fraicheur(a).jours <= 7; });
      var lead = recents.filter(function (a) { return a.interet === '3'; })[0] || recents[0] || l[0];
      var reste = l.filter(function (a) { return a !== lead; }).slice(0, 6);
      return el('div', { class: 'une-corps' }, [aLaUne(lead), liste(reste, itemRiche, '', 'list-ri')]);
    });
    c.classList.add('mod-une');
    return c;
  }

  /* ---------- Colonne droite : zone Sud, armées ---------- */
  function zoneSud() {
    var l = S().get('Articles').filter(function (a) { return a.perimetre === 'zone_sud' && actifs(a) && a.canal !== 'audio_video' && u.fraicheur(a).jours <= 60; }).sort(parDate).slice(0, 4);
    return carteSimple('zone_sud', 'Zone de défense Sud', ['#/fil?perimetre=zone_sud', 'Tout voir'], liste(l, itemCompact, 'Rien de nouveau dans la zone Sud depuis deux mois.', 'list-rc'));
  }
  function armees() {
    var arts = S().get('Articles').filter(function (a) { return actifs(a) && u.fraicheur(a).jours <= 60; });
    var nat = arts.filter(function (a) { return a.perimetre === 'national' && a.canal !== 'presse_specialisee' && a.canal !== 'audio_video'; }).sort(parDate);
    var spe = arts.filter(function (a) { return a.canal === 'presse_specialisee'; }).sort(parDate);
    var n7 = function (l) { return l.filter(function (a) { return u.fraicheur(a).jours <= 7; }).length; };
    return carteOnglets('armees', 'Armées', [['national', 'Actualité', n7(nat)], ['specialisee', 'Presse spécialisée', n7(spe)]], ['#/fil?perimetre=national', 'Tout voir'], function (k) {
      return liste((k === 'specialisee' ? spe : nat).slice(0, 5), itemCompact, k === 'specialisee' ? 'Rien dans la presse spécialisée depuis deux mois.' : 'Rien au niveau national depuis deux mois.', 'list-rc');
    });
  }

  /* ---------- Textes, échéances, suivis ---------- */
  function textes() {
    var t = S().get('Textes').filter(actifs).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    var nomin = function (x) { return x.categorie === 'nomination' || /nomination/i.test(x.resume || ''); };
    var autres = t.filter(function (x) { return !nomin(x); }), noms = t.filter(nomin);
    return carteOnglets('textes2', 'Textes officiels', [['textes', 'Textes', autres.filter(function (x) { return x.statut === 'nouveau'; }).length || null], ['nominations', 'Nominations', noms.filter(function (x) { return x.statut === 'nouveau'; }).length || null]], ['#/textes', 'Tous'], function (k) {
      var l = (k === 'nominations' ? noms : autres).slice(0, 5);
      return liste(l, function (x) {
        return el('li', { class: 'item' + (x.statut === 'nouveau' ? ' item-new' : '') }, [u.lien(x.titre, x.url, 'item-title clamp-2'),
          el('div', { class: 'meta' }, [ui.pill(opt('Textes', 'categorie', x.categorie), 'pill-' + x.interet)].concat(u.etiquettesAge(x)).concat([x.suivis ? el('span', { class: 'suivi-tag' }, x.suivis) : null]))]);
      }, k === 'nominations' ? 'Aucune nomination relevée.' : 'Aucun texte collecté. Le Journal officiel est relu toutes les 6 heures.');
    });
  }
  function agenda() {
    var today = u.aujourdhui(), cas = S().get('Cas').filter(function (x) { return x.statut !== 'clos'; });
    var dates = cas.filter(function (x) { return /^\d{4}-\d{2}-\d{2}$/.test(x.echeance) && x.echeance >= today; }).sort(function (a, b) { return a.echeance.localeCompare(b.echeance); }).slice(0, 4);
    var sansDate = cas.filter(function (x) { return dates.indexOf(x) === -1; }).sort(function (a, b) { return Number(b.priorite) - Number(a.priorite); }).slice(0, Math.max(0, 5 - dates.length));
    var mois = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    var ligne = function (x) {
      var d = /^\d{4}-\d{2}-\d{2}$/.test(x.echeance) && x.echeance >= today;
      return el('li', { class: 'ag' + (x.priorite === '3' ? ' ag-prio' : '') }, [
        d ? el('span', { class: 'ag-date' }, [el('b', null, String(Number(x.echeance.slice(8, 10)))), mois[Number(x.echeance.slice(5, 7)) - 1]]) : el('span', { class: 'ag-date ag-sans' }, x.priorite === '3' ? 'Prio.' : 'Suivi'),
        el('div', { class: 'ri-corps' }, [el('a', { class: 'item-title clamp-2', href: '#/cas?id=' + encodeURIComponent(x.id) }, d && x.echeance_objet ? x.echeance_objet : x.titre),
          el('div', { class: 'meta' }, [el('span', null, x.categorie), d && x.echeance_objet ? el('span', null, x.titre) : null])])]);
    };
    return carteSimple('agenda', 'Échéances et cas', ['#/cas', 'Tous les cas'], liste(dates.concat(sansDate), ligne, 'Aucun cas ouvert.', 'list-ag'));
  }
  function suivis() {
    var j30 = u.dateDecalee(-30);
    var l = S().get('Articles').filter(function (a) { return a.suivis && a.date >= j30 && actifs(a); }).map(function (a) { return { r: a, t: 'a' }; })
      .concat(S().get('Textes').filter(function (t) { return t.suivis && t.date >= j30; }).map(function (t) { return { r: t, t: 't' }; }))
      .sort(function (a, b) { return String(b.r.date).localeCompare(String(a.r.date)); }).slice(0, 5);
    return carteSimple('suivis2', 'Suivis cités', ['#/suivis', 'Gérer'], liste(l, function (x) {
      return el('li', { class: 'item' }, [el('span', { class: 'suivi-tag' }, x.r.suivis), u.lien(x.r.titre, x.r.url, 'item-title clamp-2'), el('div', { class: 'meta' }, u.etiquettesAge(x.r).concat([el('span', null, x.t === 'a' ? x.r.source : opt('Textes', 'source', x.r.source))]))]);
    }, 'Aucune mention des suivis ces 30 derniers jours.'));
  }

  /* ---------- À écouter, à voir ---------- */
  function audioVideo() {
    var l = S().get('Articles').filter(function (a) { return a.canal === 'audio_video' && actifs(a) && u.fraicheur(a).jours <= 30; }).sort(parDate).slice(0, 8);
    return carteSimple('audio_video2', 'À écouter, à voir', ['#/fil?canal=audio_video', 'Tout voir'], l.length ? el('ul', { class: 'av-grille' }, l.map(function (a) {
      var video = /youtube\.com|youtu\.be/.test(a.url || '');
      return el('li', { class: 'av' }, [vignette(a, 'vg-av'), el('span', { class: 'av-type' }, video ? 'Vidéo' : 'Podcast'), u.lien(a.titre, a.url, 'item-title clamp-2'), el('div', { class: 'meta' }, [el('span', { class: 'src' }, a.source)].concat(u.etiquettesAge(a)))]);
    })) : ui.vide('Les nouvelles vidéos et émissions des chaînes et podcasts suivis apparaîtront ici après chaque collecte.'));
  }

  /* ---------- Disposition et personnalisation ---------- */
  var BLOCS = {
    bandeau: { titre: 'Bandeau de situation', rendre: bandeau },
    une82: { titre: 'Tarn-et-Garonne', rendre: une82 },
    zone_sud: { titre: 'Zone de défense Sud', rendre: zoneSud },
    armees: { titre: 'Armées (actualité et presse spécialisée)', rendre: armees },
    geopolitique: { titre: 'Géopolitique du jour', rendre: function () { var c = App.geo.module(); c.classList.add('geo-compact'); return c; } },
    textes: { titre: 'Textes officiels et nominations', rendre: textes },
    agenda: { titre: 'Échéances et cas', rendre: agenda },
    suivis: { titre: 'Suivis cités', rendre: suivis },
    audio_video: { titre: 'À écouter, à voir', rendre: audioVideo }
  };
  // Rangées : [identifiant, gabarit, colonnes]. Une colonne est un bloc ou une pile de blocs.
  var RANGEES = [
    ['r-bandeau', 'un', [['bandeau']]],
    ['r-principal', 'deux-un', [['une82'], ['zone_sud', 'armees']]],
    ['r-geo', 'un', [['geopolitique']]],
    ['r-trois', 'trois', [['textes'], ['agenda'], ['suivis']]],
    ['r-media', 'deux-un', [['audio_video'], ['alertes']]]
  ];
  var CLE = 'tableau-v10';
  function masques() { var m = u.lire(CLE, null); return Array.isArray(m) ? m : DEFAUT_MASQUES.slice(); }
  // Anciens modules proposés en complément, masqués au départ.
  var DEFAUT_MASQUES = ['situation', 'indicateurs', 'officiel', 'presse_locale', 'presse_nationale', 'reseaux_sociaux', 'zone_sud_ancien', 'national', 'presse_specialisee', 'geopolitique_ancien', 'audio_video_ancien', 'textes', 'nominations', 'suivis_ancien', 'cas', 'echeances', 'reseaux', 'themes', 'vigilances', 'historique']
    .map(function (id) { return 'm:' + id; });
  function rendreBloc(id) {
    if (BLOCS[id]) return BLOCS[id].rendre();
    var m = T.MODULES.find(function (x) { return x.id === id; });
    return m ? m.rendre() : null;
  }
  function titreBloc(id) { return BLOCS[id] ? BLOCS[id].titre : ((T.MODULES.find(function (x) { return x.id === id; }) || {}).titre || id); }
  var SUPPLEMENTS = function () { return T.MODULES.filter(function (m) { return ['zone_sud', 'national', 'presse_specialisee', 'geopolitique', 'audio_video', 'suivis', 'alertes'].indexOf(m.id) === -1; }).map(function (m) { return m.id; }); };

  function afficher(c) {
    var caches = masques();
    var visible = function (id) { return caches.indexOf(id) === -1; };
    var page = el('div', { class: 'tableau-op', id: 'modules' });
    RANGEES.forEach(function (r) {
      var cols = r[2].map(function (pile) {
        var blocs = pile.filter(visible).map(rendreBloc).filter(Boolean);
        return blocs.length ? (blocs.length === 1 ? blocs[0] : el('div', { class: 'pile' }, blocs)) : null;
      }).filter(Boolean);
      if (!cols.length) return;
      page.appendChild(el('div', { class: 'rangee g-' + r[1] + ' n-' + cols.length, id: r[0] }, cols));
    });
    var extra = SUPPLEMENTS().filter(function (id) { return caches.indexOf('m:' + id) === -1; }).map(rendreBloc).filter(Boolean);
    if (extra.length) page.appendChild(el('div', { class: 'rangee g-libre', id: 'r-supplements' }, extra));
    var outils = [];
    if (!App.api.demo) outils.push(el('button', { class: 'btn', type: 'button', onclick: function (e) {
      var b = e.currentTarget; b.disabled = true; ui.toast('Collecte en cours…');
      App.api.appel('collecter').then(function (r) { ui.toast(r.message || u.pluriel(r.ajoutes || 0, 'article') + ' ajouté' + ((r.ajoutes || 0) > 1 ? 's' : '') + '.'); return S().synchroniser(true); }).catch(ui.erreur).then(function () { b.disabled = false; });
    } }, [u.icone('collecte'), 'Collecter maintenant']));
    outils.push(el('button', { class: 'btn', type: 'button', id: 'btn-personnaliser', onclick: personnaliser }, [u.icone('editer'), 'Personnaliser']));
    u.append(c, [el('h1', { class: 'sr-only' }, 'Tableau de bord'), page, el('div', { class: 'pied-op' }, outils)]);
  }

  function personnaliser() {
    var caches = masques();
    var ligne = function (id, cle) {
      var cb = el('input', { type: 'checkbox', id: 'perso-' + cle.replace(':', '-') });
      cb.checked = caches.indexOf(cle) === -1;
      cb.addEventListener('change', function () { var i = caches.indexOf(cle); if (cb.checked && i !== -1) caches.splice(i, 1); if (!cb.checked && i === -1) caches.push(cle); });
      return el('div', { class: 'mod-row' }, [cb, el('label', { for: cb.id }, titreBloc(id))]);
    };
    var principaux = [];
    RANGEES.forEach(function (r) { r[2].forEach(function (p) { p.forEach(function (id) { principaux.push(ligne(id, id)); }); }); });
    var supp = SUPPLEMENTS().map(function (id) { return ligne(id, 'm:' + id); });
    var f = ui.fenetre('Personnaliser le tableau de bord', el('div', { style: 'display:grid;gap:12px' }, [
      el('p', { class: 'small muted', style: 'margin:0' }, 'Coche les blocs à afficher. La disposition reste la même ; un bloc masqué libère sa place. Le réglage est propre à cet appareil.'),
      el('div', { class: 'mod-list' }, principaux), el('h4', { class: 'geo-titre' }, 'Modules supplémentaires, affichés en bas'), el('div', { class: 'mod-list' }, supp)]), [
      el('button', { class: 'btn btn-ghost', type: 'button', style: 'margin-right:auto', onclick: function () { u.ecrire(CLE, null); f.fermer(); App.app.afficher(true); ui.toast('Tableau de bord par défaut.'); } }, 'Rétablir'),
      el('button', { class: 'btn', type: 'button', onclick: function () { f.fermer(); } }, 'Annuler'),
      el('button', { class: 'btn btn-primary', type: 'button', onclick: function () { u.ecrire(CLE, caches); f.fermer(); App.app.afficher(true); ui.toast('Tableau de bord enregistré.'); } }, 'Enregistrer')
    ]);
  }

  App.pages.synthese = { titre: 'Tableau de bord', icone: 'synthese', rendre: function (c) { afficher(c); } };

  /* ---------- Page « À écouter, à voir » ---------- */
  App.pages.medias = {
    titre: 'À écouter, à voir', icone: 'casque',
    rendre: function (c, p) {
      var f = { type: p.type || '', theme: p.theme || '' };
      var grille = el('ul', { class: 'av-grille av-page', id: 'medias-grille' });
      var compteur = el('span', { class: 'count' });
      var estVideo = function (a) { return /youtube\.com|youtu\.be/.test(a.url || ''); };
      var majHash = function () { var q = Object.keys(f).filter(function (k) { return f[k]; }).map(function (k) { return k + '=' + encodeURIComponent(f[k]); }).join('&'); history.replaceState(null, '', '#/medias' + (q ? '?' + q : '')); };
      var dessiner = function () {
        var l = S().get('Articles').filter(function (a) {
          return a.canal === 'audio_video' && a.statut !== 'ecarte'
            && (!f.type || (f.type === 'video') === estVideo(a))
            && (!f.theme || a.theme === f.theme);
        }).sort(parDate);
        compteur.textContent = u.pluriel(l.length, 'élément');
        grille.replaceChildren.apply(grille, l.length ? l.map(function (a) {
          return el('li', { class: 'av' }, [vignette(a, 'vg-av'), el('span', { class: 'av-type' }, estVideo(a) ? 'Vidéo' : 'Podcast'),
            u.lien(a.titre, a.url, 'item-title clamp-2'), a.resume ? el('p', { class: 'apercu clamp-2' }, a.resume) : null,
            el('div', { class: 'meta' }, [el('span', { class: 'src' }, a.source), el('span', null, opt('Articles', 'theme', a.theme))].concat(u.etiquettesAge(a)))]);
        }) : [el('li', { style: 'grid-column:1/-1' }, ui.vide('Aucune vidéo ni émission pour ce filtre. Les nouveaux épisodes des chaînes YouTube et podcasts suivis arrivent après chaque collecte.'))]);
      };
      var ctl = function (nom, opts, tous) { return ui.select([['', tous]].concat(opts), f[nom], function (v) { f[nom] = v; majHash(); dessiner(); }, { 'aria-label': tous, id: 'medias-' + nom }); };
      u.append(c, [
        el('div', { class: 'page-head' }, [el('div', null, [el('h1', null, 'À écouter, à voir'),
          el('p', null, 'Les dernières vidéos des chaînes YouTube suivies (ministère et armées, IHEDN, Le Dessous des cartes) et les derniers épisodes des podcasts de défense et de géopolitique. Chaque élément ouvre la source.')]),
          el('div', { class: 'actions' }, [ctl('type', [['video', 'Vidéos'], ['podcast', 'Podcasts']], 'Tout'), ctl('theme', options('Articles', 'theme'), 'Tous les thèmes'), compteur,
            el('a', { class: 'btn btn-sm', href: '#/sources' }, 'Gérer les sources')])]),
        grille
      ]);
      dessiner();
      return { redessiner: dessiner };
    }
  };
  App.pagesOrdre.splice(App.pagesOrdre.indexOf('geopolitique') + 1, 0, 'medias');
  App.vignette = vignette;
})();
