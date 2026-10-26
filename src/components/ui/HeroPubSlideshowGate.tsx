"use client";
import HeroPubSlideshow from "./HeroPubSlideshow";
import { useIsDesktop } from "@/lib/useIsDesktop";
import type { Professional } from "@/types";

interface Props {
  initialPros: Professional[];
}

/**
 * Enveloppe HeroPubSlideshow pour la page d'accueil (seule page où il est
 * appelé depuis un composant serveur, qui ne peut pas utiliser de hook
 * directement). Un simple `hidden lg:block` posé par la page appelante ne
 * suffit pas à empêcher le montage du composant ni le téléchargement de
 * son image sur mobile (vérifié par capture réseau, voir useIsDesktop.ts)
 * — il n'est donc monté ici qu'une fois le viewport desktop confirmé,
 * sans aucun changement pour les visiteurs desktop.
 */
export default function HeroPubSlideshowGate({ initialPros }: Props) {
  const isDesktop = useIsDesktop();
  if (!isDesktop) return null;
  return (
    <>
      <HeroPubSlideshow initialPros={initialPros} />
      <p className="text-xs text-white/50 text-center mt-3">
        Pour afficher votre fiche professionnelle dans ce diaporama, activez l&apos;option « Encart publicitaire » dans votre tableau de bord.
      </p>
    </>
  );
}
