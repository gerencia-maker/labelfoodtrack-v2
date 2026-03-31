"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  injectPrintStyles,
  DEFAULT_PRINT_PRESET,
  type PrintPresetConfig,
} from "@/lib/print-style";

export function usePrintPreset() {
  const { getToken } = useAuth();
  const [preset, setPreset] = useState<PrintPresetConfig>(DEFAULT_PRINT_PRESET);

  useEffect(() => {
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
              orientation: data.orientation || "landscape",
              dpi: data.dpi || 203,
              fontSize: data.fontSize || 0,
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
    const label = document.getElementById("printMatrixLabel");
    if (!label) {
      injectPrintStyles(preset);
      setTimeout(() => window.print(), 200);
      return;
    }

    const pxPerMm = 3.78;
    const availH = (preset.heightMm - preset.marginTop - preset.marginBottom) * pxPerMm;
    const availW = (preset.widthMm - preset.marginLeft - preset.marginRight) * pxPerMm;

    let currentFont = preset.fontSize > 0
      ? preset.fontSize
      : Math.max(3.5, Math.min(7, (preset.heightMm / 45) * 5));

    // Iteratively reduce font until content fits (max 10 iterations)
    for (let i = 0; i < 10; i++) {
      const adjustedPreset = { ...preset, fontSize: currentFont };
      injectPrintStyles(adjustedPreset);

      // Force reflow
      label.style.width = `${availW}px`;
      label.style.height = "auto";
      label.offsetHeight; // force reflow

      const contentH = label.scrollHeight;

      if (contentH <= availH) {
        // Fits! Clean up inline styles
        label.style.width = "";
        label.style.height = "";
        break;
      }

      // Reduce font by 10%
      currentFont *= 0.9;
      label.style.width = "";
      label.style.height = "";
    }

    setTimeout(() => window.print(), 200);
  }, [preset]);

  return { preset, triggerPrint };
}
