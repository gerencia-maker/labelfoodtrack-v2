import assert from "node:assert/strict";
import test from "node:test";
import { hasActionPermission, hasPermission } from "../src/lib/permissions";

test("admins retain full module and action access", () => {
  assert.equal(hasPermission("ADMIN", [], "products"), true);
  assert.equal(hasActionPermission("ADMIN", [], "products", "eliminar"), true);
});

test("viewer access is read-only and limited to assigned modules", () => {
  const permissions = ["dashboard", "products"];

  assert.equal(hasPermission("VIEWER", permissions, "products"), true);
  assert.equal(hasPermission("VIEWER", permissions, "labels"), false);
  assert.equal(hasPermission("VIEWER", [...permissions, "ai_features"], "ai_features"), false);
  assert.equal(hasActionPermission("VIEWER", [...permissions, "products.editar"], "products", "editar"), false);
});

test("editors need both the module and the exact action", () => {
  assert.equal(
    hasActionPermission("EDITOR", ["products", "products.editar"], "products", "editar"),
    true
  );
  assert.equal(hasActionPermission("EDITOR", ["products"], "products", "editar"), false);
  assert.equal(hasActionPermission("EDITOR", ["products.editar"], "products", "editar"), false);
});
