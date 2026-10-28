window.App = window.App || {};
(function () {
  var u = App.u, el = u.el;
  var ui = {};

  /* ---------- Toasts avec Annuler ---------- */
  ui.toast = function (msg, opts) {
    opts = opts || {};
    var box = u.$('#toasts');
    var t = el('div', { class: 'toast' + (opts.erreur ? ' toast-err' : ''), role: 'status' }, [el('span', { class: 'grow' }, msg)]);
    if (opts.annuler) t.appendChild(el('button', { type: 'button', onclick: function () { t.remove(); opts.annuler(); } }, 'Annuler'));
    box.appendChild(t);
    setTimeout(function () { t.remove(); }, opts.duree || (opts.annuler ? 8000 : 4000));
  };
  ui.erreur = function (e) { ui.toast(e && e.message ? e.message : String(e), { erreur: true, duree: 6000 }); };

  /** Enregistre avec retour « Annuler ». */
  ui.enregistrer = function (table, ligne, message) {
    return App.store.enregistrer(table, ligne).then(function (r) {
      ui.toast(message || 'Enregistré.', {
        annuler: function () {
          var k = App.SCHEMA.tables[table].key;
          (r.avant ? App.store.enregistrer(table, r.avant) : App.store.supprimer(table, r.ligne[k]))
            .then(function () { ui.toast('Modification annulée.'); }, ui.erreur);
        }
      });
      return r;
    }, function (e) { ui.erreur(e); throw e; });
  };
  ui.supprimer = function (table, id, libelle) {
    return App.store.supprimer(table, id).then(function (r) {
      ui.toast((libelle || 'Élément') + ' supprimé.', {
        annuler: function () { if (r.avant) App.store.enregistrer(table, r.avant).then(function () { ui.toast('Suppression annulée.'); }, ui.erreur); }
      });
    }, ui.erreur);
  };

  /* ---------- Fenêtres ---------- */
  var pile = [];
  ui.fenetre = function (titre, contenu, pied) {
    var precedent = document.activeElement;
    var fermer = function () { ov.remove(); pile.pop(); if (precedent && precedent.focus) precedent.focus(); };
    var modal = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': titre }, [
      el('div', { class: 'modal-head' }, [el('h2', null, titre), el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fermer', onclick: function () { fermer(); } }, u.icone('fermer'))]),
      contenu, pied ? el('div', { class: 'modal-foot' }, pied) : null
    ]);
    var ov = el('div', { class: 'overlay', onclick: function (e) { if (e.target === ov) fermer(); } }, modal);
    document.body.appendChild(ov);
    pile.push(fermer);
    var premier = modal.querySelector('input, select, textarea, button.btn');
    if (premier) setTimeout(function () { premier.focus(); }, 20);
    return { fermer: fermer, modal: modal };
  };
  ui.fermerDerniere = function () { if (pile.length) { pile[pile.length - 1](); return true; } return false; };

  ui.confirmer = function (titre, texte, libelleOk) {
    return new Promise(function (ok) {
      var f;
      var oui = el('button', { class: 'btn btn-primary', type: 'button', onclick: function () { f.fermer(); ok(true); } }, libelleOk || 'Confirmer');
      var non = el('button', { class: 'btn', type: 'button', onclick: function () { f.fermer(); ok(false); } }, 'Annuler');
      f = ui.fenetre(titre, el('p', null, texte), [non, oui]);
    });
  };

  /* ---------- Formulaire généré depuis le schéma ---------- */
  ui.champ = function (f, valeur, table) {
    var id = 'f-' + f.name;
    var input;
    if (f.type === 'enum') {
      input = el('select', { class: 'input', id: id, name: f.name });
      if (!f.required) input.appendChild(new Option('', ''));
      Object.keys(f.options).forEach(function (k) { input.appendChild(new Option(f.options[k], k)); });
      input.value = valeur || '';
    } else if (f.type === 'ref') {
      input = el('select', { class: 'input', id: id, name: f.name });
      input.appendChild(new Option('Aucun', ''));
      App.store.get(f.table).forEach(function (r) { input.appendChild(new Option(r.titre || r.nom || r.id, r.id)); });
      input.value = valeur || '';
    } else if (f.type === 'longtext') {
      input = el('textarea', { class: 'input', id: id, name: f.name });
      input.value = valeur || '';
    } else {
      input = el('input', { class: 'input', id: id, name: f.name, type: f.type === 'date' ? 'date' : (f.type === 'url' ? 'url' : (f.type === 'number' ? 'text' : 'text')), inputmode: f.type === 'number' ? 'decimal' : null });
      input.value = valeur || '';
    }
    if (f.required) input.required = true;
    if (f.readonly) input.disabled = true;
    return el('div', { class: 'field' + (f.type === 'longtext' || f.name === 'titre' ? ' full' : '') }, [el('label', { for: id }, f.label + (f.required ? ' *' : '')), input]);
  };

  /** Ouvre le formulaire d'une table. ligne vide : création avec valeurs par défaut. */
  ui.formulaire = function (table, ligne, opts) {
    opts = opts || {};
    var def = App.SCHEMA.tables[table];
    var nouveau = !ligne || !ligne[def.key];
    var base = ligne ? u.copie(ligne) : {};
    def.fields.forEach(function (f) {
      if (nouveau && (base[f.name] === undefined || base[f.name] === '') && f.default) base[f.name] = f.default === 'today' ? u.aujourdhui() : f.default;
    });
    var champs = def.fields.filter(function (f) { return f.type !== 'id' && !f.hidden && !(opts.masquer || []).includes(f.name); });
    var form = el('form', { class: 'form-grid', novalidate: true }, champs.map(function (f) { return ui.champ(f, base[f.name], table); }));
    var f;
    var valider = function (e) {
      if (e) e.preventDefault();
      var l = u.copie(base);
      champs.forEach(function (c) { if (!c.readonly) l[c.name] = form.elements[c.name].value.trim(); });
      var manque = champs.find(function (c) { return c.required && !l[c.name]; });
      if (manque) { ui.toast('Champ obligatoire : ' + manque.label, { erreur: true }); form.elements[manque.name].focus(); return; }
      if (opts.avant) {
        try { opts.avant(l); } catch (err) { ui.erreur(err); return; }
      }
      ui.enregistrer(table, l, nouveau ? 'Ajouté.' : 'Modifié.').then(function (r) { f.fermer(); if (opts.apres) opts.apres(r.ligne); }, function () {});
    };
    form.addEventListener('submit', valider);
    var pied = [];
    if (!nouveau && opts.supprimable !== false) pied.push(el('button', { class: 'btn btn-danger', type: 'button', style: 'margin-right:auto', onclick: function () { f.fermer(); ui.supprimer(table, base[def.key], 'Élément'); } }, 'Supprimer'));
    pied.push(el('button', { class: 'btn', type: 'button', onclick: function () { f.fermer(); } }, 'Annuler'));
    pied.push(el('button', { class: 'btn btn-primary', type: 'button', onclick: valider }, nouveau ? 'Ajouter' : 'Enregistrer'));
    form.appendChild(el('button', { type: 'submit', hidden: true }));
    var NOMS = { Utilisateurs: 'une personne', Alertes: 'une alerte', Textes: 'un texte officiel', Suivis: 'un suivi', Articles: 'un article', Cas: 'un cas', Evenements: 'un événement', Publications: 'une publication', Sources: 'une source', MotsCles: 'un mot-clé', Implantations: 'une unité', Parametres: 'un paramètre', Situation: 'un point de situation', Risques: 'un risque', Chiffres: 'un chiffre' };
    f = ui.fenetre(opts.titre || (nouveau ? 'Ajouter ' : 'Modifier ') + (NOMS[table] || def.label.toLowerCase()), form, pied);
    return f;
  };

  /* ---------- Petits composants ---------- */
  ui.pill = function (texte, cls) { return el('span', { class: 'pill ' + (cls || '') }, texte); };
  ui.vide = function (texte) { return el('p', { class: 'empty' }, texte); };
  ui.opt = function (table, champ, v) {
    var f = App.SCHEMA.tables[table].fields.find(function (x) { return x.name === champ; });
    return f && f.options && f.options[v] || v || '';
  };
  ui.select = function (options, valeur, onchange, attrs) {
    var s = el('select', Object.assign({ class: 'input input-sm' }, attrs || {}));
    options.forEach(function (o) { s.appendChild(new Option(o[1], o[0])); });
    s.value = valeur || '';
    s.addEventListener('change', function () { onchange(s.value); });
    return s;
  };

  /* ---------- Exports ---------- */
  ui.exporterCsv = function (nom, lignes, colonnes) {
    var esc = function (v) { v = String(v == null ? '' : v); if (/^[=+@-]/.test(v)) v = '\'' + v; return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var txt = '﻿' + colonnes.map(function (c) { return esc(c.label); }).join(';') + '\n' +
      lignes.map(function (l) { return colonnes.map(function (c) { return esc(l[c.name]); }).join(';'); }).join('\n');
    telecharger(new Blob([txt], { type: 'text/csv;charset=utf-8' }), nom + '.csv');
  };
  ui.exporterXlsx = function (nom, lignes, colonnes) {
    chargerScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js').then(function () {
      var data = [colonnes.map(function (c) { return c.label; })].concat(lignes.map(function (l) { return colonnes.map(function (c) { return l[c.name] == null ? '' : String(l[c.name]); }); }));
      var ws = XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = colonnes.map(function (c) { return { wch: c.name === 'resume' || c.name === 'titre' ? 60 : 16 }; });
      var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, nom.slice(0, 30));
      XLSX.writeFile(wb, nom + '.xlsx');
    }, function () { ui.toast('Bibliothèque Excel indisponible : export CSV à la place.'); ui.exporterCsv(nom, lignes, colonnes); });
  };
  function telecharger(blob, nom) {
    var a = el('a', { href: URL.createObjectURL(blob), download: nom });
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  var scripts = {};
  function chargerScript(src) {
    if (scripts[src]) return scripts[src];
    scripts[src] = new Promise(function (ok, ko) { var s = el('script', { src: src, async: true }); s.onload = ok; s.onerror = function () { scripts[src] = null; ko(); }; document.head.appendChild(s); });
    return scripts[src];
  }
  ui.chargerScript = chargerScript;

  App.ui = ui;
})();
