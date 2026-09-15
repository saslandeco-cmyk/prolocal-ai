import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryPage, { type CategoryMeta } from "@/components/category/CategoryPage";
import { dbGetCategories } from "@/lib/db/categories";
import type { CategoryRecord } from "@/lib/categories";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://prolocal-landes.fr";

// Les catégories peuvent être ajoutées/modifiées depuis l'admin sans
// redéploiement : les pages déjà générées sont revalidées régulièrement, et
// une catégorie toute nouvelle (absente de generateStaticParams) est rendue
// à la demande grâce à dynamicParams (true par défaut).
export const revalidate = 3600;

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toMeta(cat: CategoryRecord): CategoryMeta {
  return {
    slug: cat.slug,
    category: cat.label,
    emoji: cat.emoji,
    title: `${escapeHtml(cat.label)}<br/><span class="text-landes-sand">dans les Landes</span>`,
    subtitle: cat.subtitle,
    seoTitle: cat.seoTitle,
    seoText: cat.seoText,
    ctaText: cat.ctaText,
    subcategories: cat.subcategories.map(s => s.label),
    demoPros: [],
  };
}

export async function generateStaticParams() {
  const categories = await dbGetCategories();
  return categories.map(c => ({ category: c.slug }));
}

async function resolve(slug: string): Promise<CategoryRecord | null> {
  const categories = await dbGetCategories();
  return categories.find(c => c.slug === slug) || null;
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const cat = await resolve(category);
  if (!cat) return { title: "Page introuvable | Prolocal-Landes" };

  const url = `${baseUrl}/categories/${cat.slug}`;
  return {
    title: `${cat.seoTitle} | Prolocal-Landes`,
    description: cat.subtitle,
    alternates: { canonical: url },
    openGraph: {
      title: `${cat.seoTitle} | Prolocal-Landes`,
      description: cat.subtitle,
      url,
      siteName: "Prolocal-Landes",
      locale: "fr_FR",
      type: "website",
    },
  };
}

export default async function Page({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = await resolve(category);
  if (!cat) notFound();

  const meta = toMeta(cat);
  const url = `${baseUrl}/categories/${cat.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: baseUrl },
          { "@type": "ListItem", position: 2, name: "Catégories", item: `${baseUrl}/categories` },
          { "@type": "ListItem", position: 3, name: meta.category, item: url },
        ],
      },
      {
        "@type": "CollectionPage",
        name: meta.seoTitle,
        description: meta.subtitle,
        url,
        isPartOf: { "@type": "WebSite", name: "Prolocal-Landes", url: baseUrl },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryPage meta={meta} />
    </>
  );
}
