// src/components/drawer/menuConfig.js
// CONFIGURATION DU MENU (Données & Utilitaires)

const MENU_ITEMS = {
  rider: [
    { route: 'RiderHome', label: 'Accueil', icon: 'home' },
    { route: 'History', label: 'Historique', icon: 'time' },
    { route: 'Notifications', label: 'Notifications', icon: 'notifications' },
    { route: 'SettingsModal', label: 'Paramètres', icon: 'settings' },
  ],
  driver: [
    { route: 'DriverHome', label: 'Accueil', icon: 'car' },
    { route: 'Subscription', label: 'Abonnement', icon: 'card' },
    { route: 'History', label: 'Historique', icon: 'time' },
    { route: 'Notifications', label: 'Notifications', icon: 'notifications' },
    { route: 'SettingsModal', label: 'Paramètres', icon: 'settings' },
  ],
  admin: [
    { route: 'AdminDashboard', label: 'Dashboard', icon: 'grid' },
    { route: 'Validations', label: 'Validations', icon: 'checkmark-circle' },
    { route: 'Drivers', label: 'Chauffeurs', icon: 'people' },
    { route: 'Notifications', label: 'Notifications', icon: 'notifications' },
    { route: 'SettingsModal', label: 'Paramètres', icon: 'settings' },
  ],
  superadmin: [
    { route: 'AdminDashboard', label: 'Dashboard', icon: 'grid' },
    { route: 'Validations', label: 'Validations', icon: 'checkmark-circle' },
    { route: 'Drivers', label: 'Chauffeurs', icon: 'people' },
    { route: 'Finance', label: 'Finance', icon: 'wallet' },
    { route: 'Notifications', label: 'Notifications', icon: 'notifications' },
    { route: 'SettingsModal', label: 'Paramètres', icon: 'settings' },
  ],
};

export const getMenuItems = (role) => {
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