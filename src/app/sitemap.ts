import { MetadataRoute } from "next";
import { CITY_META } from "@/lib/cityData";
import { buildProfileUrl } from "@/lib/profileUrl";
import { dbGetAllProfessionals } from "@/lib/db/professionals";
import { dbGetCategories } from "@/lib/db/categories";
import { isDbConfigured } from "@/lib/db/client";

/**
 * Sitemap.xml — couvre toutes les pages statiques, les pages catégories,
 * les pages ville, et — depuis la migration vers une base de données
 * réelle — les fiches professionnelles individuelles elles-mêmes (quand
 * la base est configurée et alimentée).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.prolocal-landes.fr";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/annuaire`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/categories`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/inscription`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/cgu`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/mentions-legales`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/protection-donnees-personnelles`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categories = await dbGetCategories();

  const categoryRoutes: MetadataRoute.Sitemap = categories.map(cat => ({
    url: `${baseUrl}/categories/${cat.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const subcategoryRoutes: MetadataRoute.Sitemap = categories.flatMap(cat =>
    cat.subcategories.map(sub => ({
      url: `${baseUrl}/categories/${cat.slug}/${sub.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  );

  const cityRoutes: MetadataRoute.Sitemap = Object.values(CITY_META).map(city => ({
    url: `${baseUrl}/annuaire/${city.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  // Fiches professionnelles individuelles — uniquement si la base de
  // données est configurée et alimentée (voir étapes 1-5 de la migration).
  let profileRoutes: MetadataRoute.Sitemap = [];
  if (isDbConfigured) {
    try {
      const professionals = await dbGetAllProfessionals();
      profileRoutes = professionals
        .filter(p => p.status === "active")
        .map(p => ({
          url: `${baseUrl}${buildProfileUrl(p)}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
          changeFrequency: "monthly" as const,
          priority: p.plan === "gold" ? 0.9 : p.plan === "premium" ? 0.7 : 0.5,
        }));
    } catch {
      // Base indisponible ponctuellement : on continue avec le reste du sitemap
    }
  }

  // Les pages entreprises SIRENE (/entreprises/*) sont volontairement non
  // indexables (robots: noindex, voir leurs page.tsx) — donc absentes du
  // sitemap, qui ne doit lister que des pages destinées à être indexées.

  return [...staticRoutes, ...categoryRoutes, ...subcategoryRoutes, ...cityRoutes, ...profileRoutes];
}
