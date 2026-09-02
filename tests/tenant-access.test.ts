import assert from "node:assert/strict";
import test from "node:test";
import { checkTenantAccess, tenantWhere, type AuthUser } from "../src/lib/auth";

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "user-1",
    firebaseUid: "firebase-1",
    email: "user@example.com",
    name: "User",
    role: "VIEWER",
    permisos: ["products"],
    instanceId: "instance-a",
    isSuperAdmin: false,
    ...overrides,
  };
}

test("tenant filters stay scoped to the authenticated instance", () => {
  assert.deepEqual(tenantWhere(makeUser()), { instanceId: "instance-a" });
});

test("unassigned users never receive a global tenant filter", () => {
  assert.deepEqual(tenantWhere(makeUser({ instanceId: null })), {
    instanceId: "__unassigned__",
  });
});

test("only an unscoped super-admin receives a global filter", () => {
  assert.deepEqual(tenantWhere(makeUser({ instanceId: null, isSuperAdmin: true, role: "ADMIN" })), {});
  assert.deepEqual(
    tenantWhere(makeUser({ instanceId: "instance-b", isSuperAdmin: true, role: "ADMIN" })),
    { instanceId: "instance-b" }
  );
});

test("tenant access rejects cross-tenant and null resources", () => {
  const user = makeUser();
  assert.equal(checkTenantAccess(user, "instance-a"), true);
  assert.equal(checkTenantAccess(user, "instance-b"), false);
  assert.equal(checkTenantAccess(user, null), false);
  assert.equal(checkTenantAccess(makeUser({ instanceId: null }), null), false);
});

test("super-admin tenant access bypass remains explicit", () => {
  const superAdmin = makeUser({ instanceId: null, isSuperAdmin: true, role: "ADMIN" });
  assert.equal(checkTenantAccess(superAdmin, "instance-b"), true);
});
