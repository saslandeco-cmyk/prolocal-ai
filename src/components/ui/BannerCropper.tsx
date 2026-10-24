"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { X, ZoomIn, ZoomOut, Check } from "lucide-react";
import { canvasToCompressedDataUrl } from "@/lib/imageUtils";

// Ratio fixe correspondant à l'affichage réel des bannières sur le site
// (hero de fiche pro : h-44/h-56 sur toute la largeur ≈ 2.8:1), et à la
// résolution cible de sortie — cohérent avec compressBanner (1400×500).
const CROP_RATIO = 1400 / 500; // 2.8
const OUTPUT_WIDTH = 1400;
const OUTPUT_HEIGHT = 500;
const FRAME_WIDTH = 560; // largeur d'affichage du cadre de recadrage (px CSS)
const FRAME_HEIGHT = FRAME_WIDTH / CROP_RATIO;

interface Props {
  file: File;
  onCropped: (dataUrl: string) => void;
  onCancel: () => void;
}

/**
 * Modale de recadrage de bannière : zoom (molette/slider) + déplacement
 * (glisser), cadre fixé au ratio d'affichage réel des bannières sur le
 * site. Le rendu final est produit sur un canvas à résolution native
 * (1400×500) avec un lissage haute qualité pour une image nette, plutôt
 * qu'un simple redimensionnement automatique qui pouvait couper
 * n'importe quelle partie de l'image et produire un rendu flou.
 */
export default function BannerCropper({ file, onCropped, onCancel }: Props) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  // Charge l'image et calcule le zoom minimum (image couvrant tout le cadre)
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    const img = new Image();
    img.onload = () => {
      setImgSize({ width: img.naturalWidth, height: img.naturalHeight });
      const coverScale = Math.max(FRAME_WIDTH / img.naturalWidth, FRAME_HEIGHT / img.naturalHeight);
      setMinScale(coverScale);
      setScale(coverScale);
      setOffset({ x: 0, y: 0 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const clampOffset = useCallback((x: number, y: number, s: number) => {
    const w = imgSize.width * s;
    const h = imgSize.height * s;
    const maxX = Math.max(0, (w - FRAME_WIDTH) / 2);
    const maxY = Math.max(0, (h - FRAME_HEIGHT) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
  }, [imgSize]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, offsetX: offset.x, offsetY: offset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset(clampOffset(dragStart.current.offsetX + dx, dragStart.current.offsetY + dy, scale));
  };
  const handlePointerUp = () => setDragging(false);

  const handleZoom = (newScale: number) => {
    const s = Math.min(minScale * 3, Math.max(minScale, newScale));
    setScale(s);
    setOffset(prev => clampOffset(prev.x, prev.y, s));
  };

  const handleConfirm = () => {
    if (!imgRef.current) return;
    setProcessing(true);

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setProcessing(false); return; }

    // Lissage haute qualité pour un rendu net, même en agrandissant une
    // zone recadrée — c'est ce qui manquait au simple redimensionnement
    // automatique utilisé jusqu'ici.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Convertit les coordonnées d'affichage (cadre CSS) vers les coordonnées
    // réelles de l'image source, au ratio de sortie.
    const renderScale = OUTPUT_WIDTH / FRAME_WIDTH;
    const srcScale = scale * renderScale;
    const dx = (offset.x * renderScale) + (OUTPUT_WIDTH - imgSize.width * srcScale) / 2;
    const dy = (offset.y * renderScale) + (OUTPUT_HEIGHT - imgSize.height * srcScale) / 2;

    ctx.drawImage(imgRef.current, dx, dy, imgSize.width * srcScale, imgSize.height * srcScale);

    // Qualité relevée (0.80) — le recadrage précis réduit déjà le poids du
    // fichier par rapport à l'image source complète, la marge est utilisée
    // pour préserver la netteté plutôt que le poids. Encodage en WebP avec
    // repli JPEG (voir canvasToCompressedDataUrl) pour un fichier plus léger
    // à qualité égale.
    const dataUrl = canvasToCompressedDataUrl(canvas, 0.80);
    setProcessing(false);
    onCropped(dataUrl);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-landes-pine">Recadrer la bannière</p>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className="relative mx-auto overflow-hidden rounded-xl bg-gray-900 select-none touch-none"
          style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT, maxWidth: "100%" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={e => { e.preventDefault(); handleZoom(scale - e.deltaY * 0.001); }}
        >
          {imgUrl && (
            <img
              ref={imgRef}
              src={imgUrl}
              alt=""
              draggable={false}
              className="absolute top-1/2 left-1/2 pointer-events-none"
              style={{
                width: imgSize.width * scale,
                height: imgSize.height * scale,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-2">Glissez pour déplacer, molette ou curseur pour zoomer</p>

        <div className="flex items-center gap-3 mt-4">
          <ZoomOut className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="range"
            min={minScale}
            max={minScale * 3}
            step={minScale / 100}
            value={scale}
            onChange={e => handleZoom(parseFloat(e.target.value))}
            className="flex-1 accent-landes-forest"
          />
          <ZoomIn className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} className="btn-secondary flex-1 py-2.5">Annuler</button>
          <button onClick={handleConfirm} disabled={processing || !imgUrl} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
            <Check className="w-4 h-4" /> {processing ? "Traitement…" : "Valider le recadrage"}
          </button>
        </div>
      </div>
    </div>
  );
}
