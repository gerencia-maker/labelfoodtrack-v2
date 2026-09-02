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
  const [presetLoaded, setPresetLoaded] = useState(false);

  const loadPreset = useCallback(async (): Promise<PrintPresetConfig> => {
    try {
      const token = await getToken();
      if (token) {
        const res = await fetch("/api/print-presets", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const list = await res.json();
          // Find active preset, or fall back to first
          const data = Array.isArray(list)
            ? list.find((p: { isActive?: boolean }) => p.isActive) || list[0]
            : list;
          if (data) {
            const loadedPreset: PrintPresetConfig = {
              widthMm: data.widthMm,
              heightMm: data.heightMm,
              marginTop: data.marginTop,
              marginRight: data.marginRight,
              marginBottom: data.marginBottom,
              marginLeft: data.marginLeft,
              orientation: data.orientation || "landscape",
              dpi: data.dpi || 203,
              fontSize: data.fontSize || 0,
              printScale: data.printScale || 100,
            };
            setPreset(loadedPreset);
            return loadedPreset;
          }
        }
      }
    } catch {
      // Use defaults on error.
    } finally {
      setPresetLoaded(true);
    }
    return DEFAULT_PRINT_PRESET;
  }, [getToken]);

  useEffect(() => {
    void loadPreset();
  }, [loadPreset]);

  const triggerPrint = useCallback(async (override?: PrintPresetConfig) => {
    const activePreset = override || (presetLoaded ? preset : await loadPreset());
    injectPrintStyles(activePreset);

    // Two frames ensure the browser applies @page before opening its print dialog.
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    window.print();
  }, [loadPreset, preset, presetLoaded]);

  return { preset, presetLoaded, triggerPrint };
}
