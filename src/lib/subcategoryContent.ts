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

export function buildSubcategoryFaq(params: {
  subcategoryLabel: string;
  proCount: number;
  cityCount: number;
}): FaqItem[] {
  const { subcategoryLabel, proCount, cityCount } = params;
  return [
    {
      q: `Combien y a-t-il de professionnels en ${subcategoryLabel} référencés dans les Landes ?`,
      a: `${proCount} professionnel${proCount > 1 ? "s" : ""} en ${subcategoryLabel} ${proCount > 1 ? "sont" : "est"} actuellement référencé${proCount > 1 ? "s" : ""} sur Prolocal-Landes${cityCount > 0 ? `, dans ${cityCount} commune${cityCount > 1 ? "s" : ""} du département` : ""}.`,
    },
    {
      q: `Comment choisir un bon professionnel en ${subcategoryLabel} ?`,
      a: `Comparez les fiches détaillées, les avis vérifiés laissés par d'autres clients, et contactez directement le professionnel par téléphone, email ou WhatsApp depuis sa fiche sur Prolocal-Landes.`,
    },
    {
      q: `Comment référencer mon entreprise en ${subcategoryLabel} ?`,
      a: `L'inscription est gratuite et rapide : rendez-vous sur la page d'inscription, renseignez votre numéro SIREN et les informations de votre entreprise. Votre fiche est visible immédiatement sur Prolocal-Landes.`,
    },
  ];
}
