"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Briefcase, ChevronRight, Search, MapPin, X, Loader2, LocateFixed, ArrowRight } from "lucide-react";
import { getProfessionalsWithImages } from "@/lib/storage";
import { getListingRank } from "@/lib/listingOrder";
import { categorySlug } from "@/lib/profileUrl";
import { Professional } from "@/types";
import ProfessionalCard from "@/components/professional/ProfessionalCard";
import HeroPubSlideshow from "@/components/ui/HeroPubSlideshow";
import { CATEGORY_META } from "@/lib/categoryData";
import { DEFAULT_BANNERS } from "@/lib/defaultBanners";

const MultiMap = dynamic(() => import("@/components/map/MultiMap"), { ssr: false });

interface Props {
  categoryLabel: string;
  subcategoryLabel: string;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function SubcategoryPage({ categoryLabel, subcategoryLabel }: Props) {
  const [pros, setPros] = useState<Professional[]>([]);
  const [filtered, setFiltered] = useState<Professional[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [citiesWithPros, setCitiesWithPros] = useState<string[]>([]);

  // Formulaire de recherche
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [showCity, setShowCity] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);

  // Géolocalisation "Autour de moi"
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [radius, setRadius] = useState<number>(25);
  const [showRadius, setShowRadius] = useState(false);
  const radiusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const all = (await getProfessionalsWithImages()).filter(
        p => p.status === "active" && p.category === categoryLabel && p.subcategory === subcategoryLabel
      );
      all.sort((a, b) => getListingRank(a) - getListingRank(b));
      setPros(all);
      setFiltered(all);
      setLoaded(true);
      setMapLoaded(true);

      const cities = Array.from(new Set(all.map(p => p.city).filter(Boolean)));
      cities.sort((a, b) => a.localeCompare(b, "fr"));
      setCitiesWithPros(cities);
    })();
  }, [categoryLabel, subcategoryLabel]);

  // Ferme le menu du rayon au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!cityRef.current?.contains(e.target as Node)) setShowCity(false);
      if (!radiusRef.current?.contains(e.target as Node)) setShowRadius(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) { setGeoError("Géolocalisation non supportée"); return; }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setLocation("📍 Ma position");
        setGeoLoading(false);
        setShowRadius(true);
      },
      () => { setGeoError("Position non disponible"); setGeoLoading(false); },
      { timeout: 8000 }
    );
  }, []);

  const clearGeo = useCallback(() => {
    setUserLat(null);
    setUserLng(null);
    setLocation("");
    setShowRadius(false);
  }, []);

  const handleLocationChange = (loc: string) => {
    setLocation(loc);
    if (userLat !== null) { setUserLat(null); setUserLng(null); setShowRadius(false); }
  };

  const runSearch = useCallback(() => {
    const qLow = query.trim().toLowerCase();
    const locLow = location.trim().toLowerCase();
    const result = pros.filter(p => {
      const desc = (p.description ?? "").replace(/<[^>]*>/g, " ").toLowerCase();
      const matchQ = !qLow || (
        (p.companyName ?? "").toLowerCase().includes(qLow) ||
        desc.includes(qLow) ||
        (p.services || []).join(" ").toLowerCase().includes(qLow)
      );
      const matchLoc = (userLat !== null && userLng !== null)
        ? (p.lat != null && p.lng != null && haversine(userLat, userLng, p.lat, p.lng) <= radius)
        : (!locLow || (p.city ?? "").toLowerCase().includes(locLow) || (p.postalCode ?? "").includes(locLow));
      return matchQ && matchLoc;
    }).sort((a, b) => {
      if (userLat !== null && userLng !== null && a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
        const dA = haversine(userLat, userLng, a.lat, a.lng);
        const dB = haversine(userLat, userLng, b.lat, b.lng);
        if (dA !== dB) return dA - dB;
      }
      return getListingRank(a) - getListingRank(b);
    });
    setFiltered(result);
    setTimeout(() => document.getElementById("resultats")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, [pros, query, location, userLat, userLng, radius]);

  const citySuggestions = location.trim()
    ? citiesWithPros.filter(c => c.toLowerCase().includes(location.toLowerCase())).slice(0, 5)
    : citiesWithPros.slice(0, 5);

  const mapPros = pros.filter(p => p.lat && p.lng);
  const catMeta = CATEGORY_META[categorySlug(categoryLabel)];

  return (
    <div className="bg-landes-cream min-h-screen">
      {/* ── HERO — même agencement que les pages catégories ── */}
      <section className="relative bg-landes-hero overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-landes-sky blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-10 pb-16 sm:pb-20 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center mb-6 sm:mb-10">

            {/* LEFT — fil d'Ariane + badge + titre + sous-titre + CTA */}
            <div className="flex flex-col items-start w-full">
              <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-300 mb-4 sm:mb-5 overflow-x-auto no-scrollbar whitespace-nowrap w-full">
                <Link href="/" className="hover:text-white transition-colors flex-shrink-0">Accueil</Link>
                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <Link href="/categories" className="hover:text-white transition-colors flex-shrink-0">Catégories</Link>
                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <Link href={`/categories/${categorySlug(categoryLabel)}`} className="hover:text-white transition-colors flex-shrink-0">{categoryLabel}</Link>
                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span className="text-landes-sand font-medium flex-shrink-0">{subcategoryLabel}</span>
              </nav>

              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-landes-sand flex-shrink-0" />
                <span>Annuaire local — Département des Landes (40)</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 sm:mb-4 flex items-center gap-3">
                <Briefcase className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" /> {subcategoryLabel}
              </h1>
              <p className="text-gray-300 text-sm sm:text-base lg:text-lg mb-2">
                Tous les professionnels référencés en {subcategoryLabel} ({categoryLabel}) sur Prolocal-Landes.
              </p>
              {loaded && pros.length > 0 && (
                <p className="text-white/70 text-sm mb-5 sm:mb-6">
                  {pros.length} professionnel{pros.length > 1 ? "s" : ""} référencé{pros.length > 1 ? "s" : ""}
                  {citiesWithPros.length > 0 ? `, dans ${citiesWithPros.length} commune${citiesWithPros.length > 1 ? "s" : ""}` : ""}
                </p>
              )}

              <Link href="/inscription" className="btn-amber flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3 px-5 sm:px-7 w-full sm:w-auto">
                Référencer mon activité <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </Link>
            </div>

            {/* RIGHT — diaporama des encarts publicitaires ciblés de cette
                sous-catégorie (ou image bannière par défaut / emoji si aucun
                encart actif) */}
            <div className="hidden lg:block">
              <HeroPubSlideshow
                category={categoryLabel}
                subcategory={subcategoryLabel}
                fallback={
                  DEFAULT_BANNERS[categoryLabel] ? (
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl min-h-[400px]">
                      <img src={DEFAULT_BANNERS[categoryLabel]} alt={categoryLabel} className="w-full h-full object-cover absolute inset-0" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      {loaded && pros.length > 0 && (
                        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2.5 text-white text-center">
                          <p className="text-2xl font-bold">{pros.length}</p>
                          <p className="text-xs text-white/70">professionnel{pros.length > 1 ? "s" : ""}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-6 min-h-[400px]">
                      <div className="bg-white/10 backdrop-blur-sm rounded-3xl px-14 py-10 border border-white/20 flex flex-col items-center gap-4">
                        <div className="text-8xl select-none">{catMeta?.emoji || "💼"}</div>
                        <div className="text-center border-t border-white/20 pt-5 w-full">
                          <p className="text-5xl font-bold text-white">{pros.length}</p>
                          <p className="text-gray-300 text-sm mt-1">professionnel{pros.length > 1 ? "s" : ""} référencé{pros.length > 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <p className="text-white/40 text-xs text-center max-w-xs">Mise à jour en temps réel · Landes (40)</p>
                    </div>
                  )
                }
              />
              <p className="text-xs text-white/50 text-center mt-3">
                Pour afficher votre fiche professionnelle dans ce diaporama, choisissez l&apos;option « Encart publicitaire » dans votre tableau de bord.
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 50L1440 50L1440 15C1200 40 960 5 720 25C480 45 240 5 0 15L0 50Z" fill="#FAF7F0"/>
          </svg>
        </div>
      </section>

      {/* ── CARTE + FORMULAIRE DE RECHERCHE — même agencement que les pages catégories ── */}
      <section className="bg-white py-8 sm:py-10 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4 sm:mb-6">
            <p className="text-sm font-semibold text-landes-sage uppercase tracking-wider mb-1">Carte interactive</p>
            <h2 className="text-xl sm:text-2xl font-bold text-landes-pine">
              {subcategoryLabel} près de chez vous
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Cliquez sur un marqueur pour voir la fiche du professionnel</p>
          </div>
          <div className="card-map h-72 sm:h-96 lg:h-[460px]">
            {mapLoaded && mapPros.length > 0 ? (
              <MultiMap
                professionals={mapPros}
                onSelectPro={id =>
                  document.getElementById(`pro-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-2">
                  <MapPin className="w-8 h-8 text-gray-300 mx-auto animate-pulse" />
                  <p className="text-sm text-gray-400">
                    {mapLoaded ? "Aucun professionnel géolocalisé pour le moment" : "Chargement de la carte…"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Formulaire de recherche — juste sous la carte */}
          {loaded && pros.length > 0 && (
            <div className="mt-4 sm:mt-6">
              <form
                onSubmit={e => { e.preventDefault(); runSearch(); }}
                className="w-full bg-white rounded-2xl shadow-2xl overflow-visible"
              >
                <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                  <div className="flex-1 relative">
                    <div className="flex items-center gap-2 sm:gap-3 px-4 py-3 sm:px-5 sm:py-4">
                      <Search className="w-4 h-4 sm:w-5 sm:h-5 text-landes-sage flex-shrink-0" />
                      <input
                        type="text" value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={`Nom, service en ${subcategoryLabel.toLowerCase()}…`}
                        className="w-full text-gray-800 placeholder-gray-400 text-sm sm:text-base focus:outline-none bg-transparent min-w-0"
                        autoComplete="off"
                      />
                      {query && (
                        <button type="button" onClick={() => setQuery("")} className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 relative" ref={cityRef}>
                    <div className="flex items-center gap-2 sm:gap-3 px-4 py-3 sm:px-5 sm:py-4">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-landes-sage flex-shrink-0" />
                      <input
                        type="text" value={location}
                        onChange={e => { handleLocationChange(e.target.value); setShowCity(true); }}
                        onFocus={() => setShowCity(true)}
                        placeholder="Ville ou code postal…"
                        className="w-full text-gray-800 placeholder-gray-400 text-sm sm:text-base focus:outline-none bg-transparent min-w-0"
                        autoComplete="off"
                      />
                      {location && (
                        <button type="button" onClick={() => handleLocationChange("")} className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {showCity && citySuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-b-xl shadow-lg z-50 overflow-hidden">
                        {citySuggestions.map((c, i) => (
                          <button
                            key={i} type="button"
                            onMouseDown={() => { handleLocationChange(c); setShowCity(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-landes-forest/5 text-left transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5 text-landes-sage flex-shrink-0" />
                            <span className="text-sm text-gray-700">{c}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bouton Autour de moi */}
                  <div className="relative flex-shrink-0" ref={radiusRef}>
                    {userLat === null ? (
                      <button
                        type="button"
                        onClick={handleGeolocate}
                        disabled={geoLoading}
                        title="Autour de moi"
                        className="flex items-center justify-center gap-1.5 px-4 py-3 sm:px-5 sm:py-4 text-sm text-landes-forest hover:bg-landes-forest/5 transition-colors whitespace-nowrap disabled:opacity-50 w-full sm:w-auto"
                      >
                        {geoLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <LocateFixed className="w-4 h-4 sm:w-5 sm:h-5" />}
                        <span className="hidden sm:inline">Autour de moi</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowRadius(!showRadius)}
                        className="flex items-center justify-center gap-1.5 px-4 py-3 sm:px-5 sm:py-4 text-sm text-landes-forest bg-landes-forest/5 whitespace-nowrap w-full sm:w-auto"
                      >
                        <LocateFixed className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>{radius} km</span>
                      </button>
                    )}
                    {geoError && (
                      <p className="absolute top-full left-0 mt-1 text-xs text-red-500 whitespace-nowrap">{geoError}</p>
                    )}
                    {showRadius && userLat !== null && (
                      <div className="absolute top-full right-0 sm:left-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden min-w-[160px]">
                        {[5, 10, 25, 50, 100].map(r => (
                          <button
                            key={r} type="button"
                            onMouseDown={() => { setRadius(r); setShowRadius(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-landes-forest/5 transition-colors ${radius === r ? "text-landes-forest font-semibold" : "text-gray-700"}`}
                          >
                            Dans un rayon de {r} km
                          </button>
                        ))}
                        <button
                          type="button"
                          onMouseDown={clearGeo}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
                        >
                          Désactiver la géolocalisation
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 bg-landes-forest hover:bg-landes-pine text-white font-semibold text-sm sm:text-base px-6 py-3 sm:px-8 sm:py-4 transition-colors whitespace-nowrap rounded-b-2xl sm:rounded-b-none sm:rounded-r-2xl"
                  >
                    <Search className="w-4 h-4 sm:w-5 sm:h-5" /><span>Rechercher</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>

      <section id="resultats" className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 scroll-mt-20">
        {/* Résultats */}
        {!loaded ? (
          <div className="text-center py-16 text-gray-400">Chargement…</div>
        ) : pros.length === 0 ? (
          <div className="text-center py-16 card">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-bold text-landes-pine text-lg mb-2">Aucun professionnel trouvé</h3>
            <p className="text-gray-500 text-sm mb-6">
              Aucun professionnel en {subcategoryLabel} n&apos;est encore référencé dans les Landes.
            </p>
            <Link href="/inscription" className="btn-primary inline-flex items-center gap-2">
              Référencer mon entreprise ici
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 card">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-bold text-landes-pine text-lg mb-2">Aucun résultat pour cette recherche</h3>
            <p className="text-gray-500 text-sm mb-6">Essayez de modifier vos critères de recherche.</p>
            <button onClick={() => { setQuery(""); setLocation(""); clearGeo(); setFiltered(pros); }} className="btn-secondary">
              Réinitialiser la recherche
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(pro => <ProfessionalCard key={pro.id} pro={pro} />)}
          </div>
        )}
      </section>
    </div>
  );
}
