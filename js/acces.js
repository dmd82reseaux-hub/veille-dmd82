window.App = window.App || {};
/* Gestion des accès : qui peut se connecter, avec quel rôle. Réservé aux administrateurs. */
(function () {
  var u = App.u, el = u.el, ui = App.ui, S = function () { return App.store; };
  var ROLES = { admin: 'Administrateur', contributeur: 'Contributeur', lecteur: 'Lecteur' };
  function bouton(texte, icone, onclick, cls, attrs) { return el('button', Object.assign({ class: 'btn ' + (cls || ''), type: 'button', onclick: onclick }, attrs || {}), [icone ? u.icone(icone) : null, texte]); }

  App.pages.utilisateurs = {
    titre: 'Accès et utilisateurs', icone: 'defense', admin: true,
    nouveau: function () { ui.formulaire('Utilisateurs', null, { titre: 'Ajouter une personne', masquer: ['derniere_connexion'] }); },
    rendre: function (c) {
      var l = S().get('Utilisateurs').slice().sort(function (a, b) { return (a.nom || a.email).localeCompare(b.nom || b.email, 'fr'); });
      u.append(c, [
        el('div', { class: 'page-head' }, [el('div', null, [el('h1', null, 'Accès et utilisateurs'),
          el('p', null, 'Seules les adresses de cette liste peuvent se connecter. Connexion simple : la personne saisit son adresse et reçoit un code à 6 chiffres par courriel (valable 10 minutes), ou se connecte avec son compte Google.')]),
          el('div', { class: 'actions' }, [bouton('Ajouter une personne', 'plus', App.pages.utilisateurs.nouveau, 'btn-primary', { id: 'btn-ajouter' })])]),
        el('div', { class: 'grid' }, [
          el('article', { class: 'card' }, [el('h3', null, 'Les trois rôles'), el('ul', { class: 'linked' }, [
            el('li', null, [el('b', null, 'Administrateur : '), 'tout, plus les accès et les paramètres.']),
            el('li', null, [el('b', null, 'Contributeur : '), 'consulte, qualifie les articles, ouvre des cas, règle ses alertes.']),
            el('li', null, [el('b', null, 'Lecteur : '), 'consulte seulement, sans rien modifier.'])])]),
          el('article', { class: 'card' }, [el('h3', null, 'Protections en place'), el('ul', { class: 'linked' }, [
            el('li', null, 'Code à usage unique, 5 essais au plus, 3 codes par quart d\'heure.'),
            el('li', null, 'Blocage après 10 échecs dans l\'heure.'),
            el('li', null, 'Session de 12 heures, coupée après 30 minutes sans activité.'),
            el('li', null, 'En plus, Cloudflare Access peut filtrer le site avant même cet écran (voir le guide).')])])
        ]),
        el('div', { class: 'tablebox' }, el('table', { class: 't', id: 'table-utilisateurs' }, [
          el('thead', null, el('tr', null, [el('th', null, 'Personne'), el('th', null, 'Rôle'), el('th', null, 'Accès'), el('th', { class: 'hide-narrow' }, 'Dernière connexion'), el('th', null, '')])),
          el('tbody', null, l.length ? l.map(function (p) {
            var maj = function (champ) { return function (v) { var x = Object.assign({}, p); x[champ] = v; ui.enregistrer('Utilisateurs', x, 'Accès mis à jour.'); }; };
            return el('tr', null, [
              el('td', null, [el('b', null, p.nom || p.email), p.nom ? el('div', { class: 'small muted' }, p.email) : null]),
              el('td', null, ui.select(Object.keys(ROLES).map(function (k) { return [k, ROLES[k]]; }), p.role, maj('role'), { 'aria-label': 'Rôle' })),
              el('td', null, ui.select([['oui', 'Autorisé'], ['non', 'Suspendu']], p.actif, maj('actif'), { 'aria-label': 'Accès' })),
              el('td', { class: 'hide-narrow num' }, p.derniere_connexion || 'Jamais'),
              el('td', null, el('div', { class: 'actions' }, [
                bouton('Inviter', null, function (e) { var b = e.currentTarget; b.disabled = true; App.api.appel('inviter', { email: p.email }).then(function (r) { ui.toast(r.message); }, ui.erreur).then(function () { b.disabled = false; }); }, 'btn-sm'),
                el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Modifier', onclick: function () { ui.formulaire('Utilisateurs', p, { masquer: ['derniere_connexion'] }); } }, u.icone('editer'))]))
            ]);
          }) : [el('tr', null, el('td', { colspan: '5' }, ui.vide('Aucune personne. Ajoute la première adresse.')))])
        ]))
      ]);
    }
  };
  App.pagesOrdre = App.pagesOrdre.filter(function (n) { return n !== 'utilisateurs'; }).concat([]);
  var i = App.pagesOrdre.indexOf('journal');
  App.pagesOrdre.splice(i < 0 ? App.pagesOrdre.length : i, 0, 'utilisateurs');
})();
