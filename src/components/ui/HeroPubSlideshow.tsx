"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ImageIcon, Star, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { getHeroSlideshowIds } from "@/lib/storage";
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
  /** Professionnels déjà récupérés côté serveur par la page appelante — évite
   *  un nouvel aller-retour réseau ici vers /api/db/professionals. */
  initialPros: Professional[];
}

/**
 * Diaporama de la section hero — affiche les fiches des professionnels
 * ayant l'option complémentaire "Encart publicitaire ciblé".
 *
 * - Sur la page d'accueil (aucune prop) : sélection manuelle de l'admin si
 *   renseignée (voir l'espace admin, panneau "Diaporama Hero"), sinon tous les
 *   professionnels actifs ayant l'option active, toutes catégories confondues.
 * - Sur une page catégorie/sous-catégorie (props `category`/`subcategory`) :
 *   uniquement les professionnels de cette catégorie/sous-catégorie ayant
 *   l'option active — toujours automatique, jamais de sélection manuelle
 *   (celle-ci est réservée à la page d'accueil).
 */
export default function HeroPubSlideshow({ category, subcategory, fallback, initialPros }: Props) {
  const [index, setIndex] = useState(0);

  // La sélection manuelle de l'admin vit en localStorage, inaccessible au
  // rendu serveur — elle ne doit donc jamais entrer dans le rendu initial
  // (identique serveur/client, piloté uniquement par initialPros), sous
  // peine de hydration mismatch : le serveur peint une image, React la
  // remplace aussitôt par une autre au montage, ce qui pénalise le LCP (plus
  // grand élément de la page) en plus d'un avertissement d'hydratation. On
  // ne la lit qu'après coup, dans cet effet, pour une mise à jour contrôlée.
  const [heroIds, setHeroIds] = useState<string[]>([]);
  useEffect(() => {
    if (!category) setHeroIds(getHeroSlideshowIds());
  }, [category]);

  // Dérivé synchrone de initialPros (fourni par la page serveur) — plus
  // aucun aller-retour réseau ici, ni au montage ni au changement de
  // catégorie/sous-catégorie.
  const pros = useMemo(() => {
    const hasPub = (p: Professional) => p.status === "active" && (p.complementaryOptions || []).includes("pub");

    // ── Page catégorie / sous-catégorie : filtrage automatique uniquement ──
    if (category) {
      return initialPros.filter(p =>
        hasPub(p) && p.category === category && (!subcategory || p.subcategory === subcategory)
      );
    }

    // ── Page d'accueil : sélection manuelle de l'admin si renseignée ──
    if (heroIds.length > 0) {
      const byId = new Map(initialPros.map(p => [p.id, p]));
      const resolved = heroIds
        .map(id => byId.get(id))
        .filter((p): p is Professional => Boolean(p && p.status === "active"));
      if (resolved.length > 0) return resolved;
    }

    // Repli automatique : tous les professionnels actifs ayant l'option active
    return initialPros.filter(hasPub);
  }, [initialPros, category, subcategory, heroIds]);

  useEffect(() => {
    if (pros.length <= 1) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % pros.length), SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, [pros.length]);

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
        {/* Image limitée à la zone du haut de la card. next/image la sert
            optimisée (redimensionnée, WebP/AVIF) au lieu du fichier brut
            potentiellement bien plus lourd que l'espace affiché (~580px de
            large ici) — le wrapper relative+flex-1 reproduit exactement le
            dimensionnement qu'avait l'<img> d'origine, pour que `fill` sache
            quelle taille remplir.
            ⚠️ Pas de `priority` ici volontairement : ce composant est
            masqué en CSS (`hidden lg:block` posé par la page appelante) sur
            mobile, où le sous-titre du hero devient le LCP à la place. Or
            `priority` force un fetch immédiat en priorité "High" même pour
            un élément display:none (vérifié via le réseau capturé par
            Lighthouse) — gaspillant de la bande passante mobile et
            retardant le téléchargement d'éléments réellement visibles. Sans
            `priority`, next/image utilise le chargement différé natif du
            navigateur, qui ne déclenche jamais le téléchargement tant que
            l'élément reste display:none — et charge toujours aussi vite sur
            desktop/tablette, où il est visible dès le premier écran. */}
        <div className="relative w-full flex-1 min-h-0 overflow-hidden">
          <Image
            src={pro.banner || pro.logo || "/placeholder-banner.jpg"}
            alt={pro.companyName}
            fill
            sizes="600px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>

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
