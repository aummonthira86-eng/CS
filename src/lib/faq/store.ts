import { useSyncExternalStore } from "react";
import { defaultSettings, seedState } from "./seed";
import type { Category, DataState, Faq, Role } from "./types";
import { authStore, useAuth } from "@/lib/auth/auth-store";

/**
 * Data source abstraction: swap localStorage for an online database later
 * by providing another implementation of this interface.
 */
export interface DataSource {
  load(): DataState | null;
  save(state: DataState): void;
  clear(): void;
}

const KEY = "faq-mgmt:test-data:v1";

export const localStorageSource: DataSource = {
  load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as DataState;
      if (!Array.isArray(parsed.faqs) || !Array.isArray(parsed.categories)) return null;
      return { ...parsed, settings: { ...defaultSettings, ...parsed.settings } };
    } catch {
      return null;
    }
  },
  save(state) {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  },
  clear() {
    window.localStorage.removeItem(KEY);
  },
};

export type Snapshot = DataState & { loaded: boolean };

const SERVER_SNAPSHOT: Snapshot = {
  loaded: false,
  faqs: [],
  categories: [],
  settings: defaultSettings,
};

let source: DataSource = localStorageSource;
let state: Snapshot | null = null;
const listeners = new Set<() => void>();

export function setDataSource(s: DataSource) {
  source = s;
  state = null;
}

function ensure(): Snapshot {
  if (!state) {
    const loaded = source.load();
    const data = loaded ?? seedState();
    state = { loaded: true, ...data };
    if (!loaded) source.save(data);
  }
  return state;
}

function commit(next: DataState) {
  state = { loaded: true, ...next };
  source.save(next);
  listeners.forEach((l) => l());
}

function current(): DataState {
  const { loaded: _l, ...rest } = ensure();
  return rest;
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export type FaqInput = Pick<Faq, "question" | "answer" | "category_id" | "keywords" | "status">;

export const store = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot: ensure,
  getServerSnapshot: () => SERVER_SNAPSHOT,

  addFaq(input: FaqInput): Faq {
    const now = new Date().toISOString();
    const faq: Faq = { ...input, faq_id: newId("faq"), created_at: now, updated_at: now };
    const s = current();
    commit({ ...s, faqs: [faq, ...s.faqs] });
    return faq;
  },
  updateFaq(id: string, input: FaqInput) {
    const s = current();
    commit({
      ...s,
      faqs: s.faqs.map((f) =>
        f.faq_id === id ? { ...f, ...input, updated_at: new Date().toISOString() } : f,
      ),
    });
  },
  deleteFaq(id: string) {
    const s = current();
    commit({ ...s, faqs: s.faqs.filter((f) => f.faq_id !== id) });
  },
  importFaqs(faqs: Faq[], newCategories: Category[] = []) {
    const s = current();
    commit({ ...s, categories: [...s.categories, ...newCategories], faqs: [...faqs, ...s.faqs] });
  },

  addCategory(input: Omit<Category, "category_id">): Category {
    const cat = { ...input, category_id: newId("cat") };
    const s = current();
    commit({ ...s, categories: [...s.categories, cat] });
    return cat;
  },
  updateCategory(id: string, patch: Partial<Omit<Category, "category_id">>) {
    const s = current();
    commit({
      ...s,
      categories: s.categories.map((c) => (c.category_id === id ? { ...c, ...patch } : c)),
    });
  },
  /** Refuses to delete a category that still has FAQs or sub-categories, so no FAQ is lost. */
  deleteCategory(id: string): { ok: true } | { ok: false; reason: string } {
    const s = current();
    const faqCount = s.faqs.filter((f) => f.category_id === id).length;
    const childCount = s.categories.filter((c) => c.parent_id === id).length;
    if (faqCount > 0)
      return { ok: false, reason: `ยังมี FAQ ${faqCount} รายการในหมวดนี้ กรุณาย้าย FAQ ก่อนลบ` };
    if (childCount > 0)
      return { ok: false, reason: `ยังมีหมวดย่อย ${childCount} หมวด กรุณาลบหรือย้ายหมวดย่อยก่อน` };
    commit({ ...s, categories: s.categories.filter((c) => c.category_id !== id) });
    return { ok: true };
  },
  moveFaqs(fromId: string, toId: string | null) {
    const s = current();
    commit({
      ...s,
      faqs: s.faqs.map((f) => (f.category_id === fromId ? { ...f, category_id: toId } : f)),
    });
  },

  setSetting(key: keyof DataState["settings"], value: string) {
    const s = current();
    commit({ ...s, settings: { ...s.settings, [key]: value } });
  },
  replaceAll(data: DataState) {
    commit({ ...data, settings: { ...defaultSettings, ...data.settings } });
  },
  reset() {
    source.clear();
    commit(seedState());
  },
  exportState(): DataState {
    return current();
  },
};

export function useData(): Snapshot {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function useRole(): Role {
  const { settings } = useData();
  const { user, role } = useAuth();

  // If user is authenticated via Supabase / Auth Store, use their calculated role
  if (user) {
    return role;
  }

  // Fallback to simulated role if present in settings, otherwise default to viewer (safe default)
  const r = settings.mock_role;
  if (r === "owner" || r === "admin" || r === "editor" || r === "viewer") {
    return r as Role;
  }
  return "viewer";
}
