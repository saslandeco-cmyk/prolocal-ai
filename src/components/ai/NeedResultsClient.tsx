"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2, MapPin, Sparkles, Locate } from "lucide-react";
import ProfessionalCard from "@/components/professional/ProfessionalCard";
import NeedSearchBar from "@/components/ai/NeedSearchBar";
import QuoteRequestForm from "@/components/ai/QuoteRequestForm";
import type { NeedSearchResponse } from "@/types/needs";

const MultiMap = dynamic(() => import("@/components/map/MultiMap"), { ssr: false });

const MIN_RADIUS_KM = 10;
const MAX_RADIUS_KM = 150;
const RADIUS_STEP_KM = 10;
const DEFAULT_RADIUS_KM = 30;

interface GeoCoords {
  lat: number;
  lng: number;
}

function NeedResultsContent() {
  const searchParams = useSearchParams();
  const texte = searchParams.get("texte") || "";

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<NeedSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cityInput, setCityInput] = useState("");

  // Affinage par localisation — toujours proposé, jamais bloquant.
  const [geoCoords, setGeoCoords] = useState<GeoCoords | null>(null);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const radiusChangedByUser = useRef(false);

  const runSearch = useCallback(async (query: string, geo?: GeoCoords, radius?: number) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: query,
          ...(geo ? { lat: geo.lat, lng: geo.lng, radiusKm: radius ?? radiusKm } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        setResponse(null);
      } else {
        setResponse(data as NeedSearchResponse);
      }
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setGeoCoords(null);
    setCityInput("");
    runSearch(texte);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texte]);

  // Pré-remplit le champ ville avec la commune déjà détectée dans le texte,
  // pour que l'affinage parte de ce qui a été compris plutôt que de zéro.
  useEffect(() => {
    if (response?.need.commune && !geoCoords) setCityInput(response.need.commune);
  }, [response?.need.commune, geoCoords]);

  // Relance la recherche quand l'utilisateur ajuste le curseur de rayon,
  // avec un léger délai pour ne pas déclencher un appel à chaque pixel glissé.
  useEffect(() => {
    if (!geoCoords || !radiusChangedByUser.current) return;
    const t = setTimeout(() => runSearch(texte, geoCoords, radiusKm), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusKm]);

  const handlePreciserVille = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    setGeoCoords(null);
    // Repart du besoin déjà compris (sans mention de ville) plutôt que du
    // texte brut original, pour éviter qu'une commune précédemment détectée
    // ne reste mélangée à la nouvelle lors d'un second affinage.
    runSearch(`${response?.need.besoin || texte} à ${cityInput.trim()}`);
  };

  const handleAutourDeMoi = () => {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGeoCoords(coords);
        radiusChangedByUser.current = false;
        setGeoLoading(false);
        runSearch(texte, coords, radiusKm);
      },
      () => {
        setGeoError("Position non disponible. Vérifiez l'autorisation de géolocalisation.");
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const hasSignal = response ? response.need.categorie !== null || response.need.motsCles.length > 0 : false;

  return (
    <div className="w-[90%] mx-auto py-8 sm:py-12">
      <div className="mb-6">
        <NeedSearchBar initialValue={texte} compact onSearch={(q) => { setGeoCoords(null); runSearch(q); }} />
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-gray-500 py-16">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Analyse de votre besoin…</span>
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-12 text-red-600">{error}</div>
      )}

      {!loading && !error && response && (
        <>
          <div className="flex items-start gap-3 bg-landes-forest/5 border border-landes-forest/20 rounded-2xl p-4 sm:p-5 mb-6">
            <Sparkles className="w-5 h-5 text-landes-forest flex-shrink-0 mt-0.5" />
            <p className="text-sm sm:text-base text-landes-pine font-medium">{response.message}</p>
          </div>

          {/* 1. Affinage par localisation — "Affiner par localisation" et "Autour de moi" sur la même ligne, juste sous la recherche */}
          {hasSignal && (
            <div className="mb-6 space-y-3">
              <p className="text-sm font-semibold text-landes-pine">Affiner par localisation</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <form onSubmit={handlePreciserVille} className="flex-1 flex gap-2 max-w-md">
                  <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 bg-white">
                    <MapPin className="w-4 h-4 text-landes-sage flex-shrink-0" />
                    <input
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      placeholder="Ville ou code postal…"
                      className="w-full text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                    />
                  </div>
                  <button type="submit" className="btn-primary px-5 py-3 rounded-xl whitespace-nowrap">
                    Valider
                  </button>
                </form>
                <button
                  type="button"
                  onClick={handleAutourDeMoi}
                  disabled={geoLoading}
                  className="flex items-center justify-center gap-2 border-2 border-landes-forest/30 text-landes-forest font-medium px-6 py-3 rounded-xl hover:bg-landes-forest/5 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
                  Autour de moi
                </button>
              </div>
              {geoError && <p className="text-sm text-red-500">{geoError}</p>}

              {geoCoords && (
                <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-3 max-w-lg">
                  <Locate className="w-4 h-4 text-landes-forest flex-shrink-0" />
                  <span className="text-sm text-gray-600 whitespace-nowrap">Rayon : <strong className="text-landes-pine">{radiusKm} km</strong></span>
                  <input
                    type="range"
                    min={MIN_RADIUS_KM}
                    max={MAX_RADIUS_KM}
                    step={RADIUS_STEP_KM}
                    value={radiusKm}
                    onChange={(e) => { radiusChangedByUser.current = true; setRadiusKm(Number(e.target.value)); }}
                    className="flex-1 accent-landes-forest"
                  />
                </div>
              )}
            </div>
          )}

          {/* 2. Carte des professionnels trouvés — juste sous l'affinage par localisation */}
          {response.results.length > 0 && (
            <div className="mb-8">
              <p className="text-sm font-semibold text-landes-pine mb-3">Localisation des professionnels trouvés</p>
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 480 }}>
                <MultiMap professionals={response.results.map((r) => r.professional)} />
              </div>
            </div>
          )}

          {/* 3. Fiches des professionnels — jamais conditionnées par la localisation */}
          {response.results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {response.results.map((r) => (
                <div key={r.professional.id}>
                  <ProfessionalCard pro={r.professional} />
                  <QuoteRequestForm professionalId={r.professional.id} need={response.need} />
                </div>
              ))}
            </div>
          ) : hasSignal ? (
            <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-2xl">
              Aucun professionnel correspondant référencé pour le moment.
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function NeedResultsClient() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Chargement...</div>}>
      <NeedResultsContent />
    </Suspense>
  );
}
