"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Locate, Loader2 } from "lucide-react";

interface GeoCoords {
  lat: number;
  lng: number;
}

interface NeedSearchBarProps {
  initialValue?: string;
  onSearch?: (text: string, geo?: GeoCoords) => void;
}

/**
 * Champ de recherche conversationnel — coeur du parcours PROLOCAL AI.
 * Volontairement un simple champ de texte libre + bouton (pas d'interface
 * de chat à plusieurs échanges) : l'utilisateur décrit son besoin une fois,
 * PROLOCAL AI comprend et affiche directement des professionnels réels.
 */
export default function NeedSearchBar({ initialValue = "", onSearch }: NeedSearchBarProps) {
  const router = useRouter();
  const [text, setText] = useState(initialValue);
  const [cityInput, setCityInput] = useState("");
  const [geoCoords, setGeoCoords] = useState<GeoCoords | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  const handleAutourDeMoi = () => {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => {
        setGeoError("Position non disponible. Vérifiez l'autorisation de géolocalisation.");
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < 3) return;
    // La position géolocalisée prime sur la ville tapée au clavier.
    const query = cityInput.trim() && !geoCoords ? `${trimmed} à ${cityInput.trim()}` : trimmed;
    if (onSearch) {
      onSearch(query, geoCoords ?? undefined);
    } else {
      const params = new URLSearchParams({ texte: query });
      if (geoCoords) {
        params.set("lat", String(geoCoords.lat));
        params.set("lng", String(geoCoords.lng));
      }
      router.push(`/besoin?${params.toString()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full bg-white rounded-2xl shadow-2xl p-2 sm:p-3">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex-1 flex items-center gap-3 px-3 sm:px-4 py-3">
          <Search className="w-5 h-5 text-landes-sage flex-shrink-0" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Recherche par métier ou décrivez votre besoin en quelques mots…"
            className="w-full text-gray-800 placeholder-gray-400 text-[0.76rem] italic focus:outline-none bg-transparent"
            autoComplete="off"
            maxLength={500}
          />
        </div>
        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-landes-forest hover:bg-landes-pine text-white font-semibold text-base px-6 sm:px-8 py-3 rounded-xl transition-colors whitespace-nowrap"
        >
          <Search className="w-5 h-5" />
          <span>Trouver un professionnel</span>
        </button>
      </div>
      <div className="flex items-center gap-2 px-4 py-3">
        <MapPin className="w-5 h-5 text-landes-sage flex-shrink-0" />
        <input
          value={cityInput}
          onChange={(e) => { setCityInput(e.target.value); setGeoCoords(null); }}
          placeholder="Ville ou code postal…"
          className="w-full text-gray-800 placeholder-gray-400 text-base focus:outline-none bg-transparent min-w-0"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleAutourDeMoi}
          disabled={geoLoading}
          title="Autour de moi"
          className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-landes-forest bg-landes-forest/8 hover:bg-landes-forest/15 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {geoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Locate className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{geoCoords ? "Position activée" : "Autour de moi"}</span>
        </button>
      </div>
      {geoError && <p className="text-xs text-red-500 px-4">{geoError}</p>}
    </form>
  );
}
