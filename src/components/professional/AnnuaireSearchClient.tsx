"use client";
import { useState, useEffect, useMemo, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { MapPin, List, Map as MapIcon } from "lucide-react";
import { getProfessionalsWithImages } from "@/lib/storage";
import { getListingRank } from "@/lib/listingOrder";
import { Professional } from "@/types";
import ProfessionalCard from "@/components/professional/ProfessionalCard";
import NeedSearchBar from "@/components/ai/NeedSearchBar";
import dynamic from "next/dynamic";

const MultiMap = dynamic(() => import("@/components/map/MultiMap"), { ssr: false });

function AnnuaireContent() {
  const searchParams = useSearchParams();
  const [pros, setPros] = useState<Professional[]>([]);
  const [filtered, setFiltered] = useState<Professional[]>([]);

  // Dérivés réactifs des search params — se recalculent à chaque changement d'URL
  const search    = useMemo(() => searchParams.get("q")        || "", [searchParams]);
  const category  = useMemo(() => searchParams.get("category") || "", [searchParams]);
  const city      = useMemo(() => searchParams.get("city")     || "", [searchParams]);
  const geoLat    = useMemo(() => parseFloat(searchParams.get("lat") || "") || null, [searchParams]);
  const geoLng    = useMemo(() => parseFloat(searchParams.get("lng") || "") || null, [searchParams]);
  const geoRadius = useMemo(() => parseInt(searchParams.get("radius") || "25", 10), [searchParams]);
  const [view, setView] = useState<"list" | "map">("list");
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // Haversine distance en km
  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  useEffect(() => {
    getProfessionalsWithImages().then(all => {
      const data = all.filter(p => p.status === "active");
      setPros(data);
      setFiltered(data);
    });
  }, []);

  // Scroll vers les résultats à chaque arrivée sur la page (recherche depuis l'accueil ou une autre page)
  useEffect(() => {
    const t = setTimeout(() => {
      document.getElementById("resultats")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let results = pros;
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(p => {
        const desc = (p.description ?? "").replace(/<[^>]*>/g, " ").toLowerCase();
        const svcs = (p.services || []).join(" ").toLowerCase();
        return (
          (p.companyName ?? "").toLowerCase().includes(q) ||
          (p.category ?? "").toLowerCase().includes(q) ||
          (p.subcategory ?? "").toLowerCase().includes(q) ||
          desc.includes(q) ||
          (p.city ?? "").toLowerCase().includes(q) ||
          svcs.includes(q) ||
          (p.activityTitle || "").toLowerCase().includes(q)
        );
      });
    }
    if (category) results = results.filter(p => p.category === category);
    if (geoLat !== null && geoLng !== null) {
      // Filtre par rayon géographique
      results = results.filter(p => {
        if (!p.lat || !p.lng) return false;
        return haversine(geoLat, geoLng, p.lat, p.lng) <= geoRadius;
      });
      // Tri : d'abord par ordre d'affichage standard du site (voir getListingRank),
      // puis par distance croissante au sein d'un même niveau
      results.sort((a, b) => {
        const rankDiff = getListingRank(a) - getListingRank(b);
        if (rankDiff !== 0) return rankDiff;
        const dA = haversine(geoLat, geoLng, a.lat!, a.lng!);
        const dB = haversine(geoLat, geoLng, b.lat!, b.lng!);
        return dA - dB;
      });
    } else {
      if (city) {
        const c = city.toLowerCase();
        results = results.filter(p =>
          (p.city ?? "").toLowerCase().includes(c) || (p.postalCode ?? "").includes(c)
        );
      }
      results.sort((a, b) => getListingRank(a) - getListingRank(b));
    }
    setFiltered(results);
  }, [search, category, city, geoLat, geoLng, geoRadius, pros]);

  const handleSelectPro = useCallback((id: string) => {
    setHighlightId(id);
    if (view === "map") {
      setView("list");
      setTimeout(() => {
        document.getElementById(`pro-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } else {
      document.getElementById(`pro-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [view]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-landes-pine px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-white">Annuaire des professionnels</h1>
              <p className="text-sm text-gray-300">Landes (40) — <span className="font-medium text-landes-sand">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
                {geoLat !== null && <span className="ml-2 text-xs bg-landes-forest/30 text-landes-sand px-2 py-0.5 rounded-full">📍 Autour de moi · {geoRadius} km</span>}
              </p>
            </div>
            {/* View toggle */}
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg">
              <button
                onClick={() => setView("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === "list" ? "bg-white text-landes-forest shadow-sm" : "text-white/70 hover:text-white"}`}
              >
                <List className="w-4 h-4" /> Liste
              </button>
              <button
                onClick={() => setView("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === "map" ? "bg-white text-landes-forest shadow-sm" : "text-white/70 hover:text-white"}`}
              >
                <MapIcon className="w-4 h-4" /> Carte
              </button>
            </div>
          </div>

          {/* Même formulaire de recherche IA que l'accueil */}
          <NeedSearchBar initialValue={search} />
        </div>
      </div>

      {/* Content */}
      <div id="resultats" className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 scroll-mt-24">
        {/* Résumé dynamique de la recherche — utile pour l'utilisateur ; cette
            page reste volontairement non indexée par Google (voir page.tsx),
            l'autorité SEO étant concentrée sur les pages canoniques
            catégories/villes plutôt que sur des URLs de recherche libre. */}
        {(category || search) && filtered.length > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
            {category ? ` en ${category}` : ""}
            {search ? ` pour « ${search} »` : ""}
            {city ? ` à ${city}` : ""} dans les Landes.
          </p>
        )}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">Aucun résultat</h3>
            <p className="text-gray-400">Essayez de modifier vos critères.</p>
          </div>
        ) : view === "list" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(pro => (
              <div
                key={pro.id}
                id={`pro-${pro.id}`}
                className={`transition-all duration-300 ${highlightId === pro.id ? "ring-2 ring-landes-forest ring-offset-2 rounded-2xl" : ""}`}
              >
                <ProfessionalCard pro={pro} />
              </div>
            ))}
          </div>
        ) : (
          /* MAP VIEW — split: list left, map right */
          <div className="flex flex-col lg:flex-row gap-4" style={{ height: "calc(100vh - 260px)", minHeight: 500 }}>
            {/* List panel */}
            <div className="lg:w-80 xl:w-96 flex-shrink-0 overflow-y-auto space-y-3 pr-1">
              {filtered.map(pro => (
                <div
                  key={pro.id}
                  id={`pro-${pro.id}`}
                  onClick={() => setHighlightId(pro.id)}
                  className={`transition-all duration-200 cursor-pointer ${highlightId === pro.id ? "ring-2 ring-landes-forest ring-offset-1 rounded-2xl" : ""}`}
                >
                  <ProfessionalCard pro={pro} />
                </div>
              ))}
            </div>

            {/* Map panel */}
            <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ minHeight: 400 }}>
              <MultiMap professionals={filtered} onSelectPro={handleSelectPro} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnnuaireSearchClient() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Chargement...</div>}>
      <AnnuaireContent />
    </Suspense>
  );
}
