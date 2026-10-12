export interface EvalCase {
  query: string;
  expected: string;
  note: string;
}

/** Thai test queries that do NOT copy the FAQ wording, to test meaning-based search. */
export const EVAL_CASES: EvalCase[] = [
  {
    query: "จ่ายเงินแล้วของไม่มา",
    expected: "faq-001",
    note: "คำพ้อง: จ่าย = เติม, ของไม่มา = ไม่ได้รับ",
  },
  { query: "โอนเงินแล้วไม่ได้เหรียญ", expected: "faq-001", note: "โอน = เติม" },
  { query: "เงินหักแล้วแต่ยอดไม่เพิ่ม", expected: "faq-001", note: "เงินหัก + ยอดไม่เพิ่ม" },
  { query: "ตัดบัตรแล้วเพชรไม่เข้า", expected: "faq-001", note: "ตัดบัตร / เพชร" },
  { query: "อยากได้เงินคืน", expected: "faq-003", note: "เงินคืน = คืนเงิน" },
  { query: "กดซื้อผิดยกเลิกได้ไหม", expected: "faq-004", note: "ซื้อผิด / ยกเลิก" },
  { query: "จ่ายผ่านทรูมันนี่ได้ไหม", expected: "faq-002", note: "ช่องทางชำระ" },
  { query: "จำพาสเวิร์ดไม่ได้", expected: "faq-006", note: "พาสเวิร์ด = รหัสผ่าน" },
  { query: "ล็อคอินไม่ได้", expected: "faq-007", note: "ล็อคอิน = เข้าสู่ระบบ" },
  { query: "ไอดีโดนขโมย", expected: "faq-008", note: "ขโมย = แฮก" },
  { query: "เชื่อมไอดีกับกูเกิล", expected: "faq-009", note: "เชื่อม = ผูก" },
  {
    query: "เปลี่ยนโทรศัพท์ใหม่ข้อมูลจะหายไหม",
    expected: "faq-010",
    note: "เปลี่ยนโทรศัพท์ = ย้ายเครื่อง",
  },
  { query: "อยากปิดบัญชี", expected: "faq-011", note: "ปิดบัญชี = ลบบัญชี" },
  { query: "ตั้งชื่อใหม่ได้ไหม", expected: "faq-012", note: "ตั้งชื่อใหม่ = เปลี่ยนชื่อ" },
  { query: "เล่นอยู่แล้วหลุดออกเอง", expected: "faq-013", note: "หลุด = เด้ง" },
  { query: "จอดำโหลดนานไม่เข้าเกม", expected: "faq-014", note: "โหลดนาน = ค้างหน้าโหลด" },
  { query: "เน็ตกระตุกดีเลย์", expected: "faq-015", note: "กระตุก = แลค" },
  { query: "โหลดแพตช์ไม่ผ่าน", expected: "faq-016", note: "แพตช์ = อัปเดต" },
  { query: "ไอโฟนรุ่นเก่าเล่นได้ไหม", expected: "faq-017", note: "รุ่น/ไอโฟน = สเปค" },
  { query: "ใส่ code แล้วใช้ไม่ได้", expected: "faq-018", note: "code = โค้ด" },
  { query: "ทำเควสครบแต่ของรางวัลไม่เข้า", expected: "faq-019", note: "เควส = กิจกรรม" },
  { query: "อีเว้นท์ล่าสุดดูได้ที่ไหน", expected: "faq-020", note: "อีเว้นท์ = กิจกรรม" },
  { query: "โดนระงับไอดี", expected: "faq-021", note: "ระงับ = แบน" },
  { query: "เจอคนใช้โปรในเกม", expected: "faq-022", note: "โปร = โกง" },
  { query: "คุยกับแอดมินยังไง", expected: "faq-023", note: "แอดมิน = เจ้าหน้าที่" },
  { query: "ปิดเซิร์ฟกี่โมง", expected: "faq-024", note: "ปิดเซิร์ฟ = ปิดปรับปรุง" },
  { query: "บัตรเดือนไม่ได้ของรายวัน", expected: "faq-005", note: "บัตรเดือน = บัตรรายเดือน" },
  { query: "เจอบัคแปลกๆ", expected: "faq-025", note: "บัค = บั๊ก (ฉบับร่าง)" },
];
