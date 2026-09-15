import { Professional } from "@/types";

const STORAGE_KEY         = "prolocal_professionals";
const ADMIN_KEY           = "prolocal_admin";
const SESSION_KEY         = "prolocal_session";
const IDB_DB_NAME         = "prolocal_images";
const IDB_STORE           = "images";
const IDB_VERSION         = 1;

const DEFAULT_ADMIN = { email: "admin@prolocal-landes.fr", password: "Admin2024!" };

// ── localStorage helper ────────────────────────────────────────

function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    if (e instanceof DOMException) {
      console.warn(`[storage] QuotaExceeded for key "${key}"`);
    }
    return false;
  }
}

// ── IndexedDB for images (logos, banners, photos) ─────────────
// Stockage des images dans IndexedDB pour éviter le quota localStorage

let _idb: IDBDatabase | null = null;

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (_idb) { resolve(_idb); return; }
    const req = indexedDB.open(IDB_DB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => { _idb = req.result; resolve(_idb); };
    req.onerror  = () => reject(req.error);
  });
}

async function idbSet(key: string, value: string | null): Promise<void> {
  try {
    const db = await openIDB();
    const tx  = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    if (value === null) {
      store.delete(key);
    } else {
      store.put(value, key);
    }
    return new Promise((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror    = () => rej(tx.error);
    });
  } catch (e) {
    // Fallback silencieux si IndexedDB indisponible
    console.warn("[storage] IDB set failed:", e);
  }
}

async function idbGet(key: string): Promise<string | undefined> {
  try {
    const db = await openIDB();
    const tx  = db.transaction(IDB_STORE, "readonly");
    const store = tx.objectStore(IDB_STORE);
    const req = store.get(key);
    return new Promise((res, rej) => {
      req.onsuccess = () => res(req.result ?? undefined);
      req.onerror   = () => rej(req.error);
    });
  } catch {
    return undefined;
  }
}

// ── Image store : logo / banner / photos dans IndexedDB ────────

function imgKey(proId: string, type: string) {
  return `img_${proId}_${type}`;
}

export async function saveImageAsync(proId: string, type: string, data: string | undefined): Promise<void> {
  await idbSet(imgKey(proId, type), data ?? null);
}

export async function loadImageAsync(proId: string, type: string): Promise<string | undefined> {
  return idbGet(imgKey(proId, type));
}

export async function savePhotosAsync(proId: string, photos: string[] | undefined): Promise<void> {
  for (let i = 0; i < 5; i++) await idbSet(imgKey(proId, `photo${i}`), null);
  if (!photos?.length) return;
  for (let i = 0; i < Math.min(photos.length, 5); i++) {
    await idbSet(imgKey(proId, `photo${i}`), photos[i]);
  }
}

export async function loadPhotosAsync(proId: string): Promise<string[] | undefined> {
  const out: string[] = [];
  for (let i = 0; i < 5; i++) {
    const v = await idbGet(imgKey(proId, `photo${i}`));
    if (v) out.push(v);
  }
  return out.length ? out : undefined;
}

export async function deleteImagesAsync(proId: string): Promise<void> {
  await idbSet(imgKey(proId, "logo"),   null);
  await idbSet(imgKey(proId, "banner"), null);
  for (let i = 0; i < 5; i++) await idbSet(imgKey(proId, `photo${i}`), null);
}

// Rehydrate async : injecte images depuis IndexedDB
export async function rehydrateAsync(pro: Professional): Promise<Professional> {
  const [logo, banner, photos] = await Promise.all([
    loadImageAsync(pro.id, "logo"),
    loadImageAsync(pro.id, "banner"),
    loadPhotosAsync(pro.id),
  ]);
  return {
    ...pro,
    logo:   logo   ?? pro.logo,
    banner: banner ?? pro.banner,
    photos: photos ?? pro.photos,
  };
}

// ── Professionals ─────────────────────────────────────────────
// Les métadonnées (sans images) dans localStorage — léger et fiable

