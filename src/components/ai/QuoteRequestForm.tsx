"use client";
import { useState } from "react";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import type { NeedRequest } from "@/types/needs";

interface QuoteRequestFormProps {
  professionalId: string;
  need: NeedRequest;
}

/**
 * Formulaire "Demander un devis" — étape de confirmation explicite avant
 * l'envoi d'une demande au professionnel (voir POST /api/demandes).
 * Volontairement séparé de ProfessionalCard (composant partagé par tout le
 * site) pour ne pas modifier son comportement ailleurs.
 */
export default function QuoteRequestForm({ professionalId, need }: QuoteRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [message, setMessage] = useState(need.rawText);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nom.trim() || (!email.trim() && !telephone.trim())) {
      setError("Merci d'indiquer votre nom et un email ou un téléphone.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/demandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professionalId,
          besoin: need.besoin,
          categorie: need.categorie,
          sousCategorie: need.sousCategorie,
          commune: need.commune,
          messageOriginal: message,
          demandeurNom: nom,
          demandeurEmail: email || undefined,
          demandeurTelephone: telephone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mt-2">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Votre demande a été envoyée au professionnel.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full mt-2 flex items-center justify-center gap-2 border-2 border-landes-forest text-landes-forest text-sm font-semibold py-2.5 rounded-lg hover:bg-landes-forest hover:text-white transition-colors"
      >
        <Send className="w-4 h-4" /> Demander un devis
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 bg-gray-50 border border-gray-100 rounded-xl p-3">
      <input
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Votre nom"
        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-landes-forest"
      />
      <div className="flex gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          className="w-1/2 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-landes-forest"
        />
        <input
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          placeholder="Téléphone"
          className="w-1/2 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-landes-forest"
        />
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        maxLength={1000}
        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-landes-forest resize-none"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 text-sm font-medium py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={sending}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2 rounded-lg bg-landes-forest text-white hover:bg-landes-pine transition-colors disabled:opacity-60"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Envoyer
        </button>
      </div>
    </form>
  );
}
