import { PlanType } from "@/types";

interface PlanBadgeProps {
  plan: PlanType;
  size?: "sm" | "md";
}

const PLAN_CONFIG = {
  standard: { label: "Standard", className: "bg-blue-100 text-blue-700 border border-blue-200" },
  premium: { label: "Premium", className: "bg-purple-100 text-purple-700 border border-purple-200" },
  gold: { label: "⭐ Gold", className: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
};

export default function PlanBadge({ plan, size = "sm" }: PlanBadgeProps) {
  // Repli défensif : une valeur de formule invalide (donnée corrompue, ex:
  // import CSV mal aligné) ne doit jamais faire planter toute la page.
  const config = PLAN_CONFIG[plan] ?? { label: plan || "Inconnu", className: "bg-gray-100 text-gray-600 border border-gray-200" };
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.className} ${sizeClass}`}>
      {config.label}
    </span>
  );
}
