"use client";
import { useState, useEffect, useRef } from "react";
import {
  Search, Phone, Mail, MapPin, Building2, FileText,
  ChevronRight, X, Clock, ArrowLeft, Star,
  MessageSquare, Send, Calendar, CheckCircle, Plus, Trash2,
  Download, Upload, Loader2,
} from "lucide-react";
import { getClientsByPro, saveClient, deleteClient, generateId, getDocumentsByPro } from "@/lib/storage";
import type { Client, ClientNote, ClientStatus, BillingDocument } from "@/types";
import { phoneHref, formatFrPhoneDisplay } from "@/lib/phone";
import type { Professional } from "@/types";

// ── Helpers ──────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; bg: string; dot: string }> = {
  prospect: { label: "Prospect", color: "text-blue-700",  bg: "bg-blue-50 border-blue-200",  dot: "bg-blue-500" },
  actif:    { label: "Actif",    color: "text-green-700", bg: "bg-green-50 border-green-200", dot: "bg-green-500" },
  inactif:  { label: "Inactif",  color: "text-gray-500",  bg: "bg-gray-50 border-gray-200",   dot: "bg-gray-400" },
  vip:      { label: "VIP",      color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
};

const DOC_TYPE_LABEL: Record<string, { label: string; color: string }> = {
  devis:   { label: "Devis",   color: "text-blue-600 bg-blue-50" },
  facture: { label: "Facture", color: "text-emerald-600 bg-emerald-50" },
  avoir:   { label: "Avoir",   color: "text-orange-600 bg-orange-50" },
};

const NOTE_TYPES: { key: ClientNote["type"]; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "note",    label: "Note",    icon: <FileText className="w-3 h-3" />,    color: "text-gray-600 bg-gray-100" },
  { key: "appel",   label: "Appel",   icon: <Phone className="w-3 h-3" />,       color: "text-blue-600 bg-blue-50" },
  { key: "email",   label: "Email",   icon: <Send className="w-3 h-3" />,        color: "text-purple-600 bg-purple-50" },
  { key: "rdv",     label: "RDV",     icon: <Calendar className="w-3 h-3" />,    color: "text-green-600 bg-green-50" },
];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function calcTTC(doc: BillingDocument) {
  let ht = 0; let vat = 0;
  doc.lines.forEach(l => { const lineHT = l.quantity * l.unitPrice; ht += lineHT; vat += lineHT * (l.vatRate / 100); });
  const disc = ht * ((doc.discountPct || 0) / 100);
  return (ht - disc) + vat * (1 - (doc.discountPct || 0) / 100);
}

