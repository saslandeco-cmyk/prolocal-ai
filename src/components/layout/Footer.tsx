import Link from "next/link";
import { Mail } from "lucide-react";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { CITY_META } from "@/lib/cityData";

// Repli statique (aucun appel base de données dans ce composant rendu sur
// chaque page) — voir DEFAULT_CATEGORIES dans lib/categories.ts, à jour tant
// que l'admin n'a pas renommé/réorganisé le catalogue.
const FOOTER_CATEGORIES = DEFAULT_CATEGORIES;
const FOOTER_CITIES = Object.values(CITY_META).sort((a, b) => a.name.localeCompare(b.name, "fr"));

export default function Footer() {
  return (
    <footer className="bg-landes-pine text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.jpg" alt="Prolocal-landes.fr" className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
              <span className="text-xl font-bold">Prolocal-landes.fr</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
              L'annuaire de référence des professionnels et commerçants du département des Landes (40).
              Trouvez les entreprises locales près de chez vous.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
              <Mail className="w-4 h-4" />
              <span>contact@prolocal-landes.fr</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              <li><Link href="/inscription" className="hover:text-white transition-colors">Référencer mon entreprise</Link></li>
              <li><Link href="/connexion" className="hover:text-white transition-colors">Se connecter</Link></li>
            </ul>
          </div>

          {/* Catégories */}
          <div>
            <h3 className="font-semibold text-white mb-3">Catégories</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              {FOOTER_CATEGORIES.map(cat => (
                <li key={cat.slug}>
                  <Link href={`/categories/${cat.slug}`} className="hover:text-white transition-colors">{cat.label}</Link>
                </li>
              ))}
              <li><Link href="/categories" className="text-landes-sand hover:text-white transition-colors font-medium">Toutes les catégories →</Link></li>
            </ul>
          </div>

          {/* Villes */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-white mb-3">Villes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm text-gray-300">
              {FOOTER_CITIES.map(city => (
                <Link key={city.slug} href={`/annuaire/${city.slug}`} className="hover:text-white transition-colors">{city.name}</Link>
              ))}
            </div>
            <Link href="/annuaire" className="inline-block mt-3 text-landes-sand hover:text-white transition-colors text-sm font-medium">Tout l'annuaire des Landes →</Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-8 pt-6 border-t border-white/10">
          <p className="text-sm text-gray-400">© 2024 Prolocal-landes.fr — Annuaire des Landes (40)</p>
          <div className="flex gap-4 text-sm text-gray-400">
            <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
            <Link href="/cgu" className="hover:text-white transition-colors">CGU</Link>
            <Link href="/protection-donnees-personnelles" className="hover:text-white transition-colors">RGPD</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
