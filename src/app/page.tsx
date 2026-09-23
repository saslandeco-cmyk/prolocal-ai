"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search, MapPin, ArrowRight,
  Trees, Shield, TrendingUp,
} from "lucide-react";
import { PLANS } from "@/types";
import HeroPubSlideshow from "@/components/ui/HeroPubSlideshow";
import NeedSearchBar from "@/components/ai/NeedSearchBar";
import FeaturedProfessionals from "@/components/professional/FeaturedProfessionals";
import FullWidthMap from "@/components/map/FullWidthMap";
import { getCategoriesAsync, DEFAULT_CATEGORIES, type CategoryRecord } from "@/lib/categories";
import { DEFAULT_BANNERS } from "@/lib/defaultBanners";

const STATS = [
  { value: "500+", label: "Professionnels référencés" },
  { value: "40+",  label: "Communes couvertes" },
  { value: "17",   label: "Catégories" },
  { value: "4.8/5",label: "Note moyenne" },
];

export default function HomePage() {
  const [optionsCatalog, setOptionsCatalog] = useState<Record<string, { unitAmount: number; cadence: string }>>({});
  const [categories, setCategories] = useState<CategoryRecord[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    fetch("/api/db/options")
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.options) setOptionsCatalog(data.options); })
      .catch(() => {});
  }, []);

  useEffect(() => { getCategoriesAsync().then(setCategories); }, []);

  const priceOf = (id: string, fallbackAmount: number, fallbackCadence: "month" | "once") => {
    const opt = optionsCatalog[id];
    const amount = opt ? opt.unitAmount / 100 : fallbackAmount;
    const unit = (opt ? opt.cadence : fallbackCadence) === "once" ? "(frais uniques)" : "/mois";
    return { amount: amount.toFixed(0), unit };
  };

  return (
    <div className="bg-landes-cream">

      {/* HERO */}
      <section className="relative bg-landes-hero overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-landes-sky blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-10 pb-16 sm:pb-20 lg:pb-24">

          {/* Top row — text centré à gauche + slider à droite */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center mb-8 sm:mb-12">

            {/* LEFT — texte centré */}
            <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-landes-sand flex-shrink-0" />
                <span>Annuaire local — Département des Landes (40)</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 sm:mb-5">
                De quoi avez-vous<br />
                <span className="text-landes-sand">besoin ?</span>
              </h1>
              <p className="text-base sm:text-lg text-gray-300 max-w-md">
                Décrivez simplement votre besoin. PROLOCAL AI vous aide à trouver le bon professionnel près de chez vous, dans les Landes.
              </p>
            </div>

            {/* RIGHT — diaporama des encarts publicitaires ciblés */}
            <div className="hidden lg:block">
              <HeroPubSlideshow />
              <p className="text-xs text-white/50 text-center mt-3">
                Pour afficher votre fiche professionnelle dans ce diaporama, choisissez l&apos;option « Encart publicitaire » dans votre tableau de bord.
              </p>
            </div>
          </div>

          {/* Recherche conversationnelle — coeur de PROLOCAL AI */}
          <NeedSearchBar />

          <div className="mt-4 flex justify-center">
            <Link href="/annuaire" className="text-sm sm:text-base font-semibold text-white underline underline-offset-4 decoration-white/60 hover:decoration-white transition-colors">
              Ou parcourir l&apos;annuaire par catégorie
            </Link>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 20C1200 50 960 10 720 30C480 50 240 10 0 20L0 60Z" fill="#FAF7F0"/>
          </svg>
        </div>
      </section>

      {/* FEATURED PROFESSIONALS */}
      <FeaturedProfessionals />

      {/* STATS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" style={{ display: "none" }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.label} className="card p-6 text-center">
              <div className="text-3xl font-bold text-landes-forest mb-1">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <p className="text-sm font-semibold text-landes-sage uppercase tracking-wider mb-1">Explorer</p>
          <h2 className="section-title">Toutes les catégories</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map(cat => {
            const image = DEFAULT_BANNERS[cat.label] ?? null;
            return (
              <div key={cat.slug}
                className="card overflow-hidden hover:shadow-md hover:border-landes-sage/30 border border-transparent transition-all duration-200 group flex flex-col">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-landes-pine/5">
                  {image ? (
                    <img src={image} alt={cat.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">{cat.emoji}</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <h3 className="text-white font-semibold text-sm sm:text-base leading-tight">{cat.label}</h3>
                  </div>
                </div>
                <div className="p-3 sm:p-4 mt-auto">
                  <Link href={`/categories/${cat.slug}`}
                    className="btn-primary w-full block text-center text-sm py-2.5">
                    Voir la catégorie
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SEO TEXT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="bg-landes-pine/5 border border-landes-sage/20 rounded-2xl p-6 sm:p-10">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-landes-pine mb-4 sm:mb-6">
            Vous recherchez un professionnel Landais&nbsp;?
          </h2>
          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-4">
            <p className="font-semibold text-landes-forest text-base">
              Trouvez les pros près de chez vous dans les Landes
            </p>
            <p>
              Vous recherchez un professionnel de confiance dans les Landes pour réaliser vos travaux, trouver un artisan qualifié ou bénéficier d&apos;un service de proximité&nbsp;? Notre plateforme vous permet de trouver les pros près de chez vous dans les Landes en quelques clics. Découvrez une sélection d&apos;entreprises locales, d&apos;artisans, de commerçants et de prestataires de services reconnus pour leur savoir-faire.
            </p>
            <p>
              Que vous soyez à <strong className="text-landes-pine">Mont-de-Marsan</strong>, <strong className="text-landes-pine">Dax</strong>, <strong className="text-landes-pine">Biscarrosse</strong>, <strong className="text-landes-pine">Capbreton</strong>, <strong className="text-landes-pine">Saint-Paul-lès-Dax</strong>, <strong className="text-landes-pine">Tarnos</strong> ou dans une autre commune des Landes, accédez rapidement aux coordonnées de professionnels proches de chez vous.
            </p>
            <p>
              Comparez les prestations, contactez directement les entreprises locales et choisissez le professionnel qui répond le mieux à votre projet. Grâce à notre annuaire local, il devient simple de trouver un expert fiable dans les Landes tout en favorisant les entreprises de proximité.
            </p>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/annuaire" className="btn-primary flex items-center justify-center gap-2 py-3 px-6 w-full sm:w-auto">
              <Search className="w-4 h-4" /> Rechercher un professionnel
            </Link>
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="bg-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-sm font-semibold text-landes-sage uppercase tracking-wider mb-1">Pourquoi nous choisir</p>
            <h2 className="font-bold text-landes-pine text-base sm:text-lg mb-2">Une plateforme créée par un entrepreneur landais, pour les professionnels landais, avec une ambition simple : faire vivre, valoriser et développer l&apos;économie locale.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: MapPin,     title: "100% local",               desc: "Uniquement des professionnels établis dans les Landes (40). Fiches vérifiées par numéro SIREN." },
              { icon: Shield,     title: "Professionnels vérifiés",  desc: "Chaque inscription est validée par notre équipe. Seuls les vrais professionnels sont référencés." },
              { icon: TrendingUp, title: "Boostez votre visibilité", desc: "Soyez trouvé par des milliers de clients locaux qui cherchent vos services près de chez eux." },
            ].map(item => (
              <div key={item.title} className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-landes-forest/10 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-landes-forest" />
                </div>
                <h3 className="font-bold text-landes-pine text-base sm:text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA PROFESSIONNELS — au-dessus des tarifs */}
      <section className="bg-landes-pine text-white py-10 sm:py-16 mx-3 sm:mx-8 lg:mx-12 rounded-3xl">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Trees className="w-8 h-8 sm:w-10 sm:h-10 text-landes-sand flex-shrink-0" />
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Vous êtes professionnel dans les Landes ?</h2>
          </div>

          <div className="space-y-4 text-gray-300 text-sm sm:text-base leading-relaxed mb-8">
            <p>
              Vous êtes artisan, commerçant, entrepreneur, profession libérale ou dirigeant d&apos;une entreprise dans les Landes ? Rejoignez notre annuaire local et donnez davantage de visibilité à votre activité. En vous inscrivant, vous améliorez votre présence sur Internet et augmentez vos chances d&apos;être trouvé par des particuliers et des professionnels qui recherchent un prestataire près de chez eux.
            </p>
            <p>
              Chaque jour, de nombreux internautes recherchent un artisan, une entreprise ou un professionnel de confiance dans les Landes pour réaliser un projet, demander un devis ou bénéficier d&apos;un service de proximité. Grâce à notre annuaire, votre entreprise apparaît auprès d&apos;une audience locale qualifiée, prête à entrer en contact avec un professionnel compétent.
            </p>
            <p>
              Notre plateforme référence des entreprises de tous les secteurs d&apos;activité : bâtiment, rénovation, immobilier, automobile, santé, beauté, restauration, commerce, services à la personne, informatique, communication, métiers du numérique, professions libérales et bien d&apos;autres encore. Que vous soyez installé à <strong className="text-landes-sand">Mont-de-Marsan</strong>, <strong className="text-landes-sand">Dax</strong>, <strong className="text-landes-sand">Biscarrosse</strong>, <strong className="text-landes-sand">Capbreton</strong>, <strong className="text-landes-sand">Hossegor</strong>, <strong className="text-landes-sand">Mimizan</strong>, <strong className="text-landes-sand">Saint-Paul-lès-Dax</strong>, <strong className="text-landes-sand">Tarnos</strong> ou dans toute autre commune des Landes, votre fiche professionnelle permet à vos futurs clients de vous découvrir rapidement.
            </p>
            <p>
              En créant votre profil, vous pouvez présenter votre entreprise, mettre en avant vos compétences, vos prestations, vos coordonnées et les informations essentielles qui faciliteront la prise de contact. Une fiche complète inspire davantage confiance et améliore vos opportunités de recevoir de nouvelles demandes.
            </p>
            <p>
              Être présent dans un annuaire spécialisé dédié aux professionnels landais constitue également un véritable atout pour votre visibilité locale. Votre entreprise bénéficie d&apos;une présence renforcée sur les recherches effectuées par les internautes souhaitant trouver un professionnel dans les Landes, ce qui contribue à développer votre notoriété et à générer davantage de contacts qualifiés.
            </p>
            <p className="font-medium text-white">
              N&apos;attendez plus pour faire connaître votre activité. Inscrivez-vous dans notre annuaire des professionnels des Landes, valorisez votre savoir-faire et soyez trouvé plus facilement par vos futurs clients. Rejoignez dès aujourd&apos;hui les entreprises qui font confiance à notre plateforme pour développer leur visibilité locale et attirer de nouvelles opportunités commerciales.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/inscription"
              className="btn-amber flex items-center justify-center gap-2 text-base py-3.5 sm:py-4 px-6 sm:px-8 w-full sm:w-auto">
              Inscrire mon entreprise <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="tarifs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-sm font-semibold text-landes-sage uppercase tracking-wider mb-1">Tarifs transparents</p>
          <h2 className="section-title">Choisissez votre formule</h2>
          <p className="text-gray-500 mt-2">Sans engagement. Modifiable à tout moment.</p>
        </div>
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
                    <span className="text-green-500 mt-0.5">✓</span>{f}
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

        {/* Options complémentaires */}
        <div className="text-center mt-16 sm:mt-20 mb-10 sm:mb-12">
          <h2 className="section-title">Options complémentaires</h2>
          <p className="text-gray-500 mt-2">Vous pourrez choisir ces options lors de l&apos;enregistrement de votre entreprise. Sans engagement.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
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
            <h3 className="text-xl font-bold mb-1 text-landes-forest">Service de rédaction SEO</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-gray-900">{priceOf("seo", 30, "once").amount}€</span>
              <span className="text-gray-400">{priceOf("seo", 30, "once").unit}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Rédiger une description optimisée pour les moteurs de recherche.
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

      {/* MAP FULL WIDTH — avant le footer */}
      <FullWidthMap />

    </div>
  );
}
