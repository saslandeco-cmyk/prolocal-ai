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