// ── Fiche client (vue détail) ─────────────────────────────────────
function ClientDetail({
  client: initial, docs, onBack, onStatusChange,
}: {
  client: Client; docs: BillingDocument[];
  onBack: () => void; onStatusChange: (c: Client) => void;
}) {
  const [client, setClient] = useState<Client>(initial);
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState<ClientNote["type"]>("note");

  const cfg = STATUS_CONFIG[client.status];
  const totalTTC = docs.filter(d => d.type === "facture").reduce((s, d) => s + calcTTC(d), 0);

  const updateAndSave = (updated: Client) => {
    saveClient(updated);
    setClient(updated);
    onStatusChange(updated);
  };

  const addNote = () => {
    if (!noteText.trim()) return;
    const note: ClientNote = {
      id: generateId(), date: new Date().toISOString(),
      content: noteText.trim(), type: noteType,
    };
    updateAndSave({ ...client, notes: [note, ...client.notes], updatedAt: new Date().toISOString() });
    setNoteText("");
  };

  const deleteNote = (id: string) => {
    updateAndSave({ ...client, notes: client.notes.filter(n => n.id !== id), updatedAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-5">
      {/* Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-landes-forest transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à la liste
        </button>
        {/* Changement de statut inline */}
        <div className="flex gap-1.5">
          {(Object.entries(STATUS_CONFIG) as [ClientStatus, typeof STATUS_CONFIG[ClientStatus]][]).map(([k, c]) => (
            <button key={k} onClick={() => updateAndSave({ ...client, status: k, updatedAt: new Date().toISOString() })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                client.status === k ? `${c.bg} ${c.color} border-current` : "border-gray-200 text-gray-400 hover:border-gray-300"
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${client.status === k ? c.dot : "bg-gray-300"}`} />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Colonne gauche — infos + docs */}
        <div className="space-y-4">
          {/* Carte identité */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-landes-forest/10 rounded-xl flex items-center justify-center text-landes-forest font-bold text-lg flex-shrink-0">
                {client.firstName[0]}{client.lastName[0]}
              </div>
              <div>
                <h2 className="font-bold text-landes-pine">{client.firstName} {client.lastName}</h2>
                {client.company && <p className="text-sm text-gray-400">{client.company}</p>}
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium mt-0.5 ${cfg.bg} ${cfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-gray-600 hover:text-landes-forest">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />{client.email}
                </a>
              )}
              {client.phone && (
                <a href={phoneHref(client.phone)} className="flex items-center gap-2 text-gray-600 hover:text-landes-forest">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />{formatFrPhoneDisplay(client.phone)}
                </a>
              )}
              {(client.address || client.city) && (
                <p className="flex items-start gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  {[client.address, client.postalCode, client.city].filter(Boolean).join(", ")}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 space-y-0.5">
              {client.source && <p>Source : <span className="text-gray-600">{client.source}</span></p>}
              <p>Client depuis le {fmtDate(client.createdAt)}</p>
            </div>
          </div>

          {/* Résumé financier */}
          <div className="card p-5">
            <h3 className="font-semibold text-landes-pine text-sm mb-3">Résumé commercial</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Devis</span>
                <span className="font-medium">{docs.filter(d => d.type === "devis").length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Factures</span>
                <span className="font-medium">{docs.filter(d => d.type === "facture").length}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-100 pt-2 mt-1">
                <span className="text-gray-500 font-medium">CA total TTC</span>
                <span className="font-bold text-landes-pine">{fmt(totalTTC)} €</span>
              </div>
            </div>
          </div>

          {/* Documents */}
          {docs.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-landes-pine text-sm mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-landes-sage" /> Documents ({docs.length})
              </h3>
              <div className="space-y-2">
                {docs.map(d => {
                  const tc = calcTTC(d);
                  const dt = DOC_TYPE_LABEL[d.type];
                  return (
                    <div key={d.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${dt.color}`}>{dt.label}</span>
                        <span className="font-medium text-gray-700">{d.number}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-gray-700">{fmt(tc)} €</span>
                        <span className="text-gray-400 ml-1.5">{fmtDate(d.issueDate)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite — interactions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Ajouter interaction */}
          <div className="card p-5">
            <h3 className="font-semibold text-landes-pine text-sm mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-landes-sage" /> Ajouter une interaction
            </h3>
            <div className="flex gap-2 mb-3 flex-wrap">
              {NOTE_TYPES.map(t => (
                <button key={t.key} type="button" onClick={() => setNoteType(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    noteType === t.key ? `${t.color} border-current` : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && e.ctrlKey && addNote()}
              rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-landes-sage resize-none mb-2"
              placeholder="Décrivez l'interaction… (Ctrl+Entrée pour valider)" />
            <div className="flex justify-end">
              <button onClick={addNote} disabled={!noteText.trim()}
                className="btn-primary flex items-center gap-2 py-2 px-4 text-sm disabled:opacity-40">
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="card p-5">
            <h3 className="font-semibold text-landes-pine text-sm mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-landes-sage" /> Historique
              <span className="text-gray-400 font-normal">({client.notes.length})</span>
            </h3>
            {client.notes.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune interaction enregistrée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {client.notes.map(note => {
                  const t = NOTE_TYPES.find(n => n.key === note.type) || NOTE_TYPES[0];
                  return (
                    <div key={note.id} className="flex gap-3 group">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${t.color}`}>
                        {t.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={`text-xs font-semibold ${t.color.split(" ")[0]}`}>{t.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{fmtDate(note.date)}</span>
                            <button onClick={() => deleteNote(note.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{note.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main CrmTab ───────────────────────────────────────────────────
export default function CrmTab({ pro }: { pro: Professional }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [docs, setDocs]       = useState<BillingDocument[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [search, setSearch]     = useState("");
  const [filterDoc, setFilterDoc]    = useState<"tous" | "devis" | "facture" | "avoir">("tous");
  const [filterPeriod, setFilterPeriod] = useState<"tous" | "mois" | "3mois" | "6mois" | "annee">("tous");
  const [sortDir, setSortDir]    = useState<"desc" | "asc">("desc");
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState(false);

  // ── Étape 5 de la migration base de données ──
  // Charge en priorité depuis la base (prospects/clients accessibles
  // depuis n'importe quel appareil), avec repli automatique et silencieux
  // sur localStorage si la base est indisponible ou pas encore alimentée
  // pour ce professionnel.
  const load = async () => {
    setLoading(true);
    setLoadError(false);
    const allDocs = getDocumentsByPro(pro.id);
    setDocs(allDocs);

    let allClients: Client[] | null = null;
    try {
      const res = await fetch(`/api/db/clients?proId=${encodeURIComponent(pro.id)}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.clients) && json.clients.length > 0) allClients = json.clients;
      }
    } catch {
      // Réseau indisponible ou base non configurée : repli silencieux ci-dessous
    }

    if (!allClients) {
      try {
        allClients = getClientsByPro(pro.id);
      } catch {
        setLoadError(true);
        setLoading(false);
        return;
      }
    }

    // Tous les clients et prospects, qu'ils aient ou non un document associé
    // (un prospect importé via CSV n'a par définition pas encore de devis/facture).
    setClients(allClients.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ));
    setLoading(false);
  };

  useEffect(() => { load(); }, [pro.id]);

  // Associe un document à un client
  const matchesClient = (doc: BillingDocument, client: Client) => {
    const docName = `${doc.client.firstName || ""} ${doc.client.lastName || ""}`.toLowerCase().trim();
    const cliName = `${client.firstName} ${client.lastName}`.toLowerCase().trim();
    const emailMatch = doc.client.email && client.email &&
      doc.client.email.toLowerCase() === client.email.toLowerCase();
    const nameMatch = docName && cliName && docName === cliName;
    const companyMatch = doc.client.company && client.company &&
      doc.client.company.toLowerCase() === client.company.toLowerCase();
    return emailMatch || nameMatch || (companyMatch && nameMatch);
  };

  // ── Export CSV — l'ensemble des clients ET prospects (avec ou sans document) ──
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const CSV_COLUMNS = [
    "Prénom", "Nom", "Entreprise", "Email", "Téléphone", "Mobile",
    "Adresse", "Code postal", "Ville", "Statut", "Source", "Tags", "SIRET", "N° TVA",
  ];

  const handleExportCsv = () => {
    const all = getClientsByPro(pro.id);
    const rows = all.map(c => [
      c.firstName, c.lastName, c.company || "", c.email || "", c.phone || "", c.mobile || "",
      c.address || "", c.postalCode || "", c.city || "", c.status, c.source || "",
      (c.tags || []).join(" | "), c.siret || "", c.vatNumber || "",
    ].map(v => `"${String(v).replace(/"/g, '""')}"`));
    const csv = [CSV_COLUMNS.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prospects-clients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCsv = async (file: File) => {
    const rawText = await file.text();
    const text = rawText.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = text.split("\n").filter(l => l.trim().length > 0);
    if (lines.length < 2) { setImportSummary("Fichier vide ou invalide."); return; }

    const firstLine = lines[0];
    const sep = (firstLine.split(";").length >= firstLine.split(",").length) ? ";" : ",";

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = "", inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQ = !inQ; continue; }
        if (ch === sep && !inQ) { result.push(cur.trim()); cur = ""; continue; }
        cur += ch;
      }
      result.push(cur.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const idxOf = (name: string) => headers.findIndex(h => h.toLowerCase().trim() === name.toLowerCase().trim());

    const existing = getClientsByPro(pro.id);
    const validStatuses: ClientStatus[] = ["prospect", "actif", "inactif", "vip"];
    let imported = 0, updated = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      const val = (name: string) => (cols[idxOf(name)] ?? "").trim();

      const firstName = val("Prénom");
      const lastName = val("Nom");
      const email = val("Email");
      const company = val("Entreprise");
      if (!firstName && !lastName && !company) continue;

      // Doublon : même email, ou même nom + prénom + entreprise
      const match = existing.find(c =>
        (email && c.email && c.email.toLowerCase() === email.toLowerCase()) ||
        (c.firstName.toLowerCase() === firstName.toLowerCase() &&
         c.lastName.toLowerCase()  === lastName.toLowerCase() &&
         (c.company || "").toLowerCase() === company.toLowerCase())
      );

      const statusRaw = val("Statut").toLowerCase() as ClientStatus;
      const now = new Date().toISOString();
      const client: Client = {
        id:         match?.id || generateId(),
        proId:      pro.id,
        firstName:  firstName || match?.firstName || "",
        lastName:   lastName  || match?.lastName  || "",
        company:    company   || match?.company,
        email:      email     || match?.email,
        phone:      val("Téléphone")  || match?.phone,
        mobile:     val("Mobile")     || match?.mobile,
        address:    val("Adresse")    || match?.address,
        postalCode: val("Code postal")|| match?.postalCode,
        city:       val("Ville")      || match?.city,
        status:     validStatuses.includes(statusRaw) ? statusRaw : (match?.status || "prospect"),
        source:     val("Source")     || match?.source,
        tags:       val("Tags") ? val("Tags").split("|").map(t => t.trim()).filter(Boolean) : match?.tags,
        siret:      val("SIRET")      || match?.siret,
        vatNumber:  val("N° TVA")     || match?.vatNumber,
        notes:      match?.notes || [],
        createdAt:  match?.createdAt || now,
        updatedAt:  now,
      };
      saveClient(client);
      if (match) updated++; else imported++;
    }

    load();
    setImportSummary(`✅ ${imported} nouveau${imported > 1 ? "x" : ""} prospect${imported > 1 ? "s" : ""}/client${imported > 1 ? "s" : ""}, ${updated} mis à jour.`);
    setTimeout(() => setImportSummary(null), 5000);
  };

  const getClientDocs = (client: Client) =>
    docs.filter(d => matchesClient(d, client))
        .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

  // Calcule la date de coupure selon la période choisie
  const periodCutoff = (): Date | null => {
    const now = new Date();
    if (filterPeriod === "mois")  { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d; }
    if (filterPeriod === "3mois") { const d = new Date(now); d.setMonth(d.getMonth() - 3); return d; }
    if (filterPeriod === "6mois") { const d = new Date(now); d.setMonth(d.getMonth() - 6); return d; }
    if (filterPeriod === "annee") { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; }
    return null;
  };

  const filtered = clients
    .filter(c => {
      // Filtre texte
      const q = search.toLowerCase();
      if (q && ![c.firstName, c.lastName, c.company, c.email, c.phone, c.city]
        .some(v => v?.toLowerCase().includes(q))) return false;

      // Filtre type doc — le client doit avoir au moins un doc du bon type
      if (filterDoc !== "tous") {
        const clientDocs = getClientDocs(c);
        if (!clientDocs.some(d => d.type === filterDoc)) return false;
      }

      // Filtre période — le client doit avoir au moins un doc dans la période
      const cutoff = periodCutoff();
      if (cutoff) {
        const clientDocs = getClientDocs(c);
        if (!clientDocs.some(d => new Date(d.issueDate) >= cutoff)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const ta = new Date(a.updatedAt).getTime();
      const tb = new Date(b.updatedAt).getTime();
      return sortDir === "desc" ? tb - ta : ta - tb;
    });

  if (selected) {
    return (
      <ClientDetail
        client={selected}
        docs={getClientDocs(selected)}
        onBack={() => { setSelected(null); load(); }}
        onStatusChange={updated => { setSelected(updated); load(); }}
      />
    );
  }

  if (loadError) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center gap-4 text-center min-h-[40vh]">
        <p className="text-lg font-bold text-landes-pine">Impossible de charger vos prospects/clients</p>
        <p className="text-sm text-gray-500 max-w-sm">
          Vérifiez votre connexion internet et réessayez.
        </p>
        <button onClick={() => load()} className="btn-primary flex items-center gap-2">
          <Loader2 className="w-4 h-4" /> Réessayer
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-landes-forest" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-landes-pine bg-landes-forest/8 border-l-4 border-landes-forest px-4 py-3 rounded-r-lg">Clients</h2>
            <p className="text-sm text-gray-500">
              Ajoutés automatiquement lors d'un devis/facture, ou importés depuis un fichier CSV.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 text-xs font-semibold text-landes-forest border border-landes-forest/40 px-3 py-2 rounded-lg hover:bg-landes-forest hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Exporter CSV
            </button>
            <button
              onClick={() => csvInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> Importer CSV
            </button>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleImportCsv(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>
        {importSummary && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-2">{importSummary}</p>
        )}
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: "Clients",   value: clients.length },
            { label: "Prospects", value: clients.filter(c => c.status === "prospect").length },
            { label: "Actifs",    value: clients.filter(c => c.status === "actif").length },
            { label: "VIP",       value: clients.filter(c => c.status === "vip").length },
          ].map(k => (
            <div key={k.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-landes-pine">{k.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recherche + filtres */}
      <div className="card p-5 space-y-3">
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-landes-sage"
            placeholder="Rechercher un client…" />
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2 pt-1">
          {/* Filtre type document */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
            {([
              { v: "tous",    l: "Tous les docs" },
              { v: "devis",   l: "Devis" },
              { v: "facture", l: "Factures" },
              { v: "avoir",   l: "Avoirs" },
            ] as const).map(({ v, l }) => (
              <button key={v} onClick={() => setFilterDoc(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterDoc === v ? "bg-white shadow text-landes-forest" : "text-gray-500 hover:text-gray-700"
                }`}>
                {l}
              </button>
            ))}
          </div>

          {/* Filtre période */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
            {([
              { v: "tous",   l: "Toutes dates" },
              { v: "mois",   l: "Ce mois" },
              { v: "3mois",  l: "3 mois" },
              { v: "6mois",  l: "6 mois" },
              { v: "annee",  l: "1 an" },
            ] as const).map(({ v, l }) => (
              <button key={v} onClick={() => setFilterPeriod(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterPeriod === v ? "bg-white shadow text-landes-forest" : "text-gray-500 hover:text-gray-700"
                }`}>
                {l}
              </button>
            ))}
          </div>

          {/* Tri date */}
          <button onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors ml-auto">
            <Clock className="w-3.5 h-3.5" />
            {sortDir === "desc" ? "Plus récent" : "Plus ancien"}
            <span className="text-gray-400">{sortDir === "desc" ? "↓" : "↑"}</span>
          </button>
        </div>

        {/* Compteur résultats */}
        {(filterDoc !== "tous" || filterPeriod !== "tous" || search) && (
          <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-100">
            <span>{filtered.length} résultat{filtered.length > 1 ? "s" : ""} sur {clients.length} client{clients.length > 1 ? "s" : ""}</span>
            <button onClick={() => { setFilterDoc("tous"); setFilterPeriod("tous"); setSearch(""); }}
              className="text-landes-forest hover:underline font-medium">
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* Liste */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-sm">
              {search ? "Aucun résultat" : "Aucun client — créez votre premier devis ou facture"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(client => {
              const clientDocs = getClientDocs(client);
              const cfg = STATUS_CONFIG[client.status];
              const totalTTC = clientDocs.filter(d => d.type === "facture").reduce((s, d) => s + calcTTC(d), 0);
              const lastDoc = clientDocs[0];

              return (
                <div key={client.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-11 h-11 bg-landes-forest/10 rounded-xl flex items-center justify-center text-landes-forest font-bold flex-shrink-0">
                      {client.firstName[0]}{client.lastName[0]}
                    </div>

                    {/* Infos client */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-landes-pine">{client.firstName} {client.lastName}</p>
                        {client.company && <span className="text-xs text-gray-400">{client.company}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
                        {client.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{client.email}</span>}
                        {client.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{formatFrPhoneDisplay(client.phone)}</span>}
                        {client.city  && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{client.city}</span>}
                      </div>

                      {/* Résumé docs inline */}
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Object.entries(
                          clientDocs.reduce((acc, d) => {
                            acc[d.type] = (acc[d.type] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([type, count]) => {
                          const dt = DOC_TYPE_LABEL[type];
                          return (
                            <span key={type} className={`text-xs px-2.5 py-1 rounded-full font-medium ${dt.color}`}>
                              {count} {dt.label}{count > 1 ? "s" : ""}
                            </span>
                          );
                        })}
                        {totalTTC > 0 && (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-landes-forest/5 text-landes-forest">
                            {fmt(totalTTC)} € TTC
                          </span>
                        )}
                        {lastDoc && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> dernier : {fmtDate(lastDoc.issueDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bouton fiche */}
                    <button
                      onClick={() => setSelected(client)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-landes-forest/30 text-landes-forest text-xs font-medium hover:bg-landes-forest hover:text-white transition-colors flex-shrink-0"
                      title="Ouvrir la fiche client"
                    >
                      Fiche <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
