import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/send-reset-code
 *
 * Envoie par email le code de réinitialisation de mot de passe d'un
 * professionnel.
 *
 * ⚠️ Nécessite la variable d'environnement RESEND_API_KEY pour un envoi
 * réel. Sans cette clé, la route répond en "mode démonstration" (aucun
 * envoi réel), pour permettre de tester le parcours complet malgré tout —
 * cohérent avec le reste du site (voir /api/invoices/send-xml).
 *
 * Body attendu : { email: string, code: string, companyName?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { email, code, companyName } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: "email et code sont requis." }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey) {
      // Mode démonstration : aucun service d'envoi d'email configuré.
      return NextResponse.json({ sent: false, demo: true });
    }

    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);

    const { error } = await resend.emails.send({
      from: `Prolocal Landes <${process.env.INVOICE_SENDER_EMAIL || "contact@prolocal-landes.fr"}>`,
      to: [email],
      subject: "Réinitialisation de votre mot de passe — Prolocal-Landes",
      text: `Bonjour${companyName ? ` (${companyName})` : ""},\n\nVoici votre code de réinitialisation de mot de passe : ${code}\n\nCe code est valable 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
    });

    if (error) {
      return NextResponse.json({ error: error.message || "Erreur lors de l'envoi de l'email." }, { status: 500 });
    }

    return NextResponse.json({ sent: true, demo: false });
  } catch (err: any) {
    console.error("[api/auth/send-reset-code] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de l'envoi du code." }, { status: 500 });
  }
}
