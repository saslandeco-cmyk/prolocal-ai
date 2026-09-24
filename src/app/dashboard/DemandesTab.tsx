"use client";
import { useEffect, useState, useCallback } from "react";
import { Inbox, Loader2, Mail, Phone, MapPin, Lock, MessageCircle, Sparkles, MessageSquareText } from "lucide-react";
import type { Demande, DemandeStatus, DemandeCanal } from "@/types/needs";

const STATUS_LABELS: Record<DemandeStatus, string> = {
  nouvelle: "Nouvelle",
  en_cours: "En cours",
  repondue: "Répondue",
  acceptee: "Acceptée",
  terminee: "Terminée",
  annulee: "Annulée",
};

const STATUS_STYLES: Record<DemandeStatus, string> = {
  nouvelle: "bg-landes-forest/10 text-landes-forest",
  en_cours: "bg-amber-100 text-amber-700",
  repondue: "bg-blue-100 text-blue-700",
  acceptee: "bg-green-100 text-green-700",
  terminee: "bg-gray-100 text-gray-500",
  annulee: "bg-red-100 text-red-600",
};

const CANAL_LABELS: Record<DemandeCanal, string> = {
  prolocal_ai: "PROLOCAL AI",
  question: "Poser une question",
  appel: "Appel",
  whatsapp: "WhatsApp",
  email: "Email",
};

const CANAL_ICONS: Record<DemandeCanal, React.ReactNode> = {
  prolocal_ai: <Sparkles className="w-3.5 h-3.5" />,
  question: <MessageSquareText className="w-3.5 h-3.5" />,
  appel: <Phone className="w-3.5 h-3.5" />,
  whatsapp: <MessageCircle className="w-3.5 h-3.5" />,
  email: <Mail className="w-3.5 h-3.5" />,
};

interface Quota {
  limit: number | null; // null = illimité
  used: number;
  plan: string | null;
}

/**
 * Onglet dashboard "Demandes reçues" — regroupe tous les contacts reçus par
 * le professionnel (recherche PROLOCAL AI, "Poser une question" et clics
 * Appeler/WhatsApp/Email sur la fiche). Au-delà du quota mensuel de sa
 * formule (src/lib/contactQuota.ts), les demandes les plus récentes restent
 * visibles (date, canal) mais leur contenu est masqué.
 */
interface DemandesTabProps {
  proId: string;
  onUpgradeClick?: () => void;
  /** Notifié à chaque chargement/mise à jour avec le nombre de demandes au statut "nouvelle". */
  onCountChange?: (count: number) => void;
}

export default function DemandesTab({ proId, onUpgradeClick, onCountChange }: DemandesTabProps) {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/demandes?proId=${encodeURIComponent(proId)}`);
      const data = await res.json();
      setDemandes(res.ok ? data.demandes || [] : []);
      setQuota(res.ok ? data.quota || null : null);
    } catch {
      setDemandes([]);
      setQuota(null);
    } finally {
      setLoading(false);
    }
  }, [proId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    onCountChange?.(demandes.filter(d => d.status === "nouvelle").length);
  }, [demandes, onCountChange]);

  const updateStatus = async (id: string, status: DemandeStatus) => {
    setUpdatingId(id);
    try {
      await fetch(`/api/demandes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setDemandes(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-gray-500 py-16">
        <Loader2 className="w-5 h-5 animate-spin" /> Chargement des demandes…
      </div>
    );
  }

  // Demandes du mois en cours (les seules concernées par le quota), les plus
  // anciennes en premier — les `limit` premières restent lisibles, le reste
  // (plus récent) est verrouillé.
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthIds = demandes
    .filter(d => new Date(d.createdAt) >= startOfMonth)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(d => d.id);
  const lockedIds = new Set(
    quota?.limit != null ? thisMonthIds.slice(quota.limit) : []
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-landes-forest" />
          <h2 className="text-xl font-bold text-landes-pine">Demandes reçues</h2>
        </div>
        {quota && quota.limit != null && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${quota.used >= quota.limit ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
            {Math.min(quota.used, quota.limit)}/{quota.limit} ce mois-ci
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Demandes de devis ou de contact envoyées via la recherche PROLOCAL AI, le formulaire de la fiche ou un clic Appeler/WhatsApp/Email.
      </p>

      {lockedIds.size > 0 && (
        <div className="card p-4 border border-amber-200 bg-amber-50/50 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-amber-800">
            <strong>{lockedIds.size}</strong> demande{lockedIds.size > 1 ? "s" : ""} de ce mois {lockedIds.size > 1 ? "sont verrouillées" : "est verrouillée"} — quota mensuel de votre formule atteint.
          </p>
          {onUpgradeClick && (
            <button onClick={onUpgradeClick} className="text-xs font-semibold bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors">
              Changer de formule
            </button>
          )}
        </div>
      )}

      {demandes.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          Aucune demande reçue pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {demandes.map(d => {
            const locked = lockedIds.has(d.id);
            return (
              <div key={d.id} className="card p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {CANAL_ICONS[d.canal]} {CANAL_LABELS[d.canal]}
                      </span>
                      <p className="font-semibold text-landes-pine">{d.besoin || d.categorie || "Demande"}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span>{new Date(d.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</span>
                      {d.commune && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {d.commune}</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[d.status]}`}>
                    {STATUS_LABELS[d.status]}
                  </span>
                </div>

                {locked ? (
                  <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 p-4 flex items-center gap-3">
                    <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Quota mensuel atteint</p>
                      <p className="text-xs text-gray-400">Passez à la formule supérieure pour lire ce contact.</p>
                    </div>
                    {onUpgradeClick && (
                      <button onClick={onUpgradeClick} className="text-xs font-semibold text-landes-forest hover:underline flex-shrink-0">
                        Voir les formules
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {d.messageOriginal && (
                      <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{d.messageOriginal}</p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 flex-wrap">
                      <span className="font-medium text-gray-700">{d.demandeurNom}</span>
                      {d.demandeurEmail && (
                        <a href={`mailto:${d.demandeurEmail}`} className="flex items-center gap-1 hover:text-landes-forest">
                          <Mail className="w-3.5 h-3.5" /> {d.demandeurEmail}
                        </a>
                      )}
                      {d.demandeurTelephone && (
                        <a href={`tel:${d.demandeurTelephone}`} className="flex items-center gap-1 hover:text-landes-forest">
                          <Phone className="w-3.5 h-3.5" /> {d.demandeurTelephone}
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {(["en_cours", "repondue", "acceptee", "terminee", "annulee"] as DemandeStatus[]).map(s => (
                        <button
                          key={s}
                          disabled={updatingId === d.id || d.status === s}
                          onClick={() => updateStatus(d.id, s)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-landes-forest hover:text-landes-forest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Marquer « {STATUS_LABELS[s]} »
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
