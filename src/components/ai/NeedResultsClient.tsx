"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, MapPin, Sparkles } from "lucide-react";
import ProfessionalCard from "@/components/professional/ProfessionalCard";
import NeedSearchBar from "@/components/ai/NeedSearchBar";
import QuoteRequestForm from "@/components/ai/QuoteRequestForm";
import type { NeedSearchResponse } from "@/types/needs";

function NeedResultsContent() {
  const searchParams = useSearchParams();
  const texte = searchParams.get("texte") || "";

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<NeedSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cityInput, setCityInput] = useState("");

  const runSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query }),
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
  }, []);

  useEffect(() => {
    runSearch(texte);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texte]);

  const handlePreciserVille = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    runSearch(`${texte} à ${cityInput.trim()}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6">
        <NeedSearchBar initialValue={texte} compact onSearch={runSearch} />
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
          <div className="flex items-start gap-3 bg-landes-forest/5 border border-landes-forest/20 rounded-2xl p-4 sm:p-5 mb-8">
            <Sparkles className="w-5 h-5 text-landes-forest flex-shrink-0 mt-0.5" />
            <p className="text-sm sm:text-base text-landes-pine font-medium">{response.message}</p>
          </div>

          {response.needsLocation && (
            <form onSubmit={handlePreciserVille} className="flex flex-col sm:flex-row gap-3 mb-8 max-w-md">
              <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 bg-white">
                <MapPin className="w-4 h-4 text-landes-sage flex-shrink-0" />
                <input
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="Votre ville ou commune…"
                  className="w-full text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                />
              </div>
              <button type="submit" className="btn-primary px-6 py-3 rounded-xl whitespace-nowrap">
                Valider
              </button>
            </form>
          )}

          {response.results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {response.results.map((r) => (
                <div key={r.professional.id}>
                  <ProfessionalCard pro={r.professional} />
                  <QuoteRequestForm professionalId={r.professional.id} need={response.need} />
                </div>
              ))}
            </div>
          )}
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