function getRawProfessionals(): Professional[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try { return JSON.parse(data); } catch { return []; }
  }
  // Premier lancement : liste vide (aucune donnée de démonstration)
  return [];
}

export function getProfessionals(): Professional[] {
  return getRawProfessionals();
}

/**
 * Retourne tous les professionnels avec leurs images, en donnant la
 * priorité à la base de données (accessible depuis n'importe quel
 * navigateur/appareil) — avec repli et fusion sur les données locales
 * pour ne jamais rien perdre.
 *
 * ⚠️ Correctif important : cette fonction est utilisée par TOUTES les
 * pages publiques (catégories, sous-catégories, villes, recherche,
 * carrousel d'accueil...). Avant ce correctif, elle ne lisait QUE le
 * localStorage — une fiche fraîchement importée en CSV ou ajoutée
 * manuellement depuis l'admin (et bien répliquée en base) restait donc
 * invisible sur toutes ces pages dans un nouveau navigateur/fenêtre
 * privée, sans la moindre erreur (ce n'était pas un échec, juste une
 * lecture qui n'allait jamais chercher la base).
 */
export async function getProfessionalsWithImages(): Promise<Professional[]> {
  const local = getRawProfessionals();

  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/db/professionals");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.professionals) && data.professionals.length > 0) {
          // Fusion : base en priorité (source de vérité cross-appareil),
          // complétée par les fiches uniquement locales (pas encore
          // répliquées en base — jamais de perte de données pour autant).
          const dbIds = new Set(data.professionals.map((p: Professional) => p.id));
          const localOnly = await Promise.all(
            local.filter(p => !dbIds.has(p.id)).map(rehydrateAsync)
          );
          return [...data.professionals, ...localOnly];
        }
      }
    } catch {
      // Réseau indisponible ou base non configurée : repli silencieux
      // sur le localStorage ci-dessous, comportement inchangé.
    }
  }

  return Promise.all(local.map(rehydrateAsync));
}

export function saveProfessional(pro: Professional): void {
  // Séparer les images du reste
  const { logo, banner, photos, ...rest } = pro;

  // Sauvegarder les images dans IndexedDB (async, non bloquant)
  saveImageAsync(pro.id, "logo",   logo   || undefined);
  saveImageAsync(pro.id, "banner", banner || undefined);
  savePhotosAsync(pro.id, photos?.length ? photos : undefined);

  // Sauvegarder les métadonnées sans images dans localStorage
  const lean: Professional = { ...rest, logo: undefined, banner: undefined, photos: undefined };
  const pros = getRawProfessionals().map(p => ({ ...p, logo: undefined, banner: undefined, photos: undefined }));
  const idx = pros.findIndex(p => p.id === lean.id);
  if (idx >= 0) { pros[idx] = lean; } else { pros.push(lean); }

  if (!safeSet(STORAGE_KEY, JSON.stringify(pros))) {
    console.warn("[storage] Failed to save professionals list.");
  }

  // ── Étape 2 de la migration base de données : double-écriture ──
  // Reflète également la fiche vers la base Postgres (si configurée), en
  // plus du localStorage qui reste la source de vérité pour l'instant.
  // Entièrement non-bloquant : un échec (base non configurée, hors-ligne,
  // etc.) n'affecte jamais le fonctionnement normal du site.
  mirrorProfessionalToDb(pro);
}

/** Réplique une fiche professionnelle vers la base (fire-and-forget, jamais bloquant). */
/**
 * Réplique une fiche professionnelle vers la base (fire-and-forget, jamais
 * bloquant). Exportée pour être réutilisable en dehors de saveProfessional()
 * — notamment pour la synchronisation à la connexion (étape 4) et la
 * migration en masse depuis l'admin, sans avoir besoin de réécrire dans
 * localStorage ni de retoucher les images à chaque fois.
 */
