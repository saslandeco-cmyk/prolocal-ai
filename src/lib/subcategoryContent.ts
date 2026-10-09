/**
 * Contenu éditorial généré pour les pages sous-catégorie
 * (/categories/[categorie]/[sous-categorie]) — transforme une simple liste
 * filtrée en véritable page d'atterrissage locale (intro, "À propos", CTA,
 * FAQ), sans dépendre d'un contenu saisi à la main pour chacune des
 * dizaines de combinaisons catégorie/sous-catégorie existantes.
 *
 * Généré à partir des mêmes données (libellés + professionnels déjà
 * récupérés) côté serveur (JSON-LD, app/categories/[category]/[subcategory]/page.tsx)
 * et côté client (affichage, components/category/SubcategoryPage.tsx), pour
 * que le contenu visible corresponde toujours exactement aux données
 * structurées (recommandation Google pour les extraits FAQ).
 */

export interface FaqItem {
  q: string;
  a: string;
}

export interface SubcategoryLandingContent {
  /** Paragraphe affiché juste au-dessus de la grille de résultats — null si aucun professionnel référencé. */
  intro: string | null;
  seoTitle: string;
  seoText: string[];
  ctaText: string;
}

/** Formate une liste en énumération française naturelle, tronquée au-delà de `max` éléments. */
function joinFrenchList(items: string[], max = 6): string {
  const shown = items.slice(0, max);
  const joined = shown.length <= 1 ? (shown[0] || "") : `${shown.slice(0, -1).join(", ")} et ${shown[shown.length - 1]}`;
  return items.length > max ? `${joined} et dans d'autres communes du département` : joined;
}

/**
 * Paragraphe d'introduction rédigé individuellement pour chaque métier (clé
 * = libellé exact de la sous-catégorie, voir SUBCATEGORIES dans
 * src/types/index.ts) — affiché juste au-dessus de la grille de résultats.
 * Contrairement au reste du contenu généré de ce fichier, ce texte ne
 * dépend pas du nombre de professionnels référencés : c'est un contenu
 * éditorial évergreen, pensé pour chaque profession (situations typiques,
 * bénéfice de faire appel à un professionnel).
 *
 * Si une sous-catégorie est ajoutée depuis l'admin sans entrée ici,
 * buildSubcategoryLandingContent() retombe automatiquement sur un
 * paragraphe générique (voir plus bas) — aucune page ne reste sans texte.
 */
