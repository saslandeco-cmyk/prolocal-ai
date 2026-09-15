"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { MapPin, ArrowRight, Search, X, Loader2 } from "lucide-react";
import { getProfessionals } from "@/lib/storage";
import { buildProfileUrl } from "@/lib/profileUrl";
import { Professional } from "@/types";

const MultiMap = dynamic(() => import("@/components/map/MultiMap"), { ssr: false });

const LANDES_CITIES = [
  { name: "Mont-de-Marsan", lat: 43.8914, lng: -0.5006 },
  { name: "Dax",            lat: 43.7101, lng: -1.0527 },
  { name: "Biscarrosse",    lat: 44.3952, lng: -1.1637 },
  { name: "Capbreton",      lat: 43.6630, lng: -1.4431 },
  { name: "Hossegor",       lat: 43.6640, lng: -1.4292 },
  { name: "Mimizan",        lat: 44.2033, lng: -1.2297 },
  { name: "Parentis-en-Born", lat: 44.3500, lng: -1.0667 },
  { name: "Hagetmau",       lat: 43.6429, lng: -0.5910 },
  { name: "Tarnos",         lat: 43.5600, lng: -1.4700 },
  { name: "Soustons",       lat: 43.7540, lng: -1.2749 },
  { name: "Morcenx",        lat: 44.0906, lng: -0.6003 },
  { name: "Aire-sur-l'Adour", lat: 43.9265, lng: -0.3303 },
  { name: "Tartas",         lat: 43.8335, lng: -0.7502 },
  { name: "Labouheyre",     lat: 44.2000, lng: -1.0000 },
  { name: "Sabres",         lat: 44.1500, lng: -0.7333 },
  { name: "Saint-Paul-lès-Dax", lat: 43.7167, lng: -1.1333 },
  { name: "Saint-Vincent-de-Tyrosse", lat: 43.7167, lng: -1.1333 },
];

export default function HomeMap() {
  const router  = useRouter();
  const [pros, setPros]     = useState<Professional[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery]   = useState("");
  const [suggestions, setSuggestions] = useState<typeof LANDES_CITIES>([]);
  const [showSug, setShowSug] = useState(false);
  const [searching, setSearching] = useState(false);
  const [flyTo, setFlyTo]   = useState<{ lat: number; lng: number; zoom: number; v: number } | null>(null);
  const flyV = useRef(0);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const sugRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const real = getProfessionals().filter(p => p.status === "active" && p.lat && p.lng);
    setPros(real);
    setLoaded(true);
  }, []);

  // Suggestions de villes
  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    const q = query.toLowerCase();
    // Chercher aussi par code postal (40xxx)
    const isPostal = /^\d+$/.test(q);
    setSuggestions(
      LANDES_CITIES.filter(c =>
        isPostal
          ? false // Géocodage Nominatim pour les CP
          : c.name.toLowerCase().includes(q)
      ).slice(0, 6)
    );
  }, [query]);

  // Fermer au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!sugRef.current?.contains(e.target as Node)) setShowSug(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const zoomToCity = (city: { name: string; lat: number; lng: number }) => {
    setQuery(city.name);
    setActiveCity(city.name);
    setShowSug(false);
    flyV.current += 1;
    setFlyTo({ lat: city.lat, lng: city.lng, zoom: 13, v: flyV.current });
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    // 1. Chercher dans la liste locale
    const local = LANDES_CITIES.find(c => c.name.toLowerCase() === query.toLowerCase());
    if (local) { zoomToCity(local); return; }

    // 2. Géocoder via Nominatim pour les CP et villes inconnues
    setSearching(true);
    try {
      const q = encodeURIComponent(`${query}, Landes, France`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=fr`,
        { headers: { "Accept-Language": "fr", "User-Agent": "Prolocal-Landes/1.0" } }
      );
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setActiveCity(data[0].display_name.split(",")[0]);
        flyV.current += 1;
        setFlyTo({ lat, lng, zoom: 13, v: flyV.current });
      }
    } catch {
      // Silencieux
    } finally {
      setSearching(false);
    }
  };

  const reset = () => {
    setQuery("");
    setActiveCity(null);
    flyV.current += 1;
    setFlyTo({ lat: 44.0, lng: -0.9, zoom: 9, v: flyV.current });
  };

  return (
    <section className="bg-landes-cream py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-semibold text-landes-sage uppercase tracking-wider mb-1">
              Carte interactive
            </p>
            <h2 className="text-3xl font-bold text-landes-pine">
              Les professionnels près de chez vous
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Survolez un marqueur pour voir la fiche du professionnel
            </p>
          </div>
        </div>

        {/* Barre de recherche par ville / CP */}
        <form onSubmit={handleSearch} className="mb-4" ref={sugRef}>
          <div className="relative">
            <div className="flex items-center bg-white rounded-2xl shadow-md border border-gray-100 overflow-visible">
              <div className="flex items-center gap-3 flex-1 px-5 py-3.5">
                <MapPin className="w-5 h-5 text-landes-sage flex-shrink-0" />
                <input
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowSug(true); }}
                  onFocus={() => setShowSug(true)}
                  placeholder="Rechercher par ville ou code postal… (ex: Dax, 40100)"
                  className="flex-1 text-gray-800 placeholder-gray-400 text-sm focus:outline-none bg-transparent"
                  autoComplete="off"
                />
                {query && (
                  <button type="button" onClick={reset}
                    className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={searching || !query.trim()}
                className="flex items-center gap-2 bg-landes-forest hover:bg-landes-pine disabled:opacity-50 text-white font-semibold text-sm px-6 py-3.5 transition-colors whitespace-nowrap rounded-r-2xl"
              >
                {searching
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Search className="w-4 h-4" />
                }
                Zoomer
              </button>
            </div>

            {/* Suggestions */}
            {showSug && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                {suggestions.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={() => zoomToCity(c)}
                    className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-landes-forest/5 text-left transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-landes-sage flex-shrink-0" />
                    <span className="text-sm text-gray-700"
                      dangerouslySetInnerHTML={{
                        __html: c.name.replace(new RegExp(`(${query})`, "gi"), "<strong>$1</strong>")
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Badge ville active */}
          {activeCity && (
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 text-xs bg-landes-forest text-white px-3 py-1 rounded-full font-medium">
                <MapPin className="w-3 h-3" /> {activeCity}
              </span>
              <button type="button" onClick={reset}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline">
                Voir toutes les Landes
              </button>
            </div>
          )}
        </form>

        {/* Carte */}
        <div className="card-map" style={{ height: 520 }}>
          {loaded ? (
            <MultiMap professionals={pros} onSelectPro={id => {
              const p = pros.find(pr => pr.id === id);
              router.push(p ? buildProfileUrl(p) : `/annuaire/${id}`);
            }} flyTo={flyTo} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <div className="text-center space-y-2">
                <MapPin className="w-8 h-8 text-gray-300 mx-auto animate-pulse" />
                <p className="text-sm text-gray-400">Chargement de la carte…</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
