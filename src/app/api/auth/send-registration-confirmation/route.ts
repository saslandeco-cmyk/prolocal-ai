import { NextRequest, NextResponse } from "next/server";
import { notifyAdmin } from "@/lib/notifyAdmin";

/**
 * POST /api/auth/send-registration-confirmation
 *
 * Envoie au professionnel un email confirmant que son inscription a bien
 * été prise en compte, qu'elle sera validée sous 24/48h, et lui rappelant
 * ses identifiants de connexion au tableau de bord (email + mot de passe).
 * Notifie également l'équipe Prolocal-Landes (contact@prolocal-landes.fr)
 * qu'une nouvelle fiche attend une validation.
 *
 * ⚠️ Nécessite la variable d'environnement RESEND_API_KEY pour un envoi
 * réel. Sans cette clé, la route répond en "mode démonstration" (aucun
 * envoi réel) — cohérent avec le reste du site (voir /api/invoices/send-xml
 * et /api/auth/send-reset-code). L'inscription n'est jamais bloquée par
 * l'absence de ce service.
 *
 * Body attendu : { email, password, companyName } (requis), et
 * { category, subcategory, city, phone, plan } (optionnels, utilisés
 * uniquement pour la notification interne ci-dessous).
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, companyName, category, subcategory, city, phone, plan } = await req.json();
    if (!email || !password || !companyName) {
      return NextResponse.json({ error: "email, password et companyName sont requis." }, { status: 400 });
    }

    // Notification interne à l'équipe — lancée en parallèle de l'email de
    // confirmation ci-dessous, puis attendue avec lui (Promise.all) : sur
    // Vercel, une fonction serverless peut être arrêtée dès la réponse
    // renvoyée, donc une tâche de fond non "attendue" risquerait de ne
    // jamais partir. Un échec éventuel de cette notification (voir
    // notifyAdmin, qui avale ses propres erreurs) ne remet jamais en cause
    // l'email de confirmation ni la réponse de cette route.
    const adminNotification = notifyAdmin(
      `Nouvelle inscription — ${companyName}`,
      `Une nouvelle entreprise vient de s'inscrire sur Prolocal-Landes.

Entreprise : ${companyName}
Catégorie : ${category || "non renseignée"}${subcategory ? ` (${subcategory})` : ""}
Ville : ${city || "non renseignée"}
Email : ${email}
Téléphone : ${phone || "non renseigné"}
Formule choisie : ${plan || "non renseignée"}

Fiche en attente de validation dans l'admin.`
    );

    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey) {
      // Mode démonstration : aucun service d'envoi d'email configuré.
      // On ne bloque jamais l'inscription pour autant.
      await adminNotification;
      return NextResponse.json({ sent: false, demo: true });
    }

    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);

    const [{ error }] = await Promise.all([
      resend.emails.send({
        from: process.env.INVOICE_SENDER_EMAIL || "contact@prolocal-landes.fr",
        to: [email],
        subject: "Votre inscription a bien été prise en compte — Prolocal-Landes",
        text:
`Bonjour,

Nous vous confirmons que l'inscription de "${companyName}" sur Prolocal-Landes a bien été enregistrée.

Votre fiche sera vérifiée et validée par notre équipe sous 24 à 48h. Vous recevrez un email dès qu'elle sera active et visible sur l'annuaire.

Pour rappel, voici vos identifiants de connexion à votre tableau de bord :
- Email de connexion : ${email}
- Mot de passe : ${password}

Vous pouvez dès à présent vous connecter et compléter votre fiche depuis votre tableau de bord.

À bientôt sur Prolocal-Landes !`,
      }),
      adminNotification,
    ]);

    if (error) {
      return NextResponse.json({ error: error.message || "Erreur lors de l'envoi de l'email." }, { status: 500 });
    }

    return NextResponse.json({ sent: true, demo: false });
  } catch (err: any) {
    console.error("[api/auth/send-registration-confirmation] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de l'envoi de la confirmation." }, { status: 500 });
  }
}
