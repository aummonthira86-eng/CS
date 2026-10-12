import { describe, expect, it } from "vitest";
import { seedState } from "@/lib/faq/seed";
import { keywordSearch, semanticSearch, findDuplicates } from "@/lib/faq/search";
import { EVAL_CASES } from "@/lib/faq/eval-cases";
import { parseCsv, toCsv } from "@/lib/faq/csv";
import { can } from "@/lib/faq/types";

const faqs = seedState().faqs;

describe("FAQ search", () => {
  it("semantic search ranks 'เติมเงินแล้วไม่ได้รับเหรียญ' first for the brief's three example queries", () => {
    for (const q of [
      "จ่ายเงินแล้วของไม่มา",
      "โอนเงินแล้วไม่ได้เหรียญ",
      "เงินหักแล้วแต่ยอดไม่เพิ่ม",
    ]) {
      expect(semanticSearch(faqs, q)[0]?.faq.faq_id).toBe("faq-001");
    }
  });

  it("semantic search finds the expected FAQ in the top 3 for at least 90% of evaluation cases", () => {
    const passed = EVAL_CASES.filter((c) =>
      semanticSearch(faqs, c.query)
        .slice(0, 3)
        .some((h) => h.faq.faq_id === c.expected),
    );
    expect(passed.length / EVAL_CASES.length).toBeGreaterThanOrEqual(0.9);
  });

  it("keyword search matches partial Thai text", () => {
    expect(keywordSearch(faqs, "รหัสผ่าน")[0]?.faq.faq_id).toBe("faq-006");
  });

  it("flags a near-identical question as duplicate", () => {
    expect(findDuplicates(faqs, "เติมเงินแล้ว ไม่ได้รับเหรียญ")[0]?.faq.faq_id).toBe("faq-001");
  });
});

describe("CSV", () => {
  it("round-trips Thai text with commas and quotes", () => {
    const csv = toCsv(["q"], [['ถาม, "ตอบ"']]);
    expect(parseCsv(csv)).toEqual([["q"], ['ถาม, "ตอบ"']]);
  });
});

describe("mock roles", () => {
  it("viewer cannot edit, editor cannot delete, admin can do everything", () => {
    expect(can("viewer", "edit")).toBe(false);
    expect(can("editor", "edit")).toBe(true);
    expect(can("editor", "delete")).toBe(false);
    expect(can("admin", "delete")).toBe(true);
  });
});
