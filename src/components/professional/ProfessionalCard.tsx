"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Professional } from "@/types";
import { MapPin, Phone, Mail, ArrowRight, Award } from "lucide-react";
import StarDisplay from "@/components/ui/StarDisplay";
import { getProRating } from "@/lib/reviewUtils";
import { getBanner } from "@/lib/defaultBanners";
import { rehydrateAsync } from "@/lib/storage";
import { buildProfileUrl } from "@/lib/profileUrl";

interface ProfessionalCardProps {
  pro: Professional;
  hideGoldRing?: boolean;
}

export default function ProfessionalCard({ pro: propPro, hideGoldRing = false }: ProfessionalCardProps) {
  const [pro, setPro] = useState<Professional>(propPro);
  const initials = pro.companyName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const [rating, setRating] = useState<{ avg: number; count: number } | null>(null);
  const bannerSrc = getBanner(pro.banner, pro.category);

  useEffect(() => {
    setRating(getProRating(pro.id));
  }, [pro.id]);

  // Charge le logo et la bannière depuis IndexedDB si absents
  useEffect(() => {
    if (!propPro.logo && !propPro.banner && !propPro.photos?.length) {
      rehydrateAsync(propPro).then(full => {
        if (full.logo || full.banner || full.photos?.length) setPro(full);
      });
    }
  }, [propPro.id]);

  return (
    <Link
      href={buildProfileUrl(pro)}
      className={`card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col group overflow-hidden ${
        pro.plan === "gold" && !hideGoldRing ? "ring-2 ring-amber-400/70" : ""
      }`}
    >
      {/* Bannière + logo à cheval */}
      <div className="w-full h-32 relative flex-shrink-0">
        {bannerSrc
          ? <img src={bannerSrc} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-landes-pine via-landes-forest to-landes-ocean" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Badge Recommandé (Gold) */}
        {pro.plan === "gold" && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-bold text-white bg-gradient-to-r from-amber-500 to-yellow-500 border border-amber-300 px-2 py-0.5 rounded-full shadow-sm">
            <Award className="w-3 h-3" /> Recommandé
          </span>
        )}

        {/* Logo positionné à cheval sur la bannière et le contenu */}
        <div className="absolute -bottom-7 left-5">
          {pro.logo ? (
            <img
              src={pro.logo}
              alt={`Logo ${pro.companyName}`}
              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="w-14 h-14 bg-gradient-to-br from-landes-forest to-landes-sage rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-md">
              {initials}
            </div>
          )}
        </div>
      </div>

      {/* Contenu — pt-10 pour laisser la place au logo + espace */}
      <div className="px-5 pt-10 pb-5 flex-1 flex flex-col">
        <div className="flex items-start gap-4">

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-landes-pine text-base truncate group-hover:text-landes-forest transition-colors">
            {pro.companyName}
          </h3>

          {/* Catégorie + étoiles sur la même ligne */}
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <p className="text-sm text-landes-sage font-medium">{pro.subcategory || pro.category}</p>
            {rating && rating.avg > 0 && (
              <StarDisplay rating={rating.avg} count={rating.count} size="xs" />
            )}
          </div>

          {/* Services — même style que la fiche professionnelle, sur une seule ligne */}
          {pro.services && pro.services.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 overflow-hidden">
              {pro.services.slice(0, 3).map((svc, i) => {
                const styles = ["bg-landes-forest text-white","bg-landes-sage text-white","bg-amber-500 text-white"];
                return <span key={i} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${styles[i % styles.length]}`}>{svc}</span>;
              })}
              {pro.services.length > 3 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 whitespace-nowrap flex-shrink-0">+{pro.services.length - 3}</span>
              )}
            </div>
          )}

          {pro.description && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2" dangerouslySetInnerHTML={{ __html: pro.description.replace(/<[^>]*>/g, " ").trim() }} />
          )}
        </div>
      </div>

      {/* Localisation + contact — toujours positionné en bas de la card,
          même quand il n'y a pas de description (mt-auto absorbe l'espace
          restant, pour un alignement homogène entre cards d'une même
          grille quelle que soit la longueur du contenu au-dessus). */}
      <div className="pt-3 border-t border-gray-100 mt-auto">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="w-5 h-5 bg-landes-forest/10 rounded flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3 h-3 text-landes-forest" />
            </div>
            <span className="text-xs font-semibold text-landes-pine truncate">{pro.city}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          {pro.phone && (
            <a
              href={`tel:${pro.phone}`}
              onClick={e => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1.5 bg-landes-forest text-white text-xs font-semibold py-2 rounded-lg hover:bg-landes-pine transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> Appeler
            </a>
          )}
          {pro.email && (
            <a
              href={`mailto:${pro.email}`}
              onClick={e => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1.5 bg-landes-ocean/10 text-landes-ocean text-xs font-semibold py-2 rounded-lg hover:bg-landes-ocean/20 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" /> Email
            </a>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end">
        <span className="text-xs text-landes-forest font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Voir la fiche <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
      </div>
    </Link>
  );
}