const SUBCATEGORY_INTROS: Record<string, string> = {
  // Alimentation & Épicerie
  "Alimentation générale": "Vous recherchez une épicerie ou une alimentation générale dans les Landes pour vos courses du quotidien ? Que vous ayez besoin de produits locaux, d'un dépannage de dernière minute ou d'une boutique de proximité ouverte tard, ces commerces vous proposent un large choix dans un cadre pratique et convivial.",
  "Boucherie / Charcuterie": "Vous cherchez une boucherie ou une charcuterie artisanale dans les Landes pour une viande de qualité ou des produits du terroir ? Que ce soit pour un repas de famille, une commande pour un événement ou vos achats de la semaine, ces artisans bouchers vous conseillent selon vos besoins et la saison.",
  "Boulangerie / Pâtisserie": "Vous cherchez une boulangerie ou une pâtisserie dans les Landes pour du pain frais, des viennoiseries ou un gâteau pour une occasion spéciale ? Que vous soyez un habitué du quartier ou de passage, ces artisans vous proposent des créations faites maison, chaque jour.",
  "Caviste / Marchand de boissons": "Vous recherchez un caviste ou un marchand de boissons dans les Landes pour choisir un bon vin, préparer une réception ou constituer votre cave ? Que vous soyez amateur ou connaisseur, ces professionnels vous conseillent selon vos goûts, votre budget et l'occasion.",
  "Épicerie fine": "Vous recherchez une épicerie fine dans les Landes pour dénicher des produits gourmands, un cadeau gourmet ou une spécialité locale ? Que ce soit pour régaler vos proches ou vous faire plaisir, ces commerces sélectionnent avec soin des produits de qualité, souvent issus du terroir landais.",
  "Fromagerie / Crèmerie": "Vous cherchez une fromagerie ou une crèmerie dans les Landes pour composer un plateau de fromages ou trouver des produits laitiers de qualité ? Que ce soit pour un repas entre amis ou vos courses habituelles, ces artisans affineurs vous conseillent selon vos goûts et l'accord recherché.",
  "Poissonnerie": "Vous recherchez une poissonnerie dans les Landes pour des produits de la mer frais et de qualité ? Que vous prépariez un repas de fête ou un dîner simple, ces professionnels vous conseillent sur le choix du poisson, des coquillages ou des crustacés selon leur arrivage du jour.",
  "Primeurs": "Vous cherchez un primeur dans les Landes pour des fruits et légumes frais et de saison ? Que vous recherchiez des produits locaux, bio ou simplement de qualité pour vos repas quotidiens, ces commerçants vous conseillent selon les arrivages et les spécialités du terroir landais.",

  // Artisanat & Métiers d'art
  "Archetier": "Vous recherchez un archetier dans les Landes pour l'entretien, la réparation ou l'achat d'un archet pour instrument à cordes ? Que vous soyez musicien professionnel, amateur ou parent d'un jeune apprenti, cet artisan spécialisé vous conseille selon votre pratique et votre budget.",
  "Bijoutier-Joaillier": "Vous recherchez un bijoutier-joaillier dans les Landes pour l'achat, la création sur-mesure ou la réparation d'un bijou ? Que ce soit pour une occasion spéciale, une transmission familiale ou un coup de cœur, cet artisan vous accompagne avec expertise et savoir-faire.",
  "Céramiste": "Vous recherchez un céramiste dans les Landes pour une pièce artisanale, un objet décoratif ou une création sur-mesure ? Que vous soyez particulier, professionnel de la décoration ou amateur d'art, cet artisan façonne des pièces uniques selon vos envies et son savoir-faire.",
  "Chaudronnier": "Vous recherchez un chaudronnier dans les Landes pour la fabrication, la réparation ou la transformation de pièces métalliques ? Que ce soit pour un projet industriel, artisanal ou une pièce sur-mesure, ce professionnel met son savoir-faire technique au service de votre projet.",
  "Décorateur sur céramique / Peintre sur faïence ou porcelaine": "Vous recherchez un décorateur sur céramique ou un peintre sur faïence et porcelaine dans les Landes pour personnaliser ou restaurer une pièce ? Que ce soit pour un objet décoratif, un cadeau unique ou une restauration, cet artisan d'art met sa précision au service de votre projet.",
  "Doreur à la feuille": "Vous recherchez un doreur à la feuille dans les Landes pour la restauration ou la finition d'un objet, d'un cadre ou d'un meuble ? Que ce soit pour un projet de rénovation patrimoniale ou une création contemporaine, cet artisan maîtrise une technique ancestrale exigeante et minutieuse.",
  "Ébéniste": "Vous recherchez un ébéniste dans les Landes pour la création, la restauration ou la réparation d'un meuble en bois ? Que vous souhaitiez une pièce sur-mesure ou redonner vie à un meuble ancien, cet artisan vous apporte son savoir-faire et son sens du détail.",
  "Encadreur": "Vous recherchez un encadreur dans les Landes pour mettre en valeur une œuvre, une photo ou un objet précieux ? Que ce soit pour un cadeau, une décoration d'intérieur ou la protection d'une pièce de valeur, cet artisan vous propose un encadrement sur-mesure adapté à votre projet.",
  "Ferronnier d'art": "Vous recherchez un ferronnier d'art dans les Landes pour la création ou la restauration d'une grille, d'un portail ou d'un élément en fer forgé ? Que ce soit pour un projet neuf ou une rénovation patrimoniale, cet artisan allie technique traditionnelle et créativité.",
  "Horloger": "Vous recherchez un horloger dans les Landes pour la réparation, l'entretien ou l'achat d'une montre ou d'une horloge ? Que ce soit une pièce de famille, une montre du quotidien ou une horloge ancienne, cet artisan met sa précision et son expertise au service de votre objet.",
  "Luthier": "Vous recherchez un luthier dans les Landes pour la fabrication, la réparation ou l'entretien d'un instrument à cordes ? Que vous soyez musicien professionnel, amateur ou parent d'un élève en apprentissage, cet artisan vous conseille selon votre pratique et votre instrument.",
  "Maroquinier": "Vous recherchez un maroquinier dans les Landes pour la création, la réparation ou la personnalisation d'un article en cuir ? Que ce soit un sac, une ceinture ou un objet sur-mesure, cet artisan travaille le cuir avec précision pour répondre à vos besoins.",
  "Souffleur de verre / Verrier à la main": "Vous recherchez un souffleur de verre ou un verrier à la main dans les Landes pour une création artisanale ou une pièce décorative unique ? Que ce soit pour un objet d'art, un cadeau ou une commande sur-mesure, cet artisan façonne le verre selon un savoir-faire rare.",
  "Tailleur de pierre": "Vous recherchez un tailleur de pierre dans les Landes pour la restauration, la création ou la taille d'un élément en pierre ? Que ce soit pour un monument, une façade ou un projet de rénovation patrimoniale, cet artisan met son savoir-faire traditionnel au service de votre projet.",
  "Tapissier d'ameublement": "Vous recherchez un tapissier d'ameublement dans les Landes pour la restauration ou la rénovation d'un fauteuil, d'un canapé ou d'une chaise ancienne ? Que ce soit une pièce de famille ou un meuble chiné, cet artisan redonne vie à vos sièges avec des finitions sur-mesure.",
  "Vitrailliste": "Vous recherchez un vitrailliste dans les Landes pour la création, la restauration ou la réparation d'un vitrail ? Que ce soit pour un édifice religieux, une habitation ou un projet décoratif, cet artisan d'art maîtrise une technique précise alliant verre, plomb et lumière.",

  // Bâtiment & Travaux
  "Architecte": "Vous recherchez un architecte dans les Landes pour la conception d'une construction neuve, une extension ou une rénovation ? Que vous soyez particulier ou professionnel, cet expert vous accompagne de l'esquisse du projet jusqu'au suivi du chantier, dans le respect de vos besoins.",
  "Carreleur": "Vous recherchez un carreleur dans les Landes pour la pose de carrelage ou de faïence dans une pièce de votre logement ? Que ce soit pour une construction neuve ou une rénovation de salle de bain ou de cuisine, ce professionnel assure une pose soignée et durable adaptée à votre projet.",
  "Charpentier": "Vous recherchez un charpentier dans les Landes pour la construction, la rénovation ou la réparation d'une charpente ? Que ce soit pour une maison neuve, un aménagement de combles ou un problème de structure, cet artisan met son savoir-faire au service de la solidité de votre toiture.",
  "Couvreur": "Vous recherchez un couvreur dans les Landes pour la réfection, l'entretien ou la réparation d'une toiture ? Que vous soyez confronté à une fuite, un projet de rénovation énergétique ou une construction neuve, ce professionnel garantit l'étanchéité et la durabilité de votre toit.",
  "Électricien": "Vous recherchez un électricien dans les Landes pour une installation, une mise aux normes ou une panne électrique ? Que ce soit pour une construction neuve, une rénovation ou une urgence, ce professionnel intervient pour garantir la sécurité de votre installation.",
  "Expert en bâtiment": "Vous recherchez un expert en bâtiment dans les Landes pour évaluer l'état d'une maison, d'un appartement ou d'un local professionnel ? Que vous soyez propriétaire, futur acquéreur, bailleur ou confronté à un problème lors de travaux, faire appel à un professionnel de l'expertise bâtiment permet d'obtenir un avis technique indépendant et adapté à votre situation.",
  "Maçon": "Vous recherchez un maçon dans les Landes pour une construction, une extension ou des travaux de gros œuvre ? Que ce soit pour bâtir une maison, rénover un mur ou couler une dalle, ce professionnel vous accompagne à chaque étape pour garantir la solidité de votre projet.",
  "Menuisier": "Vous recherchez un menuisier dans les Landes pour la pose ou la fabrication de fenêtres, portes ou aménagements en bois ? Que ce soit pour une construction neuve, une rénovation énergétique ou un aménagement intérieur sur-mesure, cet artisan allie précision et savoir-faire.",
  "Peintre en bâtiment": "Vous recherchez un peintre en bâtiment dans les Landes pour rafraîchir ou transformer un intérieur ou une façade ? Que ce soit pour une rénovation complète, une remise en état ou un simple coup de neuf, ce professionnel vous conseille sur les teintes et finitions adaptées.",
  "Plaquiste": "Vous recherchez un plaquiste dans les Landes pour l'aménagement de cloisons, de faux plafonds ou l'isolation intérieure ? Que ce soit pour une rénovation, un aménagement de combles ou une construction neuve, ce professionnel réalise des finitions soignées adaptées à votre projet.",
  "Plombier-chauffagiste": "Vous recherchez un plombier-chauffagiste dans les Landes pour une fuite, une panne de chauffage ou l'installation d'un équipement sanitaire ? Qu'il s'agisse d'une urgence ou d'un projet de rénovation, ce professionnel intervient rapidement pour assurer votre confort au quotidien.",

  // Beauté & Bien-être
  "Coiffeur": "Vous recherchez un coiffeur dans les Landes pour une coupe, une coloration ou un soin capillaire ? Que ce soit pour un entretien régulier ou une occasion spéciale, ce professionnel vous conseille selon votre type de cheveux et vos envies, pour un résultat sur-mesure.",
  "Esthéticienne": "Vous recherchez une esthéticienne dans les Landes pour un soin du visage, une épilation ou une prestation de bien-être ? Que ce soit pour un moment de détente ou la préparation d'un événement, cette professionnelle vous propose des soins adaptés à votre peau et à vos besoins.",
  "Maquilleur professionnel": "Vous recherchez un maquilleur professionnel dans les Landes pour un mariage, une séance photo ou un événement particulier ? Que vous souhaitiez un maquillage naturel ou sophistiqué, ce professionnel sublime votre visage selon l'occasion et vos préférences.",
  "Naturopathe": "Vous recherchez un naturopathe dans les Landes pour un accompagnement global de votre bien-être ? Que ce soit pour une meilleure hygiène de vie, une gestion du stress ou un soutien naturel à votre santé, ce praticien vous propose des conseils personnalisés basés sur des approches naturelles.",
  "Praticien en massage bien-être": "Vous recherchez un praticien en massage bien-être dans les Landes pour soulager les tensions ou vous accorder un moment de détente ? Que ce soit après une journée chargée ou pour un besoin spécifique, ce professionnel adapte sa technique à votre corps et à vos attentes.",
  "Prothésiste ongulaire": "Vous recherchez une prothésiste ongulaire dans les Landes pour une pose, un soin ou une décoration d'ongles ? Que ce soit pour un entretien régulier ou un événement particulier, cette professionnelle réalise des prestations soignées selon vos envies et votre style.",
  "Sophrologue / Réflexologue": "Vous recherchez un sophrologue ou un réflexologue dans les Landes pour mieux gérer le stress, les émotions ou des tensions physiques ? Que ce soit pour un accompagnement ponctuel ou régulier, ce praticien vous propose des séances adaptées à votre rythme et à vos objectifs.",

  // Commerce & Vente
  "Ameublement": "Vous recherchez un magasin d'ameublement dans les Landes pour meubler ou réaménager votre intérieur ? Que ce soit pour une pièce entière ou un meuble précis, ces professionnels vous conseillent sur le style, les matériaux et l'agencement adaptés à votre logement.",
  "Décoration": "Vous recherchez une boutique de décoration dans les Landes pour personnaliser votre intérieur ? Que ce soit pour un objet déco, un cadeau ou un projet d'aménagement complet, ces commerces vous proposent une sélection variée pour donner du caractère à votre maison.",
  "Électroménager / Multimédia": "Vous recherchez un magasin d'électroménager ou de multimédia dans les Landes pour un nouvel équipement ou une réparation ? Que ce soit pour remplacer un appareil en panne ou vous équiper, ces professionnels vous conseillent selon vos besoins et votre budget.",
  "Ésotérique": "Vous recherchez une boutique ésotérique dans les Landes pour des objets, soins ou conseils liés au bien-être spirituel ? Que vous soyez curieux ou initié, ces professionnels vous accompagnent selon vos centres d'intérêt et vos questionnements.",
  "Fleuriste": "Vous recherchez un fleuriste dans les Landes pour un bouquet, une composition florale ou la décoration d'un événement ? Que ce soit pour une occasion spéciale ou simplement vous faire plaisir, ce professionnel compose des créations florales adaptées à chaque moment.",
  "Friperie": "Vous recherchez une friperie dans les Landes pour dénicher des vêtements de seconde main à petit prix ? Que vous soyez adepte de la mode responsable ou à la recherche d'une pièce unique, ces commerces proposent une sélection renouvelée régulièrement.",
  "Garage automobile": "Vous recherchez un garage automobile dans les Landes pour l'entretien, la réparation ou le contrôle de votre véhicule ? Que ce soit pour une panne, une révision régulière ou un diagnostic, ce professionnel intervient pour assurer la sécurité de votre voiture.",
  "Habillement": "Vous recherchez une boutique de vêtements dans les Landes pour renouveler votre garde-robe ? Que ce soit pour une tenue du quotidien ou une occasion particulière, ces commerces vous proposent un choix adapté à tous les styles et toutes les saisons.",
  "Jardinerie": "Vous recherchez une jardinerie dans les Landes pour aménager votre extérieur ou entretenir votre jardin ? Que ce soit pour des plantes, des outils ou des conseils d'entretien, ces professionnels vous accompagnent selon vos projets et la nature de votre terrain.",
  "Librairie": "Vous recherchez une librairie dans les Landes pour trouver un livre, un cadeau littéraire ou des conseils de lecture ? Que vous soyez lecteur occasionnel ou passionné, ces professionnels vous orientent selon vos goûts et vos envies du moment.",
  "Motoculture": "Vous recherchez un spécialiste en motoculture dans les Landes pour l'achat ou l'entretien de matériel de jardinage motorisé ? Que ce soit une tondeuse, une tronçonneuse ou un outil plus technique, ce professionnel vous conseille et assure le bon fonctionnement de votre équipement.",
  "Parfumerie": "Vous recherchez une parfumerie dans les Landes pour choisir un parfum ou des produits de beauté ? Que ce soit pour vous ou pour offrir, ces professionnels vous conseillent selon vos préférences olfactives et vos habitudes de soin.",
  "Pharmacie": "Vous recherchez une pharmacie dans les Landes pour vos médicaments, des conseils santé ou des produits de parapharmacie ? Que ce soit pour une ordonnance, un besoin ponctuel ou un conseil personnalisé, ces professionnels de santé vous accompagnent au quotidien.",
  "Tabac / Presse": "Vous recherchez un bureau de tabac ou une presse dans les Landes pour vos journaux, cigarettes ou jeux à gratter ? Que ce soit pour un achat régulier ou occasionnel, ces commerces de proximité vous accueillent au cœur de votre quartier ou de votre commune.",
  "Troc / Dépôt vente": "Vous recherchez un troc ou un dépôt-vente dans les Landes pour vendre, acheter ou échanger des objets d'occasion ? Que ce soit pour désencombrer votre logement ou dénicher une bonne affaire, ces commerces vous offrent une alternative économique et responsable.",

  // Culture & Élevage
  "Apiculteur / Apicultrice": "Vous recherchez un apiculteur dans les Landes pour du miel, des produits de la ruche ou des conseils sur l'apiculture ? Que ce soit pour une consommation régulière ou un cadeau gourmand, ce producteur local vous propose des produits authentiques issus de son exploitation.",
  "Aquaculteur / Aquacultrice": "Vous recherchez un aquaculteur dans les Landes pour des produits issus de l'élevage aquacole ? Que ce soit pour votre consommation personnelle ou un approvisionnement régulier, ce producteur local vous propose des produits frais issus de son exploitation.",
  "Arboriculteur / Arboricultrice": "Vous recherchez un arboriculteur dans les Landes pour des fruits de saison ou des conseils sur l'entretien d'un verger ? Que ce soit pour votre consommation ou un projet de plantation, ce producteur local partage son savoir-faire et ses produits issus du terroir landais.",
  "Éleveur / Éleveuse": "Vous recherchez un éleveur dans les Landes pour des produits de la ferme ou de la viande en direct du producteur ? Que ce soit pour votre consommation régulière ou une commande spécifique, cet exploitant local vous propose des produits issus de son élevage.",
  "Horticulteur / Horticultrice": "Vous recherchez un horticulteur dans les Landes pour des plantes, des fleurs ou des conseils d'aménagement paysager ? Que ce soit pour embellir votre jardin ou réaliser un projet de plantation, ce producteur local vous accompagne selon vos envies et votre terrain.",
  "Maraîcher / Maraîchère": "Vous recherchez un maraîcher dans les Landes pour des fruits et légumes frais, cultivés localement ? Que ce soit pour votre consommation quotidienne ou un panier régulier, ce producteur vous propose des produits de saison issus de son exploitation.",
  "Viticulteur / Viticultrice": "Vous recherchez un viticulteur dans les Landes pour déguster ou acheter du vin en direct du producteur ? Que ce soit pour une dégustation, un cadeau ou pour constituer votre cave, ce vigneron partage sa passion et son savoir-faire sur son exploitation.",

  // Immobilier
  "Agence immobilière": "Vous recherchez une agence immobilière dans les Landes pour acheter, vendre ou louer un bien ? Que vous soyez propriétaire, locataire ou investisseur, ces professionnels vous accompagnent à chaque étape de votre projet, de l'estimation à la signature.",
  "Conciergerie": "Vous recherchez une conciergerie dans les Landes pour la gestion locative, l'entretien ou l'accueil de vos locataires ? Que ce soit pour une location saisonnière ou un bien géré à distance, ce professionnel s'occupe du quotidien de votre bien en toute tranquillité.",
  "Diagnostique technique": "Vous recherchez un diagnostiqueur immobilier dans les Landes pour réaliser les diagnostics obligatoires avant une vente ou une location ? Que ce soit pour un DPE, un diagnostic amiante ou électrique, ce professionnel certifié vous fournit un rapport fiable et conforme à la réglementation.",
  "Gestionnaire de bien": "Vous recherchez un gestionnaire de biens dans les Landes pour administrer votre patrimoine locatif ? Que vous soyez propriétaire d'un ou plusieurs logements, ce professionnel s'occupe de la gestion locative, des loyers et des relations avec vos locataires.",
  "Mandataire immobilier": "Vous recherchez un mandataire immobilier dans les Landes pour vendre ou acheter un bien en toute simplicité ? Que vous soyez vendeur ou acquéreur, ce professionnel indépendant vous accompagne avec un suivi personnalisé tout au long de votre projet.",
  "Syndic de copropriété": "Vous recherchez un syndic de copropriété dans les Landes pour la gestion administrative, financière ou technique de votre immeuble ? Que vous soyez copropriétaire ou membre du conseil syndical, ce professionnel assure le bon fonctionnement de votre copropriété au quotidien.",

  // Informatique & Numérique
  "Agence Web": "Vous recherchez une agence web dans les Landes pour la création ou la refonte de votre site internet ? Que vous soyez entrepreneur, commerçant ou association, cette agence vous accompagne de la conception à la mise en ligne de votre présence digitale.",
  "Community manager": "Vous recherchez un community manager dans les Landes pour animer vos réseaux sociaux et développer votre visibilité en ligne ? Que vous soyez une petite entreprise ou une marque établie, ce professionnel élabore une stratégie adaptée à votre image et à vos objectifs.",
  "Cybersécurité": "Vous recherchez un expert en cybersécurité dans les Landes pour protéger vos données ou sécuriser votre système informatique ? Que vous soyez une entreprise ou un professionnel indépendant, ce spécialiste évalue vos risques et met en place des solutions adaptées.",
  "Graphiste": "Vous recherchez un graphiste dans les Landes pour la création de votre identité visuelle, d'un logo ou de supports de communication ? Que ce soit pour un lancement d'activité ou un projet ponctuel, ce professionnel donne vie à votre image avec créativité et cohérence.",
  "Informaticien": "Vous recherchez un informaticien dans les Landes pour un dépannage, une installation ou une maintenance de votre matériel ? Que ce soit pour un problème ponctuel ou un suivi régulier, ce professionnel intervient pour résoudre vos difficultés informatiques rapidement.",
  "Webdesigner": "Vous recherchez un webdesigner dans les Landes pour concevoir l'interface et l'ergonomie de votre site ou application ? Que ce soit pour un projet neuf ou une refonte, ce professionnel allie esthétique et expérience utilisateur pour valoriser votre activité en ligne.",
  "Webmaster indépendant": "Vous recherchez un webmaster indépendant dans les Landes pour la gestion, la maintenance ou la mise à jour de votre site internet ? Que ce soit pour un suivi ponctuel ou régulier, ce professionnel veille au bon fonctionnement et à la sécurité de votre présence en ligne.",

  // Restauration
  "Restaurant": "Vous recherchez un restaurant dans les Landes pour un repas entre amis, en famille ou en tête-à-tête ? Que ce soit pour une occasion spéciale ou un déjeuner simple, ces établissements vous proposent une cuisine variée dans une ambiance adaptée à chaque moment.",
  "Café / Bar": "Vous recherchez un café ou un bar dans les Landes pour une pause, un verre entre amis ou une soirée conviviale ? Que ce soit en journée ou en soirée, ces établissements vous accueillent dans une ambiance chaleureuse au cœur de votre commune.",
  "Traiteur": "Vous recherchez un traiteur dans les Landes pour l'organisation d'un repas, un mariage ou un événement professionnel ? Que ce soit pour un buffet, un cocktail ou un menu complet, ce professionnel compose une prestation sur-mesure adaptée à votre événement et à vos invités.",

  // Services à la personne
  "Aide à domicile": "Vous recherchez une aide à domicile dans les Landes pour accompagner un proche ou vous-même au quotidien ? Que ce soit pour l'aide aux tâches ménagères, les courses ou une présence rassurante, ce professionnel vous apporte un accompagnement adapté à vos besoins.",
  "Assistant administratif": "Vous recherchez un assistant administratif indépendant dans les Landes pour la gestion de vos démarches ou de votre secrétariat ? Que vous soyez un particulier ou une entreprise, ce professionnel vous décharge des tâches administratives chronophages.",
  "Assistant informatique et Internet": "Vous recherchez un assistant informatique et Internet dans les Landes pour vous accompagner dans l'utilisation de vos appareils ou vos démarches en ligne ? Que ce soit pour une initiation ou un dépannage ponctuel, ce professionnel vous aide à gagner en autonomie au quotidien.",
  "Employé de ménage / Repassage": "Vous recherchez un service de ménage ou de repassage dans les Landes pour l'entretien de votre logement ou de votre linge ? Que ce soit pour un besoin régulier ou ponctuel, ce professionnel vous libère du temps en prenant en charge ces tâches du quotidien.",
  "Garde d'animaux": "Vous recherchez un service de garde d'animaux dans les Landes pour un départ en vacances ou une absence ponctuelle ? Que vous ayez un chien, un chat ou un autre animal de compagnie, ce professionnel en prend soin avec attention en votre absence.",
  "Garde d'enfants": "Vous recherchez une garde d'enfants dans les Landes pour un accompagnement ponctuel ou régulier ? Que ce soit pour la sortie d'école, les vacances ou une soirée, ce professionnel veille sur vos enfants en toute confiance et sécurité.",
  "Travaux de jardinerie": "Vous recherchez un professionnel des travaux de jardinerie dans les Landes pour l'entretien de votre extérieur ? Que ce soit pour la tonte, la taille ou l'aménagement de votre jardin, ce professionnel s'occupe de votre espace vert selon vos besoins et la saison.",

  // Sport & Fitness
  "Coach sportif": "Vous recherchez un coach sportif dans les Landes pour atteindre vos objectifs de forme ou de performance ? Que vous soyez débutant ou sportif confirmé, ce professionnel élabore un programme personnalisé adapté à votre niveau et à vos ambitions.",
  "Salle de sport et de fitness": "Vous recherchez une salle de sport ou de fitness dans les Landes pour vous entraîner régulièrement ? Que vous souhaitiez pratiquer la musculation, des cours collectifs ou du cardio-training, ces établissements vous proposent des équipements et un encadrement adaptés.",

  // Transport de personnes
  "Ambulance": "Vous recherchez un service d'ambulance dans les Landes pour un transport médicalisé ou un rendez-vous médical ? Que ce soit pour une urgence ou un déplacement programmé, ce professionnel assure un transport sécurisé et adapté à votre état de santé.",
  "Déménagement": "Vous recherchez une entreprise de déménagement dans les Landes pour transporter vos meubles et effets personnels ? Que ce soit pour un déménagement local ou longue distance, ce professionnel organise et sécurise le transport de vos biens du premier au dernier carton.",
  "Taxi": "Vous recherchez un taxi dans les Landes pour un trajet ponctuel, une gare, un aéroport ou un rendez-vous ? Que ce soit pour un déplacement professionnel ou personnel, ce professionnel vous conduit rapidement et en toute sécurité à votre destination.",
  "Transport de groupe": "Vous recherchez un service de transport de groupe dans les Landes pour un déplacement collectif ? Que ce soit pour un mariage, une sortie scolaire ou un voyage organisé, ce professionnel assure le transport confortable et sécurisé de votre groupe.",
};

