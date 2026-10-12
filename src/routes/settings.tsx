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
  UserCheck,
  UserX,
  UserPlus,
  Clock,
  Trash2,
  ShieldCheck,
  ShieldAlert,
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
import { can, type Role } from "@/lib/faq/types";

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
  const { user, isOwner, ownerEmail, gateEnabled, approvedUsers, pendingRequests, pendingCount } =
    useAuth();
  const [name, setName] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [preApproveEmail, setPreApproveEmail] = useState("");
  const [preApproveName, setPreApproveName] = useState("");
  const [preApproveRole, setPreApproveRole] = useState<Role>("viewer");
  const [preApproveNote, setPreApproveNote] = useState("");

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

        {/* Access Gate & User Approval Management */}
        <section className="surface space-y-6 p-5">
          <div className="border-b border-border pb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                <ShieldCheck className="size-5 text-emerald-500" />{" "}
                การจัดการสิทธิ์และการอนุมัติเข้าใช้งาน (User Access & Approvals)
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                ควบคุมไม่ให้คนที่ไม่ล็อกอินหรือไม่ได้รับอนุญาตเข้าถึงเว็บไซต์
                จนกว่าเจ้าของระบบจะอนุมัติ
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground">
                ระบบจำกัดสิทธิ์ (Gatekeeper):
              </span>
              <Switch
                checked={gateEnabled}
                onCheckedChange={(on) => {
                  authStore.setGateEnabled(on);
                  toast.success(
                    on
                      ? "เปิดระบบปิด: บังคับล็อกอินและอนุมัติสิทธิ์ก่อนเข้าใช้งาน"
                      : "ปิดระบบปิด: บุคคลทั่วไปสามารถเข้าชมได้",
                  );
                }}
              />
              <Badge
                className={
                  gateEnabled
                    ? "bg-emerald-500 text-white text-xs"
                    : "bg-muted text-muted-foreground text-xs"
                }
              >
                {gateEnabled ? "🔒 ล็อกระบบ (Active)" : "🔓 ปลดล็อก"}
              </Badge>
            </div>
          </div>

          {/* 1. Pending Access Requests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="size-4 text-amber-500" />
                คำขอรอการอนุมัติสิทธิ์ (Pending Requests)
                {pendingCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1 px-1.5 py-0.2 text-[11px] animate-pulse"
                  >
                    {pendingCount} รออนุมัติ
                  </Badge>
                )}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 text-muted-foreground"
                onClick={() => {
                  authStore.refreshStatus();
                  toast.info("รีเฟรชรายการคำขอล่าสุดแล้ว");
                }}
              >
                รีเฟรชรายการ
              </Button>
            </div>

            {pendingRequests.filter((r) => r.status === "pending").length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center text-xs text-muted-foreground">
                <CheckCircle2 className="size-6 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                ไม่มีคำขอรอการอนุมัติในขณะนี้ ทุกคนได้รับการตรวจสอบเรียบร้อยแล้ว
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingRequests
                  .filter((r) => r.status === "pending")
                  .map((req) => (
                    <div
                      key={req.id}
                      className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-foreground break-all">
                            {req.email}
                          </span>
                          {req.name && (
                            <span className="text-xs text-muted-foreground">({req.name})</span>
                          )}
                          <Badge
                            variant="outline"
                            className="text-[10px] border-amber-500/40 text-amber-600 bg-amber-500/10"
                          >
                            รออนุมัติ
                          </Badge>
                        </div>
                        {req.note && (
                          <p className="text-xs text-muted-foreground italic">
                            หมายเหตุคำขอ: "{req.note}"
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          ส่งคำขอเมื่อ: {new Date(req.requestedAt).toLocaleString("th-TH")}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          onClick={() => {
                            authStore.approveUser(req.email, "viewer", req.note);
                            toast.success(`อนุมัติ ${req.email} เป็นสิทธิ์ Viewer เรียบร้อยแล้ว`);
                          }}
                        >
                          <UserCheck className="size-3.5" />
                          อนุมัติ (Viewer)
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-amber-500/40 text-amber-600 hover:bg-amber-500/10 gap-1"
                          onClick={() => {
                            authStore.approveUser(req.email, "owner", req.note);
                            toast.success(`อนุมัติ ${req.email} เป็นสิทธิ์ Owner เรียบร้อยแล้ว`);
                          }}
                        >
                          <Crown className="size-3.5 text-amber-500" />
                          อนุมัติ (Owner)
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-destructive hover:bg-destructive/10 gap-1"
                          onClick={() => {
                            authStore.rejectUser(req.email);
                            toast.error(`ปฏิเสธคำขอของ ${req.email} แล้ว`);
                          }}
                        >
                          <UserX className="size-3.5" />
                          ปฏิเสธ
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* 2. Pre-approve / Whitelist Form */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
              <UserPlus className="size-4 text-primary" />
              เพิ่มรายชื่อผู้ได้รับอนุญาตล่วงหน้า (Pre-approve Email Whitelist)
            </h3>
            <p className="text-xs text-muted-foreground">
              ใส่อีเมลของทีมงาน CS เพื่ออนุญาตให้เข้าใช้งานได้ทันทีเมื่อพวกเขาสมัครหรือล็อกอิน
            </p>
            <div className="grid gap-3 sm:grid-cols-12">
              <div className="sm:col-span-5 space-y-1">
                <Label htmlFor="pre-email" className="text-xs">
                  อีเมลที่ต้องการอนุญาต
                </Label>
                <Input
                  id="pre-email"
                  type="email"
                  placeholder="cs.member@company.com"
                  value={preApproveEmail}
                  onChange={(e) => setPreApproveEmail(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="sm:col-span-3 space-y-1">
                <Label htmlFor="pre-name" className="text-xs">
                  ชื่อ / ตำแหน่ง (ไม่บังคับ)
                </Label>
                <Input
                  id="pre-name"
                  placeholder="เช่น CS กะบ่าย"
                  value={preApproveName}
                  onChange={(e) => setPreApproveName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">สิทธิ์ที่ให้</Label>
                <Select value={preApproveRole} onValueChange={(v) => setPreApproveRole(v as Role)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer (ก๊อปปี้)</SelectItem>
                    <SelectItem value="owner">Owner (แก้ไข)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 flex items-end">
                <Button
                  className="w-full h-9 text-xs gap-1"
                  onClick={() => {
                    if (!preApproveEmail.trim() || !preApproveEmail.includes("@")) {
                      toast.error("กรุณาระบุอีเมลที่ถูกต้อง");
                      return;
                    }
                    authStore.approveUser(
                      preApproveEmail.trim(),
                      preApproveRole,
                      preApproveName.trim() || "อนุมัติล่วงหน้า",
                    );
                    toast.success(`เพิ่ม ${preApproveEmail.trim()} ในรายชื่อผู้ได้รับอนุญาตแล้ว!`);
                    setPreApproveEmail("");
                    setPreApproveName("");
                    setPreApproveNote("");
                  }}
                >
                  <UserCheck className="size-3.5" />
                  เพิ่มสิทธิ์
                </Button>
              </div>
            </div>
          </div>

          {/* 3. Approved Users List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-500" />
                รายชื่อผู้ได้รับอนุญาตเข้าใช้งานในระบบ ({approvedUsers.length} คน)
              </h3>
            </div>

            <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
              {approvedUsers.map((u) => {
                const isCurrentOwner = u.role === "owner";
                return (
                  <div
                    key={u.email}
                    className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-foreground text-sm break-all">
                          {u.email}
                        </span>
                        <Badge
                          className={cn(
                            "text-[10px] px-1.5 py-0.2",
                            isCurrentOwner
                              ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30",
                          )}
                        >
                          {isCurrentOwner ? "👑 เจ้าของ (Owner)" : "👤 ผู้ใช้งาน (Viewer)"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground text-[11px]">
                        {u.name && <span>ชื่อ: {u.name}</span>}
                        {u.note && <span>บันทึก: {u.note}</span>}
                        <span>อนุมัติโดย: {u.approvedBy}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          const nextRole: Role = isCurrentOwner ? "viewer" : "owner";
                          authStore.approveUser(u.email, nextRole, u.note);
                          toast.success(
                            `เปลี่ยนสิทธิ์ ${u.email} เป็น ${nextRole === "owner" ? "Owner" : "Viewer"} แล้ว`,
                          );
                        }}
                      >
                        {isCurrentOwner ? "ปรับเป็น Viewer" : "ปรับเป็น Owner"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          authStore.removeApprovedUser(u.email);
                          toast.error(`เพิกถอนสิทธิ์ ${u.email} เรียบร้อยแล้ว`);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                        เพิกถอน
                      </Button>
                    </div>
                  </div>
                );
              })}
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
