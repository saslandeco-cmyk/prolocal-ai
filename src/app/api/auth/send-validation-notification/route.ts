import { NextRequest, NextResponse } from "next/server";
import { getEffectiveOptionPrices } from "@/lib/db/options";
import { PLANS } from "@/types";

const SITE_URL = "https://www.prolocal-landes.fr";

function formatEuros(cents: number): string {
  return `${(cents / 100).toFixed(0)} €`;
}

/**
 * POST /api/auth/send-validation-notification
 *
 * Envoie au professionnel un email l'informant que sa fiche vient d'être
 * validée par l'équipe Prolocal-Landes et qu'elle est désormais visible sur
 * l'annuaire public, avec un récapitulatif de sa formule et de ses options
 * complémentaires actives.
 *
 * Appelée depuis l'admin (voir updateStatus() dans src/app/admin/page.tsx)
 * uniquement lors du tout premier passage d'une fiche de "pending" à
 * "active" — jamais lors d'une simple réactivation après suspension, pour
 * ne jamais annoncer à tort une "première mise en ligne".
 *
 * ⚠️ Nécessite RESEND_API_KEY pour un envoi réel. Sans cette clé, répond en
 * mode démonstration (comme les autres routes d'email du site) — la
 * validation elle-même n'est jamais bloquée par l'absence de ce service.
 *
 * Body attendu : { email, companyName } (requis),
 * { plan, complementaryOptions } (optionnels — pour le récapitulatif).
 */
export async function POST(req: NextRequest) {
  try {
    const { email, companyName, plan, complementaryOptions } = await req.json();

    if (!email || !companyName) {
      return NextResponse.json({ error: "email et companyName sont requis." }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      // Mode démonstration : aucun service d'envoi d'email configuré.
      // La validation de la fiche n'est jamais bloquée pour autant.
      return NextResponse.json({ sent: false, demo: true });
    }

    // Récapitulatif de la formule active
    const planInfo = PLANS.find(p => p.id === plan);
    const planLine = planInfo
      ? `Formule ${planInfo.name}${planInfo.price > 0 ? ` — ${planInfo.price} €/mois` : " — Gratuite"}`
      : null;

    // Récapitulatif des options complémentaires actives — catalogue effectif
    // (base si configurée/alimentée, sinon valeurs par défaut), jamais les
    // libellés/prix codés en dur, pour rester cohérent avec ce qui est
    // réellement facturé au professionnel.
    const optionIds: string[] = Array.isArray(complementaryOptions) ? complementaryOptions : [];
    let optionLines: string[] = [];
    if (optionIds.length > 0) {
      const catalog = await getEffectiveOptionPrices();
      optionLines = optionIds
        .map(id => catalog[id])
        .filter((opt): opt is NonNullable<typeof opt> => Boolean(opt))
        .map(opt => `- ${opt.name} (${formatEuros(opt.unitAmount)}${opt.cadence === "month" ? "/mois" : ""})`);
    }

    const summaryLines = [
      ...(planLine ? [planLine] : []),
      ...(optionLines.length > 0 ? ["", "Options complémentaires actives :", ...optionLines] : []),
    ];

    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);

    const { error } = await resend.emails.send({
      from: `Prolocal Landes <${process.env.INVOICE_SENDER_EMAIL || "contact@prolocal-landes.fr"}>`,
      to: [email],
      subject: "Votre fiche est en ligne ! — Prolocal-Landes",
      text:
`Bonjour,

Bonne nouvelle : la fiche de "${companyName}" vient d'être validée par notre équipe et est désormais visible sur l'annuaire Prolocal-Landes.
${summaryLines.length > 0 ? "\n" + summaryLines.join("\n") + "\n" : ""}
Vous pouvez dès à présent consulter et compléter votre fiche depuis votre tableau de bord en cliquant sur le lien ci-dessous : ${SITE_URL}/connexion

Merci de votre confiance et à bientôt sur Prolocal-Landes !`,
    });

    if (error) {
      return NextResponse.json({ error: error.message || "Erreur lors de l'envoi de l'email." }, { status: 500 });
    }

    return NextResponse.json({ sent: true, demo: false });
  } catch (err: any) {
    console.error("[api/auth/send-validation-notification] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur lors de l'envoi de la notification." }, { status: 500 });
  }
}
