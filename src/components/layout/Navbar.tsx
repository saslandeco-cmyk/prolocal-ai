"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, MapPin, LogIn, UserPlus, LogOut, User, ChevronDown, LayoutDashboard, Grid3X3, ShieldCheck } from "lucide-react";
import { getSession, clearSession, getProfessionalById, getAdminPanelPath } from "@/lib/storage";
import { getCategoriesAsync, DEFAULT_CATEGORIES, type CategoryRecord } from "@/lib/categories";

interface ProSession {
  firstName: string;
  lastName: string;
  companyName: string;
  id: string;
}

interface AdminSession {
  username: string;
  panelPath: string | null;
}

export default function Navbar() {
  const [categories, setCategories] = useState<CategoryRecord[]>(DEFAULT_CATEGORIES);
  const router = useRouter();
  const [open,       setOpen]       = useState(false);
  const [proSession, setProSession] = useState<ProSession | null>(null);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [dropOpen,   setDropOpen]   = useState(false);
  const [adminDropOpen, setAdminDropOpen] = useState(false);
  const [catOpen,    setCatOpen]    = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [mobileSubOpen, setMobileSubOpen] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const adminDropRef = useRef<HTMLDivElement>(null);
  const catRef  = useRef<HTMLDivElement>(null);

  useEffect(() => { getCategoriesAsync().then(setCategories); }, []);

  useEffect(() => {
    const load = () => {
      const session = getSession();
      if (session?.type === "pro" && session.id) {
        const pro = getProfessionalById(session.id);
        if (pro) {
          setProSession({ firstName: pro.firstName, lastName: pro.lastName, companyName: pro.companyName, id: pro.id });
          setAdminSession(null);
          return;
        }
      }
      if (session?.type === "admin" && session.id) {
        setAdminSession({ username: session.id, panelPath: getAdminPanelPath() });
        setProSession(null);
        return;
      }
      setProSession(null);
      setAdminSession(null);
    };
    load();
    window.addEventListener("storage", load);
    window.addEventListener("prolocal-session-changed", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("prolocal-session-changed", load);
    };
  }, []);

  // Ferme dropdowns au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropRef.current?.contains(e.target as Node)) setDropOpen(false);
      if (!adminDropRef.current?.contains(e.target as Node)) setAdminDropOpen(false);
      if (!catRef.current?.contains(e.target as Node))  setCatOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    clearSession(); setProSession(null); setAdminSession(null); setDropOpen(false); setAdminDropOpen(false); setOpen(false); router.push("/");
  };

  const initials = proSession
    ? `${proSession.firstName[0]}${proSession.lastName[0]}`.toUpperCase()
    : "";

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-landes-forest to-landes-ocean rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-landes-pine">Prolocal</span>
              <span className="text-lg font-bold text-landes-sage">-landes</span>
              <span className="text-xs text-gray-400 block leading-none">.fr</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-600 hover:text-landes-forest font-medium transition-colors">
              Accueil
            </Link>

            {/* Catégories avec mega-menu */}
            <div className="relative" ref={catRef}>
              <button
                onMouseEnter={() => setCatOpen(true)}
                onFocus={() => setCatOpen(true)}
                onClick={() => setCatOpen(v => !v)}
                className="flex items-center gap-1.5 text-gray-600 hover:text-landes-forest font-medium transition-colors"
              >
                Catégories
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${catOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Mega menu */}
              {catOpen && (
                <div
                  onMouseLeave={() => setCatOpen(false)}
                  className="fixed left-1/2 -translate-x-1/2 top-16 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                  style={{ width: "min(1160px, 96vw)" }}
                >
                  {/* Header */}
                  <div className="px-5 py-3 bg-landes-forest/5 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-landes-pine flex items-center gap-2">
                      <Grid3X3 className="w-4 h-4 text-landes-sage" />
                      Toutes les catégories
                    </p>
                    <Link href="/categories" onClick={() => setCatOpen(false)}
                      className="text-xs text-landes-forest hover:underline font-medium">
                      Voir toutes →
                    </Link>
                  </div>

                  {/* Grille des catégories + sous-catégories */}
                  <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-5 max-h-[75vh] overflow-y-auto">
                    {categories.map(cat => {
                      const subs = cat.subcategories;
                      return (
                        <div key={cat.slug}>
                          <Link
                            href={`/categories/${cat.slug}`}
                            onClick={() => setCatOpen(false)}
                            className="flex items-center gap-2 mb-1.5 group"
                          >
                            <span className="text-lg leading-none flex-shrink-0">{cat.emoji}</span>
                            <span className="text-sm font-bold text-landes-pine group-hover:text-landes-forest transition-colors leading-tight">
                              {cat.label}
                            </span>
                          </Link>
                          {subs && subs.length > 0 && (
                            <ul className="ml-6 space-y-0.5 border-l border-gray-100 pl-3">
                              {subs.map(sub => (
                                <li key={sub.id}>
                                  <Link
                                    href={`/categories/${cat.slug}/${sub.slug}`}
                                    onClick={() => setCatOpen(false)}
                                    className="block text-xs text-gray-500 hover:text-landes-forest py-0.5 transition-colors leading-snug"
                                  >
                                    {sub.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Link href="/contact" className="text-gray-600 hover:text-landes-forest font-medium transition-colors">
              Nous contacter
            </Link>
          </nav>

          {/* Actions desktop */}
          <div className="hidden md:flex items-center gap-3">
            {proSession ? (
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 bg-landes-forest/8 hover:bg-landes-forest/15 border border-landes-sage/30 rounded-xl px-4 py-2 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-landes-forest text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {initials}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-landes-pine leading-none">{proSession.firstName}</p>
                    <p className="text-xs text-gray-400 leading-none mt-0.5 truncate max-w-[120px]">{proSession.companyName}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropOpen ? "rotate-180" : ""}`} />
                </button>
                {dropOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                    <div className="px-4 py-3 bg-landes-forest/5 border-b border-gray-100">
                      <p className="text-sm font-semibold text-landes-pine">{proSession.firstName} {proSession.lastName}</p>
                      <p className="text-xs text-gray-400 truncate">{proSession.companyName}</p>
                    </div>
                    <Link href="/dashboard" onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-landes-forest/5 hover:text-landes-forest transition-colors">
                      <LayoutDashboard className="w-4 h-4" /> Mon tableau de bord
                    </Link>
                    <Link href={`/annuaire/${proSession.id}`} onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-landes-forest/5 hover:text-landes-forest transition-colors">
                      <User className="w-4 h-4" /> Ma fiche publique
                    </Link>
                    <div className="border-t border-gray-100">
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4" /> Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : adminSession ? (
              <div
                className="relative"
                ref={adminDropRef}
                onMouseEnter={() => setAdminDropOpen(true)}
                onMouseLeave={() => setAdminDropOpen(false)}
              >
                <button
                  className="flex items-center gap-2 bg-landes-forest/8 hover:bg-landes-forest/15 border border-landes-sage/30 rounded-xl px-4 py-2 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-landes-forest flex-shrink-0" />
                  <span className="text-sm font-semibold text-landes-pine">{adminSession.username}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${adminDropOpen ? "rotate-180" : ""}`} />
                </button>
                {adminDropOpen && (
                  <div className="absolute right-0 top-full w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                    {adminSession.panelPath && (
                      <Link href={adminSession.panelPath} onClick={() => setAdminDropOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-landes-forest/5 hover:text-landes-forest transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> Tableau de bord
                      </Link>
                    )}
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" /> Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/connexion" className="flex items-center gap-2 text-gray-600 hover:text-landes-forest font-medium transition-colors">
                  <LogIn className="w-4 h-4" /> Connexion
                </Link>
                <Link href="/inscription" className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
                  <UserPlus className="w-4 h-4" /> Inscrire mon entreprise
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <Link href="/" className="block py-2.5 px-3 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors" onClick={() => setOpen(false)}>
            Accueil
          </Link>

          {/* Catégories accordion mobile */}
          <div>
            <button
              onClick={() => setMobileCatOpen(v => !v)}
              className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              <span>Catégories</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${mobileCatOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileCatOpen && (
              <div className="mt-1 ml-3 border-l-2 border-landes-sage/30 pl-3 space-y-0.5">
                <Link href="/categories" onClick={() => { setOpen(false); setMobileCatOpen(false); }}
                  className="block py-2 px-2 text-sm text-landes-forest font-semibold hover:bg-landes-forest/5 rounded-lg transition-colors">
                  Voir toutes les catégories →
                </Link>
                {categories.map(cat => {
                  const subs = cat.subcategories;
                  const isOpen = mobileSubOpen === cat.slug;
                  return (
                    <div key={cat.slug}>
                      <div className="flex items-center">
                        <Link href={`/categories/${cat.slug}`}
                          onClick={() => { setOpen(false); setMobileCatOpen(false); }}
                          className="flex-1 flex items-center gap-2 py-2 px-2 text-sm text-gray-700 hover:bg-landes-forest/5 hover:text-landes-forest rounded-lg transition-colors">
                          <span>{cat.emoji}</span>
                          <span>{cat.label}</span>
                        </Link>
                        {subs && subs.length > 0 && (
                          <button
                            onClick={() => setMobileSubOpen(isOpen ? null : cat.slug)}
                            className="p-2 text-gray-400 hover:text-landes-forest flex-shrink-0"
                            aria-label={`Sous-catégories de ${cat.label}`}
                          >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                        )}
                      </div>
                      {subs && subs.length > 0 && isOpen && (
                        <div className="ml-6 border-l border-gray-100 pl-3 space-y-0.5 mb-1">
                          {subs.map(sub => (
                            <Link
                              key={sub.id}
                              href={`/categories/${cat.slug}/${sub.slug}`}
                              onClick={() => { setOpen(false); setMobileCatOpen(false); setMobileSubOpen(null); }}
                              className="block py-1.5 px-2 text-xs text-gray-500 hover:text-landes-forest hover:bg-landes-forest/5 rounded-lg transition-colors leading-snug"
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {proSession ? (
            <>
              <div className="flex items-center gap-3 py-2 px-3 border-t border-gray-100 mt-2">
                <div className="w-9 h-9 rounded-full bg-landes-forest text-white text-sm font-bold flex items-center justify-center flex-shrink-0">{initials}</div>
                <div>
                  <p className="font-semibold text-landes-pine text-sm">{proSession.firstName} {proSession.lastName}</p>
                  <p className="text-xs text-gray-400 truncate">{proSession.companyName}</p>
                </div>
              </div>
              <Link href="/dashboard" onClick={() => setOpen(false)}
                className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-gray-700 font-medium hover:bg-gray-50">
                <LayoutDashboard className="w-4 h-4" /> Mon tableau de bord
              </Link>
              <Link href={`/annuaire/${proSession.id}`} onClick={() => setOpen(false)}
                className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-gray-700 font-medium hover:bg-gray-50">
                <User className="w-4 h-4" /> Ma fiche publique
              </Link>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 py-2.5 px-3 rounded-xl text-red-600 font-medium hover:bg-red-50">
                <LogOut className="w-4 h-4" /> Se déconnecter
              </button>
            </>
          ) : adminSession ? (
            <>
              <div className="flex items-center gap-3 py-2 px-3 border-t border-gray-100 mt-2">
                <ShieldCheck className="w-6 h-6 text-landes-forest flex-shrink-0" />
                <p className="font-semibold text-landes-pine text-sm">{adminSession.username}</p>
              </div>
              {adminSession.panelPath && (
                <Link href={adminSession.panelPath} onClick={() => setOpen(false)}
                  className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-gray-700 font-medium hover:bg-gray-50">
                  <LayoutDashboard className="w-4 h-4" /> Tableau de bord
                </Link>
              )}
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 py-2.5 px-3 rounded-xl text-red-600 font-medium hover:bg-red-50">
                <LogOut className="w-4 h-4" /> Se déconnecter
              </button>
            </>
          ) : (
            <>
              <Link href="/contact"     className="block py-2.5 px-3 rounded-xl text-gray-700 font-medium hover:bg-gray-50" onClick={() => setOpen(false)}>Nous contacter</Link>
              <Link href="/inscription" className="block py-2.5 px-3 rounded-xl text-gray-700 font-medium hover:bg-gray-50" onClick={() => setOpen(false)}>Référencer mon entreprise</Link>
              <Link href="/connexion"   className="block py-2.5 px-3 rounded-xl text-gray-700 font-medium hover:bg-gray-50" onClick={() => setOpen(false)}>Connexion</Link>
              <Link href="/inscription" className="btn-primary block text-center mt-2" onClick={() => setOpen(false)}>Inscrire mon entreprise</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
