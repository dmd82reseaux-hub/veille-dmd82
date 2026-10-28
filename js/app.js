window.App = window.App || {};
(function () {
  var u = App.u, el = u.el, ui = App.ui, api = App.api, store = App.store;
  var app = {};
  // Dernière visite : ce qui a été ajouté depuis est marqué « Nouveau »
  App.visitePrecedente = u.lire('derniere_visite', 0);
  u.ecrire('derniere_visite', Date.now());
  window.addEventListener('pagehide', function () { u.ecrire('derniere_visite', Date.now()); });
  var courant = { nom: null, ctrl: null };
  var racine = u.$('#app');

  /* ---------- Thème clair, sombre ou automatique ---------- */
  var THEMES = ['auto', 'light', 'dark'];
  var LIB_THEME = { auto: 'Thème automatique', light: 'Thème clair', dark: 'Thème sombre' };
  function appliquerTheme(t) {
    if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
    var sombre = t === 'dark' || (t === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.themeEffectif = sombre ? 'dark' : 'light';
    var m = u.$('meta[name="theme-color"]'); if (m) m.setAttribute('content', sombre ? '#191d16' : '#ffffff');
  }
  function changerTheme() {
    var t = THEMES[(THEMES.indexOf(u.lire('theme', 'auto')) + 1) % 3];
    u.ecrire('theme', t); appliquerTheme(t); ui.toast(LIB_THEME[t] + '.');
    var b = u.$('#btn-theme span'); if (b) b.textContent = LIB_THEME[t];
  }
  appliquerTheme(u.lire('theme', 'auto'));

  /* ---------- Coquille ---------- */
  function lienNav(nom, cls) {
    var p = App.pages[nom];
    return el('a', { class: cls || 'nav-link', href: '#/' + nom, dataset: { page: nom } }, [u.icone(p.icone), el('span', null, p.titre), nom === 'fil' ? el('span', { class: 'badge', id: cls ? 'badge-fil-m' : 'badge-fil', hidden: true }) : null]);
  }
  /** En-tête à la charte des sites DMD 82 : bandeau marine hachuré, ligne d'organisme en Plex Mono, titre en Libre Baskerville, pastilles. */
  function enTete() {
    var u2 = (u.lire('utilisateur', null) || {});
    var marque = el('div', { class: 'header-mark' });
    var img = el('img', { src: 'img/logo.png', alt: 'Délégation militaire départementale du Tarn-et-Garonne, DMD 82' });
    img.addEventListener('error', function () { img.remove(); marque.appendChild(u.icone('radar')); });
    marque.appendChild(img);
    var jour = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return el('header', { class: 'header-dmd', role: 'banner' }, el('div', { class: 'header-in' }, [
      marque,
      el('div', { class: 'header-org' }, 'Délégation Militaire Départementale 82'),
      el('p', { class: 'header-title' }, ['Veille ', el('em', null, 'Tarn-et-Garonne')]),
      el('div', { class: 'header-sub' }, 'Conseiller · Appuyer · Rayonner · Honorer'),
      el('div', { class: 'header-meta' }, [el('span', { class: 'meta-pill or' }, jour), el('span', { class: 'meta-pill' }, 'Sources ouvertes')]),
      el('span', { class: 'header-user' }, api.demo ? 'Démonstration' : (u2.nom || u2.email || '') + (u2.role ? ' · ' + ({ admin: 'administrateur', contributeur: 'contributeur', lecteur: 'lecteur' }[u2.role] || u2.role) : ''))
    ]));
  }

  function role() { return api.demo ? 'admin' : ((u.lire('utilisateur', null) || {}).role || 'contributeur'); }
  function visible(n) { return !App.pages[n].admin || role() === 'admin'; }
  App.role = role;

  function coquille() {
    document.body.classList.toggle('lecteur', role() === 'lecteur');
    var marque = el('div', { class: 'brand-mark' }, u.icone('radar', '#fff'));
    racine.replaceChildren(
      el('div', { class: 'shell' }, [
        enTete(),
        el('nav', { class: 'side', 'aria-label': 'Navigation' }, [
          el('div', { class: 'brand' }, [marque, el('div', null, [el('b', null, 'Veille DMD 82'), el('span', null, 'Tarn-et-Garonne')])])
        ].concat(App.pagesOrdre.filter(visible).map(function (n) { return lienNav(n); })).concat([
          el('div', { class: 'side-foot' }, [
            el('div', { class: 'statusline', id: 'etat' }, [el('span', { class: 'dot' }), el('span', null, 'Prêt')]),
            el('button', { class: 'btn btn-ghost btn-sm', type: 'button', id: 'btn-theme', onclick: changerTheme }, [u.icone('theme'), el('span', null, LIB_THEME[u.lire('theme', 'auto')])]),
            el('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: aide }, [u.icone('aide'), 'Aide et raccourcis']),
            api.demo ? null : el('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: deconnexion }, [u.icone('sortie'), 'Se déconnecter'])
          ])
        ])),
        el('main', { class: 'main', id: 'contenu' }, [
          el('div', { class: 'topbar' }, [
            el('button', { class: 'search-btn', type: 'button', id: 'btn-recherche', onclick: recherche, 'aria-label': 'Rechercher partout' }, [u.icone('recherche'), el('span', { class: 'grow', style: 'text-align:left' }, 'Rechercher partout'), el('kbd', null, '/')]),
            el('span', { class: 'grow' }),
            el('button', { class: 'icon-btn', type: 'button', title: 'Imprimer', 'aria-label': 'Imprimer la page', onclick: function () { window.print(); } }, u.icone('imprimer')),
            el('button', { class: 'icon-btn hide-wide', type: 'button', title: 'Thème', 'aria-label': 'Changer de thème', onclick: changerTheme }, u.icone('theme'))
          ]),
          api.demo ? el('p', { class: 'demo-note' }, 'Démonstration : données de l’export fourni, non actualisées. Les saisies sont réinitialisées au rechargement.') : null,
          el('div', { class: 'page', id: 'page' })
        ])
      ]),
      el('nav', { class: 'bottombar', 'aria-label': 'Navigation mobile' }, (App.pagesMobile || ['synthese', 'fil', 'cas', 'reseaux']).map(function (n) { return lienNav(n, 'bb'); }).concat([
        el('button', { type: 'button', id: 'btn-plus-menu', 'aria-label': 'Autres rubriques', onclick: menuPlus }, [u.icone('plusmenu'), el('span', null, 'Plus')])
      ])),
      el('button', { class: 'fab', type: 'button', id: 'fab', 'aria-label': 'Ajouter', onclick: nouveau }, u.icone('plus'))
    );
  }
  function menuPlus() {
    var ex = u.$('.more-menu'); if (ex) { ex.remove(); return; }
    var m = el('div', { class: 'more-menu', role: 'menu' }, App.pagesOrdre.filter(visible).filter(function (n) { return (App.pagesMobile || []).indexOf(n) === -1; }).map(function (n) {
      return el('a', { href: '#/' + n, role: 'menuitem', onclick: function () { m.remove(); } }, App.pages[n].titre);
    }).concat([el('a', { href: '#', role: 'menuitem', onclick: function (e) { e.preventDefault(); m.remove(); changerTheme(); } }, 'Changer de thème'),
      el('a', { href: '#', role: 'menuitem', onclick: function (e) { e.preventDefault(); m.remove(); aide(); } }, 'Aide et raccourcis')]));
    document.body.appendChild(m);
    setTimeout(function () { document.addEventListener('click', function f(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('click', f); } }); }, 0);
  }

  /* ---------- Routeur ---------- */
  function lireHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('?'), p = {};
    (parts[1] || '').split('&').forEach(function (kv) { if (!kv) return; var x = kv.split('='); p[decodeURIComponent(x[0])] = decodeURIComponent(x[1] || ''); });
    return { nom: App.pages[parts[0]] ? parts[0] : 'synthese', params: p };
  }
  app.afficher = function (garderDefilement) {
    var r = lireHash();
    var page = u.$('#page'); if (!page) return;
    var y = window.scrollY;
    var focus = document.activeElement && document.activeElement.id;
    page.replaceChildren();
    courant.nom = r.nom;
    courant.ctrl = App.pages[r.nom].rendre(page, r.params) || null;
    document.title = 'Veille · ' + App.pages[r.nom].titre;
    u.$$('[data-page]').forEach(function (a) { if (a.dataset.page === r.nom) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    u.$('#fab').hidden = !App.pages[r.nom].nouveau;
    majBadge();
    if (garderDefilement) { window.scrollTo(0, y); if (focus && document.getElementById(focus)) document.getElementById(focus).focus(); }
    else window.scrollTo(0, 0);
  };
  function majBadge() {
    var n = store.get('Articles').filter(function (a) { return a.statut === 'nouveau'; }).length;
    ['#badge-fil', '#badge-fil-m'].forEach(function (s) { var b = u.$(s); if (b) { b.hidden = !n; b.textContent = n > 99 ? '99+' : String(n); } });
  }
  window.addEventListener('hashchange', function () { while (ui.fermerDerniere()) { /* ferme les fenêtres ouvertes */ } var mm = u.$('.more-menu'); if (mm) mm.remove(); app.afficher(false); });
  store.on(function (raison) {
    if (!u.$('#page')) return;
    // une saisie en cours n'est pas interrompue : on redessine sans perdre la position
    if (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName) && document.activeElement.closest('.overlay')) return;
    if (courant.ctrl && courant.ctrl.redessiner && raison !== 'serveur') { courant.ctrl.redessiner(); majBadge(); }
    else app.afficher(true);
  });
  document.addEventListener('app:etat', function (e) {
    var b = u.$('#etat'); if (!b) return;
    var t = { ok: ['dot', api.demo ? 'Démonstration' : 'À jour'], horsligne: ['dot dot-off', 'Hors connexion' + (store.file.length ? ', ' + u.pluriel(store.file.length, 'modification') + ' en attente' : '')], attente: ['dot dot-off', u.pluriel(store.file.length, 'modification') + ' en attente'], erreur: ['dot dot-err', 'Erreur de synchronisation'], init: ['dot', 'Chargement'] }[e.detail] || ['dot', ''];
    b.replaceChildren(el('span', { class: t[0] }), el('span', null, t[1]));
  });

  function nouveau() { var p = App.pages[courant.nom]; if (p && p.nouveau) p.nouveau(); }

  /* ---------- Recherche globale ---------- */
  function recherche() {
    var champ = el('input', { class: 'input', type: 'search', placeholder: 'Article, cas, événement, publication, source…', 'aria-label': 'Rechercher', id: 'recherche-globale' });
    var res = el('div', { class: 'search-results', role: 'listbox' });
    var f = ui.fenetre('Rechercher', el('div', { style: 'display:grid;gap:10px' }, [champ, res]));
    var sel = 0, items = [];
    var cibles = [
      ['Articles', 'Fil', function (r) { return r.titre; }, function (r) { return u.date(r.date) + ' · ' + r.source; }, function (r) { return '#/fil?q=' + encodeURIComponent(r.titre.slice(0, 40)); }],
      ['Cas', 'Cas', function (r) { return r.titre; }, function (r) { return ui.opt('Cas', 'statut', r.statut); }, function (r) { return '#/cas?id=' + encodeURIComponent(r.id) + (r.statut === 'clos' ? '&statut=clos' : ''); }],
      ['Textes', 'Texte officiel', function (r) { return r.titre; }, function (r) { return u.date(r.date) + ' · ' + ui.opt('Textes', 'source', r.source); }, function (r) { return '#/textes?q=' + encodeURIComponent(r.titre.slice(0, 40)); }],
      ['Suivis', 'Suivi', function (r) { return r.valeur; }, function (r) { return ui.opt('Suivis', 'type', r.type); }, function () { return '#/suivis'; }],
      ['Evenements', 'Événement', function (r) { return r.titre; }, function (r) { return u.date(r.date) + ' · ' + r.nature; }, function (r) { return r.type === 'securite' ? '#/historique' : '#/risques'; }],
      ['Publications', 'Réseaux', function (r) { return (r.texte || r.url).slice(0, 90); }, function (r) { return ui.opt('Publications', 'reseau', r.reseau) + ' · ' + u.date(r.date); }, function () { return '#/reseaux'; }],
      ['Sources', 'Source', function (r) { return r.nom; }, function (r) { return r.usage; }, function () { return '#/sources'; }],
      ['Implantations', 'Unité', function (r) { return r.unite; }, function (r) { return r.commune; }, function () { return '#/defense'; }]
    ];
    if (App.rechercheEcosysteme) cibles = cibles.concat(App.rechercheEcosysteme());
    var dessiner = function () {
      var q = u.normaliser(champ.value);
      items = [];
      if (q.length >= 2) cibles.forEach(function (c) {
        store.get(c[0]).forEach(function (r) { if (u.normaliser(Object.values(r).join(' ')).indexOf(q) !== -1) items.push({ t: c[2](r), s: c[1] + ' · ' + c[3](r), h: c[4](r) }); });
      });
      items = items.slice(0, 40); sel = 0;
      res.replaceChildren.apply(res, items.length ? items.map(function (it, i) {
        return el('button', { class: 'sr', type: 'button', role: 'option', 'aria-selected': i === sel ? 'true' : 'false', onclick: function () { f.fermer(); location.hash = it.h; } }, [el('span', null, it.t), el('small', null, it.s)]);
      }) : [ui.vide(q.length >= 2 ? 'Aucun résultat.' : 'Tape au moins deux lettres.')]);
    };
    champ.addEventListener('input', dessiner);
    champ.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, Math.min(items.length - 1, sel + (e.key === 'ArrowDown' ? 1 : -1))); u.$$('.sr', res).forEach(function (b, i) { b.setAttribute('aria-selected', i === sel ? 'true' : 'false'); if (i === sel) b.scrollIntoView({ block: 'nearest' }); }); }
      if (e.key === 'Enter' && items[sel]) { f.fermer(); location.hash = items[sel].h; }
    });
    dessiner();
  }

  /* ---------- Aide et raccourcis ---------- */
  var RACCOURCIS = [['/', 'Rechercher partout'], ['n', 'Ajouter dans la rubrique ouverte'], ['g puis s', 'Synthèse'], ['g puis f', 'Fil de veille'], ['g puis t', 'Textes officiels'], ['g puis v', 'Suivis'], ['g puis a', 'Alertes'], ['g puis c', 'Cas DMD'], ['g puis r', 'Réseaux DMD'], ['g puis h', 'Historique sécuritaire'], ['t', 'Changer de thème'], ['?', 'Cette aide'], ['Échap', 'Fermer une fenêtre']];
  function aide() {
    ui.fenetre('Aide et raccourcis', el('div', { style: 'display:grid;gap:12px' }, [
      el('p', null, 'Le fil se remplit seul toutes les 2 heures à partir des flux de l\'onglet Sources. Qualifie chaque article (intérêt, lu, retenu ou écarté) et rattache-le à un cas. Chaque action peut être annulée depuis le message qui s\'affiche, et l\'onglet Historique des modifications permet de revenir en arrière.'),
      el('table', { class: 't' }, el('tbody', null, RACCOURCIS.map(function (r) { return el('tr', null, [el('td', null, el('kbd', null, r[0])), el('td', null, r[1])]); }))),
      el('div', null, el('button', { class: 'btn', type: 'button', onclick: function () { ui.fermerDerniere(); visite(true); } }, 'Revoir la visite guidée'))
    ]));
  }
  var enG = false;
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (ui.fermerDerniere()) return; var m = u.$('.more-menu'); if (m) m.remove(); return; }
    var t = e.target;
    if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(t.tagName) || u.$('.overlay') || !u.$('#page')) return;
    if (enG) {
      enG = false;
      var cible = { s: 'synthese', f: 'fil', t: 'textes', v: 'suivis', a: 'alertes', c: 'cas', r: 'reseaux', h: 'historique', d: 'defense', o: 'sources', j: 'journal' }[e.key];
      if (cible) { location.hash = '#/' + cible; e.preventDefault(); }
      return;
    }
    if (e.key === '/') { e.preventDefault(); recherche(); }
    else if (e.key === '?') { e.preventDefault(); aide(); }
    else if (e.key === 'n') { e.preventDefault(); nouveau(); }
    else if (e.key === 't') changerTheme();
    else if (e.key === 'g') { enG = true; setTimeout(function () { enG = false; }, 1200); }
  });

  /* ---------- Visite guidée ---------- */
  var ETAPES = [
    ['#modules', 'synthese', 'Le tableau de bord tient sur un écran : bandeau de situation et indicateurs en haut, le Tarn-et-Garonne à gauche avec photos et aperçus, la zone Sud et les armées à droite, puis la géopolitique, les textes, les échéances et les suivis.'],
    ['#btn-personnaliser', 'synthese', '« Personnaliser », en bas du tableau de bord, permet de masquer un bloc ou d\'ajouter des modules supplémentaires.'],
    ['#filtres', 'fil', 'Le fil de veille : filtre, recherche, puis qualifie chaque article directement dans sa ligne.'],
    ['#suivis-liste', 'suivis', 'Les suivis : personnes, postes, mots-clés et ministères cherchés partout, y compris dans le Journal officiel pour les nominations.'],
    ['#recherches-connectees', 'reseaux', 'Les recherches connectées s\'ouvrent avec ta session DMD sur X, Facebook et LinkedIn ; un résultat utile s\'ajoute au fil en deux clics.'],
    ['#btn-recherche', null, 'Tout se retrouve ici, ou avec la touche « / ». La touche « ? » affiche tous les raccourcis.']
  ];
  function visite(forcer) {
    if (!forcer && u.lire('visite', false)) return;
    var i = 0, box = null, cible = null;
    var fin = function () { if (cible) cible.classList.remove('tour-target'); if (box) box.remove(); u.ecrire('visite', true); };
    var etape = function () {
      if (cible) cible.classList.remove('tour-target');
      if (box) box.remove();
      if (i >= ETAPES.length) return fin();
      var e = ETAPES[i];
      if (e[1] && lireHash().nom !== e[1]) { location.hash = '#/' + e[1]; return setTimeout(etape, 120); }
      cible = u.$(e[0]);
      if (cible) { cible.classList.add('tour-target'); cible.scrollIntoView({ block: 'center' }); }
      box = el('div', { class: 'tour-box', role: 'dialog', 'aria-label': 'Visite guidée' }, [
        el('span', { class: 'small muted' }, 'Visite guidée · ' + (i + 1) + ' sur ' + ETAPES.length), el('p', { style: 'margin:0' }, e[2]),
        el('div', { class: 'modal-foot' }, [el('button', { class: 'btn btn-ghost', type: 'button', onclick: fin }, 'Passer'), el('button', { class: 'btn btn-primary', type: 'button', onclick: function () { i++; etape(); } }, i === ETAPES.length - 1 ? 'Terminer' : 'Suivant')])
      ]);
      document.body.appendChild(box);
      box.querySelector('.btn-primary').focus();
    };
    etape();
  }

  /* ---------- Connexion par code courriel, Google en option ---------- */
  /** Écran de connexion : code reçu par courriel (toute adresse autorisée) ou compte Google. */
  function ecranConnexion(message) {
    var email = el('input', { class: 'input', type: 'email', id: 'login-email', placeholder: 'prenom.nom@def.gouv.fr', autocomplete: 'email', 'aria-label': 'Adresse électronique' });
    email.value = (u.lire('utilisateur', null) || {}).email || '';
    var code = el('input', { class: 'input', id: 'login-code', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: '6', placeholder: 'Code à 6 chiffres', 'aria-label': 'Code reçu' });
    var etape2 = el('div', { style: 'display:grid;gap:8px', hidden: true }, [el('label', { for: 'login-code', class: 'small' }, 'Code reçu par courriel'), code,
      el('button', { class: 'btn btn-primary', type: 'button', id: 'login-valider', onclick: function () { valider(); } }, 'Se connecter')]);
    var info = el('p', { class: 'small muted', style: 'margin:0', role: 'status', 'aria-live': 'polite' });
    var enCours = false;
    function demander() {
      if (enCours) return;
      var v = email.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return ui.toast('Saisis une adresse électronique valide.', { erreur: true });
      enCours = true; email.disabled = true;
      var b = u.$('#login-demander'); b.disabled = true; b.textContent = 'Envoi en cours…';
      api.appel('demanderCode', { email: v }).then(function (r) { info.textContent = r.message; etape2.hidden = false; code.value = ''; code.focus(); }, function (e) { info.textContent = e.message; })
        .then(function () { enCours = false; email.disabled = false; b.disabled = false; b.textContent = 'Recevoir un nouveau code'; });
    }
    function valider() {
      if (enCours) return;
      if (!/^\d{6}$/.test(code.value.trim())) { info.textContent = 'Saisissez les six chiffres du code reçu par courriel.'; code.focus(); return; }
      enCours = true;
      var b = u.$('#login-valider'); b.disabled = true; b.textContent = 'Vérification…';
      api.connecterCode(email.value.trim(), code.value.trim()).then(demarrerSession, function (e) { info.textContent = e.message; })
        .then(function () { enCours = false; b.disabled = false; b.textContent = 'Se connecter'; });
    }
    email.addEventListener('input', function () { etape2.hidden = true; code.value = ''; info.textContent = ''; });
    code.addEventListener('keydown', function (e) { if (e.key === 'Enter') valider(); });
    email.addEventListener('keydown', function (e) { if (e.key === 'Enter') demander(); });
    var blason = el('img', { src: 'img/logo.png', alt: 'DMD 82', class: 'login-blason' });
    blason.addEventListener('error', function () { blason.remove(); });
    racine.replaceChildren(el('div', { class: 'login' }, el('div', { class: 'card' }, [
      blason,
      el('p', { class: 'label', style: 'margin:0' }, 'Délégation militaire départementale 82'),
      el('h1', null, ['Veille ', el('em', null, 'Tarn-et-Garonne')]), el('p', { class: 'muted', style: 'margin:0' }, 'Un code par courriel, valable 10 minutes. Accès réservé aux adresses autorisées.'),
      el('div', { class: 'login-choices' }, [
        el('label', { for: 'login-email', class: 'small' }, 'Votre adresse électronique'), email,
        el('button', { class: 'btn btn-primary', type: 'button', id: 'login-demander', onclick: demander }, 'Recevoir mon code par courriel'),
        etape2, info,
        App.CONFIG.CLIENT_ID ? el('div', { class: 'login-sep' }, 'ou') : null,
        App.CONFIG.CLIENT_ID ? el('div', { id: 'gsi-bouton' }) : null
      ]),
      message ? el('p', { class: 'small', style: 'color:var(--fort)' }, message) : null
    ])));
    if (!App.CONFIG.CLIENT_ID) return;
    ui.chargerScript('https://accounts.google.com/gsi/client').then(function () {
      google.accounts.id.initialize({ client_id: App.CONFIG.CLIENT_ID, callback: function (r) {
        api.connecter(r.credential).then(demarrerSession, function (e) { ecranConnexion(e.message); });
      }, ux_mode: 'popup', auto_select: false });
      google.accounts.id.renderButton(u.$('#gsi-bouton'), { theme: 'outline', size: 'large', text: 'signin_with', locale: 'fr' });
    }, function () { var g = u.$('#gsi-bouton'); if (g) g.textContent = 'Connexion Google indisponible.'; });
  }
  function deconnexion() { api.deconnecter(); ecranConnexion(); }
  document.addEventListener('app:session', function () { ecranConnexion('Session expirée. Reconnecte-toi.'); });

  var derniereActivite = Date.now();
  ['click', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, function () { derniereActivite = Date.now(); }, { passive: true }); });
  setInterval(function () {
    if (!api.demo && api.session && Date.now() - derniereActivite > App.CONFIG.INACTIVITE_MIN * 60000) { api.deconnecter(); ecranConnexion('Déconnecté après ' + App.CONFIG.INACTIVITE_MIN + ' minutes d\'inactivité.'); }
  }, 30000);

  function demarrerSession() {
    coquille();
    u.$('#page').appendChild(ui.vide('Chargement…'));
    store.demarrer().catch(function (e) { if (e && e.code !== 'session') ui.erreur(e); }).then(function () {
      if (!u.$('#page')) return;
      app.afficher(false);
      setTimeout(function () { visite(false); }, 400);
    });
  }
  setInterval(function () { if (document.visibilityState === 'visible' && (api.demo || api.session) && u.$('#page')) store.synchroniser(false).catch(function () {}); }, App.CONFIG.POLL_SECONDES * 1000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && (api.demo || api.session) && u.$('#page')) store.synchroniser(false).catch(function () {}); });

  /* ---------- Service worker ---------- */
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.APERCU) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  app.demarrer = function () {
    if (api.demo || api.session) demarrerSession(); else ecranConnexion();
  };
  App.app = app;
  app.demarrer();
})();
