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
 * ⚠️ Nécessite la variable d'environnement RESEND_API_KEY pour un envoi
 * réel. Sans cette clé, la route répond en "mode démonstration" (aucun
 * envoi réel) — cohérent avec le reste du site (voir
 * /api/auth/send-registration-confirmation et /api/invoices/send-xml).
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
      // Mode démonstration : aucun service d'envoi d'email configuré.
      return NextResponse.json({ sent: false, demo: true });
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

    return NextResponse.json({ sent: true, demo: false });
  } catch (err: any) {
    console.error("[api/contact] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de l'envoi du message." }, { status: 500 });
  }
}
