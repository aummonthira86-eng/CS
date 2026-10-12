import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { AlertTriangle, Save, SpellCheck, Wand2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { flatTree } from "@/lib/faq/categories";
import { findDuplicates } from "@/lib/faq/search";
import { applyFix, checkThaiSpelling, type SpellIssue } from "@/lib/faq/spellcheck";
import { store, useData, type FaqInput } from "@/lib/faq/store";
import { FAQ_STATUS_LABEL, type Faq, type FaqStatus } from "@/lib/faq/types";

const schema = z.object({
  question: z
    .string()
    .trim()
    .min(5, "คำถามต้องมีอย่างน้อย 5 ตัวอักษร")
    .max(300, "คำถามยาวเกิน 300 ตัวอักษร"),
  answer: z
    .string()
    .trim()
    .min(5, "คำตอบต้องมีอย่างน้อย 5 ตัวอักษร")
    .max(5000, "คำตอบยาวเกิน 5,000 ตัวอักษร"),
  category_id: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
  keywords: z.string().max(500, "Keywords ยาวเกินไป"),
  status: z.enum(["published", "draft", "archived"]),
});

export function FaqForm({ faq }: { faq?: Faq }) {
  const { faqs, categories } = useData();
  const navigate = useNavigate();
  const [v, setV] = useState({
    question: faq?.question ?? "",
    answer: faq?.answer ?? "",
    category_id: faq?.category_id ?? "",
    keywords: faq?.keywords.join(", ") ?? "",
    status: (faq?.status ?? "published") as FaqStatus,
  });
  const [errors, setErrors] = useState<
    Partial<Record<"question" | "answer" | "category_id" | "keywords", string>>
  >({});
  const dups = useMemo(
    () => findDuplicates(faqs, v.question, faq?.faq_id),
    [faqs, v.question, faq?.faq_id],
  );
  const tree = flatTree(categories);
  const [ignored, setIgnored] = useState<Set<string>>(new Set());
  type Field = "question" | "answer";
  const spell = useMemo(() => {
    const list: (SpellIssue & { field: Field })[] = [];
    for (const field of ["question", "answer"] as Field[])
      for (const i of checkThaiSpelling(v[field]))
        if (!ignored.has(`${field}:${i.wrong}`)) list.push({ ...i, field });
    return list;
  }, [v.question, v.answer, ignored]);
  const fixOne = (i: SpellIssue & { field: Field }) =>
    setV((s) => ({ ...s, [i.field]: applyFix(s[i.field], i) }));
  const fixAll = () => {
    setV((s) => {
      const n = { ...s };
      for (const i of spell) n[i.field] = applyFix(n[i.field], i);
      return n;
    });
    toast.success("แก้คำผิดทั้งหมดแล้ว");
  };

  const set = (k: keyof typeof v) => (val: string) => setV((s) => ({ ...s, [k]: val }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = schema.safeParse(v);
    if (!r.success) {
      const errs: Record<string, string> = {};
      for (const i of r.error.issues) errs[String(i.path[0])] ??= i.message;
      setErrors(errs as typeof errors);
      toast.error("กรุณาตรวจสอบข้อมูลที่กรอก");
      return;
    }
    setErrors({});
    if (spell.length > 0) {
      toast.error(`พบคำที่อาจสะกดผิด ${spell.length} คำ กรุณาแก้ไขหรือกด “ข้าม” ก่อนบันทึก`);
      document
        .getElementById("spellcheck")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const input: FaqInput = {
      question: r.data.question,
      answer: r.data.answer,
      category_id: r.data.category_id,
      keywords: [
        ...new Set(
          r.data.keywords
            .split(/[,|\n]/)
            .map((k) => k.trim())
            .filter(Boolean),
        ),
      ],
      status: r.data.status,
    };
    try {
      if (faq) {
        store.updateFaq(faq.faq_id, input);
        toast.success("บันทึกการแก้ไขแล้ว");
        navigate({ to: "/faqs/$id", params: { id: faq.faq_id } });
      } else {
        const created = store.addFaq(input);
        toast.success("เพิ่ม FAQ ใหม่แล้ว");
        navigate({ to: "/faqs/$id", params: { id: created.faq_id } });
      }
    } catch {
      toast.error("บันทึกไม่สำเร็จ พื้นที่เก็บข้อมูลของเบราว์เซอร์อาจเต็ม");
    }
  }

  return (
    <form onSubmit={submit} className="surface space-y-5 p-5 sm:p-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="q">คำถาม *</Label>
        <Input
          id="q"
          value={v.question}
          onChange={(e) => set("question")(e.target.value)}
          placeholder="เช่น เติมเงินแล้วไม่ได้รับเหรียญ"
        />
        {errors.question && <p className="text-sm text-destructive">{errors.question}</p>}
        {dups.length > 0 && (
          <div className="rounded-lg border border-warning bg-warning/15 p-3 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <AlertTriangle className="size-4" /> อาจซ้ำกับคำถามที่มีอยู่แล้ว
            </p>
            <ul className="mt-1 list-disc pl-6">
              {dups.slice(0, 3).map((d) => (
                <li key={d.faq.faq_id}>
                  <Link to="/faqs/$id" params={{ id: d.faq.faq_id }} className="underline">
                    {d.faq.question}
                  </Link>{" "}
                  <span className="text-muted-foreground">({Math.round(d.sim * 100)}% คล้าย)</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="a">คำตอบ *</Label>
        <Textarea
          id="a"
          rows={7}
          value={v.answer}
          onChange={(e) => set("answer")(e.target.value)}
          placeholder="คำตอบที่เจ้าหน้าที่จะคัดลอกไปตอบลูกค้า"
        />
        {errors.answer && <p className="text-sm text-destructive">{errors.answer}</p>}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>หมวดหมู่ *</Label>
          <Select value={v.category_id} onValueChange={set("category_id")}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกหมวดหมู่" />
            </SelectTrigger>
            <SelectContent>
              {tree.map(({ cat, depth }) => (
                <SelectItem key={cat.category_id} value={cat.category_id}>
                  {depth ? "　└ " : ""}
                  {cat.category_name}
                  {cat.status === "inactive" ? " (ปิดใช้งาน)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category_id && <p className="text-sm text-destructive">{errors.category_id}</p>}
        </div>
        <div className="space-y-2">
          <Label>สถานะ</Label>
          <Select value={v.status} onValueChange={set("status")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FAQ_STATUS_LABEL) as FaqStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {FAQ_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="k">Keywords / คำพ้อง</Label>
        <Input
          id="k"
          value={v.keywords}
          onChange={(e) => set("keywords")(e.target.value)}
          placeholder="คั่นด้วยเครื่องหมายจุลภาค เช่น เติมเงิน, ของไม่เข้า"
        />
        <p className="text-xs text-muted-foreground">
          ใส่คำที่ลูกค้ามักใช้ ช่วยให้ค้นหาเจอง่ายขึ้น
        </p>
        {errors.keywords && <p className="text-sm text-destructive">{errors.keywords}</p>}
      </div>
      <div
        id="spellcheck"
        className={`rounded-lg border p-4 text-sm ${spell.length ? "border-destructive/40 bg-destructive/5" : "border-success/40 bg-success/10"}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 font-medium">
            <SpellCheck className="size-4" />
            {spell.length
              ? `ตรวจพบคำที่อาจสะกดผิด ${spell.length} คำ`
              : "ตรวจคำสะกดภาษาไทยแล้ว ไม่พบคำผิด"}
          </p>
          {spell.length > 1 && (
            <Button type="button" size="sm" onClick={fixAll}>
              <Wand2 /> แก้ทั้งหมด
            </Button>
          )}
        </div>
        {spell.length > 0 && (
          <ul className="mt-3 space-y-2">
            {spell.map((i) => (
              <li
                key={`${i.field}:${i.wrong}`}
                className="flex flex-wrap items-center gap-2 rounded-md bg-card p-2"
              >
                <span className="text-xs text-muted-foreground">
                  {i.field === "question" ? "คำถาม" : "คำตอบ"}
                </span>
                <span className="rounded bg-destructive/10 px-1.5 text-destructive line-through">
                  {i.wrong.trim() || "␣"}
                </span>
                <span>→</span>
                <span className="rounded bg-success/15 px-1.5 font-medium text-success">
                  {i.suggestion}
                </span>
                <span className="text-xs text-muted-foreground">({i.reason})</span>
                <span className="ml-auto flex gap-1">
                  <Button type="button" size="sm" onClick={() => fixOne(i)}>
                    แก้ไข
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setIgnored((s) => new Set(s).add(`${i.field}:${i.wrong}`))}
                  >
                    ข้าม
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          ตรวจจากรายการคำที่มักสะกดผิดและรูปแบบการพิมพ์ผิด (ทำงานในเครื่อง ไม่มีค่าใช้จ่าย)
          อาจไม่ครอบคลุมทุกคำ
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => history.back()}>
          ยกเลิก
        </Button>
        <Button type="submit">
          <Save /> บันทึก
        </Button>
      </div>
    </form>
  );
}
