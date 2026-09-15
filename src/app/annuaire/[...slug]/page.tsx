import type { Metadata } from "next";
import { cache } from "react";
import { categoryLabelFromSlug, unslugify, extractIdFromSlug } from "@/lib/profileUrl";
import { cityMetaFromSlug } from "@/lib/cityData";
import { dbGetProfessionalById } from "@/lib/db/professionals";
import { dbGetReviewsByPro } from "@/lib/db/reviews";
import { dbGetCategories } from "@/lib/db/categories";
import { isDbConfigured } from "@/lib/db/client";
import { getGoogleRating, combineRatings } from "@/lib/googlePlaces";
import AnnuaireCatchAllClient from "@/components/professional/AnnuaireCatchAllClient";
import type { Professional } from "@/types";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://prolocal-landes.fr";

/**
 * ÉTAPE 3 de la migration base de données : les pages fiches lisent
 * désormais en priorité depuis la base de données (quand la fiche y a été
 * migrée — voir étape 2, double-écriture), pour un rendu 100% serveur
 * avec des métadonnées exactes et un contenu réellement indexable par
 * Google. Si la fiche n'existe pas encore en base (pas encore
 * enregistrée depuis le déploiement de l'étape 2, ou base non
 * configurée), la page retombe automatiquement sur l'ancien
 * comportement (lecture côté client depuis localStorage) — aucune
 * régression pour les fiches non encore migrées.
 */
function parseSegments(segments: string[]) {
  if (segments.length !== 3) return null;
  const [categorySlugSeg, subcategorySlugSeg, nameSlugSeg] = segments;
  const categoryLabel = categoryLabelFromSlug(categorySlugSeg) || unslugify(categorySlugSeg);
  const subcategoryLabel = subcategorySlugSeg !== "general" ? unslugify(subcategorySlugSeg) : null;
  const id = extractIdFromSlug(nameSlugSeg);
  const nameSlugOnly = id ? nameSlugSeg.slice(0, -(id.length + 1)) : nameSlugSeg;
  const fallbackName = unslugify(nameSlugOnly) || "Fiche professionnelle";
  return { categorySlugSeg, subcategorySlugSeg, categoryLabel, subcategoryLabel, id, fallbackName };
}

const getCategories = cache(() => dbGetCategories());

async function resolveProfessional(id: string | null): Promise<Professional | null> {
  if (!id || !isDbConfigured) return null;
  try {
    return await dbGetProfessionalById(id);
  } catch {
    return null;
  }
}

/**
 * Note combinée (avis internes Prolocal-Landes + avis Google via
 * googlePlaceId, si configuré) — mise en cache par requête (React `cache`)
 * pour n'appeler la base et l'API Google qu'une seule fois, même si
 * generateMetadata() et le composant de page l'utilisent tous les deux.
 */
