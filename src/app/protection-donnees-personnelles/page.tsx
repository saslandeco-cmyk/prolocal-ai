import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Protection des données personnelles — Prolocal-landes.fr",
  description: "Politique de protection des données personnelles (RGPD) du site Prolocal-landes.fr, annuaire des professionnels des Landes.",
  alternates: { canonical: "/protection-donnees-personnelles" },
};

export default function DonneesPersonnellesPage() {
  return (
    <div className="bg-landes-cream min-h-screen">
      <div className="w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-landes-forest hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
        </Link>

        <div className="card p-6 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-landes-pine mb-1">POLITIQUE DE PROTECTION DES DONNÉES PERSONNELLES</h1>
          <p className="text-sm text-gray-400 mb-6">Dernière mise à jour : 1er septembre 2026</p>

        <p className="text-gray-700 leading-relaxed my-3">La présente Politique de protection des données personnelles a pour objectif d’informer les utilisateurs et les professionnels référencés sur le site Prolocal-landes.fr de la manière dont leurs données personnelles sont collectées, utilisées, conservées et protégées.</p>
        <p className="text-gray-700 leading-relaxed my-3">Cette politique s’applique au site https://prolocal-landes.fr, ainsi qu’aux différents services proposés sur la plateforme.</p>
        <p className="text-gray-700 leading-relaxed my-3">Elle est établie conformément au Règlement (UE) 2016/679 du 27 avril 2016 relatif à la protection des données personnelles (RGPD), ainsi qu’à la loi française « Informatique et Libertés » modifiée.</p>
        <p className="text-gray-700 leading-relaxed my-3">La CNIL rappelle que les informations relatives aux traitements doivent être présentées de manière concise, transparente, compréhensible et facilement accessible.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">1. Responsable du traitement</h2>
        <p className="text-gray-700 leading-relaxed my-3">Le responsable des traitements de données personnelles réalisés sur le site est :</p>
        <p className="text-gray-700 leading-relaxed my-3">SAS LANDECO</p>
        <p className="text-gray-700 leading-relaxed my-3">Siège social : Grand Dax Développement – 1 avenue de la Gare – 40100 Dax</p>
        <p className="text-gray-700 leading-relaxed my-3">SIREN : 841039928</p>
        <p className="text-gray-700 leading-relaxed my-3">SIRET : 84103992800046</p>
        <p className="text-gray-700 leading-relaxed my-3">Email : contact@prolocal-landes.fr</p>
        <p className="text-gray-700 leading-relaxed my-3">Dans la présente politique, Prolocal-landes.fr est désigné par les termes « nous », « notre » ou « l’éditeur ».</p>
        <p className="text-gray-700 leading-relaxed my-3">Pour toute question concernant la protection de vos données personnelles, vous pouvez nous contacter à :</p>
        <p className="text-gray-700 leading-relaxed my-3">contact@prolocal-landes.fr</p>
        <p className="text-gray-700 leading-relaxed my-3">Si un délégué à la protection des données (DPO) est désigné :</p>
        <p className="text-gray-700 leading-relaxed my-3">DPO : Sébastien MURATET</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">2. Principes applicables à la protection des données</h2>
        <p className="text-gray-700 leading-relaxed my-3">Nous accordons une importance particulière à la protection des données personnelles.</p>
        <p className="text-gray-700 leading-relaxed my-3">Dans le cadre de nos activités, nous nous engageons notamment à respecter les principes suivants :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>collecter uniquement les données nécessaires aux finalités poursuivies ;</li>
          <li>informer clairement les personnes concernées ;</li>
          <li>utiliser les données uniquement pour des finalités déterminées et légitimes ;</li>
          <li>conserver les données pendant une durée proportionnée à leur finalité ;</li>
          <li>assurer leur sécurité et leur confidentialité ;</li>
          <li>permettre aux personnes concernées d’exercer leurs droits.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">Ces principes correspondent notamment aux exigences de minimisation, de transparence, de limitation des finalités et de sécurité prévues par le RGPD.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">3. Quelles données personnelles pouvons-nous collecter ?</h2>
        <p className="text-gray-700 leading-relaxed my-3">Selon votre utilisation du site, nous pouvons être amenés à traiter différentes catégories de données.</p>
        <p className="text-gray-700 leading-relaxed my-3">3.1. Données d’identification</p>
        <p className="text-gray-700 leading-relaxed my-3">Il peut notamment s’agir de :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>nom ;</li>
          <li>prénom ;</li>
          <li>nom de l’entreprise ;</li>
          <li>fonction ;</li>
          <li>adresse postale ;</li>
          <li>adresse email ;</li>
          <li>numéro de téléphone ;</li>
          <li>identifiants de connexion.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">3.2. Données relatives à l’activité professionnelle</p>
        <p className="text-gray-700 leading-relaxed my-3">Pour les professionnels référencés, nous pouvons traiter notamment :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>raison sociale ;</li>
          <li>nom commercial ;</li>
          <li>activité ;</li>
          <li>adresse professionnelle ;</li>
          <li>commune ;</li>
          <li>département ;</li>
          <li>numéro SIREN ou SIRET ;</li>
          <li>code APE/NAF ;</li>
          <li>numéro de téléphone professionnel ;</li>
          <li>adresse email professionnelle ;</li>
          <li>site Internet ;</li>
          <li>réseaux sociaux professionnels ;</li>
          <li>horaires d’ouverture ;</li>
          <li>description de l’activité ;</li>
          <li>photographies ;</li>
          <li>logo ;</li>
          <li>informations communiquées pour compléter une fiche professionnelle.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">3.3. Données liées à l’utilisation du site</p>
        <p className="text-gray-700 leading-relaxed my-3">Nous pouvons également traiter certaines données techniques liées à l’utilisation du site, notamment :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>adresse IP ;</li>
          <li>données de connexion ;</li>
          <li>navigateur utilisé ;</li>
          <li>système d’exploitation ;</li>
          <li>pages consultées ;</li>
          <li>date et heure de connexion ;</li>
          <li>données relatives aux cookies et traceurs, lorsque leur utilisation est autorisée.</li>
        </ul>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">4. Données provenant de sources publiques</h2>
        <p className="text-gray-700 leading-relaxed my-3">Notre annuaire peut être alimenté, en tout ou partie, par des informations provenant de sources publiques ou légalement accessibles.</p>
        <p className="text-gray-700 leading-relaxed my-3">Ces informations peuvent notamment provenir :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>de registres publics ;</li>
          <li>de bases de données administratives ;</li>
          <li>de bases de données d’entreprises ;</li>
          <li>de sources institutionnelles ;</li>
          <li>de sites Internet professionnels ;</li>
          <li>d’informations publiées volontairement par les entreprises.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">Certaines données concernant les professionnels peuvent être collectées indirectement, sans avoir été communiquées directement à notre site.</p>
        <p className="text-gray-700 leading-relaxed my-3">Le RGPD impose également une obligation d’information lorsque les données personnelles sont obtenues indirectement, notamment lorsqu’elles proviennent de sources accessibles au public.</p>
        <p className="text-gray-700 leading-relaxed my-3">Nous nous efforçons donc de fournir aux professionnels référencés les informations nécessaires concernant l’utilisation de leurs données et les moyens d’exercer leurs droits.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">5. Pourquoi utilisons-nous vos données ?</h2>
        <p className="text-gray-700 leading-relaxed my-3">Les données personnelles peuvent être utilisées pour les finalités suivantes.</p>
        <p className="text-gray-700 leading-relaxed my-3">Gestion de l’annuaire</p>
        <p className="text-gray-700 leading-relaxed my-3">Nous utilisons les données professionnelles afin de :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>créer et maintenir les fiches professionnelles ;</li>
          <li>permettre la recherche d’entreprises et de professionnels ;</li>
          <li>afficher les informations professionnelles ;</li>
          <li>classer les professionnels selon les critères prévus par le site ;</li>
          <li>faciliter la mise en relation entre utilisateurs et professionnels ;</li>
          <li>maintenir la qualité et l’actualité de l’annuaire.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">Gestion des comptes professionnels</p>
        <p className="text-gray-700 leading-relaxed my-3">Lorsque le professionnel crée un compte, ses données peuvent être utilisées pour :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>créer son espace professionnel ;</li>
          <li>permettre son authentification ;</li>
          <li>gérer sa fiche ;</li>
          <li>lui permettre de modifier ses informations ;</li>
          <li>gérer ses abonnements éventuels ;</li>
          <li>assurer la sécurité de son compte.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">Mise en relation</p>
        <p className="text-gray-700 leading-relaxed my-3">Lorsque l’utilisateur utilise un formulaire de contact ou une fonctionnalité de mise en relation, les données saisies peuvent être utilisées afin de transmettre et traiter la demande auprès du professionnel concerné.</p>
        <p className="text-gray-700 leading-relaxed my-3">Gestion des demandes</p>
        <p className="text-gray-700 leading-relaxed my-3">Nous pouvons utiliser les données afin de répondre :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>aux demandes d’information ;</li>
          <li>aux demandes de modification de fiche ;</li>
          <li>aux demandes de suppression ;</li>
          <li>aux demandes d’exercice des droits ;</li>
          <li>aux signalements ;</li>
          <li>aux réclamations.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">Sécurité</p>
        <p className="text-gray-700 leading-relaxed my-3">Certaines données techniques peuvent être utilisées afin de :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>prévenir les fraudes ;</li>
          <li>détecter les comportements abusifs ;</li>
          <li>protéger les comptes ;</li>
          <li>sécuriser l’infrastructure informatique ;</li>
          <li>prévenir les attaques informatiques.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">Statistiques</p>
        <p className="text-gray-700 leading-relaxed my-3">Lorsque cela est applicable, certaines données peuvent être utilisées pour mesurer l’audience et améliorer le fonctionnement du site.</p>
        <p className="text-gray-700 leading-relaxed my-3">Les cookies ou traceurs nécessitant un consentement ne sont utilisés qu’après obtention de celui-ci.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">6. Bases légales des traitements</h2>
        <p className="text-gray-700 leading-relaxed my-3">Chaque traitement de données personnelles repose sur une base juridique prévue par le RGPD.</p>
        <p className="text-gray-700 leading-relaxed my-3">Selon le traitement concerné, il peut s’agir notamment :</p>
        <p className="text-gray-700 leading-relaxed my-3">Du consentement</p>
        <p className="text-gray-700 leading-relaxed my-3">Lorsque la réglementation l’exige, nous recueillons votre consentement avant de traiter certaines données.</p>
        <p className="text-gray-700 leading-relaxed my-3">Vous pouvez retirer votre consentement à tout moment.</p>
        <p className="text-gray-700 leading-relaxed my-3">Le retrait du consentement n’affecte pas la licéité des traitements effectués avant ce retrait.</p>
        <p className="text-gray-700 leading-relaxed my-3">De l’exécution d’un contrat</p>
        <p className="text-gray-700 leading-relaxed my-3">Certaines données sont nécessaires pour permettre la création et la gestion d’un compte professionnel ou l’exécution d’un service souscrit.</p>
        <p className="text-gray-700 leading-relaxed my-3">D’une obligation légale</p>
        <p className="text-gray-700 leading-relaxed my-3">Certaines données peuvent être conservées ou traitées lorsqu’une obligation légale ou réglementaire nous l’impose.</p>
        <p className="text-gray-700 leading-relaxed my-3">De notre intérêt légitime</p>
        <p className="text-gray-700 leading-relaxed my-3">Certains traitements peuvent être réalisés sur la base de notre intérêt légitime, notamment pour :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>assurer la sécurité du site ;</li>
          <li>prévenir les fraudes ;</li>
          <li>améliorer nos services ;</li>
          <li>assurer le fonctionnement de l’annuaire ;</li>
          <li>maintenir la qualité des données professionnelles.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">Dans ce cas, nous veillons à préserver un équilibre entre nos intérêts et les droits et libertés des personnes concernées.</p>
        <p className="text-gray-700 leading-relaxed my-3">La CNIL rappelle que la base juridique doit être déterminée pour chaque finalité de traitement.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">7. Données obligatoires et facultatives</h2>
        <p className="text-gray-700 leading-relaxed my-3">Lorsque nous collectons directement des données via un formulaire, certaines informations peuvent être obligatoires et d’autres facultatives.</p>
        <p className="text-gray-700 leading-relaxed my-3">Les champs obligatoires sont signalés comme tels.</p>
        <p className="text-gray-700 leading-relaxed my-3">Si une donnée obligatoire n’est pas renseignée, il peut être impossible de fournir le service demandé ou de répondre à la demande concernée.</p>
        <p className="text-gray-700 leading-relaxed my-3">Nous nous efforçons de limiter les données demandées à celles qui sont nécessaires à la finalité poursuivie.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">8. Destinataires des données</h2>
        <p className="text-gray-700 leading-relaxed my-3">Les données personnelles peuvent être accessibles, dans la limite de leurs besoins respectifs, aux :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>membres habilités de notre équipe ;</li>
          <li>prestataires techniques ;</li>
          <li>hébergeurs ;</li>
          <li>fournisseurs de services informatiques ;</li>
          <li>prestataires de messagerie ;</li>
          <li>prestataires de paiement, lorsque cela est nécessaire ;</li>
          <li>prestataires intervenant dans la maintenance ou la sécurité du site ;</li>
          <li>autorités administratives ou judiciaires lorsqu’une obligation légale l’impose.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">Nous ne vendons pas vos données personnelles à des tiers.</p>
        <p className="text-gray-700 leading-relaxed my-3">Lorsque nous faisons appel à un sous-traitant traitant des données personnelles pour notre compte, nous veillons à ce qu’il présente des garanties suffisantes en matière de protection des données.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">9. Publication des données professionnelles</h2>
        <p className="text-gray-700 leading-relaxed my-3">Certaines informations professionnelles peuvent être publiées sur le site afin de permettre aux internautes de trouver et contacter les professionnels référencés.</p>
        <p className="text-gray-700 leading-relaxed my-3">Il peut notamment s’agir de :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>nom de l’entreprise ;</li>
          <li>nom commercial ;</li>
          <li>activité ;</li>
          <li>adresse professionnelle ;</li>
          <li>commune ;</li>
          <li>téléphone professionnel ;</li>
          <li>email professionnel ;</li>
          <li>site Internet ;</li>
          <li>horaires ;</li>
          <li>description de l’activité ;</li>
          <li>photographie ou logo lorsque ceux-ci sont autorisés.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">Les informations publiées sont destinées à faciliter la visibilité des professionnels et la mise en relation avec les internautes.</p>
        <p className="text-gray-700 leading-relaxed my-3">Les données personnelles d’un professionnel qui sont affichées publiquement sur une fiche ne doivent pas être confondues avec les données privées qui peuvent être utilisées pour la gestion interne du service.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">10. Modification ou suppression d’une fiche professionnelle</h2>
        <p className="text-gray-700 leading-relaxed my-3">Un professionnel peut demander la modification des informations figurant sur sa fiche.</p>
        <p className="text-gray-700 leading-relaxed my-3">Il peut également demander la suppression de certaines données lorsque les conditions prévues par la réglementation sont réunies.</p>
        <p className="text-gray-700 leading-relaxed my-3">Toute demande doit être adressée à :</p>
        <p className="text-gray-700 leading-relaxed my-3">contact@prolocal-landes.fr</p>
        <p className="text-gray-700 leading-relaxed my-3">Afin de protéger les professionnels contre les demandes frauduleuses, nous pouvons demander des informations permettant de vérifier l’identité ou la qualité du demandeur.</p>
        <p className="text-gray-700 leading-relaxed my-3">La CNIL reconnaît notamment aux professionnels concernés par des annuaires en ligne des droits sur les données personnelles les concernant, même lorsque ces données proviennent de sources publiquement accessibles.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">11. Durée de conservation</h2>
        <p className="text-gray-700 leading-relaxed my-3">Nous ne conservons les données personnelles que pendant une durée nécessaire aux finalités pour lesquelles elles sont traitées, sous réserve des obligations légales de conservation.</p>
        <p className="text-gray-700 leading-relaxed my-3">À titre indicatif :</p>
        <p className="text-gray-700 leading-relaxed my-3">Compte professionnel : pendant la durée d’existence du compte, puis pendant la durée nécessaire à la gestion des obligations légales et contractuelles.</p>
        <p className="text-gray-700 leading-relaxed my-3">Données de contact : pendant le temps nécessaire au traitement de la demande, puis pendant une durée raisonnable permettant d’assurer le suivi de celle-ci.</p>
        <p className="text-gray-700 leading-relaxed my-3">Demandes d’exercice de droits : pendant la durée nécessaire à leur traitement et conformément aux obligations légales applicables.</p>
        <p className="text-gray-700 leading-relaxed my-3">Données de facturation : pendant la durée imposée par les obligations comptables et fiscales applicables.</p>
        <p className="text-gray-700 leading-relaxed my-3">Données de sécurité et journaux techniques : pendant une durée proportionnée à leur finalité et conformément aux recommandations et obligations applicables.</p>
        <p className="text-gray-700 leading-relaxed my-3">Les durées exactes peuvent varier selon la nature du traitement.</p>
        <p className="text-gray-700 leading-relaxed my-3">La CNIL recommande de définir des durées de conservation adaptées à chaque finalité et de ne pas conserver les données au-delà de ce qui est nécessaire.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">12. Sécurité des données</h2>
        <p className="text-gray-700 leading-relaxed my-3">Nous mettons en œuvre des mesures techniques et organisationnelles destinées à protéger les données personnelles contre :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>la perte ;</li>
          <li>la destruction ;</li>
          <li>l’altération ;</li>
          <li>la divulgation non autorisée ;</li>
          <li>l’accès non autorisé ;</li>
          <li>l’utilisation frauduleuse.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">Ces mesures peuvent notamment comprendre :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>chiffrement des communications HTTPS ;</li>
          <li>contrôle des accès ;</li>
          <li>authentification ;</li>
          <li>sauvegardes ;</li>
          <li>surveillance de l’infrastructure ;</li>
          <li>mesures de protection contre les accès frauduleux ;</li>
          <li>limitation des droits d’accès aux données.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">Malgré les mesures mises en œuvre, aucun système informatique ne peut garantir une sécurité absolue.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">13. Transfert de données hors de l’Union européenne</h2>
        <p className="text-gray-700 leading-relaxed my-3">Certains prestataires techniques utilisés par le site peuvent être établis en dehors de l’Union européenne ou faire intervenir des infrastructures situées dans des pays tiers.</p>
        <p className="text-gray-700 leading-relaxed my-3">Lorsque des données personnelles sont transférées hors de l’Union européenne, nous veillons à ce que le transfert soit encadré conformément au RGPD, notamment par une décision d’adéquation ou par des garanties appropriées lorsque celles-ci sont nécessaires.</p>
        <p className="text-gray-700 leading-relaxed my-3">La liste des principaux prestataires concernés peut être communiquée sur demande.</p>
        <p className="text-gray-700 leading-relaxed my-3">La CNIL recommande d’identifier les éventuels transferts hors de l’Union européenne et de préciser leur cadre juridique.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">14. Cookies et autres traceurs</h2>
        <p className="text-gray-700 leading-relaxed my-3">Le site peut utiliser des cookies et technologies similaires.</p>
        <p className="text-gray-700 leading-relaxed my-3">Certains cookies sont nécessaires au fonctionnement du site et peuvent être utilisés sans consentement lorsqu’ils sont strictement nécessaires au service demandé.</p>
        <p className="text-gray-700 leading-relaxed my-3">D’autres cookies, notamment ceux destinés à certaines mesures d’audience, à la personnalisation ou à la publicité, peuvent nécessiter le consentement de l’utilisateur.</p>
        <p className="text-gray-700 leading-relaxed my-3">Lorsque le consentement est nécessaire, l’utilisateur peut accepter, refuser ou modifier ses choix selon les modalités proposées par le site.</p>
        <p className="text-gray-700 leading-relaxed my-3">Une Politique de cookies spécifique présente les différents cookies utilisés et leurs finalités.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">15. Vos droits</h2>
        <p className="text-gray-700 leading-relaxed my-3">Conformément au RGPD et à la réglementation française applicable, vous disposez, selon les conditions prévues par les textes, des droits suivants :</p>
        <p className="text-gray-700 leading-relaxed my-3">Droit d’accès</p>
        <p className="text-gray-700 leading-relaxed my-3">Vous pouvez demander à savoir si des données personnelles vous concernant sont traitées et, le cas échéant, obtenir une copie de ces données.</p>
        <p className="text-gray-700 leading-relaxed my-3">Droit de rectification</p>
        <p className="text-gray-700 leading-relaxed my-3">Vous pouvez demander la correction de données personnelles inexactes ou incomplètes.</p>
        <p className="text-gray-700 leading-relaxed my-3">Droit à l’effacement</p>
        <p className="text-gray-700 leading-relaxed my-3">Vous pouvez demander la suppression de vos données personnelles lorsque les conditions prévues par le RGPD sont réunies.</p>
        <p className="text-gray-700 leading-relaxed my-3">Droit à la limitation</p>
        <p className="text-gray-700 leading-relaxed my-3">Dans certaines situations, vous pouvez demander que l’utilisation de vos données soit temporairement limitée.</p>
        <p className="text-gray-700 leading-relaxed my-3">Droit d’opposition</p>
        <p className="text-gray-700 leading-relaxed my-3">Vous pouvez vous opposer à certains traitements de vos données lorsque les conditions légales sont réunies, notamment pour certains traitements fondés sur l’intérêt légitime ou à des fins de prospection.</p>
        <p className="text-gray-700 leading-relaxed my-3">Droit à la portabilité</p>
        <p className="text-gray-700 leading-relaxed my-3">Lorsque les conditions prévues par le RGPD sont réunies, vous pouvez demander à recevoir les données personnelles que vous avez fournies dans un format structuré et couramment utilisé.</p>
        <p className="text-gray-700 leading-relaxed my-3">Droit de retirer votre consentement</p>
        <p className="text-gray-700 leading-relaxed my-3">Lorsque le traitement repose sur votre consentement, vous pouvez retirer celui-ci à tout moment.</p>
        <p className="text-gray-700 leading-relaxed my-3">Le retrait du consentement ne remet pas en cause les traitements effectués avant ce retrait.</p>
        <p className="text-gray-700 leading-relaxed my-3">Ces droits sont notamment prévus par les articles 15 à 22 du RGPD.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">16. Comment exercer vos droits ?</h2>
        <p className="text-gray-700 leading-relaxed my-3">Pour exercer vos droits, vous pouvez nous contacter :</p>
        <p className="text-gray-700 leading-relaxed my-3">Par email : contact@prolocal-landes.fr</p>
        <p className="text-gray-700 leading-relaxed my-3">Par courrier :</p>
        <p className="text-gray-700 leading-relaxed my-3">SAS Landeco À l’attention du responsable de la protection des données Grand Dax développement – 1 avenue de la gare – 40100 Dax</p>
        <p className="text-gray-700 leading-relaxed my-3">Votre demande doit préciser le droit que vous souhaitez exercer ainsi que les informations nécessaires pour nous permettre de vous identifier et de traiter votre demande.</p>
        <p className="text-gray-700 leading-relaxed my-3">Nous pouvons demander un justificatif d’identité lorsqu’il existe un doute raisonnable sur l’identité du demandeur.</p>
        <p className="text-gray-700 leading-relaxed my-3">Nous nous efforçons de répondre aux demandes dans les délais prévus par la réglementation.</p>
        <p className="text-gray-700 leading-relaxed my-3">La CNIL rappelle que les personnes doivent disposer d’un moyen simple et accessible pour exercer leurs droits.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">17. Réclamation auprès de la CNIL</h2>
        <p className="text-gray-700 leading-relaxed my-3">Si, après nous avoir contactés, vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la :</p>
        <p className="text-gray-700 leading-relaxed my-3">Commission Nationale de l’Informatique et des Libertés (CNIL)</p>
        <p className="text-gray-700 leading-relaxed my-3">CNIL 3 Place de Fontenoy TSA 80751 75334 Paris Cedex 07 France</p>
        <p className="text-gray-700 leading-relaxed my-3">Site Internet : www.cnil.fr</p>
        <p className="text-gray-700 leading-relaxed my-3">La CNIL constitue l’autorité française chargée de la protection des données personnelles.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">18. Données relatives aux mineurs</h2>
        <p className="text-gray-700 leading-relaxed my-3">Le site n’a pas vocation à collecter volontairement des données personnelles concernant des mineurs dans le cadre de ses services professionnels.</p>
        <p className="text-gray-700 leading-relaxed my-3">Si un mineur utilise certaines fonctionnalités du site, il doit le faire sous la responsabilité de son représentant légal lorsque cela est nécessaire.</p>
        <p className="text-gray-700 leading-relaxed my-3">Si nous découvrons qu’une donnée personnelle a été collectée auprès d’un mineur dans des conditions nécessitant une autorisation qui n’a pas été obtenue, nous prendrons les mesures appropriées.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">19. Prospection commerciale</h2>
        <p className="text-gray-700 leading-relaxed my-3">Lorsque nous adressons des communications commerciales par email ou par tout autre moyen, nous respectons les règles applicables à la prospection commerciale.</p>
        <p className="text-gray-700 leading-relaxed my-3">Lorsque le consentement est requis, celui-ci est recueilli avant l’envoi des communications concernées.</p>
        <p className="text-gray-700 leading-relaxed my-3">Chaque communication commerciale permet, lorsque cela est requis, de se désinscrire facilement.</p>
        <p className="text-gray-700 leading-relaxed my-3">Vous pouvez également exercer votre droit d’opposition en nous contactant à :</p>
        <p className="text-gray-700 leading-relaxed my-3">contact@prolocal-landes.fr</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">20. Liens vers des sites tiers</h2>
        <p className="text-gray-700 leading-relaxed my-3">Le site peut contenir des liens vers des sites Internet appartenant à des tiers.</p>
        <p className="text-gray-700 leading-relaxed my-3">Nous ne contrôlons pas les politiques de protection des données de ces sites.</p>
        <p className="text-gray-700 leading-relaxed my-3">Nous vous recommandons de consulter leur propre politique de confidentialité avant de leur communiquer des données personnelles.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">21. Modification de la présente politique</h2>
        <p className="text-gray-700 leading-relaxed my-3">Nous pouvons modifier la présente Politique de protection des données afin de tenir compte :</p>
        <ul className="list-disc pl-5 space-y-1 my-3 text-gray-700">
          <li>de l’évolution du site ;</li>
          <li>de l’évolution de nos services ;</li>
          <li>de l’évolution de la réglementation ;</li>
          <li>des recommandations de la CNIL ;</li>
          <li>de l’évolution de nos prestataires techniques.</li>
        </ul>
        <p className="text-gray-700 leading-relaxed my-3">La date de dernière mise à jour est indiquée en haut de cette page.</p>
        <p className="text-gray-700 leading-relaxed my-3">Nous vous recommandons de consulter régulièrement cette page.</p>
        <h2 className="text-xl font-bold text-landes-pine mt-8 mb-3">22. Contact</h2>
        <p className="text-gray-700 leading-relaxed my-3">Pour toute question concernant la protection de vos données personnelles :</p>
        <p className="text-gray-700 leading-relaxed my-3">SAS Landeco</p>
        <p className="text-gray-700 leading-relaxed my-3">Adresse : Grand Dax Développement – 1 avenue de la gare – 40100 Dax</p>
        <p className="text-gray-700 leading-relaxed my-3">Email général : contact@prolocal-landes.fr</p>
        <p className="text-gray-700 leading-relaxed my-3">Email relatif aux données personnelles : contact@prolocal-landes.fr</p>
        </div>
      </div>
    </div>
  );
}
