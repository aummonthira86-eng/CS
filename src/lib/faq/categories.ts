import type { Category } from "./types";

export function sortCats(cats: Category[]) {
  return [...cats].sort(
    (a, b) => a.sort_order - b.sort_order || a.category_name.localeCompare(b.category_name, "th"),
  );
}

export function categoryPath(cats: Category[], id: string | null): string {
  if (!id) return "ไม่ระบุหมวด";
  const c = cats.find((x) => x.category_id === id);
  if (!c) return "ไม่ระบุหมวด";
  const p = c.parent_id ? cats.find((x) => x.category_id === c.parent_id) : null;
  return p ? `${p.category_name} › ${c.category_name}` : c.category_name;
}

/** Flattened tree: main categories followed by their children. */
export function flatTree(cats: Category[]): { cat: Category; depth: number }[] {
  const out: { cat: Category; depth: number }[] = [];
  const mains = sortCats(
    cats.filter((c) => !c.parent_id || !cats.some((p) => p.category_id === c.parent_id)),
  );
  for (const m of mains) {
    out.push({ cat: m, depth: 0 });
    for (const ch of sortCats(cats.filter((c) => c.parent_id === m.category_id)))
      out.push({ cat: ch, depth: 1 });
  }
  return out;
}

/** IDs of a category plus its children (used for filtering). */
export function withChildren(cats: Category[], id: string): Set<string> {
  return new Set([id, ...cats.filter((c) => c.parent_id === id).map((c) => c.category_id)]);
}
