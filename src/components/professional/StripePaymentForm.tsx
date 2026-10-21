"use client";
import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripeClient } from "@/lib/stripeClient";
import { Loader2, CreditCard, ShieldCheck } from "lucide-react";

interface StripePaymentFormProps {
  clientSecret: string;
  /** "payment" pour un PaymentIntent, "setup" pour un SetupIntent (changement de carte) */
  intentType: "payment" | "setup";
  submitLabel: string;
  onSuccess: (paymentMethodId?: string) => void;
  onError?: (message: string) => void;
}

/** Wrapper Elements — charge Stripe et fournit le contexte au formulaire interne. */
export default function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements
      stripe={getStripeClient()}
      options={{
        clientSecret: props.clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#2D5A3D",
            fontFamily: "inherit",
            borderRadius: "10px",
          },
        },
      }}
    >
      <InnerForm {...props} />
    </Elements>
  );
}

function InnerForm({ intentType, submitLabel, onSuccess, onError }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMsg("");

    // redirect: "if_required" garde le client sur le site tant qu'aucune
    // authentification forte (3D Secure) n'est strictement nécessaire par sa
    // banque. Stripe exige malgré tout un `return_url` dès la création de
    // l'intent (voir /api/subscriptions/create et /finalize) : fournie ici
    // en repli, au cas où un parcours imposerait quand même une redirection
    // complète — jamais utilisée en pratique puisque seul le paiement par
    // carte est proposé (aucun moyen de paiement à redirection activé).
    const confirmParams = { return_url: window.location.href };
    const result = intentType === "payment"
      ? await stripe.confirmPayment({ elements, confirmParams, redirect: "if_required" })
      : await stripe.confirmSetup({ elements, confirmParams, redirect: "if_required" });

    if (result.error) {
      setErrorMsg(result.error.message || "Le paiement n'a pas pu être confirmé.");
      onError?.(result.error.message || "Erreur de paiement.");
      setSubmitting(false);
      return;
    }

    const paymentMethodId =
      intentType === "setup"
        ? (result as any).setupIntent?.payment_method
        : (result as any).paymentIntent?.payment_method;

    onSuccess(typeof paymentMethodId === "string" ? paymentMethodId : undefined);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {errorMsg && (
        <p className="text-sm text-red-500 flex items-start gap-1.5">
          <span>⚠</span> {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full flex items-center justify-center gap-2 bg-landes-forest text-white font-semibold py-3 rounded-xl hover:bg-landes-pine transition-colors disabled:opacity-50"
      >
        {submitting
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Traitement en cours…</>
          : <><CreditCard className="w-4 h-4" /> {submitLabel}</>
        }
      </button>

      <p className="text-[11px] text-gray-400 flex items-center gap-1.5 justify-center">
        <ShieldCheck className="w-3.5 h-3.5" /> Paiement sécurisé par Stripe — vos coordonnées bancaires ne transitent jamais par nos serveurs.
      </p>
    </form>
  );
}
