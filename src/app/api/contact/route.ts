import { NextRequest, NextResponse } from "next/server";

const CONTACT_RECIPIENT_EMAIL = "contact@prolocal-landes.fr";

/**
 * POST /api/contact
 *
 * Transmet une demande du formulaire de contact (/contact) par email à
 * l'équipe Prolocal-Landes. Le "reply-to" est réglé sur l'email du
 * visiteur : une simple réponse depuis contact@prolocal-landes.fr lui
 * répond donc directement.
 *
 * ⚠️ Nécessite la variable d'environnement RESEND_API_KEY. Contrairement à
 * /api/auth/send-registration-confirmation (où l'email n'est qu'une
 * confirmation secondaire — l'inscription elle-même est déjà enregistrée),
 * ici l'email EST l'action : sans clé configurée, le message du visiteur ne
 * serait transmis nulle part. Pas de "mode démonstration" silencieux donc —
 * la route répond une vraie erreur plutôt que de prétendre avoir envoyé un
 * message qui serait en réalité perdu.
 *
 * Body attendu :
 * { firstName, lastName, email, subject, message } (requis),
 * { phone } (facultatif)
 */
export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone, subject, message } = await req.json();
    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json(
        { error: "firstName, lastName, email, subject et message sont requis." },
        { status: 400 }
      );
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.error("[api/contact] RESEND_API_KEY n'est pas configurée — message non transmis.");
      return NextResponse.json(
        { error: "Le service d'envoi de messages n'est pas configuré. Merci de nous contacter directement par téléphone." },
        { status: 503 }
      );
    }

    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);

    const { error } = await resend.emails.send({
      from: process.env.INVOICE_SENDER_EMAIL || CONTACT_RECIPIENT_EMAIL,
      to: [CONTACT_RECIPIENT_EMAIL],
      replyTo: email,
      subject: `[Contact] ${subject} — ${firstName} ${lastName}`,
      text:
`Nouveau message depuis le formulaire de contact de Prolocal-Landes.

Nom : ${firstName} ${lastName}
Email : ${email}
Téléphone : ${phone || "non renseigné"}
Sujet : ${subject}

Message :
${message}`,
    });

    if (error) {
      console.error("[api/contact] Erreur Resend:", error.message);
      return NextResponse.json({ error: error.message || "Erreur lors de l'envoi du message." }, { status: 500 });
    }

    return NextResponse.json({ sent: true });
  } catch (err: any) {
    console.error("[api/contact] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de l'envoi du message." }, { status: 500 });
  }
}
