import Link from "next/link";
import { MapPin, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-landes-pine text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8" style={{ display: "none" }}>
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
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
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-white mb-3">Annuaire</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/annuaire" className="hover:text-white transition-colors">Tous les professionnels</Link></li>
              <li><Link href="/annuaire?category=Alimentation" className="hover:text-white transition-colors">Alimentation</Link></li>
              <li><Link href="/annuaire?category=Bâtiment" className="hover:text-white transition-colors">Bâtiment & Travaux</Link></li>
              <li><Link href="/annuaire?category=Tourisme" className="hover:text-white transition-colors">Tourisme</Link></li>
              <li><Link href="/annuaire?category=Santé" className="hover:text-white transition-colors">Santé</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Professionnels</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/inscription" className="hover:text-white transition-colors">S'inscrire</Link></li>
              <li><Link href="/connexion" className="hover:text-white transition-colors">Se connecter</Link></li>
              <li><Link href="/inscription#tarifs" className="hover:text-white transition-colors">Nos tarifs</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
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
