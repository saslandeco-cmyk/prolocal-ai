"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Mail, Phone, MapPin, Send, CheckCircle,
  ChevronRight, MessageSquare, Clock, Building2,
} from "lucide-react";

const SUBJECTS = [
  "Renseignements généraux",
  "Inscrire mon entreprise",
  "Signaler une erreur sur une fiche",
  "Problème technique",
  "Partenariat",
  "Autre",
];

export default function ContactPage() {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    phone: "", subject: "", message: "",
  });
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const upd = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => { const n = { ...p }; delete n[k]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Requis";
    if (!form.lastName.trim())  e.lastName  = "Requis";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Email invalide";
    if (!form.subject) e.subject = "Requis";
    if (!form.message.trim() || form.message.trim().length < 20)
      e.message = "Message trop court (20 caractères min.)";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Une erreur est survenue lors de l'envoi. Réessayez.");
        return;
      }
      setSent(true);
    } catch {
      setSubmitError("Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-landes-cream min-h-screen">

      {/* Hero */}
      <section className="relative bg-landes-hero overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 right-20 w-72 h-72 rounded-full bg-landes-sky blur-3xl" />
          <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <nav className="flex items-center gap-2 text-sm text-gray-300 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-landes-sand font-medium">Nous contacter</span>
          </nav>
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-landes-sand" />
              </div>
              <span className="text-landes-sand text-sm font-semibold uppercase tracking-wider">Contact</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
              Nous contacter
            </h1>
            <p className="text-gray-300 text-lg">
              Une question, une suggestion ou un problème ? Notre équipe vous répond sous 24h.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 50L1440 50L1440 15C1200 40 960 5 720 25C480 45 240 5 0 15L0 50Z" fill="#FAF7F0"/>
          </svg>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── Infos contact ── */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-landes-pine mb-1">Coordonnées</h2>
              <p className="text-gray-500 text-sm">Retrouvez-nous par email, téléphone ou courrier.</p>
            </div>

            {[
              {
                icon: Mail,
                label: "Email",
                value: "contact@prolocal-landes.fr",
                href: "mailto:contact@prolocal-landes.fr",
              },
              {
                icon: Phone,
                label: "Téléphone",
                value: "05 58 00 00 00",
                href: "tel:0558000000",
              },
              {
                icon: MapPin,
                label: "Adresse",
                value: "Mont-de-Marsan, Landes (40)",
                href: undefined,
              },
              {
                icon: Clock,
                label: "Disponibilité",
                value: "Lun–Ven, 9h–18h",
                href: undefined,
              },
            ].map(item => (
              <div key={item.label} className="card p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-landes-forest/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-landes-forest" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                  {item.href
                    ? <a href={item.href} className="font-medium text-landes-pine hover:text-landes-forest transition-colors text-sm">{item.value}</a>
                    : <p className="font-medium text-landes-pine text-sm">{item.value}</p>
                  }
                </div>
              </div>
            ))}

            {/* CTA inscription */}
            <div className="card p-5 bg-landes-forest/5 border border-landes-sage/20 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-landes-forest" />
                <p className="font-semibold text-landes-pine text-sm">Vous êtes un professionnel ?</p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Inscrivez votre entreprise dans notre annuaire et soyez trouvé par vos futurs clients dans les Landes.
              </p>
              <Link href="/inscription" className="btn-primary text-sm py-2.5 flex items-center justify-center gap-2">
                Inscrire mon entreprise
              </Link>
            </div>
          </div>

          {/* ── Formulaire ── */}
          <div className="lg:col-span-2">
            {sent ? (
              /* Success state */
              <div className="card p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-landes-pine mb-2">Message envoyé !</h2>
                <p className="text-gray-500 text-sm max-w-sm leading-relaxed mb-6">
                  Merci pour votre message. Notre équipe vous répondra dans les meilleurs délais, généralement sous 24h ouvrées.
                </p>
                <Link href="/" className="btn-primary inline-flex items-center gap-2 py-3 px-6">
                  Retour à l&apos;accueil
                </Link>
              </div>
            ) : (
              <div className="card p-8">
                <h2 className="text-xl font-bold text-landes-pine mb-6">Envoyer un message</h2>
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                  {/* Nom / Prénom */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Prénom *</label>
                      <input
                        value={form.firstName}
                        onChange={e => upd("firstName", e.target.value)}
                        className={`input-field ${errors.firstName ? "border-red-400" : ""}`}
                        placeholder="Votre prénom"
                      />
                      {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="label">Nom *</label>
                      <input
                        value={form.lastName}
                        onChange={e => upd("lastName", e.target.value)}
                        className={`input-field ${errors.lastName ? "border-red-400" : ""}`}
                        placeholder="Votre nom"
                      />
                      {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                    </div>
                  </div>

                  {/* Email / Téléphone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Email *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => upd("email", e.target.value)}
                        className={`input-field ${errors.email ? "border-red-400" : ""}`}
                        placeholder="votre@email.fr"
                      />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="label">Téléphone <span className="text-gray-400 font-normal">(facultatif)</span></label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => upd("phone", e.target.value)}
                        className="input-field"
                        placeholder="05 58 00 00 00"
                      />
                    </div>
                  </div>

                  {/* Sujet */}
                  <div>
                    <label className="label">Sujet *</label>
                    <select
                      value={form.subject}
                      onChange={e => upd("subject", e.target.value)}
                      className={`input-field ${errors.subject ? "border-red-400" : ""}`}
                    >
                      <option value="">Choisissez un sujet…</option>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="label">Message *</label>
                    <textarea
                      value={form.message}
                      onChange={e => upd("message", e.target.value)}
                      rows={6}
                      className={`input-field resize-none ${errors.message ? "border-red-400" : ""}`}
                      placeholder="Décrivez votre demande en détail…"
                    />
                    <div className="flex items-center justify-between mt-1">
                      {errors.message
                        ? <p className="text-xs text-red-500">{errors.message}</p>
                        : <span />
                      }
                      <p className="text-xs text-gray-400 ml-auto">{form.message.length} caractères</p>
                    </div>
                  </div>

                  {/* RGPD */}
                  <p className="text-xs text-gray-400 leading-relaxed">
                    En soumettant ce formulaire, vous acceptez que vos données soient utilisées pour traiter votre demande conformément à notre politique de confidentialité. Elles ne seront jamais partagées avec des tiers.
                  </p>

                  {submitError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{submitError}</p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Envoi en cours…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Envoyer le message
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
