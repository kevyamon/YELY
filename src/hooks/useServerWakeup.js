// src/hooks/useServerWakeup.js
// HOOK DE SURVIE RÉSEAU - Détection du Cold Start (Render Sleep)
// CSCSM Level: Bank Grade

import { useEffect, useState } from 'react';

const useServerWakeup = () => {
  const [isServerReady, setIsServerReady] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // 1. Récupération de l'URL de base
    // Note : Remplace 192.168.X.X par ton IP locale si tu testes en développement sur mobile physique
    let baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.XX:5000';
    
    // 2. Nettoyage intelligent de l'URL : on évite les doublons /api/v1/api/v1/health
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const healthUrl = cleanBaseUrl.endsWith('/api/v1') 
      ? `${cleanBaseUrl}/health` 
      : `${cleanBaseUrl}/api/v1/health`;

    const pingServer = async () => {
      try {
        console.log(`[WAKEUP] Tentative de connexion au serveur sur : ${healthUrl}`);
        
        // 3. Timeout élargi à 8 secondes pour ne pas pénaliser les réseaux lents
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT - Délai dépassé')), 8000)
        );
        
        // 4. Cache-buster (?t=...) pour empêcher le navigateur/téléphone de mettre la réponse en cache
        const fetchPromise = fetch(`${healthUrl}?t=${Date.now()}`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (response.ok) {
          console.log('[WAKEUP] ✅ Serveur Prêt et Réactif !');
          if (isMounted) {
            setIsServerReady(true);
            setIsWakingUp(false);
          }
        } else {
          // Si le serveur répond 404, 500, etc., on lève une erreur explicite
          throw new Error(`Erreur HTTP ${response.status}`);
        }
      } catch (error) {
        console.warn(`[WAKEUP] ❌ Échec du ping : ${error.message}. Nouvelle tentative dans 4 secondes...`);
        if (isMounted) {
          setIsWakingUp(true);
          setTimeout(pingServer, 4000);
        }
      }
    };

    pingServer();

    return () => {
      isMounted = false;
    };
  }, []);

  return { isServerReady, isWakingUp };
};

export default useServerWakeup;