export function mirrorProfessionalToDb(pro: Professional): void {
  if (typeof window === "undefined") return;
  fetch("/api/db/professionals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pro),
  }).then(async (res) => {
    // Ne bloque jamais l'expérience, mais rend l'échec visible en console
    // (auparavant totalement silencieux — une fiche pouvait sembler
    // enregistrée avec succès en local tout en échouant en base, sans
    // aucun moyen de le savoir, notamment pour un import CSV ou un ajout
    // manuel depuis l'admin avec des champs incomplets).
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error(`[db-mirror] Échec de la réplication en base pour "${pro.companyName}" (${pro.id}) :`, body.error || res.status);
    }
  }).catch((err) => {
    console.error(`[db-mirror] Erreur réseau lors de la réplication en base pour "${pro.companyName}" (${pro.id}) :`, err);
  });
}

export function deleteProfessional(id: string): void {
  deleteImagesAsync(id);
  const pros = getRawProfessionals()
    .map(p => ({ ...p, logo: undefined, banner: undefined, photos: undefined }))
    .filter(p => p.id !== id);
  safeSet(STORAGE_KEY, JSON.stringify(pros));

  // Étape 2 — reflète la suppression vers la base également
  if (typeof window !== "undefined") {
    fetch(`/api/db/professionals/${id}`, { method: "DELETE" }).catch(() => {});
  }
}

export function getProfessionalById(id: string): Professional | null {
  return getRawProfessionals().find(p => p.id === id) ?? null;
}

export async function getProfessionalByIdWithImages(id: string): Promise<Professional | null> {
  const p = getRawProfessionals().find(p => p.id === id);
  if (!p) return null;
  return rehydrateAsync(p);
}

export function getProfessionalByEmail(email: string): Professional | null {
  return getRawProfessionals().find(p => p.email === email) ?? null;
}

/** Génère un identifiant numérique à 6 chiffres, unique parmi les fiches existantes. */
export function generateId(): string {
  const existingIds = new Set(getRawProfessionals().map(p => p.id));
  let id: string;
  do {
    id = String(Math.floor(100000 + Math.random() * 900000));
  } while (existingIds.has(id));
  return id;
}

// ── Session ───────────────────────────────────────────────────
// Utilise localStorage pour persister la session entre les onglets
// La session expire après 7 jours

const SESSION_TTL = 7 * 24 * 3600 * 1000; // 7 jours

export function setSession(type: "pro" | "admin", id?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ type, id, ts: Date.now() }));
  // L'événement "storage" du navigateur ne se déclenche jamais dans l'onglet
  // qui vient d'écrire (seulement dans les autres onglets ouverts) — sans cet
  // événement personnalisé, le Navbar ne détecterait la connexion qu'après un
  // rechargement complet de la page.
  window.dispatchEvent(new Event("prolocal-session-changed"));
}

export function getSession(): { type: "pro" | "admin"; id?: string } | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    // Expiration après 7 jours
    if (Date.now() - parsed.ts > SESSION_TTL) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("prolocal-session-changed"));
}

// ── Admin ─────────────────────────────────────────────────────

export function checkAdminCredentials(email: string, password: string): boolean {
  const stored = localStorage.getItem(ADMIN_KEY);
  const admin = stored ? JSON.parse(stored) : DEFAULT_ADMIN;
  return admin.email === email && admin.password === password;
}

// ── Appointments ──────────────────────────────────────────────
const APPT_KEY = "prolocal_appointments";

export function getAppointments(): import("@/types").Appointment[] {
  if (typeof window === "undefined") return [];
  const d = localStorage.getItem(APPT_KEY);
  return d ? JSON.parse(d) : [];
}

export function getAppointmentsByPro(proId: string): import("@/types").Appointment[] {
  return getAppointments().filter(a => a.professionalId === proId);
}

export function saveAppointment(appt: import("@/types").Appointment): void {
  const all = getAppointments();
  const idx = all.findIndex(a => a.id === appt.id);
  if (idx >= 0) { all[idx] = appt; } else { all.push(appt); }
  safeSet(APPT_KEY, JSON.stringify(all));
}

