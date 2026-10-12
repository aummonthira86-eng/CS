import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Copy, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { categoryPath } from "@/lib/faq/categories";
import { store, useData } from "@/lib/faq/store";
import { FAQ_STATUS_LABEL, type Faq, type FaqStatus } from "@/lib/faq/types";

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

export function CopyButton({
  text,
  size = "sm",
  label = "คัดลอกคำตอบ",
}: {
  text: string;
  size?: "sm" | "default";
  label?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size={size}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await copyText(text);
        setDone(true);
        toast.success("คัดลอกคำตอบแล้ว");
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check /> : <Copy />}
      {label}
    </Button>
  );
}

export function StatusBadge({ status }: { status: FaqStatus }) {
  const v = status === "published" ? "success" : status === "draft" ? "warning" : "muted";
  return <Badge variant={v}>{FAQ_STATUS_LABEL[status]}</Badge>;
}

export function Highlight({ text, query }: { text: string; query?: string | undefined }) {
  const q = query?.trim();
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export function FaqCard({
  faq,
  query,
  score,
  reasons,
}: {
  faq: Faq;
  query?: string | undefined;
  score?: number | undefined;
  reasons?: string[] | undefined;
}) {
  const { categories } = useData();
  return (
    <article className="surface group p-4 transition-shadow hover:shadow-search sm:p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{categoryPath(categories, faq.category_id)}</span>
        {faq.status !== "published" && <StatusBadge status={faq.status} />}
        {score !== undefined && (
          <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
            ความเกี่ยวข้อง {Math.round(score * 100)}%
          </span>
        )}
      </div>
      <Link to="/faqs/$id" params={{ id: faq.faq_id }} className="block">
        <h3 className="text-lg font-semibold group-hover:text-primary">
          <Highlight text={faq.question} query={query} />
        </h3>
        <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">
          <Highlight text={faq.answer} query={query} />
        </p>
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CopyButton text={faq.answer} />
        {reasons && reasons.length > 0 && (
          <span className="text-xs text-muted-foreground">ตรงกับ: {reasons.join(", ")}</span>
        )}
      </div>
    </article>
  );
}

export function DeleteFaqButton({ faq }: { faq: Faq }) {
  const navigate = useNavigate();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-destructive">
          <Trash2 /> ลบ
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ยืนยันการลบ FAQ นี้?</AlertDialogTitle>
          <AlertDialogDescription>
            “{faq.question}” จะถูกลบออกจากข้อมูลทดสอบ และไม่สามารถกู้คืนได้ (เว้นแต่จะมีไฟล์สำรอง)
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              store.deleteFaq(faq.faq_id);
              toast.success("ลบ FAQ แล้ว");
              navigate({ to: "/search" });
            }}
          >
            ลบ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
