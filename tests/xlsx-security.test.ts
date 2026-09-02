import assert from "node:assert/strict";
import test from "node:test";
import ExcelJS from "exceljs";
import { validateXlsxArchive } from "../src/lib/xlsx-security";

test("XLSX archive inspection accepts a normal workbook", async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet("Productos").addRows([
    ["Codigo", "Item"],
    ["P-1", "Producto"],
  ]);
  const data = await workbook.xlsx.writeBuffer();

  assert.equal(validateXlsxArchive(Buffer.from(data)), true);
});

test("XLSX archive inspection rejects malformed input", () => {
  assert.equal(validateXlsxArchive(Buffer.from("not-a-zip")), false);
});

