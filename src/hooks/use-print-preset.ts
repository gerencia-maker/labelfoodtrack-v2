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
    injectPrintStyles(preset);

    // Force dimensions via inline styles using px (96dpi for screen)
    const PX_PER_MM = 96 / 25.4; // 3.78px per mm
    const container = document.getElementById("printMatrixContainer");
    const label = document.getElementById("printMatrixLabel");

    if (container && label) {
      const w = preset.widthMm;
      const h = preset.heightMm;
      const mt = preset.marginTop;
      const mr = preset.marginRight;
      const mb = preset.marginBottom;
      const ml = preset.marginLeft;

      const containerWpx = Math.round(w * PX_PER_MM);
      const containerHpx = Math.round(h * PX_PER_MM);
      const contentWpx = Math.round((w - ml - mr) * PX_PER_MM);
      const contentHpx = Math.round((h - mt - mb) * PX_PER_MM);

      // Calculate font that fits
      const userFontPt = preset.fontSize > 0
        ? preset.fontSize
        : Math.max(3.5, Math.min(7, (h / 45) * 5));
      const ptToMm = 0.353;
      const headerH = userFontPt * ptToMm * 3;
      const rowH = userFontPt * ptToMm * 1.3 + 0.3;
      const totalH = headerH + (11 * rowH);
      const availH = h - mt - mb;
      const scale = Math.min(1, availH / totalH);
      const fontPt = userFontPt * scale;

      // Apply fixed px dimensions inline
      container.setAttribute("style", `
        display: block !important;
        visibility: visible !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: ${containerWpx}px !important;
        height: ${containerHpx}px !important;
        max-width: ${containerWpx}px !important;
        max-height: ${containerHpx}px !important;
        padding: ${Math.round(mt * PX_PER_MM)}px ${Math.round(mr * PX_PER_MM)}px ${Math.round(mb * PX_PER_MM)}px ${Math.round(ml * PX_PER_MM)}px !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        background: #fff !important;
        z-index: 999999 !important;
      `);

      label.setAttribute("style", `
        width: ${contentWpx}px !important;
        height: ${contentHpx}px !important;
        max-height: ${contentHpx}px !important;
        font-size: ${fontPt.toFixed(1)}pt !important;
        font-family: Arial, sans-serif !important;
        color: #000 !important;
        overflow: hidden !important;
      `);

      const table = label.querySelector("table") as HTMLTableElement | null;
      if (table) {
        table.setAttribute("style", `
          width: ${contentWpx}px !important;
          height: ${contentHpx}px !important;
          max-height: ${contentHpx}px !important;
          border-collapse: collapse !important;
          border: 1px solid #000 !important;
          table-layout: fixed !important;
        `);
      }

      // QR
      const qrMm = Math.min((w - ml - mr) * 0.18, availH * 0.6);
      const qrPx = Math.max(20, Math.round(qrMm * PX_PER_MM));
      const qrCanvas = label.querySelector(".qr-cell canvas") as HTMLCanvasElement | null;
      if (qrCanvas) {
        qrCanvas.setAttribute("style", `
          width: ${qrPx}px !important;
          height: ${qrPx}px !important;
          display: block !important;
          margin: 0 auto !important;
        `);
      }

      // Font sizes on cells
      label.querySelectorAll("th").forEach(el => {
        el.style.setProperty("font-size", `${(fontPt * 1.15).toFixed(1)}pt`, "important");
        el.style.setProperty("padding", "1px 2px", "important");
      });
      label.querySelectorAll("td").forEach(el => {
        el.style.setProperty("font-size", `${fontPt.toFixed(1)}pt`, "important");
        el.style.setProperty("padding", "1px 2px", "important");
        el.style.setProperty("line-height", "1.15", "important");
      });
      label.querySelectorAll(".multiline-row td").forEach(el => {
        (el as HTMLElement).style.setProperty("font-size", `${Math.max(2.5, fontPt * 0.75).toFixed(1)}pt`, "important");
        (el as HTMLElement).style.setProperty("line-height", "1.05", "important");
      });
    }

    // Print, then clean up inline styles
    setTimeout(() => {
      window.print();

      // After print dialog closes, reset inline styles
      if (container) container.removeAttribute("style");
      if (label) label.removeAttribute("style");
      const table = label?.querySelector("table") as HTMLTableElement | null;
      if (table) table.removeAttribute("style");
      label?.querySelectorAll("th, td").forEach(el => (el as HTMLElement).removeAttribute("style"));
      const qrCanvas = label?.querySelector(".qr-cell canvas") as HTMLCanvasElement | null;
      if (qrCanvas) qrCanvas.removeAttribute("style");
    }, 200);
  }, [preset]);

  return { preset, triggerPrint };
}
