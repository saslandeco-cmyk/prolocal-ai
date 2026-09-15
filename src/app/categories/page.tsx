import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { CITY_META } from "@/lib/cityData";
import { dbGetCategories } from "@/lib/db/categories";

export const revalidate = 3600;

export default async function CategoriesPage() {
  const categories = await dbGetCategories();
  return (
    <div className="bg-landes-cream min-h-screen">

      {/* Hero */}
      <section className="relative bg-landes-hero overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 right-20 w-72 h-72 rounded-full bg-landes-sky blur-3xl" />
          <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-300 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-landes-sand font-medium">Catégories</span>
          </nav>

          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
              Toutes les catégories<br />
              <span className="text-landes-sand">de professionnels</span>
            </h1>
            <p className="text-gray-300 text-lg">
              Explorez les {categories.length} catégories de professionnels référencés dans les Landes (40).
              Cliquez sur une catégorie pour découvrir tous les prestataires disponibles près de chez vous.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 50L1440 50L1440 15C1200 40 960 5 720 25C480 45 240 5 0 15L0 50Z" fill="#FAF7F0"/>
          </svg>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="mb-8">
          <p className="text-sm font-semibold text-landes-sage uppercase tracking-wider mb-1">Explorer</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-landes-pine">
            Choisissez une catégorie
          </h2>
          <p className="text-gray-500 mt-2">
            Chaque catégorie dispose d&apos;une page dédiée avec carte interactive, texte de présentation et liste complète des professionnels.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categories.map(cat => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="card p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group border border-transparent hover:border-landes-sage/20 flex flex-col"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="w-14 h-14 bg-landes-forest/8 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:bg-landes-forest/15 transition-colors">
                  {cat.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-landes-pine text-base group-hover:text-landes-forest transition-colors leading-tight mb-1">
                    {cat.label}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {cat.subtitle}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end">
                <span className="text-xs text-landes-forest font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Voir les professionnels <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Parcourir par ville */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <h2 className="text-xl font-bold text-landes-pine mb-4">Parcourir par ville</h2>
        <div className="flex flex-wrap gap-2">
          {Object.values(CITY_META).map(city => (
            <Link
              key={city.slug}
              href={`/annuaire/${city.slug}`}
              className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:border-landes-sage hover:text-landes-forest transition-colors"
            >
              {city.name}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="bg-landes-pine rounded-3xl p-8 sm:p-12 text-center text-white">
          <div className="text-4xl mb-4">📍</div>
          <h2 className="text-2xl font-bold mb-3">Votre activité n&apos;est pas encore référencée&nbsp;?</h2>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto text-sm leading-relaxed">
            Inscrivez votre entreprise dans notre annuaire des professionnels des Landes et soyez trouvé par des milliers de clients locaux.
          </p>
          <Link
            href="/inscription"
            className="btn-amber inline-flex items-center gap-2 py-3 px-8 text-base"
          >
            Inscrire mon entreprise <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
