"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Users, CheckCircle, Clock, XCircle, Trash2, Eye, EyeOff, Search, Filter, Edit3, Save, X, Loader2, Shield, Star, Flag, MessageSquare, Info, Download, Upload, Settings2, UserX, UserCheck, Database, CreditCard, Plus, Building2, RefreshCw, ChevronDown, ChevronUp, Tag } from "lucide-react";
import { setSession, getSession, clearSession, getProfessionals, getProfessionalsWithImages, saveProfessional, deleteProfessional, getReviews, saveReview, deleteReview, generateId, getHeroSlideshowIds, saveHeroSlideshowIds } from "@/lib/storage";
import { Professional, PLANS, StatusType, Review } from "@/types";
import { getCategoriesAsync, DEFAULT_CATEGORIES, compareLabelsFr, type CategoryRecord, type SubcategoryRecord } from "@/lib/categories";
import PlanBadge from "@/components/ui/PlanBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import OpeningHoursEditor from "@/components/ui/OpeningHoursEditor";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { REQUIRE_VALIDATION } from "@/lib/config";
import { geocodeAddress } from "@/lib/geocode";
import type { OpeningHours } from "@/types";

/**
 * Géocode immédiatement une fiche si elle n'a pas encore de coordonnées
 * GPS (lat/lng), pour que son marker apparaisse sur la carte dès son
 * enregistrement — sans attendre qu'un visiteur consulte sa fiche
 * publique (seul moment où la géolocalisation se déclenchait auparavant).
 * Retourne la fiche telle quelle si déjà géolocalisée ou si l'adresse est
 * introuvable (échec silencieux, n'empêche jamais l'enregistrement).
 */
async function ensureGeocoded(pro: Professional): Promise<Professional> {
  if (pro.lat && pro.lng) return pro;
  if (!pro.address || !pro.city || !pro.postalCode) return pro;
  const coords = await geocodeAddress(pro.address, pro.city, pro.postalCode).catch(() => null);
  return coords ? { ...pro, lat: coords.lat, lng: coords.lng } : pro;
}

// Bouton "Enregistrer" pour la photo hero — lit l'état depuis le storage
// Colonnes disponibles pour l'export / import CSV — sélectionnables individuellement
const COLUMN_DEFS: { label: string; getValue: (p: Professional) => string }[] = [
  { label: "ID",                    getValue: p => p.id },
  { label: "Entreprise",            getValue: p => p.companyName },
  { label: "Titre de l'activité",   getValue: p => p.activityTitle ?? "" },
  { label: "Catégorie",             getValue: p => p.category },
  { label: "Sous-catégorie",        getValue: p => p.subcategory ?? "" },
  { label: "Email",                 getValue: p => p.email },
  { label: "Téléphone",             getValue: p => p.phone },
  { label: "Whatsapp",              getValue: p => p.whatsapp ?? "" },
  { label: "SIREN",                 getValue: p => p.siren },
  { label: "Forme juridique",       getValue: p => p.legalForm },
  { label: "Adresse",               getValue: p => p.address },
  { label: "Code postal",           getValue: p => p.postalCode },
  { label: "Ville",                 getValue: p => p.city },
  { label: "Lat",                   getValue: p => (p.lat ?? "").toString() },
  { label: "Lng",                   getValue: p => (p.lng ?? "").toString() },
  { label: "Formule",               getValue: p => p.plan },
  { label: "Statut",                getValue: p => p.status },
  { label: "Revendiquée",           getValue: p => (p as any).claimed ? "Oui" : "Non" },
  { label: "Site web",              getValue: p => p.website ?? "" },
  { label: "Service 1",             getValue: p => p.services?.[0] ?? "" },
  { label: "Service 2",             getValue: p => p.services?.[1] ?? "" },
  { label: "Service 3",             getValue: p => p.services?.[2] ?? "" },
  { label: "Description courte",    getValue: p => p.shortDescription ?? "" },
  { label: "Description longue",    getValue: p => p.description ?? "" },
  { label: "Logo (URL)",            getValue: p => (p.logo ?? "").startsWith("data:") ? "" : (p.logo ?? "") },
  { label: "Bannière (URL)",        getValue: p => (p.banner ?? "").startsWith("data:") ? "" : (p.banner ?? "") },
  { label: "Date inscription",      getValue: p => p.createdAt ? new Date(p.createdAt).toLocaleDateString("fr-FR") : "" },
];
const ALL_COLUMN_LABELS = COLUMN_DEFS.map(c => c.label);

