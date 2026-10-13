import { describe, expect, it, beforeEach } from "vitest";
import { authStore, DEFAULT_MASTER_KEY } from "@/lib/auth/auth-store";

describe("Owner-Controlled Access Key & Security System", () => {
  beforeEach(async () => {
    await authStore.signOut();
    authStore.resetRateLimit();
    authStore.resetMasterKeyForTesting();
  });

  it("strictly blocks unauthenticated access by default", () => {
    const state = authStore.getSnapshot();
    expect(state.session).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isOwner).toBe(false);
  });

  it("authenticates Master Owner Key with full privileges", async () => {
    const res = await authStore.loginWithKey(DEFAULT_MASTER_KEY);
    expect(res.ok).toBe(true);
    expect(res.role).toBe("owner");

    const state = authStore.getSnapshot();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isOwner).toBe(true);
    expect(state.role).toBe("owner");
    expect(authStore.canAccess("canAccessSettings")).toBe(true);
    expect(authStore.canAccess("canEditFaq")).toBe(true);
    expect(authStore.canAccess("canDeleteFaq")).toBe(true);
  });

  it("authenticates staff member via valid pre-generated Passcode", async () => {
    const res = await authStore.loginWithKey("CS-SUPPORT-2026");
    expect(res.ok).toBe(true);
    expect(res.role).toBe("viewer");

    const state = authStore.getSnapshot();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isOwner).toBe(false);
    expect(authStore.canAccess("canSearch")).toBe(true);
    expect(authStore.canAccess("canCopy")).toBe(true);
    // Viewer cannot edit or delete FAQ or access settings
    expect(authStore.canAccess("canEditFaq")).toBe(false);
    expect(authStore.canAccess("canDeleteFaq")).toBe(false);
    expect(authStore.canAccess("canAccessSettings")).toBe(false);
  });

  it("enforces brute-force lockout after 5 consecutive failed attempts", async () => {
    for (let i = 1; i <= 4; i++) {
      const res = await authStore.loginWithKey(`INVALID_KEY_${i}`);
      expect(res.ok).toBe(false);
      expect(authStore.getSnapshot().rateLimit.failedAttempts).toBe(i);
    }

    // 5th attempt triggers lockout
    const fifthRes = await authStore.loginWithKey("INVALID_KEY_5");
    expect(fifthRes.ok).toBe(false);
    expect(fifthRes.error).toContain("ระงับชั่วคราว");
    expect(authStore.getSnapshot().rateLimit.lockoutUntil).toBeGreaterThan(Date.now());

    // Subsequent attempt is rejected immediately due to lockout
    const lockedRes = await authStore.loginWithKey(DEFAULT_MASTER_KEY);
    expect(lockedRes.ok).toBe(false);
    expect(lockedRes.error).toContain("ระงับชั่วคราว");
  });

  it("blocks user login when Passcode is blocked or revoked by Owner", async () => {
    // 1. Login as Master Owner first to manage keys
    await authStore.loginWithKey(DEFAULT_MASTER_KEY);

    // 2. Block staff key
    const toggleRes = authStore.toggleKeyStatus("key-staff-viewer");
    expect(toggleRes.ok).toBe(true);
    expect(toggleRes.newStatus).toBe("blocked");

    await authStore.signOut();

    // 3. Attempt to login with blocked key
    const res = await authStore.loginWithKey("CS-SUPPORT-2026");
    expect(res.ok).toBe(false);
    expect(res.error).toContain("ระงับการใช้งาน");
  });

  it("allows Owner to create, configure features, and update Passcodes", async () => {
    await authStore.loginWithKey(DEFAULT_MASTER_KEY);

    const created = authStore.createAccessKey({
      key: "CS-NIGHTSHIFT-99",
      name: "ทีม CS กะดึก",
      role: "editor",
      permissions: {
        canSearch: true,
        canCopy: true,
        canEditFaq: true,
        canDeleteFaq: true,
      },
      notes: "ทีมพิเศษ",
    });

    expect(created.ok).toBe(true);
    expect(created.key?.key).toBe("CS-NIGHTSHIFT-99");

    await authStore.signOut();

    // Staff can now login with this new Passcode
    const loginRes = await authStore.loginWithKey("CS-NIGHTSHIFT-99");
    expect(loginRes.ok).toBe(true);
    expect(loginRes.name).toBe("ทีม CS กะดึก");
    expect(authStore.canAccess("canDeleteFaq")).toBe(true);
  });

  it("handles Change Master Key flow securely and invalidates active sessions", async () => {
    await authStore.loginWithKey(DEFAULT_MASTER_KEY);
    expect(authStore.getSnapshot().isAuthenticated).toBe(true);

    // Rejects weak or mismatched keys
    const weakRes = await authStore.changeMasterKey(DEFAULT_MASTER_KEY, "short", "short");
    expect(weakRes.ok).toBe(false);
    expect(weakRes.error).toContain("อย่างน้อย 8 ตัวอักษร");

    // Rejects wrong current key
    const wrongCurRes = await authStore.changeMasterKey(
      "WRONG_KEY",
      "NewMasterKey2026!",
      "NewMasterKey2026!",
    );
    expect(wrongCurRes.ok).toBe(false);
    expect(wrongCurRes.error).toContain("ปัจจุบันไม่ถูกต้อง");

    // Successfully changes Master Key
    const successRes = await authStore.changeMasterKey(
      DEFAULT_MASTER_KEY,
      "NewSecureMasterKey2026!",
      "NewSecureMasterKey2026!",
    );
    expect(successRes.ok).toBe(true);

    // Active session must be invalidated immediately
    expect(authStore.getSnapshot().isAuthenticated).toBe(false);

    // Old key fails
    const oldLogin = await authStore.loginWithKey(DEFAULT_MASTER_KEY);
    expect(oldLogin.ok).toBe(false);

    // New key succeeds
    const newLogin = await authStore.loginWithKey("NewSecureMasterKey2026!");
    expect(newLogin.ok).toBe(true);
    expect(newLogin.role).toBe("owner");
  });
});
