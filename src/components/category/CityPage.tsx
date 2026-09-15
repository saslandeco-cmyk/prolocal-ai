"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, ChevronRight, Award, ChevronDown } from "lucide-react";
import { getProfessionalsWithImages } from "@/lib/storage";
import { getListingRank } from "@/lib/listingOrder";
import { categorySlug } from "@/lib/profileUrl";
import { CITY_META } from "@/lib/cityData";
import { Professional } from "@/types";
import ProfessionalCard from "@/components/professional/ProfessionalCard";
import type { CityMeta } from "@/lib/cityData";
import { getCategoriesAsync, DEFAULT_CATEGORIES, type CategoryRecord } from "@/lib/categories";

interface Props {
  meta: CityMeta;
  /** Libellé exact de la catégorie si la page croise ville + catégorie (ex: /annuaire/dax/beaute) */
  categoryFilter?: string;
}

/** Formate une liste de catégories en énumération française naturelle ("A, B et C"). */
function joinCategories(cats: string[]): string {
  if (cats.length === 1) return cats[0];
  return `${cats.slice(0, -1).join(", ")} et ${cats[cats.length - 1]}`;
}

export default function CityPage({ meta, categoryFilter }: Props) {
  const [categories, setCategories] = useState<CategoryRecord[]>(DEFAULT_CATEGORIES);
  const [pros, setPros] = useState<Professional[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => { getCategoriesAsync().then(setCategories); }, []);

  useEffect(() => {
    (async () => {
      const all = (await getProfessionalsWithImages()).filter(
        p => p.status === "active" && (p.city || "").toLowerCase() === meta.name.toLowerCase()
      );
      const filtered = categoryFilter
        ? all.filter(p => p.category === categoryFilter)
        : all;
      filtered.sort((a, b) => getListingRank(a) - getListingRank(b));
      setPros(filtered);
      setLoaded(true);

      const present = new Set(all.map(p => p.category));
      setAvailableCategories(categories.map(c => c.label).filter(c => present.has(c)));

      // Sous-catégories réellement présentes, pour la page ville + catégorie
      if (categoryFilter) {
        const presentSubs = new Set(
          filtered.map(p => p.subcategory).filter((s): s is string => Boolean(s))
        );
        const allSubsForCategory = categories.find(c => c.label === categoryFilter)?.subcategories.map(s => s.label) || [];
        setAvailableSubcategories(allSubsForCategory.filter(s => presentSubs.has(s)));
      } else {
        setAvailableSubcategories([]);
      }
    })();
  }, [meta.name, categoryFilter, categories]);

  const title = categoryFilter
    ? `${categoryFilter} à ${meta.name}`
    : `Tous les professionnels et commerçants à ${meta.name} (${meta.postalCode})`;

  const goldPros = pros.filter(p => p.plan === "gold");
  const regularPros = categoryFilter ? pros.filter(p => p.plan !== "gold") : pros;

  const neighborCities = meta.neighbors
    .map(slug => CITY_META[slug])
    .filter(Boolean);

  const faqItems = [
    {
      q: `Combien y a-t-il de professionnels référencés à ${meta.name} ?`,
      a: loaded
        ? `${pros.length} professionnel${pros.length > 1 ? "s" : ""}${categoryFilter ? ` dans la catégorie ${categoryFilter}` : ""} ${pros.length > 1 ? "sont" : "est"} actuellement référencé${pros.length > 1 ? "s" : ""} à ${meta.name} sur Prolocal-Landes${!categoryFilter && availableCategories.length > 0 ? `, répartis dans ${availableCategories.length} catégorie${availableCategories.length > 1 ? "s" : ""}` : ""}.`
        : `Retrouvez le nombre exact de professionnels référencés à ${meta.name} directement sur cette page.`,
    },
    {
      q: `Comment trouver un professionnel de confiance à ${meta.name} ?`,
      a: `Consultez les fiches détaillées, les avis vérifiés laissés par d'autres clients, et contactez directement le professionnel par téléphone, email ou WhatsApp depuis sa fiche sur Prolocal-Landes.`,
    },
    {
      q: `Comment référencer mon entreprise à ${meta.name} ?`,
      a: `L'inscription est gratuite et rapide : rendez-vous sur la page d'inscription, renseignez votre numéro SIREN et les informations de votre entreprise. Votre fiche est visible immédiatement sur Prolocal-Landes.`,
    },
  ];

  return (
    <div className="bg-landes-cream min-h-screen">
      {/* Hero */}
      <section className="bg-landes-hero text-white">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-white/70 mb-4">
            <Link href="/" className="hover:text-white">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/annuaire" className="hover:text-white">Annuaire</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">{meta.name}</span>
            {categoryFilter && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white">{categoryFilter}</span>
              </>
            )}
          </nav>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-2">
            <MapPin className="w-7 h-7 flex-shrink-0" /> {title}
          </h1>
          <p className="text-white/80 max-w-2xl">{meta.seoTitle}</p>
          {/* Statistique dynamique */}
          {loaded && pros.length > 0 && (
            <p className="text-white/70 text-sm mt-3">
              {pros.length} professionnel{pros.length > 1 ? "s" : ""} référencé{pros.length > 1 ? "s" : ""}
              {!categoryFilter && availableCategories.length > 0
                ? `, répartis dans ${availableCategories.length} catégorie${availableCategories.length > 1 ? "s" : ""}`
                : ""}
            </p>
          )}
        </div>
      </section>

      <section id="resultats" className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 scroll-mt-20">
        {/* Texte d'introduction — court paragraphe local unique + paragraphe
            dynamique ciblé par métier (les vraies catégories présentes dans
            la ville), pour capter les recherches type "métier + ville" */}
        {!categoryFilter && (
          <div className="card p-6 mb-8 space-y-3 text-gray-700 leading-relaxed">
            {meta.intro.map((p, i) => <p key={i}>{p}</p>)}
            {loaded && availableCategories.length > 0 && (
              <p>
                Vous cherchez un professionnel à {meta.name} ? Prolocal-Landes référence notamment
                des professionnels en {joinCategories(availableCategories)} à {meta.name}.
                Que vous ayez besoin d&apos;un devis rapide ou d&apos;un service de proximité, retrouvez
                ci-dessous tous les professionnels de {meta.name} classés par catégorie, avec leurs
                coordonnées, avis clients et disponibilités.
              </p>
            )}
          </div>
        )}

        {/* Texte d'introduction — page ville + catégorie : paragraphe dynamique
            ciblé par SOUS-catégorie (les vraies spécialités présentes), pour
            capter des recherches encore plus précises type "coiffeur à Dax" */}
        {categoryFilter && loaded && (
          <div className="card p-6 mb-8 text-gray-700 leading-relaxed">
            <p>
              {availableSubcategories.length > 0 ? (
                <>
                  À {meta.name}, retrouvez des professionnels spécialisés en{" "}
                  {joinCategories(availableSubcategories)} au sein de la catégorie {categoryFilter}.
                  Consultez les fiches ci-dessous pour trouver le bon interlocuteur selon votre besoin précis,
                  avec coordonnées, avis clients et disponibilités.
                </>
              ) : (
                <>
                  Retrouvez ci-dessous tous les professionnels de la catégorie {categoryFilter} référencés
                  à {meta.name}, avec leurs coordonnées, avis clients et disponibilités.
                </>
              )}
            </p>
          </div>
        )}

        {/* Puces de filtre par catégorie */}
        {availableCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap sm:overflow-visible mb-6">
            <Link
              href={`/annuaire/${meta.slug}`}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex-shrink-0 whitespace-nowrap ${
                !categoryFilter
                  ? "bg-landes-forest text-white border-landes-forest"
                  : "bg-white text-gray-600 border-gray-200 hover:border-landes-sage hover:text-landes-forest"
              }`}
            >
              Toutes catégories
            </Link>
            {availableCategories.map(cat => (
              <Link
                key={cat}
                href={`/annuaire/${meta.slug}/${categorySlug(cat)}`}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex-shrink-0 whitespace-nowrap ${
                  categoryFilter === cat
                    ? "bg-landes-forest text-white border-landes-forest"
                    : "bg-white text-gray-600 border-gray-200 hover:border-landes-sage hover:text-landes-forest"
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        )}

        {/* Mis en avant (professionnels Gold de la ville) */}
        {loaded && goldPros.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-landes-pine mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Mis en avant à {meta.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {goldPros.map(pro => <ProfessionalCard key={pro.id} pro={pro} />)}
            </div>
          </div>
        )}

        {/* Résultats */}
        {!loaded ? (
          <div className="text-center py-16 text-gray-400">Chargement…</div>
        ) : pros.length === 0 ? (
          <div className="text-center py-16 card">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-bold text-landes-pine text-lg mb-2">Aucun professionnel trouvé</h3>
            <p className="text-gray-500 text-sm mb-6">
              {categoryFilter
                ? `Aucun professionnel de la catégorie "${categoryFilter}" n'est encore référencé à ${meta.name}.`
                : `Aucun professionnel n'est encore référencé à ${meta.name}.`}
            </p>
            <Link href="/inscription" className="btn-primary inline-flex items-center gap-2">
              Référencer mon entreprise ici
            </Link>
          </div>
        ) : (
          <>
            {goldPros.length > 0 && regularPros.filter(p => p.plan !== "gold").length > 0 && (
              <h2 className="text-lg font-bold text-landes-pine mb-3">Tous les professionnels</h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(goldPros.length > 0 ? regularPros.filter(p => p.plan !== "gold") : pros).map(pro => (
                <ProfessionalCard key={pro.id} pro={pro} />
              ))}
            </div>
          </>
        )}

        {/* FAQ locale */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-landes-pine mb-4">Questions fréquentes</h2>
          <div className="space-y-2">
            {faqItems.map((item, i) => (
              <div key={i} className="card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left"
                >
                  <span className="font-semibold text-landes-pine text-sm">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <p className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Villes voisines */}
        {!categoryFilter && neighborCities.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-bold text-landes-pine mb-3">Villes voisines</h2>
            <div className="flex flex-wrap gap-2">
              {neighborCities.map(city => (
                <Link
                  key={city.slug}
                  href={`/annuaire/${city.slug}`}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:border-landes-sage hover:text-landes-forest transition-colors"
                >
                  {city.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