/**
 * Description succincte du métier (clé = libellé exact de la sous-catégorie)
 * — utilisée pour la question FAQ "Que fait un [métier] ?" (voir
 * buildSubcategoryFaq). Contrairement à SUBCATEGORY_INTROS (adressé au
 * visiteur, "vous recherchez..."), ce texte décrit l'activité elle-même,
 * pour qui ne connaît pas encore le métier.
 */
const SUBCATEGORY_DESCRIPTIONS: Record<string, string> = {
  // Alimentation & Épicerie
  "Alimentation générale": "Une alimentation générale vend des produits de consommation courante (épicerie, boissons, produits frais) dans un commerce de proximité, souvent avec des horaires élargis.",
  "Boucherie / Charcuterie": "Un boucher-charcutier découpe, prépare et vend de la viande ainsi que des produits de charcuterie, en conseillant ses clients selon leurs besoins et les occasions.",
  "Boulangerie / Pâtisserie": "Un boulanger-pâtissier fabrique et vend du pain, des viennoiseries et des pâtisseries, le plus souvent élaborés chaque jour selon des méthodes artisanales.",
  "Caviste / Marchand de boissons": "Un caviste sélectionne, conseille et vend des vins et d'autres boissons, en orientant ses clients selon leurs goûts, leur budget et l'occasion.",
  "Épicerie fine": "Une épicerie fine propose une sélection de produits gourmets et de spécialités régionales ou du terroir, souvent destinés à un usage gastronomique ou à l'offrande.",
  "Fromagerie / Crèmerie": "Un fromager-affineur sélectionne, affine et vend des fromages et des produits laitiers, en conseillant ses clients sur le choix et les accords.",
  "Poissonnerie": "Un poissonnier sélectionne, prépare et vend des produits de la mer frais (poissons, coquillages, crustacés), en conseillant selon les arrivages du jour.",
  "Primeurs": "Un primeur sélectionne et vend des fruits et légumes frais et de saison, souvent issus de producteurs locaux.",

  // Artisanat & Métiers d'art
  "Archetier": "Un archetier fabrique, répare et entretient les archets des instruments à cordes (violon, alto, violoncelle, contrebasse).",
  "Bijoutier-Joaillier": "Un bijoutier-joaillier crée, répare et vend des bijoux, et peut transformer ou remonter des pièces anciennes sur demande.",
  "Céramiste": "Un céramiste façonne, cuit et décore des pièces en terre ou en porcelaine, qu'il s'agisse de vaisselle, d'objets décoratifs ou de créations sur-mesure.",
  "Chaudronnier": "Un chaudronnier façonne, découpe, plie et assemble des pièces métalliques pour des projets industriels, artisanaux ou sur-mesure.",
  "Décorateur sur céramique / Peintre sur faïence ou porcelaine": "Ce professionnel peint et décore des pièces en céramique, faïence ou porcelaine, qu'elles soient existantes ou entièrement créées sur-mesure.",
  "Doreur à la feuille": "Un doreur à la feuille applique de fines feuilles d'or ou d'argent sur des cadres, meubles ou objets, pour une finition décorative ou une restauration.",
  "Ébéniste": "Un ébéniste conçoit, fabrique et restaure des meubles en bois, en travaillant sur-mesure selon les besoins et le style recherché.",
  "Encadreur": "Un encadreur conçoit et réalise un encadrement sur-mesure pour une œuvre, une photo ou un objet, en choisissant les matériaux adaptés à sa conservation.",
  "Ferronnier d'art": "Un ferronnier d'art façonne et restaure des éléments en fer forgé (grilles, portails, rampes), alliant technique traditionnelle et créativité.",
  "Horloger": "Un horloger répare, entretient et vend des montres et des horloges, en intervenant aussi bien sur des pièces anciennes que récentes.",
  "Luthier": "Un luthier fabrique, répare et entretient les instruments à cordes, en veillant à la qualité du son et à la longévité de l'instrument.",
  "Maroquinier": "Un maroquinier conçoit, répare et personnalise des articles en cuir (sacs, ceintures, accessoires), en travaillant souvent sur-mesure.",
  "Souffleur de verre / Verrier à la main": "Ce professionnel façonne le verre à la main pour créer des pièces artisanales et décoratives uniques.",
  "Tailleur de pierre": "Un tailleur de pierre taille, restaure et façonne des éléments en pierre pour des monuments, façades ou projets de rénovation patrimoniale.",
  "Tapissier d'ameublement": "Un tapissier d'ameublement restaure et rénove des sièges (fauteuils, canapés, chaises) en reprenant la structure, le garnissage et le tissu.",
  "Vitrailliste": "Un vitrailliste crée et restaure des vitraux, en travaillant le verre et le plomb pour des édifices religieux, des habitations ou des projets décoratifs.",

  // Bâtiment & Travaux
  "Architecte": "Un architecte conçoit des projets de construction, d'extension ou de rénovation, et peut suivre le chantier jusqu'à sa réception.",
  "Carreleur": "Un carreleur pose du carrelage et de la faïence sur les sols et les murs, pour des constructions neuves ou des rénovations.",
  "Charpentier": "Un charpentier construit, rénove et répare les charpentes en bois, garantissant la solidité de la toiture et des aménagements de combles.",
  "Couvreur": "Un couvreur installe, répare et entretient les toitures, en assurant leur étanchéité et leur durabilité.",
  "Électricien": "Un électricien installe, répare et met aux normes les installations électriques, pour des constructions neuves comme pour des rénovations ou des urgences.",
  "Expert en bâtiment": "Un expert en bâtiment évalue l'état d'une construction et rédige un rapport technique indépendant, utile avant un achat, après des malfaçons ou en cas de litige.",
  "Maçon": "Un maçon réalise les travaux de gros œuvre (fondations, murs, dalles) pour des constructions neuves, des extensions ou des rénovations.",
  "Menuisier": "Un menuisier fabrique et pose des portes, fenêtres et aménagements en bois, sur-mesure ou pour des constructions neuves et rénovations.",
  "Peintre en bâtiment": "Un peintre en bâtiment rafraîchit ou transforme un intérieur ou une façade, en conseillant sur les teintes et finitions adaptées.",
  "Plaquiste": "Un plaquiste pose des cloisons, des faux plafonds et réalise l'isolation intérieure, pour des rénovations, aménagements de combles ou constructions neuves.",
  "Plombier-chauffagiste": "Un plombier-chauffagiste installe, répare et entretient les équipements sanitaires et de chauffage, en intervenant aussi en urgence.",

  // Beauté & Bien-être
  "Coiffeur": "Un coiffeur réalise coupes, colorations et soins capillaires, en conseillant ses clients selon leur type de cheveux et leurs envies.",
  "Esthéticienne": "Une esthéticienne réalise des soins du visage, des épilations et des prestations de bien-être, adaptés à chaque type de peau.",
  "Maquilleur professionnel": "Un maquilleur professionnel sublime le visage pour un mariage, une séance photo ou un événement, selon le style recherché.",
  "Naturopathe": "Un naturopathe accompagne l'hygiène de vie de ses clients (alimentation, sommeil, stress) par des conseils et des approches naturelles, en complément d'un suivi médical.",
  "Praticien en massage bien-être": "Un praticien en massage bien-être propose des massages adaptés à chacun pour soulager les tensions ou offrir un moment de détente.",
  "Prothésiste ongulaire": "Une prothésiste ongulaire réalise la pose, le soin et la décoration des ongles, selon les envies et le style de chaque cliente.",
  "Sophrologue / Réflexologue": "Ce praticien accompagne la gestion du stress, des émotions ou des tensions physiques par des séances de sophrologie ou de réflexologie.",

  // Commerce & Vente
  "Ameublement": "Un magasin d'ameublement vend des meubles et conseille sur l'agencement d'un intérieur, selon le style et les dimensions de chaque pièce.",
  "Décoration": "Une boutique de décoration propose des objets et conseille sur l'aménagement d'un intérieur, pour donner du caractère à un logement.",
  "Électroménager / Multimédia": "Ce commerce vend et parfois répare des appareils électroménagers ou multimédias, en conseillant selon les besoins et le budget de chaque client.",
  "Ésotérique": "Une boutique ésotérique propose des objets, soins ou consultations liés au bien-être spirituel, selon les centres d'intérêt de chacun.",
  "Fleuriste": "Un fleuriste compose et vend des bouquets et des créations florales, pour toutes les occasions et événements.",
  "Friperie": "Une friperie vend des vêtements de seconde main, sélectionnés et renouvelés régulièrement.",
  "Garage automobile": "Un garage automobile entretient, répare et diagnostique les véhicules, en assurant la sécurité et le bon fonctionnement de chaque voiture.",
  "Habillement": "Une boutique d'habillement vend des vêtements pour toutes les occasions, en conseillant ses clients selon leur style et leurs besoins.",
  "Jardinerie": "Une jardinerie vend plantes, outils et équipements de jardin, en conseillant sur l'aménagement et l'entretien des extérieurs.",
  "Librairie": "Une librairie vend des livres et conseille ses clients sur leurs lectures, en pouvant commander des ouvrages non disponibles en rayon.",
  "Motoculture": "Un spécialiste en motoculture vend, répare et entretient le matériel de jardinage motorisé (tondeuses, tronçonneuses, débroussailleuses).",
  "Parfumerie": "Une parfumerie vend des parfums et des produits de beauté, en conseillant ses clients selon leurs préférences.",
  "Pharmacie": "Une pharmacie délivre des médicaments et conseille sur la santé, avec ou sans ordonnance, en assurant parfois des gardes en dehors des horaires habituels.",
  "Tabac / Presse": "Un bureau de tabac vend tabac, presse et jeux à gratter, souvent complété par d'autres services de proximité (timbres, recharges, point relais).",
  "Troc / Dépôt vente": "Un troc ou dépôt-vente permet d'acheter, de vendre ou d'échanger des objets d'occasion, contre une commission prélevée à la vente.",

  // Culture & Élevage
  "Apiculteur / Apicultrice": "Un apiculteur élève des abeilles et produit du miel ainsi que d'autres produits de la ruche, souvent vendus en direct.",
  "Aquaculteur / Aquacultrice": "Un aquaculteur élève des espèces aquatiques (poissons, coquillages) et vend sa production, souvent directement à la ferme ou sur les marchés.",
  "Arboriculteur / Arboricultrice": "Un arboriculteur cultive des arbres fruitiers et récolte leurs fruits, qu'il vend en direct à la ferme ou sur les marchés locaux.",
  "Éleveur / Éleveuse": "Un éleveur élève du bétail ou des animaux de ferme et vend ses produits (viande notamment) en direct ou en circuit court.",
  "Horticulteur / Horticultrice": "Un horticulteur cultive et vend des plantes et des fleurs, en conseillant sur l'aménagement paysager et l'entretien des jardins.",
  "Maraîcher / Maraîchère": "Un maraîcher cultive des fruits et légumes et les vend directement, à la ferme, sur les marchés ou via des paniers réguliers.",
  "Viticulteur / Viticultrice": "Un viticulteur cultive la vigne et produit du vin, qu'il fait découvrir lors de visites, dégustations et ventes directes au domaine.",

  // Immobilier
  "Agence immobilière": "Une agence immobilière accompagne l'achat, la vente ou la location d'un bien, de l'estimation jusqu'à la signature.",
  "Conciergerie": "Une conciergerie gère au quotidien un bien immobilier (accueil des locataires, ménage, entretien), notamment pour les locations saisonnières.",
  "Diagnostique technique": "Un diagnostiqueur immobilier réalise les diagnostics obligatoires (DPE, amiante, électricité...) avant une vente ou une location, et fournit un rapport conforme à la réglementation.",
  "Gestionnaire de bien": "Un gestionnaire de biens administre un patrimoine locatif au nom du propriétaire : recherche de locataires, encaissement des loyers, suivi des relations locatives.",
  "Mandataire immobilier": "Un mandataire immobilier accompagne, en indépendant, l'achat ou la vente d'un bien, de l'estimation jusqu'à la conclusion de la transaction.",
  "Syndic de copropriété": "Un syndic de copropriété assure la gestion administrative, financière et technique d'un immeuble, dans le cadre fixé par la loi.",

  // Informatique & Numérique
  "Agence Web": "Une agence web conçoit et développe des sites internet, de la conception à la mise en ligne, et peut assurer leur maintenance.",
  "Community manager": "Un community manager anime les réseaux sociaux d'une entreprise et développe sa visibilité en ligne, selon une stratégie adaptée à ses objectifs.",
  "Cybersécurité": "Un expert en cybersécurité évalue les vulnérabilités d'un système informatique et met en place des solutions pour protéger les données et les accès.",
  "Graphiste": "Un graphiste crée l'identité visuelle d'une entreprise (logo, charte graphique, supports de communication) selon son image et ses objectifs.",
  "Informaticien": "Un informaticien installe, dépanne et entretient du matériel informatique, à domicile ou en entreprise.",
  "Webdesigner": "Un webdesigner conçoit l'interface et l'ergonomie d'un site ou d'une application, en alliant esthétique et expérience utilisateur.",
  "Webmaster indépendant": "Un webmaster indépendant assure la gestion, la maintenance et la mise à jour d'un site internet, pour en garantir le bon fonctionnement et la sécurité.",

  // Restauration
  "Restaurant": "Un restaurant propose des repas sur place, dans une ambiance et une cuisine adaptées à chaque occasion.",
  "Café / Bar": "Un café ou un bar accueille ses clients pour une pause, un verre ou une soirée conviviale, en journée ou en soirée.",
  "Traiteur": "Un traiteur conçoit et prépare des repas pour des événements (mariages, réceptions professionnelles), sous forme de buffet, cocktail ou menu complet.",

  // Services à la personne
  "Aide à domicile": "Une aide à domicile accompagne une personne dans les tâches du quotidien (ménage, courses, aide à la toilette) ou lui apporte une présence rassurante.",
  "Assistant administratif": "Un assistant administratif indépendant prend en charge des tâches administratives (courrier, facturation, gestion de dossiers) pour des particuliers ou des entreprises.",
  "Assistant informatique et Internet": "Cet assistant accompagne les particuliers dans l'utilisation de leurs appareils informatiques et de leurs démarches en ligne, souvent à domicile.",
  "Employé de ménage / Repassage": "Ce professionnel prend en charge l'entretien d'un logement ou du linge (ménage, repassage), de façon ponctuelle ou régulière.",
  "Garde d'animaux": "Un service de garde d'animaux prend soin d'un animal de compagnie en l'absence de son propriétaire, à domicile ou chez le prestataire.",
  "Garde d'enfants": "Une garde d'enfants veille sur des enfants de façon ponctuelle ou régulière (sortie d'école, vacances, soirée).",
  "Travaux de jardinerie": "Ce professionnel entretient un jardin (tonte, taille, débroussaillage) de façon ponctuelle ou dans le cadre d'un contrat régulier.",

  // Sport & Fitness
  "Coach sportif": "Un coach sportif élabore et encadre un programme d'entraînement personnalisé, adapté au niveau et aux objectifs de chacun.",
  "Salle de sport et de fitness": "Une salle de sport propose équipements, cours collectifs et encadrement pour s'entraîner régulièrement.",

  // Transport de personnes
  "Ambulance": "Un service d'ambulance assure le transport médicalisé de patients, pour une urgence ou un rendez-vous médical programmé.",
  "Déménagement": "Une entreprise de déménagement organise et transporte les meubles et effets personnels, en proposant souvent aussi l'emballage.",
  "Taxi": "Un taxi transporte ses clients d'un point à un autre, pour un trajet ponctuel ou réservé à l'avance.",
  "Transport de groupe": "Ce prestataire assure le transport collectif de groupes (minibus ou autocar), pour des événements ponctuels ou des déplacements réguliers.",
};

