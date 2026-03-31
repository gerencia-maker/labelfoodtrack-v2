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
    // Step 1: inject styles with user font size
    injectPrintStyles(preset);

    const label = document.getElementById("printMatrixLabel");
    if (label) {
      const pxPerMm = 3.78;
      const availH = (preset.heightMm - preset.marginTop - preset.marginBottom) * pxPerMm;

      // Reset
      label.style.transform = "none";
      label.style.width = `${(preset.widthMm - preset.marginLeft - preset.marginRight) * pxPerMm}px`;
      label.style.height = "auto";

      const contentH = label.scrollHeight;

      // If overflows, reduce font size and re-inject
      if (contentH > availH && contentH > 0) {
        const scale = availH / contentH;
        const currentFont = preset.fontSize > 0
          ? preset.fontSize
          : Math.max(3.5, Math.min(7, (preset.heightMm / 45) * 5));
        const adjustedFont = currentFont * scale * 0.95; // 5% extra margin

        // Re-inject with reduced font
        const adjustedPreset = { ...preset, fontSize: adjustedFont };
        injectPrintStyles(adjustedPreset);

        // Reset inline styles
        label.style.transform = "";
        label.style.width = "";
        label.style.height = "";
      } else {
        label.style.transform = "";
        label.style.width = "";
        label.style.height = "";
      }
    }

    setTimeout(() => window.print(), 200);
  }, [preset]);

  return { preset, triggerPrint };
}
