import { put } from "@vercel/blob";
import type { Professional } from "@/types";

/**
 * Stockage des images (logo, bannière, photos) sur Vercel Blob, pour ne
 * jamais laisser une image en base64 atteindre la colonne JSONB
 * `professionals.data` — chaque lecture de la table (listes catégorie/
 * sous-catégorie/ville/accueil) renverrait sinon l'intégralité des images de
 * chaque fiche à chaque visiteur, le principal poste de Fast Origin/Data
 * Transfer Vercel identifié sur ce projet.
 *
 * ⚠️ Nécessite un store Vercel Blob relié au projet (Vercel Dashboard →
 * Storage → Create Database → Blob), qui injecte automatiquement
 * BLOB_READ_WRITE_TOKEN. Sans cette variable, les images continuent d'être
 * enregistrées telles quelles (base64) — comportement inchangé, aucune
 * régression — un avertissement est simplement affiché en console serveur.
 */
export const isBlobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

if (!isBlobConfigured && process.env.NODE_ENV !== "test") {
  console.warn(
    "[blob] BLOB_READ_WRITE_TOKEN n'est pas définie. Les images resteront " +
    "enregistrées en base64 dans la base de données tant qu'un store Vercel " +
    "Blob n'est pas relié au projet (Storage → Create Database → Blob)."
  );
}

function parseDataUri(dataUri: string): { contentType: string; buffer: Buffer } | null {
  const match = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUri);
  if (!match) return null;
  return { contentType: match[1], buffer: Buffer.from(match[2], "base64") };
}

function extensionFor(contentType: string): string {
  const ext = contentType.split("/")[1];
  return ext ? ext.replace("jpeg", "jpg") : "jpg";
}

/**
 * Remplace une image base64 par son URL Vercel Blob. Ne fait rien (retourne
 * la valeur telle quelle) si ce n'est pas une data URI (déjà une URL), si le
 * store Blob n'est pas configuré, ou en cas d'échec de l'upload — n'empêche
 * jamais l'enregistrement de la fiche pour autant.
 */
async function uploadIfDataUri(value: string | undefined, pathname: string): Promise<string | undefined> {
  if (!value || !value.startsWith("data:")) return value;
  if (!isBlobConfigured) return value;
  const parsed = parseDataUri(value);
  if (!parsed) return value;
  try {
    const { url } = await put(`${pathname}.${extensionFor(parsed.contentType)}`, parsed.buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType: parsed.contentType,
    });
    return url;
  } catch (err) {
    console.error(`[blob] Échec de l'upload de l'image (${pathname}) :`, err);
    return value;
  }
}

/**
 * Convertit logo/bannière/photos d'une fiche professionnelle : toute image
 * encore en base64 est uploadée sur Vercel Blob et remplacée par son URL.
 * Idempotent — une image déjà sous forme d'URL n'est jamais ré-uploadée.
 */
export async function uploadProfessionalImages(pro: Professional): Promise<Professional> {
  const [logo, banner, ...photos] = await Promise.all([
    uploadIfDataUri(pro.logo, `professionals/${pro.id}/logo`),
    uploadIfDataUri(pro.banner, `professionals/${pro.id}/banner`),
    ...(pro.photos || []).map((photo, i) => uploadIfDataUri(photo, `professionals/${pro.id}/photo-${i}`)),
  ]);
  return {
    ...pro,
    logo,
    banner,
    photos: pro.photos ? (photos as string[]) : pro.photos,
  };
}
