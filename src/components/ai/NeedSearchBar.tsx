"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const EXAMPLES = [
  "J'ai une fuite d'eau chez moi à Dax",
  "Je cherche un jardinier près de Mont-de-Marsan",
  "Mon lave-linge ne fonctionne plus",
];

interface NeedSearchBarProps {
  initialValue?: string;
  onSearch?: (text: string) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < 3) return;
    if (onSearch) {
      onSearch(trimmed);
    } else {
      router.push(`/besoin?texte=${encodeURIComponent(trimmed)}`);
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
            placeholder={`Décrivez votre besoin en quelques mots… (ex : ${EXAMPLES.join(", ")})`}
            className="w-full text-gray-800 placeholder-gray-400 text-base focus:outline-none bg-transparent"
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
    </form>
  );
}
