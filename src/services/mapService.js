// src/services/mapService.js
// Service de géocodage et calculs de distance

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

class MapService {
  // Géocodage : Adresse → Coordonnées
  static async geocode(address) {
    try {
      const response = await fetch(
        `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(address)}&limit=5&addressdetails=1&countrycodes=ci`,
        {
          headers: {
            'User-Agent': 'YelyApp/1.0',
          },
        }
      );
      const data = await response.json();

      return data.map((item) => ({
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        displayName: item.display_name,
        address: {
          road: item.address?.road || '',
          neighbourhood: item.address?.neighbourhood || item.address?.suburb || '',
          city: item.address?.city || item.address?.town || item.address?.village || '',
          country: item.address?.country || '',
        },
        placeId: item.place_id,
      }));
    } catch (error) {
      console.error('[MapService] Erreur de géocodage:', error);
      return [];
    }
  }

  // Géocodage Inversé : Coordonnées → Adresse
  static async reverseGeocode(latitude, longitude) {
    try {
      const response = await fetch(
        `${NOMINATIM_BASE}/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'YelyApp/1.0',
          },
        }
      );
      const data = await response.json();

      return {
        displayName: data.display_name,
        address: {
          road: data.address?.road || '',
          neighbourhood: data.address?.neighbourhood || data.address?.suburb || '',
          city: data.address?.city || data.address?.town || data.address?.village || '',
          country: data.address?.country || '',
        },
        shortName: data.address?.road
          ? `${data.address.road}, ${data.address?.neighbourhood || data.address?.suburb || data.address?.city || ''}`
          : data.display_name.split(',').slice(0, 2).join(','),
      };
    } catch (error) {
      console.error('[MapService] Erreur de géocodage inversé:', error);
      return null;
    }
  }

  // Calcul de distance entre deux points (Haversine)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this._deg2rad(lat2 - lat1);
    const dLon = this._deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._deg2rad(lat1)) *
      Math.cos(this._deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance en km
  }

  static _deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  // Estimation du prix
  static calculatePrice(distanceKm, forfait = 'STANDARD') {
    const basePrices = {
      ECHO: { base: 300, perKm: 150, minimum: 500 },
      STANDARD: { base: 500, perKm: 250, minimum: 800 },
      VIP: { base: 1000, perKm: 400, minimum: 1500 },
    };

    const config = basePrices[forfait] || basePrices.STANDARD;
    const rawPrice = config.base + (distanceKm * config.perKm);
    const roundedPrice = Math.ceil(rawPrice / 50) * 50; // Arrondir aux 50F les plus proches
    return Math.max(roundedPrice, config.minimum);
  }

  // Estimation du temps d'arrivée (en minutes)
  static estimateArrivalTime(distanceKm) {
    // Vitesse moyenne en ville : ~25 km/h
    const avgSpeedKmH = 25;
    const timeMinutes = (distanceKm / avgSpeedKmH) * 60;
    return Math.max(Math.round(timeMinutes), 1);
  }

  // Obtenir les itinéraires (OSRM)
  static async getRoute(startLat, startLon, endLat, endLon) {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          coordinates: route.geometry.coordinates.map(([lng, lat]) => ({
            latitude: lat,
            longitude: lng,
          })),
          distance: route.distance / 1000, // en km
          duration: route.duration / 60, // en minutes
        };
      }
      return null;
    } catch (error) {
      console.error('[MapService] Erreur de routage:', error);
      return null;
    }
  }
}

export default MapService;