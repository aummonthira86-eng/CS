import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, Lock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmptyState, PageHeader } from "@/components/app-shell";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { download, parseCsv, toCsv } from "@/lib/faq/csv";
import { normalize } from "@/lib/faq/search";
import { newId, store, useData, useRole } from "@/lib/faq/store";
import { can, type Category, type Faq, type FaqStatus } from "@/lib/faq/types";

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "นำเข้า Excel/CSV — FAQ Management" },
      {
        name: "description",
        content: "นำเข้า FAQ จากไฟล์ Excel หรือ CSV พร้อมดูตัวอย่าง จับคู่คอลัมน์ และตรวจสอบแถวซ้ำ",
      },
      { property: "og:title", content: "นำเข้า Excel/CSV — FAQ Management" },
      { property: "og:description", content: "นำเข้า FAQ จากไฟล์ Excel หรือ CSV" },
    ],
  }),
  component: ImportPage,
});

const FIELDS = [
  { key: "question", label: "คำถาม *", guess: ["question", "คำถาม", "q"] },
  { key: "answer", label: "คำตอบ *", guess: ["answer", "คำตอบ", "a"] },
  { key: "category", label: "หมวดหมู่", guess: ["category", "หมวดหมู่", "หมวด", "category_name"] },
  { key: "keywords", label: "Keywords", guess: ["keywords", "keyword", "คำค้น", "คีย์เวิร์ด"] },
  { key: "status", label: "สถานะ", guess: ["status", "สถานะ"] },
] as const;
type FieldKey = (typeof FIELDS)[number]["key"];

type RowCheck = {
  idx: number;
  q: string;
  a: string;
  cat: string;
  kw: string[];
  status: FaqStatus;
  problem?: string;
};

function parseStatus(s: string): FaqStatus {
  const n = normalize(s);
  if (["draft", "ฉบับร่าง", "ร่าง"].includes(n)) return "draft";
  if (["archived", "เก็บถาวร"].includes(n)) return "archived";
  return "published";
}

