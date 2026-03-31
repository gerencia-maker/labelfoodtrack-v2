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
    // Inject @media print CSS
    injectPrintStyles(preset);

    // Also set inline styles directly on elements (Chrome ignores @media print sizes)
    const container = document.getElementById("printMatrixContainer");
    const label = document.getElementById("printMatrixLabel");
    const table = label?.querySelector("table") as HTMLTableElement | null;

    if (container && label) {
      const w = preset.widthMm;
      const h = preset.heightMm;
      const mt = preset.marginTop;
      const mr = preset.marginRight;
      const mb = preset.marginBottom;
      const ml = preset.marginLeft;

      // Calculate font
      const availH = h - mt - mb;
      const userFontPt = preset.fontSize > 0
        ? preset.fontSize
        : Math.max(3.5, Math.min(7, (h / 45) * 5));

      const ptToMm = 0.353;
      const headerH = userFontPt * ptToMm * 4;
      const rowH = userFontPt * ptToMm * 1.5 + 0.5;
      const totalContentH = headerH + (12 * rowH);
      const scale = Math.min(1, (availH * 0.9) / totalContentH);
      const fontPt = userFontPt * scale;

      // QR
      const availW = w - ml - mr;
      const qrMm = Math.min(availW * 0.18, availH * 0.6);
      const qrPx = Math.max(20, Math.round(qrMm * (preset.dpi / 25.4)));

      // Apply inline styles that work regardless of @media print
      container.style.cssText = `
        width: ${w}mm; height: ${h}mm;
        padding: ${mt}mm ${mr}mm ${mb}mm ${ml}mm;
        box-sizing: border-box; overflow: hidden;
      `;
      label.style.cssText = `
        font-size: ${fontPt.toFixed(1)}pt;
        font-family: Arial, sans-serif;
        color: #000; width: 100%; height: 100%;
      `;
      if (table) {
        table.style.cssText = `
          width: 100%; height: 100%;
          border-collapse: collapse; border: 1px solid #000;
          table-layout: fixed;
        `;
      }

      // Set QR canvas size
      const qrCanvas = label.querySelector(".qr-cell canvas") as HTMLCanvasElement | null;
      if (qrCanvas) {
        qrCanvas.style.width = `${qrPx}px`;
        qrCanvas.style.height = `${qrPx}px`;
        qrCanvas.style.maxWidth = "100%";
        qrCanvas.style.maxHeight = "100%";
      }

      // Set font on th and td
      const ths = label.querySelectorAll("th");
      ths.forEach(th => { th.style.fontSize = `${(fontPt * 1.15).toFixed(1)}pt`; });

      const tds = label.querySelectorAll("td");
      tds.forEach(td => { td.style.fontSize = `${fontPt.toFixed(1)}pt`; });

      // Multiline rows smaller
      const multiTds = label.querySelectorAll(".multiline-row td");
      multiTds.forEach(td => {
        (td as HTMLElement).style.fontSize = `${Math.max(2.5, fontPt * 0.75).toFixed(1)}pt`;
      });
    }

    setTimeout(() => window.print(), 200);
  }, [preset]);

  return { preset, triggerPrint };
}