export function deleteAppointment(id: string): void {
  safeSet(APPT_KEY, JSON.stringify(getAppointments().filter(a => a.id !== id)));
}

export function getBookedSlots(proId: string, date: string): string[] {
  return getAppointments()
    .filter(a => a.professionalId === proId && a.date === date && a.status !== "cancelled")
    .map(a => a.time);
}

// ── Blocked dates ─────────────────────────────────────────────
const BLOCKED_KEY = "prolocal_blocked_dates";

export function getBlockedDates(): import("@/types").BlockedDate[] {
  if (typeof window === "undefined") return [];
  const d = localStorage.getItem(BLOCKED_KEY);
  return d ? JSON.parse(d) : [];
}

export function getBlockedDatesByPro(proId: string): import("@/types").BlockedDate[] {
  return getBlockedDates().filter(b => b.professionalId === proId);
}

export function saveBlockedDate(blocked: import("@/types").BlockedDate): void {
  const all = getBlockedDates();
  const idx = all.findIndex(b => b.id === blocked.id);
  if (idx >= 0) { all[idx] = blocked; } else { all.push(blocked); }
  safeSet(BLOCKED_KEY, JSON.stringify(all));
}

export function deleteBlockedDate(id: string): void {
  safeSet(BLOCKED_KEY, JSON.stringify(getBlockedDates().filter(b => b.id !== id)));
}

export function isDateBlocked(proId: string, date: string, time?: string): boolean {
  const blocked = getBlockedDatesByPro(proId).filter(b => b.date === date);
  if (!blocked.length) return false;
  return blocked.some(b => {
    if (b.allDay) return true;
    if (!time || !b.startTime || !b.endTime) return false;
    const [th, tm] = time.split(":").map(Number);
    const [sh, sm] = b.startTime.split(":").map(Number);
    const [eh, em] = b.endTime.split(":").map(Number);
    const t = th * 60 + tm;
    return t >= sh * 60 + sm && t < eh * 60 + em;
  });
}

// ── Reviews ──────────────────────────────────────────────────────
const REVIEWS_KEY = "prolocal_reviews";
import type { Review } from "@/types";

export function getReviews(): Review[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(REVIEWS_KEY);
  try { return data ? JSON.parse(data) : []; } catch { return []; }
}

export function getReviewsByPro(proId: string): Review[] {
  return getReviews().filter(r => r.proId === proId);
}

export function getApprovedReviewsByPro(proId: string): Review[] {
  return getReviews().filter(r => r.proId === proId && r.status === "approved");
}

export function saveReview(review: Review): void {
  const all = getReviews();
  const idx = all.findIndex(r => r.id === review.id);
  if (idx >= 0) all[idx] = review; else all.push(review);
  safeSet(REVIEWS_KEY, JSON.stringify(all));

  // Étape 2 de la migration base de données : double-écriture non bloquante
  if (typeof window !== "undefined") {
    fetch("/api/db/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(review),
    }).catch(() => {});
  }
}

export function deleteReview(id: string): void {
  safeSet(REVIEWS_KEY, JSON.stringify(getReviews().filter(r => r.id !== id)));

  // Étape 2 — reflète la suppression vers la base également
  if (typeof window !== "undefined") {
    fetch(`/api/db/reviews/${id}`, { method: "DELETE" }).catch(() => {});
  }
}

export function flagReview(id: string): void {
  const all = getReviews();
  const idx = all.findIndex(r => r.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], flagged: true, flaggedAt: new Date().toISOString() };
    safeSet(REVIEWS_KEY, JSON.stringify(all));
  }
}

export function reviewExists(proId: string, email: string, firstName: string, lastName: string): boolean {
  return getReviews().some(r =>
    r.proId === proId &&
    r.email.toLowerCase() === email.toLowerCase() &&
    r.firstName.toLowerCase() === firstName.toLowerCase() &&
    r.lastName.toLowerCase() === lastName.toLowerCase()
  );
}

// ── Visits / Statistics ──────────────────────────────────────────
const VISITS_KEY = "prolocal_visits";
import type { Visit, DailyStats } from "@/types";

