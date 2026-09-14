import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://prolocal-landes.fr";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Prolocal-landes.fr — Annuaire des professionnels des Landes",
    template: "%s",
  },
  description: "Trouvez tous les professionnels et commerçants du département des Landes (40). Annuaire local avec géolocalisation.",
  openGraph: {
    siteName: "Prolocal-Landes",
    locale: "fr_FR",
    type: "website",
  },
  // Balises géo classiques pour le référencement local (SEO local historique,
  // toujours reconnues par certains outils/annuaires) — centrées sur le
  // département des Landes.
  other: {
    "geo.region": "FR-40",
    "geo.placename": "Landes",
    "geo.position": "43.8914;-0.5006", // Mont-de-Marsan, préfecture du département
    ICBM: "43.8914, -0.5006",
  },
};

// Identité de l'entreprise éditrice — adresse réelle, cohérente avec les
// mentions légales du site (voir /mentions-legales).
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${baseUrl}/#organization`,
  name: "Prolocal-Landes",
  legalName: "Landeco SAS",
  url: baseUrl,
  logo: `${baseUrl}/favicon.ico`,
  description: "Annuaire des professionnels et commerçants du département des Landes (40).",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Grand Dax Développement, 1 avenue de la Gare",
    addressLocality: "Dax",
    postalCode: "40100",
    addressRegion: "Nouvelle-Aquitaine",
    addressCountry: "FR",
  },
  areaServed: { "@type": "AdministrativeArea", name: "Landes" },
  email: "contact@prolocal-landes.fr",
};

// Permet à Google d'afficher une barre de recherche directement dans les
// résultats (sitelinks search box) pour les recherches sur le nom du site.
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${baseUrl}/#website`,
  name: "Prolocal-Landes",
  url: baseUrl,
  publisher: { "@id": `${baseUrl}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${baseUrl}/annuaire?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-landes-cream min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <ScrollToTop />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
