"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { getProfessionals } from "@/lib/storage";
import { buildProfileUrl } from "@/lib/profileUrl";
import { Professional } from "@/types";

const MultiMap = dynamic(() => import("@/components/map/MultiMap"), { ssr: false });

export default function FullWidthMap() {
  const router = useRouter();
  const [pros, setPros]   = useState<Professional[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const real = getProfessionals().filter(p => p.status === "active" && p.lat && p.lng);
    setPros(real);
    setLoaded(true);
  }, []);

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
          <div className="relative min-h-[280px] sm:min-h-[360px] lg:min-h-[480px]">
            {loaded ? (
              <MultiMap
                professionals={pros}
                onSelectPro={id => {
                  const p = pros.find(pr => pr.id === id);
                  router.push(p ? buildProfileUrl(p) : `/annuaire/${id}`);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center space-y-2">
                  <MapPin className="w-8 h-8 text-gray-300 mx-auto animate-pulse" />
                  <p className="text-sm text-gray-400">Chargement de la carte…</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