export function getVisits(): Visit[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(VISITS_KEY) || "[]"); } catch { return []; }
}

export function getVisitsByPro(proId: string): Visit[] {
  return getVisits().filter(v => v.proId === proId);
}

export function recordVisit(proId: string, source: Visit["source"] = "direct"): void {
  if (typeof window === "undefined") return;
  const now  = new Date();
  const date = now.toISOString().slice(0, 10);
  const hour = now.getHours();

  const sessionKey = `visit_${proId}_${date}_${hour}`;
  if (sessionStorage.getItem(sessionKey)) return;
  sessionStorage.setItem(sessionKey, "1");

  const visit: Visit = { proId, date, hour, source };
  const all = getVisits();
  all.push(visit);
  const proVisits = all.filter(v => v.proId === proId);
  if (proVisits.length > 1000) {
    const toRemove = proVisits.length - 1000;
    let removed = 0;
    const trimmed = all.filter(v => {
      if (v.proId === proId && removed < toRemove) { removed++; return false; }
      return true;
    });
    safeSet(VISITS_KEY, JSON.stringify(trimmed));
  } else {
    safeSet(VISITS_KEY, JSON.stringify(all));
  }
}

export function getStatsByPro(proId: string, days = 30): {
  total: number; today: number; thisWeek: number; thisMonth: number;
  byDay: DailyStats[]; byHour: number[]; bySource: Record<Visit["source"], number>;
} {
  const visits = getVisitsByPro(proId);
  const now    = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo  = new Date(now); weekAgo.setDate(now.getDate() - 7);
  const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30);

  const dayMap: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    dayMap[d.toISOString().slice(0, 10)] = 0;
  }
  visits.forEach(v => { if (dayMap[v.date] !== undefined) dayMap[v.date]++; });
  const byDay: DailyStats[] = Object.entries(dayMap).map(([date, visits]) => ({ date, visits }));

  const byHour = Array(24).fill(0);
  visits.forEach(v => { byHour[v.hour]++; });

  const bySource: Record<Visit["source"], number> = { direct: 0, search: 0, category: 0, map: 0 };
  visits.forEach(v => { bySource[v.source]++; });

  return {
    total:     visits.length,
    today:     visits.filter(v => v.date === todayStr).length,
    thisWeek:  visits.filter(v => new Date(v.date) >= weekAgo).length,
    thisMonth: visits.filter(v => new Date(v.date) >= monthAgo).length,
    byDay, byHour, bySource,
  };
}

// ── Facturation ──────────────────────────────────────────────────
const DOCS_KEY = "prolocal_documents";
import type { BillingDocument } from "@/types";

export function getDocuments(): BillingDocument[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(DOCS_KEY) || "[]"); } catch { return []; }
}

export function getDocumentsByPro(proId: string): BillingDocument[] {
  return getDocuments().filter(d => d.proId === proId);
}

export function saveDocument(doc: BillingDocument): void {
  const all = getDocuments();
  const idx = all.findIndex(d => d.id === doc.id);
  if (idx >= 0) all[idx] = doc; else all.push(doc);
  safeSet(DOCS_KEY, JSON.stringify(all));

  // Double-écriture vers la base (étape 2, complétée ici pour les documents)
  if (typeof window !== "undefined") {
    fetch("/api/db/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doc),
    }).catch(() => {});
  }
}

export function deleteDocument(id: string): void {
  safeSet(DOCS_KEY, JSON.stringify(getDocuments().filter(d => d.id !== id)));

  if (typeof window !== "undefined") {
    fetch(`/api/db/documents/${id}`, { method: "DELETE" }).catch(() => {});
  }
}

export function getNextNumber(proId: string, type: BillingDocument["type"]): string {
  const prefix = type === "devis" ? "DEV" : type === "avoir" ? "AVO" : "FAC";
  const year   = new Date().getFullYear();
  const docs   = getDocuments().filter(d => d.proId === proId && d.type === type);
  const seq    = (docs.length + 1).toString().padStart(3, "0");
  return `${prefix}-${year}-${seq}`;
}

