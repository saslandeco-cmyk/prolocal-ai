import type { Metadata } from "next";
import NeedResultsClient from "@/components/ai/NeedResultsClient";

/**
 * Page de résultats du parcours "PROLOCAL AI" (recherche en langage naturel).
 *
 * Comme /annuaire, cette page reçoit une entrée texte libre pouvant prendre
 * une infinité de valeurs — même traitement SEO que /annuaire (noindex),
 * l'autorité SEO restant concentrée sur les pages canoniques catégories/villes.
 */
export function generateMetadata(): Metadata {
  return {
    title: "Votre recherche | PROLOCAL AI",
    description: "Décrivez votre besoin, PROLOCAL AI vous met en relation avec les professionnels correspondants dans les Landes.",
    robots: { index: false, follow: true },
  };
}

export default function BesoinPage() {
  return <NeedResultsClient />;
}
