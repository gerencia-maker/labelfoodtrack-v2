"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  injectPrintStyles,
  DEFAULT_PRINT_PRESET,
  type PrintPresetConfig,
} from "@/lib/print-style";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function usePrintPreset() {
  const { getToken } = useAuth();
  const [preset, setPreset] = useState<PrintPresetConfig>(DEFAULT_PRINT_PRESET);

  useEffect(() => {
    if (DEMO_MODE) return;
    async function load() {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await fetch("/api/print-presets", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setPreset({
              widthMm: data.widthMm,
              heightMm: data.heightMm,
              marginTop: data.marginTop,
              marginRight: data.marginRight,
              marginBottom: data.marginBottom,
              marginLeft: data.marginLeft,
            });
          }
        }
      } catch {
        // Use defaults on error
      }
    }
    load();
  }, [getToken]);

  const triggerPrint = useCallback(() => {
    injectPrintStyles(preset);
    setTimeout(() => window.print(), 100);
  }, [preset]);

  return { preset, triggerPrint };
}
