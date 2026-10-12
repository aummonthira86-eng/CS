import { describe, expect, it } from "vitest";
import { applyFix, checkThaiSpelling } from "@/lib/faq/spellcheck";

describe("Thai spell check", () => {
  it("flags a common misspelling and suggests the correct word", () => {
    const issues = checkThaiSpelling("กรุนาติดต่อเจ้าหน้าที่");
    expect(issues[0]).toMatchObject({ wrong: "กรุนา", suggestion: "กรุณา" });
  });

  it("does not flag text that is spelled correctly", () => {
    expect(checkThaiSpelling("ประสบการณ์การเติมเงิน กรุณารอสักครู่ค่ะ")).toEqual([]);
  });

  it("flags duplicated tone marks", () => {
    expect(checkThaiSpelling("ได้้รับ").length).toBe(1);
  });

  it("applying the fix produces text with no remaining issues", () => {
    const fixed = applyFix("ขอบคุนค่ะ", { wrong: "ขอบคุน", suggestion: "ขอบคุณ" });
    expect(fixed).toBe("ขอบคุณค่ะ");
    expect(checkThaiSpelling(fixed)).toEqual([]);
  });
});
