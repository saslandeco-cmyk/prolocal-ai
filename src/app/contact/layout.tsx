import type { Metadata } from "next";

// page.tsx est un composant client ("use client", formulaire interactif) et
// ne peut donc pas exporter `metadata` lui-même — ce layout porte les
// métadonnées à sa place. Sans elles, la page héritait du titre/description
// génériques du layout racine, ce que Search Console signalait comme
// contenu en double sans URL canonique sélectionnée.
export const metadata: Metadata = {
  title: "Nous contacter | Prolocal-Landes",
  description: "Une question, un problème technique ou un partenariat ? Contactez l'équipe Prolocal-Landes, la plateforme des professionnels du département des Landes (40).",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
