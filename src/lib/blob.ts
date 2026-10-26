import { put } from "@vercel/blob";
import sharp from "sharp";
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

const ALLOWED_IMAGE_FORMATS = new Set(["jpeg", "png", "webp", "gif", "avif"]);

/**
 * Vérifie que le buffer est réellement une image décodable dans un format
 * autorisé, plutôt que de faire confiance au content-type déclaré par le
 * client dans le préfixe de la data URI (`data:image/jpeg;base64,...`),
 * trivialement falsifiable par un appel direct à l'API en contournant la
 * compression canvas du navigateur — qui, elle, ne produit jamais que de
 * vraies images. Sans cette vérification, un fichier arbitraire (y compris
 * potentiellement malveillant) pourrait être hébergé sur le domaine du
 * site, déguisé en logo/bannière/photo.
 */
async function isValidImageBuffer(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata();
    return Boolean(metadata.format && ALLOWED_IMAGE_FORMATS.has(metadata.format));
  } catch {
    return false;
  }
}

/**
 * Remplace une image base64 par son URL Vercel Blob. Retourne `undefined`
 * si le contenu n'est pas une image valide (voir isValidImageBuffer) —
 * jamais stockée, ni en Blob ni en base64 dans la base de données. Sinon,
 * ne fait rien (retourne la valeur telle quelle) si ce n'est pas une data
 * URI (déjà une URL), si le store Blob n'est pas configuré, ou en cas
 * d'échec de l'upload — n'empêche jamais l'enregistrement du reste de la
 * fiche pour autant.
 */
async function uploadIfDataUri(value: string | undefined, pathname: string): Promise<string | undefined> {
  if (!value || !value.startsWith("data:")) return value;
  const parsed = parseDataUri(value);
  if (!parsed) return value;
  if (!(await isValidImageBuffer(parsed.buffer))) {
    console.warn(`[blob] Fichier rejeté (contenu non reconnu comme une image valide) : ${pathname}`);
    return undefined;
  }
  if (!isBlobConfigured) return value;
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
