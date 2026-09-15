"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ImageIcon, Star, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { getHeroSlideshowIds, getProfessionalById, getProfessionals, rehydrateAsync } from "@/lib/storage";
import { buildProfileUrl } from "@/lib/profileUrl";
import { getProRating } from "@/lib/reviewUtils";
import type { Professional } from "@/types";

const SLIDE_DURATION_MS = 5000;

interface Props {
  /** Limite le diaporama à une catégorie précise (pages catégories/sous-catégories). */
  category?: string;
  /** Limite en plus à une sous-catégorie précise (pages sous-catégories). */
  subcategory?: string;
  /** Contenu affiché si aucun encart ne correspond (repli). Par défaut : message générique. */
  fallback?: React.ReactNode;
}

/**
 * Diaporama de la section hero — affiche les fiches des professionnels
 * ayant l'option complémentaire "Encart publicitaire ciblé".
 *
 * - Sur la page d'accueil (aucune prop) : sélection manuelle de l'admin si
 *   renseignée (voir /admin, panneau "Diaporama Hero"), sinon tous les
 *   professionnels actifs ayant l'option active, toutes catégories confondues.
 * - Sur une page catégorie/sous-catégorie (props `category`/`subcategory`) :
 *   uniquement les professionnels de cette catégorie/sous-catégorie ayant
 *   l'option active — toujours automatique, jamais de sélection manuelle
 *   (celle-ci est réservée à la page d'accueil).
 */
export default function HeroPubSlideshow({ category, subcategory, fallback }: Props) {
  const [pros, setPros] = useState<Professional[]>([]);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      // ── Page catégorie / sous-catégorie : filtrage automatique uniquement ──
      if (category) {
        const candidates = getProfessionals().filter(p =>
          p.status === "active" &&
          (p.complementaryOptions || []).includes("pub") &&
          p.category === category &&
          (!subcategory || p.subcategory === subcategory)
        );
        const resolved = await Promise.all(candidates.map(p => rehydrateAsync(p)));
        setPros(resolved);
        setLoaded(true);
        return;
      }

      // ── Page d'accueil : sélection manuelle de l'admin si renseignée ──
      const ids = getHeroSlideshowIds();
      if (ids.length > 0) {
        const resolved = (
          await Promise.all(
            ids.map(async id => {
              const pro = getProfessionalById(id);
              if (!pro || pro.status !== "active") return null;
              return rehydrateAsync(pro);
            })
          )
        ).filter((p): p is Professional => Boolean(p));
        setPros(resolved);
        setLoaded(true);
        return;
      }

      // Repli automatique : tous les professionnels actifs ayant l'option active
      const candidates = getProfessionals().filter(
        p => p.status === "active" && (p.complementaryOptions || []).includes("pub")
      );
      const resolved = await Promise.all(candidates.map(p => rehydrateAsync(p)));
      setPros(resolved);
      setLoaded(true);
    })();
  }, [category, subcategory]);

  useEffect(() => {
    if (pros.length <= 1) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % pros.length), SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, [pros.length]);

  if (!loaded) {
    return <div className="w-full h-[400px] rounded-2xl bg-white/5 animate-pulse" />;
  }

  if (pros.length === 0) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="relative w-full h-[400px] rounded-2xl overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative text-center text-white/40 space-y-3">
          <ImageIcon className="w-12 h-12 mx-auto opacity-40" />
          <p className="text-sm font-medium opacity-50">Encarts publicitaires à venir</p>
        </div>
      </div>
    );
  }

  const goPrev = () => setIndex(i => (i - 1 + pros.length) % pros.length);
  const goNext = () => setIndex(i => (i + 1) % pros.length);

  const pro = pros[index];
  const rating = getProRating(pro.id);

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-2xl group flex flex-col">
      <Link href={buildProfileUrl(pro)} className="flex flex-col h-full">
        {/* Image limitée à la zone du haut de la card */}
        <img
          src={pro.banner || pro.logo || "/placeholder-banner.jpg"}
          alt={pro.companyName}
          className="w-full flex-1 min-h-0 object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Badge "Encart sponsorisé" */}
        <span className="absolute top-4 right-4 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
          Sponsorisé
        </span>

        {/* Puces de navigation — superposées à la zone image */}
        {pros.length > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {pros.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.preventDefault(); setIndex(i); }}
                className={`w-2 h-2 rounded-full transition-all ${i === index ? "bg-white w-5" : "bg-white/40"}`}
                aria-label={`Voir l'encart ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Bloc d'informations — sous l'image (plus en surimpression), en
            bas de la card. Les avis et la description ne s'affichent que
            s'ils existent réellement (pas de texte de repli). */}
        <div className="bg-black/60 px-5 py-4 text-white flex-shrink-0">
          <p className="font-bold text-xl leading-tight truncate">{pro.companyName}</p>
          <p className="text-white/80 text-sm truncate">{pro.subcategory || pro.category} — {pro.city}</p>

          {rating.count > 0 && (
            <div className="flex items-center gap-1 mt-1.5 text-sm">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{rating.avg.toFixed(1)}</span>
              <span className="text-white/60">({rating.count} avis)</span>
            </div>
          )}

          {pro.description && (
            <p
              className="mt-2 text-sm text-white/70 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: pro.description.replace(/<[^>]*>/g, " ").trim() }}
            />
          )}

          <span className="inline-flex items-center gap-1.5 mt-3 bg-white text-landes-forest text-xs font-semibold px-3.5 py-2 rounded-lg group-hover:bg-landes-sand transition-colors">
            Voir la fiche <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>

      {/* Flèches de navigation */}
      {pros.length > 1 && (
        <>
          <button
            onClick={e => { e.preventDefault(); goPrev(); }}
            aria-label="Encart précédent"
            className="absolute top-1/2 left-3 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={e => { e.preventDefault(); goNext(); }}
            aria-label="Encart suivant"
            className="absolute top-1/2 right-3 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
