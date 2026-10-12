import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Lock,
  RotateCcw,
  Palette,
  Crown,
  Shield,
  User,
  Database,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ThemeCustomizerPanel } from "@/components/theme-customizer";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { useAuth, authStore } from "@/lib/auth/auth-store";
import { store, useData, useRole } from "@/lib/faq/store";
import { can } from "@/lib/faq/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "ตั้งค่า — FAQ Management" },
      { name: "description", content: "ตั้งค่าทั่วไปของระบบ FAQ และรีเซ็ตข้อมูลทดสอบ" },
      { property: "og:title", content: "ตั้งค่า — FAQ Management" },
      { property: "og:description", content: "ตั้งค่าทั่วไปและรีเซ็ตข้อมูลทดสอบ" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, loaded } = useData();
  const role = useRole();
  const { user, isOwner, ownerEmail } = useAuth();
  const [name, setName] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");

  useEffect(() => {
    setName(settings.site_name ?? "");
    setNewOwnerEmail(ownerEmail);
  }, [settings.site_name, loaded, ownerEmail]);

  if (!can(role, "settings"))
    return (
      <>
        <PageHeader title="ตั้งค่าระบบ" />
        <EmptyState icon={Lock} title="เฉพาะ เจ้าของระบบ (Owner) เท่านั้น">
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            คุณอยู่ในบทบาท <strong>ผู้ใช้งาน (Viewer)</strong>{" "}
            ซึ่งมีสิทธิ์ค้นหาคำตอบและก๊อปปี้ข้อความไปใช้ได้เท่านั้น หากคุณเป็นเจ้าของเว็บไซต์
            กรุณาเข้าสู่ระบบด้วยอีเมลเจ้าของเพื่อจัดการระบบ
          </p>
          <div className="mt-4 flex justify-center">
            <AuthDialog />
          </div>
        </EmptyState>
      </>
    );

  return (
    <>
      <PageHeader title="ตั้งค่า" description="ไม่มีการเก็บรหัสผ่านหรือ API key ในหน้านี้" />
      <div className="space-y-6">
        <section className="surface space-y-5 p-5">
          <div className="space-y-2">
            <Label htmlFor="sn">ชื่อระบบ</Label>
            <div className="flex gap-2">
              <Input
                id="sn"
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
              />
              <Button
                onClick={() => {
                  if (!name.trim()) {
                    toast.error("กรุณากรอกชื่อ");
                    return;
                  }
                  store.setSetting("site_name", name.trim());
                  toast.success("บันทึกแล้ว");
                }}
              >
                บันทึก
              </Button>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>โหมดค้นหาเริ่มต้น</Label>
              <Select
                value={settings.default_search_mode}
                onValueChange={(v) => {
                  store.setSetting("default_search_mode", v);
                  toast.success("บันทึกแล้ว");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semantic">ค้นจากความหมาย</SelectItem>
                  <SelectItem value="keyword">ค้นจากคำตรงตัว</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>จำนวนผลลัพธ์สูงสุด</Label>
              <Select
                value={settings.results_limit}
                onValueChange={(v) => {
                  store.setSetting("results_limit", v);
                  toast.success("บันทึกแล้ว");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["10", "20", "50"].map((n) => (
                    <SelectItem key={n} value={n}>
                      {n} รายการ
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="dr"
              checked={settings.include_drafts === "true"}
              onCheckedChange={(on) => store.setSetting("include_drafts", String(on))}
            />
            <Label htmlFor="dr">แสดงฉบับร่างในผลค้นหาโดยค่าเริ่มต้น</Label>
          </div>
        </section>

        {/* Supabase & Roles Management */}
        <section className="surface space-y-4 p-5">
          <div className="border-b border-border pb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                <Crown className="size-5 text-amber-500" /> การจัดการสิทธิ์และเจ้าของระบบ (Roles &
                Permissions)
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                กำหนดอีเมลของเจ้าของระบบเพื่อปลดล็อกสิทธิ์การแก้ไข
                และจำกัดให้ผู้ใช้งานทั่วไปก๊อปปี้ข้อความได้อย่างเดียว
              </p>
            </div>
            <Badge className="bg-amber-500 text-white text-xs">
              👑 สิทธิ์ปัจจุบัน: เจ้าของ (Owner)
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="owner-email">อีเมลเจ้าของระบบ (Owner Email)</Label>
              <div className="flex gap-2">
                <Input
                  id="owner-email"
                  value={newOwnerEmail}
                  onChange={(e) => setNewOwnerEmail(e.target.value)}
                  placeholder="aumaoyaoao@gmail.com"
                />
                <Button
                  onClick={() => {
                    if (!newOwnerEmail.trim() || !newOwnerEmail.includes("@")) {
                      toast.error("กรุณาระบุอีเมลที่ถูกต้อง");
                      return;
                    }
                    authStore.setOwnerEmail(newOwnerEmail.trim());
                    toast.success("บันทึกอีเมลเจ้าของระบบเรียบร้อย");
                  }}
                >
                  บันทึก
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                เมื่อผู้ใช้ล็อกอินด้วยอีเมลนี้ จะได้รับสิทธิ์ <strong>เจ้าของ (Owner)</strong>{" "}
                สามารถแก้ไขเว็บได้ทั้งหมด (สามารถระบุหลายอีเมลคั่นด้วยจุลภาค เช่น{" "}
                <code>aumaoyaoao@gmail.com, admin@team.com</code>)
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Crown className="size-4 text-amber-500" />
                  <span className="font-semibold text-sm text-foreground">
                    สิทธิ์: เจ้าของ (Owner)
                  </span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
                  <li>แก้ไขเนื้อหาเว็บไซต์ได้ทั้งหมด</li>
                  <li>เพิ่ม, แก้ไข, ลบ FAQ</li>
                  <li>จัดการหมวดหมู่ และโครงสร้างหมวดหมู่</li>
                  <li>อัปโหลด และจัดการคลังรูปภาพ</li>
                  <li>นำเข้า / ส่งออกข้อมูล และตั้งค่าระบบ</li>
                </ul>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <span className="font-semibold text-sm text-foreground">
                    สิทธิ์: ผู้ใช้งาน (Viewer)
                  </span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
                  <li>ค้นหาคำตอบในคลัง FAQ ทั้งหมด</li>
                  <li>
                    <strong className="text-foreground">ก๊อปปี้คำตอบไปตอบลูกค้าได้ทันที</strong>
                  </li>
                  <li>คัดลอกลิงก์และ Markdown จากคลังรูปภาพ</li>
                  <li>ไม่สามารถเพิ่ม, แก้ไข หรือลบข้อมูลใดๆ</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Supabase Connection Status */}
        <section className="surface space-y-3 p-5">
          <div className="border-b border-border pb-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Database className="size-5 text-primary" /> การเชื่อมต่อ Supabase Auth & Database
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              ข้อมูลการเชื่อมต่อกับ Supabase Backend
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
              <span className="text-muted-foreground">Supabase Project URL</span>
              <p className="font-mono font-medium truncate text-foreground">
                https://xrtolomnubkcqcpwibhc.supabase.co
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
              <span className="text-muted-foreground">Supabase Publishable Key</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span className="font-mono text-foreground">
                  sb_publishable_ceTg... (กำหนดแล้ว)
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="surface space-y-4 p-5">
          <div className="border-b border-border pb-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Palette className="size-5 text-primary" /> ปรับแต่งธีมและรูปแบบอักษร (Theme &
              Typography)
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              เลือกโทนสีของระบบ โหมดมืด/สว่าง และฟอนต์ภาษาไทยสำหรับหน้าเว็บ
              โดยการเปลี่ยนแปลงจะบันทึกในเบราว์เซอร์อัตโนมัติ
            </p>
          </div>
          <ThemeCustomizerPanel />
        </section>

        <section className="surface space-y-3 p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-5 text-warning" /> เกี่ยวกับข้อมูลทดสอบ
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              ข้อมูลทั้งหมดเก็บใน Local Storage ของเบราว์เซอร์นี้เท่านั้น
              คนอื่นจะไม่เห็นข้อมูลของคุณ
            </li>
            <li>ไม่เหมาะกับข้อมูลลับหรือข้อมูลลูกค้าจริง และจะหายหากล้างข้อมูลเบราว์เซอร์</li>
            <li>บทบาท Admin/Editor/Viewer เป็นการจำลอง ไม่ใช่ระบบยืนยันตัวตนที่ปลอดภัย</li>
          </ul>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive">
                <RotateCcw /> รีเซ็ตข้อมูลทดสอบ
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>รีเซ็ตข้อมูลทดสอบ?</AlertDialogTitle>
                <AlertDialogDescription>
                  FAQ หมวดหมู่ และการตั้งค่าทั้งหมดจะกลับเป็นข้อมูลตัวอย่างเริ่มต้น
                  การเปลี่ยนแปลงที่คุณทำจะหายไป
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    store.reset();
                    toast.success("รีเซ็ตข้อมูลแล้ว");
                  }}
                >
                  รีเซ็ต
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </div>
    </>
  );
}