// ── Billing Profile ──────────────────────────────────────────────
const BILLING_PROFILE_KEY = "prolocal_billing_profile";

export interface BillingProfile {
  proId: string; companyName: string; legalForm: string; siren: string;
  siret?: string; rcs?: string; rm?: string; capital?: string; ape?: string;
  vatNumber?: string; vatSubject: boolean; address: string; postalCode: string;
  city: string; email: string; phone: string; website?: string;
  bankDetails?: string; paymentTerms?: string; penalty?: string; recoveryFee?: string;
}

export function getBillingProfile(proId: string): BillingProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const all = JSON.parse(localStorage.getItem(BILLING_PROFILE_KEY) || "{}");
    return all[proId] || null;
  } catch { return null; }
}

export function saveBillingProfile(profile: BillingProfile): void {
  if (typeof window === "undefined") return;
  try {
    const all = JSON.parse(localStorage.getItem(BILLING_PROFILE_KEY) || "{}");
    all[profile.proId] = profile;
    safeSet(BILLING_PROFILE_KEY, JSON.stringify(all));
  } catch { /* silencieux */ }
}

// ── CRM Clients ──────────────────────────────────────────────────
const CLIENTS_KEY = "prolocal_clients";
import type { Client } from "@/types";

export function getClients(): Client[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CLIENTS_KEY) || "[]"); } catch { return []; }
}

export function getClientsByPro(proId: string): Client[] {
  return getClients().filter(c => c.proId === proId);
}

export function getClientById(id: string): Client | null {
  return getClients().find(c => c.id === id) || null;
}

export function saveClient(client: Client): void {
  const all = getClients();
  const idx = all.findIndex(c => c.id === client.id);
  if (idx >= 0) all[idx] = client; else all.push(client);
  safeSet(CLIENTS_KEY, JSON.stringify(all));

  // Double-écriture vers la base (étape 2, complétée ici pour les clients)
  if (typeof window !== "undefined") {
    fetch("/api/db/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(client),
    }).catch(() => {});
  }
}

export function deleteClient(id: string): void {
  safeSet(CLIENTS_KEY, JSON.stringify(getClients().filter(c => c.id !== id)));

  if (typeof window !== "undefined") {
    fetch(`/api/db/clients/${id}`, { method: "DELETE" }).catch(() => {});
  }
}

// ── Hero image ────────────────────────────────────────────────────
const HERO_IMAGE_IDB_KEY = "hero_image";

export async function getHeroImage(): Promise<string | null> {
  // Migre depuis localStorage si présent
  if (typeof window !== "undefined") {
    const legacy = localStorage.getItem("prolocal_hero_image");
    if (legacy) {
      await idbSet(HERO_IMAGE_IDB_KEY, legacy);
      localStorage.removeItem("prolocal_hero_image");
    }
  }
  return (await idbGet(HERO_IMAGE_IDB_KEY)) ?? null;
}

export async function saveHeroImage(dataUrl: string): Promise<void> {
  await idbSet(HERO_IMAGE_IDB_KEY, dataUrl);
  // Nettoyage localStorage au cas où
  if (typeof window !== "undefined") localStorage.removeItem("prolocal_hero_image");
}

export async function deleteHeroImage(): Promise<void> {
  await idbSet(HERO_IMAGE_IDB_KEY, null);
}

// ── Diaporama hero "Encart publicitaire ciblé" ──────────────────────
// Liste des IDs de professionnels à afficher dans le diaporama de la
// section hero, gérée manuellement par l'administrateur (voir l'espace admin).
const HERO_SLIDESHOW_KEY = "prolocal_hero_slideshow_ids";

export function getHeroSlideshowIds(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HERO_SLIDESHOW_KEY) || "[]"); } catch { return []; }
}

export function saveHeroSlideshowIds(ids: string[]): void {
  safeSet(HERO_SLIDESHOW_KEY, JSON.stringify(ids));
}
