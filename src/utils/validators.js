// src/utils/validators.js
// VALIDATIONS MÉTIER CENTRALISÉES
// CSCSM Level: Bank Grade

export const VALIDATORS = {
  // Noms : 2 caractères min, accepte les accents (É, è, ç...), tirets, apostrophes
  name: (name) => {
    const regex = /^[a-zA-Z\u00C0-\u00FF\s'-]{2,50}$/;
    return regex.test(name?.trim());
  },

  // Email : Format strict + rejet des domaines temporaires connus
  email: (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;
    
    const domain = email.split('@')[1];
    const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'yopmail.com'];
    return !disposableDomains.includes(domain);
  },

  // Téléphone : Doit contenir des chiffres, peut commencer par +
  phone: (phone) => {
    const phoneRegex = /^\+?[0-9\s]{8,15}$/;
    return phoneRegex.test(phone?.replace(/\s/g, ''));
  },

  // Mot de passe : 8 car, 1 Maj, 1 min, 1 chiffre, 1 spécial
  password: (password) => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return strongPasswordRegex.test(password);
  }
};

export const ERROR_MESSAGES = {
  name: "Le nom doit contenir au moins 2 lettres (accents autorisés).",
  email: "Veuillez entrer une adresse email valide (pas de mail temporaire).",
  phone: "Numéro de téléphone invalide.",
  password: "Le mot de passe doit contenir 8 caractères, 1 majuscule, 1 chiffre et 1 symbole."
};