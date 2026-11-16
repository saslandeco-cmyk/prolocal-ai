/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    // Autorise l'optimisation (redimensionnement, WebP/AVIF) des images de
    // professionnels hébergées sur Vercel Blob (voir src/lib/blob.ts) — le
    // sous-domaine est propre à chaque store Blob, seul le suffixe est fixe.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
    // Durée de cache côté serveur/edge des variantes d'images déjà
    // redimensionnées par l'optimiseur Next.js (défaut : 60s seulement,
    // beaucoup trop court en production — chaque variante est régénérée
    // inutilement à chaque expiration). 31 jours : largement suffisant pour
    // des bannières qui ne changent quasiment jamais, sans empêcher un
    // remplacement de se propager en moins d'un mois après un déploiement.
    minimumCacheTTL: 2678400,
  },
  async headers() {
    return [
      {
        // Images statiques du dossier /public (bannières par défaut, logo,
        // favicon) — non versionnées (même URL si le fichier est remplacé),
        // d'où une durée volontairement plus courte que les assets Next.js
        // hashés (_next/static, déjà mis en cache 1 an par Next.js
        // lui-même). 7 jours avec stale-while-revalidate : le navigateur
        // sert la version en cache instantanément, et ne revalide en
        // arrière-plan qu'au-delà d'une semaine — bon compromis entre
        // vitesse de chargement et délai de propagation d'un remplacement
        // d'image.
        source: "/:path*\\.(jpg|jpeg|png|webp|avif|gif|svg|ico)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "header", key: "x-forwarded-proto", value: "http" }],
        destination: "https://prolocal-landes.fr/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