// Bouton "Enregistrer" pour la photo hero — lit l'état depuis le storage
// Petit composant d'upload d'image (base64) pour la modale d'édition complète
function AdminImageUploader({ label, value, onChange, aspect = "square" }: {
  label: string; value?: string; onChange: (v: string) => void; aspect?: "square" | "banner";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <label className="label">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-landes-sage transition-colors overflow-hidden bg-gray-50 ${aspect === "banner" ? "h-28" : "h-28 w-28"}`}
      >
        {value ? (
          <img src={value} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Cliquer pour choisir</div>
        )}
        {value && (
          <button type="button" onClick={e => { e.stopPropagation(); onChange(""); }}
            className="absolute top-1 right-1 bg-white/90 rounded-full p-1 hover:bg-white">
            <X className="w-3 h-3 text-gray-600" />
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={e => handleFile(e.target.files?.[0])} />
    </div>
  );
}

// ── Gestion de la base entreprises SIRENE (codes APE suivis, synchro
// manuelle, historique, recherche, enrichissement, import CSV) ──
function SireneManager() {
  const [watchedCodes, setWatchedCodes] = useState<{ codeApe: string; libelle: string | null }[]>([]);
  const [newCode, setNewCode] = useState("");
  const [newLibelle, setNewLibelle] = useState("");
  const [addCodeError, setAddCodeError] = useState<string | null>(null);
  const [addingCode, setAddingCode] = useState(false);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [totalGlobal, setTotalGlobal] = useState(0);
  const [auditCounts, setAuditCounts] = useState({ historique: 0, syncLogs: 0 });
  const [cleanupDays, setCleanupDays] = useState(90);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  const [searchQ, setSearchQ] = useState("");
  const [searchApe, setSearchApe] = useState("");
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [searchLoading, setSearchLoading] = useState(false);

  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [selectedSirets, setSelectedSirets] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [enrichForm, setEnrichForm] = useState({ telephone: "", email: "", siteWeb: "" });

  const [csvFile, setCsvFile] = useState<string | null>(null);
  const [csvFileName, setCsvFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const loadWatchedCodes = async () => {
    const res = await fetch("/api/admin/sirene/watched-codes");
    const data = await res.json();
    setWatchedCodes(data.codes || []);
  };

  const loadSyncLogs = async () => {
    const res = await fetch("/api/admin/sirene/sync-log");
    const data = await res.json();
    setSyncLogs(data.logs || []);
  };

  const loadAuditCounts = async () => {
    const res = await fetch("/api/admin/sirene/cleanup");
    const data = await res.json();
    setAuditCounts({ historique: data.historique || 0, syncLogs: data.syncLogs || 0 });
  };

  const handleCleanup = async () => {
    if (!confirm(`Supprimer définitivement l'historique et les journaux de synchronisation de plus de ${cleanupDays} jours ? Les entreprises elles-mêmes ne sont jamais supprimées.`)) return;
    setCleaning(true);
    setCleanupResult(null);
    try {
      const res = await fetch("/api/admin/sirene/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysToKeep: cleanupDays }),
      });
      const data = await res.json();
      if (data.error) { setCleanupResult(`❌ ${data.error}`); return; }
      setCleanupResult(`✅ ${data.historiqueDeleted} entrée${data.historiqueDeleted > 1 ? "s" : ""} d'historique et ${data.syncLogsDeleted} journal${data.syncLogsDeleted > 1 ? "aux" : ""} de synchronisation supprimés.`);
      loadAuditCounts();
      loadSyncLogs();
    } catch {
      setCleanupResult("❌ Erreur réseau lors du nettoyage.");
    } finally {
      setCleaning(false);
    }
  };

  const runSearch = async (page = 1) => {
    setSearchLoading(true);
    setSelectedSirets(new Set());
    try {
      const params = new URLSearchParams();
      if (searchQ) params.set("q", searchQ);
      if (searchApe) params.set("codeApe", searchApe);
      params.set("page", String(page));
      const res = await fetch(`/api/admin/sirene/list?${params.toString()}`);
      const data = await res.json();
      setEntreprises(data.entreprises || []);
      setSearchPage(data.page || 1);
      setSearchTotalPages(data.totalPages || 1);
      setTotalGlobal(data.totalGlobal || 0);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => { loadWatchedCodes(); loadSyncLogs(); loadAuditCounts(); runSearch(1); }, []);

  const handleAddCode = async () => {
    const code = newCode.trim();
    if (!code) return;
    setAddCodeError(null);
    setAddingCode(true);
    try {
      const res = await fetch("/api/admin/sirene/watched-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codeApe: code,
          libelle: newLibelle.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        setAddCodeError(data.error || `Erreur ${res.status} lors de l'ajout du code APE.`);
        return;
      }
      setNewCode(""); setNewLibelle("");
      await loadWatchedCodes();
    } catch {
      setAddCodeError("Erreur réseau — impossible de contacter le serveur.");
    } finally {
      setAddingCode(false);
    }
  };

  const handleRemoveCode = async (code: string) => {
    await fetch(`/api/admin/sirene/watched-codes/${encodeURIComponent(code)}`, { method: "DELETE" });
    loadWatchedCodes();
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/admin/sirene/sync-now", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (data.error) { setSyncResult(`❌ ${data.error}`); return; }
      setSyncResult(`✅ ${data.totalInserted} créés, ${data.totalUpdated} mis à jour, ${data.totalUnchanged} inchangés, ${data.totalGeocoded || 0} géocodé(s) (${data.codesApe?.length || 0} code(s) APE, ${Math.round(data.durationMs / 1000)}s).`);
      loadSyncLogs();
      runSearch(1);
    } catch {
      setSyncResult("❌ Erreur réseau lors de la synchronisation.");
    } finally {
      setSyncing(false);
    }
  };

  const toggleSelect = (siret: string) => {
    setSelectedSirets(prev => {
      const next = new Set(prev);
      if (next.has(siret)) next.delete(siret); else next.add(siret);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedSirets.size === entreprises.length) {
      setSelectedSirets(new Set());
    } else {
      setSelectedSirets(new Set(entreprises.map((e: any) => e.siret)));
    }
  };

  const handleDeleteOne = async (siret: string, label: string) => {
    if (!confirm(`Supprimer définitivement "${label}" de la base ? Cette action est irréversible.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/sirene/delete/${siret}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setSelectedSirets(prev => { const n = new Set(prev); n.delete(siret); return n; });
      runSearch(searchPage);
    } catch {
      alert("Erreur réseau lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  };

  const [exportingSelection, setExportingSelection] = useState(false);

  const handleExportSelection = async () => {
    if (selectedSirets.size === 0) return;
    setExportingSelection(true);
    try {
      const res = await fetch("/api/admin/sirene/export-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sirets: Array.from(selectedSirets) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erreur lors de l'export de la sélection.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `entreprises-sirene-selection-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erreur réseau lors de l'export de la sélection.");
    } finally {
      setExportingSelection(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSirets.size === 0) return;
    if (!confirm(`Supprimer définitivement ${selectedSirets.size} entreprise(s) sélectionnée(s) de la base ? Cette action est irréversible.`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/sirene/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sirets: Array.from(selectedSirets) }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setSelectedSirets(new Set());
      runSearch(1);
    } catch {
      alert("Erreur réseau lors de la suppression en masse.");
    } finally {
      setDeleting(false);
    }
  };

  const startEnrich = (e: any) => {
    setEnrichingId(e.siret);
    setEnrichForm({ telephone: e.telephone || "", email: e.email || "", siteWeb: e.siteWeb || "" });
  };

  const saveEnrich = async () => {
    if (!enrichingId) return;
    await fetch("/api/admin/sirene/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siret: enrichingId, ...enrichForm }),
    });
    setEnrichingId(null);
    runSearch(searchPage);
  };

  const handleCsvFile = (file: File) => {
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setCsvFile(reader.result as string);
    reader.readAsText(file);
  };

  const handleImportCsv = async () => {
    if (!csvFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/admin/sirene/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvFile }),
      });
      const data = await res.json();
      if (data.error) { setImportResult(`❌ ${data.error}`); return; }
      setImportResult(`✅ ${data.matched}/${data.total} établissements enrichis. ${data.notFound > 0 ? `${data.notFound} SIRET introuvables en base.` : ""}`);
      setCsvFile(null); setCsvFileName("");
      runSearch(searchPage);
    } catch {
      setImportResult("❌ Erreur réseau lors de l'import.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Codes APE suivis */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-landes-pine mb-1">Codes APE suivis</h2>
        <p className="text-sm text-gray-500 mb-4">
          Le cron quotidien (et le bouton "Synchroniser maintenant" ci-dessous) synchronisent automatiquement
          tous les établissements actifs du département 40 pour ces codes APE.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {watchedCodes.length === 0 && <p className="text-sm text-gray-400">Aucun code APE suivi pour le moment.</p>}
          {watchedCodes.map(c => (
            <span key={c.codeApe} className="inline-flex items-center gap-2 bg-landes-forest/8 text-landes-pine text-sm font-medium px-3 py-1.5 rounded-full">
              {c.codeApe} {c.libelle && <span className="text-gray-500 font-normal">— {c.libelle}</span>}
              <button onClick={() => handleRemoveCode(c.codeApe)} className="text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <input value={newCode} onChange={e => { setNewCode(e.target.value); setAddCodeError(null); }} placeholder="Code APE (ex: 43.21A)" className="input-field text-sm w-48" />
          <input value={newLibelle} onChange={e => setNewLibelle(e.target.value)} placeholder="Libellé (facultatif)" className="input-field text-sm flex-1 min-w-[180px]" />
          <button onClick={handleAddCode} disabled={addingCode} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50">
            {addingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Ajouter
          </button>
        </div>
        {addCodeError && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-2">{addCodeError}</p>
        )}
      </div>

      {/* Synchronisation */}
      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-landes-pine">Synchronisation</h2>
            <p className="text-sm text-gray-500 mt-0.5">{totalGlobal} établissement{totalGlobal > 1 ? "s" : ""} actif{totalGlobal > 1 ? "s" : ""} en base.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a href="/api/admin/sirene/export-csv" download className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm">
              <Download className="w-4 h-4" /> Exporter CSV
            </a>
            <button onClick={handleSyncNow} disabled={syncing || watchedCodes.length === 0} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50">
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {syncing ? "Synchronisation…" : "Synchroniser maintenant"}
            </button>
          </div>
        </div>
        {syncResult && <p className="text-sm bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-4">{syncResult}</p>}

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Historique des synchronisations</p>
        {syncLogs.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune synchronisation effectuée pour le moment.</p>
        ) : (
          <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 overflow-hidden">
            {syncLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${log.status === "success" ? "bg-green-500" : log.status === "error" ? "bg-red-500" : "bg-amber-400"}`} />
                <span className="text-gray-500 w-40 flex-shrink-0">{new Date(log.started_at).toLocaleString("fr-FR")}</span>
                <span className="flex-1 text-gray-700">
                  {log.status === "error" ? log.error_message : `${log.total_inserted} créés, ${log.total_updated} mis à jour, ${log.total_unchanged} inchangés`}
                </span>
                <span className="text-gray-400 text-xs flex-shrink-0">{(log.codes_ape || []).join(", ")}</span>
              </div>
            ))}
          </div>
        )}

        {/* Nettoyage de l'historique / journal de synchronisation */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Nettoyage de la base</p>
          <p className="text-sm text-gray-500 mb-1">
            {auditCounts.historique} entrée{auditCounts.historique > 1 ? "s" : ""} d&apos;historique, {auditCounts.syncLogs} journal{auditCounts.syncLogs > 1 ? "aux" : ""} de synchronisation en base.
          </p>
          <p className="text-xs text-gray-400 mb-3">
            Un nettoyage automatique conserve déjà 90 jours à chaque synchronisation quotidienne. Utilisez ceci pour une purge manuelle avec une autre durée.
            Ne supprime jamais les entreprises elles-mêmes.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-gray-600">Conserver les</label>
            <input
              type="number" min={1} value={cleanupDays}
              onChange={e => setCleanupDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="input-field text-sm w-20"
            />
            <label className="text-sm text-gray-600">derniers jours</label>
            <button onClick={handleCleanup} disabled={cleaning} className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50">
              {cleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {cleaning ? "Nettoyage…" : "Nettoyer maintenant"}
            </button>
          </div>
          {cleanupResult && <p className="text-sm bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mt-3">{cleanupResult}</p>}
        </div>
      </div>

      {/* Import CSV d'enrichissement */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-landes-pine mb-1">Import CSV — enrichissement</h2>
        <p className="text-sm text-gray-500 mb-4">
          Complète le téléphone, l&apos;email et le site web d&apos;établissements déjà présents en base
          (colonnes attendues : <code className="bg-gray-100 px-1 rounded">siret</code>, <code className="bg-gray-100 px-1 rounded">telephone</code>, <code className="bg-gray-100 px-1 rounded">email</code>, <code className="bg-gray-100 px-1 rounded">site_web</code>).
          N&apos;ajoute jamais de nouvel établissement — seule la synchronisation SIRENE le fait.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => csvInputRef.current?.click()} className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm">
            <Upload className="w-4 h-4" /> {csvFileName || "Choisir un fichier CSV"}
          </button>
          <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvFile(f); }} />
          {csvFile && (
            <button onClick={handleImportCsv} disabled={importing} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {importing ? "Import…" : "Importer"}
            </button>
          )}
        </div>
        {importResult && <p className="text-sm bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mt-3">{importResult}</p>}
      </div>

      {/* Recherche / enrichissement / suppression individuelle ou en masse */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-landes-pine mb-4">Rechercher une entreprise</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Nom, enseigne…" className="input-field text-sm flex-1 min-w-[180px]" />
          <input value={searchApe} onChange={e => setSearchApe(e.target.value)} placeholder="Code APE" className="input-field text-sm w-40" />
          <button onClick={() => runSearch(1)} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"><Search className="w-4 h-4" /> Rechercher</button>
        </div>

        {searchLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-landes-forest" /></div>
        ) : entreprises.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucun résultat.</p>
        ) : (
          <>
            {/* Barre de sélection en masse — identique au fonctionnement de l'onglet Professionnels */}
            <div className={`flex items-center gap-3 mb-3 p-3 rounded-xl border transition-all ${selectedSirets.size > 0 ? "bg-landes-forest/5 border-landes-sage/40" : "bg-gray-50 border-gray-100"}`}>
              <input
                type="checkbox"
                checked={entreprises.length > 0 && selectedSirets.size === entreprises.length}
                ref={el => { if (el) el.indeterminate = selectedSirets.size > 0 && selectedSirets.size < entreprises.length; }}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-landes-forest flex-shrink-0"
              />
              <span className="text-sm text-gray-600 flex-1">
                {selectedSirets.size > 0
                  ? <strong className="text-landes-pine">{selectedSirets.size} sélectionnée{selectedSirets.size > 1 ? "s" : ""}</strong>
                  : "Tout sélectionner sur cette page"}
              </span>
              {selectedSirets.size > 0 && (
                <>
                  <button
                    onClick={handleExportSelection}
                    disabled={exportingSelection}
                    className="flex items-center gap-1.5 text-xs font-semibold text-landes-forest hover:text-landes-pine disabled:opacity-50 px-3 py-1.5 rounded-lg hover:bg-landes-forest/5 flex-shrink-0"
                  >
                    {exportingSelection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    Exporter la sélection
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={deleting}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50 px-3 py-1.5 rounded-lg hover:bg-red-50 flex-shrink-0"
                  >
                    {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Supprimer la sélection
                  </button>
                </>
              )}
            </div>

            <div className="border border-gray-100 rounded-xl divide-y divide-gray-50">
              {entreprises.map((e: any) => (
                <div key={e.siret} className="px-4 py-3">
                  {enrichingId === e.siret ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-sm text-gray-800">{e.denomination || e.enseigne}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input value={enrichForm.telephone} onChange={ev => setEnrichForm(f => ({ ...f, telephone: ev.target.value }))} placeholder="Téléphone" className="input-field text-sm" />
                        <input value={enrichForm.email} onChange={ev => setEnrichForm(f => ({ ...f, email: ev.target.value }))} placeholder="Email" className="input-field text-sm" />
                        <input value={enrichForm.siteWeb} onChange={ev => setEnrichForm(f => ({ ...f, siteWeb: ev.target.value }))} placeholder="Site web" className="input-field text-sm" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveEnrich} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"><Save className="w-3.5 h-3.5" /> Enregistrer</button>
                        <button onClick={() => setEnrichingId(null)} className="btn-secondary text-xs px-3 py-1.5">Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedSirets.has(e.siret)}
                        onChange={() => toggleSelect(e.siret)}
                        className="w-4 h-4 accent-landes-forest flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 truncate">{e.denomination || e.enseigne || "—"}</p>
                        <p className="text-xs text-gray-400">{e.siret} · {e.codeApe} · {e.commune}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {e.telephone || <span className="text-gray-300">Tél. non renseigné</span>}
                          {" · "}
                          {e.email || <span className="text-gray-300">Email non renseigné</span>}
                          {" · "}
                          {e.siteWeb || <span className="text-gray-300">Site non renseigné</span>}
                        </p>
                      </div>
                      <button onClick={() => startEnrich(e)} className="p-1.5 rounded-lg text-gray-400 hover:text-landes-forest hover:bg-landes-forest/5 flex-shrink-0">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteOne(e.siret, e.denomination || e.enseigne || e.siret)} disabled={deleting} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0 disabled:opacity-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {searchTotalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4 text-sm">
            <button onClick={() => runSearch(searchPage - 1)} disabled={searchPage <= 1} className="text-landes-forest disabled:text-gray-300">← Précédent</button>
            <span className="text-gray-500">Page {searchPage} / {searchTotalPages}</span>
            <button onClick={() => runSearch(searchPage + 1)} disabled={searchPage >= searchTotalPages} className="text-landes-forest disabled:text-gray-300">Suivant →</button>
          </div>
        )}
      </div>
    </div>
  );
}

interface AdminOption {
  id: string;
  name: string;
  description: string | null;
  unitAmount: number;
  cadence: "month" | "once";
  stripeProductId: string;
  sortOrder: number;
}

// Gestion complète (ajout / modification / suppression) du catalogue des
// options complémentaires — pilote à la fois l'affichage sur le site ET
// les montants réellement facturés via Stripe (voir src/lib/db/options.ts).
function OptionsManager() {
  const [options, setOptions] = useState<AdminOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyForm = { id: "", name: "", description: "", unitAmount: "", cadence: "month" as "month" | "once" };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/db/options?admin=1");
      const data = await res.json();
      if (data.error) { setLoadError(data.error); return; }
      setOptions((data.options || []).sort((a: AdminOption, b: AdminOption) => a.sortOrder - b.sortOrder));
    } catch {
      setLoadError("Impossible de charger le catalogue. Vérifiez que la base de données est configurée (POSTGRES_URL).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (opt: AdminOption) => {
    setEditingId(opt.id);
    setShowAddForm(false);
    setForm({
      id: opt.id,
      name: opt.name,
      description: opt.description || "",
      unitAmount: (opt.unitAmount / 100).toString(),
      cadence: opt.cadence,
    });
  };

  const startAdd = () => {
    setShowAddForm(true);
    setEditingId(null);
    setForm(emptyForm);
  };

  const cancelForm = () => {
    setEditingId(null);
    setShowAddForm(false);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    const idSlug = form.id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const amount = parseFloat(form.unitAmount.replace(",", "."));

    if (!idSlug || !form.name.trim() || isNaN(amount) || amount <= 0) {
      alert("Merci de renseigner un identifiant, un nom et un prix valide (supérieur à 0).");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/db/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: idSlug,
          name: form.name.trim(),
          description: form.description.trim(),
          unitAmount: Math.round(amount * 100),
          cadence: form.cadence,
          stripeProductId: `prolocal_opt_${idSlug}`,
          sortOrder: editingId
            ? options.find(o => o.id === editingId)?.sortOrder ?? 0
            : options.length,
        }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      await load();
      cancelForm();
    } catch {
      alert("Erreur réseau lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer définitivement cette option ? Elle ne sera plus proposée aux professionnels (les abonnements déjà en cours ne sont pas résiliés).")) return;
    try {
      const res = await fetch(`/api/db/options/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      await load();
    } catch {
      alert("Erreur réseau lors de la suppression.");
    }
  };

  const renderForm = () => (
    <div className="border-2 border-landes-forest/30 bg-landes-forest/5 rounded-xl p-4 space-y-3 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Identifiant technique {editingId && <span className="text-gray-400">(non modifiable)</span>}</label>
          <input
            value={form.id}
            onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
            disabled={!!editingId}
            placeholder="ex: newsletter"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Nom affiché</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="ex: Newsletter mensuelle"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Prix (€)</label>
          <input
            value={form.unitAmount}
            onChange={e => setForm(f => ({ ...f, unitAmount: e.target.value }))}
            placeholder="ex: 15"
            inputMode="decimal"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Cadence</label>
          <select
            value={form.cadence}
            onChange={e => setForm(f => ({ ...f, cadence: e.target.value as "month" | "once" }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="month">Mensuel (abonnement)</option>
            <option value="once">Frais unique</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Description (affichée aux professionnels)</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button onClick={cancelForm} className="btn-secondary px-4 py-2 text-sm">Annuler</button>
      </div>
    </div>
  );

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-1 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-landes-pine">Options complémentaires</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Ajoutez, modifiez ou supprimez les options proposées aux professionnels (page d&apos;accueil,
            inscription, tableau de bord). Les prix modifiés ici s&apos;appliquent immédiatement au
            paiement réel via Stripe.
          </p>
        </div>
        {!showAddForm && !editingId && (
          <button onClick={startAdd} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm flex-shrink-0">
            <Plus className="w-4 h-4" /> Ajouter une option
          </button>
        )}
      </div>

      <div className="mt-5">
        {showAddForm && renderForm()}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Chargement du catalogue…
          </div>
        ) : loadError ? (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-3">{loadError}</p>
        ) : options.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Aucune option personnalisée en base — le site utilise actuellement le catalogue par défaut.
            Ajoutez une option ci-dessus pour commencer à le personnaliser.
          </p>
        ) : (
          <div className="border border-gray-100 rounded-xl divide-y divide-gray-50">
            {options.map(opt => (
              <div key={opt.id}>
                {editingId === opt.id ? (
                  <div className="p-3">{renderForm()}</div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800 text-sm">{opt.name}</p>
                        <span className="text-xs text-gray-400 font-mono">({opt.id})</span>
                      </div>
                      {opt.description && <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-landes-pine text-sm">{(opt.unitAmount / 100).toFixed(0)}€</p>
                      <p className="text-[11px] text-gray-400">{opt.cadence === "once" ? "frais unique" : "/mois"}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => startEdit(opt)} className="p-1.5 rounded-lg text-gray-400 hover:text-landes-forest hover:bg-landes-forest/5">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(opt.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoriesManager() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyForm = { label: "", emoji: "🏷️", seoTitle: "", subtitle: "", seoText: "", ctaText: "" };
  const [form, setForm] = useState(emptyForm);

  // Sous-catégories : un seul formulaire actif à la fois, rattaché à une catégorie précise
  const [subFormFor, setSubFormFor] = useState<string | null>(null);
  const [subEditingId, setSubEditingId] = useState<string | null>(null);
  const [subLabel, setSubLabel] = useState("");
  const [subSaving, setSubSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/db/categories?admin=1");
      const data = await res.json();
      if (data.error) { setLoadError(data.error); return; }
      setCategories((data.categories || []).slice().sort((a: CategoryRecord, b: CategoryRecord) => compareLabelsFr(a.label, b.label)));
    } catch {
      setLoadError("Impossible de charger les catégories. Vérifiez que la base de données est configurée (POSTGRES_URL).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (cat: CategoryRecord) => {
    setEditingId(cat.id);
    setShowAddForm(false);
    setForm({
      label: cat.label,
      emoji: cat.emoji,
      seoTitle: cat.seoTitle,
      subtitle: cat.subtitle,
      seoText: cat.seoText.join("\n\n"),
      ctaText: cat.ctaText,
    });
  };

  const startAdd = () => {
    setShowAddForm(true);
    setEditingId(null);
    setForm(emptyForm);
  };

  const cancelForm = () => {
    setEditingId(null);
    setShowAddForm(false);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.label.trim()) {
      alert("Le libellé de la catégorie est requis.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/db/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId || undefined,
          label: form.label.trim(),
          emoji: form.emoji.trim() || "🏷️",
          seoTitle: form.seoTitle.trim(),
          subtitle: form.subtitle.trim(),
          seoText: form.seoText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean),
          ctaText: form.ctaText.trim(),
          order: editingId ? (categories.find(c => c.id === editingId)?.order ?? 0) : categories.length,
        }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      await load();
      cancelForm();
    } catch {
      alert("Erreur réseau lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: CategoryRecord) => {
    if (!confirm(`Supprimer définitivement la catégorie "${cat.label}" ? Cette action est irréversible.`)) return;
    try {
      const res = await fetch(`/api/db/categories/${cat.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      await load();
    } catch {
      alert("Erreur réseau lors de la suppression.");
    }
  };

  const startSubAdd = (categoryId: string) => {
    setSubFormFor(categoryId);
    setSubEditingId(null);
    setSubLabel("");
  };

  const startSubEdit = (categoryId: string, sub: SubcategoryRecord) => {
    setSubFormFor(categoryId);
    setSubEditingId(sub.id);
    setSubLabel(sub.label);
  };

  const cancelSubForm = () => {
    setSubFormFor(null);
    setSubEditingId(null);
    setSubLabel("");
  };

  const handleSubSave = async (cat: CategoryRecord) => {
    if (!subLabel.trim()) {
      alert("Le libellé de la sous-catégorie est requis.");
      return;
    }
    setSubSaving(true);
    try {
      const res = await fetch(`/api/db/categories/${cat.id}/subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: subEditingId || undefined,
          label: subLabel.trim(),
          order: subEditingId ? (cat.subcategories.find(s => s.id === subEditingId)?.order ?? 0) : cat.subcategories.length,
        }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      await load();
      cancelSubForm();
    } catch {
      alert("Erreur réseau lors de l'enregistrement.");
    } finally {
      setSubSaving(false);
    }
  };

  const handleSubDelete = async (sub: SubcategoryRecord) => {
    if (!confirm(`Supprimer définitivement la sous-catégorie "${sub.label}" ?`)) return;
    try {
      const res = await fetch(`/api/db/subcategories/${sub.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      await load();
    } catch {
      alert("Erreur réseau lors de la suppression.");
    }
  };

  const renderCategoryForm = () => (
    <div className="border-2 border-landes-forest/30 bg-landes-forest/5 rounded-xl p-4 space-y-3 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Emoji</label>
          <input
            value={form.emoji}
            onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
            placeholder="🏷️"
            maxLength={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Libellé {editingId && <span className="text-gray-400">(l'URL /categories/… reste inchangée)</span>}</label>
          <input
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder="ex: Photographie & Vidéo"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Titre SEO</label>
          <input
            value={form.seoTitle}
            onChange={e => setForm(f => ({ ...f, seoTitle: e.target.value }))}
            placeholder="ex: Photographes et vidéastes dans les Landes"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Sous-titre (affiché sous le titre de la page)</label>
          <input
            value={form.subtitle}
            onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Texte descriptif (un paragraphe par bloc, séparés par une ligne vide)</label>
          <textarea
            value={form.seoText}
            onChange={e => setForm(f => ({ ...f, seoText: e.target.value }))}
            rows={5}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Texte du bouton d&apos;appel à l&apos;action (bas de page)</label>
          <textarea
            value={form.ctaText}
            onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button onClick={cancelForm} className="btn-secondary px-4 py-2 text-sm">Annuler</button>
      </div>
    </div>
  );

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-1 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-landes-pine">Catégories &amp; sous-catégories</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Ajoutez, modifiez ou supprimez les catégories et sous-catégories d&apos;activité. Elles apparaissent
            immédiatement dans les menus, l&apos;accueil, les pages catégories, l&apos;annuaire et les formulaires
            d&apos;inscription — aucune modification de code n&apos;est nécessaire.
          </p>
        </div>
        {!showAddForm && !editingId && (
          <button onClick={startAdd} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm flex-shrink-0">
            <Plus className="w-4 h-4" /> Ajouter une catégorie
          </button>
        )}
      </div>

      <div className="mt-5">
        {showAddForm && renderCategoryForm()}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Chargement des catégories…
          </div>
        ) : loadError ? (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-3">{loadError}</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune catégorie.</p>
        ) : (
          <div className="border border-gray-100 rounded-xl divide-y divide-gray-50">
            {categories.map(cat => (
              <div key={cat.id}>
                {editingId === cat.id ? (
                  <div className="p-3">{renderCategoryForm()}</div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button
                        onClick={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
                        className="p-1 text-gray-400 hover:text-landes-forest flex-shrink-0"
                        aria-label={`Sous-catégories de ${cat.label}`}
                      >
                        {expandedId === cat.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <span className="text-xl flex-shrink-0">{cat.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-800 text-sm">{cat.label}</p>
                          <span className="text-xs text-gray-400 font-mono">/{cat.slug}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {cat.subcategories.length} sous-catégorie{cat.subcategories.length > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg text-gray-400 hover:text-landes-forest hover:bg-landes-forest/5">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(cat)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {expandedId === cat.id && (
                      <div className="px-4 pb-4 pl-11">
                        {cat.subcategories.length > 0 && (
                          <div className="border border-gray-100 rounded-lg divide-y divide-gray-50 mb-2">
                            {cat.subcategories.map(sub => (
                              <div key={sub.id}>
                                {subFormFor === cat.id && subEditingId === sub.id ? (
                                  <div className="p-2 flex items-center gap-2">
                                    <input
                                      value={subLabel}
                                      onChange={e => setSubLabel(e.target.value)}
                                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                                    />
                                    <button onClick={() => handleSubSave(cat)} disabled={subSaving} className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50 flex-shrink-0">
                                      {subSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enregistrer"}
                                    </button>
                                    <button onClick={cancelSubForm} className="btn-secondary px-3 py-1.5 text-xs flex-shrink-0">Annuler</button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 px-3 py-2">
                                    <span className="flex-1 text-sm text-gray-700">{sub.label}</span>
                                    <button onClick={() => startSubEdit(cat.id, sub)} className="p-1 rounded text-gray-400 hover:text-landes-forest hover:bg-landes-forest/5">
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleSubDelete(sub)} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {subFormFor === cat.id && !subEditingId ? (
                          <div className="flex items-center gap-2">
                            <input
                              value={subLabel}
                              onChange={e => setSubLabel(e.target.value)}
                              placeholder="Nouvelle sous-catégorie"
                              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                            />
                            <button onClick={() => handleSubSave(cat)} disabled={subSaving} className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50 flex-shrink-0">
                              {subSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Ajouter"}
                            </button>
                            <button onClick={cancelSubForm} className="btn-secondary px-3 py-1.5 text-xs flex-shrink-0">Annuler</button>
                          </div>
                        ) : (
                          <button onClick={() => startSubAdd(cat.id)} className="flex items-center gap-1.5 text-xs text-landes-forest font-medium hover:underline">
                            <Plus className="w-3.5 h-3.5" /> Ajouter une sous-catégorie
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Gestion manuelle du diaporama hero (professionnels avec l'option
// "Encart publicitaire ciblé"), sélection et ordre entièrement contrôlés
// par l'administrateur.
function HeroSlideshowManager() {
  const [allPros, setAllPros] = useState<Professional[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setAllPros(getProfessionals().filter((p: Professional) => p.status === "active"));
    setSelectedIds(getHeroSlideshowIds());
  }, []);

  const toggle = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const move = (id: string, dir: -1 | 1) => {
    setSelectedIds(prev => {
      const idx = prev.indexOf(id);
      const next = [...prev];
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  };

  const handleSave = () => {
    saveHeroSlideshowIds(selectedIds);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const filtered = allPros.filter(p =>
    !search.trim() || p.companyName.toLowerCase().includes(search.toLowerCase())
  );
  const selectedPros = selectedIds.map(id => allPros.find(p => p.id === id)).filter(Boolean) as Professional[];

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-1 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-landes-pine">Diaporama Hero — Encarts publicitaires ciblés</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Ce diaporama s&apos;affiche dans la section d&apos;accueil du site, à droite du texte principal.
            Par défaut, il affiche automatiquement toutes les fiches actives ayant l&apos;option
            complémentaire &quot;Encart publicitaire ciblé&quot; active (repérées ci-dessous par le badge
            &quot;Option Pub&quot;). Cochez des fiches ci-dessous pour prendre la main manuellement sur la
            sélection et l&apos;ordre d&apos;affichage.
          </p>
        </div>
        <button onClick={handleSave} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm flex-shrink-0">
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Enregistré" : "Enregistrer"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
        {/* Colonne gauche : sélection */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Toutes les fiches actives</p>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une entreprise…" className="input-field pl-10 text-sm" />
          </div>
          <div className="border border-gray-100 rounded-xl max-h-80 overflow-y-auto divide-y divide-gray-50">
            {filtered.map(p => {
              const hasPubOption = (p.complementaryOptions || []).includes("pub");
              const isSelected = selectedIds.includes(p.id);
              return (
                <label key={p.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={isSelected} onChange={() => toggle(p.id)} className="w-4 h-4 accent-landes-forest flex-shrink-0" />
                  <span className="flex-1 text-sm text-gray-700 truncate">{p.companyName}</span>
                  {hasPubOption && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex-shrink-0">Option Pub</span>
                  )}
                </label>
              );
            })}
            {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Aucun résultat.</p>}
          </div>
        </div>

        {/* Colonne droite : ordre du diaporama */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Ordre du diaporama ({selectedPros.length})
          </p>
          {selectedPros.length === 0 ? (
            <p className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-6 text-center">
              Aucune fiche sélectionnée pour le moment.
            </p>
          ) : (
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-50">
              {selectedPros.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 px-3 py-2.5">
                  <span className="text-xs text-gray-400 w-5 flex-shrink-0">{i + 1}.</span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{p.companyName}</span>
                  <button onClick={() => move(p.id, -1)} disabled={i === 0} className="text-gray-400 hover:text-landes-forest disabled:opacity-30 text-xs px-1.5">▲</button>
                  <button onClick={() => move(p.id, 1)} disabled={i === selectedPros.length - 1} className="text-gray-400 hover:text-landes-forest disabled:opacity-30 text-xs px-1.5">▼</button>
                  <button onClick={() => toggle(p.id)} className="text-red-400 hover:text-red-600 text-xs px-1.5">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HeroSaveButton() {
  const [saved, setSaved] = useState(false);
  const [hasImage, setHasImage] = useState(false);

  useEffect(() => {
    const { getHeroImage } = require("@/lib/storage");
    setHasImage(!!getHeroImage());
    // Écoute les changements de localStorage
    const onStorage = () => setHasImage(!!getHeroImage());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <button
      onClick={handleSave}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
        saved
          ? "bg-green-500 text-white"
          : "bg-landes-forest text-white hover:bg-landes-pine"
      }`}
    >
      {saved ? (
        <><CheckCircle className="w-4 h-4" /> Enregistré</>
      ) : (
        <><Save className="w-4 h-4" /> Enregistrer les modifications</>
      )}
    </button>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [pros, setPros] = useState<Professional[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set(ALL_COLUMN_LABELS));
  const [migrating, setMigrating] = useState(false);
  const [migrationSummary, setMigrationSummary] = useState<string | null>(null);
  const [adminSection, setAdminSection] = useState<"pros" | "reviews" | "site" | "options" | "sirene" | "categories">("pros");
  const [categories, setCategories] = useState<CategoryRecord[]>(DEFAULT_CATEGORIES);
  const [editReview, setEditReview] = useState<Review | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusType | "">("");
  const [filterClaimed, setFilterClaimed] = useState<"" | "claimed" | "unclaimed">("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Professional>>({});
  const [showFullEditModal, setShowFullEditModal] = useState(false);
  const [fullEditForm, setFullEditForm] = useState<Partial<Professional>>({});
  const [savingFullEdit, setSavingFullEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"" | "suspend" | "delete">("");

  useEffect(() => {
    const session = getSession();
    if (session?.type === "admin") {
      setAuthenticated(true);
      getProfessionalsWithImages().then(setPros);
      setReviews(getReviews());
    }
  }, []);

  useEffect(() => { getCategoriesAsync().then(setCategories); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setLoginError(data.error || "Identifiants incorrects."); return; }
      setSession("admin");
      setAuthenticated(true);
      getProfessionalsWithImages().then(setPros);
    } catch {
      setLoginError("Erreur réseau lors de la connexion.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => { clearSession(); setAuthenticated(false); router.push("/"); };

  const refresh = () => { getProfessionalsWithImages().then(setPros); setReviews(getReviews()); };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    const label = bulkAction === "delete" ? "supprimer" : "suspendre";
    if (!confirm(`Confirmer : ${label} ${selectedIds.size} professionnel(s) ?`)) return;
    await Promise.all(Array.from(selectedIds).map(async id => {
      if (bulkAction === "delete") {
        await deleteProfessional(id);
        if (selectedPro?.id === id) setSelectedPro(null);
      } else {
        const pro = pros.find(p => p.id === id);
        if (pro) await saveProfessional({ ...pro, status: "suspended", updatedAt: new Date().toISOString() });
      }
    }));
    setSelectedIds(new Set());
    setBulkAction("");
    refresh();
  };

  const updateStatus = async (id: string, status: StatusType) => {
    const pro = pros.find((p) => p.id === id);
    if (!pro) return;
    const updated = { ...pro, status, updatedAt: new Date().toISOString(), ...(status === "active" ? { validatedAt: new Date().toISOString() } : {}) };
    await saveProfessional(updated);
    refresh();
    if (selectedPro?.id === id) setSelectedPro(updated);
  };

  // ── Migration en masse vers la base de données (étape 4) ──
  // Pousse en une fois tous les professionnels et avis actuellement en
  // localStorage vers la base Postgres, via les routes déjà utilisées par
  // la double-écriture automatique (étape 2). Sûr à relancer plusieurs
  // fois (upsert) — utile pour rattraper les fiches créées avant
  // l'activation de la base, ou après une longue coupure.
  const handleMigrateToDb = async () => {
    setMigrating(true);
    setMigrationSummary(null);
    try {
      const allPros = getProfessionals();
      const allReviews = getReviews();
      let proOk = 0, proFail = 0, reviewOk = 0, reviewFail = 0;

      for (const p of allPros) {
        try {
          const res = await fetch("/api/db/professionals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(p),
          });
          if (res.ok) proOk++; else proFail++;
        } catch { proFail++; }
      }

      for (const r of allReviews) {
        try {
          const res = await fetch("/api/db/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(r),
          });
          if (res.ok) reviewOk++; else reviewFail++;
        } catch { reviewFail++; }
      }

      setMigrationSummary(
        `✅ ${proOk}/${allPros.length} professionnels migrés, ${reviewOk}/${allReviews.length} avis migrés.` +
        (proFail || reviewFail ? ` ⚠️ ${proFail + reviewFail} échec(s) — vérifiez que la base est bien configurée (POSTGRES_URL).` : "")
      );
    } finally {
      setMigrating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer définitivement cette fiche ?")) return;
    await deleteProfessional(id);
    refresh();
    if (selectedPro?.id === id) setSelectedPro(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedPro) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    const updated = await ensureGeocoded({ ...selectedPro, ...editForm, updatedAt: new Date().toISOString() });
    saveProfessional(updated);
    refresh();
    setSelectedPro(updated);
    setEditMode(false);
    setSaving(false);
  };

  const openFullEditModal = (p: Professional) => {
    setFullEditForm({ ...p });
    setShowFullEditModal(true);
  };

  const updFull = (field: string, value: any) => setFullEditForm(prev => ({ ...prev, [field]: value }));

  const handleSaveFullEdit = async () => {
    if (!selectedPro) return;
    setSavingFullEdit(true);
    await new Promise(r => setTimeout(r, 400));
    const updated = await ensureGeocoded({ ...selectedPro, ...fullEditForm, updatedAt: new Date().toISOString() } as Professional);
    saveProfessional(updated);
    refresh();
    setSelectedPro(updated);
    setSavingFullEdit(false);
    setShowFullEditModal(false);
  };

  const filtered = pros.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !search || p.companyName.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.city.toLowerCase().includes(q);
    const matchStatus = !filterStatus || p.status === filterStatus;
    const matchClaimed = !filterClaimed || (filterClaimed === "claimed" ? !!(p as any).claimed : !(p as any).claimed);
    const matchCategory = !filterCategory || p.category === filterCategory;
    const matchSubcategory = !filterSubcategory || p.subcategory === filterSubcategory;
    return matchSearch && matchStatus && matchClaimed && matchCategory && matchSubcategory;
  });

  const stats = {
    total: pros.length,
    active: pros.filter((p) => p.status === "active").length,
    pending: pros.filter((p) => p.status === "pending").length,
    suspended: pros.filter((p) => p.status === "suspended").length,
    claimed: pros.filter((p) => !!(p as any).claimed).length,
    unclaimed: pros.filter((p) => !(p as any).claimed).length,
  };

  // LOGIN FORM
  if (!authenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-landes-pine rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-landes-pine">Administration</h1>
            <p className="text-gray-500 mt-1">Accès réservé aux gestionnaires</p>
          </div>
          <div className="card p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">Identifiant administrateur</label>
                <input type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className="input-field" autoComplete="username" required />
              </div>
              <div>
                <label className="label">Mot de passe</label>
                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="input-field" placeholder="••••••••" autoComplete="current-password" required />
              </div>
              {loginError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{loginError}</div>}
              <button type="submit" disabled={loginLoading} className="btn-primary w-full py-3.5 disabled:opacity-50">
                {loginLoading ? "Connexion…" : "Se connecter"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Bandeau statut validation */}
      {!REQUIRE_VALIDATION && (
        <div className="mb-6 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-800">Validation automatique activée</p>
            <p className="text-sm text-blue-700 mt-0.5">
              Les nouvelles inscriptions sont publiées immédiatement sans validation manuelle.
              Pour réactiver la validation, passez <code className="bg-blue-100 px-1 rounded text-xs font-mono">REQUIRE_VALIDATION</code> à <code className="bg-blue-100 px-1 rounded text-xs font-mono">true</code> dans <code className="bg-blue-100 px-1 rounded text-xs font-mono">src/lib/config.ts</code>.
            </p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-landes-pine">Administration</h1>
          <p className="text-gray-500">Gestion des professionnels inscrits</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors text-sm">
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-landes-pine">Administration</h1>
          <p className="text-gray-500">Gestion des professionnels et des avis</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors text-sm">
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-8">
        <button onClick={() => setAdminSection("pros")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${adminSection === "pros" ? "bg-landes-forest text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          <Users className="w-4 h-4" /> Professionnels
        </button>
        <button onClick={() => setAdminSection("reviews")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${adminSection === "reviews" ? "bg-landes-forest text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          <Star className="w-4 h-4" /> Avis
          {reviews.filter(r => r.status === "pending").length > 0 && (
            <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
              {reviews.filter(r => r.status === "pending").length}
            </span>
          )}
          {reviews.filter(r => r.flagged && r.status !== "rejected").length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none flex items-center gap-0.5">
              <Flag className="w-2.5 h-2.5" />{reviews.filter(r => r.flagged && r.status !== "rejected").length}
            </span>
          )}
        </button>
        <button onClick={() => setAdminSection("site")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${adminSection === "site" ? "bg-landes-forest text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          <Shield className="w-4 h-4" /> Personnalisation
        </button>
        <button onClick={() => setAdminSection("options")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${adminSection === "options" ? "bg-landes-forest text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          <CreditCard className="w-4 h-4" /> Options complémentaires
        </button>
        <button onClick={() => setAdminSection("sirene")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${adminSection === "sirene" ? "bg-landes-forest text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          <Building2 className="w-4 h-4" /> Entreprises (SIRENE)
        </button>
        <button onClick={() => setAdminSection("categories")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${adminSection === "categories" ? "bg-landes-forest text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          <Tag className="w-4 h-4" /> Catégories
        </button>
      </div>

      {/* ── Section Entreprises SIRENE ── */}
      {adminSection === "sirene" && (
        <div className="space-y-6">
          <SireneManager />
        </div>
      )}

      {/* ── Section Catégories ── */}
      {adminSection === "categories" && (
        <div className="space-y-6">
          <CategoriesManager />
        </div>
      )}

      {/* ── Section Options complémentaires ── */}
      {adminSection === "options" && (
        <div className="space-y-6">
          <OptionsManager />
        </div>
      )}

      {/* ── Section Personnalisation ── */}
      {adminSection === "site" && (
        <div className="space-y-6">
          <HeroSlideshowManager />
        </div>
      )}

      {/* ── Section Avis ── */}
      {adminSection === "reviews" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            {(["all","pending","approved","rejected","flagged"] as const).map(f => (
              <button key={f} onClick={() => {}}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors capitalize">
                {f === "all" ? `Tous (${reviews.length})` : f === "pending" ? `En attente (${reviews.filter(r=>r.status==="pending").length})` : f === "approved" ? `Approuvés (${reviews.filter(r=>r.status==="approved").length})` : f === "rejected" ? `Rejetés (${reviews.filter(r=>r.status==="rejected").length})` : `Signalés (${reviews.filter(r=>r.flagged).length})`}
              </button>
            ))}
          </div>

          {reviews.length === 0 ? (
            <div className="card p-10 text-center text-gray-400">Aucun avis reçu.</div>
          ) : (
            reviews.map(review => {
              const pro = pros.find(p => p.id === review.proId);
              return (
                <div key={review.id} className={`card p-6 space-y-4 border-l-4 ${
                  review.flagged ? "border-l-red-400" :
                  review.status === "approved" ? "border-l-green-400" :
                  review.status === "rejected" ? "border-l-gray-300" : "border-l-orange-400"
                }`}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-landes-pine text-sm">{review.firstName} {review.lastName}</p>
                        <span className="text-gray-300">·</span>
                        <p className="text-xs text-gray-400">{review.email}</p>
                        {review.verified && (
                          <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"><Shield className="w-3 h-3"/>Identité vérifiée</span>
                        )}
                        {review.flagged && <span className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full"><Flag className="w-3 h-3"/>Signalé</span>}
                      </div>
                      <p className="text-xs text-gray-400">
                        {pro ? <><span className="font-medium text-gray-600">{pro.companyName}</span> · </> : ""}
                        {new Date(review.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      <div className="flex gap-0.5 mt-1">
                        {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />)}
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                      review.status === "approved" ? "bg-green-100 text-green-700" :
                      review.status === "rejected" ? "bg-gray-100 text-gray-500" : "bg-orange-100 text-orange-600"
                    }`}>
                      {review.status === "approved" ? "✓ Approuvé" : review.status === "rejected" ? "✕ Rejeté" : "⏳ En attente"}
                    </span>
                  </div>

                  {/* Texte — éditable */}
                  {editReview?.id === review.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editReview.text}
                        onChange={e => setEditReview({ ...editReview, text: e.target.value })}
                        rows={3}
                        className="input-field resize-none text-sm w-full"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => { saveReview(editReview); setReviews(getReviews()); setEditReview(null); }}
                          className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"><Save className="w-3 h-3"/>Enregistrer</button>
                        <button onClick={() => setEditReview(null)} className="btn-secondary py-1.5 px-3 text-xs">Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-xl p-4">"{review.text}"</p>
                  )}

                  {/* Réponse pro si présente */}
                  {review.reply && (
                    <div className="bg-landes-forest/5 border border-landes-forest/20 rounded-xl p-3">
                      <p className="text-xs font-semibold text-landes-forest mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3"/>Réponse du professionnel</p>
                      <p className="text-sm text-gray-700">{review.reply}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    {review.status !== "approved" && (
                      <button onClick={() => { saveReview({ ...review, status: "approved" }); setReviews(getReviews()); }}
                        className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 font-medium transition-colors">
                        <CheckCircle className="w-3.5 h-3.5"/> Approuver
                      </button>
                    )}
                    {review.status !== "rejected" && (
                      <button onClick={() => { saveReview({ ...review, status: "rejected" }); setReviews(getReviews()); }}
                        className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 font-medium transition-colors">
                        <XCircle className="w-3.5 h-3.5"/> Rejeter
                      </button>
                    )}
                    <button onClick={() => setEditReview(review)}
                      className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 font-medium transition-colors">
                      <Edit3 className="w-3.5 h-3.5"/> Modifier
                    </button>
                    <button onClick={() => { if (confirm("Supprimer cet avis ?")) { deleteReview(review.id); setReviews(getReviews()); } }}
                      className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200 font-medium transition-colors">
                      <Trash2 className="w-3.5 h-3.5"/> Supprimer
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Section Professionnels ── */}
      {adminSection === "pros" && (<>

      {/* Boutons export / import */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-lg font-bold text-landes-pine">Professionnels inscrits</h2>
        <div className="flex gap-2 flex-wrap">

          {/* Sélection des colonnes */}
          <button
            onClick={() => setShowColumnsModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Settings2 className="w-4 h-4" /> Colonnes ({selectedColumns.size}/{ALL_COLUMN_LABELS.length})
          </button>

          {/* Export CSV */}
          <button
            onClick={() => {
              const cols = COLUMN_DEFS.filter(c => selectedColumns.has(c.label));
              if (cols.length === 0) { alert("Sélectionnez au moins une colonne avant d'exporter."); return; }
              const headers = cols.map(c => c.label);
              const rows = pros.map(p => cols.map(c => c.getValue(p)).map(v => `"${String(v).replace(/"/g, '""')}"`));
              const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
              const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `prolocal-pros-${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-landes-forest text-white rounded-xl text-sm font-medium hover:bg-landes-pine transition-colors"
          >
            <Download className="w-4 h-4" /> Exporter CSV
          </button>

          {/* Export JSON complet (toujours toutes les données, y compris images) */}
          <button
            onClick={async () => {
              const full = await getProfessionalsWithImages();
              const json = JSON.stringify(full, null, 2);
              const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `prolocal-pros-${new Date().toISOString().slice(0,10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-landes-ocean text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Exporter JSON
          </button>

          {/* Import JSON — respecte la sélection de colonnes (fusion partielle) */}
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-landes-ocean text-landes-ocean rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" /> Importer JSON
            <input type="file" accept=".json" className="hidden" onChange={async e => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const text = await file.text();
                const data: Professional[] = JSON.parse(text);
                if (!Array.isArray(data)) throw new Error("Format invalide");
                const livePros = getProfessionals();
                let imported = 0;
                let updatedCount = 0;
                let unchangedCount = 0;
                for (const pro of data) {
                  if (!pro.id || !pro.companyName) continue;
                  // Dédoublonnage : correspond d'abord par ID, puis par SIREN,
                  // puis par nom d'entreprise (insensible à la casse) — pour
                  // ne jamais créer de doublon même si les ID du fichier ne
                  // correspondent pas exactement à ceux déjà en base.
                  let existing = livePros.find(p => p.id === pro.id) ?? null;
                  if (!existing && pro.siren) {
                    const siren = pro.siren.replace(/\s/g, "");
                    existing = livePros.find(p => p.siren.replace(/\s/g, "") === siren) ?? null;
                  }
                  if (!existing) {
                    existing = livePros.find(p => p.companyName.toLowerCase().trim() === pro.companyName.toLowerCase().trim()) ?? null;
                  }
                  // Ne fusionne que les champs correspondant aux colonnes sélectionnées ;
                  // les autres champs conservent leur valeur existante (ou celle par défaut si nouvelle fiche).
                  const merged: Professional = { ...(existing ?? pro) };
                  if (selectedColumns.has("Entreprise"))          merged.companyName = pro.companyName;
                  if (selectedColumns.has("Titre de l'activité")) merged.activityTitle = pro.activityTitle;
                  if (selectedColumns.has("Catégorie"))            merged.category = pro.category;
                  if (selectedColumns.has("Sous-catégorie"))       merged.subcategory = pro.subcategory;
                  if (selectedColumns.has("Email"))                merged.email = pro.email;
                  if (selectedColumns.has("Téléphone"))             merged.phone = pro.phone;
                  if (selectedColumns.has("Whatsapp"))              merged.whatsapp = pro.whatsapp;
                  if (selectedColumns.has("SIREN"))                 merged.siren = pro.siren;
                  if (selectedColumns.has("Forme juridique"))       merged.legalForm = pro.legalForm;
                  if (selectedColumns.has("Adresse"))                merged.address = pro.address;
                  if (selectedColumns.has("Code postal"))           merged.postalCode = pro.postalCode;
                  if (selectedColumns.has("Ville"))                  merged.city = pro.city;
                  if (selectedColumns.has("Lat"))                    merged.lat = pro.lat;
                  if (selectedColumns.has("Lng"))                    merged.lng = pro.lng;
                  if (selectedColumns.has("Formule"))                merged.plan = pro.plan;
                  if (selectedColumns.has("Statut"))                 merged.status = pro.status;
                  if (selectedColumns.has("Site web"))               merged.website = pro.website;
                  if (selectedColumns.has("Service 1") || selectedColumns.has("Service 2") || selectedColumns.has("Service 3")) {
                    merged.services = pro.services;
                  }
                  if (selectedColumns.has("Description courte"))    merged.shortDescription = pro.shortDescription;
                  if (selectedColumns.has("Description longue"))   merged.description = pro.description;
                  // Champs techniques toujours conservés/complétés (non pilotés par la sélection de colonnes)
                  merged.id = existing?.id || pro.id;
                  merged.password   = existing?.password   ?? pro.password   ?? "changeme2024";
                  merged.logo       = existing?.logo       ?? pro.logo;
                  merged.banner     = existing?.banner     ?? pro.banner;
                  merged.photos     = existing?.photos     ?? pro.photos     ?? [];
                  merged.createdAt  = existing?.createdAt  ?? pro.createdAt  ?? new Date().toISOString();

                  const { updatedAt: _existingTs, ...existingNoTs } = existing || ({} as Professional);
                  const { updatedAt: _mergedTs, ...mergedNoTs } = merged;
                  const hasChanges = !existing || JSON.stringify(existingNoTs) !== JSON.stringify(mergedNoTs);

                  if (hasChanges) {
                    merged.updatedAt = new Date().toISOString();
                    saveProfessional(await ensureGeocoded(merged));
                    if (existing) updatedCount++; else imported++;
                  } else {
                    unchangedCount++;
                  }
                }
                await getProfessionalsWithImages().then(setPros);
                alert(`✅ ${imported} créé(s), ${updatedCount} mis à jour, ${unchangedCount} inchangé(s) — aucun doublon créé (colonnes sélectionnées : ${selectedColumns.size}/${ALL_COLUMN_LABELS.length}).`);
              } catch {
                alert("❌ Erreur : fichier JSON invalide.");
              }
              e.target.value = "";
            }} />
          </label>

          {/* Import CSV — respecte la sélection de colonnes */}
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" /> Importer CSV
            <input type="file" accept=".csv" className="hidden" onChange={async e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const rawText = await file.text();
              // Nettoyage : BOM, retours chariot Windows
              const text = rawText.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
              const lines = text.split("\n").filter(l => l.trim().length > 0);
              if (lines.length < 2) return;

              // Détection automatique du séparateur (; ou ,)
              const firstLine = lines[0];
              const sep = (firstLine.split(";").length >= firstLine.split(",").length) ? ";" : ",";

              // Parser CSV robuste (gère les guillemets et le séparateur détecté)
              const parseCSVLine = (line: string): string[] => {
                const result: string[] = [];
                let cur = "", inQ = false;
                for (let ci = 0; ci < line.length; ci++) {
                  const ch = line[ci];
                  if (ch === '"') { inQ = !inQ; continue; }
                  if (ch === sep && !inQ) { result.push(cur.trim()); cur = ""; continue; }
                  cur += ch;
                }
                result.push(cur.trim());
                return result;
              };

              const headers = parseCSVLine(lines[0]);
              const idxOf = (name: string) => headers.findIndex(h => h.toLowerCase().trim() === name.toLowerCase().trim());

              // Lire directement depuis localStorage (pas depuis le state React périmé)
              const livePros = getProfessionals();
              let imported = 0;
              let updatedCount = 0;
              let unchangedCount = 0;
              const malformedLines: number[] = [];

              for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const cols = parseCSVLine(line);
                // Si une valeur non protégée par des guillemets contient le
                // séparateur détecté (ex: une adresse "12 rue X, Dax" tapée
                // sans guillemets), cette ligne se retrouve avec plus (ou
                // moins) de colonnes que l'en-tête : toutes les valeurs
                // seraient alors décalées silencieusement (un email pourrait
                // atterrir dans le téléphone, etc.). On ignore la ligne
                // plutôt que d'écrire des données fausses en base.
                if (cols.length !== headers.length) {
                  malformedLines.push(i + 1);
                  continue;
                }
                // Une colonne n'est lue que si elle est à la fois présente dans le fichier
                // ET cochée dans le sélecteur de colonnes ; sinon la valeur existante est conservée.
                const rawVal = (name: string): string => (cols[idxOf(name)] ?? "").trim();
                const gatedVal = (name: string): string => selectedColumns.has(name) ? rawVal(name) : "";

                const csvId = rawVal("ID"); // l'ID sert toujours à identifier la fiche, indépendamment de la sélection
                const csvSiren = rawVal("SIREN").replace(/\s/g, "");
                const csvCompanyNameRaw = rawVal("Entreprise");

                // Dédoublonnage : correspond d'abord par ID, puis par SIREN
                // (identifiant fiable), puis par nom d'entreprise (insensible
                // à la casse) — pour qu'un import répété sans colonne "ID"
                // mette à jour les fiches déjà existantes au lieu d'en
                // recréer des doublons à chaque fois.
                let existing: Professional | null = csvId ? (livePros.find(p => p.id === csvId) ?? null) : null;
                if (!existing && csvSiren) {
                  existing = livePros.find(p => p.siren.replace(/\s/g, "") === csvSiren) ?? null;
                }
                if (!existing && csvCompanyNameRaw) {
                  existing = livePros.find(p => p.companyName.toLowerCase().trim() === csvCompanyNameRaw.toLowerCase().trim()) ?? null;
                }

                const companyName = gatedVal("Entreprise") || existing?.companyName || "";
                if (!companyName) continue;

                const id = existing?.id || csvId || generateId();

                // Normalise la catégorie (insensible à la casse)
                const csvCat = gatedVal("Catégorie");
                const categoryLabels = categories.map(c => c.label);
                const matchedCat = csvCat
                  ? (categoryLabels.find(c => c === csvCat) ?? categoryLabels.find(c => c.toLowerCase().trim() === csvCat.toLowerCase().trim()))
                  : undefined;

                const service1 = gatedVal("Service 1");
                const service2 = gatedVal("Service 2");
                const service3 = gatedVal("Service 3");
                const hasServiceColumn = selectedColumns.has("Service 1") || selectedColumns.has("Service 2") || selectedColumns.has("Service 3");

                const now = new Date().toISOString();
                const updated: Professional = {
                  ...(existing ?? {}),
                  id,
                  companyName,
                  activityTitle:    gatedVal("Titre de l'activité")  || existing?.activityTitle,
                  category:         matchedCat ?? existing?.category ?? categoryLabels[0],
                  subcategory:      gatedVal("Sous-catégorie")        || existing?.subcategory,
                  email:            gatedVal("Email")                || existing?.email            || "",
                  phone:            gatedVal("Téléphone")            || existing?.phone             || "",
                  whatsapp:         gatedVal("Whatsapp")             || existing?.whatsapp,
                  siren:            gatedVal("SIREN")                 || existing?.siren             || "000000000",
                  legalForm:        gatedVal("Forme juridique")       || existing?.legalForm         || "EI",
                  address:          gatedVal("Adresse")               || existing?.address           || "",
                  postalCode:       gatedVal("Code postal")           || existing?.postalCode        || "40000",
                  city:             gatedVal("Ville")                  || existing?.city              || "",
                  lat:              gatedVal("Lat")   ? parseFloat(gatedVal("Lat"))  : existing?.lat,
                  lng:              gatedVal("Lng")   ? parseFloat(gatedVal("Lng"))  : existing?.lng,
                  plan:             (["standard", "premium", "gold"].includes(gatedVal("Formule").toLowerCase())
                                        ? gatedVal("Formule").toLowerCase()
                                        : existing?.plan || "standard") as Professional["plan"],
                  status:           (["pending", "active", "suspended", "rejected"].includes(gatedVal("Statut").toLowerCase())
                                        ? gatedVal("Statut").toLowerCase()
                                        : existing?.status || "active") as Professional["status"],
                  website:          gatedVal("Site web")               || existing?.website,
                  services:         hasServiceColumn
                    ? [service1, service2, service3].filter(s => s.trim())
                    : existing?.services,
                  shortDescription: gatedVal("Description courte")    || existing?.shortDescription,
                  description:      gatedVal("Description longue")   || existing?.description,
                  password:         existing?.password   || "changeme2024",
                  logo:             gatedVal("Logo (URL)")     || existing?.logo,
                  banner:           gatedVal("Bannière (URL)") || existing?.banner,
                  photos:           existing?.photos     || [],
                  createdAt:        existing?.createdAt  || now,
                  updatedAt:        now,
                };
                // N'enregistre que si quelque chose a réellement changé —
                // évite de créer une mise à jour inutile (et un nouvel
                // updatedAt) quand la fiche importée est identique à
                // l'existante.
                const { updatedAt: _existingUpdatedAt, ...existingWithoutTimestamp } = existing || ({} as Professional);
                const { updatedAt: _newUpdatedAt, ...updatedWithoutTimestamp } = updated;
                const hasChanges = !existing || JSON.stringify(existingWithoutTimestamp) !== JSON.stringify(updatedWithoutTimestamp);

                if (hasChanges) {
                  saveProfessional(await ensureGeocoded(updated));
                  if (existing) updatedCount++; else imported++;
                } else {
                  unchangedCount++;
                }
              }

              // Rechargement complet depuis localStorage
              const fresh = await getProfessionalsWithImages();
              setPros(fresh);
              setReviews(getReviews());
              const malformedMsg = malformedLines.length > 0
                ? `\n⚠️ ${malformedLines.length} ligne(s) ignorée(s) car mal formée(s) (nombre de colonnes incohérent avec l'en-tête — vérifiez les virgules/points-virgules non protégés par des guillemets) : lignes ${malformedLines.join(", ")}.`
                : "";
              alert(`✅ ${imported} créé(s), ${updatedCount} mis à jour, ${unchangedCount} inchangé(s) — aucun doublon créé (colonnes sélectionnées : ${selectedColumns.size}/${ALL_COLUMN_LABELS.length}).${malformedMsg}`);
              e.target.value = "";
            }} />
          </label>

          {/* Migration vers la base de données (étape 4) */}
          <button
            onClick={handleMigrateToDb}
            disabled={migrating}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-landes-ocean/40 text-landes-ocean rounded-xl text-sm font-medium hover:bg-landes-ocean hover:text-white transition-colors disabled:opacity-50"
          >
            {migrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            {migrating ? "Migration…" : "Migrer vers la base de données"}
          </button>
        </div>

        {migrationSummary && (
          <p className="text-xs text-landes-ocean bg-landes-ocean/5 border border-landes-ocean/20 rounded-lg px-3 py-2 mb-4">
            {migrationSummary}
          </p>
        )}
      </div>

      {/* Modale de sélection des colonnes */}
      {showColumnsModal && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4" onClick={() => setShowColumnsModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <p className="font-bold text-landes-pine">Colonnes à exporter / importer</p>
                <p className="text-xs text-gray-500 mt-0.5">S'applique à l'export CSV, ainsi qu'à l'import CSV et JSON.</p>
              </div>
              <button onClick={() => setShowColumnsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 flex-shrink-0">
              <button onClick={() => setSelectedColumns(new Set(ALL_COLUMN_LABELS))}
                className="text-xs font-medium text-landes-forest hover:underline">Tout sélectionner</button>
              <span className="text-gray-300">·</span>
              <button onClick={() => setSelectedColumns(new Set())}
                className="text-xs font-medium text-gray-500 hover:underline">Tout désélectionner</button>
            </div>

            <div className="overflow-y-auto px-6 py-4 space-y-2 flex-1">
              {ALL_COLUMN_LABELS.map(label => (
                <label key={label} className="flex items-center gap-3 py-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedColumns.has(label)}
                    onChange={e => {
                      const next = new Set(selectedColumns);
                      if (e.target.checked) next.add(label); else next.delete(label);
                      setSelectedColumns(next);
                    }}
                    className="w-4 h-4 accent-landes-forest cursor-pointer flex-shrink-0"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                  {label === "ID" && <span className="text-[10px] text-gray-400 ml-auto">toujours utilisé pour l'import</span>}
                </label>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setShowColumnsModal(false)} className="btn-primary w-full py-2.5 text-sm">
                Valider ({selectedColumns.size}/{ALL_COLUMN_LABELS.length} colonnes sélectionnées)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total", value: stats.total, icon: Users, color: "text-gray-700" },
          { label: "Actifs", value: stats.active, icon: CheckCircle, color: "text-green-600" },
          { label: "En attente", value: stats.pending, icon: Clock, color: "text-orange-500" },
          { label: "Suspendus", value: stats.suspended, icon: XCircle, color: "text-red-500" },
          { label: "Non revendiquées", value: stats.unclaimed, icon: UserX, color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <s.icon className={`w-8 h-8 ${s.color}`} />
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* List */}
        <div className="flex-1">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="input-field pl-10" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as StatusType | "")} className="input-field sm:w-40">
              <option value="">Tous statuts</option>
              <option value="active">Actifs</option>
              <option value="pending">En attente</option>
              <option value="suspended">Suspendus</option>
              <option value="rejected">Refusés</option>
            </select>
            <select value={filterClaimed} onChange={(e) => setFilterClaimed(e.target.value as "" | "claimed" | "unclaimed")} className="input-field sm:w-44">
              <option value="">Revendication : toutes</option>
              <option value="claimed">Revendiquées</option>
              <option value="unclaimed">Non revendiquées</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setFilterSubcategory(""); }}
              className="input-field sm:w-48"
            >
              <option value="">Toutes catégories</option>
              {categories.map((c) => <option key={c.id} value={c.label}>{c.label}</option>)}
            </select>
            <select
              value={filterSubcategory}
              onChange={(e) => setFilterSubcategory(e.target.value)}
              disabled={!filterCategory || !categories.find((c) => c.label === filterCategory)?.subcategories.length}
              className="input-field sm:w-48 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <option value="">Toutes sous-catégories</option>
              {filterCategory && categories.find((c) => c.label === filterCategory)?.subcategories.map((s) => <option key={s.id} value={s.label}>{s.label}</option>)}
            </select>
          </div>

          {/* Barre d'actions groupées */}
          <div className={`flex items-center gap-3 mb-4 p-3 rounded-xl border transition-all ${selectedIds.size > 0 ? "bg-landes-forest/5 border-landes-sage/40" : "bg-gray-50 border-gray-100"}`}>
            <input
              type="checkbox"
              className="w-4 h-4 accent-landes-forest cursor-pointer"
              checked={filtered.length > 0 && selectedIds.size === filtered.length}
              ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < filtered.length; }}
              onChange={e => {
                if (e.target.checked) setSelectedIds(new Set(filtered.map(p => p.id)));
                else setSelectedIds(new Set());
              }}
            />
            <span className="text-sm text-gray-600 min-w-0 flex-1">
              {selectedIds.size > 0
                ? <strong className="text-landes-pine">{selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}</strong>
                : <span className="text-gray-400">Sélectionner tout</span>
              }
            </span>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={bulkAction}
                  onChange={e => setBulkAction(e.target.value as "" | "suspend" | "delete")}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-landes-forest"
                >
                  <option value="">Choisir une action…</option>
                  <option value="suspend">Suspendre</option>
                  <option value="delete">Supprimer</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    bulkAction === "delete"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-landes-forest text-white hover:bg-landes-pine"
                  }`}
                >
                  Appliquer
                </button>
                <button
                  onClick={() => { setSelectedIds(new Set()); setBulkAction(""); }}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="card p-8 text-center text-gray-500">Aucun professionnel trouvé</div>
            ) : filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => { setSelectedPro(p); setEditMode(false); setEditForm(p); }}
                className={`card p-4 cursor-pointer hover:shadow-md transition-all ${selectedPro?.id === p.id ? "ring-2 ring-landes-forest" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Checkbox sélection */}
                    <input
                      type="checkbox"
                      className="w-4 h-4 mt-1 accent-landes-forest cursor-pointer flex-shrink-0"
                      checked={selectedIds.has(p.id)}
                      onClick={e => e.stopPropagation()}
                      onChange={e => {
                        const next = new Set(selectedIds);
                        if (e.target.checked) next.add(p.id);
                        else next.delete(p.id);
                        setSelectedIds(next);
                      }}
                    />
                    <div className="w-10 h-10 bg-landes-forest/10 rounded-lg flex items-center justify-center text-landes-forest font-bold text-sm flex-shrink-0">
                      {p.companyName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{p.companyName}</p>
                      <p className="text-xs text-gray-500 truncate">{p.email}</p>
                      <p className="text-xs text-gray-400">{p.city} — {p.category}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <StatusBadge status={p.status} />
                    <PlanBadge plan={p.plan} />
                    {(p as any).claimed ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                        <UserCheck className="w-3 h-3" /> Revendiquée
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                        <UserX className="w-3 h-3" /> Non revendiquée
                      </span>
                    )}
                  </div>
                </div>

                {p.status === "pending" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => updateStatus(p.id, "active")} className="flex-1 text-xs bg-green-600 text-white py-1.5 rounded-lg font-medium hover:bg-green-700 transition-colors">
                      ✓ Valider
                    </button>
                    <button onClick={() => updateStatus(p.id, "rejected")} className="flex-1 text-xs bg-red-100 text-red-700 py-1.5 rounded-lg font-medium hover:bg-red-200 transition-colors">
                      ✗ Refuser
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selectedPro && (
          <div className="lg:w-96 card p-6 h-fit sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-landes-pine">Détail de la fiche</h2>
              <div className="flex gap-2">
                <button onClick={() => openFullEditModal(selectedPro)} title="Modifier tous les champs (formulaire complet)"
                  className="p-1.5 rounded-lg text-sm bg-landes-ocean/10 text-landes-ocean hover:bg-landes-ocean/20">
                  <Settings2 className="w-4 h-4" />
                </button>
                <button onClick={() => setEditMode(!editMode)} className={`p-1.5 rounded-lg text-sm ${editMode ? "bg-gray-200 text-gray-600" : "bg-landes-forest/10 text-landes-forest"}`}>
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedPro(null)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {editMode ? (
                <>
                  {[
                    { label: "Nom entreprise", field: "companyName" },
                    { label: "Téléphone", field: "phone" },
                    { label: "Adresse", field: "address" },
                    { label: "Ville", field: "city" },
                  ].map(({ label, field }) => (
                    <div key={field}>
                      <label className="label">{label}</label>
                      <input value={(editForm as any)[field] || ""} onChange={(e) => setEditForm((prev) => ({ ...prev, [field]: e.target.value }))} className="input-field" />
                    </div>
                  ))}
                  <div>
                    <label className="label">Catégorie</label>
                    <select value={editForm.category || ""} onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))} className="input-field">
                      {categories.map((c) => <option key={c.id} value={c.label}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Formule</label>
                    <select value={editForm.plan || ""} onChange={(e) => setEditForm((prev) => ({ ...prev, plan: e.target.value as any }))} className="input-field">
                      {PLANS.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.price}€</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea value={editForm.description || ""} onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))} className="input-field h-20 resize-none" />
                  </div>
                  <button onClick={handleSaveEdit} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Enregistrement..." : "Sauvegarder"}
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-2 text-sm">
                    {[
                      ["SIREN", selectedPro.siren],
                      ["Forme juridique", selectedPro.legalForm],
                      ["Catégorie", selectedPro.category],
                      ["Email", selectedPro.email],
                      ["Téléphone", selectedPro.phone],
                      ["Adresse", `${selectedPro.address}, ${selectedPro.city} ${selectedPro.postalCode}`],
                      ["Inscrit le", new Date(selectedPro.createdAt).toLocaleDateString("fr-FR")],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2 py-2 border-b border-gray-50">
                        <span className="text-gray-500">{k}</span>
                        <span className="font-medium text-gray-800 text-right">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Status actions */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Actions</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedPro.status !== "active" && (
                        <button onClick={() => updateStatus(selectedPro.id, "active")} className="text-xs bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700">✓ Activer</button>
                      )}
                      {selectedPro.status !== "suspended" && (
                        <button onClick={() => updateStatus(selectedPro.id, "suspended")} className="text-xs bg-orange-100 text-orange-700 py-2 rounded-lg font-medium hover:bg-orange-200">⏸ Suspendre</button>
                      )}
                      {selectedPro.status !== "rejected" && (
                        <button onClick={() => updateStatus(selectedPro.id, "rejected")} className="text-xs bg-red-100 text-red-700 py-2 rounded-lg font-medium hover:bg-red-200">✗ Refuser</button>
                      )}
                      <button onClick={() => handleDelete(selectedPro.id)} className="text-xs bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-1">
                        <Trash2 className="w-3 h-3" /> Supprimer
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modale d'édition complète (tous les champs du formulaire d'inscription) ── */}
      {showFullEditModal && selectedPro && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowFullEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <p className="font-bold text-landes-pine text-lg">Modifier la fiche — {selectedPro.companyName}</p>
              <button onClick={() => setShowFullEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Formule — détermine quels champs sont disponibles ci-dessous */}
              <div>
                <h3 className="text-sm font-bold text-landes-pine bg-landes-forest/8 border-l-4 border-landes-forest px-3 py-2 rounded-r-lg mb-3">Formule</h3>
                <select value={fullEditForm.plan || ""} onChange={e => updFull("plan", e.target.value)} className="input-field">
                  {PLANS.map(p => <option key={p.id} value={p.id}>{p.name} — {p.price}€</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Les sections ci-dessous (photos, horaires, services…) s&apos;adaptent automatiquement à la formule sélectionnée, comme dans le tableau de bord du professionnel.
                </p>
              </div>

              {/* Options complémentaires */}
              <div>
                <h3 className="text-sm font-bold text-landes-pine bg-landes-forest/8 border-l-4 border-landes-forest px-3 py-2 rounded-r-lg mb-3">Options complémentaires actives</h3>
                <p className="text-xs text-gray-400 mb-2">
                  Reflète normalement le statut réel des abonnements Stripe du professionnel. À corriger
                  manuellement ici uniquement en cas de décalage constaté (ex: option activée depuis le
                  tableau de bord mais non reflétée ici).
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: "pub", label: "Encart publicitaire ciblé" },
                    { id: "seo", label: "Service de rédaction SEO" },
                    { id: "crm", label: "Gestion prospects/clients" },
                  ].map(opt => {
                    const current: string[] = fullEditForm.complementaryOptions || [];
                    const checked = current.includes(opt.id);
                    return (
                      <label key={opt.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            const next = e.target.checked
                              ? [...current, opt.id]
                              : current.filter(id => id !== opt.id);
                            updFull("complementaryOptions", next);
                          }}
                          className="w-4 h-4 accent-landes-forest"
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Entreprise */}
              <div>
                <h3 className="text-sm font-bold text-landes-pine bg-landes-forest/8 border-l-4 border-landes-forest px-3 py-2 rounded-r-lg mb-3">Informations de l&apos;entreprise</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nom de l&apos;entreprise *</label>
                    <input value={fullEditForm.companyName || ""} onChange={e => updFull("companyName", e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Numéro SIREN</label>
                    <input value={fullEditForm.siren || ""} onChange={e => updFull("siren", e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Forme juridique</label>
                    <select value={fullEditForm.legalForm || ""} onChange={e => updFull("legalForm", e.target.value)} className="input-field">
                      <option value="">Sélectionner…</option>
                      {["Auto-entrepreneur","EI","EURL","SARL","SAS","SASU","SA","SCP","Association","Autre"].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">N° TVA intracommunautaire</label>
                    <input value={fullEditForm.vatNumber || ""} onChange={e => updFull("vatNumber", e.target.value)} className="input-field" placeholder="FR12345678901" />
                  </div>
                  <div>
                    <label className="label">Catégorie</label>
                    <select value={fullEditForm.category || ""} onChange={e => { updFull("category", e.target.value); updFull("subcategory", ""); }} className="input-field">
                      {categories.map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Sous-catégorie</label>
                    <select value={fullEditForm.subcategory || ""} onChange={e => updFull("subcategory", e.target.value)} disabled={!fullEditForm.category || !categories.find(c => c.label === fullEditForm.category)?.subcategories.length} className="input-field disabled:bg-gray-50 disabled:text-gray-400">
                      <option value="">Sélectionner…</option>
                      {fullEditForm.category && categories.find(c => c.label === fullEditForm.category)?.subcategories.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Titre de l&apos;activité</label>
                    <input value={fullEditForm.activityTitle || ""} onChange={e => updFull("activityTitle", e.target.value)} className="input-field" maxLength={250} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Description courte <span className="text-gray-400 font-normal text-xs">(150 max.)</span></label>
                    <textarea value={fullEditForm.shortDescription || ""} onChange={e => updFull("shortDescription", e.target.value)} rows={2} maxLength={150} className="input-field resize-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Description longue</label>
                    <RichTextEditor value={fullEditForm.description || ""} onChange={v => updFull("description", v)} />
                  </div>
                </div>
              </div>

              {/* Identité visuelle */}
              <div>
                <h3 className="text-sm font-bold text-landes-pine bg-landes-forest/8 border-l-4 border-landes-forest px-3 py-2 rounded-r-lg mb-3">Identité visuelle</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AdminImageUploader label="Logo" value={fullEditForm.logo} onChange={v => updFull("logo", v)} aspect="square" />
                  <AdminImageUploader label="Bannière" value={fullEditForm.banner} onChange={v => updFull("banner", v)} aspect="banner" />
                </div>
              </div>

              {/* Coordonnées & Accès */}
              <div>
                <h3 className="text-sm font-bold text-landes-pine bg-landes-forest/8 border-l-4 border-landes-forest px-3 py-2 rounded-r-lg mb-3">Informations dirigeant - Coordonnées &amp; Accès</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Prénom</label>
                    <input value={fullEditForm.firstName || ""} onChange={e => updFull("firstName", e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Nom</label>
                    <input value={fullEditForm.lastName || ""} onChange={e => updFull("lastName", e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Email de connexion</label>
                    <input type="email" value={fullEditForm.email || ""} onChange={e => updFull("email", e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Email professionnel (affiché)</label>
                    <input type="email" value={fullEditForm.professionalEmail || ""} onChange={e => updFull("professionalEmail", e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Téléphone</label>
                    <input value={fullEditForm.phone || ""} onChange={e => updFull("phone", e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="label">WhatsApp</label>
                    <input value={fullEditForm.whatsapp || ""} onChange={e => updFull("whatsapp", e.target.value)} className="input-field" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Adresse</label>
                    <input value={fullEditForm.address || ""} onChange={e => updFull("address", e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Code postal</label>
                    <input value={fullEditForm.postalCode || ""} onChange={e => updFull("postalCode", e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Ville</label>
                    <input value={fullEditForm.city || ""} onChange={e => updFull("city", e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Site web</label>
                    <input value={fullEditForm.website || ""} onChange={e => updFull("website", e.target.value)} className="input-field" placeholder="https://" />
                  </div>
                  <div>
                    <label className="label">Instagram</label>
                    <input value={fullEditForm.socialLink || ""} onChange={e => updFull("socialLink", e.target.value)} className="input-field" placeholder="https://" />
                  </div>
                  <div>
                    <label className="label">Facebook</label>
                    <input value={fullEditForm.facebookLink || ""} onChange={e => updFull("facebookLink", e.target.value)} className="input-field" placeholder="https://" />
                  </div>
                  <div>
                    <label className="label">TikTok</label>
                    <input value={fullEditForm.tiktokLink || ""} onChange={e => updFull("tiktokLink", e.target.value)} className="input-field" placeholder="https://" />
                  </div>
                </div>
              </div>

              {/* Services — masqué pour Standard, 1 service pour Premium, 3 pour Gold (comme dans le dashboard pro) */}
              {fullEditForm.plan !== "standard" && (
                <div>
                  <h3 className="text-sm font-bold text-landes-pine bg-landes-forest/8 border-l-4 border-landes-forest px-3 py-2 rounded-r-lg mb-3">
                    Services mis en avant <span className="text-gray-400 font-normal">({fullEditForm.plan === "gold" ? "3 max — formule Gold" : "1 max — formule Premium"})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Array.from({ length: fullEditForm.plan === "gold" ? 3 : 1 }).map((_, i) => (
                      <input key={i} value={(fullEditForm.services || [])[i] || ""}
                        onChange={e => {
                          const next = [...(fullEditForm.services || ["", "", ""])];
                          next[i] = e.target.value;
                          updFull("services", next);
                        }}
                        className="input-field" placeholder={`Service ${i + 1}`} maxLength={30} />
                    ))}
                  </div>
                </div>
              )}

              {/* Photos — masqué pour Standard (comme dans le dashboard pro) */}
              {fullEditForm.plan !== "standard" && (
                <div>
                  <h3 className="text-sm font-bold text-landes-pine bg-landes-forest/8 border-l-4 border-landes-forest px-3 py-2 rounded-r-lg mb-3">Photos d&apos;entreprise</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {[0, 1, 2, 3, 4].map(i => (
                      <AdminImageUploader key={i} label={`Photo ${i + 1}`}
                        value={(fullEditForm.photos || [])[i]}
                        onChange={v => {
                          const next = [...(fullEditForm.photos || [])];
                          if (v) next[i] = v; else next.splice(i, 1);
                          updFull("photos", next.filter(Boolean));
                        }}
                        aspect="square" />
                    ))}
                  </div>
                </div>
              )}

              {/* Horaires — masqué pour Standard (comme dans le dashboard pro) */}
              {fullEditForm.plan !== "standard" && (
                <div>
                  <h3 className="text-sm font-bold text-landes-pine bg-landes-forest/8 border-l-4 border-landes-forest px-3 py-2 rounded-r-lg mb-3">Horaires d&apos;ouverture</h3>
                  <OpeningHoursEditor
                    value={fullEditForm.openingHours || ({} as OpeningHours)}
                    onChange={h => updFull("openingHours", h)}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
              <button onClick={() => setShowFullEditModal(false)} className="btn-secondary px-5 py-2.5 text-sm">Annuler</button>
              <button onClick={handleSaveFullEdit} disabled={savingFullEdit} className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
                {savingFullEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingFullEdit ? "Enregistrement…" : "Enregistrer toutes les modifications"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>)}
    </div>
  );
}
