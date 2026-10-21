/**
 * Configuration générale du site Prolocal-Landes.
 *
 * ─── VALIDATION DES INSCRIPTIONS ───────────────────────────────────────────
 *
 * REQUIRE_VALIDATION = true  → les nouvelles inscriptions passent en "pending"
 *                              et doivent être validées manuellement par l'admin.
 *
 * REQUIRE_VALIDATION = false → les nouvelles inscriptions sont automatiquement
 *                              activées (status "active") sans intervention admin.
 *                              L'admin peut toujours suspendre ou supprimer un pro.
 *
 * Pour réactiver la validation manuelle : passer REQUIRE_VALIDATION à true.
 */
export const REQUIRE_VALIDATION = true;
