"use client";
import { useEffect, useState } from "react";
import { CheckCircle, CreditCard, Loader2, X } from "lucide-react";
import { OPTION_PRICES as DEFAULT_OPTION_PRICES, CONTACT_PACKS, type CheckoutItem } from "@/lib/pricing";
import StripePaymentForm from "./StripePaymentForm";

interface Props {
  stripeCustomerId?: string;
  email: string;
  companyName: string;
  siren?: string;
  onCustomerIdObtained?: (customerId: string) => void;
  /**
   * Appelé après l'activation réussie d'une option, pour que la page
   * appelante synchronise le champ local `complementaryOptions` de la
   * fiche professionnelle (utilisé notamment par le diaporama des
   * encarts publicitaires sur les pages catégories/sous-catégories, qui
   * ne peut pas interroger Stripe en direct pour chaque professionnel).
   */
  onOptionActivated?: (optionId: string) => void;
}

export default function ComplementaryOptionsManager({ stripeCustomerId, email, companyName, siren, onCustomerIdObtained, onOptionActivated }: Props) {
  const [optionsCatalog, setOptionsCatalog] = useState<Record<string, CheckoutItem>>(DEFAULT_OPTION_PRICES);
  const [activeNames, setActiveNames] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [contactQty, setContactQty] = useState<number>(CONTACT_PACKS[0].quantity);
  const [orderingId, setOrderingId] = useState<string | null>(null);
  const [orderingQuantity, setOrderingQuantity] = useState<number | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pendingCustomerId, setPendingCustomerId] = useState<string | null>(null);
  const [ordered, setOrdered] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  const loadActiveOptions = async () => {
    const effectiveCustomerId = stripeCustomerId || pendingCustomerId;
    if (!effectiveCustomerId) { setLoading(false); return; }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/subscriptions/list?customerId=${encodeURIComponent(effectiveCustomerId)}`);
      const data = await res.json();
      if (data.error) { setLoadError(data.error); return; }
      const names = new Set<string>();
      for (const sub of data.subscriptions || []) {
        if (sub.status !== "active" && sub.status !== "trialing") continue;
        for (const item of sub.items || []) names.add(item.name);
      }
      setActiveNames(names);
    } catch {
      setLoadError("Erreur réseau lors de la vérification de vos options actives.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadActiveOptions(); }, [stripeCustomerId]);

  // Charge le catalogue effectif des options (base si configurée/alimentée,
  // sinon repli automatique et silencieux sur le catalogue par défaut déjà
  // utilisé comme valeur initiale de l'état).
  useEffect(() => {
    fetch("/api/db/options")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.options && Object.keys(data.options).length > 0) {
          setOptionsCatalog(data.options);
        }
      })
      .catch(() => {
        // Silencieux : le catalogue par défaut reste utilisé
      });
  }, []);

  const isActive = (optionId: string) => activeNames.has(optionsCatalog[optionId]?.name || "");

  /** Montant réellement facturé pour une option, en tenant compte du pack choisi pour "Mises en contact". */
  const getOrderAmount = (optionId: string, quantity: number | null): number => {
    const opt = optionsCatalog[optionId];
    if (!opt) return 0;
    if (optionId === "contact" && quantity) {
      return CONTACT_PACKS.find(p => p.quantity === quantity)?.unitAmount ?? opt.unitAmount;
    }
    return opt.unitAmount;
  };

  const startOrder = async (optionId: string, quantity?: number) => {
    const qty = optionId === "contact" ? (quantity ?? contactQty) : null;
    setOrderingId(optionId);
    setOrderingQuantity(qty);
    setPreparing(true);
    setClientSecret(null);
    setOrdered(null);
    try {
      const res = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optionIds: [optionId],
          contactQuantity: qty ?? undefined,
          email,
          companyName,
          siren,
        }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        if (data.customerId) setPendingCustomerId(data.customerId);
      } else {
        alert(data.error || "Erreur lors de la préparation du paiement.");
        setOrderingId(null);
      }
    } catch {
      alert("Erreur réseau lors de la préparation du paiement.");
      setOrderingId(null);
    } finally {
      setPreparing(false);
    }
  };

  const handleSuccess = async (paymentMethodId?: string) => {
    const effectiveCustomerId = pendingCustomerId || stripeCustomerId;
    if (!effectiveCustomerId || !paymentMethodId || !orderingId) {
      alert("Impossible de finaliser la commande (informations manquantes).");
      return;
    }
    setFinalizing(true);
    try {
      const res = await fetch("/api/subscriptions/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: effectiveCustomerId,
          paymentMethodId,
          optionIds: [orderingId], // jamais de planId ici : les options sont des produits à part
          contactQuantity: orderingQuantity ?? undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.error || "Erreur lors de la finalisation de la commande.");
        return;
      }
      setOrdered(orderingId);
      if (pendingCustomerId && pendingCustomerId !== stripeCustomerId) {
        onCustomerIdObtained?.(pendingCustomerId);
      }
      onOptionActivated?.(orderingId);
      await loadActiveOptions();
    } catch {
      alert("Erreur réseau lors de la finalisation de la commande.");
    } finally {
      setFinalizing(false);
    }
  };

  const closeModal = () => {
    setOrderingId(null);
    setOrderingQuantity(null);
    setClientSecret(null);
    setOrdered(null);
  };

  return (
    <div className="card p-8 mt-6">
      <h2 className="text-xl font-bold text-landes-pine bg-landes-forest/8 border-l-4 border-landes-forest px-4 py-3 rounded-r-lg mb-1">Options complémentaires</h2>
      <p className="text-sm text-gray-500 mb-6">Boostez votre visibilité avec des options facultatives, activables à tout moment.</p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Vérification de vos options actives…
        </div>
      ) : (
        <>
          {loadError && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
              Impossible de vérifier vos options déjà actives ({loadError}) — vous pouvez tout de même en commander de nouvelles ci-dessous.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(optionsCatalog).map(opt => {
            const active = isActive(opt.id);
            return (
              <div key={opt.id} className={`card p-5 border-2 flex flex-col ${active ? "border-green-200 bg-green-50/40" : "border-gray-100"}`}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-landes-pine text-sm">{opt.name}</h3>
                  {active && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Actif
                    </span>
                  )}
                </div>
                {opt.id === "contact" ? (
                  <>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {CONTACT_PACKS.map(pack => (
                        <button
                          key={pack.quantity}
                          type="button"
                          onClick={() => setContactQty(pack.quantity)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border-2 transition-colors ${
                            contactQty === pack.quantity
                              ? "border-landes-forest bg-landes-forest text-white"
                              : "border-gray-200 text-gray-600 hover:border-landes-forest/40"
                          }`}
                        >
                          Pack {pack.quantity} contacts : {(pack.unitAmount / 100).toFixed(0)}€
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mb-4 flex-1">{opt.description}</p>
                    {!active && (
                      <button
                        onClick={() => startOrder(opt.id, contactQty)}
                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-landes-forest border-2 border-landes-forest px-4 py-2 rounded-xl hover:bg-landes-forest hover:text-white transition-colors"
                      >
                        <CreditCard className="w-4 h-4" /> Commander cette option
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-gray-900 mb-1">
                      {(opt.unitAmount / 100).toFixed(0)}€
                      <span className="text-xs font-normal text-gray-400 ml-1">{opt.cadence === "once" ? "(frais uniques)" : "/mois"}</span>
                    </p>
                    <p className="text-xs text-gray-500 mb-4 flex-1">{opt.description}</p>
                    {!active && (
                      <button
                        onClick={() => startOrder(opt.id)}
                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-landes-forest border-2 border-landes-forest px-4 py-2 rounded-xl hover:bg-landes-forest hover:text-white transition-colors"
                      >
                        <CreditCard className="w-4 h-4" /> Commander cette option
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
          </div>
        </>
      )}

      {/* Modale de commande / paiement */}
      {orderingId && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-landes-pine">
                Commander « {optionsCatalog[orderingId].name}
                {orderingId === "contact" && orderingQuantity ? ` — pack de ${orderingQuantity}` : ""} »
              </p>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {ordered ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-4">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700 font-medium">Option activée avec succès !</p>
              </div>
            ) : preparing || !clientSecret ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Préparation du paiement…
              </div>
            ) : finalizing ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Activation de l&apos;option…
              </div>
            ) : (
              <>
                <div className="bg-gray-50 rounded-lg p-3 mb-4 flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {optionsCatalog[orderingId].name}
                    {orderingId === "contact" && orderingQuantity ? ` — pack de ${orderingQuantity}` : ""}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {(getOrderAmount(orderingId, orderingQuantity) / 100).toFixed(0)}€
                    {optionsCatalog[orderingId].cadence === "once" ? " (frais uniques)" : "/mois"}
                  </span>
                </div>
                <StripePaymentForm
                  clientSecret={clientSecret}
                  intentType="setup"
                  submitLabel="Payer et activer l'option"
                  onSuccess={handleSuccess}
                />
              </>
            )}

            {ordered && (
              <button onClick={closeModal} className="btn-secondary w-full py-2 text-sm mt-4">Fermer</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
