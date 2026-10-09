import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryPage, { type CategoryMeta } from "@/components/category/CategoryPage";
import { dbGetCategories } from "@/lib/db/categories";
import { dbGetProfessionalsByCategory } from "@/lib/db/professionals";
import type { CategoryRecord } from "@/lib/categories";
import { buildProfileUrl } from "@/lib/profileUrl";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.prolocal-landes.fr";

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
  const initialPros = await dbGetProfessionalsByCategory(cat.label);
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
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: initialPros.length,
          itemListElement: initialPros.map((pro, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${baseUrl}${buildProfileUrl(pro)}`,
            name: pro.companyName,
          })),
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `Combien y a-t-il de professionnels en ${meta.category} référencés dans les Landes ?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${initialPros.length} professionnel${initialPros.length > 1 ? "s" : ""} en ${meta.category} ${initialPros.length > 1 ? "sont" : "est"} actuellement référencé${initialPros.length > 1 ? "s" : ""} sur Prolocal-Landes.`,
            },
          },
          {
            "@type": "Question",
            name: `Comment choisir un bon professionnel en ${meta.category} dans les Landes ?`,
            acceptedAnswer: { "@type": "Answer", text: "Comparez les fiches détaillées, les avis vérifiés laissés par d'autres clients, et contactez directement le professionnel par téléphone, email ou WhatsApp depuis sa fiche sur Prolocal-Landes." },
          },
          {
            "@type": "Question",
            name: `Comment référencer mon entreprise en ${meta.category} ?`,
            acceptedAnswer: { "@type": "Answer", text: "Rendez-vous sur la page d'inscription, renseignez votre numéro SIREN et complétez les informations demandées sur votre activité. Votre fiche sera visible sur Prolocal-Landes.fr dans les 24h." },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryPage meta={meta} initialPros={initialPros} />
    </>
  );
}
