window.App = window.App || {};
(function () {
  var u = App.u;
  var api = { session: u.lire('session', null), demo: !App.CONFIG.API_URL };

  function ErreurApi(code, message) { var e = new Error(message); e.code = code; return e; }

  /** Appel au backend : POST text/plain (pas de pré-vol CORS). */
  api.appel = function (action, data) {
    if (api.demo) return demo(action, data || {});
    if (!navigator.onLine) return Promise.reject(ErreurApi('horsligne', 'Pas de connexion réseau.'));
    var corps = JSON.stringify({ action: action, data: data || {}, session: api.session });
    return fetch(App.CONFIG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: corps, redirect: 'follow' })
      .then(function (r) { if (!r.ok) throw ErreurApi('reseau', 'Erreur réseau (' + r.status + ').'); return r.json(); }, function () { throw ErreurApi('reseau', 'Serveur injoignable.'); })
      .then(function (rep) {
        if (rep.success) return rep.data;
        if (rep.error && rep.error.code === 'session') { api.session = null; u.ecrire('session', null); document.dispatchEvent(new CustomEvent('app:session')); }
        throw ErreurApi(rep.error ? rep.error.code : 'serveur', rep.error ? rep.error.message : 'Erreur inconnue.');
      });
  };

  api.connecter = function (credential) {
    return api.appel('login', { credential: credential }).then(function (d) {
      api.session = d.session; u.ecrire('session', d.session); u.ecrire('utilisateur', { email: d.email, nom: d.nom, role: d.role });
      return d;
    });
  };
  api.connecterCode = function (email, code) {
    return api.appel('verifierCode', { email: email, code: code }).then(function (d) {
      api.session = d.session; u.ecrire('session', d.session); u.ecrire('utilisateur', { email: d.email, nom: d.nom, role: d.role });
      return d;
    });
  };
  api.deconnecter = function () {
    var s = api.session;
    // Construire la requête avec la session encore présente pour révoquer le jeton côté serveur.
    if (!api.demo && s && navigator.onLine) api.appel('logout', { session: s }).catch(function () {});
    api.session = null; u.ecrire('session', null);
  };

  /* ---------- Mode démonstration : mêmes actions que le serveur, en mémoire ---------- */
  var D = null, journal = [], rev = 1;
  function base() {
    if (!D) {
      D = u.copie(App.DEMO);
      Object.keys(App.SCHEMA.tables).forEach(function (t) { D[t] = D[t] || []; });
    }
    return D;
  }
  function cle(t) { return App.SCHEMA.tables[t].key; }
  function journaliser(action, t, k, avant, apres) {
    journal.push({ id: Math.random().toString(36).slice(2, 10), quand: new Date().toLocaleString('fr-FR'), qui: 'démonstration', action: action, table: t, cle: k, avant: avant ? JSON.stringify(avant) : '', apres: apres ? JSON.stringify(apres) : '' });
  }
  function ecrire(t, ligne, action) {
    var def = App.SCHEMA.tables[t], k = cle(t), lignes = base()[t];
    if (t === 'Signalements' && ligne.statut === 'confirme' && !u.safeUrl(ligne.preuve)) throw ErreurApi('champ', 'Un lien de corroboration est nécessaire pour confirmer ce signalement.');
    if (def.fields[0].type === 'id' && !ligne[k]) ligne[k] = u.uid(def.prefix);
    def.fields.forEach(function (f) {
      var v = ligne[f.name] == null ? '' : String(ligne[f.name]);
      if (f.required && f.type !== 'id' && !v.trim()) throw ErreurApi('champ', 'Champ obligatoire : ' + f.label);
      if (f.type === 'url' && v && !/^https?:\/\//i.test(v)) throw ErreurApi('champ', 'Adresse invalide pour ' + f.label);
      ligne[f.name] = v;
    });
    var i = lignes.findIndex(function (r) { return r[k] === ligne[k]; });
    var avant = i >= 0 ? u.copie(lignes[i]) : null;
    if (i >= 0) lignes[i] = ligne; else lignes.push(ligne);
    journaliser(action || (avant ? 'modification' : 'ajout'), t, ligne[k], avant, ligne);
    return avant;
  }
  function supprimer(t, id, action) {
    var k = cle(t), lignes = base()[t];
    var i = lignes.findIndex(function (r) { return r[k] === id; });
    if (i < 0) throw ErreurApi('introuvable', 'Ligne introuvable.');
    var avant = lignes.splice(i, 1)[0];
    journaliser(action || 'suppression', t, id, avant, null);
    return avant;
  }
  function demo(action, d) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        try {
          var r;
          switch (action) {
            case 'revision': r = { revision: rev }; break;
            case 'charger': r = { revision: rev, tables: u.copie(base()) }; break;
            case 'enregistrer': { var l = u.copie(d.ligne); var av = ecrire(d.table, l); r = { ligne: l, avant: av, revision: ++rev }; break; }
            case 'supprimer': r = { avant: supprimer(d.table, d.id), revision: ++rev }; break;
            case 'historique': r = { entrees: journal.slice().reverse() }; break;
            case 'restaurer': {
              var e = journal.find(function (x) { return x.id === d.journalId; });
              if (!e) throw ErreurApi('introuvable', 'Entrée introuvable.');
              if (e.avant) ecrire(e.table, JSON.parse(e.avant), 'restauration'); else supprimer(e.table, e.cle, 'restauration');
              r = { revision: ++rev }; break;
            }
            case 'collecter': r = { ajoutes: 0, forts: 0, message: 'Mode démonstration : la collecte réelle tourne sur le serveur Apps Script.' }; break;
            case 'testerSource': r = { statut: 'Mode démonstration : test indisponible.' }; break;
            case 'verifierPages': r = { message: 'Démonstration : aucune page consultée et aucun courriel envoyé. La vérification réelle sera effectuée par Apps Script après déploiement.' }; break;
            case 'collecterTextes': r = { ajoutes: 0, message: 'Mode démonstration : la collecte du Journal officiel tourne sur le serveur Apps Script.' }; break;
            case 'testerLegifrance': r = { statut: 'Mode démonstration : le test Légifrance se fait une fois les clés PISTE renseignées.' }; break;
            case 'collecterFacebook': r = { message: 'Mode démonstration : la collecte Facebook demande le jeton de la page DMD.' }; break;
            case 'testerAlerte': r = { message: 'Mode démonstration : l\'essai est envoyé par le serveur Apps Script une fois le site déployé.' }; break;
            case 'importerDelinquance': case 'importerCatNat': case 'importerAccidents': r = { message: 'Mode démonstration : l\'import des données officielles se fait par le serveur Apps Script une fois le site déployé.' }; break;
            case 'archiverMaintenant': r = { message: 'Mode démonstration : l\'archivage sur la Wayback Machine se fait par le serveur.' }; break;
            case 'inviter': r = { message: 'Mode démonstration : l\'invitation part du serveur une fois le site déployé.' }; break;
            case 'etatConnexions': r = { legifrance: false, facebook: false }; break;
            default: throw ErreurApi('action', 'Action inconnue.');
          }
          resolve(r);
        } catch (err) { reject(err); }
      }, 60);
    });
  }

  App.api = api;
})();
