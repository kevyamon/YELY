// src/components/drawer/menuConfig.js
// CONFIGURATION DU MENU (Données & Utilitaires)

// NOTE : On utilise ici le nom de l'icône "pleine" (ex: 'home').
// DrawerMenu.jsx ajoutera automatiquement '-outline' quand c'est inactif.

const MENU_ITEMS = {
  rider: [
    { route: 'RiderHome', label: 'Accueil', icon: 'home' },
    { route: 'History', label: 'Historique', icon: 'time' },
    { route: 'Notifications', label: 'Notifications', icon: 'notifications' },
    { route: 'Profile', label: 'Mon Profil', icon: 'person' },
  ],
  driver: [
    { route: 'DriverHome', label: 'Accueil', icon: 'car' },
    { route: 'Subscription', label: 'Abonnement', icon: 'card' },
    { route: 'History', label: 'Historique', icon: 'time' },
    { route: 'Notifications', label: 'Notifications', icon: 'notifications' },
    { route: 'Profile', label: 'Mon Profil', icon: 'person' },
  ],
  admin: [
    { route: 'AdminDashboard', label: 'Dashboard', icon: 'grid' },
    { route: 'Validations', label: 'Validations', icon: 'checkmark-circle' },
    { route: 'Drivers', label: 'Chauffeurs', icon: 'people' },
    { route: 'Notifications', label: 'Notifications', icon: 'notifications' },
    { route: 'Profile', label: 'Mon Profil', icon: 'person' },
  ],
  superadmin: [
    { route: 'AdminDashboard', label: 'Dashboard', icon: 'grid' },
    { route: 'Validations', label: 'Validations', icon: 'checkmark-circle' },
    { route: 'Drivers', label: 'Chauffeurs', icon: 'people' },
    { route: 'Finance', label: 'Finance', icon: 'wallet' },
    { route: 'Notifications', label: 'Notifications', icon: 'notifications' },
    { route: 'Profile', label: 'Mon Profil', icon: 'person' },
  ],
};

// 👇 C'EST CETTE FONCTION QUI MANQUAIT 👇
export const getMenuItems = (role) => {
  // Sécurité : si le rôle est inconnu ou null, on retourne le menu passager par défaut
  return MENU_ITEMS[role] || MENU_ITEMS.rider;
};

export const getRoleLabel = (role) => {
  switch (role) {
    case 'driver': return 'Chauffeur';
    case 'admin': return 'Administrateur';
    case 'superadmin': return 'Super Admin';
    default: return 'Passager';
  }
};

export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

export default MENU_ITEMS;