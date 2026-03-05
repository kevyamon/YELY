// src/utils/validators.js
// VALIDATIONS METIER CENTRALISEES - Humaines & Précises
// CSCSM Level: Bank Grade

export const VALIDATORS = {
  name: (name) => {
    const regex = /^[a-zA-Z\u00C0-\u00FF\s'-]{2,50}$/;
    return regex.test(name?.trim());
  },

  email: (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;
    
    const domain = email.split('@')[1];
    const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'yopmail.com'];
    return !disposableDomains.includes(domain);
  },

  phone: (phone) => {
    const phoneRegex = /^\+?[0-9\s]{8,15}$/;
    return phoneRegex.test(phone?.replace(/\s/g, ''));
  },

  password: (password) => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return strongPasswordRegex.test(password);
  }
};

export const ERROR_MESSAGES = {
  name: "Votre nom ne doit contenir ni chiffres ni caractères spéciaux.",
  email: "Veuillez fournir une adresse e-mail valide.",
  phone: "Veuillez vérifier votre numéro de téléphone.",
  password: "Votre mot de passe doit inclure au moins 8 caractères, une majuscule, un chiffre et un symbole."
};