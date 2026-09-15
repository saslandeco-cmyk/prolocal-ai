"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { getProfessionalsWithImages } from "@/lib/storage";
import ProfessionalCard from "./ProfessionalCard";
import type { Professional } from "@/types";

interface FeaturedTab {
  label: string;
  icon: string;
  category: string;
  pros: Professional[];
}

const FEATURED_TABS: FeaturedTab[] = [
  {
    label: "Alimentation",
    icon: "🥖",
    category: "Alimentation & Épicerie",
    pros: [],
  },
  {
    label: "Artisanat",
    icon: "🎨",
    category: "Artisanat & Métiers d'art",
    pros: [],
  },
  {
    label: "Bâtiment",
    icon: "🔨",
    category: "Bâtiment & Travaux",
    pros: [],
  },
  {
    label: "Bien-être",
    icon: "💆",
    category: "Beauté & Bien-être",
    pros: [],
  },
  {
    label: "Commerce",
    icon: "🛍️",
    category: "Commerce & Vente",
    pros: [],
  },
  {
    label: "Agriculture",
    icon: "🌾",
    category: "Culture & Élevage",
    pros: [],
  },
  {
    label: "Immobilier",
    icon: "🏠",
    category: "Immobilier",
    pros: [],
  },
  {
    label: "Numérique",
    icon: "💻",
    category: "Informatique & Numérique",
    pros: [],
  },
  {
    label: "Services",
    icon: "🤝",
    category: "Services à la personne",
    pros: [],
  },
  {
    label: "Sport",
    icon: "🏄",
    category: "Sport & Fitness",
    pros: [],
  },
  {
    label: "Transport",
    icon: "🚚",
    category: "Transport de personnes",
    pros: [],
  },
];

