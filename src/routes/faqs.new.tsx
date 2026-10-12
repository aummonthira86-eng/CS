import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/app-shell";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { FaqForm } from "@/components/faq/faq-form";
import { useRole } from "@/lib/faq/store";
import { can } from "@/lib/faq/types";

export const Route = createFileRoute("/faqs/new")({
  head: () => ({
    meta: [
      { title: "เพิ่ม FAQ ใหม่ — FAQ Management" },
      { name: "description", content: "เพิ่มคำถามและคำตอบใหม่เข้าคลัง FAQ ของทีม CS" },
      { property: "og:title", content: "เพิ่ม FAQ ใหม่ — FAQ Management" },
      { property: "og:description", content: "เพิ่มคำถามและคำตอบใหม่เข้าคลัง FAQ" },
    ],
  }),
  component: NewFaq,
});

function NewFaq() {
  const role = useRole();
  return (
    <>
      <PageHeader title="เพิ่ม FAQ ใหม่" />
      {can(role, "edit") ? (
        <FaqForm />
      ) : (
        <EmptyState icon={Lock} title="เฉพาะ เจ้าของระบบ (Owner) เท่านั้นที่เพิ่ม FAQ ได้">
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            คุณอยู่ในบทบาท <strong>ผู้ใช้งาน (Viewer)</strong>{" "}
            ซึ่งมีสิทธิ์ค้นหาและก๊อปปี้คำตอบไปใช้งานได้เท่านั้น หากคุณเป็นเจ้าของเว็บไซต์
            กรุณาเข้าสู่ระบบด้วยอีเมลเจ้าของเพื่อเพิ่ม FAQ
          </p>
          <div className="mt-4 flex justify-center">
            <AuthDialog />
          </div>
        </EmptyState>
      )}
    </>
  );
}
