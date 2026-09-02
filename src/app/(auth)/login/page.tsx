"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Eye, EyeOff, Tag, CheckCircle2, Building2 } from "lucide-react";
import { SpiralAnimation } from "@/components/ui/spiral-animation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { signIn, resetPassword, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth");

  // Instance selector
  const [instanceSearch, setInstanceSearch] = useState("");
  const [instances, setInstances] = useState<{ id: string; name: string; logoUrl: string | null }[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<{ id: string; name: string; logoUrl: string | null } | null>(null);
  const [showInstanceDropdown, setShowInstanceDropdown] = useState(false);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const instanceRef = useRef<HTMLDivElement>(null);

  // Load instances for search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (instanceSearch.trim().length < 2) { setInstances([]); return; }
      setLoadingInstances(true);
      try {
        const res = await fetch(`/api/instances/public?q=${encodeURIComponent(instanceSearch)}`);
        if (res.ok) setInstances(await res.json());
      } catch { /* silent */ }
      setLoadingInstances(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [instanceSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (instanceRef.current && !instanceRef.current.contains(e.target as Node)) {
        setShowInstanceDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!authLoading && userData) {
      router.push("/");
    }
  }, [userData, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Set instance cookie before login
      if (selectedInstance) {
        document.cookie = `lft-instance-id=${selectedInstance.id};path=/;max-age=${60 * 60 * 24 * 365}`;
      } else {
        document.cookie = "lft-instance-id=;path=/;max-age=0";
      }

      // Set Firebase persistence based on checkbox
      const { getAuth, browserLocalPersistence, browserSessionPersistence, setPersistence } = await import("firebase/auth");
      const auth = getAuth();
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      // Sign in with Firebase
      await signIn(email, password);

      // Verify user belongs to this instance
      const token = await (await import("firebase/auth")).getAuth().currentUser?.getIdToken();
      if (token) {
        const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const userData = await res.json();
          if (!userData.isSuperAdmin && !selectedInstance) {
            await (await import("firebase/auth")).getAuth().signOut();
            setError(t("instanceRequired"));
            setLoading(false);
            return;
          }
          // Super-admin can access any instance
          if (!userData.isSuperAdmin && selectedInstance && userData.instanceId !== selectedInstance.id) {
            // Sign out - wrong instance
            await (await import("firebase/auth")).getAuth().signOut();
            document.cookie = "lft-instance-id=;path=/;max-age=0";
            setError(t("wrongInstance"));
            setLoading(false);
            return;
          }
        }
      }

      router.push("/");
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      const code = firebaseError.code || "";
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        setError(t("wrongCredentials"));
      } else if (code === "auth/wrong-password") {
        setError(t("wrongPassword"));
      } else if (code === "auth/too-many-requests") {
        setError(t("tooManyRequests"));
      } else if (code === "auth/invalid-email") {
        setError(t("invalidEmail"));
      } else if (code === "auth/api-key-not-valid.-please-pass-a-valid-api-key.") {
        setError(t("apiKeyError"));
      } else {
        setError(`Error: ${code || firebaseError.message || "Error desconocido"}`);
      }
      console.error("[login] Firebase error:", code, firebaseError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError(t("enterEmailFirst"));
      return;
    }

    try {
      await resetPassword(email);
      setShowReset(false);
      setError("");
      alert(t("resetEmailSent"));
    } catch {
      setError(t("resetError"));
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAFAF9]">
      {/* Left panel - spiral animation */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
        {/* Spiral animation background */}
        <div className="absolute inset-0">
          <SpiralAnimation />
        </div>

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-end px-16 pb-16 text-white">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <Tag className="h-7 w-7 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">
            LabelFoodTrack
          </h1>
          <p className="text-lg text-white/70 mb-8">
            {t("heroSubtitle")}
          </p>

          <div className="space-y-3 text-white/70">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium">{t("feature1")}</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium">{t("feature2")}</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium">{t("feature3")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
                  <Tag className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="font-bold text-slate-800">Label</span>
                  <span className="font-light text-orange-600">FoodTrack</span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">
                {t("welcome")}
              </h2>
              <p className="text-slate-500 mt-1">
                {t("welcomeDesc")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Instance */}
              <div className="space-y-1.5" ref={instanceRef}>
                <label className="text-sm font-medium text-slate-700">
                  {t("instance")}
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  {selectedInstance ? (
                    <div
                      className="flex items-center gap-2 h-11 rounded-lg border border-orange-300 bg-orange-50 px-10 cursor-pointer"
                      onClick={() => { setSelectedInstance(null); setInstanceSearch(""); setShowInstanceDropdown(true); }}
                    >
                      {selectedInstance.logoUrl && (
                        <img src={selectedInstance.logoUrl} alt="" className="h-5 w-5 rounded object-contain" />
                      )}
                      <span className="text-sm font-medium text-orange-700">{selectedInstance.name}</span>
                    </div>
                  ) : (
                    <Input
                      type="text"
                      placeholder={t("instancePlaceholder")}
                      value={instanceSearch}
                      onChange={(e) => { setInstanceSearch(e.target.value); setShowInstanceDropdown(true); }}
                      onFocus={() => instanceSearch.length >= 1 && setShowInstanceDropdown(true)}
                      disabled={loading}
                      className="pl-10 border-slate-200 focus:ring-orange-500/20 focus:border-orange-400 h-11"
                    />
                  )}
                  {showInstanceDropdown && !selectedInstance && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-slate-200 bg-white shadow-lg z-50 overflow-hidden">
                      {loadingInstances ? (
                        <div className="px-3 py-3 text-xs text-slate-400 text-center">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-400 border-t-transparent mx-auto" />
                        </div>
                      ) : instances.length > 0 ? (
                        instances.map((inst) => (
                          <button
                            key={inst.id}
                            type="button"
                            onClick={() => { setSelectedInstance(inst); setShowInstanceDropdown(false); setInstanceSearch(""); }}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-orange-50 transition-colors"
                          >
                            {inst.logoUrl ? (
                              <img src={inst.logoUrl} alt="" className="h-6 w-6 rounded object-contain" />
                            ) : (
                              <Building2 size={16} className="text-slate-400" />
                            )}
                            <span className="text-sm font-medium text-slate-700">{inst.name}</span>
                          </button>
                        ))
                      ) : instanceSearch.length >= 1 ? (
                        <div className="px-3 py-3 text-xs text-slate-400 text-center">{t("noInstanceFound")}</div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  {t("email")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 border-slate-200 focus:ring-orange-500/20 focus:border-orange-400 h-11"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  {t("password")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 pr-10 border-slate-200 focus:ring-orange-500/20 focus:border-orange-400 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500/20"
                />
                <span className="text-sm text-slate-600">{t("rememberMe")}</span>
              </label>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 shadow-lg shadow-orange-200/50 text-base font-medium"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t("loggingIn")}
                  </div>
                ) : (
                  t("login")
                )}
              </Button>
            </form>

            {/* Forgot password */}
            <div className="mt-6 text-center">
              {showReset ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">
                    {t("enterEmailFirst")}
                  </p>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    {t("sendResetEmail")}
                  </Button>
                  <button
                    className="block w-full text-sm text-slate-400 hover:text-slate-600"
                    onClick={() => setShowReset(false)}
                  >
                    {t("cancel")}
                  </button>
                </div>
              ) : (
                <button
                  className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                  onClick={() => setShowReset(true)}
                >
                  {t("forgotPassword")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
