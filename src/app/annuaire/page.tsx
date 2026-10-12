import type { Metadata } from "next";
import AnnuaireSearchClient from "@/components/professional/AnnuaireSearchClient";

/**
 * Page de résultats de recherche libre (/annuaire?category=X&q=Y).
 *
 * ⚠️ Contrairement aux pages catégories (/categories/[slug]) et aux pages
 * ville (/annuaire/[ville]), cette page accepte une recherche texte libre
 * ("q") pouvant prendre une infinité de valeurs. Générer un contenu unique
 * pour chaque combinaison créerait un risque de "contenu fin dupliqué à
 * l'infini" aux yeux de Google (pratique déconseillée, similaire aux pages
 * de résultats filtrés d'un site e-commerce).
 *
 * La bonne pratique appliquée ici : le contenu reste utile pour
 * l'utilisateur (résumé dynamique de la recherche, voir
 * AnnuaireSearchClient.tsx), mais la page est explicitement exclue de
 * l'indexation (`robots: noindex`) — l'autorité SEO est concentrée sur les
 * pages canoniques déjà optimisées (catégories et villes), qui doivent
 * être les cibles réelles du classement Google.
 */
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }): Promise<Metadata> {
  const params = await searchParams;
  const category = params.category || "";
  const q = params.q || "";
  const city = params.city || "";

  const parts = [category, q].filter(Boolean).join(" — ");
  const title = parts
    ? `${parts}${city ? ` à ${city}` : ""} | Prolocal-Landes`
    : "Résultats de recherche | Prolocal-Landes";

  return {
    title,
    description: "Résultats de recherche sur la plateforme des professionnels landais.",
    robots: { index: false, follow: true },
  };
}

export default function AnnuairePage() {
  return <AnnuaireSearchClient />;
}
