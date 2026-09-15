import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categoryLabelFromSlug, subcategoryLabelFromSlug } from "@/lib/profileUrl";
import { dbGetCategories } from "@/lib/db/categories";
import SubcategoryPage from "@/components/category/SubcategoryPage";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://prolocal-landes.fr";

export const revalidate = 3600;

/**
 * Page dédiée à une sous-catégorie (un "métier" précis), toutes villes
 * confondues — /categories/[categorie]/[sous-categorie].
 *
 * Cette route dynamique cohabite avec le dossier dynamique [category] (page
 * catégorie) au même niveau sans conflit : Next.js autorise un dossier
 * dynamique en complément d'un autre dossier dynamique de même nom
 * ([category]) à un niveau donné — voir ../page.tsx.
 */
async function resolve(categorySlug: string, subcategorySlug: string) {
  const categories = await dbGetCategories();
  const categoryLabel = categoryLabelFromSlug(categorySlug, categories);
  if (!categoryLabel) return null;
  const subcategoryLabel = subcategoryLabelFromSlug(categoryLabel, subcategorySlug, categories);
  if (!subcategoryLabel) return null;
  return { categoryLabel, subcategoryLabel };
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; subcategory: string }> }): Promise<Metadata> {
  const { category, subcategory } = await params;
  const resolved = await resolve(category, subcategory);
  if (!resolved) return { title: "Page introuvable | Prolocal-Landes" };

  const { categoryLabel, subcategoryLabel } = resolved;
  const url = `${baseUrl}/categories/${category}/${subcategory}`;
  const title = `${subcategoryLabel} dans les Landes | Prolocal-Landes`;
  const description = `Trouvez un professionnel en ${subcategoryLabel} (${categoryLabel}) dans les Landes. Coordonnées, avis clients et informations pratiques sur Prolocal-Landes.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Prolocal-Landes", locale: "fr_FR", type: "website" },
  };
}

export default async function Page({ params }: { params: Promise<{ category: string; subcategory: string }> }) {
  const { category, subcategory } = await params;
  const resolved = await resolve(category, subcategory);
  if (!resolved) notFound();

  const { categoryLabel, subcategoryLabel } = resolved;
  const url = `${baseUrl}/categories/${category}/${subcategory}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: baseUrl },
          { "@type": "ListItem", position: 2, name: "Catégories", item: `${baseUrl}/categories` },
          { "@type": "ListItem", position: 3, name: categoryLabel, item: `${baseUrl}/categories/${category}` },
          { "@type": "ListItem", position: 4, name: subcategoryLabel, item: url },
        ],
      },
      {
        "@type": "CollectionPage",
        name: `${subcategoryLabel} dans les Landes`,
        url,
        isPartOf: { "@type": "WebSite", name: "Prolocal-Landes", url: baseUrl },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SubcategoryPage categoryLabel={categoryLabel} subcategoryLabel={subcategoryLabel} />
    </>
  );
}
