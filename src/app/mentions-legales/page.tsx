import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Mentions légales — Prolocal-landes.fr",
  description: "Mentions légales du site Prolocal-landes.fr, annuaire des professionnels des Landes.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="bg-landes-cream min-h-screen">
      <div className="w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-landes-forest hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
        </Link>

        <div className="card p-6 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-landes-pine mb-6">Mentions légales</h1>

          <p className="text-gray-700 leading-relaxed my-3">
            Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique (LCEN), les présentes mentions légales ont pour objet d&apos;informer les utilisateurs du site Prolocal-landes.fr sur l&apos;identité de l&apos;éditeur, de l&apos;hébergeur ainsi que sur les principales conditions d&apos;utilisation du site.
          </p>

          <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">1. Éditeur du site</h2>
          <p className="text-gray-700 leading-relaxed my-3">
            Le site Prolocal-landes.fr accessible à l&apos;adresse :
          </p>
          <p className="text-gray-700 leading-relaxed my-3">
            <a href="https://www.prolocal-landes.fr" className="text-landes-forest hover:underline">https://www.prolocal-landes.fr</a>
          </p>
          <p className="text-gray-700 leading-relaxed my-3">est édité par :</p>

          <div className="bg-landes-cream/60 border border-gray-100 rounded-xl p-4 my-4 text-gray-700 leading-relaxed">
            <p className="font-semibold text-landes-pine">Landeco SAS</p>
            <p>Capital social : 1000€</p>
            <p>Siège social : Grand Dax Développement – 1 avenue de la Gare – 40100 Dax</p>
            <p>SIREN : 841039928</p>
            <p>SIRET : 84103992800046</p>
            <p>RCS : DAX</p>
            <p>Numéro de TVA intracommunautaire : FR28841039928</p>
            <p>Adresse électronique : <a href="mailto:contact@prolocal-landes.fr" className="text-landes-forest hover:underline">contact@prolocal-landes.fr</a></p>
          </div>

          <h3 className="text-lg font-semibold text-landes-pine mt-6 mb-2">Directeur de la publication</h3>
          <p className="text-gray-700 leading-relaxed my-3">
            Le directeur de la publication est :
          </p>
          <p className="text-gray-700 leading-relaxed my-3">
            Sébastien MURATET en qualité de Dirigeant
          </p>

          <h3 className="text-lg font-semibold text-landes-pine mt-6 mb-2">Responsable de la rédaction</h3>
          <p className="text-gray-700 leading-relaxed my-3">
            Lorsque cette fonction est distincte du directeur de la publication :
          </p>
          <p className="text-gray-700 leading-relaxed my-3">
            Sébastien MURATET
          </p>

          <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">2. Hébergement</h2>
          <p className="text-gray-700 leading-relaxed my-3">Le site est hébergé par :</p>

          <div className="bg-landes-cream/60 border border-gray-100 rounded-xl p-4 my-4 text-gray-700 leading-relaxed">
            <p className="font-semibold text-landes-pine">Vercel Inc.</p>
            <p>340 S Lemon Ave #4133</p>
            <p>Walnut, CA 91789</p>
            <p>États-Unis</p>
            <p>Site Internet : <a href="https://vercel.com/" target="_blank" rel="noopener noreferrer" className="text-landes-forest hover:underline">https://vercel.com/</a></p>
          </div>

          <p className="text-gray-700 leading-relaxed my-3">
            Pour les données relatives à l&apos;hébergement et à l&apos;infrastructure technique, les conditions et politiques de Vercel peuvent s&apos;appliquer en complément des présentes mentions légales.
          </p>
        </div>
      </div>
    </div>
  );
}
