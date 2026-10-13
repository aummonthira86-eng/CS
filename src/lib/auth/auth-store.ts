import { useSyncExternalStore } from "react";
import type { Role } from "@/lib/faq/types";

const MASTER_KEY_HASH_KEY = "faq-mgmt:master-key-hash:v2";
const ACCESS_KEYS_KEY = "faq-mgmt:access-keys:v2";
const AUTH_SESSION_KEY = "faq-mgmt:access-session:v2";
const RATE_LIMIT_KEY = "faq-mgmt:rate-limit:v2";

export const DEFAULT_MASTER_KEY = "CS-MASTER-2026";
// Precomputed SHA-256 for "CS-MASTER-2026"
export const DEFAULT_MASTER_KEY_HASH =
  "f1d69d2d0b50aa22869df3158c89b2533e4b7b3e1f579951cb3298c485fc3fce";

export interface FeaturePermissions {
  canSearch: boolean;
  canCopy: boolean;
  canEditFaq: boolean;
  canDeleteFaq: boolean;
  canManageCategories: boolean;
  canManageGallery: boolean;
  canImportExport: boolean;
  canEvaluate: boolean;
  canAccessSettings: boolean;
}

export const OWNER_PERMISSIONS: FeaturePermissions = {
  canSearch: true,
  canCopy: true,
  canEditFaq: true,
  canDeleteFaq: true,
  canManageCategories: true,
  canManageGallery: true,
  canImportExport: true,
  canEvaluate: true,
  canAccessSettings: true,
};

export const VIEWER_PERMISSIONS: FeaturePermissions = {
  canSearch: true,
  canCopy: true,
  canEditFaq: false,
  canDeleteFaq: false,
  canManageCategories: false,
  canManageGallery: false,
  canImportExport: false,
  canEvaluate: true,
  canAccessSettings: false,
};

export const EDITOR_PERMISSIONS: FeaturePermissions = {
  canSearch: true,
  canCopy: true,
  canEditFaq: true,
  canDeleteFaq: false,
  canManageCategories: true,
  canManageGallery: true,
  canImportExport: true,
  canEvaluate: true,
  canAccessSettings: false,
};

export interface AccessKeyItem {
  id: string;
  key: string;
  name: string;
  role: Role;
  status: "active" | "blocked" | "revoked";
  permissions: FeaturePermissions;
  createdAt: string;
  lastUsedAt?: string;
  notes?: string;
}

export interface AuthSession {
  token: string;
  keyId: string;
  keyCode: string;
  name: string;
  role: Role;
  permissions: FeaturePermissions;
  authenticatedAt: string;
}

export interface RateLimitState {
  failedAttempts: number;
  lockoutUntil: number; // timestamp in ms
}

export interface AuthState {
  session: AuthSession | null;
  role: Role;
  isOwner: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  initialized: boolean;
  accessKeys: AccessKeyItem[];
  rateLimit: RateLimitState;
  user: { id: string; email: string; role: Role } | null;
  isApproved: boolean;
  accessStatus: "approved" | "unauthenticated";
  ownerEmail: string;
  pendingRequests: unknown[];
  pendingCount: number;
}

export const DEFAULT_ACCESS_KEYS: AccessKeyItem[] = [
  {
    id: "key-staff-viewer",
    key: "CS-SUPPORT-2026",
    name: "เจ้าหน้าที่ CS ประจำทีม (CS Agent)",
    role: "viewer",
    status: "active",
    permissions: VIEWER_PERMISSIONS,
    createdAt: "2026-01-01T00:00:00.000Z",
    notes: "รหัสสำหรับเจ้าหน้าที่ CS ค้นหาและคัดลอกคำตอบ",
  },
  {
    id: "key-team-editor",
    key: "CS-EDITOR-2026",
    name: "หัวหน้าทีม CS (Team Lead / Editor)",
    role: "editor",
    status: "active",
    permissions: EDITOR_PERMISSIONS,
    createdAt: "2026-01-01T00:00:00.000Z",
    notes: "รหัสสำหรับแก้ไข เพิ่ม FAQ จัดการหมวดหมู่ และคลังรูปภาพ",
  },
];

