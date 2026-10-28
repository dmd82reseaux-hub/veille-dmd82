/* Configuration. API_URL vide : mode démonstration (données en mémoire, aucune connexion). */
window.App = window.App || {};
App.CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbwxWUfDitc9yX8-CAwJq0Fu7D91O5xSpJ6tUviBSib_yukGYSkb3LUsXO21Qoxe7Rc9Ag/exec',          // URL /exec du déploiement Apps Script
  CLIENT_ID: '',        // ID client OAuth Google (type Application Web)
  INACTIVITE_MIN: 30,   // déconnexion après 30 minutes sans activité
  POLL_SECONDES: 60     // vérification de la révision serveur
};
