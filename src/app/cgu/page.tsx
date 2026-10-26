import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Conditions Générales d'Utilisation — Prolocal-landes.fr",
  description: "Conditions Générales d'Utilisation (CGU) du site Prolocal-landes.fr, annuaire des professionnels des Landes.",
  alternates: { canonical: "/cgu" },
};

export default function CguPage() {
  return (
    <div className="bg-landes-cream min-h-screen">
      <div className="w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-landes-forest hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
        </Link>

        <div className="card p-6 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-landes-pine mb-1">CONDITIONS GÉNÉRALES D’UTILISATION (CGU)</h1>
          <p className="text-sm text-gray-400 mb-6">Dernière mise à jour : Septembre 2026</p>

        <p className="text-gray-700 leading-relaxed my-3">Bienvenue sur Prolocal-landes.fr, annuaire en ligne dédié aux professionnels, entreprises, artisans, commerçants et prestataires de services exerçant dans le département des Landes.</p>
        <p className="text-gray-700 leading-relaxed my-3">L’utilisation du site Prolocal-landes.fr implique l’acceptation pleine et entière des présentes Conditions Générales d’Utilisation (CGU).</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">1. Objet</h2>
        <p className="text-gray-700 leading-relaxed my-3">Les présentes CGU ont pour objet de définir les conditions d’accès et d’utilisation du site Prolocal-landes.fr, ci-après désigné « le Site ».</p>
        <p className="text-gray-700 leading-relaxed my-3">Le Site a notamment pour vocation de :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>référencer des professionnels et entreprises exerçant dans les Landes ;</li>
          <li>permettre aux internautes de rechercher des professionnels par activité et/ou localisation ;</li>
          <li>présenter des informations relatives aux professionnels référencés ;</li>
          <li>permettre aux professionnels de créer, compléter ou gérer une fiche professionnelle, lorsque cette fonctionnalité est proposée ;</li>
          <li>faciliter la mise en relation entre particuliers, entreprises et professionnels.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">Le Site constitue un service d’annuaire et de mise en relation. Sauf mention contraire, il n&apos;agit pas en qualité d&apos;intermédiaire dans la conclusion ou l&apos;exécution des prestations entre les utilisateurs et les professionnels référencés.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">2. Éditeur du Site</h2>
        <p className="text-gray-700 leading-relaxed my-3">Le Site est édité par :</p>
        <p className="text-gray-700 leading-relaxed my-3">LANDECO SAS SASU au capital de 1000 € Siège social : Grand Dax Développement – 1 avenue de la Gare – 40100 Dax SIREN : 841039928 SIRET : 84103992800046 RCS : DAX TVA intracommunautaire FR28841039928 Email : contact@prolocal-landes.fr</p>
        <p className="text-gray-700 leading-relaxed my-3">Directeur de la publication : Sébastien MURATET</p>
        <p className="text-gray-700 leading-relaxed my-3">Hébergeur :</p>
        <p className="text-gray-700 leading-relaxed my-3">Vercel Inc. 440 N Barranca Ave #4133 - Covina, CA 91723 - États-Unis https://vercel.com</p>
        <p className="text-gray-700 leading-relaxed my-3">Les informations complètes relatives à l’éditeur et à l’hébergeur sont également disponibles dans les Mentions légales du Site.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">3. Définitions</h2>
        <p className="text-gray-700 leading-relaxed my-3">Dans les présentes CGU :</p>
        <p className="text-gray-700 leading-relaxed my-3">« Site » désigne la plateforme Prolocal-landes.fr et l&apos;ensemble de ses pages, fonctionnalités et services.</p>
        <p className="text-gray-700 leading-relaxed my-3">« Utilisateur » désigne toute personne consultant ou utilisant le Site.</p>
        <p className="text-gray-700 leading-relaxed my-3">« Professionnel » désigne toute entreprise, société, association, artisan, commerçant, indépendant ou prestataire référencé sur le Site.</p>
        <p className="text-gray-700 leading-relaxed my-3">« Fiche professionnelle » désigne la page consacrée à un professionnel ou une entreprise référencée sur le Site.</p>
        <p className="text-gray-700 leading-relaxed my-3">« Contenu » désigne notamment les textes, photographies, logos, coordonnées, descriptions, avis, commentaires et autres informations publiés sur le Site.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">4. Accès au Site</h2>
        <p className="text-gray-700 leading-relaxed my-3">Le Site est accessible gratuitement à tout utilisateur disposant d&apos;un accès à Internet, sous réserve des éventuelles fonctionnalités ou services payants proposés aux professionnels.</p>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;utilisateur est responsable de son équipement informatique, de sa connexion Internet et de tout coût éventuellement facturé par son fournisseur d&apos;accès.</p>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;éditeur s&apos;efforce d&apos;assurer l&apos;accessibilité du Site 24 heures sur 24 et 7 jours sur 7.</p>
        <p className="text-gray-700 leading-relaxed my-3">Toutefois, l&apos;éditeur ne peut garantir une disponibilité permanente du Site, notamment en cas :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>de maintenance ;</li>
          <li>de mise à jour ;</li>
          <li>de panne technique ;</li>
          <li>de défaillance du réseau ;</li>
          <li>d&apos;incident affectant l&apos;hébergement ;</li>
          <li>de force majeure.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;éditeur peut temporairement suspendre l&apos;accès à tout ou partie du Site lorsque cela est nécessaire à son fonctionnement, sa maintenance ou sa sécurité.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">5. Référencement des professionnels</h2>
        <p className="text-gray-700 leading-relaxed my-3">Le Site peut référencer des professionnels à partir de différentes sources d&apos;informations, notamment :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>des informations communiquées directement par les professionnels ;</li>
          <li>des données publiques ou légalement accessibles ;</li>
          <li>des informations provenant de bases de données d&apos;entreprises ;</li>
          <li>des informations recueillies ou vérifiées par l&apos;éditeur ;</li>
          <li>des demandes d&apos;inscription effectuées par les professionnels.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">La présence d&apos;un professionnel dans l&apos;annuaire ne constitue pas une recommandation, certification, accréditation ou garantie de la qualité de ses prestations.</p>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;utilisateur est invité à effectuer ses propres vérifications avant de faire appel à un professionnel, notamment concernant :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>son identité ;</li>
          <li>son activité ;</li>
          <li>ses coordonnées ;</li>
          <li>ses tarifs ;</li>
          <li>ses qualifications ;</li>
          <li>ses assurances ;</li>
          <li>ses certifications ou autorisations éventuelles.</li>
        </ul>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">6. Exactitude des informations</h2>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;éditeur met en œuvre des moyens raisonnables afin de maintenir des informations aussi exactes et à jour que possible.</p>
        <p className="text-gray-700 leading-relaxed my-3">Cependant, compte tenu notamment de l&apos;évolution permanente des activités professionnelles et des données publiées, l&apos;éditeur ne peut garantir l&apos;exactitude, l&apos;exhaustivité ou l&apos;actualité de toutes les informations présentes sur le Site.</p>
        <p className="text-gray-700 leading-relaxed my-3">Les professionnels référencés sont responsables des informations qu&apos;ils transmettent ou valident.</p>
        <p className="text-gray-700 leading-relaxed my-3">Un professionnel peut demander la correction ou la mise à jour des informations le concernant en contactant l&apos;éditeur à l&apos;adresse suivante :</p>
        <p className="text-gray-700 leading-relaxed my-3">contact@prolocal-landes.fr</p>
        <p className="text-gray-700 leading-relaxed my-3">Toute demande pourra faire l&apos;objet d&apos;une vérification afin d&apos;éviter les modifications frauduleuses.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">7. Création d&apos;un compte professionnel</h2>
        <p className="text-gray-700 leading-relaxed my-3">Lorsque le Site propose la création d&apos;un compte professionnel, le professionnel s&apos;engage à fournir des informations exactes, complètes et à jour.</p>
        <p className="text-gray-700 leading-relaxed my-3">Le professionnel doit notamment :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>utiliser ses propres informations ;</li>
          <li>ne pas usurper l&apos;identité d&apos;un tiers ;</li>
          <li>ne pas créer plusieurs comptes dans le but de manipuler le référencement de l&apos;annuaire ;</li>
          <li>conserver confidentiels ses identifiants de connexion ;</li>
          <li>informer rapidement l&apos;éditeur en cas d&apos;utilisation frauduleuse de son compte.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">Le professionnel est responsable des actions effectuées depuis son compte.</p>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;éditeur se réserve le droit de suspendre ou supprimer un compte en cas de non-respect des présentes CGU.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">8. Publication des fiches professionnelles</h2>
        <p className="text-gray-700 leading-relaxed my-3">Selon les fonctionnalités proposées par le Site, les professionnels peuvent être autorisés à publier ou modifier certaines informations relatives à leur activité.</p>
        <p className="text-gray-700 leading-relaxed my-3">Le professionnel garantit qu&apos;il dispose des droits nécessaires pour publier les contenus qu&apos;il transmet au Site.</p>
        <p className="text-gray-700 leading-relaxed my-3">Il garantit notamment que les photographies, textes, logos, marques et autres éléments transmis :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>ne portent pas atteinte aux droits de tiers ;</li>
          <li>ne constituent pas une contrefaçon ;</li>
          <li>ne portent pas atteinte au droit à l&apos;image ;</li>
          <li>ne contiennent pas de contenu illicite ;</li>
          <li>ne présentent pas de fausses informations volontairement trompeuses.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;éditeur peut refuser, modifier, dépublier ou supprimer un contenu qui ne respecte pas les présentes CGU ou la législation applicable.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">9. Contenus interdits</h2>
        <p className="text-gray-700 leading-relaxed my-3">Il est interdit d&apos;utiliser le Site pour publier ou transmettre des contenus :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>illégaux ou contraires à l&apos;ordre public ;</li>
          <li>diffamatoires ou injurieux ;</li>
          <li>discriminatoires ou haineux ;</li>
          <li>pornographiques ou pédopornographiques ;</li>
          <li>violents ou faisant l&apos;apologie de violences ;</li>
          <li>trompeurs ou frauduleux ;</li>
          <li>portant atteinte à la vie privée d&apos;un tiers ;</li>
          <li>portant atteinte aux droits de propriété intellectuelle ;</li>
          <li>contenant des logiciels malveillants ou liens dangereux ;</li>
          <li>destinés à collecter frauduleusement des données personnelles ;</li>
          <li>constituant du spam ou de la publicité abusive ;</li>
          <li>destinés à manipuler artificiellement les résultats de recherche ou les avis.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">Tout contenu ne respectant pas ces règles pourra être retiré sans préavis.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">10. Avis et commentaires</h2>
        <p className="text-gray-700 leading-relaxed my-3">Lorsque le Site permet aux utilisateurs de publier des avis ou commentaires, ceux-ci doivent correspondre à une expérience réelle et respecter les présentes CGU.</p>
        <p className="text-gray-700 leading-relaxed my-3">Il est notamment interdit de publier :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>de faux avis ;</li>
          <li>des avis rémunérés non signalés ;</li>
          <li>des avis rédigés par une personne n&apos;ayant pas utilisé le service concerné ;</li>
          <li>plusieurs avis artificiels destinés à favoriser ou nuire à un professionnel ;</li>
          <li>des propos insultants, diffamatoires ou menaçants ;</li>
          <li>des informations personnelles concernant des tiers ;</li>
          <li>des contenus sans rapport avec le professionnel concerné.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;éditeur peut mettre en place un système de modération et supprimer tout avis manifestement contraire aux règles du Site ou à la législation applicable.</p>
        <p className="text-gray-700 leading-relaxed my-3">Les professionnels peuvent signaler un avis qu&apos;ils estiment illicite ou contraire aux règles du Site.</p>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;éditeur peut demander des éléments permettant de vérifier la réalité d&apos;une expérience lorsque cela est nécessaire.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">11. Signalement d&apos;un contenu</h2>
        <p className="text-gray-700 leading-relaxed my-3">Tout utilisateur peut signaler un contenu qu&apos;il estime :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>illégal ;</li>
          <li>trompeur ;</li>
          <li>frauduleux ;</li>
          <li>diffamatoire ;</li>
          <li>contraire aux présentes CGU ;</li>
          <li>portant atteinte à ses droits.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">Le signalement peut être effectué à l&apos;adresse :</p>
        <p className="text-gray-700 leading-relaxed my-3">contact@prolocal-landes.fr</p>
        <p className="text-gray-700 leading-relaxed my-3">Le signalement devra, dans la mesure du possible, préciser :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>l&apos;URL de la page concernée ;</li>
          <li>la nature du contenu contesté ;</li>
          <li>les motifs du signalement ;</li>
          <li>tout élément permettant de comprendre et vérifier la situation.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;éditeur examinera le signalement dans un délai raisonnable et pourra prendre les mesures appropriées.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">12. Mise en relation entre utilisateurs et professionnels</h2>
        <p className="text-gray-700 leading-relaxed my-3">Le Site peut proposer différents moyens de contact entre utilisateurs et professionnels, notamment :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>téléphone ;</li>
          <li>email ;</li>
          <li>formulaire de contact ;</li>
          <li>lien vers le site Internet du professionnel ;</li>
          <li>demande de devis.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;éditeur n&apos;est pas partie aux contrats conclus entre les utilisateurs et les professionnels.</p>
        <p className="text-gray-700 leading-relaxed my-3">Il n&apos;est notamment pas responsable :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>de la qualité des prestations ;</li>
          <li>des prix pratiqués ;</li>
          <li>des délais d&apos;intervention ;</li>
          <li>des rendez-vous ;</li>
          <li>des litiges ;</li>
          <li>des paiements ;</li>
          <li>des dommages éventuellement causés par un professionnel.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">Toute réclamation concernant une prestation doit être adressée directement au professionnel concerné.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">13. Services payants</h2>
        <p className="text-gray-700 leading-relaxed my-3">Le Site peut proposer aux professionnels des offres ou fonctionnalités payantes destinées notamment à améliorer la visibilité de leur fiche.</p>
        <p className="text-gray-700 leading-relaxed my-3">Les conditions tarifaires applicables sont présentées au professionnel avant toute souscription.</p>
        <p className="text-gray-700 leading-relaxed my-3">Le paiement d&apos;un service payant ne garantit aucun classement particulier dans les résultats de recherche, sauf engagement contractuel expressément indiqué.</p>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;éditeur peut proposer différents niveaux de visibilité ou de présentation des fiches professionnelles.</p>
        <p className="text-gray-700 leading-relaxed my-3">Les modalités de renouvellement, de résiliation et de facturation sont précisées au moment de la souscription.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">14. Classement des professionnels</h2>
        <p className="text-gray-700 leading-relaxed my-3">Les résultats affichés dans l&apos;annuaire peuvent être classés selon différents critères, notamment :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>pertinence par rapport à la recherche ;</li>
          <li>activité ;</li>
          <li>localisation ;</li>
          <li>informations renseignées ;</li>
          <li>ancienneté ou complétude de la fiche ;</li>
          <li>disponibilité de certaines fonctionnalités ;</li>
          <li>critères de visibilité proposés par le Site.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">Lorsque certains professionnels bénéficient d&apos;une visibilité supplémentaire dans le cadre d&apos;une offre commerciale, cette situation peut être signalée conformément à la réglementation applicable.</p>
        <p className="text-gray-700 leading-relaxed my-3">Aucun professionnel ne peut exiger un positionnement déterminé dans les résultats, sauf engagement contractuel exprès.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">15. Propriété intellectuelle</h2>
        <p className="text-gray-700 leading-relaxed my-3">Le Site, sa structure, son design, ses textes, son organisation, ses éléments graphiques, ses fonctionnalités, ses bases de données et ses développements sont protégés par les dispositions relatives à la propriété intellectuelle.</p>
        <p className="text-gray-700 leading-relaxed my-3">Toute reproduction, représentation, modification, adaptation, extraction ou exploitation non autorisée de tout ou partie du Site est interdite.</p>
        <p className="text-gray-700 leading-relaxed my-3">Les contenus publiés par les professionnels ou utilisateurs restent leur propriété, sous réserve des droits accordés à l&apos;éditeur pour assurer le fonctionnement du Site.</p>
        <p className="text-gray-700 leading-relaxed my-3">En publiant un contenu sur le Site, l&apos;utilisateur autorise l&apos;éditeur, dans la mesure nécessaire au fonctionnement du service, à le reproduire et le représenter sur le Site et ses supports associés.</p>
        <p className="text-gray-700 leading-relaxed my-3">Cette autorisation est accordée pour la durée nécessaire à la publication du contenu sur le Site et n&apos;emporte pas transfert de propriété.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">16. Base de données</h2>
        <p className="text-gray-700 leading-relaxed my-3">La base de données constituée par l&apos;éditeur peut bénéficier de la protection accordée aux producteurs de bases de données.</p>
        <p className="text-gray-700 leading-relaxed my-3">Toute extraction ou réutilisation substantielle de tout ou partie du contenu de la base de données sans autorisation est interdite.</p>
        <p className="text-gray-700 leading-relaxed my-3">Sont notamment interdits sans autorisation :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>le téléchargement massif des fiches ;</li>
          <li>le scraping automatisé ;</li>
          <li>la copie systématique des données ;</li>
          <li>la constitution d&apos;un annuaire concurrent à partir des données du Site ;</li>
          <li>la réutilisation commerciale non autorisée des données.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;éditeur peut mettre en place des mesures techniques destinées à prévenir les utilisations abusives ou automatisées du Site.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">17. Données personnelles</h2>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;utilisation du Site peut entraîner la collecte et le traitement de données personnelles.</p>
        <p className="text-gray-700 leading-relaxed my-3">Ces traitements sont réalisés conformément à la réglementation applicable, notamment au Règlement général sur la protection des données (RGPD).</p>
        <p className="text-gray-700 leading-relaxed my-3">Les informations relatives aux traitements de données personnelles, aux finalités, aux durées de conservation, aux droits des personnes et aux modalités d&apos;exercice de ces droits sont détaillées dans la Politique de confidentialité du Site.</p>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;utilisateur peut notamment disposer de droits d&apos;accès, de rectification, d&apos;effacement, d&apos;opposition, de limitation et, lorsque les conditions sont réunies, de portabilité de ses données.</p>
        <p className="text-gray-700 leading-relaxed my-3">Pour exercer ses droits :</p>
        <p className="text-gray-700 leading-relaxed my-3">contact@prolocal-landes.fr</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">18. Cookies</h2>
        <p className="text-gray-700 leading-relaxed my-3">Le Site peut utiliser des cookies ou technologies similaires nécessaires à son fonctionnement, à la mesure d&apos;audience, à la personnalisation des services ou à d&apos;autres finalités.</p>
        <p className="text-gray-700 leading-relaxed my-3">Lorsque le consentement de l&apos;utilisateur est requis, celui-ci est recueilli conformément à la réglementation applicable.</p>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;utilisateur peut consulter la Politique de gestion des cookies du Site pour obtenir davantage d&apos;informations.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">19. Liens externes</h2>
        <p className="text-gray-700 leading-relaxed my-3">Le Site peut contenir des liens vers des sites Internet appartenant à des tiers.</p>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;éditeur n&apos;exerce aucun contrôle sur ces sites et ne peut être tenu responsable de leur contenu, de leur disponibilité ou de leurs pratiques.</p>
        <p className="text-gray-700 leading-relaxed my-3">La présence d&apos;un lien vers un site tiers ne constitue pas nécessairement une recommandation ou une approbation de celui-ci.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">20. Responsabilité</h2>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;éditeur met en œuvre des moyens raisonnables pour assurer le bon fonctionnement du Site.</p>
        <p className="text-gray-700 leading-relaxed my-3">Toutefois, sa responsabilité ne saurait être engagée notamment en cas :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>d&apos;interruption temporaire du Site ;</li>
          <li>de défaillance technique ;</li>
          <li>d&apos;erreur ou d&apos;omission dans les informations publiées ;</li>
          <li>d&apos;utilisation frauduleuse du Site par un tiers ;</li>
          <li>de contenu publié par un utilisateur ou un professionnel ;</li>
          <li>de litige entre un utilisateur et un professionnel ;</li>
          <li>de dommage résultant d&apos;un site tiers ;</li>
          <li>d&apos;événement de force majeure.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;utilisateur demeure responsable de l&apos;utilisation qu&apos;il fait du Site et des informations qu&apos;il communique.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">21. Suspension ou suppression d&apos;un compte</h2>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;éditeur peut suspendre ou supprimer un compte professionnel en cas de :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>violation des présentes CGU ;</li>
          <li>publication de contenus illicites ;</li>
          <li>fraude ;</li>
          <li>usurpation d&apos;identité ;</li>
          <li>manipulation des avis ;</li>
          <li>utilisation abusive du Site ;</li>
          <li>tentative de compromettre la sécurité du Site ;</li>
          <li>défaut de paiement lorsqu&apos;un service payant est souscrit.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">Lorsque les circonstances le permettent, l&apos;utilisateur pourra être informé du motif de la suspension ou de la suppression.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">22. Modification des CGU</h2>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;éditeur peut modifier les présentes CGU afin de tenir compte notamment :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>de l&apos;évolution du Site ;</li>
          <li>de l&apos;évolution des services proposés ;</li>
          <li>de changements réglementaires ou législatifs ;</li>
          <li>de l&apos;évolution technique de la plateforme.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">La version applicable est celle publiée sur le Site à la date de l&apos;utilisation du service.</p>
        <p className="text-gray-700 leading-relaxed my-3">La date de dernière mise à jour figure en haut des présentes CGU.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">23. Résiliation</h2>
        <p className="text-gray-700 leading-relaxed my-3">L&apos;utilisateur peut cesser d&apos;utiliser le Site à tout moment.</p>
        <p className="text-gray-700 leading-relaxed my-3">Lorsqu&apos;un professionnel dispose d&apos;un compte, il peut demander sa suppression conformément aux modalités indiquées dans son espace personnel ou en contactant l&apos;éditeur.</p>
        <p className="text-gray-700 leading-relaxed my-3">La suppression d&apos;un compte ne supprime pas nécessairement les informations qui doivent être conservées par l&apos;éditeur en application d&apos;une obligation légale ou pour la défense de ses droits.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">24. Droit applicable</h2>
        <p className="text-gray-700 leading-relaxed my-3">Les présentes CGU sont soumises au droit français.</p>
        <p className="text-gray-700 leading-relaxed my-3">En cas de litige, les parties rechercheront prioritairement une solution amiable.</p>
        <p className="text-gray-700 leading-relaxed my-3">Pour les utilisateurs consommateurs, les règles légales relatives à la compétence territoriale des juridictions demeurent applicables.</p>
        <p className="text-gray-700 leading-relaxed my-3">Pour les professionnels, tout litige relatif à l&apos;utilisation du Site pourra, sous réserve des règles impératives applicables, relever des juridictions compétentes du ressort du siège de l&apos;éditeur.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">25. Contact</h2>
        <p className="text-gray-700 leading-relaxed my-3">Pour toute question concernant les présentes CGU, le fonctionnement de l&apos;annuaire ou le référencement d&apos;un professionnel :</p>
        <p className="text-gray-700 leading-relaxed my-3">Prolocal-landes.fr Email : contact@prolocal-landes.fr Adresse : Grand Dax Développement – 1 avenue de la Gare – 40100 Dax</p>
        <p className="text-gray-700 leading-relaxed my-3">© 2026 Prolocal-landes.fr – Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}
