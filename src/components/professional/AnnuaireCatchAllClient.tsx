"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProfessionalById } from "@/lib/storage";
import { buildProfileUrl, extractIdFromSlug, categoryLabelFromSlug } from "@/lib/profileUrl";
import { cityMetaFromSlug } from "@/lib/cityData";
import ProfessionalProfileView from "@/components/professional/ProfessionalProfileView";
import CityPage from "@/components/category/CityPage";
import { Loader2 } from "lucide-react";
import type { Professional } from "@/types";
import type { CategoryRecord } from "@/lib/categories";

/**
 * Route unique gérant à la fois :
 *  - l'ancien format d'URL       /annuaire/[id]
 *  - le format SEO fiche pro     /annuaire/[categorie]/[sous-categorie]/[nom-entreprise]-[id]
 *  - le format SEO page ville    /annuaire/[ville]
 *  - le format SEO ville+catégorie /annuaire/[ville]/[categorie]
 *
 * ⚠️ Tous ces formats doivent être gérés par UNE SEULE route dynamique
 * ([...slug], catch-all). Avoir des dossiers dynamiques frères au même
 * niveau avec des noms différents n'est pas autorisé par Next.js et
 * provoque des erreurs 500 au moment du routage.
 *
 * Désambiguïsation à 1 segment : on vérifie d'abord si le segment
 * correspond à un slug de ville connu (liste fixe, cityData.ts) — si oui,
 * c'est une page ville ; sinon, on retombe sur l'ancien comportement
 * (identifiant de fiche legacy, avec redirection automatique).
 */
export default function AnnuaireCatchAllClient({ initialData, categories }: { initialData?: Professional | null; categories?: CategoryRecord[] }) {
  const params = useParams<{ slug: string[] }>();
  const router = useRouter();
  const [notFound, setNotFound] = useState(false);

  const segments = useMemo(() => params.slug || [], [params.slug]);

  // Page ville : 1 segment correspondant à un slug de ville connu
  const cityMetaSingle = segments.length === 1 ? cityMetaFromSlug(segments[0]) : null;
  // Page ville + catégorie : 2 segments [ville]/[categorie]
  const cityMetaCombo = segments.length === 2 ? cityMetaFromSlug(segments[0]) : null;
  const comboCategoryLabel = cityMetaCombo ? categoryLabelFromSlug(segments[1], categories) : null;

  // Format SEO fiche pro : /annuaire/[categorie]/[sous-categorie]/[nom-entreprise]-[id] (3 segments)
  const isSeoFormat = segments.length === 3;
  // Ancien format fiche pro : /annuaire/[id] (1 segment, PAS une ville connue)
  const isLegacyFormat = segments.length === 1 && !cityMetaSingle;

  const resolvedId = isSeoFormat
    ? (extractIdFromSlug(segments[2]) || segments[2])
    : isLegacyFormat
      ? segments[0]
      : null;

  // Redirection automatique de l'ancien format fiche pro vers l'URL canonique
  useEffect(() => {
    if (!isLegacyFormat || !resolvedId) return;
    const pro = getProfessionalById(resolvedId);
    if (!pro) { setNotFound(true); return; }
    router.replace(buildProfileUrl(pro));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLegacyFormat, resolvedId]);

  // ── Page ville (avec ou sans catégorie croisée) ──
  if (cityMetaSingle) {
    return <CityPage meta={cityMetaSingle} />;
  }
  if (cityMetaCombo && comboCategoryLabel) {
    return <CityPage meta={cityMetaCombo} categoryFilter={comboCategoryLabel} />;
  }

  // ── Aucun format reconnu ──
  if (!resolvedId || (segments.length !== 1 && segments.length !== 3)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-xl font-bold text-landes-pine mb-2">Page introuvable</p>
        <p className="text-gray-500">Cette adresse ne correspond à aucune fiche professionnelle.</p>
      </div>
    );
  }

  // ── Ancien format fiche pro : redirection ──
  if (isLegacyFormat) {
    if (notFound) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <p className="text-xl font-bold text-landes-pine mb-2">Fiche introuvable</p>
          <p className="text-gray-500">Cette fiche professionnelle n&apos;existe pas ou a été supprimée.</p>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center py-32 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Redirection…
      </div>
    );
  }

  // ── Format SEO fiche pro : affiche directement la fiche ──
  return <ProfessionalProfileView id={resolvedId} initialData={initialData} />;
}
