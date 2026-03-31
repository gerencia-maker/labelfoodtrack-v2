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
    // 1. Inject print styles (font, page size, QR)
    injectPrintStyles(preset);

    // 2. Auto-scale: measure real DOM content
    const label = document.getElementById("printMatrixLabel");
    if (label) {
      const pxPerMm = 3.78; // 96dpi screen
      const availW = (preset.widthMm - preset.marginLeft - preset.marginRight) * pxPerMm;
      const availH = (preset.heightMm - preset.marginTop - preset.marginBottom) * pxPerMm;

      // Reset previous transforms
      label.style.transform = "none";
      label.style.transformOrigin = "top left";
      label.style.width = `${availW}px`;
      label.style.height = "auto";

      // Measure natural content size
      const contentH = label.scrollHeight;
      const contentW = label.scrollWidth;

      console.log("[print-debug]", {
        availW, availH, contentW, contentH,
        fontSize: preset.fontSize,
        preset,
      });

      if (contentH > availH || contentW > availW) {
        const scaleX = availW / contentW;
        const scaleY = availH / contentH;
        const scale = Math.min(scaleX, scaleY);
        console.log("[print-debug] scaling to:", scale);
        label.style.transform = `scale(${scale})`;
        label.style.width = `${availW / scale}px`;
        label.style.height = `${contentH}px`;
      } else {
        label.style.width = "100%";
        label.style.height = "100%";
      }
    }

    // 3. Print
    setTimeout(() => window.print(), 200);
  }, [preset]);

  return { preset, triggerPrint };
}
