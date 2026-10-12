import type { GalleryImage } from "./types";

function makeSvgDataUri(svgContent: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
}

// 1. Receipt Guide SVG
const receiptSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="receiptG" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg1)"/>
  
  <!-- Header Banner -->
  <rect x="50" y="40" width="700" height="60" rx="12" fill="#0284c7" />
  <text x="75" y="77" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold">CS GUIDE: จุดที่ต้องตรวจสอบในใบเสร็จการชำระเงิน</text>
  
  <!-- Receipt Mockup -->
  <rect x="80" y="130" width="380" height="420" rx="16" fill="url(#receiptG)" stroke="#cbd5e1" stroke-width="2"/>
  <circle cx="120" cy="170" r="18" fill="#10b981"/>
  <path d="M112 170 l6 6 l12 -12" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round"/>
  <text x="150" y="176" fill="#0f172a" font-family="sans-serif" font-size="18" font-weight="bold">ชำระเงินสำเร็จ (TrueMoney / Bank)</text>
  <line x1="100" y1="205" x2="440" y2="205" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="6,6"/>
  
  <text x="105" y="240" fill="#64748b" font-family="sans-serif" font-size="14">รหัสรายการ (Transaction ID):</text>
  <rect x="105" y="250" width="330" height="32" rx="6" fill="#fef08a" stroke="#eab308" stroke-width="1.5"/>
  <text x="115" y="272" fill="#854d0e" font-family="monospace" font-size="15" font-weight="bold">TXN-88392019482103</text>
  
  <text x="105" y="315" fill="#64748b" font-family="sans-serif" font-size="14">วันและเวลาที่ทำรายการ:</text>
  <text x="105" y="340" fill="#0f172a" font-family="sans-serif" font-size="15" font-weight="600">12 ต.ค. 2026, 15:42 น.</text>
  
  <text x="105" y="380" fill="#64748b" font-family="sans-serif" font-size="14">จำนวนเงินที่ชำระ:</text>
  <text x="105" y="415" fill="#0f172a" font-family="sans-serif" font-size="28" font-weight="bold">฿ 350.00 THB</text>
  
  <text x="105" y="455" fill="#64748b" font-family="sans-serif" font-size="14">ผู้รับเงิน:</text>
  <text x="105" y="480" fill="#334155" font-family="sans-serif" font-size="14">Game Topup Center Ltd.</text>
  
  <!-- Pointers on Right -->
  <g transform="translate(480, 150)">
    <rect width="270" height="90" rx="12" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <text x="20" y="35" fill="#38bdf8" font-family="sans-serif" font-size="16" font-weight="bold">1. รหัสรายการ (สำคัญมาก)</text>
    <text x="20" y="60" fill="#94a3b8" font-family="sans-serif" font-size="13">ต้องเห็นตัวเลขครบทุกหลัก ไม่เบลอ</text>
  </g>
  <g transform="translate(480, 260)">
    <rect width="270" height="90" rx="12" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
    <text x="20" y="35" fill="#10b981" font-family="sans-serif" font-size="16" font-weight="bold">2. วันที่ &amp; เวลาชัดเจน</text>
    <text x="20" y="60" fill="#94a3b8" font-family="sans-serif" font-size="13">ใช้ตรวจสอบกับประวัติเซิร์ฟเวอร์</text>
  </g>
  <g transform="translate(480, 370)">
    <rect width="270" height="90" rx="12" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
    <text x="20" y="35" fill="#f59e0b" font-family="sans-serif" font-size="16" font-weight="bold">3. ยอดเงินตรงกับแพ็กเกจ</text>
    <text x="20" y="60" fill="#94a3b8" font-family="sans-serif" font-size="13">ตรวจสอบว่าไม่มีหักค่าธรรมเนียมเกิน</text>
  </g>
