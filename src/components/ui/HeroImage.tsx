"use client";
import { useState, useEffect, useRef } from "react";
import { Camera, Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { getHeroImage, saveHeroImage, deleteHeroImage } from "@/lib/storage";
import { canvasToCompressedDataUrl } from "@/lib/imageUtils";

// Compresse une image hero (max 1400px, qualité 0.78, WebP avec repli JPEG)
async function compressHeroImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1400;
      let { width, height } = img;
      if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvasToCompressedDataUrl(canvas, 0.78));
    };
    img.onerror = reject;
    img.src = url;
  });
}

interface HeroImageProps {
  editable?: boolean; // true = mode admin (boutons visibles)
}

export default function HeroImage({ editable = false }: HeroImageProps) {
  const [image, setImage]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [hover, setHover]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getHeroImage().then(setImage);
  }, []);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setLoading(true);
    try {
      const compressed = await compressHeroImage(file);
      await saveHeroImage(compressed);
      setImage(compressed);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = async () => {
    await deleteHeroImage();
    setImage(null);
  };

  // ── Vue non-admin : image ou placeholder décoratif ──
  if (!editable) {
    if (!image) {
      return (
        <div className="relative w-full h-full min-h-[320px] rounded-2xl overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center">
          {/* Grille décorative */}
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          <div className="relative text-center text-white/40 space-y-3">
            <ImageIcon className="w-12 h-12 mx-auto opacity-40" />
            <p className="text-sm font-medium opacity-50">Photo à venir</p>
          </div>
        </div>
      );
    }
    return (
      <div className="relative w-full h-full min-h-[320px] rounded-2xl overflow-hidden shadow-2xl">
        <img src={image} alt="Photo hero" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
    );
  }

  // ── Vue admin : upload + aperçu ──
  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />

      {image ? (
        <div
          className="relative rounded-2xl overflow-hidden shadow-xl"
          style={{ minHeight: 280 }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <img src={image} alt="Photo hero" className="w-full h-full object-cover" style={{ minHeight: 280 }} />

          {/* Overlay au survol */}
          <div className={`absolute inset-0 bg-black/50 flex items-center justify-center gap-3 transition-opacity ${hover ? "opacity-100" : "opacity-0"}`}>
            <button
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 bg-white text-gray-800 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              <Camera className="w-4 h-4" /> Changer la photo
            </button>
            <button
              onClick={handleRemove}
              className="flex items-center gap-2 bg-red-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-red-600 transition-colors shadow-lg"
            >
              <X className="w-4 h-4" /> Supprimer
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="relative w-full rounded-2xl border-2 border-dashed border-white/30 bg-white/10 hover:bg-white/15 hover:border-white/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 text-white"
          style={{ minHeight: 280 }}
        >
          {loading ? (
            <Loader2 className="w-10 h-10 animate-spin opacity-60" />
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                <Upload className="w-7 h-7 opacity-70" />
              </div>
              <div className="text-center px-6">
                <p className="font-semibold text-base">Ajouter une photo</p>
                <p className="text-sm text-white/60 mt-1">Glissez-déposez ou cliquez pour parcourir</p>
                <p className="text-xs text-white/40 mt-2">JPG, PNG, WEBP — recommandé : 1400 × 900 px</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
