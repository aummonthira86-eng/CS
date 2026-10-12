import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Database, FileDown, FolderDown, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/app-shell";
import { categoryPath } from "@/lib/faq/categories";
import { download, toCsv } from "@/lib/faq/csv";
import { store, useData, useRole } from "@/lib/faq/store";
import { can, type DataState } from "@/lib/faq/types";

export const Route = createFileRoute("/export")({
  head: () => ({
    meta: [
      { title: "ส่งออกและสำรองข้อมูล — FAQ Management" },
      {
        name: "description",
        content: "ส่งออก FAQ และหมวดหมู่เป็น CSV และดาวน์โหลด/กู้คืนไฟล์สำรองข้อมูลทดสอบ",
      },
      { property: "og:title", content: "ส่งออกและสำรองข้อมูล — FAQ Management" },
      { property: "og:description", content: "ส่งออก FAQ เป็น CSV และสำรองข้อมูล" },
    ],
  }),
  component: ExportPage,
});

const stamp = () => new Date().toISOString().slice(0, 10);

function Card({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: typeof FileDown;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface flex flex-col gap-3 p-5">
      <Icon className="size-6 text-primary" />
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <div className="mt-auto">{children}</div>
    </div>
  );
}

function ExportPage() {
  const { faqs, categories } = useData();
  const role = useRole();
  const [pendingRestore, setPendingRestore] = useState<DataState | null>(null);

  function exportFaqs() {
    download(
      `faqs-${stamp()}.csv`,
      toCsv(
        [
          "faq_id",
          "question",
          "answer",
          "category_id",
          "category",
          "keywords",
          "status",
          "created_at",
          "updated_at",
        ],
        faqs.map((f) => [
          f.faq_id,
          f.question,
          f.answer,
          f.category_id ?? "",
          categoryPath(categories, f.category_id),
          f.keywords.join(", "),
          f.status,
          f.created_at,
          f.updated_at,
        ]),
      ),
    );
    toast.success(`ส่งออก FAQ ${faqs.length} รายการแล้ว`);
  }

  function exportCats() {
    download(
      `categories-${stamp()}.csv`,
      toCsv(
        ["category_id", "category_name", "parent_id", "sort_order", "status"],
        categories.map((c) => [
          c.category_id,
          c.category_name,
          c.parent_id ?? "",
          c.sort_order,
          c.status,
        ]),
      ),
    );
    toast.success("ส่งออกหมวดหมู่แล้ว");
  }

  function backup() {
    download(
      `faq-backup-${stamp()}.json`,
      JSON.stringify(
        { version: 1, exported_at: new Date().toISOString(), ...store.exportState() },
        null,
        2,
      ),
      "application/json",
    );
    toast.success("ดาวน์โหลดไฟล์สำรองแล้ว");
  }

  async function restore(file: File) {
    try {
      const data = JSON.parse(await file.text()) as DataState;
      if (!Array.isArray(data.faqs) || !Array.isArray(data.categories)) throw new Error();
      const okFaq = data.faqs.every(
        (f) =>
          typeof f.faq_id === "string" &&
          typeof f.question === "string" &&
          typeof f.answer === "string",
      );
      if (!okFaq) throw new Error();
      setPendingRestore(data);
    } catch {
      toast.error("ไฟล์สำรองไม่ถูกต้อง");
    }
  }

  function handleConfirmRestore() {
    if (!pendingRestore) return;
    store.replaceAll({
      faqs: pendingRestore.faqs,
      categories: pendingRestore.categories,
      settings: pendingRestore.settings,
    });
    toast.success(`กู้คืนข้อมูลสำเร็จ (FAQ ${pendingRestore.faqs.length} รายการ)`);
    setPendingRestore(null);
  }

  return (
    <>
      <PageHeader
        title="ส่งออก / สำรองข้อมูล"
        description="ไฟล์ CSV เปิดใน Excel ได้ทันที (รองรับภาษาไทย)"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          icon={FileDown}
          title="ส่งออก FAQ (CSV)"
          desc={`${faqs.length} รายการ พร้อมชื่อหมวดหมู่`}
        >
          <Button onClick={exportFaqs}>ดาวน์โหลด</Button>
        </Card>
        <Card icon={FolderDown} title="ส่งออกหมวดหมู่ (CSV)" desc={`${categories.length} หมวดหมู่`}>
          <Button onClick={exportCats}>ดาวน์โหลด</Button>
        </Card>
        <Card
          icon={Database}
          title="สำรองข้อมูลทั้งหมด (JSON)"
          desc="FAQ หมวดหมู่ และการตั้งค่า สำหรับกู้คืนภายหลัง"
        >
          <Button onClick={backup}>ดาวน์โหลดไฟล์สำรอง</Button>
        </Card>
        <Card
          icon={Upload}
          title="กู้คืนจากไฟล์สำรอง"
          desc="แทนที่ข้อมูลทดสอบปัจจุบันด้วยไฟล์ .json"
        >
          {can(role, "settings") ? (
            <Button variant="outline" asChild>
              <label className="cursor-pointer">
                เลือกไฟล์
                <input
                  type="file"
                  accept=".json,application/json"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) restore(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">เฉพาะ Admin</p>
          )}
        </Card>
      </div>

      <AlertDialog
        open={!!pendingRestore}
        onOpenChange={(open) => !open && setPendingRestore(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการกู้คืนข้อมูลสำรอง?</AlertDialogTitle>
            <AlertDialogDescription>
              การกู้คืนจะแทนที่ FAQ หมวดหมู่ และการตั้งค่าปัจจุบันทั้งหมดด้วยข้อมูลจากไฟล์สำรอง (FAQ{" "}
              {pendingRestore?.faqs.length ?? 0} รายการ) การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingRestore(null)}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRestore}
              className="bg-primary text-primary-foreground"
            >
              ยืนยันการกู้คืน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