</svg>
`;

// 2. Finding Game UID SVG
const uidSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#27272a"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg2)"/>
  <rect x="50" y="40" width="700" height="60" rx="12" fill="#6366f1" />
  <text x="75" y="77" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold">วิธีตรวจสอบ UID (User ID) และ Server ID ในเกม</text>
  
  <!-- Profile Card -->
  <rect x="80" y="130" width="640" height="340" rx="20" fill="#2d2d30" stroke="#3f3f46" stroke-width="2"/>
  
  <!-- Avatar -->
  <circle cx="170" cy="220" r="50" fill="#4f46e5"/>
  <circle cx="170" cy="205" r="22" fill="#ffffff"/>
  <path d="M140 248 a30 30 0 0 1 60 0" fill="#ffffff"/>
  
  <!-- Player Details -->
  <text x="250" y="195" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="bold">HeroPlayer_99</text>
  <text x="250" y="225" fill="#a1a1aa" font-family="sans-serif" font-size="16">เซิร์ฟเวอร์: ASIA-01 (Emerald Sea)</text>
  
  <!-- UID Highlight Box -->
  <rect x="250" y="250" width="430" height="60" rx="10" fill="#1e1e24" stroke="#a855f7" stroke-width="2"/>
  <text x="270" y="287" fill="#c084fc" font-family="sans-serif" font-size="16" font-weight="bold">UID: </text>
  <text x="320" y="287" fill="#ffffff" font-family="monospace" font-size="18" font-weight="bold">8831920512</text>
  
  <!-- Copy Button Mock -->
  <rect x="560" y="262" width="105" height="36" rx="8" fill="#8b5cf6"/>
  <text x="590" y="286" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">คัดลอก</text>
  
  <!-- Bottom Tips -->
  <rect x="80" y="490" width="640" height="70" rx="12" fill="#3f3f46"/>
  <text x="110" y="532" fill="#facc15" font-family="sans-serif" font-size="15" font-weight="bold">💡 ข้อแนะนำสำหรับทีม CS: </text>
  <text x="290" y="532" fill="#e4e4e7" font-family="sans-serif" font-size="15">ให้ผู้เล่นแตะที่ปุ่ม “คัดลอก” ข้าง UID เพื่อป้องกันการพิมพ์เลขตกหล่น</text>
</svg>
`;

// 3. Error 502 / Server Maintenance SVG
const errorSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a0d0d"/>
      <stop offset="100%" stop-color="#2a1515"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg3)"/>
  <rect x="50" y="40" width="700" height="60" rx="12" fill="#ef4444" />
  <text x="75" y="77" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold">หน้าต่างแจ้งเตือน: Server Maintenance / Connection Error</text>
  
  <!-- Error Modal Card -->
  <rect x="150" y="140" width="500" height="350" rx="20" fill="#201515" stroke="#ef4444" stroke-width="2"/>
  
  <!-- Warning Icon -->
  <circle cx="400" cy="220" r="40" fill="#fee2e2"/>
  <path d="M400 200 v25" stroke="#dc2626" stroke-width="5" stroke-linecap="round"/>
  <circle cx="400" cy="242" r="3" fill="#dc2626"/>
  
  <text x="400" y="290" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold">การเชื่อมต่อขัดข้อง (Error 502 / 10054)</text>
  <text x="400" y="325" text-anchor="middle" fill="#fca5a5" font-family="sans-serif" font-size="14">ขณะนี้เซิร์ฟเวอร์อยู่ระหว่างการปรับปรุงระบบประจำสัปดาห์</text>
  <text x="400" y="350" text-anchor="middle" fill="#fca5a5" font-family="sans-serif" font-size="14">เวลาเปิดให้บริการ: 16:00 น. (UTC+7)</text>
  
  <!-- Buttons -->
  <rect x="230" y="390" width="160" height="44" rx="10" fill="#374151"/>
  <text x="310" y="417" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="15">ปิดเกม</text>
  
  <rect x="410" y="390" width="160" height="44" rx="10" fill="#ef4444"/>
  <text x="490" y="417" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="15" font-weight="bold">ลองใหม่อีกครั้ง</text>
