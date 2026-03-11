"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Eye, EyeOff, Tag, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const { signIn, resetPassword, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth");

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
      await signIn(email, password);
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
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-rose-600">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-yellow-300/20 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Tag className="h-8 w-8 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">
            LabelFoodTrack
          </h1>
          <p className="text-xl text-white/90 mb-10 drop-shadow-md">
            {t("heroSubtitle")}
          </p>

          <div className="space-y-4 text-white/90">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="font-medium drop-shadow-md">{t("feature1")}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="font-medium drop-shadow-md">{t("feature2")}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="font-medium drop-shadow-md">{t("feature3")}</span>
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
