"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const { signIn, resetPassword, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth");

  // Redirect to dashboard if already logged in
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
    } catch {
      setError("Credenciales invalidas. Verifica tu correo y contrasena.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError("Ingresa tu correo electronico primero.");
      return;
    }

    try {
      await resetPassword(email);
      setShowReset(false);
      setError("");
      alert("Se envio un correo para restablecer tu contrasena.");
    } catch {
      setError("Error al enviar correo de restablecimiento.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            LABELFOODTRACK
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Panel de etiquetado inteligente
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("email")}
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("password")}
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : t("login")}
          </Button>
        </form>

        <div className="text-center">
          {showReset ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-500">
                Ingresa tu correo y presiona el boton:
              </p>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Enviar correo de restablecimiento
              </Button>
              <button
                className="block w-full text-sm text-slate-400 hover:text-slate-600"
                onClick={() => setShowReset(false)}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => setShowReset(true)}
            >
              {t("forgotPassword")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
