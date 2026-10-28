window.App = window.App || {};
(function () {
  var u = App.u, api = App.api;
  var store = { tables: {}, revision: 0, file: [], etat: 'init', ecouteurs: [] };

  /* ---------- IndexedDB : copie locale et file d'attente ---------- */
  var dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (ok, ko) {
      if (!window.indexedDB) return ko(new Error('IndexedDB indisponible'));
      var req = indexedDB.open('veille-dmd82', 1);
      req.onupgradeneeded = function () { req.result.createObjectStore('kv'); };
      req.onsuccess = function () { ok(req.result); };
      req.onerror = function () { ko(req.error); };
    });
    return dbp;
  }
  function idbGet(k) {
    return db().then(function (d) { return new Promise(function (ok) { var r = d.transaction('kv').objectStore('kv').get(k); r.onsuccess = function () { ok(r.result); }; r.onerror = function () { ok(undefined); }; }); }).catch(function () { return undefined; });
  }
  function idbSet(k, v) {
    return db().then(function (d) { return new Promise(function (ok) { var tx = d.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = ok; tx.onerror = ok; }); }).catch(function () {});
  }
  function sauverCache() { return idbSet('tables', { revision: store.revision, tables: store.tables }); }
  function sauverFile() { return idbSet('file', store.file); }

  store.on = function (fn) { store.ecouteurs.push(fn); };
  function notifier(raison) { store.ecouteurs.forEach(function (fn) { try { fn(raison); } catch (e) { console.error(e); } }); }
  function etat(e) { store.etat = e; document.dispatchEvent(new CustomEvent('app:etat', { detail: e })); }

  store.get = function (t) { return store.tables[t] || []; };
  store.trouver = function (t, id) { var k = App.SCHEMA.tables[t].key; return store.get(t).find(function (r) { return r[k] === id; }); };
  store.param = function (cle) { var r = store.get('Parametres').find(function (p) { return p.cle === cle; }); return r ? r.valeur : ''; };

  /** Démarrage : copie locale d'abord, puis comparaison avec la révision serveur. */
  store.demarrer = function () {
    return Promise.all([idbGet('tables'), idbGet('file')]).then(function (res) {
      var cache = res[0];
      store.file = res[1] || [];
      if (cache && cache.tables && !api.demo) { store.tables = cache.tables; store.revision = cache.revision; notifier('cache'); }
      return store.synchroniser(true);
    });
  };

  store.synchroniser = function (force) {
    if (!navigator.onLine && !api.demo) { etat('horsligne'); return Promise.resolve(); }
    return viderFile().then(function () { return api.appel('revision'); }).then(function (r) {
      if (!force && r.revision === store.revision) { etat('ok'); return; }
      if (force || r.revision !== store.revision) return api.appel('charger').then(function (d) {
        store.tables = d.tables; store.revision = d.revision;
        // réappliquer les écritures encore en attente
        store.file.forEach(appliquerLocal);
        sauverCache(); etat(store.file.length ? 'attente' : 'ok'); notifier('serveur');
      });
    }).catch(function (e) { etat(e.code === 'horsligne' || e.code === 'reseau' ? 'horsligne' : 'erreur'); if (e.code !== 'session') throw e; });
  };

  function appliquerLocal(op) {
    var t = op.table, k = App.SCHEMA.tables[t].key, l = store.tables[t] = store.tables[t] || [];
    var i = l.findIndex(function (r) { return r[k] === (op.ligne ? op.ligne[k] : op.id); });
    if (op.type === 'enregistrer') { if (i >= 0) l[i] = op.ligne; else l.push(op.ligne); }
    else if (op.type === 'supprimer' && i >= 0) l.splice(i, 1);
  }

  /** Enregistre une ligne (ajout ou modification). Retourne {ligne, avant}. */
  store.enregistrer = function (table, ligne) {
    var def = App.SCHEMA.tables[table], k = def.key;
    ligne = u.copie(ligne);
    if (def.fields[0].type === 'id' && !ligne[k]) ligne[k] = u.uid(def.prefix);
    var avant = store.trouver(table, ligne[k]);
    avant = avant ? u.copie(avant) : null;
    var op = { type: 'enregistrer', table: table, ligne: ligne };
    appliquerLocal(op); notifier('local');
    return envoyer(op).then(function (r) {
      if (r && r.ligne) { appliquerLocal({ type: 'enregistrer', table: table, ligne: r.ligne }); notifier('local'); }
      return { ligne: (r && r.ligne) || ligne, avant: avant };
    }, function (e) {
      // revenir en arrière si le serveur refuse la ligne
      if (avant) appliquerLocal({ type: 'enregistrer', table: table, ligne: avant }); else appliquerLocal({ type: 'supprimer', table: table, id: ligne[k] });
      notifier('local'); throw e;
    });
  };

  store.supprimer = function (table, id) {
    var avant = store.trouver(table, id);
    avant = avant ? u.copie(avant) : null;
    var op = { type: 'supprimer', table: table, id: id };
    appliquerLocal(op); notifier('local');
    return envoyer(op).then(function () { return { avant: avant }; }, function (e) {
      if (avant) appliquerLocal({ type: 'enregistrer', table: table, ligne: avant }); notifier('local'); throw e;
    });
  };

  function envoyer(op) {
    var data = op.type === 'enregistrer' ? { table: op.table, ligne: op.ligne } : { table: op.table, id: op.id };
    return api.appel(op.type, data).then(function (r) {
      if (r && r.revision) store.revision = r.revision;
      sauverCache(); etat('ok');
      return r;
    }, function (e) {
      if (e.code === 'horsligne' || e.code === 'reseau') {
        store.file.push(op); sauverFile(); sauverCache(); etat('attente');
        return null; // gardé localement, envoyé au retour du réseau
      }
      throw e;
    });
  }

  var vidage = null;
  function viderFile() {
    if (!store.file.length || api.demo) return Promise.resolve();
    if (vidage) return vidage;
    vidage = (function suivant() {
      if (!store.file.length) return Promise.resolve();
      var op = store.file[0];
      var data = op.type === 'enregistrer' ? { table: op.table, ligne: op.ligne } : { table: op.table, id: op.id };
      return api.appel(op.type, data).then(function (r) {
        store.file.shift(); if (r && r.revision) store.revision = r.revision; sauverFile();
        return suivant();
      }, function (e) {
        if (e.code === 'horsligne' || e.code === 'reseau' || e.code === 'session') throw e;
        store.file.shift(); sauverFile(); // ligne refusée par le serveur : abandonnée
        App.ui && App.ui.toast('Une modification hors connexion a été refusée : ' + e.message, { erreur: true });
        return suivant();
      });
    })().then(function () { vidage = null; etat('ok'); }, function (e) { vidage = null; throw e; });
    return vidage;
  }
  store.viderFile = viderFile;

  window.addEventListener('online', function () { store.synchroniser(false).catch(function () {}); });
  window.addEventListener('offline', function () { etat('horsligne'); });

  App.store = store;
})();
