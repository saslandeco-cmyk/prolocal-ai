"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogIn, MapPin, KeyRound, ArrowLeft, CheckCircle } from "lucide-react";
import { getProfessionalByEmail, setSession, saveProfessional } from "@/lib/storage";
import { sendResetCode, verifyResetCode, getResetCooldown } from "@/lib/passwordReset";

type View = "login" | "forgot-request" | "forgot-verify" | "forgot-success";

export default function ConnexionPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("login");

  // Connexion
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Mot de passe oublié
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [demoCode, setDemoCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    const pro = await getProfessionalByEmail(email);
    if (!pro || pro.password !== password) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }
    setSession("pro", pro.id);
    setLoading(false);
    router.push("/dashboard");
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    const pro = await getProfessionalByEmail(resetEmail);
    if (!pro) {
      setResetError("Aucun compte ne correspond à cette adresse email.");
      return;
    }
    setResetLoading(true);
    const result = await sendResetCode(resetEmail, pro.companyName);
    setResetLoading(false);
    if (!result.ok) {
      setResetError(result.error || "Erreur lors de l'envoi du code.");
      if (result.cooldownRemaining) setCooldown(result.cooldownRemaining);
      return;
    }
    setDemoCode(result.demoCode || "");
    setCode("");
    setNewPassword("");
    setNewPassword2("");
    setCooldown(getResetCooldown(resetEmail) || 60);
    setView("forgot-verify");
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    const pro = await getProfessionalByEmail(resetEmail);
    if (!pro) return;
    setResetLoading(true);
    const result = await sendResetCode(resetEmail, pro.companyName);
    setResetLoading(false);
    if (!result.ok) {
      setResetError(result.error || "Erreur lors de l'envoi du code.");
      if (result.cooldownRemaining) setCooldown(result.cooldownRemaining);
      return;
    }
    setDemoCode(result.demoCode || "");
    setResetError("");
    setCooldown(60);
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    if (code.trim().length !== 6) { setResetError("Veuillez saisir les 6 chiffres du code."); return; }
    if (newPassword.length < 6) { setResetError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    if (newPassword !== newPassword2) { setResetError("Les mots de passe ne correspondent pas."); return; }

    const result = verifyResetCode(resetEmail, code.trim());
    if (!result.ok) { setResetError(result.error || "Code invalide."); return; }

    const pro = await getProfessionalByEmail(resetEmail);
    if (!pro) { setResetError("Compte introuvable."); return; }

    saveProfessional({ ...pro, password: newPassword, updatedAt: new Date().toISOString() });
    setView("forgot-success");
  };

  const backToLogin = () => {
    setView("login");
    setError("");
    setResetError("");
    setResetEmail("");
    setEmail(resetEmail || email);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-landes-forest to-landes-ocean rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-landes-pine">Espace Professionnel</h1>
          <p className="text-gray-500 mt-1">
            {view === "login" ? "Connectez-vous à votre compte" : "Réinitialisation du mot de passe"}
          </p>
        </div>

        <div className="card p-8">

          {/* ── Connexion ── */}
          {view === "login" && (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email de connexion</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="contact@mon-entreprise.fr" required />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="label mb-0">Mot de passe</label>
                    <button type="button" onClick={() => { setResetEmail(email); setView("forgot-request"); }}
                      className="text-xs text-landes-forest hover:underline font-medium">
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field mt-1" placeholder="••••••••" required />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  {loading ? "Connexion..." : "Se connecter"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-500">
                Pas encore inscrit ?{" "}
                <Link href="/inscription" className="text-landes-forest font-medium hover:underline">
                  Référencer mon entreprise
                </Link>
              </div>
            </>
          )}

          {/* ── Mot de passe oublié : étape 1, demande du code ── */}
          {view === "forgot-request" && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-5 h-5 text-landes-forest flex-shrink-0" />
                <p className="font-bold text-landes-pine">Mot de passe oublié</p>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Saisissez votre email de connexion : un code de vérification vous sera envoyé pour réinitialiser votre mot de passe.
              </p>
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label className="label">Email de connexion</label>
                  <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="input-field" placeholder="contact@mon-entreprise.fr" required />
                </div>
                {resetError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{resetError}</div>
                )}
                <button type="submit" disabled={resetLoading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
                  {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  {resetLoading ? "Envoi…" : "Recevoir mon code"}
                </button>
                <button type="button" onClick={backToLogin} className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600">
                  <ArrowLeft className="w-3.5 h-3.5" /> Retour à la connexion
                </button>
              </form>
            </>
          )}

          {/* ── Mot de passe oublié : étape 2, code + nouveau mot de passe ── */}
          {view === "forgot-verify" && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-5 h-5 text-landes-forest flex-shrink-0" />
                <p className="font-bold text-landes-pine">Réinitialiser mon mot de passe</p>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Un code à 6 chiffres a été envoyé à <strong className="text-landes-pine">{resetEmail}</strong>.
              </p>

              {demoCode && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                  <p className="text-xs font-semibold text-amber-700 mb-0.5">Mode démonstration — aucun service d&apos;envoi d&apos;email n&apos;est encore configuré</p>
                  <p className="text-xs text-amber-700">
                    Code généré pour test : <strong className="tracking-widest text-sm">{demoCode}</strong>
                  </p>
                </div>
              )}

              <form onSubmit={handleVerifyAndReset} className="space-y-4">
                <div>
                  <label className="label">Code de vérification</label>
                  <input
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric" maxLength={6}
                    className="input-field text-center text-2xl tracking-[0.5em] font-bold"
                    placeholder="000000"
                  />
                </div>
                <div>
                  <label className="label">Nouveau mot de passe</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field" placeholder="••••••••" />
                </div>
                <div>
                  <label className="label">Confirmer le mot de passe</label>
                  <input type="password" value={newPassword2} onChange={e => setNewPassword2(e.target.value)} className="input-field" placeholder="••••••••" />
                </div>
                {resetError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{resetError}</div>
                )}
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
                  <KeyRound className="w-4 h-4" /> Réinitialiser mon mot de passe
                </button>
                <div className="flex items-center justify-between text-xs">
                  <button type="button" onClick={() => setView("forgot-request")} className="text-gray-400 hover:text-gray-600">
                    ← Modifier l&apos;email
                  </button>
                  <button type="button" onClick={handleResend} disabled={cooldown > 0 || resetLoading}
                    className="text-landes-forest font-medium hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed">
                    {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : "Renvoyer le code"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── Mot de passe oublié : succès ── */}
          {view === "forgot-success" && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-landes-pine mb-1">Mot de passe réinitialisé !</p>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                </p>
              </div>
              <button onClick={backToLogin} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                <LogIn className="w-4 h-4" /> Retour à la connexion
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
