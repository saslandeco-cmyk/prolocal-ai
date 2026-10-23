import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { PLANS } from "@/types";
import { getEffectiveOptionPrices } from "@/lib/db/options";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.prolocal-landes.fr";

export const metadata: Metadata = {
  title: "Services aux professionnels — Formules et tarifs | Prolocal-landes.fr",
  description: "Découvrez les formules Standard, Premium et Gold de Prolocal-landes.fr : fiche entreprise, mise en avant, avis clients, statistiques... Comparez les services proposés aux professionnels landais.",
  alternates: { canonical: `${baseUrl}/services-professionnels` },
  openGraph: {
    title: "Services aux professionnels — Formules et tarifs | Prolocal-landes.fr",
    description: "Comparez les formules Standard, Premium et Gold et les options complémentaires proposées aux professionnels landais.",
    url: `${baseUrl}/services-professionnels`,
    siteName: "Prolocal-Landes", locale: "fr_FR", type: "website",
    images: [{ url: "/logo.jpg", width: 1254, height: 1254, alt: "Prolocal-Landes" }],
  },
};

export default async function ServicesProfessionnelsPage() {
  const optionsCatalog = await getEffectiveOptionPrices();

  const priceOf = (id: string, fallbackAmount: number, fallbackCadence: "month" | "once") => {
    const opt = optionsCatalog[id];
    const amount = opt ? opt.unitAmount / 100 : fallbackAmount;
    const unit = (opt ? opt.cadence : fallbackCadence) === "once" ? "(frais uniques)" : "/mois";
    return { amount: amount.toFixed(0), unit };
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Référencement professionnel Prolocal-landes.fr",
    provider: { "@type": "Organization", name: "Prolocal-Landes", url: baseUrl },
    areaServed: "Landes (40), France",
    url: `${baseUrl}/services-professionnels`,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Formules professionnelles",
      itemListElement: PLANS.map(plan => ({
        "@type": "Offer",
        name: plan.name,
        price: plan.price,
        priceCurrency: "EUR",
      })),
    },
  };

  return (
    <div className="bg-landes-cream min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* HERO */}
      <section className="relative bg-landes-hero overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-20 sm:pb-28 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-landes-sand flex-shrink-0" />
              <span>Services aux professionnels landais</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 sm:mb-5">
              Développez votre visibilité<br />
              <span className="text-landes-sand">auprès des Landais</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-300 max-w-md mx-auto lg:mx-0">
              Fiche entreprise, mise en avant locale, avis clients, statistiques de visite... Découvrez tout ce que Prolocal-landes.fr propose aux professionnels, classé par formule.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/inscription" className="btn-amber flex items-center justify-center gap-2 text-base py-3 px-6">
                Inscrire mon entreprise <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="#formules" className="flex items-center justify-center gap-2 text-sm sm:text-base font-semibold text-white underline underline-offset-4 decoration-white/60 hover:decoration-white transition-colors py-3 px-6">
                Voir les formules
              </Link>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-2xl h-56 sm:h-72 lg:h-80">
            <Image src="/banners/commerce.jpg" alt="Professionnel landais accueillant un client dans son commerce" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 20C1200 50 960 10 720 30C480 50 240 10 0 20L0 60Z" fill="#FAF7F0"/>
          </svg>
        </div>
      </section>

      {/* INTRO */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center">
        <h2 className="section-title">Une formule pour chaque étape de votre développement</h2>
        <p className="text-gray-500 mt-3 leading-relaxed">
          De la simple fiche de coordonnées à la mise en avant prioritaire dans tout le département, choisissez la formule qui correspond à vos besoins. Sans engagement, modifiable à tout moment depuis votre tableau de bord.
        </p>
      </section>

      {/* FORMULES */}
      <section id="formules" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 scroll-mt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {PLANS.map(plan => (
            <div key={plan.id}
              className={`card p-6 sm:p-8 border-2 relative flex flex-col ${plan.highlight ? "border-purple-300 shadow-lg" : "border-gray-100"}`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  Le plus populaire
                </div>
              )}
              <h3 className={`text-xl font-bold mb-1 ${plan.color}`}>{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                {plan.price === 0 ? (
                  <span className="text-4xl font-bold text-gray-900">Gratuit</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-gray-900">{plan.price}€</span>
                    <span className="text-gray-400">/mois</span>
                  </>
                )}
              </div>
              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/inscription"
                className={`mt-auto block text-center py-3 rounded-lg font-semibold transition-all ${
                  plan.highlight
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "border-2 border-landes-forest text-landes-forest hover:bg-landes-forest hover:text-white"
                }`}>
                Choisir {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* OPTIONS COMPLÉMENTAIRES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="section-title">Options complémentaires</h2>
          <p className="text-gray-500 mt-2">À activer à tout moment depuis votre tableau de bord, quelle que soit votre formule. Sans engagement.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <div className="card p-6 sm:p-8 border-2 border-gray-100 flex flex-col">
            <h3 className="text-xl font-bold mb-1 text-landes-forest">Mises en contact</h3>
            <div className="flex items-baseline gap-1 mb-6 flex-wrap">
              <span className="text-4xl font-bold text-gray-900">À partir de 10€</span>
              <span className="text-gray-400">les 5 mises en contact</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Achetez et rechargez vos crédits de mises en contact. Prix dégressifs selon la quantité.
            </p>
          </div>
          <div className="card p-6 sm:p-8 border-2 border-gray-100 flex flex-col">
            <h3 className="text-xl font-bold mb-1 text-landes-forest">Encart publicitaire ciblé</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-gray-900">{priceOf("pub", 25, "month").amount}€</span>
              <span className="text-gray-400">{priceOf("pub", 25, "month").unit}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Afficher une bannière publicitaire de votre fiche sur la page de la catégorie pendant 1 mois.
            </p>
          </div>
          <div className="card p-6 sm:p-8 border-2 border-gray-100 flex flex-col">
            <h3 className="text-xl font-bold mb-1 text-landes-forest">Gestion prospects/clients</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-gray-900">{priceOf("crm", 9, "month").amount}€</span>
              <span className="text-gray-400">{priceOf("crm", 9, "month").unit}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Utiliser un éditeur de devis et de facturation compatible avec la facturation électronique et un outil de gestion des prospects et des clients.
            </p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-landes-pine text-white py-10 sm:py-14 mx-3 sm:mx-8 lg:mx-12 rounded-3xl mb-14 sm:mb-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3">Prêt à référencer votre entreprise ?</h2>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-8">
            Créez votre fiche gratuitement en quelques minutes et changez de formule à tout moment selon vos besoins.
          </p>
          <Link href="/inscription" className="btn-amber inline-flex items-center justify-center gap-2 text-base py-3.5 px-8">
            Inscrire mon entreprise <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
