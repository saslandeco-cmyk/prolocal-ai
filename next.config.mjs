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
  },
};

export default nextConfig;
