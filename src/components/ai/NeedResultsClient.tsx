"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import ProfessionalCard from "@/components/professional/ProfessionalCard";
import NeedSearchBar from "@/components/ai/NeedSearchBar";
import type { NeedSearchResponse } from "@/types/needs";

const MultiMap = dynamic(() => import("@/components/map/MultiMap"), { ssr: false });

const DEFAULT_RADIUS_KM = 30;

interface GeoCoords {
  lat: number;
  lng: number;
}

function NeedResultsContent() {
  const searchParams = useSearchParams();
  const texte = searchParams.get("texte") || "";

  // Démarre en chargement s'il y a déjà une demande dans l'URL, pour ne pas
  // laisser apparaître un instant le bandeau de recherche vide avant que la
  // requête initiale ne parte.
  const [loading, setLoading] = useState(Boolean(texte));
  const [response, setResponse] = useState<NeedSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [geoCoords, setGeoCoords] = useState<GeoCoords | null>(null);

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
          ...(geo ? { lat: geo.lat, lng: geo.lng, radiusKm: radius ?? DEFAULT_RADIUS_KM } : {}),
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
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const initialGeo = lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined;
    setGeoCoords(initialGeo ?? null);
    runSearch(texte, initialGeo, initialGeo ? DEFAULT_RADIUS_KM : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texte]);

  const hasSignal = response ? response.need.categorie !== null || response.need.motsCles.length > 0 : false;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 scroll-mt-20">
      {loading && (
        <div className="flex items-center justify-center gap-2 text-gray-500 py-16">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Analyse de votre besoin…</span>
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-12 text-red-600">{error}</div>
      )}

      {/* Bandeau de recherche — état initial : ni carte, ni fiches. */}
      {!loading && !error && !response && (
        <div className="w-full mx-auto text-center py-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-landes-pine mb-2">De quoi avez-vous besoin ?</h1>
          <p className="text-gray-500 mb-6">Décrivez simplement votre besoin, nous trouvons le bon professionnel près de chez vous.</p>
          <NeedSearchBar onSearch={(q, geo) => runSearch(q, geo)} />
        </div>
      )}

      {!loading && !error && response && (
        <>
          {/* 1. Nouvelle recherche — reprend ce que le visiteur a déjà saisi */}
          <div className="mb-6">
            <NeedSearchBar
              initialValue={response.need.besoin || texte}
              initialCity={response.need.commune || ""}
              initialGeo={geoCoords ?? undefined}
              onSearch={(q, geo) => { setGeoCoords(geo ?? null); runSearch(q, geo); }}
            />
          </div>

          {/* 2. Carte des professionnels trouvés */}
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
