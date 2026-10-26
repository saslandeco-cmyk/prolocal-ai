import type { Metadata } from "next";

// page.tsx est un composant client ("use client", formulaire multi-étapes)
// et ne peut donc pas exporter `metadata` lui-même — ce layout porte les
// métadonnées à sa place. Sans elles, la page héritait du titre/description
// génériques du layout racine, ce que Search Console signalait comme
// contenu en double sans URL canonique sélectionnée.
export const metadata: Metadata = {
  title: "Inscrire mon entreprise | Prolocal-Landes",
  description: "Référencez gratuitement votre entreprise sur Prolocal-Landes, la plateforme des professionnels et commerçants du département des Landes (40), et gagnez en visibilité auprès des habitants.",
  alternates: { canonical: "/inscription" },
};

export default function InscriptionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