</svg>
`;

// 4. Account Binding Guide SVG
const bindingSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#022c22"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg4)"/>
  <rect x="50" y="40" width="700" height="60" rx="12" fill="#10b981" />
  <text x="75" y="77" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold">ขั้นตอนการผูกบัญชี Guest ป้องกันข้อมูลไอเทมสูญหาย</text>
  
  <!-- Steps -->
  <g transform="translate(80, 140)">
    <rect width="190" height="380" rx="16" fill="#065f46" stroke="#34d399" stroke-width="1.5"/>
    <circle cx="95" cy="50" r="22" fill="#10b981"/>
    <text x="95" y="58" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold">1</text>
    <text x="95" y="105" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">เปิดหน้า “ตั้งค่า”</text>
    <text x="95" y="135" text-anchor="middle" fill="#a7f3d0" font-family="sans-serif" font-size="13">เข้าไอคอนเฟือง</text>
    <text x="95" y="155" text-anchor="middle" fill="#a7f3d0" font-family="sans-serif" font-size="13">ที่มุมขวาบนของเกม</text>
  </g>
  
  <g transform="translate(305, 140)">
    <rect width="190" height="380" rx="16" fill="#065f46" stroke="#34d399" stroke-width="1.5"/>
    <circle cx="95" cy="50" r="22" fill="#10b981"/>
    <text x="95" y="58" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold">2</text>
    <text x="95" y="105" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">เลือก “ศูนย์บัญชี”</text>
    <text x="95" y="135" text-anchor="middle" fill="#a7f3d0" font-family="sans-serif" font-size="13">กดเลือกเมนู User /</text>
    <text x="95" y="155" text-anchor="middle" fill="#a7f3d0" font-family="sans-serif" font-size="13">Account Security</text>
  </g>

  <g transform="translate(530, 140)">
    <rect width="190" height="380" rx="16" fill="#065f46" stroke="#34d399" stroke-width="1.5"/>
    <circle cx="95" cy="50" r="22" fill="#10b981"/>
    <text x="95" y="58" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold">3</text>
    <text x="95" y="105" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">กด “ผูกบัญชี”</text>
    <text x="95" y="135" text-anchor="middle" fill="#a7f3d0" font-family="sans-serif" font-size="13">เลือก Google Play,</text>
    <text x="95" y="155" text-anchor="middle" fill="#a7f3d0" font-family="sans-serif" font-size="13">Apple ID หรือ Email</text>
    <rect x="25" y="240" width="140" height="36" rx="8" fill="#10b981"/>
    <text x="95" y="263" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold">ผูกสำเร็จ ✅</text>
  </g>
</svg>
`;

// 5. Official CS Badge SVG
const badgeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bg5" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#312e81"/>
    </linearGradient>
    <linearGradient id="shieldG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg5)"/>
  
  <g transform="translate(400, 260)">
    <!-- Shield -->
    <path d="M 0 -130 L 100 -70 L 100 40 C 100 110 0 160 0 160 C 0 160 -100 110 -100 40 L -100 -70 Z" fill="url(#shieldG)" stroke="#7dd3fc" stroke-width="4"/>
    <circle cx="0" cy="5" r="45" fill="#ffffff"/>
    <path d="M -18 3 L -5 16 L 22 -11" stroke="#0284c7" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  
  <text x="400" y="460" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="28" font-weight="bold">OFFICIAL CS SUPPORT TEAM</text>
  <text x="400" y="495" text-anchor="middle" fill="#93c5fd" font-family="sans-serif" font-size="16">ตราสัญลักษณ์ยืนยันการติดต่อจากเจ้าหน้าที่ฝ่ายบริการลูกค้าตัวจริง</text>
  <text x="400" y="525" text-anchor="middle" fill="#facc15" font-family="sans-serif" font-size="14">⚠️ เจ้าหน้าที่จะไม่มีวันขอรหัสผ่าน (Password) หรือ OTP ของผู้เล่น</text>
