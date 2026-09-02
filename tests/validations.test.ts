import assert from "node:assert/strict";
import test from "node:test";
import { bitacoraSchema } from "../src/lib/validations/bitacora";
import { labelSchema } from "../src/lib/validations/label";

const validLabel = {
  productId: "product-1",
  productName: "Salsa de tomate",
  productionDate: "2026-09-02",
  expiryRefrigerated: "2026-09-10",
  quantityProduced: "12 kg",
};

test("label input accepts traceability fields used by the atomic print flow", () => {
  const result = labelSchema.safeParse(validLabel);

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.quantityProduced, "12 kg");
    assert.equal(result.data.expiryRefrigerated, "2026-09-10");
  }
});

test("label and bitacora inputs reject impossible or malformed dates", () => {
  assert.equal(labelSchema.safeParse({ ...validLabel, productionDate: "2026-02-30" }).success, false);
  assert.equal(bitacoraSchema.safeParse({ productName: "Salsa", traceDate: "02/09/2026" }).success, false);
});

test("traceability text fields have bounded lengths", () => {
  const oversized = "x".repeat(201);

  assert.equal(labelSchema.safeParse({ ...validLabel, packedBy: oversized }).success, false);
  assert.equal(bitacoraSchema.safeParse({ productName: oversized }).success, false);
});
