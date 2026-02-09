"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";
import { ProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ProductFormData } from "@/lib/validations/product";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function NewProductPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const t = useTranslations("products");

  const handleSubmit = async (data: ProductFormData) => {
    if (DEMO_MODE) {
      toast({ title: "Producto creado (demo)", variant: "success" });
      router.push("/");
      return;
    }

    const token = await getToken();
    if (!token) return;

    const res = await fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      toast({ title: err.error || "Error al crear producto", variant: "error" });
      return;
    }

    toast({ title: "Producto creado", variant: "success" });
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("new")}</h1>
          <p className="text-sm text-slate-500">{t("subtitle")}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <ProductForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
