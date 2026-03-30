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
    // 1. Inject base print styles
    injectPrintStyles(preset);

    // 2. Measure actual content by temporarily showing container
    const container = document.getElementById("printMatrixContainer");
    const label = document.getElementById("printMatrixLabel");
    if (container && label) {
      // Save original styles
      const origDisplay = container.style.display;
      const origVisibility = container.style.visibility;
      const origPosition = container.style.position;
      const origLeft = container.style.left;

      // Show offscreen to measure
      container.style.display = "block";
      container.style.visibility = "hidden";
      container.style.position = "absolute";
      container.style.left = "-9999px";

      // Available area in px (96dpi screen)
      const pxPerMm = 3.78;
      const availW = (preset.widthMm - preset.marginLeft - preset.marginRight) * pxPerMm;
      const availH = (preset.heightMm - preset.marginTop - preset.marginBottom) * pxPerMm;

      // Reset any previous transform
      label.style.transform = "none";
      label.style.transformOrigin = "top left";
      label.style.width = `${availW}px`;

      // Force reflow and measure
      const contentH = label.scrollHeight;
      const contentW = label.scrollWidth;

      // Calculate scale
      const scaleX = contentW > 0 ? Math.min(1, availW / contentW) : 1;
      const scaleY = contentH > 0 ? Math.min(1, availH / contentH) : 1;
      const scale = Math.min(scaleX, scaleY);

      if (scale < 1) {
        label.style.transform = `scale(${scale})`;
        label.style.width = `${availW / scale}px`;
      } else {
        label.style.width = "100%";
      }

      // Restore original styles
      container.style.display = origDisplay;
      container.style.visibility = origVisibility;
      container.style.position = origPosition;
      container.style.left = origLeft;
    }

    // 3. Print after a short delay
    setTimeout(() => window.print(), 150);
  }, [preset]);

  return { preset, triggerPrint };
}
