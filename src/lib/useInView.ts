"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Détecte quand un élément approche du viewport, pour ne monter un composant
 * coûteux (ex: la carte Leaflet, ~480ms de script sur mobile — voir l'audit
 * Lighthouse "bootup-time") qu'au moment où il devient réellement utile à
 * l'utilisateur, au lieu de l'exécuter immédiatement au montage de la page
 * même quand il est hors écran. `rootMargin` déclenche le montage un peu
 * avant que l'élément ne soit visible, pour que l'utilisateur ne voie jamais
 * le temps de chargement en scrollant normalement.
 */
export function useInView<T extends HTMLElement>(rootMargin = "300px"): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") { setInView(true); return; }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  return [ref, inView];
}
