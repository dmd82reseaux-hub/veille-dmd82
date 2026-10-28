window.App = window.App || {};
(function () {
  var u = App.u, el = u.el, ui = App.ui, store = App.store;
  var envois = { attente: 'En attente', en_cours: 'Envoi démarré, résultat à vérifier', envoye: 'Courriel envoyé', echec: 'Échec, nouvel essai au prochain contrôle' };
  App.pages.surveillance = {
    titre: 'Pages surveillées', icone: 'sources',
    rendre: function (c) {
      var cartes = el('div', { class: 'eco-grid' }), historique = el('div', { class: 'eco-grid' });
      var admin = App.role() === 'admin';
      function dessiner() {
        cartes.replaceChildren.apply(cartes, store.get('SurveillancePages').map(function (r) {
          var e = store.get('EtatsPages').find(function (x) { return x.id === r.id; }) || {};
          var b = el('button', { class: 'btn', type: 'button', onclick: function () {
            b.disabled = true; b.textContent = 'Vérification…';
            App.api.appel('verifierPages').then(function (resultat) { ui.toast(resultat.message, { duree: 10000 }); return store.synchroniser(true); }, ui.erreur)
              .finally(function () { b.disabled = false; b.textContent = 'Vérifier maintenant'; });
          } }, 'Vérifier maintenant');
          return el('article', { class: 'card eco-card' }, [
            el('div', { class: 'meta' }, [ui.pill(r.actif === 'oui' ? 'Chaque jour vers 8 h' : 'En pause'), ui.pill(e.statut === 'erreur' ? 'Vérification impossible' : (e.statut === 'ok' ? 'Lecture réussie' : 'Non vérifié'), e.statut === 'erreur' ? 'pill-3' : '')]),
            el('h2', null, r.nom), u.lien('Ouvrir la liste publique', r.url),
            el('p', null, e.detail || 'Le premier relevé réussi crée la référence, sans envoyer d’alerte.'),
            el('p', { class: 'small muted' }, 'Dernier contrôle : ' + (e.dernier_controle || 'jamais') + ' / Dernière réussite : ' + (e.dernier_succes || 'aucune')),
            el('p', { class: 'small muted' }, 'Destinataires : ' + (r.destinataires || 'À configurer après déploiement')),
            el('div', { class: 'actions' }, admin ? [b, el('button', { class: 'btn btn-primary', type: 'button', onclick: function () { ui.formulaire('SurveillancePages', r, { titre: 'Configurer les alertes BODMR', supprimable: false }); } }, 'Configurer')] : [])
          ]);
        }));
        var events = store.get('ChangementsPages').slice().sort(function (a, b) { return b.quand.localeCompare(a.quand); });
        historique.replaceChildren.apply(historique, events.length ? events.map(function (e) {
          return el('article', { class: 'card eco-card' }, [el('div', { class: 'meta' }, [ui.pill(envois[e.envoi] || e.envoi), e.quand]), el('h3', null, e.titre), el('p', { style: 'white-space:pre-line' }, e.details), u.lien('Consulter la liste BODMR', e.url), e.erreur ? el('p', { class: 'small muted' }, e.erreur) : null]);
        }) : [ui.vide('Aucun changement enregistré. Un défaut d’accès ne sera jamais présenté comme une absence de changement.')]);
      }
      u.append(c, [el('div', { class: 'page-head' }, el('div', null, [el('h1', null, 'Alertes de changement de page'), el('p', null, 'Un courriel lorsqu’un numéro BODMR apparaît, change de date ou disparaît de la liste récente.')])),
        el('aside', { class: 'eco-note' }, 'Contrôle direct de la liste publique, sans API. Les menus et la mise en page sont ignorés. Les PDF protégés ne sont pas téléchargés. Si Légifrance refuse l’accès automatique, la dernière référence est conservée et l’erreur apparaît ici.'),
        cartes, el('h2', null, 'Historique des changements'), historique]);
      dessiner(); return { redessiner: dessiner };
    }
  };
  App.pagesOrdre.splice(App.pagesOrdre.indexOf('alertes') + 1, 0, 'surveillance');
})();
