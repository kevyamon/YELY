// src/utils/errorHelper.js
// RESOLVEUR UNIVERSEL D'ERREURS API & RESEAU
// STANDARD: Industriel / Bank Grade (Sans Emojis)

/**
 * Traduit et extrait le message d'erreur adapte selon la nature du probleme (Reseau, Timeout, Serveur 5xx, Metier 4xx)
 * @param {Object} err - Objet d'erreur RTK Query ou Fetch
 * @param {string} defaultBusinessMsg - Message de repli metier si le serveur repond sans payload d'erreur
 * @returns {string} - Message clair et sans ambiguite pour l'utilisateur
 */
export const getApiErrorMessage = (err, defaultBusinessMsg = "Une erreur est survenue.") => {
  if (!err) return defaultBusinessMsg;

  // 1. Erreurs de transport reseau et Timeout
  if (err.status === 'FETCH_ERROR') {
    return "Impossible de joindre le serveur. Verifiez votre connexion internet.";
  }

  if (err.status === 'TIMEOUT_ERROR') {
    return "Le serveur met trop de temps a repondre. Veuillez reessayer dans un instant.";
  }

  if (err.status === 'PARSING_ERROR') {
    return "Reponse inattendue du serveur. Veuillez reessayer plus tard.";
  }

  // 2. Erreurs d'infrastructure Serveur (5xx)
  const statusCode = err.status || err.originalStatus;

  if (statusCode === 503) {
    return "Service temporairement indisponible. Le serveur est en cours de maintenance ou de reveil.";
  }

  if (statusCode >= 500) {
    return "Un probleme technique est survenu sur nos serveurs. Veuillez reessayer dans quelques instants.";
  }

  // 3. Reponses metier structurees (4xx)
  if (err.data?.message) {
    return err.data.message;
  }

  if (err.data?.errors && Array.isArray(err.data.errors) && err.data.errors.length > 0) {
    return err.data.errors[0]?.message || err.data.errors[0]?.msg || defaultBusinessMsg;
  }

  if (err.message && typeof err.message === 'string' && !err.message.includes('[object Object]')) {
    return err.message;
  }

  return defaultBusinessMsg;
};

export default getApiErrorMessage;