export function buildSubcategoryLandingContent(params: {
  categoryLabel: string;
  subcategoryLabel: string;
  proCount: number;
  cities: string[];
}): SubcategoryLandingContent {
  const { categoryLabel, subcategoryLabel, proCount, cities } = params;

  const intro = SUBCATEGORY_INTROS[subcategoryLabel] ?? (proCount > 0
    ? `Prolocal-Landes référence ${proCount} professionnel${proCount > 1 ? "s" : ""} en ${subcategoryLabel} dans le département des Landes${cities.length > 0 ? `, notamment à ${joinFrenchList(cities)}` : ""}. Consultez leurs fiches pour comparer leurs coordonnées, leurs avis clients et leur zone d'intervention avant de les contacter directement.`
    : null);

  const seoText = [
    `Le secteur « ${subcategoryLabel} » regroupe les entreprises et artisans spécialisés dans ce domaine au sein de la catégorie ${categoryLabel}. Sur Prolocal-Landes, chaque fiche professionnelle est vérifiée avant publication : coordonnées, horaires d'ouverture, zone d'intervention et avis clients sont centralisés au même endroit pour faciliter votre recherche.`,
    cities.length > 0
      ? `Nos professionnels en ${subcategoryLabel} sont présents notamment à ${joinFrenchList(cities)}. Grâce à la carte interactive et au moteur de recherche ci-dessus, filtrez les résultats par ville, par rayon de distance ou par mot-clé pour trouver rapidement l'interlocuteur le plus proche de chez vous.`
      : `Aucun professionnel en ${subcategoryLabel} n'est pour l'instant référencé dans les Landes — soyez parmi les premiers à y apparaître en référençant gratuitement votre entreprise.`,
    `Contactez directement un professionnel par téléphone, WhatsApp ou email depuis sa fiche, ou utilisez PROLOCAL AI pour décrire votre besoin en quelques mots et être mis en relation avec les professionnels les plus pertinents.`,
  ];

  const ctaText = `Vous exercez en ${subcategoryLabel} dans les Landes ? Référencez gratuitement votre entreprise sur Prolocal-Landes pour gagner en visibilité auprès des habitants du département et recevoir vos premières demandes de contact.`;

  return {
    intro,
    seoTitle: `Trouver un professionnel en ${subcategoryLabel} dans les Landes`,
    seoText,
    ctaText,
  };
}

const META_DESCRIPTION_MAX = 360;

