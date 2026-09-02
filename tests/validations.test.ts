import assert from "node:assert/strict";
import test from "node:test";
import { bitacoraSchema } from "../src/lib/validations/bitacora";
import { labelSchema } from "../src/lib/validations/label";
import { productSchema } from "../src/lib/validations/product";
import { createUserSchema, updateUserSchema } from "../src/lib/validations/user";
import { updateInstanceSchema } from "../src/lib/validations/instance";

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

test("user inputs reject weak passwords, unknown roles and unknown permissions", () => {
  const baseUser = {
    email: "user@example.com",
    password: "a-secure-password",
    name: "User",
    role: "EDITOR",
    permisos: ["products", "products.editar"],
  };

  assert.equal(createUserSchema.safeParse(baseUser).success, true);
  assert.equal(createUserSchema.safeParse({ ...baseUser, password: "123456" }).success, false);
  assert.equal(createUserSchema.safeParse({ ...baseUser, role: "OWNER" }).success, false);
  assert.equal(
    createUserSchema.safeParse({ ...baseUser, permisos: ["configuration.become_admin"] }).success,
    false
  );
  assert.equal(updateUserSchema.safeParse({}).success, false);
});

test("instance and product inputs have bounded security-sensitive fields", () => {
  assert.equal(updateInstanceSchema.safeParse({ plan: "UNLIMITED" }).success, false);
  assert.equal(
    updateInstanceSchema.safeParse({ destinations: Array.from({ length: 101 }, (_, i) => `D${i}`) })
      .success,
    false
  );

  const product = {
    code: "P-1",
    name: "Producto",
    refrigeratedDays: 30,
    frozenDays: 0,
    ambientDays: 0,
  };
  assert.equal(productSchema.safeParse(product).success, true);
  assert.equal(productSchema.safeParse({ ...product, refrigeratedDays: 100_000 }).success, false);
  assert.equal(productSchema.safeParse({ ...product, name: "x".repeat(201) }).success, false);
});