const getEnrichedRating = cache(async (pro: Professional) => {
  const reviews = await dbGetReviewsByPro(pro.id).catch(() => []);
  const approvedReviews = reviews.filter(r => r.status === "approved");
  const internal = approvedReviews.length > 0
    ? { avg: approvedReviews.reduce((s, r) => s + r.rating, 0) / approvedReviews.length, count: approvedReviews.length }
    : null;

  const google = await getGoogleRating((pro as any).googlePlaceId);
  const combined = combineRatings(internal, google);

  return { internal, google, combined };
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug: segments } = await params;

  // ── Page ville (1 segment) ou ville + catégorie (2 segments) ──
  if (segments.length === 1 || segments.length === 2) {
    const cityMeta = cityMetaFromSlug(segments[0]);
    if (cityMeta) {
      const categories = segments.length === 2 ? await getCategories() : undefined;
      const categoryLabel = segments.length === 2 ? categoryLabelFromSlug(segments[1], categories) : null;
      const url = `${baseUrl}/annuaire/${segments.join("/")}`;
      const title = categoryLabel
        ? `${categoryLabel} à ${cityMeta.name} (${cityMeta.postalCode}) | Prolocal-Landes`
        : `Tous les professionnels et commerçants à ${cityMeta.name} (${cityMeta.postalCode}) | Prolocal-Landes`;
      const description = categoryLabel
        ? `Retrouvez tous les professionnels de la catégorie ${categoryLabel} à ${cityMeta.name}, dans les Landes. Coordonnées, avis et informations pratiques.`
        : cityMeta.seoTitle + `. Retrouvez tous les professionnels et commerçants référencés à ${cityMeta.name} (${cityMeta.postalCode}) sur Prolocal-Landes.`;

      return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { title, description, url, siteName: "Prolocal-Landes", locale: "fr_FR", type: "website" },
      };
    }
  }

  const parsed = parseSegments(segments);
  if (!parsed) return { title: "Fiche professionnelle | Prolocal-Landes" };

  const { categoryLabel, subcategoryLabel, id, fallbackName } = parsed;
  const url = `${baseUrl}/annuaire/${segments.join("/")}`;
  const pro = await resolveProfessional(id);

  if (pro) {
    // ── Fiche trouvée en base : métadonnées 100% exactes et dynamiques ──
    const plainDescription = (pro.shortDescription || pro.description || "")
      .replace(/<[^>]*>/g, "").trim().slice(0, 145);
    const { combined } = await getEnrichedRating(pro);
    const ratingSuffix = combined ? ` ★${combined.avg.toFixed(1)} (${combined.count} avis)` : "";

    const title = `${pro.companyName} — ${pro.subcategory || pro.category} à ${pro.city}${ratingSuffix} | Prolocal-Landes`;
    const description = (plainDescription ||
      `${pro.companyName}, ${pro.category} à ${pro.city} (${pro.postalCode}). Coordonnées et informations sur Prolocal-Landes.`) +
      (combined ? ` Note moyenne : ${combined.avg.toFixed(1)}/5 sur ${combined.count} avis.` : "");

    return {
      title,
      description: description.slice(0, 300),
      keywords: pro.seoKeywords?.length ? pro.seoKeywords : undefined,
      alternates: { canonical: url },
      openGraph: {
        title, description, url,
        siteName: "Prolocal-Landes", locale: "fr_FR", type: "profile",
        images: pro.banner ? [{ url: pro.banner }] : pro.logo ? [{ url: pro.logo }] : undefined,
      },
    };
  }

  // ── Repli : fiche pas encore en base, métadonnées dérivées de l'URL seule ──
  const title = `${fallbackName} — ${subcategoryLabel || categoryLabel} | Prolocal-Landes`;
  const description = `Retrouvez les coordonnées, avis et informations de ${fallbackName}, professionnel référencé dans la catégorie ${categoryLabel}${subcategoryLabel ? ` (${subcategoryLabel})` : ""} sur l'annuaire des Landes.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Prolocal-Landes", locale: "fr_FR", type: "profile" },
  };
}

export default async function AnnuaireCatchAllPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug: segments } = await params;

  // ── Page ville (1 segment) ou ville + catégorie (2 segments) ──
  if (segments.length === 1 || segments.length === 2) {
    const cityMeta = cityMetaFromSlug(segments[0]);
    if (cityMeta) {
      const categories = segments.length === 2 ? await getCategories() : undefined;
      const categoryLabel = segments.length === 2 ? categoryLabelFromSlug(segments[1], categories) : null;
      const url = `${baseUrl}/annuaire/${segments.join("/")}`;

      const cityJsonLd = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: baseUrl },
              { "@type": "ListItem", position: 2, name: "Annuaire", item: `${baseUrl}/annuaire` },
              { "@type": "ListItem", position: 3, name: cityMeta.name, item: `${baseUrl}/annuaire/${cityMeta.slug}` },
              ...(categoryLabel ? [{ "@type": "ListItem", position: 4, name: categoryLabel, item: url }] : []),
            ],
          },
          {
            "@type": "CollectionPage",
            name: categoryLabel ? `${categoryLabel} à ${cityMeta.name}` : `Professionnels à ${cityMeta.name}`,
            url,
            isPartOf: { "@type": "WebSite", name: "Prolocal-Landes", url: baseUrl },
            about: {
              "@type": "Place",
              name: cityMeta.name,
              address: { "@type": "PostalAddress", addressLocality: cityMeta.name, postalCode: cityMeta.postalCode, addressCountry: "FR" },
              geo: { "@type": "GeoCoordinates", latitude: cityMeta.lat, longitude: cityMeta.lng },
            },
          },
          {
            // Questions génériques, cohérentes avec le contenu affiché avant
            // hydratation côté client (la page ville liste les professionnels
            // en JavaScript, donc le nombre exact n'est pas connu ici côté
            // serveur — on évite d'afficher un chiffre qui ne correspondrait
            // pas au contenu visible initial).
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: `Combien y a-t-il de professionnels référencés à ${cityMeta.name} ?`,
                acceptedAnswer: { "@type": "Answer", text: `Retrouvez le nombre exact de professionnels référencés à ${cityMeta.name} directement sur cette page.` },
              },
              {
                "@type": "Question",
                name: `Comment trouver un professionnel de confiance à ${cityMeta.name} ?`,
                acceptedAnswer: { "@type": "Answer", text: "Consultez les fiches détaillées, les avis vérifiés laissés par d'autres clients, et contactez directement le professionnel par téléphone, email ou WhatsApp depuis sa fiche sur Prolocal-Landes." },
              },
              {
                "@type": "Question",
                name: `Comment référencer mon entreprise à ${cityMeta.name} ?`,
                acceptedAnswer: { "@type": "Answer", text: "L'inscription est gratuite et rapide : rendez-vous sur la page d'inscription, renseignez votre numéro SIREN et les informations de votre entreprise. Votre fiche est visible immédiatement sur Prolocal-Landes." },
              },
            ],
          },
        ],
      };

      return (
        <>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(cityJsonLd) }} />
          <AnnuaireCatchAllClient initialData={null} categories={categories} />
        </>
      );
    }
  }

  const parsed = parseSegments(segments);

  let jsonLd: Record<string, unknown> | null = null;
  let initialData: Professional | null = null;

  if (parsed) {
    const { categorySlugSeg, categoryLabel, subcategoryLabel, id, fallbackName } = parsed;
    const url = `${baseUrl}/annuaire/${segments.join("/")}`;
    const pro = await resolveProfessional(id);
    initialData = pro;

    if (pro) {
      // ── Fiche trouvée en base : JSON-LD complet avec vraies données ──
      const { internal, google, combined } = await getEnrichedRating(pro);

      // Horaires d'ouverture au format schema.org (openingHoursSpecification)
      const dayMap: Record<string, string> = {
        monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
        friday: "Friday", saturday: "Saturday", sunday: "Sunday",
      };
      const openingHoursSpecification = pro.openingHours
        ? Object.entries(pro.openingHours)
            .filter(([, h]: [string, any]) => h && !h.closed && h.open && h.close)
            .map(([day, h]: [string, any]) => ({
              "@type": "OpeningHoursSpecification",
              dayOfWeek: dayMap[day] || day,
              opens: h.open,
              closes: h.close,
            }))
        : undefined;

      // Réseaux sociaux / site web disponibles, pour la propriété sameAs
      const sameAs = [pro.website, pro.socialLink, pro.facebookLink, pro.tiktokLink]
        .filter((v): v is string => Boolean(v));

      jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: baseUrl },
              { "@type": "ListItem", position: 2, name: "Annuaire", item: `${baseUrl}/annuaire` },
              { "@type": "ListItem", position: 3, name: pro.category, item: `${baseUrl}/categories/${categorySlugSeg}` },
              { "@type": "ListItem", position: 4, name: pro.companyName, item: url },
            ],
          },
          {
            "@type": "LocalBusiness",
            name: pro.companyName,
            url,
            image: pro.logo || pro.banner || undefined,
            telephone: pro.phone || undefined,
            email: pro.email || undefined,
            category: pro.subcategory || pro.category,
            keywords: pro.seoKeywords?.length ? pro.seoKeywords.join(", ") : undefined,
            address: {
              "@type": "PostalAddress",
              streetAddress: pro.address,
              addressLocality: pro.city,
              postalCode: pro.postalCode,
              addressCountry: "FR",
            },
            ...(pro.lat && pro.lng ? {
              geo: { "@type": "GeoCoordinates", latitude: pro.lat, longitude: pro.lng },
              hasMap: `https://www.google.com/maps/search/?api=1&query=${pro.lat},${pro.lng}`,
            } : {}),
            ...(openingHoursSpecification && openingHoursSpecification.length > 0 ? { openingHoursSpecification } : {}),
            ...(sameAs.length > 0 ? { sameAs } : {}),
            areaServed: "Landes (40), France",
            // Note combinée avis internes Prolocal-Landes + avis Google (si
            // googlePlaceId renseigné et GOOGLE_PLACES_API_KEY configurée).
            ...(combined ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: combined.avg.toFixed(1),
                reviewCount: combined.count,
                bestRating: "5",
                worstRating: "1",
              },
            } : {}),
            // Détail des avis Google, exposés séparément à titre informatif
            // (schema.org ne définit pas de propriété dédiée standardisée
            // pour distinguer la source des avis au sein d'un même
            // aggregateRating — Google recommande de fusionner les sources
            // en une seule note globale, ce qui est fait ci-dessus).
            ...(google ? { additionalProperty: {
              "@type": "PropertyValue",
              name: "Note Google",
              value: `${google.rating}/5 (${google.reviewCount} avis Google)`,
            } } : {}),
          },
        ],
      };
    } else {
      // ── Repli : JSON-LD partiel dérivé de l'URL seule (fiche pas encore en base) ──
      jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: baseUrl },
              { "@type": "ListItem", position: 2, name: "Annuaire", item: `${baseUrl}/annuaire` },
              { "@type": "ListItem", position: 3, name: categoryLabel, item: `${baseUrl}/categories/${categorySlugSeg}` },
              { "@type": "ListItem", position: 4, name: fallbackName, item: url },
            ],
          },
          {
            "@type": "LocalBusiness",
            name: fallbackName,
            url,
            category: subcategoryLabel || categoryLabel,
            areaServed: "Landes (40), France",
          },
        ],
      };
    }
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <AnnuaireCatchAllClient initialData={initialData} />
    </>
  );
}