export async function sha256(text: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Deterministic fallback for environments without crypto.subtle
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return "hash-" + Math.abs(hash).toString(16);
}

const SERVER_SNAPSHOT: AuthState = {
  session: null,
  role: "viewer",
  isOwner: false,
  isAuthenticated: false,
  loading: false,
  initialized: false,
  accessKeys: DEFAULT_ACCESS_KEYS,
  rateLimit: { failedAttempts: 0, lockoutUntil: 0 },
  user: null,
  isApproved: false,
  accessStatus: "unauthenticated",
  ownerEmail: "owner@system",
  pendingRequests: [],
  pendingCount: 0,
};

let currentAuth: AuthState = { ...SERVER_SNAPSHOT };
let inMemoryMasterKeyHash: string | null = null;
const listeners = new Set<() => void>();

function getStoredMasterKeyHash(): string {
  if (inMemoryMasterKeyHash) return inMemoryMasterKeyHash;
  if (typeof window === "undefined") return DEFAULT_MASTER_KEY_HASH;
  try {
    const stored = window.localStorage.getItem(MASTER_KEY_HASH_KEY);
    return stored || DEFAULT_MASTER_KEY_HASH;
  } catch {
    return DEFAULT_MASTER_KEY_HASH;
  }
}

function getStoredAccessKeys(): AccessKeyItem[] {
  if (typeof window === "undefined") return DEFAULT_ACCESS_KEYS;
  try {
    const raw = window.localStorage.getItem(ACCESS_KEYS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_ACCESS_KEYS;
}

function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getStoredRateLimit(): RateLimitState {
  if (typeof window === "undefined") return { failedAttempts: 0, lockoutUntil: 0 };
  try {
    const raw = window.localStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return { failedAttempts: 0, lockoutUntil: 0 };
    return JSON.parse(raw);
  } catch {
    return { failedAttempts: 0, lockoutUntil: 0 };
  }
}

function persistState() {
  if (typeof window === "undefined") return;
  try {
    if (currentAuth.session) {
      window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(currentAuth.session));
    } else {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
    }
    window.localStorage.setItem(ACCESS_KEYS_KEY, JSON.stringify(currentAuth.accessKeys));
    window.localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(currentAuth.rateLimit));
  } catch {
    // ignore
  }
}

function updateState(patch: Partial<AuthState>) {
  const nextSession = patch.session !== undefined ? patch.session : currentAuth.session;
  const isAuthenticated = Boolean(nextSession);
  const isOwner = nextSession ? nextSession.role === "owner" : false;
  const role = nextSession ? nextSession.role : "viewer";

  currentAuth = {
    ...currentAuth,
    ...patch,
    session: nextSession,
    isAuthenticated,
    isOwner,
    role,
    user: nextSession
      ? {
          id: nextSession.keyId,
          email: nextSession.name,
          role: nextSession.role,
        }
      : null,
    isApproved: isAuthenticated,
    accessStatus: isAuthenticated ? "approved" : "unauthenticated",
  };
  persistState();
  listeners.forEach((l) => l());
}

