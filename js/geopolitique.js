window.App = window.App || {};
/* Géopolitique du jour : sélection de titres faite chaque matin par le serveur, sans IA. Module du tableau de bord et page d'historique. */
(function () {
  var u = App.u, el = u.el, ui = App.ui, S = function () { return App.store; };
  var REGIONS = App.SCHEMA.tables.Geopolitique.fields.filter(function (f) { return f.name === 'region'; })[0].options;
  var ORDRE = Object.keys(REGIONS);

  function jours() {
    var l = S().get('Geopolitique').map(function (g) { return g.date; }).filter(Boolean);
    return l.filter(function (d, i) { return l.indexOf(d) === i; }).sort().reverse();
  }
  function duJour(date) {
    return S().get('Geopolitique').filter(function (g) { return g.date === date; })
      .sort(function (a, b) { return ORDRE.indexOf(a.region) - ORDRE.indexOf(b.region) || Number(a.rang) - Number(b.rang); });
  }
  function item(g) {
    var n = Number(g.reprises || 1);
    return el('li', { class: 'item geo-item' }, [
      u.lien(g.titre, g.url, 'item-title'),
      el('div', { class: 'meta' }, [el('span', null, g.source), n > 1 ? ui.pill(n + ' sources', 'pill-2') : null])
    ]);
  }
  /** Titres d'un jour groupés par région du monde. */
  function parRegion(l) {
    var blocs = [];
    ORDRE.forEach(function (r) {
      var x = l.filter(function (g) { return g.region === r; });
      if (!x.length) return;
      blocs.push(el('section', { class: 'geo-region' }, [el('h4', { class: 'geo-titre' }, REGIONS[r]), el('ul', { class: 'list' }, x.map(item))]));
    });
    return el('div', { class: 'geo-grille' }, blocs);
  }
  App.geo = {
    module: function () {
      var j = jours()[0];
      var l = j ? duJour(j) : [];
      var note = j ? (j === u.aujourdhui() ? 'Ce matin' : 'Sélection du ' + u.date(j)) : '';
      var contenu = l.length ? parRegion(l) : ui.vide('Pas encore de sélection. Elle est préparée chaque matin vers 6 h à partir des flux de l\'onglet Sources.');
      return el('article', { class: 'card module large', id: 'mod-geopolitique' }, [
        el('div', { class: 'card-head' }, [el('h3', null, 'Géopolitique du jour'), el('span', { class: 'small muted' }, [note, note ? ' · ' : '', el('a', { href: '#/geopolitique' }, 'Jours précédents')])]),
        contenu
      ]);
    }
  };

  App.pages.geopolitique = {
    titre: 'Géopolitique', icone: 'monde',
    rendre: function (c, p) {
      var liste = jours();
      var choix = p.jour && liste.indexOf(p.jour) !== -1 ? p.jour : liste[0];
      var zone = el('div', { id: 'geo-jour' });
      var dessiner = function () {
        var l = choix ? duJour(choix) : [];
        var ecoute = S().get('Articles').filter(function (a) { return a.canal === 'audio_video' && a.theme === 'geopolitique' && a.statut !== 'ecarte' && u.fraicheur(a).jours <= 7; })
          .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).slice(0, 8);
        zone.replaceChildren(l.length ? parRegion(l) : ui.vide('Aucune sélection enregistrée.'),
          ecoute.length ? el('section', { class: 'geo-ecoute' }, [el('h4', { class: 'geo-titre' }, 'À écouter, à voir cette semaine'),
            el('ul', { class: 'list' }, ecoute.map(function (a) { return el('li', { class: 'item geo-item' }, [u.lien(a.titre, a.url, 'item-title'), el('div', { class: 'meta' }, [el('span', null, a.source), el('span', null, u.date(a.date))])]); }))]) : '');
      };
      var sel = liste.length ? ui.select(liste.map(function (d) { return [d, u.date(d)]; }), choix, function (v) { choix = v; history.replaceState(null, '', '#/geopolitique?jour=' + v); dessiner(); }, { 'aria-label': 'Jour', id: 'geo-choix-jour' }) : null;
      var collecter = !App.api.demo ? el('button', { class: 'btn', type: 'button', onclick: function (e) {
        var b = e.currentTarget; b.disabled = true;
        ui.toast('Sélection en cours…');
        App.api.appel('collecterGeopolitique').then(function (r) {
          ui.toast(u.pluriel(r.retenus || 0, 'titre') + ' retenu' + ((r.retenus || 0) > 1 ? 's' : '') + ' sur ' + u.pluriel(r.lus || 0, 'article') + ' lu' + ((r.lus || 0) > 1 ? 's' : '') + '.');
          return S().synchroniser(true);
        }).catch(ui.erreur).then(function () { b.disabled = false; });
      } }, [u.icone('collecte'), 'Refaire la sélection du jour']) : null;
      u.append(c, [
        el('div', { class: 'page-head' }, [
          el('div', null, [el('h1', null, 'Géopolitique du jour'),
            el('p', null, 'Chaque matin, une douzaine de titres de presse de référence, classés par région. Les sujets repris par plusieurs médias passent en tête. Sélection automatique sans IA : ouvrir l\'article avant de citer.')]),
          el('div', { class: 'actions' }, [sel, collecter])
        ]),
        zone
      ]);
      dessiner();
      return { redessiner: dessiner };
    }
  };

  App.pagesOrdre.splice(App.pagesOrdre.indexOf('fil') + 1, 0, 'geopolitique');
})();
