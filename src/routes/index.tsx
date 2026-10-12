import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FileQuestion, FolderTree, PenLine, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingBlock, PageHeader } from "@/components/app-shell";
import { FaqCard } from "@/components/faq/faq-bits";
import { useData } from "@/lib/faq/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "แดชบอร์ด — FAQ Management" },
      {
        name: "description",
        content: "ภาพรวมคลัง FAQ ของทีม CS: จำนวนคำถาม หมวดหมู่ และรายการล่าสุด พร้อมค้นหาด่วน",
      },
      { property: "og:title", content: "แดชบอร์ด — FAQ Management" },
      { property: "og:description", content: "ภาพรวมคลัง FAQ ของทีม CS พร้อมค้นหาด่วน" },
    ],
  }),
  component: Dashboard,
});

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Search;
  label: string;
  value: number | string;
}) {
  return (
    <div className="surface flex items-center gap-4 p-4">
      <div className="grid size-11 place-items-center rounded-lg bg-secondary text-primary">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="font-display text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function Dashboard() {
  const { loaded, faqs, categories } = useData();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const recent = [...faqs].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5);

  return (
    <>
      <PageHeader title="สวัสดี ทีม CS" description="ค้นหาคำตอบให้ลูกค้าได้ในไม่กี่วินาที" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/search", search: { q: q.trim() || undefined } });
        }}
        className="relative mb-8"
      >
        <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="พิมพ์สิ่งที่ลูกค้าถาม เช่น “จ่ายเงินแล้วของไม่มา”"
          className="h-16 rounded-2xl bg-card pl-14 pr-28 text-base shadow-search sm:text-lg"
        />
        <Button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
          ค้นหา
        </Button>
      </form>

      {!loaded ? (
        <LoadingBlock />
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat icon={FileQuestion} label="FAQ ทั้งหมด" value={faqs.length} />
            <Stat
              icon={Sparkles}
              label="เผยแพร่แล้ว"
              value={faqs.filter((f) => f.status === "published").length}
            />
            <Stat
              icon={PenLine}
              label="ฉบับร่าง"
              value={faqs.filter((f) => f.status === "draft").length}
            />
            <Stat icon={FolderTree} label="หมวดหมู่" value={categories.length} />
          </div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">แก้ไขล่าสุด</h2>
            <Link to="/search" className="text-sm text-primary hover:underline">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="space-y-3">
            {recent.map((f) => (
              <FaqCard key={f.faq_id} faq={f} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
