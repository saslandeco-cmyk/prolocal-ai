import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Building2, MapPin, Phone, Mail, Globe, ChevronRight, Calendar, Users } from "lucide-react";
import { getEntrepriseBySiret, getEntreprisesBySiren } from "@/lib/sirene/db";
import { buildEntrepriseUrl, extractSiretFromSlug } from "@/lib/sirene/url";
import { phoneHref, formatFrPhoneDisplay, normalizeFrPhone } from "@/lib/phone";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.prolocal-landes.fr";

/**
 * Pages entreprises générées automatiquement — étape 5.
 *
 * Format d'URL : /entreprises/[commune]/[nom-entreprise]-[siret]
 * Route catch-all dédiée à l'espace /entreprises/*, indépendante de
 * /annuaire/* et /categories/* (aucun conflit de routage possible).
 *
 * ⚠️ Pages volontairement NON INDEXABLES (robots: noindex) — décision prise
 * après l'étape 5, pour ne pas republier en masse des données SIRENE brutes
 * dans les résultats Google tant que ces fiches ne sont pas enrichies. Elles
 * restent accessibles et utiles aux visiteurs du site (lien direct, section
 * "Autres établissements"), simplement absentes du sitemap.xml et exclues
 * de l'indexation.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug: segments } = await params;
  if (segments.length !== 2) return { title: "Entreprise | Prolocal-Landes", robots: { index: false, follow: true } };

  const siret = extractSiretFromSlug(segments[1]);
  if (!siret) return { title: "Entreprise | Prolocal-Landes", robots: { index: false, follow: true } };

  const entreprise = await getEntrepriseBySiret(siret);
  if (!entreprise) return { title: "Entreprise introuvable | Prolocal-Landes", robots: { index: false, follow: true } };

  const nom = entreprise.denomination || entreprise.enseigne || "Entreprise";
  const title = `${nom} — ${entreprise.libelleApe || "Entreprise"} à ${entreprise.commune} | Prolocal-Landes`;
  const description = `${nom}, ${entreprise.libelleApe || "entreprise"} à ${entreprise.commune} (${entreprise.codePostal}). SIRET ${entreprise.siret}. Coordonnées et informations sur Prolocal-Landes.`;
  const url = `${baseUrl}${buildEntrepriseUrl(entreprise)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Prolocal-Landes", locale: "fr_FR", type: "website" },
    robots: { index: false, follow: true },
  };
}

export default async function EntreprisePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug: segments } = await params;
  if (segments.length !== 2) notFound();

  const siret = extractSiretFromSlug(segments[1]);
  if (!siret) notFound();

  const entreprise = await getEntrepriseBySiret(siret);
  if (!entreprise) notFound();

  const autresEtablissements = (await getEntreprisesBySiren(entreprise.siren)).filter(e => e.siret !== siret);
  const nom = entreprise.denomination || entreprise.enseigne || "Entreprise";
  const url = `${baseUrl}${buildEntrepriseUrl(entreprise)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: baseUrl },
          { "@type": "ListItem", position: 2, name: "Entreprises", item: `${baseUrl}/entreprises` },
          { "@type": "ListItem", position: 3, name: entreprise.commune || "Landes", item: `${baseUrl}/entreprises/${segments[0]}` },
          { "@type": "ListItem", position: 4, name: nom, item: url },
        ],
      },
      {
        "@type": "LocalBusiness",
        name: nom,
        url,
        telephone: normalizeFrPhone(entreprise.telephone) || undefined,
        email: entreprise.email || undefined,
        sameAs: entreprise.siteWeb || undefined,
        category: entreprise.libelleApe || undefined,
        address: {
          "@type": "PostalAddress",
          streetAddress: entreprise.adresse || undefined,
          addressLocality: entreprise.commune || undefined,
          postalCode: entreprise.codePostal || undefined,
          addressCountry: "FR",
        },
        ...(entreprise.lat && entreprise.lng ? { geo: { "@type": "GeoCoordinates", latitude: entreprise.lat, longitude: entreprise.lng } } : {}),
        areaServed: "Landes (40), France",
        identifier: entreprise.siret,
      },
    ],
  };

  return (
    <div className="bg-landes-cream min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="bg-landes-hero text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-white/70 mb-4 flex-wrap">
            <Link href="/" className="hover:text-white">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/entreprises" className="hover:text-white">Entreprises</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">{entreprise.commune}</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-2">
            <Building2 className="w-8 h-8 flex-shrink-0" /> {nom}
          </h1>
          {entreprise.libelleApe && <p className="text-white/80">{entreprise.libelleApe}</p>}
          <p className="text-white/60 text-sm mt-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> {entreprise.adresse ? `${entreprise.adresse}, ` : ""}{entreprise.commune} ({entreprise.codePostal})
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="md:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="font-bold text-landes-pine mb-4">Informations légales</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-400">SIRET</dt>
                  <dd className="font-mono text-gray-800">{entreprise.siret}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">SIREN</dt>
                  <dd className="font-mono text-gray-800">{entreprise.siren}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Code APE / NAF</dt>
                  <dd className="text-gray-800">{entreprise.codeApe} {entreprise.libelleApe && `— ${entreprise.libelleApe}`}</dd>
                </div>
                {entreprise.dateCreation && (
                  <div>
                    <dt className="text-gray-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Date de création</dt>
                    <dd className="text-gray-800">{new Date(entreprise.dateCreation).toLocaleDateString("fr-FR")}</dd>
                  </div>
                )}
                {entreprise.trancheEffectif && (
                  <div>
                    <dt className="text-gray-400 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Effectif</dt>
                    <dd className="text-gray-800">{entreprise.trancheEffectif}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-400">Statut</dt>
                  <dd className="text-green-600 font-medium">Établissement actif</dd>
                </div>
              </dl>
              <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                Données issues du répertoire SIRENE (INSEE), synchronisées quotidiennement. Dernière mise à jour : {new Date(entreprise.updatedAt).toLocaleDateString("fr-FR")}.
              </p>
            </div>

            {autresEtablissements.length > 0 && (
              <div className="card p-6">
                <h2 className="font-bold text-landes-pine mb-4">Autres établissements de cette entreprise</h2>
                <div className="space-y-2">
                  {autresEtablissements.map(e => (
                    <Link key={e.siret} href={buildEntrepriseUrl(e)} className="block p-3 rounded-lg border border-gray-100 hover:border-landes-sage transition-colors">
                      <p className="font-medium text-sm text-gray-800">{e.denomination || e.enseigne}</p>
                      <p className="text-xs text-gray-400">{e.adresse}, {e.commune} {e.estSiege && <span className="text-landes-forest font-medium">· Siège social</span>}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Colonne coordonnées */}
          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="font-bold text-landes-pine mb-4">Coordonnées</h2>
              <div className="space-y-3 text-sm">
                {entreprise.telephone ? (
                  <a href={phoneHref(entreprise.telephone)} className="flex items-center gap-2 text-gray-700 hover:text-landes-forest">
                    <Phone className="w-4 h-4 text-landes-sage flex-shrink-0" /> {formatFrPhoneDisplay(entreprise.telephone)}
                  </a>
                ) : (
                  <p className="flex items-center gap-2 text-gray-300"><Phone className="w-4 h-4 flex-shrink-0" /> Non renseigné</p>
                )}
                {entreprise.email ? (
                  <a href={`mailto:${entreprise.email}`} className="flex items-center gap-2 text-gray-700 hover:text-landes-forest break-all">
                    <Mail className="w-4 h-4 text-landes-sage flex-shrink-0" /> {entreprise.email}
                  </a>
                ) : (
                  <p className="flex items-center gap-2 text-gray-300"><Mail className="w-4 h-4 flex-shrink-0" /> Non renseigné</p>
                )}
                {entreprise.siteWeb ? (
                  <a href={entreprise.siteWeb.startsWith("http") ? entreprise.siteWeb : `https://${entreprise.siteWeb}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-700 hover:text-landes-forest break-all">
                    <Globe className="w-4 h-4 text-landes-sage flex-shrink-0" /> {entreprise.siteWeb}
                  </a>
                ) : (
                  <p className="flex items-center gap-2 text-gray-300"><Globe className="w-4 h-4 flex-shrink-0" /> Non renseigné</p>
                )}
              </div>
            </div>

            <div className="card p-6 border border-amber-200 bg-amber-50/40">
              <p className="text-sm font-semibold text-landes-pine mb-1">Vous êtes le dirigeant de cette entreprise ?</p>
              <p className="text-xs text-gray-500 mb-3">
                Créez votre fiche complète sur Prolocal-Landes pour ajouter photos, description, horaires et recevoir des avis clients.
              </p>
              <Link href="/inscription" className="btn-primary w-full text-center text-sm py-2.5 block">
                Créer ma fiche gratuitement
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
