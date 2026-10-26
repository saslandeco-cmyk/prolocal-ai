import { NextRequest, NextResponse } from "next/server";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

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
 * Protection anti-spam légère (limite de débit par IP ET par email ciblé —
 * un même visiteur ne demande jamais plus de quelques codes en 15 minutes,
 * et un email donné ne doit pas pouvoir être "bombardé" même depuis des IP
 * différentes). Voir src/lib/rateLimit.ts pour les limites de cette
 * approche.
 *
 * Body attendu : { email: string, code: string, companyName?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { email, code, companyName } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: "email et code sont requis." }, { status: 400 });
    }

    const ip = getClientIp(req);
    const limitedByIp = isRateLimited(`reset-code:ip:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
    const limitedByEmail = isRateLimited(`reset-code:email:${email.toLowerCase()}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
    if (limitedByIp || limitedByEmail) {
      return NextResponse.json(
        { error: "Trop de demandes récentes. Merci de réessayer dans quelques minutes." },
        { status: 429 }
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
