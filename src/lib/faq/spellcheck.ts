/**
 * Local Thai spell check (free, offline). Uses a dictionary of common
 * misspellings + a few character rules. It is NOT a full Thai dictionary:
 * words not in the list are not checked.
 */

export interface SpellIssue {
  wrong: string;
  suggestion: string;
  reason: string;
  /** Position of the first occurrence. */
  index: number;
}

const MISSPELLINGS: [string, string][] = [
  ["อนุญาติ", "อนุญาต"],
  ["โอกาศ", "โอกาส"],
  ["สังเกตุ", "สังเกต"],
  ["ประสบการ", "ประสบการณ์"],
  ["รายละเอียต", "รายละเอียด"],
  ["ผลลัพท์", "ผลลัพธ์"],
  ["กรุนา", "กรุณา"],
  ["กรูณา", "กรุณา"],
  ["ขอบคุน", "ขอบคุณ"],
  ["ขออภัญ", "ขออภัย"],
  ["เรียบร้อบ", "เรียบร้อย"],
  ["ตรวจสอป", "ตรวจสอบ"],
  ["เจ้าหน้าทื่", "เจ้าหน้าที่"],
  ["ดำเนิการ", "ดำเนินการ"],
  ["ดำเนินกาน", "ดำเนินการ"],
  ["บริการณ์", "บริการ"],
  ["ออนไลท์", "ออนไลน์"],
  ["แอพพลิเคชั่น", "แอปพลิเคชัน"],
  ["แอพลิเคชั่น", "แอปพลิเคชัน"],
  ["อีเมล์", "อีเมล"],
  ["เวอร์ชั่น", "เวอร์ชัน"],
  ["คลิ๊ก", "คลิก"],
  ["ล๊อกอิน", "ล็อกอิน"],
  ["ล็อคอิน", "ล็อกอิน"],
  ["พาสเวิด", "พาสเวิร์ด"],
  ["เซิฟเวอร์", "เซิร์ฟเวอร์"],
  ["ซ่อมแซ่ม", "ซ่อมแซม"],
  ["สูนย์", "ศูนย์"],
  ["ใด้", "ได้"],
  ["จนกระทั้ง", "จนกระทั่ง"],
  ["ภายใณ", "ภายใน"],
  ["นะค่ะ", "นะคะ"],
  ["ไหมค่ะ", "ไหมคะ"],
  ["หรือเปล่าค่ะ", "หรือเปล่าคะ"],
  ["ขอบคุณคะ", "ขอบคุณค่ะ"],
  ["สดวก", "สะดวก"],
  ["ประเมิณ", "ประเมิน"],
  ["เกมส์", "เกม"],
  ["บันชี", "บัญชี"],
  ["บัญชิ", "บัญชี"],
  ["ปฎิบัติ", "ปฏิบัติ"],
  ["กฏ", "กฎ"],
  ["ลายเซ็นต์", "ลายเซ็น"],
  ["โทรศัพย์", "โทรศัพท์"],
  ["อินเตอร์เน็ต", "อินเทอร์เน็ต"],
  ["อินเตอร์เน็ท", "อินเทอร์เน็ต"],
  ["เน็ท", "เน็ต"],
  ["รายการณ์", "รายการ"],
  ["เหตุการ", "เหตุการณ์"],
  ["สถานการ", "สถานการณ์"],
  ["ปรากฎ", "ปรากฏ"],
  ["กระทันหัน", "กะทันหัน"],
  ["เพิ่มเติ่ม", "เพิ่มเติม"],
  ["เงิณ", "เงิน"],
  ["ชั่วโมงง", "ชั่วโมง"],
  ["ผู้เล่ญ", "ผู้เล่น"],
  ["รางวัน", "รางวัล"],
  ["กิจกรรมม", "กิจกรรม"],
  ["อัพเดท", "อัปเดต"],
  ["อัพเดต", "อัปเดต"],
  ["แพ็คเกจ", "แพ็กเกจ"],
  ["ไอเท็ม", "ไอเทม"],
  ["ลิ้งค์", "ลิงก์"],
  ["ลิงค์", "ลิงก์"],
  ["เช็ค", "เช็ก"],
  ["ซีเรียส", "ซีเรียส"],
  ["อะไหล่", "อะไหล่"],
  ["ทะเลาะ", "ทะเลาะ"],
].filter(([w, r]) => w !== r) as [string, string][];

const MARKS = "\u0E31\u0E34-\u0E3A\u0E47-\u0E4E";
const RULES: { re: RegExp; fix: (m: string) => string; reason: string }[] = [
  { re: new RegExp(`([${MARKS}])\\1+`, "g"), fix: (m) => m[0]!, reason: "พิมพ์สระ/วรรณยุกต์ซ้ำ" },
  { re: /[\u0E48-\u0E4B]{2,}/g, fix: (m) => m[m.length - 1]!, reason: "มีวรรณยุกต์ซ้อนกัน" },
  { re: /\u0E4D\u0E32/g, fix: () => "\u0E33", reason: "พิมพ์ “ํ + า” แทนสระอำ" },
  {
    re: new RegExp(`\\s+[${MARKS}]`, "g"),
    fix: (m) => m.trim(),
    reason: "มีช่องว่างก่อนสระ/วรรณยุกต์",
  },
  { re: /[เแโใไ]\s+(?=[ก-ฮ])/g, fix: (m) => m.trim(), reason: "มีช่องว่างหลังสระหน้า" },
];

function coveredByCorrect(text: string, i: number, wrong: string, right: string) {
  // Skip when the "wrong" text is just part of the correct word (e.g. ประสบการ inside ประสบการณ์).
  if (!right.includes(wrong)) return false;
  let j = text.indexOf(right);
  while (j >= 0) {
    if (i >= j && i + wrong.length <= j + right.length) return true;
    j = text.indexOf(right, j + 1);
  }
  return false;
}

export function checkThaiSpelling(text: string): SpellIssue[] {
  const t = text.normalize("NFC");
  const out: SpellIssue[] = [];
  const seen = new Set<string>();
  for (const [wrong, right] of MISSPELLINGS) {
    let i = t.indexOf(wrong);
    while (i >= 0) {
      if (!coveredByCorrect(t, i, wrong, right)) {
        if (!seen.has(wrong)) {
          seen.add(wrong);
          out.push({ wrong, suggestion: right, reason: "สะกดผิดที่พบบ่อย", index: i });
        }
        break;
      }
      i = t.indexOf(wrong, i + 1);
    }
  }
  for (const r of RULES) {
    for (const m of t.matchAll(r.re)) {
      if (seen.has(m[0])) continue;
      seen.add(m[0]);
      out.push({ wrong: m[0], suggestion: r.fix(m[0]), reason: r.reason, index: m.index ?? 0 });
    }
  }
  return out.sort((a, b) => a.index - b.index);
}

/** Replace a misspelling everywhere, without touching occurrences that are part of the correct word. */
export function applyFix(text: string, issue: Pick<SpellIssue, "wrong" | "suggestion">): string {
  const t = text.normalize("NFC");
  let out = "";
  let i = 0;
  while (i < t.length) {
    if (t.startsWith(issue.wrong, i) && !coveredByCorrect(t, i, issue.wrong, issue.suggestion)) {
      out += issue.suggestion;
      i += issue.wrong.length;
    } else {
      out += t[i];
      i++;
    }
  }
  return out;
}