function ImportPage() {
  const { faqs, categories } = useData();
  const role = useRole();

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<string[][]>([]);
  const [map, setMap] = useState<Record<FieldKey, string>>({
    question: "none",
    answer: "none",
    category: "none",
    keywords: "none",
    status: "none",
  });
  const [createCats, setCreateCats] = useState(true);
  const [busy, setBusy] = useState(false);

  const header = rows[0] ?? [];
  const body = rows.slice(1);

  async function onFile(file: File) {
    setBusy(true);
    try {
      let data: string[][];
      if (/\.(xlsx|xls)$/i.test(file.name)) {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0] ?? ""]!;
        data = (XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" }) as unknown[][])
          .map((r) => r.map((c) => String(c ?? "")))
          .filter((r) => r.some((c) => c.trim()));
      } else if (/\.csv$/i.test(file.name)) {
        data = parseCsv(await file.text());
      } else {
        throw new Error("รองรับเฉพาะไฟล์ .csv, .xlsx, .xls");
      }
      if (data.length < 2)
        throw new Error("ไฟล์ไม่มีข้อมูล (ต้องมีแถวหัวตารางและข้อมูลอย่างน้อย 1 แถว)");
      if (data.length > 5001) throw new Error("ไฟล์มีมากกว่า 5,000 แถว กรุณาแบ่งไฟล์");
      setRows(data);
      setFileName(file.name);
      const h = (data[0] ?? []).map((x) => normalize(x));
      const m = {} as Record<FieldKey, string>;
      for (const f of FIELDS) {
        const i = h.findIndex((x) => (f.guess as readonly string[]).includes(x));
        m[f.key] = i >= 0 ? String(i) : "none";
      }
      setMap(m);
      toast.success(`อ่านไฟล์แล้ว ${data.length - 1} แถว`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "อ่านไฟล์ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const checks: RowCheck[] = useMemo(() => {
    const get = (r: string[], k: FieldKey) =>
      map[k] === "none" ? "" : (r[Number(map[k])] ?? "").trim();
    const existing = new Set(faqs.map((f) => normalize(f.question)));
    const seen = new Set<string>();
    return body.map((r, idx) => {
      const q = get(r, "question"),
        a = get(r, "answer");
      const c: RowCheck = {
        idx: idx + 2,
        q,
        a,
        cat: get(r, "category"),
        kw: get(r, "keywords")
          .split(/[,|]/)
          .map((x) => x.trim())
          .filter(Boolean),
        status: parseStatus(get(r, "status")),
      };
      const n = normalize(q);
      if (!q) c.problem = "ไม่มีคำถาม";
      else if (!a) c.problem = "ไม่มีคำตอบ";
      else if (q.length > 300 || a.length > 5000) c.problem = "ข้อความยาวเกินกำหนด";
      else if (existing.has(n)) c.problem = "ซ้ำกับ FAQ ที่มีอยู่";
      else if (seen.has(n)) c.problem = "ซ้ำในไฟล์";
      seen.add(n);
      return c;
    });
  }, [body, map, faqs]);

  const valid = checks.filter((c) => !c.problem);
  const mapped = map.question !== "none" && map.answer !== "none";

  function doImport() {
    const byName = new Map(categories.map((c) => [normalize(c.category_name), c.category_id]));
    const newCats: Category[] = [];
    const now = new Date().toISOString();
    const out: Faq[] = valid.map((c) => {
      let catId: string | null = null;
      if (c.cat) {
        const key = normalize(c.cat.split(/[›>]/).pop() ?? c.cat);
        catId = byName.get(key) ?? null;
        if (!catId && createCats) {
          const nc: Category = {
            category_id: newId("cat"),
            category_name: c.cat.trim(),
            parent_id: null,
            sort_order: categories.length + newCats.length + 1,
            status: "active",
          };
          newCats.push(nc);
          byName.set(key, nc.category_id);
          catId = nc.category_id;
        }
      }
      return {
        faq_id: newId("faq"),
        question: c.q,
        answer: c.a,
        category_id: catId,
        keywords: c.kw,
        status: c.status,
        created_at: now,
        updated_at: now,
      };
    });
    try {
      store.importFaqs(out, newCats);
      toast.success(
        `นำเข้า ${out.length} รายการแล้ว${newCats.length ? ` (สร้างหมวดใหม่ ${newCats.length} หมวด)` : ""}`,
      );
      setRows([]);
      setFileName("");
    } catch {
      toast.error("นำเข้าไม่สำเร็จ พื้นที่เก็บข้อมูลของเบราว์เซอร์อาจเต็ม");
    }
  }

  if (!can(role, "import"))
    return (
      <>
        <PageHeader title="นำเข้า Excel/CSV" />
        <EmptyState icon={Lock} title="เฉพาะ เจ้าของระบบ (Owner) เท่านั้น">
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            คุณอยู่ในบทบาท <strong>ผู้ใช้งาน (Viewer)</strong> ซึ่งมีสิทธิ์ค้นหาและก๊อปปี้คำตอบ FAQ
            ไปใช้ตอบลูกค้าได้เท่านั้น หากคุณเป็นเจ้าของเว็บไซต์
            กรุณาเข้าสู่ระบบด้วยอีเมลเจ้าของเพื่อนำเข้าข้อมูล
          </p>
          <div className="mt-4 flex justify-center">
            <AuthDialog />
          </div>
        </EmptyState>
      </>
    );

  return (
    <>
      <PageHeader
        title="นำเข้า Excel/CSV"
        description="ข้อมูลที่นำเข้าจะเพิ่มเข้าชุดข้อมูลทดสอบเท่านั้น"
        actions={
          <Button
            variant="outline"
            onClick={() =>
              download(
                "faq-template.csv",
                toCsv(
                  ["question", "answer", "category", "keywords", "status"],
                  [
                    [
                      "ตัวอย่าง: เติมเงินไม่เข้า",
                      "คำตอบตัวอย่าง",
                      "เติมเงิน",
                      "เติมเงิน, ไม่เข้า",
                      "published",
                    ],
                  ],
                ),
              )
            }
          >
            <FileSpreadsheet /> ดาวน์โหลดไฟล์ตัวอย่าง
          </Button>
        }
      />

      <label className="surface flex cursor-pointer flex-col items-center gap-2 border-dashed p-8 text-center hover:bg-muted/40">
        <Upload className="size-8 text-primary" />
        <span className="font-medium">
          {busy ? "กำลังอ่านไฟล์…" : fileName || "เลือกไฟล์ .csv หรือ .xlsx"}
        </span>
        <span className="text-xs text-muted-foreground">แถวแรกต้องเป็นหัวตาราง</span>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </label>

      {rows.length > 0 && (
        <div className="mt-6 space-y-6">
          <section className="surface p-5">
            <h2 className="mb-4 font-semibold">1. จับคู่คอลัมน์</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {FIELDS.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label>{f.label}</Label>
                  <Select
                    value={map[f.key]}
                    onValueChange={(v) => setMap((m) => ({ ...m, [f.key]: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— ไม่ใช้ —</SelectItem>
                      {header.map((h, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {h || `คอลัมน์ ${i + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Switch id="cc" checked={createCats} onCheckedChange={setCreateCats} />
              <Label htmlFor="cc" className="text-sm">
                สร้างหมวดหมู่ใหม่อัตโนมัติ หากไม่พบชื่อหมวดที่มีอยู่
              </Label>
            </div>
          </section>

          <section className="surface p-5">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="font-semibold">2. ตรวจสอบข้อมูล</h2>
              <Badge variant="success">พร้อมนำเข้า {mapped ? valid.length : 0}</Badge>
              <Badge variant="warning">
                มีปัญหา/ข้าม {mapped ? checks.length - valid.length : checks.length}
              </Badge>
            </div>
            {!mapped ? (
              <p className="text-sm text-destructive">กรุณาจับคู่คอลัมน์ “คำถาม” และ “คำตอบ”</p>
            ) : (
              <div className="max-h-96 overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>แถว</TableHead>
                      <TableHead>คำถาม</TableHead>
                      <TableHead>หมวด</TableHead>
                      <TableHead>ผลตรวจ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checks.slice(0, 200).map((c) => (
                      <TableRow key={c.idx}>
                        <TableCell>{c.idx}</TableCell>
                        <TableCell className="max-w-xs truncate">{c.q || "—"}</TableCell>
                        <TableCell>{c.cat || "—"}</TableCell>
                        <TableCell>
                          {c.problem ? (
                            <Badge variant="warning">{c.problem}</Badge>
                          ) : (
                            <Badge variant="success">ผ่าน</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRows([]);
                setFileName("");
              }}
            >
              ยกเลิก
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={!mapped || valid.length === 0}>
                  นำเข้า {mapped ? valid.length : 0} รายการ
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>ยืนยันการนำเข้า?</AlertDialogTitle>
                  <AlertDialogDescription>
                    จะเพิ่ม FAQ {valid.length} รายการ และข้าม {checks.length - valid.length}{" "}
                    แถวที่มีปัญหา แนะนำให้สำรองข้อมูลก่อนที่หน้า “ส่งออก / สำรอง”
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                  <AlertDialogAction onClick={doImport}>ยืนยันนำเข้า</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </>
  );
}