/** Coupe proprement sur un mot entier plutôt qu'en plein milieu, avec une ellipse. */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max - 1)}…`;
}

/**
 * Meta description (et description OpenGraph) de la page sous-catégorie —
 * rédigée dans un ton naturel, comme on s'adresserait à un visiteur plutôt
 * qu'une accumulation de mots-clés, tout en restant pertinente localement
 * (Landes, nombre de professionnels, communes). Plafonnée à 360 caractères.
 */
export function buildSubcategoryMetaDescription(params: {
  subcategoryLabel: string;
  proCount: number;
  cityCount: number;
}): string {
  const { subcategoryLabel, proCount, cityCount } = params;

  const text = proCount > 0
    ? `Vous cherchez un professionnel en ${subcategoryLabel} dans les Landes ? Prolocal-Landes recense ${proCount} professionnel${proCount > 1 ? "s" : ""} de confiance${cityCount > 0 ? `, réparti${proCount > 1 ? "s" : ""} dans ${cityCount} commune${cityCount > 1 ? "s" : ""} du département` : ""}, avec coordonnées et avis clients, pour trouver facilement la bonne personne près de chez vous.`
    : `Vous cherchez un professionnel en ${subcategoryLabel} dans les Landes ? Aucune fiche n'est encore publiée pour ce secteur, mais notre annuaire s'enrichit chaque semaine. Vous exercez ce métier ? Référencez gratuitement votre entreprise dès maintenant.`;

  return truncate(text, META_DESCRIPTION_MAX);
}

/**
 * Questions/réponses rédigées individuellement pour chaque métier (clé =
 * libellé exact de la sous-catégorie) — insérées entre la question
 * "Combien de professionnels...", toujours calculée depuis les données
 * réelles, et la question "Comment référencer mon entreprise...", commune
 * à toutes les pages. Une sous-catégorie absente de cette liste (ex: ajout
 * récent depuis l'admin) retombe sur une question générique de secours,
 * pour qu'aucune page ne reste avec une FAQ incomplète.
 */
const SUBCATEGORY_FAQ_EXTRA: Record<string, FaqItem[]> = {
  // Alimentation & Épicerie
  "Alimentation générale": [
    { q: "Une alimentation générale dans les Landes peut-elle dépanner en dehors des horaires classiques ?", a: "De nombreuses épiceries de proximité proposent des horaires élargis, en soirée ou le dimanche. Consultez les horaires affichés sur chaque fiche pour connaître les disponibilités exactes." },
    { q: "Les épiceries générales proposent-elles des produits locaux ou régionaux ?", a: "Beaucoup de commerces de proximité dans les Landes complètent leur offre avec des produits locaux (terroir, producteurs du département) en plus des produits du quotidien." },
  ],
  "Boucherie / Charcuterie": [
    { q: "Peut-on commander à l'avance chez un boucher dans les Landes pour un événement ?", a: "Oui, la plupart des artisans bouchers-charcutiers prennent des commandes pour les fêtes, mariages ou repas de famille. Contactez directement le professionnel pour organiser votre commande." },
    { q: "Les bouchers des Landes proposent-ils de la viande locale ?", a: "De nombreux artisans travaillent avec des éleveurs locaux et proposent des viandes d'origine régionale. Renseignez-vous directement auprès du professionnel sur la provenance de ses produits." },
  ],
  "Boulangerie / Pâtisserie": [
    { q: "Peut-on commander un gâteau personnalisé chez un pâtissier dans les Landes ?", a: "Oui, la plupart des pâtissiers artisanaux réalisent des gâteaux sur-mesure pour les anniversaires, mariages et occasions spéciales. Anticipez votre commande de quelques jours selon la complexité souhaitée." },
    { q: "Les boulangeries des Landes sont-elles ouvertes le dimanche ?", a: "De nombreuses boulangeries ouvrent le dimanche matin, souvent avec une fermeture un autre jour de la semaine. Consultez les horaires précis sur chaque fiche professionnelle." },
  ],
  "Caviste / Marchand de boissons": [
    { q: "Un caviste peut-il conseiller un vin pour accompagner un repas spécifique ?", a: "Oui, c'est le rôle principal d'un caviste : il vous oriente selon le plat, le budget et vos préférences gustatives pour un accord mets-vins réussi." },
    { q: "Peut-on faire livrer une commande de vins pour un événement ?", a: "De nombreux cavistes proposent la livraison ou la préparation de commandes groupées pour les mariages, réceptions ou événements professionnels. Contactez le professionnel pour connaître ses modalités." },
  ],
  "Épicerie fine": [
    { q: "Quels types de produits trouve-t-on dans une épicerie fine des Landes ?", a: "Conserves artisanales, spécialités régionales, produits gourmets ou coffrets cadeaux : ces commerces proposent une sélection qualitative, souvent axée sur le terroir landais et les petits producteurs." },
    { q: "Une épicerie fine peut-elle préparer un panier cadeau sur-mesure ?", a: "Oui, beaucoup de ces commerces composent des coffrets ou paniers gourmands personnalisés selon votre budget et vos envies, pour offrir ou vous faire plaisir." },
  ],
  "Fromagerie / Crèmerie": [
    { q: "Une fromagerie peut-elle composer un plateau pour un événement ?", a: "Oui, la plupart des fromagers-affineurs proposent des plateaux sur-mesure adaptés au nombre d'invités et à vos goûts, pour un repas, un apéritif ou une réception." },
    { q: "Trouve-t-on des fromages locaux dans les crèmeries des Landes ?", a: "De nombreux artisans affineurs proposent des fromages de producteurs locaux ou régionaux, en complément d'une sélection nationale et internationale." },
  ],
  "Poissonnerie": [
    { q: "Comment savoir si le poisson proposé est frais du jour ?", a: "Les poissonniers affichent généralement la provenance et la date d'arrivage de leurs produits. N'hésitez pas à demander conseil directement en boutique sur la fraîcheur et l'origine." },
    { q: "Une poissonnerie peut-elle préparer le poisson (écailler, lever les filets) ?", a: "Oui, la plupart des poissonniers proposent ce service à la demande : écaillage, vidage ou levée de filets, directement en boutique." },
  ],
  "Primeurs": [
    { q: "Les primeurs des Landes proposent-ils des produits bio ou locaux ?", a: "De nombreux primeurs travaillent avec des producteurs locaux et proposent une offre bio ou de saison. Renseignez-vous directement auprès du commerçant sur l'origine de ses produits." },
    { q: "Peut-on trouver des fruits et légumes de saison toute l'année chez un primeur ?", a: "Les primeurs adaptent leur offre aux arrivages et aux saisons, avec une rotation régulière des produits pour garantir fraîcheur et qualité." },
  ],

  // Artisanat & Métiers d'art
  "Archetier": [
    { q: "Quand faut-il faire réviser un archet chez un archetier ?", a: "Un archet s'entretient régulièrement : rehaussage de la mèche, vérification du bois et des mécanismes. Un archetier recommande généralement un contrôle au moins une fois par an selon l'usage." },
    { q: "Un archetier peut-il réparer un archet ancien ou de famille ?", a: "Oui, la restauration d'archets anciens fait partie du savoir-faire de cet artisan, qui évalue l'état de la pièce avant d'intervenir." },
  ],
  "Bijoutier-Joaillier": [
    { q: "Un bijoutier peut-il transformer un bijou de famille ?", a: "Oui, de nombreux bijoutiers-joailliers proposent la transformation ou le remontage de bijoux anciens pour leur donner une nouvelle vie, selon vos envies." },
    { q: "Peut-on faire réparer une bague ou un collier abîmé ?", a: "Oui, la réparation (resserrage de pierre, redimensionnement, soudure) fait partie des prestations courantes proposées par ces artisans." },
  ],
  "Céramiste": [
    { q: "Un céramiste peut-il réaliser une pièce sur-mesure ?", a: "Oui, de nombreux céramistes réalisent des créations personnalisées (vaisselle, décoration, pièces uniques) selon vos envies et un échange préalable sur le projet." },
    { q: "Propose-t-on des ateliers d'initiation à la céramique dans les Landes ?", a: "Certains céramistes proposent des cours ou ateliers d'initiation. Contactez directement le professionnel pour connaître ses disponibilités." },
  ],
  "Chaudronnier": [
    { q: "Un chaudronnier peut-il intervenir sur une pièce métallique sur-mesure ?", a: "Oui, la fabrication de pièces sur-mesure (découpe, pliage, soudure) fait partie du cœur de métier du chaudronnier, pour des projets industriels ou artisanaux." },
    { q: "Peut-on faire réparer une pièce métallique endommagée ?", a: "Oui, la réparation et la transformation de pièces existantes sont des prestations courantes proposées par ces professionnels." },
  ],
  "Décorateur sur céramique / Peintre sur faïence ou porcelaine": [
    { q: "Peut-on faire personnaliser une pièce de vaisselle existante ?", a: "Oui, ces artisans peuvent peindre ou décorer une pièce que vous possédez déjà, selon vos motifs ou inspirations." },
    { q: "Ces artisans réalisent-ils aussi des créations entièrement sur-mesure ?", a: "Oui, en plus de la décoration, beaucoup proposent la création complète de pièces uniques en céramique, faïence ou porcelaine." },
  ],
  "Doreur à la feuille": [
    { q: "Un doreur à la feuille peut-il restaurer un cadre ancien ?", a: "Oui, la restauration de cadres, meubles ou objets anciens dorés à la feuille est une spécialité courante de cet artisan d'art." },
    { q: "La dorure à la feuille convient-elle aussi aux créations contemporaines ?", a: "Oui, cette technique traditionnelle s'applique aussi bien à la restauration patrimoniale qu'à des projets décoratifs modernes." },
  ],
  "Ébéniste": [
    { q: "Un ébéniste peut-il restaurer un meuble ancien abîmé ?", a: "Oui, la restauration de meubles anciens (réparation, finition, remplacement de pièces) fait partie des prestations courantes de cet artisan." },
    { q: "Peut-on commander un meuble sur-mesure à un ébéniste ?", a: "Oui, la création de meubles sur-mesure selon vos dimensions et votre style est une spécialité de ce métier." },
  ],
  "Encadreur": [
    { q: "Un encadreur peut-il proposer un encadrement adapté à une œuvre fragile ?", a: "Oui, l'encadreur choisit les matériaux (verre, passe-partout, fixation) en fonction de la nature de l'œuvre pour en assurer la meilleure conservation." },
    { q: "Peut-on faire encadrer un diplôme, une photo ou un objet particulier ?", a: "Oui, l'encadrement sur-mesure s'adapte à tout type de support : œuvre d'art, photo, diplôme ou objet à exposer." },
  ],
  "Ferronnier d'art": [
    { q: "Un ferronnier d'art peut-il restaurer un portail ou une grille ancienne ?", a: "Oui, la restauration d'éléments en fer forgé fait partie du savoir-faire de cet artisan, qui intervient aussi bien sur du patrimoine ancien que sur des créations récentes." },
    { q: "Peut-on commander une création sur-mesure en fer forgé ?", a: "Oui, portails, rampes d'escalier ou éléments décoratifs peuvent être conçus sur-mesure selon votre projet et vos goûts." },
  ],
  "Horloger": [
    { q: "Un horloger peut-il réparer une montre ancienne ou de famille ?", a: "Oui, la réparation et la restauration de montres et horloges anciennes font partie des spécialités courantes de cet artisan." },
    { q: "Faut-il faire réviser sa montre régulièrement chez un horloger ?", a: "Un entretien périodique (tous les quelques années selon le modèle) permet de préserver le bon fonctionnement d'une montre mécanique ou automatique." },
  ],
  "Luthier": [
    { q: "Un luthier peut-il réparer un instrument endommagé ?", a: "Oui, la réparation (fissures, mécanismes, cordes, vernis) fait partie du quotidien de cet artisan, qui évalue l'état de l'instrument avant d'intervenir." },
    { q: "Peut-on faire réviser régulièrement son instrument chez un luthier ?", a: "Oui, un entretien régulier est recommandé, notamment avant un concert ou un examen, pour garantir le meilleur son et la longévité de l'instrument." },
  ],
  "Maroquinier": [
    { q: "Un maroquinier peut-il réparer un sac ou un article en cuir abîmé ?", a: "Oui, la réparation (coutures, fermetures, teinture) fait partie des prestations courantes de cet artisan du cuir." },
    { q: "Peut-on commander une création en cuir sur-mesure ?", a: "Oui, de nombreux maroquiniers réalisent des pièces personnalisées selon vos dimensions, votre style et l'usage souhaité." },
  ],
  "Souffleur de verre / Verrier à la main": [
    { q: "Un souffleur de verre peut-il réaliser une pièce sur-mesure ?", a: "Oui, la création de pièces uniques selon vos envies (forme, couleur, taille) fait partie du savoir-faire de cet artisan d'art." },
    { q: "Peut-on assister à une démonstration de soufflage de verre dans les Landes ?", a: "Certains ateliers proposent des démonstrations ou visites. Contactez directement l'artisan pour connaître ses disponibilités." },
  ],
  "Tailleur de pierre": [
    { q: "Un tailleur de pierre peut-il restaurer un élément de patrimoine ancien ?", a: "Oui, la restauration de façades, monuments ou éléments en pierre fait partie des spécialités de cet artisan, souvent sollicité pour des projets de rénovation patrimoniale." },
    { q: "Peut-on commander une création sur-mesure en pierre ?", a: "Oui, ce professionnel réalise aussi des pièces neuves (éléments décoratifs, aménagements) selon votre projet et vos dimensions." },
  ],
  "Tapissier d'ameublement": [
    { q: "Un tapissier peut-il redonner vie à un fauteuil ancien ?", a: "Oui, la restauration de sièges anciens (structure, garnissage, tissu) est le cœur de métier de cet artisan, qui vous conseille sur le choix des matières." },
    { q: "Peut-on choisir son propre tissu pour la rénovation d'un siège ?", a: "Oui, le choix du tissu et des finitions se fait généralement avec vous, selon votre budget et le style recherché." },
  ],
  "Vitrailliste": [
    { q: "Un vitrailliste peut-il restaurer un vitrail ancien endommagé ?", a: "Oui, la restauration de vitraux anciens (plomb, verre, structure) fait partie des spécialités courantes de cet artisan d'art." },
    { q: "Peut-on commander un vitrail sur-mesure pour une habitation ?", a: "Oui, de nombreux vitraillistes réalisent des créations contemporaines sur-mesure, en plus des travaux de restauration patrimoniale." },
  ],

  // Bâtiment & Travaux
  "Architecte": [
    { q: "À partir de quelle surface un architecte est-il obligatoire pour une construction ?", a: "En France, le recours à un architecte est obligatoire au-delà d'un certain seuil de surface de plancher (généralement 150 m² pour un particulier). Un architecte des Landes peut vous confirmer votre situation précise." },
    { q: "Un architecte peut-il aussi suivre le chantier jusqu'à la fin des travaux ?", a: "Oui, selon la mission confiée, l'architecte peut intervenir de la conception jusqu'au suivi complet du chantier et la réception des travaux." },
  ],
  "Carreleur": [
    { q: "Combien de temps dure en moyenne la pose de carrelage dans une pièce ?", a: "La durée varie selon la surface, le type de carrelage et la préparation du support. Un carreleur des Landes pourra vous donner une estimation précise après avoir vu votre projet." },
    { q: "Un carreleur peut-il aussi poser du carrelage extérieur ou de la faïence murale ?", a: "Oui, ce professionnel intervient aussi bien sur les sols intérieurs et extérieurs que sur les murs (salle de bain, cuisine, façade)." },
  ],
  "Charpentier": [
    { q: "Quand faut-il faire appel à un charpentier en urgence ?", a: "En cas de dégât des eaux, d'affaissement ou de signe de faiblesse de la charpente, il est recommandé de contacter rapidement un charpentier pour éviter l'aggravation du problème." },
    { q: "Un charpentier intervient-il aussi pour l'aménagement de combles ?", a: "Oui, la création ou le renforcement de charpente pour aménager des combles habitables fait partie de ses interventions courantes." },
  ],
  "Couvreur": [
    { q: "Quand faut-il faire appel à un couvreur en urgence ?", a: "En cas de fuite, de tuiles déplacées après une tempête ou d'infiltration visible, il est recommandé de contacter rapidement un couvreur pour limiter les dégâts." },
    { q: "Un couvreur peut-il aussi intervenir sur l'isolation de la toiture ?", a: "Oui, de nombreux couvreurs proposent des travaux d'isolation combinés à la rénovation de toiture, notamment dans le cadre d'une rénovation énergétique." },
  ],
  "Électricien": [
    { q: "Quand faut-il faire appel à un électricien en urgence ?", a: "Coupure de courant, disjoncteur qui saute en permanence ou odeur de brûlé sont des signes qui justifient une intervention rapide d'un électricien." },
    { q: "Un électricien peut-il réaliser la mise aux normes d'une installation ancienne ?", a: "Oui, la mise en conformité d'une installation électrique ancienne est une intervention courante, notamment avant une vente ou une rénovation." },
  ],
  "Expert en bâtiment": [
    { q: "Quand faire appel à un expert en bâtiment ?", a: "Avant un achat immobilier, en cas de malfaçon après travaux, ou pour un désaccord avec un professionnel, un expert en bâtiment apporte un avis technique indépendant qui peut servir de base à une négociation ou une procédure." },
    { q: "Un rapport d'expertise bâtiment a-t-il une valeur juridique ?", a: "Le rapport rédigé par un expert en bâtiment peut être utilisé comme élément de preuve technique en cas de litige, notamment auprès d'un assureur ou dans une procédure judiciaire." },
  ],
  "Maçon": [
    { q: "Un maçon peut-il intervenir aussi bien sur une construction neuve qu'une rénovation ?", a: "Oui, ce professionnel intervient sur les constructions neuves (fondations, murs, dalles) comme sur les travaux de rénovation ou d'extension." },
    { q: "Combien de temps dure en moyenne un chantier de maçonnerie ?", a: "La durée dépend fortement de l'ampleur du projet (extension, gros œuvre complet, réparation). Un maçon des Landes pourra vous donner un délai précis après avoir étudié votre projet." },
  ],
  "Menuisier": [
    { q: "Un menuisier peut-il remplacer des fenêtres pour améliorer l'isolation ?", a: "Oui, le remplacement de menuiseries anciennes par des modèles plus performants fait partie des interventions courantes dans le cadre d'une rénovation énergétique." },
    { q: "Un menuisier réalise-t-il aussi des aménagements intérieurs sur-mesure ?", a: "Oui, dressing, placards ou escaliers sur-mesure font partie des prestations proposées par de nombreux menuisiers, en plus de la pose de portes et fenêtres." },
  ],
  "Peintre en bâtiment": [
    { q: "Un peintre en bâtiment peut-il conseiller sur le choix des couleurs ?", a: "Oui, la plupart des peintres en bâtiment vous accompagnent dans le choix des teintes et finitions adaptées à chaque pièce et à la luminosité de votre logement." },
    { q: "Combien de temps faut-il prévoir pour repeindre une pièce ?", a: "Cela dépend de la surface, de l'état des supports et du nombre de couches nécessaires. Un peintre en bâtiment des Landes pourra vous donner un délai précis après avoir vu les lieux." },
  ],
  "Plaquiste": [
    { q: "Un plaquiste peut-il créer une cloison pour diviser une pièce ?", a: "Oui, la création de cloisons pour réorganiser un espace intérieur est une intervention courante de ce professionnel." },
    { q: "Un plaquiste intervient-il aussi sur l'isolation thermique ou phonique ?", a: "Oui, la pose de plaques de plâtre s'accompagne souvent d'une isolation intégrée, thermique ou phonique, selon vos besoins." },
  ],
  "Plombier-chauffagiste": [
    { q: "Quand faut-il faire appel à un plombier-chauffagiste en urgence ?", a: "Fuite d'eau, panne de chauffage en hiver ou dégât des eaux justifient une intervention rapide. De nombreux plombiers-chauffagistes des Landes proposent un service d'urgence." },
    { q: "Un plombier-chauffagiste peut-il aussi installer une chaudière ou une pompe à chaleur ?", a: "Oui, l'installation et l'entretien d'équipements de chauffage (chaudière, pompe à chaleur, ballon d'eau chaude) font partie de ses compétences courantes." },
  ],

  // Beauté & Bien-être
  "Coiffeur": [
    { q: "Faut-il prendre rendez-vous à l'avance chez un coiffeur dans les Landes ?", a: "C'est recommandé, surtout en période de forte demande (vacances, fêtes). Certains salons acceptent aussi les clients sans rendez-vous selon leur disponibilité." },
    { q: "Un coiffeur peut-il proposer un diagnostic capillaire avant une prestation ?", a: "Oui, de nombreux coiffeurs réalisent un diagnostic (nature du cheveu, du cuir chevelu) avant de conseiller une coupe, une couleur ou un soin adapté." },
  ],
  "Esthéticienne": [
    { q: "Quels types de soins propose une esthéticienne ?", a: "Soins du visage, épilation, manucure ou prestations de bien-être : les esthéticiennes proposent une large palette de soins, variable selon chaque institut." },
    { q: "Faut-il prendre rendez-vous pour un soin esthétique ?", a: "Oui, il est généralement recommandé de réserver à l'avance, notamment pour les soins plus longs ou avant un événement particulier." },
  ],
  "Maquilleur professionnel": [
    { q: "Faut-il prévoir un essai maquillage avant un mariage ?", a: "C'est vivement recommandé : un essai permet d'ajuster le style souhaité et de s'assurer du rendu avant le jour J." },
    { q: "Un maquilleur professionnel se déplace-t-il à domicile ?", a: "De nombreux maquilleurs proposent un déplacement à domicile ou sur le lieu de l'événement, notamment pour les mariages. Renseignez-vous directement auprès du professionnel." },
  ],
  "Naturopathe": [
    { q: "Que se passe-t-il lors d'une première consultation chez un naturopathe ?", a: "Le praticien réalise généralement un bilan complet de votre hygiène de vie (alimentation, sommeil, stress) avant de proposer des conseils personnalisés et naturels." },
    { q: "La naturopathie remplace-t-elle un suivi médical classique ?", a: "Non, la naturopathie est une approche complémentaire et ne se substitue pas à un avis ou un traitement médical en cas de pathologie." },
  ],
  "Praticien en massage bien-être": [
    { q: "Quels types de massages propose un praticien en massage bien-être ?", a: "Les techniques varient selon le praticien (relaxant, californien, sportif...) et s'adaptent à vos besoins : détente, récupération musculaire ou simple moment de bien-être." },
    { q: "Faut-il un motif médical pour consulter un praticien en massage bien-être ?", a: "Non, ces séances sont accessibles pour un simple moment de détente, sans prescription médicale nécessaire." },
  ],
  "Prothésiste ongulaire": [
    { q: "Combien de temps dure une pose d'ongles chez une prothésiste ongulaire ?", a: "La durée varie selon la prestation (pose simple, nail art, remplissage), généralement entre 1h et 2h. La professionnelle pourra vous préciser le temps nécessaire selon votre demande." },
    { q: "Faut-il prendre rendez-vous pour un soin des ongles ?", a: "Oui, il est recommandé de réserver à l'avance, notamment avant un événement ou pour les prestations les plus demandées." },
  ],
  "Sophrologue / Réflexologue": [
    { q: "Combien de séances sont nécessaires avec un sophrologue ou un réflexologue ?", a: "Cela dépend de votre objectif et de votre ressenti personnel. Certains consultent ponctuellement, d'autres choisissent un suivi régulier sur plusieurs séances." },
    { q: "Ces séances sont-elles adaptées à la gestion du stress au travail ?", a: "Oui, la sophrologie et la réflexologie sont souvent utilisées pour accompagner la gestion du stress, de l'anxiété ou des tensions liées au quotidien professionnel." },
  ],

  // Commerce & Vente
  "Ameublement": [
    { q: "Un magasin d'ameublement propose-t-il un service de conseil en agencement ?", a: "Oui, de nombreux magasins proposent un accompagnement pour l'agencement de vos espaces, selon vos dimensions et votre style." },
    { q: "Peut-on commander un meuble sur-mesure dans ces magasins ?", a: "Certains magasins d'ameublement proposent des meubles sur-mesure ou des options de personnalisation. Renseignez-vous directement auprès du commerçant." },
  ],
  "Décoration": [
    { q: "Une boutique de décoration propose-t-elle des conseils d'aménagement ?", a: "Oui, de nombreux commerces de décoration conseillent leurs clients sur l'harmonie des couleurs, des matières et des styles pour un intérieur cohérent." },
    { q: "Peut-on trouver des objets de décoration pour toutes les occasions ?", a: "Oui, ces boutiques proposent généralement une offre variée adaptée aux saisons, fêtes et occasions de cadeaux." },
  ],
  "Électroménager / Multimédia": [
    { q: "Un magasin d'électroménager propose-t-il la livraison et l'installation ?", a: "De nombreux magasins proposent la livraison et parfois l'installation de l'appareil acheté. Renseignez-vous directement auprès du commerçant sur ses modalités." },
    { q: "Peut-on faire réparer un appareil électroménager en panne ?", a: "Certains magasins proposent un service après-vente ou orientent vers un réparateur partenaire. Contactez le professionnel pour connaître ses solutions." },
  ],
  "Ésotérique": [
    { q: "Quels types de prestations propose une boutique ésotérique ?", a: "Objets, pierres, tarot, soins énergétiques ou conseils personnalisés : l'offre varie selon chaque professionnel et ses spécialités." },
    { q: "Faut-il prendre rendez-vous pour une consultation ésotérique ?", a: "C'est généralement recommandé, notamment pour les consultations individuelles. Contactez directement le professionnel pour connaître ses disponibilités." },
  ],
  "Fleuriste": [
    { q: "Un fleuriste peut-il livrer un bouquet le jour même ?", a: "De nombreux fleuristes proposent une livraison rapide, parfois le jour même selon les disponibilités. Contactez directement le professionnel pour connaître ses délais." },
    { q: "Un fleuriste peut-il s'occuper de la décoration florale complète d'un mariage ?", a: "Oui, de nombreux fleuristes proposent des prestations complètes pour les événements : bouquets, compositions de salle et décorations sur-mesure." },
  ],
  "Friperie": [
    { q: "Peut-on vendre ses propres vêtements dans une friperie ?", a: "Certaines friperies rachètent ou proposent des dépôts-ventes de vêtements. Renseignez-vous directement auprès du commerçant sur ses conditions." },
    { q: "Les vêtements de friperie sont-ils triés par taille ou par style ?", a: "L'organisation varie selon chaque boutique, mais la plupart organisent leur offre pour faciliter la recherche selon la taille, le style ou la saison." },
  ],
  "Garage automobile": [
    { q: "Un garage automobile peut-il effectuer le contrôle technique ?", a: "Cela dépend du garage : certains sont agréés pour réaliser le contrôle technique, d'autres orientent vers un centre partenaire. Renseignez-vous directement auprès du professionnel." },
    { q: "Peut-on obtenir un véhicule de remplacement pendant une réparation ?", a: "Certains garages proposent un véhicule de courtoisie pendant la durée des travaux. Vérifiez cette option directement avec le professionnel." },
  ],
  "Habillement": [
    { q: "Les boutiques de vêtements des Landes proposent-elles des retouches ?", a: "Certaines boutiques proposent un service de retouche sur place ou orientent vers un partenaire. Renseignez-vous directement auprès du commerçant." },
    { q: "Peut-on trouver des vêtements pour toutes les tailles et tous les âges ?", a: "L'offre varie selon chaque boutique : certaines sont spécialisées (enfant, grande taille, mode spécifique), d'autres proposent une gamme plus large." },
  ],
  "Jardinerie": [
    { q: "Une jardinerie peut-elle conseiller sur l'entretien des plantes selon la saison ?", a: "Oui, les jardineries accompagnent leurs clients tout au long de l'année sur le choix des végétaux, l'arrosage et les traitements adaptés à chaque saison." },
    { q: "Peut-on trouver du matériel de jardinage et des équipements extérieurs en jardinerie ?", a: "Oui, en plus des végétaux, ces commerces proposent généralement outils, mobilier de jardin et accessoires d'aménagement extérieur." },
  ],
  "Librairie": [
    { q: "Une librairie peut-elle commander un livre non disponible en rayon ?", a: "Oui, la plupart des librairies peuvent commander un ouvrage spécifique et vous prévenir dès sa réception, généralement sous quelques jours." },
    { q: "Les libraires proposent-ils des conseils de lecture personnalisés ?", a: "Oui, c'est l'un des atouts majeurs d'une librairie indépendante : un conseil adapté à vos goûts, contrairement à un simple rayon en libre-service." },
  ],
  "Motoculture": [
    { q: "Un spécialiste en motoculture peut-il réparer une tondeuse en panne ?", a: "Oui, la réparation et l'entretien de matériel motorisé (tondeuse, débroussailleuse, tronçonneuse) font partie des services courants proposés par ces professionnels." },
    { q: "Faut-il faire réviser son matériel de motoculture chaque année ?", a: "Un entretien annuel est recommandé avant la reprise de la saison pour garantir le bon fonctionnement et la sécurité de votre équipement." },
  ],
  "Parfumerie": [
    { q: "Une parfumerie peut-elle proposer un échantillon avant l'achat ?", a: "Oui, la plupart des parfumeries proposent des échantillons ou vous laissent tester le produit en boutique avant de faire votre choix." },
    { q: "Les parfumeries proposent-elles aussi des produits de soin visage et corps ?", a: "Oui, en complément des parfums, ces commerces proposent souvent une gamme de cosmétiques et de produits de soin." },
  ],
  "Pharmacie": [
    { q: "Une pharmacie peut-elle conseiller sans ordonnance ?", a: "Oui, les pharmaciens peuvent conseiller des produits sans ordonnance pour des maux courants, dans la limite de leurs compétences et en vous orientant vers un médecin si nécessaire." },
    { q: "Les pharmacies des Landes assurent-elles des gardes le week-end ?", a: "Oui, un système de garde organise la disponibilité des pharmacies en dehors des horaires habituels. Consultez les informations affichées localement pour connaître la pharmacie de garde." },
  ],
  "Tabac / Presse": [
    { q: "Un bureau de tabac peut-il proposer d'autres services que le tabac et la presse ?", a: "Beaucoup de bureaux de tabac proposent aussi jeux à gratter, timbres, recharges téléphoniques ou point relais colis. Renseignez-vous directement auprès du commerçant." },
    { q: "Ces commerces sont-ils ouverts tôt le matin ?", a: "De nombreux bureaux de tabac ouvrent tôt pour la presse du matin. Consultez les horaires précis affichés sur chaque fiche." },
  ],
  "Troc / Dépôt vente": [
    { q: "Comment fonctionne un dépôt-vente ?", a: "Vous déposez un objet que le commerçant met en vente ; une commission est généralement prélevée lors de la vente. Les modalités précises varient selon chaque commerce." },
    { q: "Quels types d'objets peut-on vendre ou acheter en dépôt-vente ?", a: "Mobilier, vêtements, objets de décoration ou articles divers : l'offre dépend de la spécialité de chaque commerce. Renseignez-vous directement auprès du professionnel." },
  ],

  // Culture & Élevage
  "Apiculteur / Apicultrice": [
    { q: "Peut-on acheter du miel directement chez un apiculteur des Landes ?", a: "Oui, de nombreux apiculteurs vendent directement leur production à la ferme ou sur les marchés locaux. Contactez le producteur pour connaître ses modalités de vente." },
    { q: "Un apiculteur peut-il intervenir pour retirer un essaim d'abeilles ?", a: "Certains apiculteurs proposent ce service de récupération d'essaims. Contactez directement le professionnel pour vérifier sa disponibilité." },
  ],
  "Aquaculteur / Aquacultrice": [
    { q: "Peut-on acheter directement les produits d'un aquaculteur des Landes ?", a: "Oui, de nombreux aquaculteurs proposent la vente directe à la ferme ou sur les marchés locaux. Contactez le producteur pour connaître ses disponibilités." },
    { q: "Les produits aquacoles locaux sont-ils disponibles toute l'année ?", a: "La disponibilité dépend des espèces élevées et des cycles de production. Renseignez-vous directement auprès du producteur sur ses périodes de récolte." },
  ],
  "Arboriculteur / Arboricultrice": [
    { q: "Peut-on acheter des fruits directement chez un arboriculteur des Landes ?", a: "Oui, de nombreux arboriculteurs proposent la vente directe à la ferme, sur les marchés ou en cueillette selon la saison des fruits." },
    { q: "Un arboriculteur peut-il conseiller sur l'entretien d'un verger personnel ?", a: "Certains producteurs partagent volontiers leur expérience sur la taille, la plantation ou l'entretien d'arbres fruitiers. N'hésitez pas à les solliciter." },
  ],
  "Éleveur / Éleveuse": [
    { q: "Peut-on acheter de la viande directement chez un éleveur des Landes ?", a: "Oui, la vente directe à la ferme ou en colis est proposée par de nombreux éleveurs locaux. Contactez le producteur pour connaître ses modalités et ses disponibilités." },
    { q: "Les éleveurs des Landes pratiquent-ils la vente en circuit court ?", a: "De nombreux éleveurs privilégient la vente directe ou les circuits courts, pour une viande traçable issue de leur propre exploitation." },
  ],
  "Horticulteur / Horticultrice": [
    { q: "Un horticulteur peut-il conseiller sur l'aménagement d'un jardin ?", a: "Oui, ces producteurs partagent leur expertise sur le choix des végétaux adaptés à votre sol, votre exposition et vos envies esthétiques." },
    { q: "Peut-on acheter directement les plantes chez un horticulteur des Landes ?", a: "Oui, de nombreux horticulteurs proposent la vente directe de leur production, sur place ou lors de marchés locaux." },
  ],
  "Maraîcher / Maraîchère": [
    { q: "Peut-on acheter des paniers de légumes directement chez un maraîcher des Landes ?", a: "Oui, de nombreux maraîchers proposent des paniers réguliers ou la vente directe à la ferme et sur les marchés locaux, selon la saison." },
    { q: "Les maraîchers des Landes proposent-ils des produits bio ?", a: "Certains producteurs sont certifiés bio, d'autres pratiquent une agriculture raisonnée. Renseignez-vous directement auprès du maraîcher sur ses méthodes de culture." },
  ],
  "Viticulteur / Viticultrice": [
    { q: "Peut-on visiter l'exploitation d'un viticulteur des Landes ?", a: "De nombreux viticulteurs proposent des visites et dégustations sur leur domaine. Contactez directement le producteur pour organiser votre venue." },
    { q: "Peut-on acheter du vin directement à la propriété ?", a: "Oui, la vente directe au domaine est une pratique courante chez les viticulteurs, souvent accompagnée d'une dégustation." },
  ],

  // Immobilier
  "Agence immobilière": [
    { q: "Quels sont les frais d'agence lors d'une vente ou d'une location ?", a: "Les honoraires varient selon chaque agence et le type de prestation (vente, location, gestion). Demandez un détail précis directement à l'agence immobilière concernée." },
    { q: "Une agence immobilière peut-elle estimer gratuitement un bien ?", a: "Oui, la plupart des agences proposent une estimation gratuite et sans engagement avant une mise en vente ou en location." },
  ],
  "Conciergerie": [
    { q: "Une conciergerie gère-t-elle les locations de courte durée (type Airbnb) ?", a: "Oui, c'est l'une des missions courantes d'une conciergerie : gestion des réservations, accueil des voyageurs, ménage et entretien du bien entre deux séjours." },
    { q: "Quels services inclut généralement une conciergerie ?", a: "Accueil des locataires, ménage, gestion des clés, maintenance ou communication avec les voyageurs : les prestations varient selon chaque professionnel." },
  ],
  "Diagnostique technique": [
    { q: "Quels diagnostics immobiliers sont obligatoires avant une vente ?", a: "Selon le bien, plusieurs diagnostics peuvent être requis : DPE, amiante, plomb, électricité, gaz ou termites. Un diagnostiqueur certifié des Landes vous indiquera les diagnostics applicables à votre situation." },
    { q: "Combien de temps est valable un diagnostic de performance énergétique (DPE) ?", a: "Le DPE est généralement valable 10 ans, sauf changement réglementaire. Un diagnostiqueur pourra vous confirmer la validité de votre document actuel." },
  ],
  "Gestionnaire de bien": [
    { q: "Un gestionnaire de biens s'occupe-t-il de trouver un locataire ?", a: "Oui, la recherche et la sélection de locataires font généralement partie des missions d'un gestionnaire de biens, en plus du suivi locatif." },
    { q: "Quels sont les avantages de confier son bien à un gestionnaire ?", a: "Vous déléguez les démarches administratives, l'encaissement des loyers et la gestion des éventuels litiges, pour un investissement locatif plus serein." },
  ],
  "Mandataire immobilier": [
    { q: "Quelle est la différence entre un mandataire immobilier et une agence classique ?", a: "Le mandataire est un professionnel indépendant, souvent avec des frais réduits, qui vous accompagne personnellement sur votre projet de vente ou d'achat." },
    { q: "Un mandataire immobilier peut-il réaliser l'estimation d'un bien ?", a: "Oui, l'estimation fait partie de ses missions principales avant la mise en vente d'un bien." },
  ],
  "Syndic de copropriété": [
    { q: "Quelles sont les missions principales d'un syndic de copropriété ?", a: "Gestion administrative et financière de l'immeuble, organisation des assemblées générales, suivi des travaux et des contrats : les missions sont encadrées par la loi." },
    { q: "Un copropriétaire peut-il changer de syndic ?", a: "Oui, le changement de syndic se décide en assemblée générale selon une procédure encadrée. Un syndic des Landes peut vous renseigner sur les modalités." },
  ],

  // Informatique & Numérique
  "Agence Web": [
    { q: "Combien de temps faut-il pour créer un site internet professionnel ?", a: "Cela dépend de la complexité du projet (vitrine simple, e-commerce, fonctionnalités sur-mesure). Une agence web des Landes pourra vous donner un délai précis après avoir étudié vos besoins." },
    { q: "Une agence web assure-t-elle aussi la maintenance après la mise en ligne ?", a: "Oui, de nombreuses agences proposent des contrats de maintenance et de mise à jour après la livraison du site." },
  ],
  "Community manager": [
    { q: "Un community manager peut-il gérer plusieurs réseaux sociaux en même temps ?", a: "Oui, la gestion simultanée de plusieurs plateformes (Facebook, Instagram, LinkedIn...) fait partie des missions courantes de ce professionnel." },
    { q: "Combien de temps avant de voir des résultats sur les réseaux sociaux ?", a: "Les résultats varient selon la stratégie et la régularité de publication. Un community manager vous conseillera sur un planning réaliste selon vos objectifs." },
  ],
  "Cybersécurité": [
    { q: "Une petite entreprise a-t-elle vraiment besoin d'un expert en cybersécurité ?", a: "Oui, les petites structures sont aussi ciblées par les cyberattaques. Un audit permet d'identifier les failles et de sécuriser vos données, même à petite échelle." },
    { q: "Que fait un expert en cybersécurité lors d'un audit ?", a: "Il évalue les vulnérabilités de votre système informatique et propose des solutions adaptées pour protéger vos données et vos accès." },
  ],
  "Graphiste": [
    { q: "Un graphiste peut-il créer un logo et toute l'identité visuelle d'une entreprise ?", a: "Oui, la création d'une identité visuelle complète (logo, charte graphique, supports de communication) est une prestation courante proposée par ces professionnels." },
    { q: "Combien de temps faut-il pour la création d'un logo ?", a: "Cela varie selon le nombre de propositions et d'échanges nécessaires. Un graphiste des Landes pourra vous donner un délai précis selon votre projet." },
  ],
  "Informaticien": [
    { q: "Un informaticien peut-il intervenir à domicile pour un dépannage ?", a: "Oui, de nombreux informaticiens indépendants se déplacent à domicile ou en entreprise pour un dépannage ou une installation." },
    { q: "Un informaticien peut-il récupérer des données après une panne ?", a: "Selon la nature de la panne, une récupération de données est souvent possible. Contactez directement le professionnel pour évaluer votre situation." },
  ],
  "Webdesigner": [
    { q: "Quelle est la différence entre un webdesigner et un développeur web ?", a: "Le webdesigner conçoit l'apparence et l'ergonomie du site (interface, expérience utilisateur), tandis que le développeur s'occupe de la partie technique et fonctionnelle." },
    { q: "Un webdesigner peut-il aussi adapter un site pour mobile ?", a: "Oui, l'adaptation responsive (mobile, tablette) fait partie des compétences essentielles de ce professionnel aujourd'hui." },
  ],
  "Webmaster indépendant": [
    { q: "Un webmaster peut-il reprendre la gestion d'un site déjà existant ?", a: "Oui, la reprise de maintenance d'un site existant est une prestation courante, même si le webmaster n'est pas à l'origine de sa création." },
    { q: "À quelle fréquence faut-il mettre à jour son site internet ?", a: "Cela dépend du type de site, mais des mises à jour régulières (sécurité, contenu) sont recommandées pour garantir performance et sécurité." },
  ],

  // Restauration
  "Restaurant": [
    { q: "Faut-il réserver à l'avance dans les restaurants des Landes ?", a: "C'est recommandé, en particulier le week-end, pendant les vacances ou pour un grand nombre de convives. Contactez directement l'établissement pour vérifier la disponibilité." },
    { q: "Les restaurants des Landes proposent-ils des menus adaptés aux allergies ?", a: "De nombreux établissements s'adaptent aux régimes spécifiques sur demande. Signalez vos allergies ou restrictions lors de votre réservation." },
  ],
  "Café / Bar": [
    { q: "Les cafés et bars des Landes organisent-ils des événements ou soirées à thème ?", a: "Certains établissements proposent des soirées musicales, des quiz ou des événements sportifs. Renseignez-vous directement auprès de l'établissement sur sa programmation." },
    { q: "Peut-on privatiser un bar pour un événement privé ?", a: "Certains établissements proposent la privatisation partielle ou totale selon le nombre d'invités. Contactez directement le professionnel pour organiser votre événement." },
  ],
  "Traiteur": [
    { q: "Combien de temps à l'avance faut-il réserver un traiteur pour un mariage ?", a: "Il est recommandé de réserver plusieurs mois à l'avance, notamment en haute saison, pour s'assurer de la disponibilité du traiteur et affiner le menu ensemble." },
    { q: "Un traiteur peut-il s'adapter à un budget ou un nombre d'invités précis ?", a: "Oui, la plupart des traiteurs proposent des formules modulables selon votre budget, le type d'événement et le nombre de convives." },
  ],

  // Services à la personne
  "Aide à domicile": [
    { q: "Quelles tâches peut prendre en charge une aide à domicile ?", a: "Courses, ménage, préparation de repas, aide à la toilette ou simple présence : les missions varient selon les besoins de la personne accompagnée." },
    { q: "Peut-on bénéficier d'aides financières pour une aide à domicile ?", a: "Des aides existent selon votre situation (âge, perte d'autonomie, ressources). Renseignez-vous auprès du professionnel ou des organismes compétents pour connaître vos droits." },
  ],
  "Assistant administratif": [
    { q: "Un assistant administratif indépendant peut-il travailler à distance ?", a: "Oui, de nombreuses missions (courrier, facturation, gestion de dossiers) peuvent être réalisées à distance, selon vos besoins et les outils utilisés." },
    { q: "Quelles entreprises font appel à un assistant administratif indépendant ?", a: "Indépendants, artisans, TPE/PME ou associations font souvent appel à ce professionnel pour externaliser leurs tâches administratives sans embaucher." },
  ],
  "Assistant informatique et Internet": [
    { q: "Un assistant informatique peut-il aider les personnes peu à l'aise avec les écrans ?", a: "Oui, c'est l'une des missions principales de ce professionnel : accompagner pas à pas dans l'utilisation d'un ordinateur, d'un smartphone ou de démarches en ligne." },
    { q: "Un assistant informatique se déplace-t-il à domicile ?", a: "De nombreux professionnels proposent des interventions à domicile pour un accompagnement personnalisé et rassurant." },
  ],
  "Employé de ménage / Repassage": [
    { q: "Peut-on bénéficier d'un crédit d'impôt pour un service de ménage ?", a: "Oui, les services à la personne comme le ménage ou le repassage ouvrent droit, sous conditions, à un crédit d'impôt. Renseignez-vous auprès du professionnel sur les modalités (CESU, déclaration)." },
    { q: "Peut-on demander une intervention ponctuelle ou seulement un contrat régulier ?", a: "Les deux formules existent généralement : intervention ponctuelle pour un besoin précis, ou contrat régulier pour un entretien suivi de votre logement." },
  ],
  "Garde d'animaux": [
    { q: "Un service de garde d'animaux intervient-il à domicile ou accueille-t-il l'animal ?", a: "Les deux formules existent selon le professionnel : garde chez vous (visites ou présence) ou accueil de l'animal chez le prestataire." },
    { q: "Peut-on faire garder son animal pour un simple week-end ?", a: "Oui, la garde ponctuelle (week-end, vacances) est une demande courante prise en charge par ces professionnels." },
  ],
  "Garde d'enfants": [
    { q: "Une garde d'enfants peut-elle intervenir pour la sortie d'école uniquement ?", a: "Oui, les interventions ponctuelles (sortie d'école, quelques heures) sont possibles en plus des gardes régulières ou à la journée." },
    { q: "Peut-on bénéficier d'aides financières pour la garde d'enfants ?", a: "Oui, sous conditions, des aides existent (CAF, crédit d'impôt). Renseignez-vous auprès du professionnel ou des organismes compétents pour connaître vos droits." },
  ],
  "Travaux de jardinerie": [
    { q: "Un professionnel des travaux de jardinerie peut-il intervenir ponctuellement ou seulement en contrat régulier ?", a: "Les deux formules sont généralement proposées : intervention ponctuelle (taille, débroussaillage) ou entretien régulier de votre jardin tout au long de l'année." },
    { q: "Peut-on faire appel à ce professionnel pour l'élagage d'arbres ?", a: "Cela dépend du professionnel et de la hauteur des arbres concernés — certaines interventions nécessitent un élagueur spécialisé. Renseignez-vous directement sur ses compétences." },
  ],

  // Sport & Fitness
  "Coach sportif": [
    { q: "Un coach sportif peut-il intervenir à domicile ou en extérieur ?", a: "Oui, de nombreux coachs proposent des séances à domicile, en extérieur ou en salle, selon vos préférences et votre matériel disponible." },
    { q: "Faut-il être sportif confirmé pour faire appel à un coach sportif ?", a: "Non, un coach adapte son programme à tous les niveaux, du débutant au sportif confirmé, selon vos objectifs personnels." },
  ],
  "Salle de sport et de fitness": [
    { q: "Les salles de sport des Landes proposent-elles des cours collectifs ?", a: "De nombreuses salles proposent des cours collectifs (cardio, renforcement, cours dirigés) en plus de l'accès libre aux équipements." },
    { q: "Peut-on essayer une salle de sport avant de s'abonner ?", a: "De nombreuses salles proposent une séance d'essai ou une visite gratuite. Renseignez-vous directement auprès de l'établissement." },
  ],

  // Transport de personnes
  "Ambulance": [
    { q: "Un transport en ambulance est-il remboursé par l'Assurance Maladie ?", a: "Sous certaines conditions (prescription médicale, motif du transport), les frais peuvent être pris en charge. Renseignez-vous auprès du professionnel ou de votre caisse d'assurance maladie." },
    { q: "Peut-on réserver un transport médical à l'avance pour un rendez-vous programmé ?", a: "Oui, la réservation à l'avance est recommandée pour les rendez-vous médicaux programmés (consultation, examen, hospitalisation)." },
  ],
  "Déménagement": [
    { q: "Combien de temps à l'avance faut-il réserver une entreprise de déménagement ?", a: "Il est recommandé de réserver plusieurs semaines à l'avance, notamment en période de forte demande (été, fins de mois), pour garantir la disponibilité du professionnel." },
    { q: "Une entreprise de déménagement propose-t-elle l'emballage des affaires ?", a: "Oui, de nombreuses entreprises proposent un service d'emballage et de fourniture de cartons en plus du transport." },
  ],
  "Taxi": [
    { q: "Peut-on réserver un taxi à l'avance dans les Landes ?", a: "Oui, la réservation à l'avance est possible et recommandée, notamment pour un départ en gare ou en aéroport à heure fixe." },
    { q: "Les taxis des Landes prennent-ils en charge les trajets conventionnés (transport médical) ?", a: "Certains taxis sont conventionnés pour le transport médical assis. Renseignez-vous directement auprès du professionnel sur cette prestation." },
  ],
  "Transport de groupe": [
    { q: "Quel type de véhicule est utilisé pour un transport de groupe ?", a: "Cela dépend du nombre de passagers et du trajet : minibus ou autocar selon le prestataire. Précisez vos besoins pour obtenir un devis adapté." },
    { q: "Peut-on réserver un transport de groupe pour un événement ponctuel (mariage, sortie scolaire) ?", a: "Oui, ces prestataires s'adressent aussi bien aux événements ponctuels qu'aux déplacements réguliers pour des groupes constitués." },
  ],
};

export function buildSubcategoryFaq(params: {
  subcategoryLabel: string;
}): FaqItem[] {
  const { subcategoryLabel } = params;
  const specific = SUBCATEGORY_FAQ_EXTRA[subcategoryLabel] ?? [{
    q: `Comment choisir un bon professionnel en ${subcategoryLabel} ?`,
    a: `Comparez les fiches détaillées, les avis vérifiés laissés par d'autres clients, et contactez directement le professionnel par téléphone, email ou WhatsApp depuis sa fiche sur Prolocal-Landes.`,
  }];
  const description = SUBCATEGORY_DESCRIPTIONS[subcategoryLabel]
    ?? `Un professionnel en ${subcategoryLabel} exerce une activité spécialisée dans ce domaine — consultez les fiches référencées ci-dessus pour en savoir plus sur les prestations proposées localement.`;
  return [
    {
      q: `Que fait un ${subcategoryLabel} ?`,
      a: description,
    },
    ...specific,
    {
      q: `Je suis ${subcategoryLabel} : Comment référencer mon activité ?`,
      a: `L'inscription est gratuite et rapide : rendez-vous sur la page d'inscription, renseignez votre numéro SIREN et les informations de votre entreprise. Votre fiche est visible immédiatement sur Prolocal-Landes.`,
    },
  ];
}
