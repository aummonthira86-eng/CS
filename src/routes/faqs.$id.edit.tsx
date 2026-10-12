import { createFileRoute } from "@tanstack/react-router";
import { FileQuestion, Lock } from "lucide-react";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/app-shell";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { FaqForm } from "@/components/faq/faq-form";
import { useData, useRole } from "@/lib/faq/store";
import { can } from "@/lib/faq/types";

export const Route = createFileRoute("/faqs/$id/edit")({
  head: () => ({
    meta: [
      { title: "แก้ไข FAQ — FAQ Management" },
      { name: "description", content: "แก้ไขคำถาม คำตอบ หมวดหมู่ และ Keywords ของ FAQ" },
      { property: "og:title", content: "แก้ไข FAQ — FAQ Management" },
      { property: "og:description", content: "แก้ไขรายละเอียด FAQ" },
    ],
  }),
  component: EditFaq,
});

function EditFaq() {
  const { id } = Route.useParams();
  const { loaded, faqs } = useData();
  const role = useRole();
  if (!loaded) return <LoadingBlock />;
  const faq = faqs.find((f) => f.faq_id === id);
  if (!faq) return <EmptyState icon={FileQuestion} title="ไม่พบ FAQ นี้" />;
  if (!can(role, "edit"))
    return (
      <>
        <PageHeader title="แก้ไข FAQ" />
        <EmptyState icon={Lock} title="เฉพาะ เจ้าของระบบ (Owner) เท่านั้นที่มีสิทธิ์แก้ไข">
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            คุณอยู่ในบทบาท <strong>ผู้ใช้งาน (Viewer)</strong>{" "}
            ซึ่งมีสิทธิ์ค้นหาและก๊อปปี้คำตอบไปใช้งานได้เท่านั้น หากคุณเป็นเจ้าของเว็บไซต์
            กรุณาเข้าสู่ระบบด้วยอีเมลเจ้าของเพื่อแก้ไข FAQ
          </p>
          <div className="mt-4 flex justify-center">
            <AuthDialog />
          </div>
        </EmptyState>
      </>
    );
  return (
    <>
      <PageHeader title="แก้ไข FAQ" />
      <FaqForm key={faq.faq_id} faq={faq} />
    </>
  );
}