</svg>
`;

// 6. Clear Cache Guide SVG
const cacheSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bg6" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1f2937"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg6)"/>
  <rect x="50" y="40" width="700" height="60" rx="12" fill="#e11d48" />
  <text x="75" y="77" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold">วิธีแก้ปัญหาเข้าเกมแล้วจอดำ / ดาวน์โหลดค้าง (Clear Cache)</text>
  
  <!-- Content Cards -->
  <g transform="translate(80, 140)">
    <rect width="300" height="380" rx="16" fill="#374151" stroke="#4b5563" stroke-width="2"/>
    <text x="25" y="45" fill="#f43f5e" font-family="sans-serif" font-size="18" font-weight="bold">ระบบ Android</text>
    <text x="25" y="85" fill="#f3f4f6" font-family="sans-serif" font-size="15">1. ไปที่ “ตั้งค่าตัวเครื่อง (Settings)”</text>
    <text x="25" y="125" fill="#f3f4f6" font-family="sans-serif" font-size="15">2. เลือก “แอปพลิเคชัน (Apps)”</text>
    <text x="25" y="165" fill="#f3f4f6" font-family="sans-serif" font-size="15">3. เลือกเกมของเรา</text>
    <text x="25" y="205" fill="#f3f4f6" font-family="sans-serif" font-size="15">4. เลือก “ที่เก็บข้อมูล (Storage)”</text>
    <text x="25" y="255" fill="#fb7185" font-family="sans-serif" font-size="16" font-weight="bold">5. กด “ล้างแคช (Clear Cache)”</text>
    <text x="25" y="300" fill="#9ca3af" font-family="sans-serif" font-size="13">⚠️ ห้ามกด Clear Data หากยังไม่ผูกบัญชี</text>
  </g>
  
  <g transform="translate(420, 140)">
    <rect width="300" height="380" rx="16" fill="#374151" stroke="#4b5563" stroke-width="2"/>
    <text x="25" y="45" fill="#38bdf8" font-family="sans-serif" font-size="18" font-weight="bold">ระบบ iOS (iPhone / iPad)</text>
    <text x="25" y="85" fill="#f3f4f6" font-family="sans-serif" font-size="15">1. ปิดแอปเกมจาก Recent Apps</text>
    <text x="25" y="125" fill="#f3f4f6" font-family="sans-serif" font-size="15">2. ตรวจสอบพื้นที่ว่างตัวเครื่อง (&gt; 5GB)</text>
    <text x="25" y="165" fill="#f3f4f6" font-family="sans-serif" font-size="15">3. สลับเครือข่าย Wi-Fi / 4G/5G</text>
    <text x="25" y="205" fill="#f3f4f6" font-family="sans-serif" font-size="15">4. เปิดเกมใหม่ และกด “ซ่อมแซม (Repair)”</text>
    <text x="25" y="255" fill="#38bdf8" font-family="sans-serif" font-size="16" font-weight="bold">ที่มุมขวาบนของหน้าจอเข้าเกม</text>
    <text x="25" y="300" fill="#9ca3af" font-family="sans-serif" font-size="13">ระบบจะดาวน์โหลดไฟล์แพตช์ใหม่</text>
  </g>
</svg>
`;

