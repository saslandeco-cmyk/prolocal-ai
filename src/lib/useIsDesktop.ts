"use client";
import { useEffect, useState } from "react";

/**
 * true uniquement une fois confirmé que le viewport est ≥ breakpointPx
 * (1024px par défaut, aligné sur le "lg" de Tailwind) — à utiliser pour ne
 * littéralement jamais monter un composant sur mobile (plutôt que de le
 * masquer en CSS avec `hidden lg:block`), seule façon fiable d'empêcher le
 * téléchargement de ses images.
 *
 * Un simple `display:none` ne suffit pas : vérifié par une capture réseau
 * réelle sur le site en production (voir HeroPubSlideshow.tsx), l'image à
 * l'intérieur d'un conteneur `hidden lg:block` était quand même téléchargée
 * sur mobile — et même dans une résolution plus grande que sur desktop, à
 * cause du ratio d'écran (DPR) mobile appliqué à une valeur `sizes` fixe.
 *
 * Commence à `false` (y compris sur desktop, le temps d'un rendu) pour que
 * le HTML initial reste strictement identique entre serveur et client
 * (jamais de hydration mismatch) ; un `useEffect` corrige la valeur juste
 * après le montage — un délai d'une frame, imperceptible, qu'aucune
 * alternative purement CSS ne permet d'éviter.
 */
export function useIsDesktop(breakpointPx = 1024): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpointPx}px)`);
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpointPx]);

  return isDesktop;
}
