"use client";
import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LogOut, Edit3, CheckCircle, Clock, Save, Loader2, Eye, EyeOff,
  Calendar, Trash2, CalendarCheck, CalendarX, Settings, Ban, Plus, X,
  ImagePlus, Images, Star, Shield, Info, CreditCard, RefreshCw,
} from "lucide-react";
import {
  getSession, clearSession, getProfessionalById, saveProfessional, rehydrateAsync,
  generateId, getReviewsByPro, saveReview, deleteProfessional, mirrorProfessionalToDb,
} from "@/lib/storage";
import { Professional, CATEGORIES, SUBCATEGORIES, LANDES_CITIES, PLANS, OpeningHours, Review } from "@/types";
import { buildProfileUrl } from "@/lib/profileUrl";
import PlanBadge from "@/components/ui/PlanBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import OpeningHoursEditor from "@/components/ui/OpeningHoursEditor";
import RichTextEditor from "@/components/ui/RichTextEditor";
import BannerCropper from "@/components/ui/BannerCropper";
import SubscriptionManager, { type SubscriptionManagerHandle } from "@/components/professional/SubscriptionManager";
import ComplementaryOptionsManager from "@/components/professional/ComplementaryOptionsManager";
import StripePaymentForm from "@/components/professional/StripePaymentForm";
import { getBanner } from "@/lib/defaultBanners";
import { REQUIRE_VALIDATION } from "@/lib/config";
import StatsTab from "@/app/dashboard/StatsTab";
import FacturationTab from "@/app/dashboard/FacturationTab";
import CrmTab from "@/app/dashboard/CrmTab";
import RevenueTab from "@/app/dashboard/RevenueTab";
import Link from "next/link";

const MAX_PHOTOS = 5;

