import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Info, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/app-shell";
import { FaqCard } from "@/components/faq/faq-bits";
import { flatTree, withChildren } from "@/lib/faq/categories";
import { search, type SearchMode } from "@/lib/faq/search";
import { useData } from "@/lib/faq/store";

type S = { q?: string | undefined; mode?: SearchMode | undefined; cat?: string | undefined };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): S => ({
    q: typeof s["q"] === "string" && s["q"] ? s["q"] : undefined,
    mode: s["mode"] === "keyword" || s["mode"] === "semantic" ? s["mode"] : undefined,
    cat: typeof s["cat"] === "string" && s["cat"] ? s["cat"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "ค้นหา FAQ — FAQ Management" },
      { name: "description", content: "ค้นหาคำตอบภาษาไทยด้วยคำค้นหรือความหมาย กรองตามหมวดหมู่" },
      { property: "og:title", content: "ค้นหา FAQ — FAQ Management" },
      { property: "og:description", content: "ค้นหาคำตอบภาษาไทยด้วยคำค้นหรือความหมาย" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { loaded, faqs, categories, settings } = useData();
  const sp = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const mode: SearchMode =
    sp.mode ?? (settings.default_search_mode === "keyword" ? "keyword" : "semantic");
  const [text, setText] = useState(sp.q ?? "");
  const [drafts, setDrafts] = useState(false);
  useEffect(() => setDrafts(settings.include_drafts === "true"), [settings.include_drafts]);

  // debounce query into URL
  useEffect(() => {
    const t = setTimeout(() => {
      if ((sp.q ?? "") !== text.trim())
        navigate({ search: (p: S) => ({ ...p, q: text.trim() || undefined }), replace: true });
    }, 250);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const pool = useMemo(() => {
    let list = faqs.filter((f) => f.status === "published" || (drafts && f.status === "draft"));
    if (sp.cat) {
      const ids = withChildren(categories, sp.cat);
      list = list.filter((f) => f.category_id && ids.has(f.category_id));
    }
    return list;
  }, [faqs, categories, sp.cat, drafts]);

  const limit = Number(settings.results_limit) || 20;
  const hits = useMemo(
    () => (sp.q ? search(pool, sp.q, mode).slice(0, limit) : null),
    [pool, sp.q, mode, limit],
  );

  return (
    <>
      <PageHeader title="ค้นหา FAQ" description="พิมพ์คำถามของลูกค้าตามที่ลูกค้าพิมพ์มาได้เลย" />
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="เช่น โอนเงินแล้วไม่ได้เหรียญ"
          className="h-14 rounded-2xl bg-card pl-14 text-base shadow-search"
          aria-label="คำค้นหา"
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Tabs
          value={mode}
          onValueChange={(m) =>
            navigate({ search: (p: S) => ({ ...p, mode: m as SearchMode }), replace: true })
          }
        >
          <TabsList>
            <TabsTrigger value="semantic">ค้นจากความหมาย</TabsTrigger>
            <TabsTrigger value="keyword">ค้นจากคำตรงตัว</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select
          value={sp.cat ?? "all"}
          onValueChange={(c) =>
            navigate({
              search: (p: S) => ({ ...p, cat: c === "all" ? undefined : c }),
              replace: true,
            })
          }
        >
          <SelectTrigger className="w-56 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
            {flatTree(categories).map(({ cat, depth }) => (
              <SelectItem key={cat.category_id} value={cat.category_id}>
                {depth ? "　└ " : ""}
                {cat.category_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch id="drafts" checked={drafts} onCheckedChange={setDrafts} />
          <Label htmlFor="drafts" className="text-sm">
            รวมฉบับร่าง
          </Label>
        </div>
      </div>

      {mode === "semantic" && (
        <p className="mb-5 flex items-start gap-2 rounded-lg bg-secondary p-3 text-xs text-secondary-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          ค้นจากความหมายแบบพื้นฐาน (ทำงานในเครื่อง ไม่มีค่าใช้จ่าย) ใช้พจนานุกรมคำพ้องภาษาไทย +
          การเทียบคำ ยังไม่ใช่โมเดล AI เต็มรูปแบบ อาจไม่เข้าใจคำที่ไม่อยู่ในพจนานุกรม
        </p>
      )}

      {!loaded ? (
        <LoadingBlock />
      ) : hits === null ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">แสดง FAQ ทั้งหมด {pool.length} รายการ</p>
          {pool.map((f) => (
            <FaqCard key={f.faq_id} faq={f} />
          ))}
        </div>
      ) : hits.length === 0 ? (
        <EmptyState title="ไม่พบคำตอบที่ตรงกัน">
          ลองใช้คำอื่น สลับโหมดการค้นหา หรือเลือก “ทุกหมวดหมู่”
        </EmptyState>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            พบ {hits.length} รายการ เรียงตามความเกี่ยวข้อง
          </p>
          {hits.map((h) => (
            <FaqCard
              key={h.faq.faq_id}
              faq={h.faq}
              query={mode === "keyword" ? sp.q : undefined}
              score={h.score}
              reasons={h.reasons}
            />
          ))}
        </div>
      )}
    </>
  );
}
