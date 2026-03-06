// src/hooks/useServerWakeup.js
// HOOK DE SURVIE RÉSEAU - Détection du Cold Start (Render Sleep)
// CSCSM Level: Bank Grade

import { useEffect, useState } from 'react';

const useServerWakeup = () => {
  const [isServerReady, setIsServerReady] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

    const pingServer = async () => {
      try {
        // Timeout manuel de 3 secondes pour ne pas bloquer l'UX (Compatible RN et Web)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );
        const fetchPromise = fetch(`${apiUrl}/api/v1/health`);
        
        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (response.ok && isMounted) {
          setIsServerReady(true);
          setIsWakingUp(false);
        } else {
          throw new Error('Server not ready');
        }
      } catch (error) {
        if (isMounted) {
          // Le serveur dort ou le réseau est lent : On déclenche le Bouclier UX
          setIsWakingUp(true);
          // On retente toutes les 4 secondes jusqu'au réveil complet
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