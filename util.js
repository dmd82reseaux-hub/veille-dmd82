window.App = window.App || {};
(function () {
  var MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  var u = {};

  /** Crée un élément : u.el('div', {class: 'x', onclick: fn}, [enfants ou texte]) */
  u.el = function (tag, attrs, enfants) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v; // réservé aux icônes internes
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.keys(v).forEach(function (d) { e.dataset[d] = v[d]; });
      else e.setAttribute(k, v === true ? '' : v);
    });
    u.append(e, enfants);
    return e;
  };
  u.append = function (e, enfants) {
    if (enfants === null || enfants === undefined) return e;
    (Array.isArray(enfants) ? enfants : [enfants]).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return e;
  };
  u.$ = function (s, r) { return (r || document).querySelector(s); };
  u.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  u.safeUrl = function (url) { return typeof url === 'string' && /^https?:\/\//i.test(url) ? url : ''; };
  u.lien = function (texte, url, cls) {
    var h = u.safeUrl(url);
    if (!h) return u.el('span', { class: cls }, texte);
    return u.el('a', { class: cls, href: h, target: '_blank', rel: 'noopener noreferrer' }, texte);
  };

  u.aujourdhui = function () {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  u.dateDecalee = function (jours) {
    var d = new Date(Date.now() + jours * 86400000);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  /** 2026-10-24 → 24 oct. 2026 ; 1930-03 → mars 1930 ; 1952 → 1952 */
  u.date = function (d) {
    var s = String(d || '');
    if (/^\d{4}$/.test(s)) return s;
    if (/^\d{4}-\d{2}$/.test(s)) return MOIS[Number(s.slice(5, 7)) - 1] + ' ' + s.slice(0, 4);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return Number(s.slice(8, 10)) + ' ' + MOIS[Number(s.slice(5, 7)) - 1] + ' ' + s.slice(0, 4);
    return s;
  };
  u.dateCourte = function (d) {
    var s = String(d || '');
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(2, 4);
    return u.date(s);
  };
  u.nombre = function (n) { return Number(n || 0).toLocaleString('fr-FR'); };
  u.normaliser = function (s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  };
  u.debounce = function (fn, ms) {
    var t; return function () { var a = arguments, self = this; clearTimeout(t); t = setTimeout(function () { fn.apply(self, a); }, ms); };
  };
  u.uid = function (prefix) {
    var d = u.aujourdhui().replace(/-/g, '');
    return (prefix || 'x') + '-' + d + '-' + Math.random().toString(36).slice(2, 8);
  };
  u.copie = function (o) { return JSON.parse(JSON.stringify(o)); };
  u.pluriel = function (n, s, p) { return n + ' ' + (n > 1 ? (p || s + 's') : s); };

  /** Groupe date-heure militaire à partir d'une date locale (heure de Paris). */
  u.groupeDateHeure = function (d) {
    var mois = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    var parts = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', hour: '2-digit', minute: '2-digit', month: 'numeric', year: '2-digit', hour12: false, timeZoneName: 'shortOffset' }).formatToParts(d);
    var p = {}; parts.forEach(function (x) { p[x.type] = x.value; });
    var lettre = /\+2/.test(p.timeZoneName || '') ? 'B' : (/\+1/.test(p.timeZoneName || '') ? 'A' : 'Z');
    return p.day + p.hour + p.minute + lettre + ' ' + mois[Number(p.month) - 1] + ' ' + p.year;
  };

  /** Icônes (traits simples, 24 x 24). */
  var P = {
    synthese: '<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z"/>',
    fil: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    cas: '<path d="M4 7h16v12H4zM9 7V5h6v2"/>',
    reseaux: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 11l7.6-4M8.2 13l7.6 4"/>',
    risques: '<path d="M12 4l9 16H3zM12 10v4M12 17v.5"/>',
    historique: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    defense: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/>',
    sources: '<path d="M4 5h11l5 5v9H4zM14 5v5h6"/>',
    journal: '<path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    recherche: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
    plusmenu: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    editer: '<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>',
    suppr: '<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>',
    export: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    collecte: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4"/>',
    theme: '<path d="M12 4a8 8 0 1 0 8 8 6 6 0 0 1-8-8z"/>',
    sortie: '<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>',
    aide: '<circle cx="12" cy="12" r="8"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 1-1 1.7M12 16.5v.5"/>',
    fermer: '<path d="M6 6l12 12M18 6L6 18"/>',
    oeil: '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>',
    imprimer: '<path d="M7 9V4h10v5M7 17H5v-6h14v6h-2M8 14h8v6H8z"/>',
    cloche: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>',
    radar: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 12l6-6"/>',
    monde: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
    casque: '<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="2.5" y="13" width="4" height="7" rx="1.3"/><rect x="17.5" y="13" width="4" height="7" rx="1.3"/>'
  };
  u.icone = function (nom, couleur) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', couleur || 'currentColor');
    s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = P[nom] || '';
    return s;
  };

  /** Liens vers les copies archivées d'une page : Wayback (copie faite par le site) et archive.today. */
  u.archives = function (url, archive) {
    if (!u.safeUrl(url)) return null;
    return u.el('span', { class: 'archives' }, [
      archive ? u.lien('Copie archivée', archive) : u.lien('Wayback', 'https://web.archive.org/web/*/' + url),
      ' · ', u.lien('archive.today', 'https://archive.ph/newest/' + url)
    ]);
  };

  /* ---------- Fraîcheur : récent, nouveau depuis la dernière visite, ancien ---------- */
  function horodatage(r) {
    var s = String((r && (r.ajoute_le || r.date)) || '');
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) return new Date(s.replace(' ', 'T')).getTime();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s.slice(0, 10) + 'T12:00').getTime();
    return NaN;
  }
  /** Âge de la publication (date), et « nouveau » si ajouté depuis la visite précédente. */
  u.fraicheur = function (r) {
    var pub = /^\d{4}-\d{2}-\d{2}/.test(String(r.date || '')) ? new Date(String(r.date).slice(0, 10) + 'T12:00').getTime() : NaN;
    var jours = isNaN(pub) ? 9999 : Math.floor((Date.now() - pub) / 86400000);
    var ajout = horodatage(r);
    var visite = App.visitePrecedente || 0;
    var nouveau = !!visite && !isNaN(ajout) && ajout > visite && r.statut !== 'ecarte';
    var texte = isNaN(pub) ? u.date(r.date) : jours <= 0 ? 'aujourd\'hui' : jours === 1 ? 'hier' : jours < 7 ? 'il y a ' + jours + ' jours' : jours < 31 ? 'il y a ' + Math.round(jours / 7) + ' sem.' : jours < 365 ? 'il y a ' + Math.round(jours / 30.4) + ' mois' : u.date(r.date);
    var periode = jours <= 0 ? 'Aujourd\'hui' : jours === 1 ? 'Hier' : jours < 7 ? 'Cette semaine' : jours < 31 ? 'Ce mois-ci' : jours < 92 ? 'Ces trois derniers mois' : 'Plus ancien';
    return { jours: jours, texte: texte, recent: jours <= 2, ancien: jours > 30, nouveau: nouveau, periode: periode };
  };
  /** Étiquettes d'âge à placer dans une ligne de métadonnées. */
  u.etiquettesAge = function (r) {
    var f = u.fraicheur(r);
    return [f.nouveau ? u.el('span', { class: 'flag-new', title: 'Ajouté depuis ta dernière visite' }, 'Nouveau') : null,
      u.el('span', { class: 'age' + (f.recent ? ' age-recent' : ''), title: u.date(r.date) }, f.texte)];
  };
  u.image = function (src, cls, alt) {
    if (!u.safeUrl(src)) return null;
    var i = u.el('img', { src: src, class: cls, alt: alt || '', loading: 'lazy', referrerpolicy: 'no-referrer' });
    i.addEventListener('error', function () { i.remove(); });
    return i;
  };

  /* Stockage local tolérant aux erreurs */
  u.lire = function (k, def) { try { var v = localStorage.getItem('vdmd82.' + k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } };
  u.ecrire = function (k, v) { try { localStorage.setItem('vdmd82.' + k, JSON.stringify(v)); } catch (e) { /* ignoré */ } };

  App.u = u;
})();