export const authStore = {
  getSnapshot(): AuthState {
    return currentAuth;
  },
  getServerSnapshot(): AuthState {
    return SERVER_SNAPSHOT;
  },
  subscribe(callback: () => void) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  async init() {
    if (typeof window === "undefined" || currentAuth.initialized) return;

    const accessKeys = getStoredAccessKeys();
    const rateLimit = getStoredRateLimit();
    const storedSession = getStoredSession();

    let validSession: AuthSession | null = null;
    if (storedSession) {
      if (storedSession.keyId === "master-owner") {
        validSession = storedSession;
      } else {
        const found = accessKeys.find((k) => k.id === storedSession.keyId);
        if (found && found.status === "active") {
          validSession = {
            ...storedSession,
            name: found.name,
            role: found.role,
            permissions: found.permissions,
          };
        } else {
          try {
            window.localStorage.removeItem(AUTH_SESSION_KEY);
          } catch {
            // ignore
          }
        }
      }
    }

    updateState({
      session: validSession,
      initialized: true,
      loading: false,
      accessKeys,
      rateLimit,
    });
  },

  /**
   * Primary entry point: Authenticate with a Passcode / Access Key or Master Owner Key
   */
  async loginWithKey(
    keyInput: string,
  ): Promise<{ ok: boolean; role?: Role; name?: string; error?: string }> {
    const clean = keyInput.trim();
    if (!clean) {
      return { ok: false, error: "กรุณาระบุรหัสผ่านเข้าใช้งาน (Access Key / Passcode)" };
    }

    const now = Date.now();
    if (currentAuth.rateLimit.lockoutUntil > now) {
      const waitSeconds = Math.ceil((currentAuth.rateLimit.lockoutUntil - now) / 1000);
      return {
        ok: false,
        error: `ระบบถูกระงับชั่วคราวเนื่องจากใส่รหัสผิดเกินกำหนด กรุณารออีก ${waitSeconds} วินาที`,
      };
    }

    updateState({ loading: true });

    // 1. Check if input matches Master Owner Key
    const masterHash = getStoredMasterKeyHash();
    const inputHash = await sha256(clean);

    const isMasterMatch =
      masterHash !== DEFAULT_MASTER_KEY_HASH
        ? inputHash === masterHash
        : clean === DEFAULT_MASTER_KEY || inputHash === DEFAULT_MASTER_KEY_HASH;

    if (isMasterMatch) {
      const session: AuthSession = {
        token: `tok-master-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        keyId: "master-owner",
        keyCode: "••••••••",
        name: "เจ้าของระบบหลัก (Master Owner)",
        role: "owner",
        permissions: OWNER_PERMISSIONS,
        authenticatedAt: new Date().toISOString(),
      };

      updateState({
        session,
        loading: false,
        rateLimit: { failedAttempts: 0, lockoutUntil: 0 },
      });
      return { ok: true, role: "owner", name: session.name };
    }

    // 2. Check against active Staff Access Keys
    const matchingKey = currentAuth.accessKeys.find(
      (k) => k.key.toUpperCase() === clean.toUpperCase(),
    );

    if (matchingKey) {
      if (matchingKey.status === "blocked") {
        updateState({ loading: false });
        return {
          ok: false,
          error: "รหัสผ่านนี้ถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ (Owner)",
        };
      }
      if (matchingKey.status === "revoked") {
        updateState({ loading: false });
        return {
          ok: false,
          error: "รหัสผ่านนี้ถูกเพิกถอนสิทธิ์แล้ว กรุณาติดต่อผู้ดูแลระบบ",
        };
      }

      const updatedKeys = currentAuth.accessKeys.map((k) =>
        k.id === matchingKey.id ? { ...k, lastUsedAt: new Date().toISOString() } : k,
      );

      const session: AuthSession = {
        token: `tok-staff-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        keyId: matchingKey.id,
        keyCode: matchingKey.key,
        name: matchingKey.name,
        role: matchingKey.role,
        permissions: matchingKey.permissions,
        authenticatedAt: new Date().toISOString(),
      };

      updateState({
        session,
        loading: false,
        accessKeys: updatedKeys,
        rateLimit: { failedAttempts: 0, lockoutUntil: 0 },
      });
      return { ok: true, role: matchingKey.role, name: matchingKey.name };
    }

    // 3. Failed attempt -> increment rate limit counter
    const nextFailed = currentAuth.rateLimit.failedAttempts + 1;
    let nextLockout = 0;
    let errorMsg = `รหัสเข้าใช้งานไม่ถูกต้อง (ใส่ผิดครั้งที่ ${nextFailed}/5)`;

    if (nextFailed >= 5) {
      nextLockout = Date.now() + 180 * 1000; // 3 minutes lockout
      errorMsg = "ใส่รหัสผิดเกิน 5 ครั้ง ระบบถูกระงับชั่วคราว 3 นาที เพื่อความปลอดภัย";
    }

    updateState({
      loading: false,
      rateLimit: {
        failedAttempts: nextFailed,
        lockoutUntil: nextLockout,
      },
    });

    return { ok: false, error: errorMsg };
  },

  /**
   * Helper for tests or quick login
   */
  async loginAs(role: "owner" | "viewer") {
    if (role === "owner") {
      return this.loginWithKey(DEFAULT_MASTER_KEY);
    }
    return this.loginWithKey("CS-SUPPORT-2026");
  },

  setOwnerEmail(email: string) {
    updateState({ ownerEmail: email });
  },

  /**
   * Sign out / Lock application
   */
  async signOut() {
    updateState({
      session: null,
      loading: false,
    });
  },

  /**
   * Owner Master Key Management: Change Master Key
   */
  async changeMasterKey(
    currentKey: string,
    newKey: string,
    confirmKey: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const cur = currentKey.trim();
    const next = newKey.trim();
    const conf = confirmKey.trim();

    if (!cur) return { ok: false, error: "กรุณาระบุ Master Key ปัจจุบัน" };
    if (!next) return { ok: false, error: "กรุณาระบุ Master Key ใหม่" };

    const currentStoredHash = getStoredMasterKeyHash();
    const curHash = await sha256(cur);

    const isCurValid =
      currentStoredHash !== DEFAULT_MASTER_KEY_HASH
        ? curHash === currentStoredHash
        : cur === DEFAULT_MASTER_KEY || curHash === DEFAULT_MASTER_KEY_HASH;

    if (!isCurValid) {
      return { ok: false, error: "Master Key ปัจจุบันไม่ถูกต้อง" };
    }

    if (next !== conf) {
      return { ok: false, error: "Master Key ใหม่และการยืนยันไม่ตรงกัน" };
    }

    if (next.length < 8) {
      return { ok: false, error: "Master Key ใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร" };
    }
    const hasLetter = /[a-zA-Z]/.test(next);
    const hasDigitOrSpecial = /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(next);
    if (!hasLetter || !hasDigitOrSpecial) {
      return {
        ok: false,
        error: "Master Key ต้องประกอบด้วยตัวอักษรและตัวเลขหรือสัญลักษณ์พิเศษ",
      };
    }

    if (next === cur) {
      return { ok: false, error: "Master Key ใหม่ต้องไม่ซ้ำกับรหัสปัจจุบัน" };
    }

    const newHash = await sha256(next);
    inMemoryMasterKeyHash = newHash;

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(MASTER_KEY_HASH_KEY, newHash);
      } catch {
        return { ok: false, error: "ไม่สามารถบันทึก Master Key ได้" };
      }
    }

    // Invalidate sessions immediately to force re-authentication
    await this.signOut();

    return { ok: true };
  },

  /**
   * Owner Panel: Create New Access Passcode
   */
  createAccessKey(data: {
    key?: string;
    name: string;
    role: Role;
    permissions?: Partial<FeaturePermissions>;
    notes?: string;
  }): { ok: boolean; key?: AccessKeyItem; error?: string } {
    if (!currentAuth.isOwner) {
      return { ok: false, error: "เฉพาะเจ้าของระบบ (Owner) เท่านั้นที่สามารถสร้างรหัสผ่านได้" };
    }

    const name = data.name.trim();
    if (!name) return { ok: false, error: "กรุณาระบุชื่อผู้ถือรหัสหรือทีมงาน" };

    const generatedKey = (
      data.key?.trim() ||
      `CS-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`
    ).toUpperCase();

    if (
      currentAuth.accessKeys.some((k) => k.key.toUpperCase() === generatedKey) ||
      generatedKey === DEFAULT_MASTER_KEY
    ) {
      return { ok: false, error: "รหัสผ่านนี้มีอยู่ในระบบแล้ว กรุณาเลือกรหัสอื่น" };
    }

    const defaultPerms =
      data.role === "admin"
        ? OWNER_PERMISSIONS
        : data.role === "editor"
          ? EDITOR_PERMISSIONS
          : VIEWER_PERMISSIONS;

    const newKeyItem: AccessKeyItem = {
      id: `key-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      key: generatedKey,
      name,
      role: data.role,
      status: "active",
      permissions: { ...defaultPerms, ...data.permissions },
      createdAt: new Date().toISOString(),
      notes: data.notes?.trim(),
    };

    const nextKeys = [newKeyItem, ...currentAuth.accessKeys];
    updateState({ accessKeys: nextKeys });

    return { ok: true, key: newKeyItem };
  },

  /**
   * Owner Panel: Update Access Key
   */
  updateAccessKey(
    id: string,
    patch: Partial<Omit<AccessKeyItem, "id" | "createdAt">>,
  ): { ok: boolean; error?: string } {
    if (!currentAuth.isOwner) {
      return { ok: false, error: "เฉพาะเจ้าของระบบ (Owner) เท่านั้นที่มีสิทธิ์แก้ไข" };
    }

    const exists = currentAuth.accessKeys.find((k) => k.id === id);
    if (!exists) return { ok: false, error: "ไม่พบรหัสผ่านที่ต้องการแก้ไข" };

    const nextKeys = currentAuth.accessKeys.map((k) => (k.id === id ? { ...k, ...patch } : k));

    let nextSession = currentAuth.session;
    if (currentAuth.session?.keyId === id) {
      if (patch.status === "blocked" || patch.status === "revoked") {
        nextSession = null;
      } else {
        nextSession = {
          ...currentAuth.session,
          name: patch.name ?? currentAuth.session.name,
          role: patch.role ?? currentAuth.session.role,
          permissions: patch.permissions ?? currentAuth.session.permissions,
        };
      }
    }

    updateState({
      accessKeys: nextKeys,
      session: nextSession,
    });

    return { ok: true };
  },

  /**
   * Owner Panel: Instantly Toggle Active / Blocked Status
   */
  toggleKeyStatus(id: string): { ok: boolean; newStatus?: string; error?: string } {
    const item = currentAuth.accessKeys.find((k) => k.id === id);
    if (!item) return { ok: false, error: "ไม่พบรหัสผ่าน" };

    const nextStatus = item.status === "active" ? "blocked" : "active";
    this.updateAccessKey(id, { status: nextStatus });
    return { ok: true, newStatus: nextStatus };
  },

  /**
   * Owner Panel: Revoke / Delete Access Key
   */
  revokeAccessKey(id: string): { ok: boolean; error?: string } {
    if (!currentAuth.isOwner) {
      return { ok: false, error: "เฉพาะเจ้าของระบบ (Owner) เท่านั้นที่มีสิทธิ์ลบรหัส" };
    }

    const nextKeys = currentAuth.accessKeys.filter((k) => k.id !== id);
    let nextSession = currentAuth.session;
    if (currentAuth.session?.keyId === id) {
      nextSession = null;
    }

    updateState({
      accessKeys: nextKeys,
      session: nextSession,
    });

    return { ok: true };
  },

  resetRateLimit() {
    updateState({
      rateLimit: { failedAttempts: 0, lockoutUntil: 0 },
    });
  },

  resetMasterKeyForTesting() {
    inMemoryMasterKeyHash = null;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(MASTER_KEY_HASH_KEY);
      } catch {
        // ignore
      }
    }
  },

  canAccess(permission: keyof FeaturePermissions): boolean {
    if (currentAuth.isOwner) return true;
    if (!currentAuth.session) return false;
    return Boolean(currentAuth.session.permissions[permission]);
  },
};

export function useAuth() {
  const state = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getServerSnapshot,
  );

  return {
    ...state,
    gateEnabled: true,
    can: (permission: keyof FeaturePermissions) => authStore.canAccess(permission),
  };
}
