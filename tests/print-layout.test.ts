import assert from "node:assert/strict";
import test from "node:test";
import {
  createPrintStyles,
  getPrintLayout,
  type PrintPresetConfig,
} from "../src/lib/print-style";
import { printPresetSchema } from "../src/lib/validations/print-preset";

const preset: PrintPresetConfig = {
  widthMm: 100,
  heightMm: 45,
  marginTop: 2,
  marginRight: 3,
  marginBottom: 2,
  marginLeft: 3,
  orientation: "landscape",
  dpi: 203,
  fontSize: 0,
  printScale: 100,
};

test("custom page dimensions are normalized by orientation", () => {
  const landscape = getPrintLayout(preset);
  const portrait = getPrintLayout({ ...preset, orientation: "portrait" });

  assert.deepEqual([landscape.pageWidthMm, landscape.pageHeightMm], [100, 45]);
  assert.deepEqual([portrait.pageWidthMm, portrait.pageHeightMm], [45, 100]);
});

test("content scale never changes the physical paper dimensions", () => {
  const normal = getPrintLayout(preset);
  const enlarged = getPrintLayout({ ...preset, printScale: 150 });

  assert.equal(enlarged.pageWidthMm, normal.pageWidthMm);
  assert.equal(enlarged.pageHeightMm, normal.pageHeightMm);
  assert.ok(enlarged.baseFontPt >= normal.baseFontPt);
});

test("print CSS uses valid custom page dimensions and physical QR units", () => {
  const css = createPrintStyles(preset);

  assert.match(css, /size: 100mm 45mm;/);
  assert.doesNotMatch(css, /size:[^;]+landscape/);
  assert.match(css, /\.qr-cell canvas[\s\S]+width: [\d.]+mm !important/);
});

test("print presets reject margins that consume the printable area", () => {
  const result = printPresetSchema.safeParse({
    ...preset,
    name: "Invalid preset",
    marginTop: 22,
    marginBottom: 22,
  });

  assert.equal(result.success, false);
});
