import type { Faq } from "./types";

export type SearchMode = "keyword" | "semantic";

export interface SearchHit {
  faq: Faq;
  score: number;
  /** Human-readable reasons, e.g. matched fields or concepts. */
  reasons: string[];
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFC")
    .replace(/[\u200b\s]+/g, " ")
    .trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Seg = (Intl as any).Segmenter;
const segmenter = Seg ? new Seg("th", { granularity: "word" }) : null;

const STOP = new Set([
  "ได้",
  "ไหม",
  "มั้ย",
  "ยังไง",
  "อย่างไร",
  "ที่",
  "และ",
  "แล้ว",
  "แต่",
  "ก็",
  "จะ",
  "ต้อง",
  "ทำ",
  "การ",
  "ให้",
  "ค่ะ",
  "ครับ",
  "คะ",
  "นะ",
  "หรือ",
  "อยู่",
  "เป็น",
  "มี",
  "ของ",
  "ใน",
  "กับ",
  "จาก",
  "บ้าง",
  "เมื่อไร",
  "ที่ไหน",
  "ไหน",
]);

export function tokenize(s: string): string[] {
  const n = normalize(s);
  if (!n) return [];
  const parts: string[] = segmenter
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [...segmenter.segment(n)].filter((x: any) => x.isWordLike).map((x: any) => x.segment)
    : n.split(/[^\p{L}\p{N}\p{M}]+/u);
  return parts.filter((t) => t && !STOP.has(t));
}

/* ---------------- Keyword search ---------------- */

export function keywordSearch(faqs: Faq[], query: string): SearchHit[] {
  const q = normalize(query);
  if (!q) return [];
  const toks = [...new Set(tokenize(q))];
  const hits: SearchHit[] = [];
  for (const f of faqs) {
    const qn = normalize(f.question);
    const an = normalize(f.answer);
    const kn = f.keywords.map(normalize);
    let score = 0;
    const reasons = new Set<string>();
    if (qn.includes(q)) {
      score += 10;
      reasons.add("คำถาม");
    }
    if (kn.some((k) => k.includes(q) || (k.length > 1 && q.includes(k)))) {
      score += 8;
      reasons.add("Keywords");
    }
    if (an.includes(q)) {
      score += 4;
      reasons.add("คำตอบ");
    }
    for (const t of toks) {
      if (qn.includes(t)) {
        score += 3;
        reasons.add("คำถาม");
      }
      if (kn.some((k) => k.includes(t))) {
        score += 2;
        reasons.add("Keywords");
      }
      if (an.includes(t)) {
        score += 1;
        reasons.add("คำตอบ");
      }
    }
    if (score > 0) hits.push({ faq: f, score, reasons: [...reasons] });
  }
  hits.sort((a, b) => b.score - a.score);
  const top = hits[0]?.score || 1;
  return hits.map((h) => ({ ...h, score: h.score / top }));
}

/* ---------------- Local "semantic" search ----------------
 * Free, offline approach: Thai concept/synonym expansion + word tokens +
 * character trigrams, weighted by TF-IDF and compared with cosine similarity.
 * This is NOT an embeddings / vector model — it only understands meanings
 * that are covered by the concept dictionary below.
 */

export interface Concept {
  id: string;
  label: string;
  terms: string[];
}

export const CONCEPTS: Concept[] = [
  {
    id: "pay",
    label: "การชำระเงิน",
    terms: [
      "เติมเงิน",
      "เติม",
      "จ่ายเงิน",
      "จ่าย",
      "โอนเงิน",
      "โอน",
      "ชำระ",
      "หักเงิน",
      "เงินหัก",
      "ตัดเงิน",
      "ตัดบัตร",
      "ซื้อ",
      "topup",
      "top up",
      "ทรูมันนี่",
      "truemoney",
      "พร้อมเพย์",
      "promptpay",
      "บัตรเครดิต",
    ],
  },
  {
    id: "currency",
    label: "เหรียญ/ไอเทม",
    terms: ["เหรียญ", "เพชร", "ยอด", "ไอเทม", "แพ็ก", "coin", "gem", "ของไม่", "ของยัง"],
  },
  {
    id: "missing",
    label: "ไม่ได้รับ",
    terms: [
      "ไม่ได้รับ",
      "ไม่ได้",
      "ไม่มา",
      "ไม่เข้า",
      "ไม่เพิ่ม",
      "ไม่ขึ้น",
      "ยังไม่",
      "ไม่อัปเดต",
      "ไม่โชว์",
    ],
  },
  { id: "refund", label: "คืนเงิน", terms: ["คืนเงิน", "เงินคืน", "refund", "รีฟันด์"] },
  { id: "cancel", label: "ยกเลิก", terms: ["ยกเลิก", "ซื้อผิด", "กดผิด"] },
  {
    id: "login",
    label: "เข้าสู่ระบบ",
    terms: ["ล็อกอิน", "ล็อคอิน", "login", "เข้าสู่ระบบ", "เข้าเกม", "ลงชื่อเข้าใช้"],
  },
  {
    id: "password",
    label: "รหัสผ่าน",
    terms: ["รหัสผ่าน", "พาสเวิร์ด", "password", "ลืมรหัส", "จำรหัส"],
  },
  {
    id: "hacked",
    label: "บัญชีถูกขโมย",
    terms: ["แฮก", "แฮ็ก", "ขโมย", "ไอดีหาย", "บัญชีหาย", "ไอดีโดน", "โดนเอาไป"],
  },
  {
    id: "bind",
    label: "ผูกบัญชี",
    terms: [
      "ผูก",
      "เชื่อมบัญชี",
      "เชื่อม",
      "bind",
      "facebook",
      "เฟซบุ๊ก",
      "google",
      "กูเกิล",
      "apple",
    ],
  },
  {
    id: "transfer",
    label: "ย้ายเครื่อง",
    terms: [
      "ย้ายข้อมูล",
      "ย้าย",
      "เปลี่ยนเครื่อง",
      "เครื่องใหม่",
      "มือถือใหม่",
      "โทรศัพท์ใหม่",
      "เปลี่ยนโทรศัพท์",
      "เปลี่ยนมือถือ",
    ],
  },
  { id: "delete", label: "ลบบัญชี", terms: ["ลบบัญชี", "ปิดบัญชี", "ลบไอดี", "ลบข้อมูล"] },
  {
    id: "rename",
    label: "เปลี่ยนชื่อ",
    terms: ["เปลี่ยนชื่อ", "ชื่อตัวละคร", "ตั้งชื่อ", "ชื่อใหม่"],
  },
  { id: "crash", label: "เกมเด้ง", terms: ["เด้ง", "หลุด", "แครช", "crash", "ปิดเอง", "เด้งออก"] },
  { id: "freeze", label: "ค้าง", terms: ["ค้าง", "หน้าโหลด", "โหลดนาน", "โหลดไม่ขึ้น", "จอดำ"] },
  {
    id: "lag",
    label: "แลค/เน็ต",
    terms: [
      "แลค",
      "แล็ก",
      "lag",
      "ปิง",
      "ping",
      "กระตุก",
      "ดีเลย์",
      "เน็ต",
      "อินเทอร์เน็ต",
      "หน่วง",
    ],
  },
  {
    id: "update",
    label: "อัปเดต",
    terms: ["อัปเดต", "อัพเดท", "อัพเดต", "แพตช์", "แพทช์", "patch", "update", "เวอร์ชัน"],
  },
  {
    id: "device",
    label: "อุปกรณ์/สเปค",
    terms: ["สเปค", "สเป็ค", "ไอโฟน", "iphone", "android", "แอนดรอยด์", "ios", "รุ่น", "รองรับ"],
  },
  { id: "code", label: "โค้ด", terms: ["โค้ด", "code", "redeem", "รหัสแลก", "แลกรางวัล"] },
  {
    id: "event",
    label: "กิจกรรม",
    terms: ["กิจกรรม", "อีเวนต์", "อีเว้นท์", "event", "ภารกิจ", "เควส", "โปรโมชั่น"],
  },
  { id: "reward", label: "รางวัล", terms: ["รางวัล", "reward", "โบนัส", "ของขวัญ", "ของรางวัล"] },
  { id: "subscription", label: "บัตรรายเดือน", terms: ["รายเดือน", "บัตรเดือน", "vip", "รายวัน"] },
  { id: "ban", label: "แบน/ระงับ", terms: ["แบน", "ban", "ระงับ", "โดนล็อก", "ถูกล็อก", "บล็อก"] },
  { id: "cheat", label: "โกง", terms: ["โกง", "โปร", "hack", "cheat", "บอท", "สคริปต์"] },
  { id: "report", label: "รายงาน", terms: ["รีพอร์ต", "report", "รายงาน", "ร้องเรียน", "แจ้ง"] },
  {
    id: "contact",
    label: "ติดต่อเจ้าหน้าที่",
    terms: ["ติดต่อ", "แอดมิน", "admin", "เจ้าหน้าที่", "ทีมงาน", "คุยกับ", "cs"],
  },
  {
    id: "maintenance",
    label: "ปิดปรับปรุง",
    terms: ["ปิดปรับปรุง", "เซิร์ฟ", "server", "maintenance", "ปิดเซิร์ฟ", "ปิดกี่โมง"],
  },
  { id: "bug", label: "บั๊ก", terms: ["บั๊ก", "บัค", "bug", "ผิดปกติ"] },
  { id: "channel", label: "ช่องทาง", terms: ["ช่องทาง", "ผ่าน", "ที่ไหน", "ดูได้"] },
];

const CONCEPT_TERMS = CONCEPTS.map((c) => ({ ...c, terms: c.terms.map(normalize) }));

export function detectConcepts(text: string): Concept[] {
  const n = normalize(text);
  return CONCEPT_TERMS.filter((c) => c.terms.some((t) => n.includes(t)));
}

type Vec = Map<string, number>;

function add(v: Vec, k: string, w: number) {
  v.set(k, (v.get(k) ?? 0) + w);
}

function features(text: string, weight: number, v: Vec) {
  for (const c of detectConcepts(text)) add(v, "c:" + c.id, 3 * weight);
  for (const t of tokenize(text)) add(v, "t:" + t, weight);
  const compact = normalize(text).replace(/\s+/g, "");
  for (let i = 0; i + 3 <= compact.length; i++)
    add(v, "g:" + compact.slice(i, i + 3), 0.25 * weight);
}

function faqVec(f: Faq): Vec {
  const v: Vec = new Map();
  features(f.question, 1, v);
  features(f.keywords.join(" "), 0.8, v);
  features(f.answer, 0.2, v);
  return v;
}

interface Index {
  vecs: Vec[];
  idf: Map<string, number>;
}
const cache = new WeakMap<Faq[], Index>();

function buildIndex(faqs: Faq[]): Index {
  const hit = cache.get(faqs);
  if (hit) return hit;
  const vecs = faqs.map(faqVec);
  const df = new Map<string, number>();
  for (const v of vecs) for (const k of v.keys()) df.set(k, (df.get(k) ?? 0) + 1);
  const N = faqs.length || 1;
  const idf = new Map<string, number>();
  for (const [k, d] of df) idf.set(k, Math.log(1 + N / d));
  const idx = { vecs, idf };
  cache.set(faqs, idx);
  return idx;
}

function cosine(a: Vec, b: Vec, idf: Map<string, number>, defIdf: number): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (const [k, w] of a) {
    const x = w * (idf.get(k) ?? defIdf);
    na += x * x;
    const bw = b.get(k);
    if (bw) dot += x * bw * (idf.get(k) ?? defIdf);
  }
  for (const [k, w] of b) {
    const y = w * (idf.get(k) ?? defIdf);
    nb += y * y;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

export function semanticSearch(faqs: Faq[], query: string, minScore = 0.06): SearchHit[] {
  if (!normalize(query)) return [];
  const { vecs, idf } = buildIndex(faqs);
  const qv: Vec = new Map();
  features(query, 1, qv);
  const qConcepts = detectConcepts(query);
  const defIdf = Math.log(1 + (faqs.length || 1));
  const hits: SearchHit[] = [];
  faqs.forEach((f, i) => {
    const v = vecs[i]!;
    const score = cosine(qv, v, idf, defIdf);
    if (score >= minScore) {
      const shared = qConcepts.filter((c) => v.has("c:" + c.id)).map((c) => c.label);
      hits.push({ faq: f, score, reasons: shared });
    }
  });
  return hits.sort((a, b) => b.score - a.score);
}

export function search(faqs: Faq[], query: string, mode: SearchMode): SearchHit[] {
  return mode === "semantic" ? semanticSearch(faqs, query) : keywordSearch(faqs, query);
}

/* ---------------- Duplicate detection ---------------- */

function grams(s: string) {
  const c = normalize(s).replace(/[\s\p{P}]+/gu, "");
  const g = new Set<string>();
  for (let i = 0; i + 2 <= c.length; i++) g.add(c.slice(i, i + 2));
  return g;
}

export function similarity(a: string, b: string): number {
  const A = grams(a),
    B = grams(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

export function findDuplicates(faqs: Faq[], question: string, excludeId?: string, threshold = 0.7) {
  if (normalize(question).length < 4) return [];
  return faqs
    .filter((f) => f.faq_id !== excludeId)
    .map((f) => ({ faq: f, sim: similarity(f.question, question) }))
    .filter((x) => x.sim >= threshold)
    .sort((a, b) => b.sim - a.sim);
}
