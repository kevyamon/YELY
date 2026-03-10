// src/hooks/useServerWakeup.js
// HOOK DE SURVIE RESEAU - Detection du Cold Start (Render Sleep)
// CSCSM Level: Bank Grade

import { useEffect, useRef, useState } from 'react';

const useServerWakeup = () => {
  const [isServerReady, setIsServerReady] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const attemptRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    let retryTimer = null;
    
    let baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.XX:5000';
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const healthUrl = cleanBaseUrl.endsWith('/api/v1') 
      ? `${cleanBaseUrl}/health` 
      : `${cleanBaseUrl}/api/v1/health`;

    const pingServer = async () => {
      if (!isMounted) return;
      attemptRef.current += 1;

      // SECURITE ANTI-BLOCAGE : On force l'ouverture apres 4 echecs
      if (attemptRef.current > 4) {
        console.warn('[WAKEUP] Timeout maximal atteint, forcage de l\'ouverture.');
        if (isMounted) {
          setIsServerReady(true);
          setIsWakingUp(false);
        }
        return;
      }

      // Timeout dynamique : Rapide au premier essai (3s) au cas ou le serveur est deja pret.
      // Plus long (8s) pour les essais suivants pour laisser Render s'allumer.
      const timeoutDuration = attemptRef.current === 1 ? 3000 : 8000;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

      try {
        console.log(`[WAKEUP] Essai ${attemptRef.current} sur : ${healthUrl}`);
        
        const response = await fetch(`${healthUrl}?t=${Date.now()}`, {
          headers: { 'Accept': 'application/json' },
          signal: controller.signal // Tue proprement la requete si le timeout expire
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log('[WAKEUP] Serveur Pret et Reactif !');
          if (isMounted) {
            setIsServerReady(true);
            setIsWakingUp(false);
          }
        } else {
          throw new Error(`Erreur HTTP ${response.status}`);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
           console.warn(`[WAKEUP] Timeout (${timeoutDuration}ms). Cold start detecte.`);
        } else {
           console.warn(`[WAKEUP] Echec du ping : ${error.message}`);
        }
        
        if (isMounted) {
          setIsWakingUp(true);
          // On attend 2 secondes avant de retenter pour aerer le thread reseau
          retryTimer = setTimeout(pingServer, 2000);
        }
      }
    };

    pingServer();

    return () => {
      isMounted = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  return { isServerReady, isWakingUp };
};

export default useServerWakeup;