// ── Card individuelle — même apparence que ProfessionalCard ──────
// ── Carrousel responsive : 1 (mobile) / 2 (tablette) / 3 (desktop) cards visibles ────────────
function ProCarousel({ pros, tabKey }: { pros: Professional[]; tabKey: number }) {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(0);          // card width in px
  const [visible, setVisible] = useState(3); // nombre de cards visibles (responsive)
  const [pos, setPos]   = useState(0);      // current index (real)
  const [tx, setTx]     = useState(0);      // translateX in px
  const [moving, setMoving] = useState(false);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const GAP     = 20;
  const VISIBLE = visible;
  const N       = pros.length;
  // Pas assez de fiches pour remplir tous les emplacements visibles : le
  // carrousel infini (avec clonage) n'a pas lieu d'être — le clonage
  // répéterait alors les mêmes fiches côte à côte dans le même écran
  // (ex: 3 professionnels Gold pour 3 emplacements visibles → les 3
  // mêmes fiches apparaissaient dupliquées). On affiche simplement les
  // fiches réelles, sans boucle ni défilement automatique.
  const needsLoop = N > VISIBLE;
  // Clone: [lastN | pros | firstN] for infinite loop
  const cloneCount = needsLoop ? Math.min(VISIBLE, N) : 0;
  const clones  = needsLoop ? [...pros.slice(-cloneCount), ...pros, ...pros.slice(0, cloneCount)] : pros;
  const START   = cloneCount; // real items begin here

  // Measure container → derive card width + nombre de cards visibles selon la largeur
  useEffect(() => {
    if (!wrapRef.current) return;

    const measure = (w: number) => {
      const nextVisible = w < 560 ? 1 : w < 860 ? 2 : 3;
      setVisible(nextVisible);
      setCw((w - GAP * (nextVisible - 1)) / nextVisible);
    };

    // Mesure synchrone immédiate au montage : évite d'attendre le premier
    // callback (asynchrone) du ResizeObserver, qui laissait le carrousel
    // vide jusqu'à un redimensionnement ou un rechargement de la page.
    const initialWidth = wrapRef.current.getBoundingClientRect().width;
    if (initialWidth > 0) {
      measure(initialWidth);
    } else {
      // Sécurité : si la largeur n'est pas encore disponible (layout non
      // flush), on retente au frame suivant.
      requestAnimationFrame(() => {
        if (wrapRef.current) measure(wrapRef.current.getBoundingClientRect().width);
      });
    }

    const obs = new ResizeObserver(entries => {
      measure(entries[0].contentRect.width);
    });
    obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  // Jump to initial position when cw is known, tab changes, or visible count changes
  useEffect(() => {
    if (cw === 0) return;
    setPos(0);
    setTx((START) * (cw + GAP));
    setMoving(false);
  }, [tabKey, cw, START, visible]);

  const step = useCallback((dir: 1 | -1) => {
    if (moving || cw === 0 || !needsLoop) return;
    const next = pos + dir;
    const nextTx = (START + next) * (cw + GAP);
    setMoving(true);
    setTx(nextTx);
    setTimeout(() => {
      // Wrap silently
      const wrapped = ((next % N) + N) % N;
      setPos(wrapped);
      setTx((START + wrapped) * (cw + GAP));
      setMoving(false);
    }, 400);
  }, [moving, cw, pos, START, N, needsLoop]);

  const next = useCallback(() => step(1),  [step]);
  const prev = useCallback(() => step(-1), [step]);

  useEffect(() => {
    if (paused || cw === 0 || !needsLoop) return;
    timer.current = setInterval(next, 3500);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [paused, next, cw, needsLoop]);

  const unit = cw + GAP;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Viewport */}
      <div ref={wrapRef} className="overflow-hidden" style={{ minHeight: 400 }}>
        {cw > 0 ? (
          /* Mode carrousel infini (translateX en px) — actif dès que la largeur est mesurée */
          <div
            className="flex"
            style={{
              gap: GAP,
              transform: `translateX(-${tx}px)`,
              transition: moving ? "transform 0.4s cubic-bezier(0.4,0,0.2,1)" : "none",
              willChange: "transform",
            }}
          >
            {clones.map((pro, i) => (
              <div key={`${tabKey}-${i}`} style={{ width: cw, flexShrink: 0 }} className="h-full flex">
                <ProfessionalCard pro={pro} hideGoldRing />
              </div>
            ))}
          </div>
        ) : (
          /* Mode immédiat — affichage instantané en CSS pur (flex-basis %),
             sans attendre la mesure JS du conteneur. Évite tout écran vide
             au premier chargement de la page. Bascule automatique vers le
             mode carrousel dès que `cw` est mesuré (voir useEffect ci-dessus). */
          <div className="flex" style={{ gap: GAP }}>
            {pros.slice(0, visible).map((pro, i) => (
              <div key={`${tabKey}-fallback-${i}`} style={{ flex: `0 0 calc((100% - ${GAP * (visible - 1)}px) / ${visible})` }} className="h-full flex">
                <ProfessionalCard pro={pro} hideGoldRing />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Arrows — masquées s'il n'y a pas assez de fiches pour justifier un défilement */}
      {needsLoop && (
        <>
          <button onClick={prev}
            className="absolute -left-2 sm:-left-5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-white border border-gray-200 hover:bg-landes-forest hover:text-white hover:border-landes-forest text-gray-600 rounded-full flex items-center justify-center shadow-md transition-all">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button onClick={next}
            className="absolute -right-2 sm:-right-5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-white border border-gray-200 hover:bg-landes-forest hover:text-white hover:border-landes-forest text-gray-600 rounded-full flex items-center justify-center shadow-md transition-all">
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {pros.map((_, i) => (
          <button key={i}
            onClick={() => { if (!moving && i !== pos) step(i > pos ? 1 : -1); }}
            className={`h-2 rounded-full transition-all duration-300 ${i === pos ? "w-8 bg-landes-forest" : "w-2 bg-gray-300 hover:bg-landes-sage"}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      {!paused && (
        <div className="h-1 bg-gray-100 rounded-full mt-3 overflow-hidden">
          <div key={`${tabKey}-${pos}`} className="h-full bg-landes-forest origin-left rounded-full"
            style={{ animation: "featProg 3.5s linear forwards" }} />
        </div>
      )}
      <style jsx>{`@keyframes featProg{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
    </div>
  );
}

// ── Section principale ─────────────────────────────────────────
export default function FeaturedProfessionals() {
  const [activeTab, setActiveTab] = useState(0);
  const [mergedTabs, setMergedTabs] = useState<FeaturedTab[]>(FEATURED_TABS);
  const [loaded, setLoaded] = useState(false);

  // Charge uniquement les vrais professionnels Gold actifs — plus aucune
  // donnée de démonstration en repli.
  useEffect(() => {
    (async () => {
      const realPros = (await getProfessionalsWithImages()).filter(p => p.status === "active" && p.plan === "gold");

      const updated = FEATURED_TABS.map(tab => ({
        ...tab,
        pros: realPros.filter(p => p.category === tab.category),
      }));

      setMergedTabs(updated);
      setLoaded(true);
    })();
  }, [activeTab]); // recharge à chaque changement d'onglet

  // N'affiche la section que s'il existe au moins un vrai professionnel
  // Gold à mettre en avant, sur au moins une catégorie.
  const hasAnyRealPro = mergedTabs.some(tab => tab.pros.length > 0);
  if (loaded && !hasAnyRealPro) return null;

  return (
    <section className="bg-white py-10 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold text-landes-sage uppercase tracking-wider mb-1">Sélection</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-landes-pine">Professionnels à la une</h2>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 sm:flex-wrap sm:overflow-visible mb-8 sm:mb-10 -mx-4 px-4 sm:mx-0 sm:px-0">
          {mergedTabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 flex-shrink-0 whitespace-nowrap ${
                activeTab === i
                  ? "bg-landes-forest text-white border-landes-forest shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-landes-sage hover:text-landes-forest"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Carrousel */}
        <div className="px-3 sm:px-6">
          {mergedTabs[activeTab].pros.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">
              Aucun professionnel Gold à la une pour le moment dans cette catégorie.
            </p>
          ) : (
            <ProCarousel key={activeTab} pros={mergedTabs[activeTab].pros} tabKey={activeTab} />
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link
            href={`/annuaire?category=${encodeURIComponent(mergedTabs[activeTab].category)}`}
            className="inline-flex items-center gap-2 btn-secondary py-3 px-8"
          >
            Voir tous en {mergedTabs[activeTab].label} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