const DEFAULT_HOURS: OpeningHours = {
  monday:    { open: "09:00", close: "18:00", closed: false },
  tuesday:   { open: "09:00", close: "18:00", closed: false },
  wednesday: { open: "09:00", close: "18:00", closed: false },
  thursday:  { open: "09:00", close: "18:00", closed: false },
  friday:    { open: "09:00", close: "18:00", closed: false },
  saturday:  { open: "09:00", close: "13:00", closed: false },
  sunday:    { open: "",      close: "",      closed: true  },
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const welcome = searchParams.get("welcome");

  const [pro, setPro]         = useState<Professional | null>(null);
  const [editing, setEditing] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [savedSection,  setSavedSection]  = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [activeTab, setActiveTab] = useState<"fiche" | "photos" | "horaires" | "avis" | "stats" | "info-facturation" | "facturation" | "clients" | "revenue" | "plan" | "subscriptions">("fiche");
  const [photos, setPhotos] = useState<string[]>([]);
  const [proReviews, setProReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsLoadError, setReviewsLoadError] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [confirmAction, setConfirmAction] = useState<"suspend" | "delete" | null>(null);
  const [planChanging, setPlanChanging] = useState(false);
  const [planOrderTarget, setPlanOrderTarget] = useState<string | null>(null);
  const [planOrderClientSecret, setPlanOrderClientSecret] = useState<string | null>(null);
  const [planOrderCustomerId, setPlanOrderCustomerId] = useState<string | null>(null);
  const [planOrderPreparing, setPlanOrderPreparing] = useState(false);
  const [planOrderFinalizing, setPlanOrderFinalizing] = useState(false);
  const [planOrderDone, setPlanOrderDone] = useState(false);
  const [downgrading, setDowngrading] = useState(false);
  const subscriptionManagerRef = useRef<SubscriptionManagerHandle>(null);
  const [autoEditProfile, setAutoEditProfile] = useState(false);
  const [photoSaved, setPhotoSaved] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // New blocked date form
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockForm, setBlockForm] = useState({
    date: "", allDay: true, startTime: "09:00", endTime: "12:00", reason: "Congés",
  });
  const [form, setForm]       = useState<Partial<Professional>>({});
  const [hours, setHours]     = useState<OpeningHours>(DEFAULT_HOURS);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session || session.type !== "pro" || !session.id) { router.push("/connexion"); return; }

    let cancelled = false;

    // ── Étape 5 de la migration base de données ──
    // Charge en priorité depuis la base (accessible depuis n'importe quel
    // appareil/navigateur), avec repli automatique et silencieux sur
    // localStorage si la base est indisponible, non configurée, ou si
    // cette fiche n'y a pas encore été migrée. Un état d'erreur dédié ne
    // s'affiche que si AUCUNE des deux sources ne renvoie de données.
    const loadPro = async () => {
      setLoadError(false);
      let data: Professional | null = null;

      try {
        const res = await fetch(`/api/db/professionals/${session.id}`);
        if (res.ok) {
          const json = await res.json();
          data = json.professional || null;
        }
      } catch {
        // Réseau indisponible ou base non configurée : repli silencieux ci-dessous
      }

      if (!data) data = getProfessionalById(session.id);
      if (cancelled) return;

      if (!data) {
        // Rien trouvé ni en base ni en local : peut être une vraie erreur
        // réseau plutôt qu'un compte inexistant — on affiche un message
        // avec possibilité de réessayer, plutôt que de rediriger en silence.
        setLoadError(true);
        return;
      }

      setPro(data);
      setForm(data);
      setHours(data.openingHours || DEFAULT_HOURS);
      setPhotos(data.photos || []);
      loadReviews(data.id);
      // Charge les images depuis IndexedDB (complète les données si besoin)
      rehydrateAsync(data).then(full => {
        if (cancelled) return;
        setPro(full);
        setForm(full);
        setPhotos(full.photos || []);
        // Synchronise systématiquement vers la base à chaque connexion (couvre
        // les sessions où le professionnel consulte sans rien modifier).
        mirrorProfessionalToDb(full);
      });
    };

    loadPro();
    return () => { cancelled = true; };
  }, [router]);

  // ── Étape 5 de la migration base de données ──
  // Charge en priorité depuis la base (avis accessibles depuis n'importe
  // quel appareil), avec repli automatique et silencieux sur localStorage
  // si la base est indisponible ou pas encore alimentée pour ce
  // professionnel. Réutilisable (chargement initial + après réponse à un avis).
  const loadReviews = async (proId: string) => {
    setReviewsLoading(true);
    setReviewsLoadError(false);

    let reviews: Review[] | null = null;
    try {
      const res = await fetch(`/api/db/reviews?proId=${encodeURIComponent(proId)}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.reviews) && json.reviews.length > 0) reviews = json.reviews;
      }
    } catch {
      // Réseau indisponible ou base non configurée : repli silencieux ci-dessous
    }

    if (!reviews) {
      try {
        reviews = getReviewsByPro(proId);
      } catch {
        setReviewsLoadError(true);
        setReviewsLoading(false);
        return;
      }
    }

    setProReviews(reviews);
    setReviewsLoading(false);
  };

  const handleLogout = () => { clearSession(); router.push("/"); };
  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  // Commande d'une formule payante : redirige vers un paiement Stripe intégré
  // (jamais un simple changement local pour une formule payante).
  const startPlanOrder = async (planId: string) => {
    if (!pro) return;
    setPlanOrderTarget(planId);
    setPlanOrderPreparing(true);
    setPlanOrderClientSecret(null);
    setPlanOrderDone(false);
    try {
      const res = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          optionIds: [],
          email: pro.email,
          companyName: pro.companyName,
          siren: pro.siren,
        }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setPlanOrderClientSecret(data.clientSecret);
        setPlanOrderCustomerId(data.customerId);
      } else {
        alert(data.error || "Erreur lors de la préparation du paiement.");
        setPlanOrderTarget(null);
      }
    } catch {
      alert("Erreur réseau lors de la préparation du paiement.");
      setPlanOrderTarget(null);
    } finally {
      setPlanOrderPreparing(false);
    }
  };

  const handlePlanOrderSuccess = async (paymentMethodId?: string) => {
    if (!pro || !planOrderCustomerId || !paymentMethodId || !planOrderTarget) {
      alert("Impossible de finaliser le paiement (informations manquantes).");
      return;
    }
    setPlanOrderFinalizing(true);
    try {
      const res = await fetch("/api/subscriptions/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: planOrderCustomerId,
          paymentMethodId,
          planId: planOrderTarget, // jamais d'optionIds ici : la formule est un produit à part
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.error || "Erreur lors de la finalisation du paiement.");
        return;
      }
      const updated = {
        ...pro,
        plan: planOrderTarget as any,
        stripeCustomerId: (pro as any).stripeCustomerId || planOrderCustomerId,
        updatedAt: new Date().toISOString(),
      };
      saveProfessional(updated);
      setPro(updated);
      setPlanOrderDone(true);
    } catch {
      alert("Erreur réseau lors de la finalisation du paiement.");
    } finally {
      setPlanOrderFinalizing(false);
    }
  };

  const closePlanOrderModal = () => {
    setPlanOrderTarget(null);
    setPlanOrderClientSecret(null);
    setPlanOrderCustomerId(null);
    setPlanOrderDone(false);
  };

  // Rétrogradation différée : Gold → Premium ou Premium → Standard.
  // La formule actuelle continue jusqu'à sa date de renouvellement ; le
  // changement effectif (et le premier prélèvement de la nouvelle formule,
  // le cas échéant) n'intervient que le lendemain de cette date.
  const handleDowngrade = async (targetPlanId: string) => {
    if (!pro) return;
    const customerId = (pro as any).stripeCustomerId;
    if (!customerId) {
      alert("Aucun compte de facturation associé à votre fiche.");
      return;
    }
    if (!confirm(
      targetPlanId === "standard"
        ? "Votre formule Premium restera active jusqu'à sa date de renouvellement. Vous basculerez ensuite automatiquement en formule Gratuite le lendemain. Confirmer ?"
        : "Votre formule Gold restera active jusqu'à sa date de renouvellement. Votre formule Premium débutera ensuite automatiquement le lendemain (premier prélèvement à cette date). Confirmer ?"
    )) return;

    setDowngrading(true);
    try {
      const res = await fetch("/api/subscriptions/downgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, targetPlanId }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.error || "Erreur lors de la programmation du changement de formule.");
        return;
      }
      const updated = {
        ...pro,
        pendingPlanChange: {
          targetPlan: targetPlanId,
          effectiveDate: data.effectiveDate,
          newSubscriptionId: data.newSubscriptionId,
        },
        updatedAt: new Date().toISOString(),
      } as any;
      saveProfessional(updated);
      setPro(updated);
    } catch {
      alert("Erreur réseau lors de la programmation du changement de formule.");
    } finally {
      setDowngrading(false);
    }
  };

  // Applique automatiquement un changement de formule différé dont la date
  // effective est atteinte (vérifié à chaque chargement du tableau de bord).
  useEffect(() => {
    if (!pro || !(pro as any).pendingPlanChange) return;
    const pending = (pro as any).pendingPlanChange;
    if (new Date(pending.effectiveDate).getTime() <= Date.now()) {
      const updated = {
        ...pro,
        plan: pending.targetPlan,
        pendingPlanChange: undefined,
        updatedAt: new Date().toISOString(),
      } as any;
      saveProfessional(updated);
      setPro(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pro?.id]);

  const handleSaveFiche = async () => {
    if (!pro) return;
    setSaving(true);

    let lat = pro.lat;
    let lng = pro.lng;
    const addressChanged =
      form.address !== pro.address ||
      form.city    !== pro.city    ||
      form.postalCode !== pro.postalCode;
    if (addressChanged && form.address && form.city && form.postalCode) {
      try {
        const { geocodeAddress } = await import("@/lib/geocode");
        const coords = await geocodeAddress(
          form.address as string,
          form.city as string,
          form.postalCode as string
        );
        if (coords) { lat = coords.lat; lng = coords.lng; }
      } catch { /* optionnel */ }
    }

    const updated = { ...pro, ...form, lat, lng, updatedAt: new Date().toISOString() };
    saveProfessional(updated);
    setPro(updated);
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Save a specific section
  const handleSaveSection = async (section: string, cancelFn: () => void) => {
    if (!pro) return;
    setSavingSection(section);

    let lat = pro.lat;
    let lng = pro.lng;
    if (section === "coords") {
      const addressChanged =
        form.address !== pro.address ||
        form.city    !== pro.city    ||
        form.postalCode !== pro.postalCode;
      if (addressChanged && form.address && form.city && form.postalCode) {
        try {
          const { geocodeAddress } = await import("@/lib/geocode");
          const coords = await geocodeAddress(
            form.address as string,
            form.city as string,
            form.postalCode as string
          );
          if (coords) { lat = coords.lat; lng = coords.lng; }
        } catch { /* optionnel */ }
      }
    }

    const updated = { ...pro, ...form, lat, lng, updatedAt: new Date().toISOString() };
    saveProfessional(updated);
    setPro(updated);
    setSavingSection(null);
    setSavedSection(section);
    cancelFn();
    setTimeout(() => setSavedSection(null), 3000);
  };

  const handleSaveHours = async () => {
    if (!pro) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    const updated = { ...pro, openingHours: hours, updatedAt: new Date().toISOString() };
    saveProfessional(updated);
    setPro(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveAgenda = () => {
    if (!pro) return;
    const updated = {
      ...pro,
      agendaSlotDuration: agendaForm.agendaSlotDuration,
      agendaStartTime:    agendaForm.agendaStartTime,
      agendaEndTime:      agendaForm.agendaEndTime,
      agendaDays:         agendaForm.agendaDays,
      agendaMessage:      agendaForm.agendaMessage,
      updatedAt: new Date().toISOString(),
    };
    saveProfessional(updated);
    setPro(updated);
    setAgendaSaved(true);
    setTimeout(() => setAgendaSaved(false), 3000);
  };

  const handleSavePhotos = (newPhotos: string[]) => {
    if (!pro) return;
    const updated = { ...pro, photos: newPhotos, updatedAt: new Date().toISOString() };
    saveProfessional(updated);
    setPro(updated);
    setPhotos(newPhotos);
    setPhotoSaved(true);
    setTimeout(() => setPhotoSaved(false), 2500);
  };

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - photos.length;
    const toProcess = files.slice(0, remaining);
    const results = await Promise.all(
      toProcess.map(f => new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = ev => res(ev.target!.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(f);
      }))
    );
    handleSavePhotos([...photos, ...results]);
    e.target.value = "";
  };

  const handleRemovePhoto = (idx: number) => {
    handleSavePhotos(photos.filter((_, i) => i !== idx));
  };

  const handleMovePhoto = (idx: number, dir: -1 | 1) => {
    const arr = [...photos];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    handleSavePhotos(arr);
  };

  if (loadError) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
      <p className="text-lg font-bold text-landes-pine">Impossible de charger votre tableau de bord</p>
      <p className="text-sm text-gray-500 max-w-sm">
        Vérifiez votre connexion internet et réessayez. Si le problème persiste, reconnectez-vous.
      </p>
      <button onClick={() => window.location.reload()} className="btn-primary flex items-center gap-2">
        <Loader2 className="w-4 h-4" /> Réessayer
      </button>
    </div>
  );

  if (!pro) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-landes-forest" />
    </div>
  );

  const currentPlan = PLANS.find(p => p.id === pro.plan);
  // Une fois la fiche validée (statut actif), les identifiants légaux
  // (SIREN, SIRET, forme juridique, catégorie, sous-catégorie) ne sont
  // plus modifiables directement par le professionnel.
  const ficheLocked = pro.status === "active";

  return (
    <div className="w-[90%] mx-auto px-4 sm:px-6 py-8">

      {/* Banners */}
      {welcome && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800">Inscription réussie !</p>
            {REQUIRE_VALIDATION
              ? <p className="text-sm text-green-600">Votre fiche est en attente de validation par notre équipe. Vous serez notifié sous 24h.</p>
              : <p className="text-sm text-green-600">Votre fiche est désormais active et visible dans l'annuaire. Vous pouvez la compléter dès maintenant.</p>
            }
          </div>
        </div>
      )}
      {/* Bannière validation en attente — uniquement si la validation manuelle est activée */}
      {pro.status === "pending" && !welcome && REQUIRE_VALIDATION && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Clock className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-800">Votre fiche est en cours de validation</p>
            <p className="text-sm text-orange-700 mt-0.5">
              Elle apparaîtra dans l'annuaire et dans la catégorie <strong>{pro.category}</strong> dès qu'elle sera approuvée par notre équipe (sous 24h à 48h).
              Vous pouvez dès à présent compléter et modifier votre fiche.
            </p>
          </div>
        </div>
      )}
      {/* Bannière modifications sauvegardées */}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-700 font-medium">Modifications enregistrées avec succès</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-landes-pine">Mon espace professionnel</h1>
          <p className="text-gray-500">Bonjour, {pro.firstName} {pro.lastName}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors text-sm">
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-2">Statut du compte</p>
          <StatusBadge status={pro.status} />
          {pro.status === "pending" && REQUIRE_VALIDATION && <p className="text-xs text-orange-500 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" />Validation en cours</p>}
          {pro.status === "active"  && <p className="text-xs text-green-500 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Visible dans l&apos;annuaire</p>}
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-2">Formule actuelle</p>
          <PlanBadge plan={pro.plan} size="md" />
          <p className="text-xs text-gray-400 mt-2">{currentPlan?.price}€/mois</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-2">Membre depuis</p>
          <p className="font-semibold text-gray-800">{new Date(pro.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
          {pro.validatedAt && <p className="text-xs text-gray-400 mt-1">Validé le {new Date(pro.validatedAt).toLocaleDateString("fr-FR")}</p>}
        </div>
      </div>

      {/* Layout 2 colonnes : nav gauche + contenu droite */}
      <div className="flex gap-6 items-start">

        {/* ── Colonne nav gauche ── */}
        <div className="w-64 flex-shrink-0 sticky top-6 self-start">
          <div className="card overflow-hidden">
            {/* Boutons voir ma page / modifier */}
            <div className="p-3 space-y-1.5 border-b border-gray-100">
              {pro.status === "active" && (
                <Link href={buildProfileUrl(pro)} className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-semibold text-landes-forest hover:bg-landes-forest/5 transition-colors">
                  <Eye className="w-4 h-4 flex-shrink-0" /> Voir ma page
                </Link>
              )}
              {activeTab === "fiche" && (
                <button
                  onClick={() => { setEditing(!editing); setForm(pro); }}
                  className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${editing ? "text-gray-600 hover:bg-gray-50" : "text-landes-forest hover:bg-landes-forest/5"}`}>
                  <Edit3 className="w-4 h-4 flex-shrink-0" /> {editing ? "Annuler" : "Modifier ma fiche"}
                </button>
              )}
            </div>

            {/* Onglets verticaux */}
            <nav className="p-2 space-y-0.5">
              {([
                { id: "fiche",            label: "Ma fiche",              emoji: "📋", editable: true,  plans: ["standard","premium","gold"] },
                { id: "photos",           label: `Photos${photos.length > 0 ? ` (${photos.length})` : ""}`, emoji: "📷", editable: true, plans: ["premium","gold"] },
                { id: "horaires",         label: "Horaires",              emoji: "🕐", editable: true,  plans: ["premium","gold"] },
                { id: "info-facturation", label: "Infos facturation",     emoji: "🏢", editable: true,  plans: ["gold"] },
                { id: "facturation",      label: "Devis / Facture",       emoji: "🧾", editable: false, plans: ["gold"] },
                { id: "clients",          label: "Prospects / Clients",   emoji: "👥", editable: false, plans: ["gold"] },
                { id: "revenue",          label: "Chiffre d'affaires",    emoji: "📈", editable: false, plans: ["gold"] },
                { id: "stats",            label: "Statistiques",          emoji: "📊", editable: false, plans: ["gold"] },
                { id: "avis",             label: "Avis clients",          emoji: "⭐", editable: false, plans: ["premium","gold"] },
                { id: "plan",             label: "Formule",               emoji: "✨", editable: false, plans: ["standard","premium","gold"] },
                { id: "subscriptions",    label: "Mes abonnements",       emoji: "💳", editable: false, plans: ["standard","premium","gold"] },
              ] as const).filter(tab => tab.plans.includes(pro.plan)).map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <div key={tab.id} className="flex items-center gap-1 group/nav">
                    <button onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center gap-3 px-3 py-3 rounded-xl font-semibold transition-all text-left ${
                        isActive
                          ? "bg-landes-forest text-white shadow-sm"
                          : "text-gray-700 hover:bg-landes-forest/8 hover:text-landes-forest"
                      }`}>
                      <span className="text-lg leading-none flex-shrink-0">{tab.emoji}</span>
                      <span className="leading-snug text-sm">{tab.label}</span>
                    </button>
                    {tab.editable && (
                      <button
                        title={`Modifier ${tab.label}`}
                        onClick={() => {
                          setActiveTab(tab.id);
                          if (tab.id === "fiche") { setEditing(true); setForm(pro); }
                          if (tab.id === "info-facturation") { setAutoEditProfile(true); }
                        }}
                        className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                          isActive
                            ? "text-white/80 hover:text-white hover:bg-white/20"
                            : "text-gray-400 hover:text-landes-forest hover:bg-landes-forest/10 opacity-0 group-hover/nav:opacity-100"
                        }`}>
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Séparateur + info formule */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400 mb-1">Formule active</p>
              <PlanBadge plan={pro.plan} size="sm" />
            </div>
          </div>
        </div>

        {/* ── Zone contenu droite ── */}
        <div className="flex-1 min-w-0">

      {/* ── TAB FICHE ── */}
      {activeTab === "fiche" && (
        <div className="card p-8 space-y-6">

          {/* Logo + Banner — visible only in edit mode */}
          {editing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-4 border-b border-gray-100">
              <div>
                <label className="label">Logo de l&apos;entreprise</label>
                <div className="flex items-center gap-4 mt-1">
                  <div className="w-20 h-20 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center">
                    {form.logo
                      ? <img src={form.logo as string} alt="Logo" className="w-full h-full object-cover" />
                      : <span className="text-2xl font-bold text-gray-300">{pro.companyName[0]}</span>
                    }
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="btn-secondary text-sm py-2 px-4 cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={async e => {
                        const f = e.target.files?.[0]; if (!f) return;
                        const { compressLogo } = await import("@/lib/imageUtils");
                        const compressed = await compressLogo(f);
                        update("logo", compressed);
                        e.target.value = "";
                      }} />
                      Changer le logo
                    </label>
                    {form.logo && (
                      <button type="button" onClick={() => update("logo", "")} className="text-xs text-red-500 hover:text-red-700">
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Bannière (image de couverture)</label>
                <p className="text-xs text-gray-400 mb-2">Dimensions recommandées : <span className="font-medium text-gray-500">1 400 × 467 px</span> · Format paysage · JPG ou PNG</p>
                <div className="mt-1 space-y-2">
                  {/* Ratio identique à l'affichage réel en front-office
                      (fiche publique : bannière pleine largeur, h-44/h-56 —
                      soit environ 2.8:1) et au cadre de recadrage
                      (BannerCropper, 1400×500), pour un aperçu fidèle. */}
                  <div className="aspect-[2.8/1] w-full rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                    {(() => {
                      const src = getBanner(form.banner as string | undefined, pro.category);
                      return src
                        ? <img src={src} alt="Bannière" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gradient-to-br from-landes-pine to-landes-forest opacity-60 flex items-center justify-center">
                            <span className="text-white text-xs opacity-60">Bannière par défaut</span>
                          </div>;
                    })()}
                  </div>
                  <div className="flex gap-2">
                    <label className="btn-secondary text-sm py-1.5 px-3 cursor-pointer flex-1 text-center">
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const f = e.target.files?.[0]; if (!f) return;
                        setCropFile(f);
                        e.target.value = "";
                      }} />
                      Changer
                    </label>
                    {form.banner && (
                      <button type="button" onClick={() => update("banner", "")} className="text-xs text-red-500 hover:text-red-700 px-2">
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* ── Identification ── */}
            <div className="sm:col-span-2">
              <h3 className="text-xl font-bold text-landes-pine bg-landes-forest/8 border-l-4 border-landes-forest px-4 py-3 rounded-r-lg mb-4">
                Identification
              </h3>
            </div>
            <div>
              <label className="label">Nom de l&apos;entreprise</label>
              {editing
                ? <input value={form.companyName || ""} onChange={e => update("companyName", e.target.value)} className="input-field" />
                : <p className="text-gray-900 font-semibold text-base">{pro.companyName}</p>}
            </div>
            <div>
              <label className="label">SIREN</label>
              <p className="text-gray-900 font-mono font-semibold">{pro.siren.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")}</p>
              <span className="inline-block mt-1 text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Non modifiable</span>
            </div>
            {(pro as any).siret && (
              <div>
                <label className="label">SIRET</label>
                <p className="text-gray-900 font-mono font-semibold">{(pro as any).siret}</p>
                <span className="inline-block mt-1 text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Non modifiable</span>
              </div>
            )}
            <div>
              <label className="label">Forme juridique</label>
              {editing && !ficheLocked
                ? <select value={form.legalForm || ""} onChange={e => update("legalForm", e.target.value)} className="input-field">
                    {["Auto-entrepreneur","EI","EURL","SARL","SAS","SASU","SA","SCP","SELARL","SNC","SCI","Association","Autre"].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                : <>
                    <p className="text-gray-900 font-medium">{pro.legalForm}</p>
                    {editing && ficheLocked && <span className="inline-block mt-1 text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Non modifiable</span>}
                  </>}
            </div>
            <div>
              <label className="label">Catégorie</label>
              {editing && !ficheLocked
                ? <select value={form.category || ""} onChange={e => { update("category", e.target.value); update("subcategory", ""); }} className="input-field">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                : <>
                    <p className="text-gray-900 font-medium">{pro.category}</p>
                    {editing && ficheLocked && <span className="inline-block mt-1 text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Non modifiable</span>}
                  </>}
            </div>

            {SUBCATEGORIES[((editing && !ficheLocked) ? form.category : pro.category) as string] && (
              <div>
                <label className="label">Sous-catégorie <span className="text-gray-400 font-normal text-xs">(facultatif)</span></label>
                {editing && !ficheLocked
                  ? <select value={(form.subcategory as string) || ""} onChange={e => update("subcategory", e.target.value)} className="input-field">
                      <option value="">Sélectionner…</option>
                      {SUBCATEGORIES[form.category as string].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  : <>
                      <p className="text-gray-900 font-medium">{(pro as any).subcategory || <span className="text-gray-400 italic text-sm">Non renseigné</span>}</p>
                      {editing && ficheLocked && <span className="inline-block mt-1 text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Non modifiable</span>}
                    </>}
              </div>
            )}

            {/* ── Description ── */}
            <div className="sm:col-span-2 pt-2">
              <h3 className="text-xl font-bold text-landes-pine bg-landes-forest/8 border-l-4 border-landes-forest px-4 py-3 rounded-r-lg mb-4">
                Présentation de l&apos;activité
              </h3>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Titre de l&apos;activité <span className="text-gray-400 font-normal text-xs">(affiché en H1 sur votre fiche)</span></label>
              {editing
                ? <input value={(form.activityTitle as string) || ""} onChange={e => update("activityTitle", e.target.value)} className="input-field" placeholder="Ex : Boulangerie artisanale bio à Mont-de-Marsan, Dépannage informatique à domicile dans les Landes…" maxLength={250} />
                : <p className="text-gray-900 font-medium">{(pro as any).activityTitle || <span className="text-gray-400 italic text-sm">Non renseigné</span>}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label flex items-center gap-1.5">
                Description courte
                <span className="text-gray-400 font-normal text-xs">(150 max.)</span>
                <span className="group relative inline-flex">
                  <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                  <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 rounded-lg bg-gray-800 text-white text-xs px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-center">
                    La description courte est utilisée pour le référencement naturel de votre fiche professionnelle sur les moteurs de recherche. Il faut éviter de la modifier.
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                  </span>
                </span>
              </label>
              {editing
                ? <>
                    <textarea
                      value={(form.shortDescription as string) || ""}
                      onChange={e => update("shortDescription", e.target.value)}
                      className="input-field resize-none"
                      rows={2}
                      maxLength={150}
                      placeholder="Une phrase d'accroche affichée dans les résultats de recherche et les cartes professionnelles…"
                    />
                    <p className="text-xs text-gray-400 mt-1">{((form.shortDescription as string) || "").length}/150</p>
                  </>
                : <p className="text-gray-900">{(pro as any).shortDescription || <span className="text-gray-400 italic text-sm">Non renseigné</span>}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description <span className="text-gray-400 font-normal text-xs">(500 min. · 2 500 max.)</span></label>
              {editing
                ? <>
                    <div className="mb-2 border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setSeoOpen(o => !o)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <span className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                          📋 Modèle de description optimisée SEO
                        </span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${seoOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                      {seoOpen && (
                        <div className="px-4 py-4 bg-white border-t border-gray-100 text-xs text-gray-500 space-y-3 leading-relaxed">
                          <div>
                            <p className="font-bold text-gray-700 mb-1">H2 — Titre principal optimisé pour le référencement naturel</p>
                            <p>Présentez ici votre activité principale avec vos mots-clés (ville, métier, spécialité). Ex : <em>Boulangerie artisanale bio à Mont-de-Marsan — pains, viennoiseries et pâtisseries maison.</em></p>
                            <p className="mt-1">Décrivez ce qui vous distingue, votre histoire, vos méthodes de travail, votre engagement qualité.</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-700 mb-1">H3 — Sous-titre optimisé pour les moteurs de recherche</p>
                            <p>Listez vos services, produits ou prestations. Indiquez vos zones d'intervention, vos horaires, vos certifications.</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-700 mb-1">H2 — Deuxième section avec contenu riche</p>
                            <p>Ajoutez une section sur votre expertise, vos réalisations, vos formations ou vos partenaires.</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-700 mb-1">H3 — Optimisation des contenus et expérience utilisateur</p>
                            <p>Décrivez l'expérience client, vos engagements, votre démarche qualité, vos avis ou témoignages.</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-700 mb-1">H2 — Conclusion de la page</p>
                            <p>Terminez par un appel à l'action : coordonnées, incitation à vous contacter, lien vers vos réseaux, zone d'intervention.</p>
                          </div>
                          <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-100 italic">Utilisez les balises H2/H3 disponibles dans l'éditeur ci-dessous pour structurer votre contenu.</p>
                        </div>
                      )}
                    </div>
                    <RichTextEditor value={form.description || ""} onChange={v => update("description", v)} />
                    {(() => {
                      const len = ((form.description as string) || "").replace(/<[^>]*>/g,"").trim().length;
                      return (
                        <p className="text-xs mt-1 flex items-center gap-1">
                          <span className={len > 2500 ? "text-red-500" : len > 2300 ? "text-orange-500" : "text-gray-400"}>{len}/2 500 caractères</span>
                          {len < 500 && len > 0 && <span className="text-landes-sage">· encore {500 - len} caractères minimum</span>}
                        </p>
                      );
                    })()}
                  </>
                : <div className="pro-description leading-relaxed" dangerouslySetInnerHTML={{ __html: pro.description }} />}
            </div>

            {/* ── Coordonnées ── */}
            <div className="sm:col-span-2 pt-2">
              <h3 className="text-xl font-bold text-landes-pine bg-landes-forest/8 border-l-4 border-landes-forest px-4 py-3 rounded-r-lg mb-4">
                Coordonnées &amp; Contact
              </h3>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Site internet</label>
              {editing
                ? <input value={form.website || ""} onChange={e => update("website", e.target.value)} className="input-field" placeholder="https://mon-site.fr" />
                : <p className="text-gray-900 font-medium">{pro.website || <span className="text-gray-400 italic text-sm">Non renseigné</span>}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label">Identifiant Google Business Profile <span className="text-gray-400 font-normal text-xs">(facultatif — affiche vos avis Google sur votre fiche)</span></label>
              {editing
                ? <>
                    <input value={(form as any).googlePlaceId || ""} onChange={e => update("googlePlaceId", e.target.value)} className="input-field" placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4" />
                    <p className="text-xs text-gray-400 mt-1">
                      Pour le trouver : cherchez votre établissement sur{" "}
                      <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" className="text-landes-forest underline">
                        l&apos;outil Place ID Finder de Google
                      </a>, et copiez l&apos;identifiant obtenu ici.
                    </p>
                  </>
                : <p className="text-gray-900 font-medium">{(pro as any).googlePlaceId || <span className="text-gray-400 italic text-sm">Non renseigné</span>}</p>}
            </div>
            <div>
              <label className="label">Téléphone</label>
              {editing
                ? <input value={form.phone || ""} onChange={e => update("phone", e.target.value)} className="input-field" />
                : <p className="text-gray-900 font-medium">{pro.phone}</p>}
            </div>
            <div>
              <label className="label">WhatsApp <span className="text-gray-400 font-normal text-xs">(facultatif)</span></label>
              {editing
                ? <input value={(form.whatsapp as string) || ""} onChange={e => update("whatsapp", e.target.value)} className="input-field" placeholder="06 12 34 56 78" />
                : <p className="text-gray-900 font-medium">{(pro as any).whatsapp || <span className="text-gray-400 italic text-sm">Non renseigné</span>}</p>}
            </div>
            <div>
              <label className="label">Email (identifiant)</label>
              <p className="text-gray-900 font-medium">{pro.email}</p>
              <span className="inline-block mt-1 text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Non modifiable</span>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Adresse</label>
              {editing
                ? <input value={form.address || ""} onChange={e => update("address", e.target.value)} className="input-field" />
                : <p className="text-gray-900 font-medium">{pro.address}</p>}
            </div>
            <div>
              <label className="label">Commune</label>
              {editing
                ? <select value={form.city || ""} onChange={e => update("city", e.target.value)} className="input-field">
                    {LANDES_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                : <p className="text-gray-900 font-medium">{pro.city}</p>}
            </div>
            <div>
              <label className="label">Code postal</label>
              {editing
                ? <input value={form.postalCode || ""} onChange={e => update("postalCode", e.target.value)} className="input-field" maxLength={5} />
                : <p className="text-gray-900 font-medium">{pro.postalCode}</p>}
            </div>

            {/* Services — Premium et Gold uniquement */}
            {pro.plan !== "standard" && (
            <div className="sm:col-span-2 pt-2">
              <h3 className="text-xl font-bold text-landes-pine bg-landes-forest/8 border-l-4 border-landes-forest px-4 py-3 rounded-r-lg mb-4">
                Services mis en avant
              </h3>
            </div>
            )}
            {pro.plan !== "standard" && (
            <div className="sm:col-span-2">
              <label className="label">
                Services
                <span className="text-gray-400 font-normal text-xs ml-1">
                  {pro.plan === "gold" ? "(3 max, 3 mots max chacun)" : "(1 max, 3 mots max)"}
                </span>
              </label>
              {editing ? (
                <div className={`grid grid-cols-1 gap-3 mt-1 ${pro.plan === "gold" ? "sm:grid-cols-3" : "sm:grid-cols-1 max-w-xs"}`}>
                  {(pro.plan === "gold" ? [0, 1, 2] : [0]).map(i => {
                    const val = (form.services as string[] | undefined)?.[i] || "";
                    const colors = ["border-landes-forest/40 bg-landes-forest/5", "border-landes-sage/40 bg-landes-sage/5", "border-amber-400/50 bg-amber-50"];
                    return (
                      <input key={i} type="text" value={val} maxLength={30}
                        placeholder={`Service ${i + 1}`}
                        onChange={e => {
                          const words = e.target.value.trim().split(/\s+/);
                          if (words.length <= 3) {
                            const arr = [...((form.services as string[] | undefined) || ["", "", ""])];
                            arr[i] = e.target.value;
                            setForm(prev => ({ ...prev, services: arr }));
                          }
                        }}
                        className={`input-field text-sm border ${colors[i]}`}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mt-1">
                  {(pro.services || []).filter(Boolean).length > 0
                    ? (pro.services || []).filter(Boolean).slice(0, pro.plan === "gold" ? 3 : 1).map((svc, i) => {
                        const styles = ["bg-landes-forest text-white", "bg-landes-sage text-white", "bg-amber-500 text-white"];
                        return <span key={i} className={`text-xs font-semibold px-3 py-1 rounded-full ${styles[i % styles.length]}`}>{svc}</span>;
                      })
                    : <p className="text-gray-400 italic text-sm">Aucun service renseigné</p>
                  }
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "fiche" && editing && (
        <div className="flex justify-end mt-4">
          <button onClick={handleSaveFiche} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      )}

      {/* Zone critique — en bas de l'onglet "Ma fiche" */}
      {activeTab === "fiche" && (
        <div className="card p-8 border border-red-100 mt-6">
          <h2 className="text-lg font-bold text-red-700 mb-1 flex items-center gap-2">
            <Shield className="w-5 h-5" /> Zone critique
          </h2>
          <p className="text-sm text-gray-500 mb-6">Ces actions sont irréversibles ou affectent la visibilité de votre fiche.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setConfirmAction("suspend")}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-orange-300 text-orange-700 hover:bg-orange-50 transition-colors font-medium text-sm"
            >
              <EyeOff className="w-4 h-4" />
              {pro.status === "suspended" ? "Réactiver ma fiche" : "Suspendre ma fiche"}
            </button>
            <button
              onClick={() => setConfirmAction("delete")}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-red-300 text-red-700 hover:bg-red-50 transition-colors font-medium text-sm"
            >
              <Trash2 className="w-4 h-4" /> Supprimer définitivement ma fiche
            </button>
          </div>
        </div>
      )}

      {/* ── TAB PHOTOS ── */}
      {activeTab === "photos" && (
        <div className="card p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-landes-pine flex items-center gap-2">
                <Images className="w-5 h-5 text-landes-sage" /> Galerie photos
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Ces photos apparaissent sur votre fiche publique.
                Maximum {MAX_PHOTOS} photos.
              </p>
            </div>
            {photoSaved && (
              <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Sauvegardé
              </span>
            )}
          </div>

          {photos.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {photos.map((src, idx) => (
                  <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 hover:border-landes-sage transition-colors">
                    <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover cursor-pointer" />

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                      <label className="w-full cursor-pointer">
                        <input type="file" accept="image/*" className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0]; if (!f) return;
                            const { compressPhoto } = await import("@/lib/imageUtils");
                            const compressed = await compressPhoto(f);
                            const arr = [...photos]; arr[idx] = compressed; setPhotos(arr);
                            e.target.value = "";
                          }}
                        />
                        <span className="flex items-center justify-center gap-1 text-white text-xs bg-white/20 hover:bg-white/30 rounded-lg px-2 py-1.5 w-full transition-colors">
                          <Edit3 className="w-3 h-3" /> Remplacer
                        </span>
                      </label>

                      <div className="flex gap-1 w-full">
                        <button type="button" disabled={idx === 0}
                          onClick={() => { const arr = [...photos]; [arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]]; setPhotos(arr); }}
                          className="flex-1 text-white text-xs bg-white/20 hover:bg-white/30 rounded-lg py-1.5 disabled:opacity-30 transition-colors font-bold">←</button>
                        <button type="button" disabled={idx === photos.length - 1}
                          onClick={() => { const arr = [...photos]; [arr[idx+1],arr[idx]]=[arr[idx],arr[idx+1]]; setPhotos(arr); }}
                          className="flex-1 text-white text-xs bg-white/20 hover:bg-white/30 rounded-lg py-1.5 disabled:opacity-30 transition-colors font-bold">→</button>
                      </div>

                      <button type="button" onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                        className="flex items-center justify-center gap-1 text-white text-xs bg-red-500/80 hover:bg-red-600 rounded-lg px-2 py-1.5 w-full transition-colors">
                        <Trash2 className="w-3 h-3" /> Supprimer
                      </button>
                    </div>

                    <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {idx + 1}
                    </div>
                  </div>
                ))}

                {photos.length < MAX_PHOTOS && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-landes-sage bg-gray-50 hover:bg-landes-sage/5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group/add">
                    <input ref={photoRef} type="file" accept="image/*" multiple className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        const { compressPhoto } = await import("@/lib/imageUtils");
                        const results: string[] = [];
                        for (const f of files) {
                          const compressed = await compressPhoto(f);
                          results.push(compressed);
                        }
                        setPhotos(prev => [...prev, ...results].slice(0, MAX_PHOTOS));
                        e.target.value = "";
                      }}
                    />
                    <ImagePlus className="w-6 h-6 text-gray-400 group-hover/add:text-landes-forest transition-colors" />
                    <span className="text-xs text-gray-400 group-hover/add:text-landes-forest transition-colors text-center px-1">
                      Ajouter<br />({photos.length}/{MAX_PHOTOS})
                    </span>
                  </label>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                <p className="font-medium mb-1">💡 Conseils</p>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• Survolez une photo pour accéder aux options (remplacer, réordonner, supprimer)</li>
                  <li>• Utilisez les flèches ← → pour changer l&apos;ordre des photos</li>
                  <li>• Formats recommandés : JPG, PNG — Ratio 4:3 ou 16:9</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
              <ImagePlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-500 mb-1">Aucune photo</h3>
              <p className="text-sm text-gray-400 mb-6">
                Ajoutez des photos pour enrichir votre fiche et attirer plus de clients.
              </p>
              <label className="btn-primary inline-flex items-center gap-2 cursor-pointer">
                <input type="file" accept="image/*" multiple className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    const { compressPhoto } = await import("@/lib/imageUtils");
                    const results: string[] = [];
                    for (const f of files) {
                      const compressed = await compressPhoto(f);
                      results.push(compressed);
                    }
                    setPhotos(prev => [...prev, ...results].slice(0, MAX_PHOTOS));
                    e.target.value = "";
                  }}
                />
                <ImagePlus className="w-4 h-4" />
                Ajouter des photos
              </label>
            </div>
          )}
        </div>
      )}

      {activeTab === "photos" && (
        <div className="flex justify-end mt-4">
          <button onClick={() => handleSavePhotos(photos)} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> Enregistrer les modifications
          </button>
        </div>
      )}

      {/* ── TAB HORAIRES ── */}
      {activeTab === "horaires" && (
        <div className="card p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-landes-pine bg-landes-forest/8 border-l-4 border-landes-forest px-4 py-3 rounded-r-lg mb-1">Horaires d&apos;ouverture</h2>
            <p className="text-sm text-gray-500">Ces horaires apparaîtront sur votre fiche publique avec un indicateur &quot;Ouvert / Fermé&quot; en temps réel.</p>
          </div>

          <OpeningHoursEditor value={hours} onChange={setHours} />

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button onClick={handleSaveHours} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Enregistrement..." : "Enregistrer les horaires"}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB AVIS ── */}
      {activeTab === "avis" && (
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-landes-pine bg-landes-forest/8 border-l-4 border-landes-forest px-4 py-3 rounded-r-lg">Avis clients</h2>
              <span className="text-sm text-gray-400">{proReviews.length} avis au total</span>
            </div>
            <p className="text-sm text-gray-500">
              Vous pouvez répondre aux avis approuvés. La modération (validation/suppression) est effectuée par l&apos;administrateur.
            </p>
          </div>

          {reviewsLoadError ? (
            <div className="card p-10 text-center">
              <p className="font-medium text-landes-pine mb-1">Impossible de charger vos avis</p>
              <p className="text-sm text-gray-500 mb-4">Vérifiez votre connexion internet et réessayez.</p>
              <button onClick={() => loadReviews(pro!.id)} className="btn-primary inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4" /> Réessayer
              </button>
            </div>
          ) : reviewsLoading ? (
            <div className="card p-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-landes-forest" />
            </div>
          ) : proReviews.length === 0 ? (
            <div className="card p-10 text-center text-gray-400">Aucun avis reçu pour le moment.</div>
          ) : (
            proReviews.map(review => (
              <div key={review.id} className="card p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-landes-forest/10 text-landes-forest flex items-center justify-center text-sm font-bold">
                      {review.firstName[0]}{review.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-landes-pine text-sm flex items-center gap-1.5">
                        {review.firstName} {review.lastName}
                        {review.verified && (
                          <span title="Identité vérifiée par email" className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full leading-none">
                            <Shield className="w-3 h-3" /> Vérifié
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
                      ))}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      review.status === "approved" ? "bg-green-100 text-green-700"
                      : review.status === "rejected" ? "bg-red-100 text-red-600"
                      : "bg-orange-100 text-orange-600"
                    }`}>
                      {review.status === "approved" ? "Approuvé" : review.status === "rejected" ? "Rejeté" : "En attente"}
                    </span>
                    {review.flagged && (
                      <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Signalé</span>
                    )}
                  </div>
                </div>

                {/* Texte */}
                <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-xl p-4">"{review.text}"</p>

                {/* Réponse existante */}
                {review.reply && (
                  <div className="bg-landes-forest/5 border border-landes-forest/20 rounded-xl p-4">
                    <p className="text-xs font-semibold text-landes-forest mb-1">Votre réponse</p>
                    <p className="text-sm text-gray-700">{review.reply}</p>
                  </div>
                )}

                {/* Formulaire de réponse (uniquement si approuvé) */}
                {review.status === "approved" && (
                  <div className="space-y-2">
                    <textarea
                      value={replyDrafts[review.id] ?? review.reply ?? ""}
                      onChange={e => setReplyDrafts(p => ({ ...p, [review.id]: e.target.value }))}
                      rows={3}
                      className="input-field resize-none text-sm"
                      placeholder="Répondre à cet avis…"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...review, reply: replyDrafts[review.id] ?? review.reply ?? "", repliedAt: new Date().toISOString() };
                          saveReview(updated);
                          loadReviews(pro!.id);
                          setReplyDrafts(p => { const n = { ...p }; delete n[review.id]; return n; });
                        }}
                        className="btn-primary py-2 px-4 text-sm"
                      >
                        {review.reply ? "Modifier la réponse" : "Publier la réponse"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB STATS (Gold uniquement) ── */}
      {activeTab === "stats" && pro.plan === "gold" && (
        <StatsTab proId={pro.id} />
      )}

      {/* ── TAB INFO FACTURATION ── */}
      {activeTab === "info-facturation" && (
        <FacturationTab pro={pro} infoOnly autoEditProfile={autoEditProfile} onEditProfileOpen={() => setAutoEditProfile(false)} />
      )}

      {/* ── TAB FACTURATION ── */}
      {activeTab === "facturation" && (
        <FacturationTab pro={pro} docsOnly />
      )}

      {/* ── TAB CLIENTS (CRM) ── */}
      {activeTab === "clients" && (
        <CrmTab pro={pro} />
      )}

      {/* ── TAB CHIFFRE D'AFFAIRES ── */}
      {activeTab === "revenue" && (
        <RevenueTab proId={pro.id} />
      )}

      {/* ── TAB PLAN ── */}
      {activeTab === "plan" && (
        <div className="space-y-6">
          {/* Plans */}
          <div className="card p-8">
            <h2 className="text-xl font-bold text-landes-pine bg-landes-forest/8 border-l-4 border-landes-forest px-4 py-3 rounded-r-lg mb-1">Ma formule</h2>
            <p className="text-sm text-gray-500 mb-4">Changez de formule à tout moment. Le changement est immédiat.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              {PLANS.map(plan => (
                <div key={plan.id} className={`card p-6 border-2 relative transition-all flex flex-col h-full ${
                  pro.plan === plan.id
                    ? "border-landes-forest bg-landes-forest/5 shadow"
                    : "border-gray-100 hover:border-landes-sage"
                }`}>
                  {pro.plan === plan.id && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-landes-forest text-white text-xs font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
                      Votre formule actuelle
                    </div>
                  )}
                  {(pro as any).pendingPlanChange?.targetPlan === plan.id && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
                      Prochaine formule
                    </div>
                  )}
                  {pro.plan === plan.id && (pro as any).pendingPlanChange && (
                    <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 mb-3 text-center">
                      Passage à {PLANS.find(p => p.id === (pro as any).pendingPlanChange.targetPlan)?.name} le{" "}
                      {new Date((pro as any).pendingPlanChange.effectiveDate).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                  <h3 className={`font-bold text-lg mb-1 ${plan.color}`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-bold text-gray-900">Gratuit</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-gray-900">{plan.price}€</span>
                        <span className="text-gray-400 text-sm">/mois</span>
                      </>
                    )}
                  </div>
                  <ul className="space-y-1.5 mb-5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 flex-shrink-0">✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  {pro.plan !== plan.id && !((pro as any).pendingPlanChange) && (
                    <button
                      disabled={planChanging || downgrading}
                      onClick={async () => {
                        const isDeferredDowngrade =
                          (pro.plan === "gold" && plan.id === "premium") ||
                          (pro.plan === "premium" && plan.id === "standard");

                        if (isDeferredDowngrade) {
                          await handleDowngrade(plan.id);
                          return;
                        }
                        if (plan.price > 0) {
                          // Formule payante : passage obligatoire par le formulaire de paiement
                          startPlanOrder(plan.id);
                          return;
                        }
                        setPlanChanging(true);
                        await new Promise(r => setTimeout(r, 600));
                        const updated = { ...pro, plan: plan.id as any, updatedAt: new Date().toISOString() };
                        saveProfessional(updated);
                        setPro(updated);
                        setPlanChanging(false);
                      }}
                      className="w-full py-2.5 rounded-xl border-2 border-landes-forest text-landes-forest hover:bg-landes-forest hover:text-white transition-all text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 mt-auto"
                    >
                      {planChanging || downgrading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> {downgrading ? "Programmation…" : "Changement…"}</>
                        : `Passer à ${plan.name}`
                      }
                    </button>
                  )}
                  {(pro as any).pendingPlanChange?.targetPlan === plan.id && (
                    <p className="mt-auto text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                      Prévu le {new Date((pro as any).pendingPlanChange.effectiveDate).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Modale de paiement — commande d'une formule payante */}
          {planOrderTarget && (
            <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4" onClick={closePlanOrderModal}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-landes-pine">Passer à la formule {PLANS.find(p => p.id === planOrderTarget)?.name}</p>
                  <button onClick={closePlanOrderModal} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {planOrderDone ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-4">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <p className="text-sm text-green-700 font-medium">Formule activée avec succès !</p>
                    </div>
                    <button onClick={closePlanOrderModal} className="btn-secondary w-full py-2 text-sm">Fermer</button>
                  </div>
                ) : planOrderPreparing || !planOrderClientSecret ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-6 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> Préparation du paiement sécurisé…
                  </div>
                ) : planOrderFinalizing ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-6 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> Activation de votre formule…
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 flex items-center justify-between text-sm">
                      <span className="text-gray-700">Formule {PLANS.find(p => p.id === planOrderTarget)?.name}</span>
                      <span className="font-semibold text-gray-900">{PLANS.find(p => p.id === planOrderTarget)?.price}€/mois</span>
                    </div>
                    <StripePaymentForm
                      clientSecret={planOrderClientSecret}
                      intentType="setup"
                      submitLabel="Payer et activer ma formule"
                      onSuccess={handlePlanOrderSuccess}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          <ComplementaryOptionsManager
            stripeCustomerId={(pro as any).stripeCustomerId}
            email={pro.email}
            companyName={pro.companyName}
            siren={pro.siren}
            onCustomerIdObtained={(customerId) => {
              const updated = { ...pro, stripeCustomerId: customerId, updatedAt: new Date().toISOString() } as any;
              saveProfessional(updated);
              setPro(updated);
            }}
            onOptionActivated={(optionId) => {
              // Corrige le décalage entre le statut réel (Stripe) et le champ
              // local complementaryOptions, utilisé par le diaporama des
              // encarts publicitaires sur les pages catégories/sous-catégories.
              const current = (pro as any).complementaryOptions || [];
              if (current.includes(optionId)) return;
              const updated = { ...pro, complementaryOptions: [...current, optionId], updatedAt: new Date().toISOString() } as any;
              saveProfessional(updated);
              setPro(updated);
            }}
          />
        </div>
      )}

      {/* ── TAB MES ABONNEMENTS ── */}
      {activeTab === "subscriptions" && (
        <div className="card p-8">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-landes-pine bg-landes-forest/8 border-l-4 border-landes-forest px-4 py-3 rounded-r-lg">Mes abonnements</h2>
            {(pro as any).stripeCustomerId && (
              <div className="flex items-center gap-2">
                <button onClick={() => subscriptionManagerRef.current?.refresh()} className="text-xs text-gray-400 hover:text-landes-forest flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Actualiser
                </button>
                <button
                  onClick={() => subscriptionManagerRef.current?.openCardModal()}
                  className="flex items-center gap-1.5 text-xs font-semibold text-landes-forest border border-landes-forest/40 px-3 py-1.5 rounded-lg hover:bg-landes-forest hover:text-white transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Changer de carte bancaire
                </button>
              </div>
            )}
          </div>
          {(pro as any).stripeCustomerId ? (
            <SubscriptionManager ref={subscriptionManagerRef} customerId={(pro as any).stripeCustomerId} />
          ) : (
            <p className="text-sm text-gray-400">Aucun abonnement associé à votre fiche pour le moment.</p>
          )}
        </div>
      )}

      {/* ── Modale de confirmation ── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            {confirmAction === "suspend" ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <EyeOff className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-landes-pine text-lg">
                      {pro.status === "suspended" ? "Réactiver ma fiche ?" : "Suspendre ma fiche ?"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {pro.status === "suspended"
                        ? "Votre fiche redeviendra visible dans l'annuaire."
                        : "Votre fiche ne sera plus visible dans l'annuaire. Vous pourrez la réactiver à tout moment depuis votre tableau de bord."}
                    </p>
                  </div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700">
                  ⚠️ {pro.status === "suspended"
                    ? "Votre fiche sera de nouveau visible par tous les visiteurs."
                    : "Votre fiche sera masquée de l'annuaire et des résultats de recherche. Vos données seront conservées."}
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setConfirmAction(null)} className="btn-secondary py-2.5 px-5">Annuler</button>
                  <button
                    onClick={() => {
                      const newStatus = pro.status === "suspended" ? "active" : "suspended";
                      const updated = { ...pro, status: newStatus as any, updatedAt: new Date().toISOString() };
                      saveProfessional(updated);
                      setPro(updated);
                      setConfirmAction(null);
                    }}
                    className={`py-2.5 px-5 rounded-xl font-semibold text-white transition-colors ${
                      pro.status === "suspended" ? "bg-landes-forest hover:bg-landes-pine" : "bg-orange-500 hover:bg-orange-600"
                    }`}
                  >
                    {pro.status === "suspended" ? "Réactiver" : "Suspendre"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-landes-pine text-lg">Supprimer ma fiche ?</h3>
                    <p className="text-sm text-gray-500">Cette action est définitive et irréversible.</p>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 space-y-1">
                  <p className="font-semibold">⚠️ Attention — Suppression définitive</p>
                  <ul className="list-disc list-inside space-y-0.5 text-red-600 text-xs">
                    <li>Votre fiche sera supprimée de l'annuaire</li>
                    <li>Toutes vos photos et informations seront perdues</li>
                    <li>Les avis de vos clients seront supprimés</li>
                    <li>Cette action est irréversible</li>
                  </ul>
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setConfirmAction(null)} className="btn-secondary py-2.5 px-5">Annuler</button>
                  <button
                    onClick={() => {
                      deleteProfessional(pro.id);
                      clearSession();
                      router.push("/");
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white py-2.5 px-5 rounded-xl font-semibold transition-colors"
                  >
                    Supprimer définitivement
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
        </div> {/* fin zone contenu droite */}
      </div> {/* fin layout 2 colonnes */}

      {cropFile && (
        <BannerCropper
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onCropped={dataUrl => {
            update("banner", dataUrl);
            setCropFile(null);
          }}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-landes-forest" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
