/**
 * Notifications internes par email, à l'équipe Prolocal-Landes (nouvelle
 * inscription, paiement effectué...) — distinctes des emails envoyés aux
 * visiteurs/professionnels (voir /api/auth/send-registration-confirmation).
 *
 * Repose sur le même service Resend que le reste du site. Sans
 * RESEND_API_KEY configurée, la notification est simplement ignorée — elle
 * ne doit jamais bloquer ni faire échouer l'action qui la déclenche (une
 * inscription ou un paiement doit aboutir même si l'envoi d'email échoue).
 */
const ADMIN_NOTIFICATION_EMAIL = "contact@prolocal-landes.fr";

export async function notifyAdmin(subject: string, text: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from: process.env.INVOICE_SENDER_EMAIL || ADMIN_NOTIFICATION_EMAIL,
      to: [ADMIN_NOTIFICATION_EMAIL],
      subject,
      text,
    });
    if (error) console.error("[notifyAdmin] Échec de l'envoi de la notification:", error.message);
  } catch (err) {
    console.error("[notifyAdmin] Échec de l'envoi de la notification:", err);
  }
}
