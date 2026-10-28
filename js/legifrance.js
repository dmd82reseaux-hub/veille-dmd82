/* Copie de src/legifrance-commun.js, générée par tools/gen.py. */
window.App = window.App || {};
/**
 * Analyse d'un courriel d'alerte ou de sommaire Légifrance (HTML ou texte) et tri des textes.
 * Code commun au serveur (Apps Script) et au site : ES5, sans dépendance.
 */
var LF = (function () {
  var RUBRIQUE = /^(Minist[eè]re|Premier ministre|Pr[ée]sident de la R[ée]publique|Secr[ée]tariat|Autorit[ée]s ind[ée]pendantes|Conseil constitutionnel|Conseil d'[ÉE]tat|Cour des comptes|D[ée]cisions|Mesures nominatives|Avis et communications|Conventions collectives|Annonces|Textes g[ée]n[ée]raux)/i;
  var NATURE = /^(Loi organique|Loi|Ordonnance|D[ée]cret|Arr[êe]t[ée]|D[ée]cision|Avis|Circulaire|Instruction|D[ée]lib[ée]ration|Rapport|Rectificatif)(?=[\s,]|$)/i;
  var DEFENSE = /\barm[ée]es?\b|d[ée]fense|militaire|gendarmerie|int[ée]rieur|pr[ée]f[eè]te?\b|s[ée]curit[ée] (int[ée]rieure|civile)|r[ée]serv(e|iste)|anciens combattants|garde nationale|service national|vigipirate|ordre public|sapeurs?-pompiers|police nationale/i;

  function decoder(s) {
    return String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/&#(\d+);/g, function (m, n) { return String.fromCharCode(Number(n)); })
      .replace(/&#x([0-9a-f]+);/gi, function (m, n) { return String.fromCharCode(parseInt(n, 16)); })
      .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&apos;|&rsquo;|&lsquo;/g, '\'').replace(/&laquo;/g, '«').replace(/&raquo;/g, '»')
      .replace(/&eacute;/g, 'é').replace(/&egrave;/g, 'è').replace(/&ecirc;/g, 'ê').replace(/&agrave;/g, 'à').replace(/&acirc;/g, 'â')
      .replace(/&ccedil;/g, 'ç').replace(/&ocirc;/g, 'ô').replace(/&icirc;/g, 'î').replace(/&ucirc;/g, 'û').replace(/&Eacute;/g, 'É')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  }
  function texte(html) { return decoder(String(html || '').replace(/<(br|\/p|\/div|\/tr|\/li|\/h\d)[^>]*>/gi, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/\n\s*/g, '\n').trim(); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }

  /** Trouve l'identifiant JORFTEXT et une URL propre, même derrière une redirection de suivi. */
  function lien(url) {
    var u = decoder(url);
    try { for (var i = 0; i < 3 && /%2F|%3A/i.test(u); i++) u = decodeURIComponent(u); } catch (e) { /* adresse laissée telle quelle */ }
    var m = u.match(/(JORFTEXT\d{12})/);
    if (m) return { id: m[1], url: 'https://www.legifrance.gouv.fr/jorf/id/' + m[1] };
    var m2 = u.match(/https?:\/\/(www\.)?legifrance\.gouv\.fr\/[^\s"'<>&]*/);
    return { id: '', url: m2 ? m2[0] : (/^https?:\/\//.test(u) ? u : '') };
  }

  /** Extrait [{id, titre, url, ministere, nature, date}] d'un courriel HTML ou texte. */
  function analyser(contenu) {
    var html = String(contenu || '');
    var res = [], vus = {};
    var dateJo = (texte(html).match(/Journal officiel[^\n]{0,40}?(\d{1,2}(?:er)? \w+ \d{4})/i) || [])[1] || '';
    if (/<a\s/i.test(html)) {
      var re = /<a\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, m, dernier = 0, rubrique = '';
      while ((m = re.exec(html))) {
        var avant = texte(html.slice(dernier, m.index)).split('\n').map(function (l) { return l.trim(); }).filter(String);
        for (var k = avant.length - 1; k >= 0; k--) { if (RUBRIQUE.test(avant[k]) && avant[k].length < 160) { rubrique = avant[k]; break; } }
        dernier = re.lastIndex;
        var titre = texte(m[2]).replace(/\s+/g, ' ');
        var l = lien(m[1]);
        if (!l.url || titre.length < 20 || !/legifrance/i.test(l.url + m[1])) continue;
        if (RUBRIQUE.test(titre) && !NATURE.test(titre)) { rubrique = titre; continue; }
        if (!l.id && !NATURE.test(titre)) continue;
        var cle = l.id || norm(titre);
        if (vus[cle]) continue;
        vus[cle] = 1;
        res.push(fiche(l, titre, rubrique, dateJo));
      }
    }
    if (!res.length) {
      // texte brut (copié depuis Outlook) : un titre par ligne, avec ou sans lien
      var lignes = texte(html).split('\n'), rub = '';
      for (var i = 0; i < lignes.length; i++) {
        var t = lignes[i].trim();
        if (!t) continue;
        if (RUBRIQUE.test(t) && !NATURE.test(t)) { rub = t; continue; }
        if (!NATURE.test(t) || t.length < 25) continue;
        var url = (t.match(/https?:\/\/\S+/) || (lignes[i + 1] || '').match(/https?:\/\/\S+/) || [''])[0];
        var titre2 = t.replace(/https?:\/\/\S+/, '').replace(/[<>]/g, '').trim();
        var l2 = lien(url);
        var cle2 = l2.id || norm(titre2);
        if (vus[cle2]) continue;
        vus[cle2] = 1;
        res.push(fiche(l2, titre2, rub, dateJo));
      }
    }
    return res;
  }

  function fiche(l, titre, rubrique, dateJo) {
    var nat = (titre.match(NATURE) || [''])[0];
    return { id: l.id, titre: titre, url: l.url, ministere: rubrique, nature: nat ? nat.charAt(0).toUpperCase() + nat.slice(1).toLowerCase() : '', dateJo: dateJo };
  }

  function categorie(titre) {
    if (/nomination|nomm[ée]|cessation de fonctions|affectation|admission dans la (premi|deuxi)[eè]me section|promotion|tableau d'avancement/i.test(titre)) return 'nomination';
    if (/l[ée]gion d'honneur|ordre national du m[ée]rite|m[ée]daille|d[ée]coration|citation/i.test(titre)) return 'decoration';
    return 'texte_general';
  }

  /**
   * Note un texte. suivis : [{type, valeur, termes:[normalisés]}].
   * Retourne {garder, interet, suivis:[valeurs], categorie, raison}.
   */
  function noter(t, suivis) {
    var tout = ' ' + norm(t.titre + ' ' + (t.ministere || '')) + ' ';
    var trouves = [], ministere = false;
    (suivis || []).forEach(function (s) {
      var ok = (s.termes || []).some(function (m) { return tout.indexOf(' ' + m + ' ') !== -1; });
      if (!ok) return;
      if (s.type === 'ministere') ministere = true; else trouves.push(s.valeur);
    });
    var cat = categorie(t.titre);
    var defense = DEFENSE.test(t.titre + ' ' + (t.ministere || ''));
    var majeur = /^(Loi|Ordonnance|D[ée]cret)\b/i.test(t.titre) && cat === 'texte_general';
    var interet = trouves.length ? 3 : ((ministere || defense) && (majeur || cat === 'nomination') ? 2 : 1);
    var garder = trouves.length > 0 || ministere || defense;
    var raison = trouves.length ? 'cite ' + trouves.join(', ') : (ministere ? 'ministère suivi' : (defense ? 'défense ou sécurité' : 'hors périmètre'));
    return { garder: garder, interet: interet, suivis: trouves, categorie: cat, raison: raison };
  }

  function preparerSuivis(lignes) {
    return (lignes || []).filter(function (s) { return s.actif !== 'non' && s.perimetre !== 'presse'; }).map(function (s) {
      return { type: s.type, valeur: s.valeur, termes: [s.valeur].concat(String(s.variantes || '').split(';')).map(norm).filter(function (x) { return x.length >= 3; }) };
    });
  }

  return { analyser: analyser, noter: noter, categorie: categorie, preparerSuivis: preparerSuivis, lien: lien, norm: norm };
})();

App.LF = LF;