export function seedGalleryImages(): GalleryImage[] {
  const now = new Date().toISOString();
  return [
    {
      id: "img-receipt-guide",
      title: "จุดตรวจสอบใบเสร็จเติมเงิน",
      file_name: "receipt-check-guide.svg",
      url: makeSvgDataUri(receiptSvg),
      category: "การเงิน/เติมเงิน",
      tags: ["เติมเงิน", "ใบเสร็จ", "PromptPay", "TrueMoney", "สลิป"],
      dimensions: "800 × 600",
      size_bytes: 4200,
      description:
        "ภาพประกอบแสดงจุดที่ต้องเห็นในสลิปการโอนเงิน (รหัสธุรกรรม, วันที่, ยอดเงิน) ใช้ส่งให้ลูกค้าเมื่อเงินไม่เข้า",
      created_at: now,
      updated_at: now,
    },
    {
      id: "img-uid-lookup",
      title: "วิธีดู UID และ Server ID ในโปรไฟล์",
      file_name: "uid-server-lookup.svg",
      url: makeSvgDataUri(uidSvg),
      category: "บัญชีผู้ใช้/UID",
      tags: ["UID", "Server", "ไอดีผู้เล่น", "บัญชี"],
      dimensions: "800 × 600",
      size_bytes: 3800,
      description: "ภาพแนะนำขั้นตอนการดู User ID ในหน้าข้อมูลผู้เล่น พร้อมจุดกดปุ่มคัดลอก UID",
      created_at: now,
      updated_at: now,
    },
    {
      id: "img-error-maintenance",
      title: "หน้าจอแจ้งเตือน Error 502 / ปรับปรุงเซิร์ฟเวอร์",
      file_name: "error-502-maintenance.svg",
      url: makeSvgDataUri(errorSvg),
      category: "ปัญหาเทคนิค/Error",
      tags: ["Error", "เซิร์ฟเวอร์ปิดปรับปรุง", "502", "เชื่อมต่อไม่ได้"],
      dimensions: "800 × 600",
      size_bytes: 3500,
      description: "ตัวอย่างหน้าต่าง Error เมื่อเซิร์ฟเวอร์กำลังปิดปรับปรุงระบบตามรอบสัปดาห์",
      created_at: now,
      updated_at: now,
    },
    {
      id: "img-account-bind",
      title: "ขั้นตอนการผูกบัญชี Guest ป้องกันข้อมูลหาย",
      file_name: "guest-account-binding-steps.svg",
      url: makeSvgDataUri(bindingSvg),
      category: "บัญชีผู้ใช้/UID",
      tags: ["ผูกบัญชี", "Guest", "Google", "Apple ID", "ความปลอดภัย"],
      dimensions: "800 × 600",
      size_bytes: 4100,
      description: "3 ขั้นตอนการผูกบัญชีผู้เล่นกับ Google Play หรือ Apple ID ก่อนเปลี่ยนเครื่อง",
      created_at: now,
      updated_at: now,
    },
    {
      id: "img-official-badge",
      title: "ตราสัญลักษณ์ Official CS Support Team",
      file_name: "official-cs-verified-badge.svg",
      url: makeSvgDataUri(badgeSvg),
      category: "ไอคอน/แบรนด์",
      tags: ["Official", "Badge", "ความปลอดภัย", "เตือนมิจฉาชีพ"],
      dimensions: "800 × 600",
      size_bytes: 3200,
      description:
        "แบนเนอร์ยืนยันตัวตนเจ้าหน้าที่ทางการ เตือนผู้เล่นห้ามให้รหัสผ่านหรือ OTP แก่ผู้อื่น",
      created_at: now,
      updated_at: now,
    },
    {
      id: "img-clear-cache",
      title: "วิธีล้างแคชแก้ปัญหาจอดำ (Android / iOS)",
      file_name: "clear-cache-repair-guide.svg",
      url: makeSvgDataUri(cacheSvg),
      category: "ปัญหาเทคนิค/Error",
      tags: ["ล้างแคช", "จอดำ", "ค้าง", "ดาวน์โหลด", "Android", "iOS"],
      dimensions: "800 × 600",
      size_bytes: 4600,
      description: "ขั้นตอนการล้างแคชเกมบน Android และการกดปุ่มซ่อมแซมไฟล์บน iOS",
      created_at: now,
      updated_at: now,
    },
  ];
}
