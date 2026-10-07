"use client";
import { useEffect, useState } from "react";
import { CheckCircle, ShoppingCart, Loader2 } from "lucide-react";
import { OPTION_PRICES as DEFAULT_OPTION_PRICES, CONTACT_PACKS, type CheckoutItem } from "@/lib/pricing";

interface Props {
  stripeCustomerId?: string;
  /** Options déjà présentes dans le panier (géré par la page appelante — voir dashboard/page.tsx). */
  cart: { optionIds: string[]; contactQuantity: number | null };
  /** Ajoute/retire une option simple (hors "Mises en contact") du panier. */
  onToggleOption: (optionId: string) => void;
  /** Ajoute (ou met à jour la quantité d') un pack "Mises en contact" dans le panier. */
  onSelectContactPack: (quantity: number) => void;
  /** Retire le pack "Mises en contact" du panier. */
  onRemoveContactPack: () => void;
  /** Notifié dès que le catalogue effectif des options est connu, pour que la page affiche le panier avec les bons libellés/prix. */
  onCatalogLoaded?: (catalog: Record<string, CheckoutItem>) => void;
}

/**
 * Catalogue des options complémentaires, en "ajouter au panier" — le
 * paiement (formule + options cumulées, dont "Mises en contact") est géré
 * une seule fois, de façon centralisée, par la page appelante (voir le
 * panier et la modale de commande groupée dans dashboard/page.tsx).
 */
export default function ComplementaryOptionsManager({ stripeCustomerId, cart, onToggleOption, onSelectContactPack, onRemoveContactPack, onCatalogLoaded }: Props) {
  const [optionsCatalog, setOptionsCatalog] = useState<Record<string, CheckoutItem>>(DEFAULT_OPTION_PRICES);
  const [activeNames, setActiveNames] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!stripeCustomerId) { setLoading(false); return; }
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/subscriptions/list?customerId=${encodeURIComponent(stripeCustomerId)}`);
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
    load();
  }, [stripeCustomerId]);

  // Charge le catalogue effectif des options (base si configurée/alimentée,
  // sinon repli automatique et silencieux sur le catalogue par défaut déjà
  // utilisé comme valeur initiale de l'état).
  useEffect(() => {
    onCatalogLoaded?.(optionsCatalog);
    fetch("/api/db/options")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.options && Object.keys(data.options).length > 0) {
          setOptionsCatalog(data.options);
          onCatalogLoaded?.(data.options);
        }
      })
      .catch(() => {
        // Silencieux : le catalogue par défaut reste utilisé
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isActive = (optionId: string) => activeNames.has(optionsCatalog[optionId]?.name || "");

  return (
    <div className="card p-8 mt-6">
      <h2 id="options-complementaires" className="text-xl font-bold text-landes-pine bg-landes-forest/8 border-l-4 border-landes-forest px-4 py-3 rounded-r-lg mb-1 scroll-mt-24">Options complémentaires</h2>
      <p className="text-sm text-gray-500 mb-6">Boostez votre visibilité avec des options facultatives, activables à tout moment. Cumulez-les dans votre panier avant de valider une seule commande.</p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Vérification de vos options actives…
        </div>
      ) : (
        <>
          {loadError && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
              Impossible de vérifier vos options déjà actives ({loadError}) — vous pouvez tout de même en ajouter de nouvelles au panier ci-dessous.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(optionsCatalog).map(opt => {
            const active = isActive(opt.id);
            const inCart = cart.optionIds.includes(opt.id);
            return (
              <div key={opt.id} className={`card p-5 border-2 flex flex-col ${active ? "border-green-200 bg-green-50/40" : inCart ? "border-landes-forest bg-landes-forest/5" : "border-gray-100"}`}>
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
                      {CONTACT_PACKS.map(pack => {
                        const selected = inCart && cart.contactQuantity === pack.quantity;
                        return (
                          <button
                            key={pack.quantity}
                            type="button"
                            onClick={() => onSelectContactPack(pack.quantity)}
                            disabled={active}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              selected
                                ? "border-landes-forest bg-landes-forest text-white"
                                : "border-gray-200 text-gray-600 hover:border-landes-forest/40"
                            }`}
                          >
                            Pack {pack.quantity} contacts : {(pack.unitAmount / 100).toFixed(0)}€
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mb-4 flex-1">{opt.description}</p>
                    {!active && (
                      inCart ? (
                        <button
                          onClick={onRemoveContactPack}
                          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-landes-forest bg-landes-forest/10 px-4 py-2 rounded-xl hover:bg-landes-forest hover:text-white transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" /> Dans le panier — Retirer
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectContactPack(CONTACT_PACKS[0].quantity)}
                          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-landes-forest border-2 border-landes-forest px-4 py-2 rounded-xl hover:bg-landes-forest hover:text-white transition-colors"
                        >
                          <ShoppingCart className="w-4 h-4" /> Ajouter au panier
                        </button>
                      )
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
                      inCart ? (
                        <button
                          onClick={() => onToggleOption(opt.id)}
                          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-landes-forest bg-landes-forest/10 px-4 py-2 rounded-xl hover:bg-landes-forest hover:text-white transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" /> Dans le panier — Retirer
                        </button>
                      ) : (
                        <button
                          onClick={() => onToggleOption(opt.id)}
                          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-landes-forest border-2 border-landes-forest px-4 py-2 rounded-xl hover:bg-landes-forest hover:text-white transition-colors"
                        >
                          <ShoppingCart className="w-4 h-4" /> Ajouter au panier
                        </button>
                      )
                    )}
                  </>
                )}
              </div>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
}
