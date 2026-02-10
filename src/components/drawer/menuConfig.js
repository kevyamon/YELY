// src/components/drawer/menuConfig.js

const MENU_ITEMS = {
  rider: [
    { key: 'RiderHome', label: 'Accueil', icon: 'home-outline', iconActive: 'home' },
    { key: 'History', label: 'Historique', icon: 'time-outline', iconActive: 'time' },
    { key: 'Notifications', label: 'Notifications', icon: 'notifications-outline', iconActive: 'notifications' },
    { key: 'Profile', label: 'Mon Profil', icon: 'person-outline', iconActive: 'person' },
  ],
  driver: [
    { key: 'DriverHome', label: 'Accueil', icon: 'car-outline', iconActive: 'car' },
    { key: 'Subscription', label: 'Abonnement', icon: 'card-outline', iconActive: 'card' },
    { key: 'History', label: 'Historique', icon: 'time-outline', iconActive: 'time' },
    { key: 'Notifications', label: 'Notifications', icon: 'notifications-outline', iconActive: 'notifications' },
    { key: 'Profile', label: 'Mon Profil', icon: 'person-outline', iconActive: 'person' },
  ],
  admin: [
    { key: 'AdminDashboard', label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid' },
    { key: 'Validations', label: 'Validations', icon: 'checkmark-circle-outline', iconActive: 'checkmark-circle', badge: true },
    { key: 'Drivers', label: 'Chauffeurs', icon: 'people-outline', iconActive: 'people' },
    { key: 'Notifications', label: 'Notifications', icon: 'notifications-outline', iconActive: 'notifications' },
    { key: 'Profile', label: 'Mon Profil', icon: 'person-outline', iconActive: 'person' },
  ],
  superadmin: [
    { key: 'AdminDashboard', label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid' },
    { key: 'Validations', label: 'Validations', icon: 'checkmark-circle-outline', iconActive: 'checkmark-circle', badge: true },
    { key: 'Drivers', label: 'Chauffeurs', icon: 'people-outline', iconActive: 'people' },
    { key: 'Finance', label: 'Finance', icon: 'wallet-outline', iconActive: 'wallet' },
    { key: 'Notifications', label: 'Notifications', icon: 'notifications-outline', iconActive: 'notifications' },
    { key: 'Profile', label: 'Mon Profil', icon: 'person-outline', iconActive: 'person' },
  ],
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