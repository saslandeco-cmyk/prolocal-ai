/**
 * Encode un canvas en WebP (~25-35% plus léger qu'un JPEG à qualité visuelle
 * égale) avec repli automatique sur du JPEG si le navigateur ne sait pas
 * encoder de WebP via toDataURL — ce cas bascule silencieusement sur du PNG
 * non compressé (jamais une erreur), ce qui produirait un fichier bien plus
 * lourd que l'ancien JPEG ; on détecte ce repli et on force nous-mêmes le
 * JPEG plutôt que de laisser passer un PNG.
 */
export function canvasToCompressedDataUrl(canvas: HTMLCanvasElement, quality: number): string {
  const webp = canvas.toDataURL("image/webp", quality);
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", quality);
}

/**
 * Compresse une image (File ou base64) via un canvas HTML.
 * Réduit la taille au maximum tout en gardant une qualité acceptable.
 */
export async function compressImage(
  input: File | string,
  maxWidth  = 1200,
  maxHeight = 900,
  quality   = 0.68
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      // Redimensionner si nécessaire en gardant le ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvasToCompressedDataUrl(canvas, quality));
    };

    img.onerror = () => reject(new Error("Image load failed"));

    if (typeof input === "string") {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = e => { img.src = e.target!.result as string; };
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.readAsDataURL(input);
    }
  });
}

/**
 * Compresse spécifiquement pour les logos (carré, plus petit).
 * Qualité abaissée par rapport au JPEG d'origine (0.80) : le passage au
 * WebP (voir canvasToCompressedDataUrl) compense largement, pour un fichier
 * plus léger à qualité visuelle égale ou supérieure.
 */
export async function compressLogo(file: File): Promise<string> {
  return compressImage(file, 400, 400, 0.75);
}

/**
 * Compresse une bannière (large, hauteur modérée).
 */
export async function compressBanner(file: File): Promise<string> {
  return compressImage(file, 1400, 500, 0.70);
}

/**
 * Compresse une photo de galerie.
 */
export async function compressPhoto(file: File): Promise<string> {
  return compressImage(file, 900, 700, 0.65);
}
