import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileQuestion, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, LoadingBlock } from "@/components/app-shell";
import { CopyButton, DeleteFaqButton, StatusBadge } from "@/components/faq/faq-bits";
import { categoryPath } from "@/lib/faq/categories";
import { useData, useRole } from "@/lib/faq/store";
import { can } from "@/lib/faq/types";

export const Route = createFileRoute("/faqs/$id/")({
  head: () => ({
    meta: [
      { title: "รายละเอียด FAQ — FAQ Management" },
      {
        name: "description",
        content: "คำถาม คำตอบ หมวดหมู่ และ Keywords ของ FAQ พร้อมปุ่มคัดลอกคำตอบ",
      },
      { property: "og:title", content: "รายละเอียด FAQ — FAQ Management" },
      { property: "og:description", content: "ดูคำตอบและคัดลอกไปตอบลูกค้าได้ทันที" },
    ],
  }),
  component: FaqDetail,
});

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });

function FaqDetail() {
  const { id } = Route.useParams();
  const { loaded, faqs, categories } = useData();
  const role = useRole();
  if (!loaded) return <LoadingBlock />;
  const faq = faqs.find((f) => f.faq_id === id);
  if (!faq)
    return (
      <EmptyState icon={FileQuestion} title="ไม่พบ FAQ นี้">
        อาจถูกลบไปแล้ว{" "}
        <Link to="/search" className="text-primary underline">
          กลับไปหน้าค้นหา
        </Link>
      </EmptyState>
    );

  return (
    <div className="space-y-5">
      <Link
        to="/search"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> กลับไปค้นหา
      </Link>
      <div className="surface p-5 sm:p-8">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{categoryPath(categories, faq.category_id)}</span>
          <StatusBadge status={faq.status} />
        </div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{faq.question}</h1>
        <div className="mt-6 rounded-xl bg-muted p-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            คำตอบ
          </p>
          <p className="whitespace-pre-wrap text-base leading-relaxed">{faq.answer}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <CopyButton text={faq.answer} size="default" />
          {can(role, "edit") && (
            <Button variant="outline" asChild>
              <Link to="/faqs/$id/edit" params={{ id: faq.faq_id }}>
                <Pencil /> แก้ไข
              </Link>
            </Button>
          )}
          {can(role, "delete") && <DeleteFaqButton faq={faq} />}
        </div>
      </div>
      <div className="surface grid gap-4 p-5 text-sm sm:grid-cols-3">
        <div className="sm:col-span-3">
          <p className="mb-2 text-muted-foreground">Keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {faq.keywords.length ? (
              faq.keywords.map((k) => (
                <Badge key={k} variant="secondary">
                  {k}
                </Badge>
              ))
            ) : (
              <span>—</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-muted-foreground">รหัส</p>
          <p className="font-mono text-xs">{faq.faq_id}</p>
        </div>
        <div>
          <p className="text-muted-foreground">สร้างเมื่อ</p>
          <p suppressHydrationWarning>{fmt(faq.created_at)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">แก้ไขล่าสุด</p>
          <p suppressHydrationWarning>{fmt(faq.updated_at)}</p>
        </div>
      </div>
    </div>
  );
}
