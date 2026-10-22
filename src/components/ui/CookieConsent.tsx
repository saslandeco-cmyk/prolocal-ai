"use client";
import { useEffect, useState } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";

const STORAGE_KEY = "cookie-consent";
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

type Consent = "accepted" | "rejected" | null;

/**
 * Bannière de consentement aux cookies — nécessaire uniquement à cause de
 * Google Analytics (GA4), qui dépose des cookies de mesure d'audience
 * (contrairement à Vercel Analytics/Speed Insights, cookieless, voir
 * layout.tsx) : le RGPD et les recommandations CNIL exigent un consentement
 * préalable avant tout dépôt de cookie non strictement nécessaire.
 *
 * GoogleAnalytics (gtag.js) n'est monté dans le DOM qu'après un choix
 * "Accepter" explicite et mémorisé (localStorage) — jamais par défaut, et
 * jamais avant que le visiteur n'ait vu la bannière. Sans
 * NEXT_PUBLIC_GA_MEASUREMENT_ID configurée, ce composant n'affiche même pas
 * la bannière : il n'y a alors aucun cookie de mesure d'audience à annoncer
 * (cohérent avec le reste du site : une fonctionnalité sans sa clé ne
 * s'active jamais, plutôt que d'afficher une bannière pour rien).
 */
export default function CookieConsent() {
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Consent;
    setConsent(stored);
    setReady(true);
  }, []);

  if (!GA_ID) return null;

  const choose = (value: "accepted" | "rejected") => {
    localStorage.setItem(STORAGE_KEY, value);
    setConsent(value);
  };

  return (
    <>
      {consent === "accepted" && <GoogleAnalytics gaId={GA_ID} />}

      {ready && consent === null && (
        <div className="fixed bottom-0 inset-x-0 z-[9999] bg-landes-pine text-white shadow-2xl">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-4 sm:p-5">
            <p className="text-sm text-gray-200 flex-1">
              Nous utilisons des cookies de mesure d&apos;audience (Google Analytics) pour comprendre comment le site est utilisé et l&apos;améliorer. Vous pouvez les accepter ou les refuser.
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => choose("rejected")}
                className="btn-secondary py-2 px-4 text-sm whitespace-nowrap"
              >
                Refuser
              </button>
              <button
                type="button"
                onClick={() => choose("accepted")}
                className="btn-amber py-2 px-4 text-sm whitespace-nowrap"
              >
                Accepter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
