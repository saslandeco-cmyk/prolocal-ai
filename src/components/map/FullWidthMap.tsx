"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { buildProfileUrl } from "@/lib/profileUrl";
import { useInView } from "@/lib/useInView";
import { Professional } from "@/types";

function MapPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center space-y-2">
        <MapPin className="w-8 h-8 text-gray-300 mx-auto animate-pulse" />
        <p className="text-sm text-gray-400">Chargement de la carte…</p>
      </div>
    </div>
  );
}

const MultiMap = dynamic(() => import("@/components/map/MultiMap"), {
  ssr: false,
  loading: () => <MapPlaceholder />,
});

interface Props {
  /** Professionnels actifs, fournis par le serveur (page d'accueil) — évite
   *  un nouvel aller-retour réseau ici vers /api/db/professionals. */
  initialPros: Professional[];
}

export default function FullWidthMap({ initialPros }: Props) {
  const router = useRouter();
  const pros = useMemo(() => initialPros.filter(p => p.lat && p.lng), [initialPros]);
  // La carte (Leaflet, ~480ms de script sur mobile — voir l'audit Lighthouse
  // "bootup-time") n'est montée qu'à l'approche du viewport : cette section
  // est tout en bas de la page d'accueil, systématiquement hors écran au
  // premier affichage, inutile de l'exécuter immédiatement.
  const [mapRef, mapInView] = useInView<HTMLDivElement>();

  return (
    <section className="w-full bg-landes-hero">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch lg:min-h-[480px]">

          {/* ── Colonne gauche — contenu éditorial ── */}
          <div className="flex flex-col justify-center py-8 sm:py-10 lg:py-14 pr-0 lg:pr-12">

            {/* Phrase d'accroche */}
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-6 sm:mb-10">
              Le lien entre les{" "}
              <span className="text-landes-sand">professionnels landais</span>{" "}
              et ceux qui les cherchent, au bon endroit et au bon moment.
            </p>

            {/* Deux colonnes de mots-clés */}
            <div className="grid grid-cols-2 gap-4 sm:gap-8">

              {/* Professionnels */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-landes-sand mb-3">
                  Professionnels
                </p>
                <div className="flex flex-col gap-2">
                  {["Visibilité", "Prospection", "Référencement", "Notoriété", "Clients", "Croissance"].map(w => (
                    <span key={w} className="flex items-center gap-2 text-white/90 text-sm font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-landes-sand flex-shrink-0" />
                      {w}
                    </span>
                  ))}
                </div>
              </div>

              {/* Consommateurs */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-landes-sand mb-3">
                  Consommateurs
                </p>
                <div className="flex flex-col gap-2">
                  {["Proximité", "Confiance", "Rapidité", "Choix", "Recommandations", "Local"].map(w => (
                    <span key={w} className="flex items-center gap-2 text-white/90 text-sm font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-landes-sage flex-shrink-0" />
                      {w}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ── Colonne droite — carte ── */}
          <div ref={mapRef} className="relative min-h-[280px] sm:min-h-[360px] lg:min-h-[480px]">
            {mapInView ? (
              <MultiMap
                professionals={pros}
                onSelectPro={id => {
                  const p = pros.find(pr => pr.id === id);
                  router.push(p ? buildProfileUrl(p) : `/annuaire/${id}`);
                }}
              />
            ) : (
              <MapPlaceholder />
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
