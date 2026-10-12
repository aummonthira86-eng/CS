import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingBlock, PageHeader } from "@/components/app-shell";
import { EVAL_CASES } from "@/lib/faq/eval-cases";
import { search, type SearchMode } from "@/lib/faq/search";
import { useData } from "@/lib/faq/store";

export const Route = createFileRoute("/evaluation")({
  head: () => ({
    meta: [
      { title: "ทดสอบการค้นหา — FAQ Management" },
      {
        name: "description",
        content: "ชุดทดสอบการค้นหาภาษาไทย เปรียบเทียบผลค้นจากความหมายกับค้นจากคำตรงตัว",
      },
      { property: "og:title", content: "ทดสอบการค้นหา — FAQ Management" },
      { property: "og:description", content: "ชุดทดสอบการค้นหาภาษาไทย" },
    ],
  }),
  component: EvalPage,
});

function EvalPage() {
  const { loaded, faqs } = useData();
  const [mode, setMode] = useState<SearchMode>("semantic");

  const results = useMemo(() => {
    const pool = faqs.filter((f) => f.status !== "archived");
    return EVAL_CASES.map((c) => {
      const top = search(pool, c.query, mode).slice(0, 3);
      const rank = top.findIndex((h) => h.faq.faq_id === c.expected);
      return { ...c, top, rank, expectedQ: faqs.find((f) => f.faq_id === c.expected)?.question };
    });
  }, [faqs, mode]);

  const summary = (m: SearchMode) => {
    const pool = faqs.filter((f) => f.status !== "archived");
    return EVAL_CASES.filter((c) =>
      search(pool, c.query, m)
        .slice(0, 3)
        .some((h) => h.faq.faq_id === c.expected),
    ).length;
  };

  if (!loaded) return <LoadingBlock />;
  const sem = summary("semantic"),
    kw = summary("keyword");

  return (
    <>
      <PageHeader
        title="ทดสอบการค้นหา"
        description={`${EVAL_CASES.length} คำค้นภาษาไทยที่ใช้คำต่างจาก FAQ — ผ่าน = FAQ ที่คาดหวังอยู่ใน 3 อันดับแรก`}
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="surface p-4">
          <p className="text-sm text-muted-foreground">ค้นจากความหมาย</p>
          <p className="font-display text-3xl font-semibold text-primary">
            {sem}/{EVAL_CASES.length}{" "}
            <span className="text-base">({Math.round((sem / EVAL_CASES.length) * 100)}%)</span>
          </p>
        </div>
        <div className="surface p-4">
          <p className="text-sm text-muted-foreground">ค้นจากคำตรงตัว</p>
          <p className="font-display text-3xl font-semibold">
            {kw}/{EVAL_CASES.length}{" "}
            <span className="text-base">({Math.round((kw / EVAL_CASES.length) * 100)}%)</span>
          </p>
        </div>
      </div>
      <p className="mb-5 flex items-start gap-2 rounded-lg bg-secondary p-3 text-xs text-secondary-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        ผลนี้คำนวณจากข้อมูลปัจจุบันในเบราว์เซอร์ หากแก้ไขหรือลบ FAQ ตัวอย่าง ผลอาจเปลี่ยน
        (รีเซ็ตได้ที่หน้าตั้งค่า) ข้อจำกัด: การค้นจากความหมายใช้พจนานุกรมคำพ้องที่เตรียมไว้
        คำค้นนอกพจนานุกรมอาจไม่เจอ
      </p>
      <Tabs value={mode} onValueChange={(m) => setMode(m as SearchMode)} className="mb-3">
        <TabsList>
          <TabsTrigger value="semantic">ค้นจากความหมาย</TabsTrigger>
          <TabsTrigger value="keyword">ค้นจากคำตรงตัว</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="surface overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>คำค้น</TableHead>
              <TableHead>ผลที่คาดหวัง</TableHead>
              <TableHead>ผลจริง (3 อันดับแรก)</TableHead>
              <TableHead>สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((r) => (
              <TableRow key={r.query}>
                <TableCell className="min-w-40 align-top">
                  <p className="font-medium">{r.query}</p>
                  <p className="text-xs text-muted-foreground">{r.note}</p>
                </TableCell>
                <TableCell className="min-w-40 align-top text-sm">
                  {r.expectedQ ?? <span className="text-destructive">FAQ ถูกลบแล้ว</span>}
                </TableCell>
                <TableCell className="min-w-56 align-top text-sm">
                  {r.top.length ? (
                    <ol className="list-decimal space-y-0.5 pl-4">
                      {r.top.map((h) => (
                        <li
                          key={h.faq.faq_id}
                          className={
                            h.faq.faq_id === r.expected ? "font-semibold text-primary" : ""
                          }
                        >
                          {h.faq.question}{" "}
                          <span className="text-xs text-muted-foreground">
                            ({Math.round(h.score * 100)}%)
                          </span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <span className="text-muted-foreground">ไม่พบผลลัพธ์</span>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  {r.rank >= 0 ? (
                    <Badge variant="success">
                      <CheckCircle2 className="mr-1 size-3" />
                      ผ่าน (#{r.rank + 1})
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="mr-1 size-3" />
                      ไม่ผ่าน
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
