/**
 * serverStorage.ts — stockage côté serveur dans data/professionals.json
 * Utilisé exclusivement par les API Routes Next.js (Node.js).
 * Ne jamais importer ce fichier dans un composant client.
 */
import fs   from "fs";
import path from "path";
import type { Professional } from "@/types";

const DATA_DIR  = path.join(process.cwd(), "data");
const PROS_FILE = path.join(DATA_DIR, "professionals.json");
const REVIEWS_FILE  = path.join(DATA_DIR, "reviews.json");
const DOCUMENTS_FILE = path.join(DATA_DIR, "documents.json");
const CLIENTS_FILE  = path.join(DATA_DIR, "clients.json");
const VISITS_FILE   = path.join(DATA_DIR, "visits.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON<T>(file: string, fallback: T): T {
  ensureDir();
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(file: string, data: T): void {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

// ── Professionals ─────────────────────────────────────────────

export function serverGetProfessionals(): Professional[] {
  return readJSON<Professional[]>(PROS_FILE, []);
}

export function serverGetProfessionalById(id: string): Professional | null {
  return serverGetProfessionals().find(p => p.id === id) ?? null;
}

export function serverGetProfessionalByEmail(email: string): Professional | null {
  return serverGetProfessionals().find(p => p.email === email) ?? null;
}

export function serverSaveProfessional(pro: Professional): void {
  const list = serverGetProfessionals();
  const idx  = list.findIndex(p => p.id === pro.id);
  if (idx >= 0) list[idx] = pro; else list.push(pro);
  writeJSON(PROS_FILE, list);
}

export function serverDeleteProfessional(id: string): void {
  writeJSON(PROS_FILE, serverGetProfessionals().filter(p => p.id !== id));
}

// ── Reviews ───────────────────────────────────────────────────
import type { Review } from "@/types";

export function serverGetReviews(): Review[] {
  return readJSON<Review[]>(REVIEWS_FILE, []);
}

export function serverSaveReview(review: Review): void {
  const all = serverGetReviews();
  const idx = all.findIndex(r => r.id === review.id);
  if (idx >= 0) all[idx] = review; else all.push(review);
  writeJSON(REVIEWS_FILE, all);
}

export function serverDeleteReview(id: string): void {
  writeJSON(REVIEWS_FILE, serverGetReviews().filter(r => r.id !== id));
}

// ── Documents ─────────────────────────────────────────────────
import type { BillingDocument } from "@/types";

export function serverGetDocuments(): BillingDocument[] {
  return readJSON<BillingDocument[]>(DOCUMENTS_FILE, []);
}

export function serverSaveDocument(doc: BillingDocument): void {
  const all = serverGetDocuments();
  const idx = all.findIndex(d => d.id === doc.id);
  if (idx >= 0) all[idx] = doc; else all.push(doc);
  writeJSON(DOCUMENTS_FILE, all);
}

// ── Clients ───────────────────────────────────────────────────
import type { Client } from "@/types";

export function serverGetClients(): Client[] {
  return readJSON<Client[]>(CLIENTS_FILE, []);
}

export function serverSaveClient(client: Client): void {
  const all = serverGetClients();
  const idx = all.findIndex(c => c.id === client.id);
  if (idx >= 0) all[idx] = client; else all.push(client);
  writeJSON(CLIENTS_FILE, all);
}

// La vérification des identifiants admin se fait via /api/admin/login
// (voir src/app/api/admin/login/route.ts), contre ADMIN_USERNAME /
// ADMIN_PASSWORD — jamais avec des identifiants codés en dur ici.
