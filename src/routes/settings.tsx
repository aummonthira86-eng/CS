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
  KeyRound,
  CheckCircle2,
  Copy,
  PlusCircle,
  Clock,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Check,
  Ban,
  Sliders,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  useAuth,
  authStore,
  type AccessKeyItem,
  type FeaturePermissions,
  VIEWER_PERMISSIONS,
  EDITOR_PERMISSIONS,
  OWNER_PERMISSIONS,
} from "@/lib/auth/auth-store";
import { store, useData, useRole } from "@/lib/faq/store";
import { can, type Role } from "@/lib/faq/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "ตั้งค่าระบบ — CS FAQ Management" },
      { name: "description", content: "จัดการความปลอดภัย Master Key, Access Keys และตั้งค่าระบบ" },
      { property: "og:title", content: "ตั้งค่าระบบ — CS FAQ Management" },
      {
        property: "og:description",
        content: "จัดการความปลอดภัย Master Key, Access Keys และตั้งค่าระบบ",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings } = useData();
  const role = useRole();
  const { isOwner, accessKeys, session } = useAuth();
  const [name, setName] = useState("");

  // Master Key Change State
  const [currentMasterKey, setCurrentMasterKey] = useState("");
  const [newMasterKey, setNewMasterKey] = useState("");
  const [confirmMasterKey, setConfirmMasterKey] = useState("");
  const [showCurrentMaster, setShowCurrentMaster] = useState(false);
  const [showNewMaster, setShowNewMaster] = useState(false);
  const [isChangingMaster, setIsChangingMaster] = useState(false);

  // Create Key Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [customKeyCode, setCustomKeyCode] = useState("");
  const [newKeyRole, setNewKeyRole] = useState<Role>("viewer");
  const [newKeyNotes, setNewKeyNotes] = useState("");
  const [newKeyPerms, setNewKeyPerms] = useState<FeaturePermissions>({ ...VIEWER_PERMISSIONS });

  // Edit Permissions Modal State
  const [editPermsModalOpen, setEditPermsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<AccessKeyItem | null>(null);
  const [editingPerms, setEditingPerms] = useState<FeaturePermissions>({ ...VIEWER_PERMISSIONS });

  // Copied Key Feedback
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  useEffect(() => {
    setName(settings.site_name ?? "");
  }, [settings.site_name]);

  // When changing role in Create Modal, update default permissions
  const handleRoleChangeForNewKey = (r: Role) => {
    setNewKeyRole(r);
    if (r === "admin" || r === "owner") {
      setNewKeyPerms({ ...OWNER_PERMISSIONS });
    } else if (r === "editor") {
      setNewKeyPerms({ ...EDITOR_PERMISSIONS });
    } else {
      setNewKeyPerms({ ...VIEWER_PERMISSIONS });
    }
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    toast.success(`คัดลอกรหัส ${key} แล้ว`);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  // Change Master Key Handler
  const handleChangeMasterKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMasterKey.trim()) {
      toast.error("กรุณาระบุ Master Key ปัจจุบัน");
      return;
    }
    if (!newMasterKey.trim()) {
      toast.error("กรุณาระบุ Master Key ใหม่");
      return;
    }
    if (newMasterKey !== confirmMasterKey) {
      toast.error("รหัสผ่านใหม่และการยืนยันไม่ตรงกัน");
      return;
    }
    if (newMasterKey.length < 8) {
      toast.error("Master Key ใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
      return;
    }

    setIsChangingMaster(true);
    const res = await authStore.changeMasterKey(currentMasterKey, newMasterKey, confirmMasterKey);
    setIsChangingMaster(false);

    if (res.ok) {
      toast.success(
        "เปลี่ยน Master Key เรียบร้อยแล้ว! ระบบได้ออกจากระบบเพื่อความปลอดภัย กรุณาเข้าสู่ระบบใหม่ด้วยรหัสใหม่",
      );
      setCurrentMasterKey("");
      setNewMasterKey("");
      setConfirmMasterKey("");
    } else {
      toast.error(res.error || "ไม่สามารถเปลี่ยน Master Key ได้");
    }
  };

  // Create Key Submit Handler
  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      toast.error("กรุณาระบุชื่อผู้ถือรหัสหรือทีมงาน");
      return;
    }

    const res = authStore.createAccessKey({
      key: customKeyCode.trim() || undefined,
      name: newKeyName.trim(),
      role: newKeyRole,
      permissions: newKeyPerms,
      notes: newKeyNotes.trim() || undefined,
    });

    if (res.ok && res.key) {
      toast.success(`สร้างรหัสผ่าน ${res.key.key} สำเร็จ!`);
      setCreateModalOpen(false);
      setNewKeyName("");
      setCustomKeyCode("");
      setNewKeyNotes("");
      setNewKeyPerms({ ...VIEWER_PERMISSIONS });
    } else {
      toast.error(res.error || "ไม่สามารถสร้างรหัสผ่านได้");
    }
  };

  // Save Permissions Changes
  const handleSavePerms = () => {
    if (!editingKey) return;
    authStore.updateAccessKey(editingKey.id, {
      permissions: editingPerms,
    });
    toast.success(`อัปเดตสิทธิ์ของ ${editingKey.name} เรียบร้อยแล้ว`);
    setEditPermsModalOpen(false);
    setEditingKey(null);
  };

  if (!isOwner) {
    return (
      <>
        <PageHeader title="ตั้งค่าระบบ" />
        <EmptyState icon={Lock} title="พื้นที่เฉพาะ เจ้าของระบบ (Master Owner) เท่านั้น">
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            คุณเข้าใช้งานด้วยสิทธิ์ <strong>{session?.name || "ผู้ใช้งาน"}</strong>{" "}
            ซึ่งไม่มีสิทธิ์เข้าถึงส่วนตั้งค่าความปลอดภัยและจัดการระบบ หากคุณคือเจ้าของระบบ
            กรุณาเข้าสู่ระบบด้วย Master Owner Key
          </p>
          <div className="mt-4 flex justify-center">
            <AuthDialog />
          </div>
        </EmptyState>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="จัดการระบบและความปลอดภัย"
        description="ควบคุม Master Key, จัดการ Passcodes ของทีมงาน และกำหนดฟังก์ชันที่แต่ละรหัสสามารถใช้งานได้"
      />

      <div className="space-y-6">
        {/* SECTION 1: MASTER KEY SECURITY MANAGEMENT */}
        <section className="surface space-y-5 p-5 border-amber-500/30">
          <div className="border-b border-border pb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                <Crown className="size-5 text-amber-500" /> การจัดการ Master Key (Security Settings)
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Master Key คือรหัสผ่านสูงสุดสำหรับเข้าถึงแดชบอร์ดจัดการระบบนี้ คุณสามารถเปลี่ยน
                Master Key ได้ที่นี่
              </p>
            </div>
            <Badge className="bg-amber-500 text-white text-xs gap-1">
              <ShieldCheck className="size-3.5" /> บันทึกแบบเข้ารหัส SHA-256
            </Badge>
          </div>

          <form onSubmit={handleChangeMasterKey} className="space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <Label htmlFor="cur-master" className="text-xs font-medium">
                Master Key ปัจจุบัน (Current Master Key)
              </Label>
              <div className="relative">
                <Input
                  id="cur-master"
                  type={showCurrentMaster ? "text" : "password"}
                  placeholder="กรอก Master Key ปัจจุบันเพื่อยืนยันตัวตน"
                  value={currentMasterKey}
                  onChange={(e) => setCurrentMasterKey(e.target.value)}
                  className="pr-10 text-sm font-mono"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowCurrentMaster(!showCurrentMaster)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentMaster ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-master" className="text-xs font-medium">
                  Master Key ใหม่ (New Master Key)
                </Label>
                <div className="relative">
                  <Input
                    id="new-master"
                    type={showNewMaster ? "text" : "password"}
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    value={newMasterKey}
                    onChange={(e) => setNewMasterKey(e.target.value)}
                    className="pr-10 text-sm font-mono"
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNewMaster(!showNewMaster)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewMaster ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="conf-master" className="text-xs font-medium">
                  ยืนยัน Master Key ใหม่ (Confirm)
                </Label>
                <Input
                  id="conf-master"
                  type={showNewMaster ? "text" : "password"}
                  placeholder="กรอก Master Key ใหม่อีกครั้ง"
                  value={confirmMasterKey}
                  onChange={(e) => setConfirmMasterKey(e.target.value)}
                  className="text-sm font-mono"
                  required
                />
              </div>
            </div>

            <div className="rounded-xl border border-border/80 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">เงื่อนไขความปลอดภัย:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>ความยาวอย่างน้อย 8 ตัวอักษร และมีทั้งตัวอักษรและตัวเลข/สัญลักษณ์</li>
                <li>เมื่อเปลี่ยนรหัสสำเร็จ เซสชันเดิมทั้งหมดจะถูกยกเลิกทันที และต้องล็อกอินใหม่</li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={isChangingMaster || !currentMasterKey || !newMasterKey}
              className="gap-2 text-xs"
            >
              <KeyRound className="size-4" />
              {isChangingMaster ? "กำลังตรวจสอบและบันทึก..." : "เปลี่ยน Master Key"}
            </Button>
          </form>
        </section>

        {/* SECTION 2: ACCESS PASSCODES & FEATURE MANAGEMENT */}
        <section className="surface space-y-5 p-5">
          <div className="border-b border-border pb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                <Shield className="size-5 text-primary" /> จัดการ Passcode & สิทธิ์การใช้งาน (Access
                Keys)
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                สร้างรหัสผ่านให้ทีมงาน CS และควบคุมฟังก์ชันที่แต่ละรหัสสามารถทำได้ในระบบ
              </p>
            </div>
            <Button
              onClick={() => setCreateModalOpen(true)}
              size="sm"
              className="gap-1.5 text-xs shadow-sm"
            >
              <PlusCircle className="size-4" /> สร้างรหัสผ่านใหม่ (Add Passcode)
            </Button>
          </div>

          {/* Keys Table / List */}
          <div className="space-y-3">
            {accessKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                ยังไม่มีการสร้าง Passcode ให้ทีมงาน
              </div>
            ) : (
              <div className="grid gap-3">
                {accessKeys.map((item) => {
                  const isBlocked = item.status === "blocked";
                  const isRevoked = item.status === "revoked";

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-xl border p-4 transition-colors space-y-3",
                        isBlocked
                          ? "border-destructive/30 bg-destructive/5"
                          : "border-border bg-card hover:border-primary/40",
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-sm">
                              {item.name}
                            </span>
                            <Badge
                              className={cn(
                                "text-[10px] px-2 py-0.5",
                                item.role === "admin"
                                  ? "bg-amber-500 text-white"
                                  : item.role === "editor"
                                    ? "bg-sky-500 text-white"
                                    : "bg-muted text-muted-foreground",
                              )}
                            >
                              {item.role === "admin"
                                ? "👑 ผู้ดูแล (Admin)"
                                : item.role === "editor"
                                  ? "✏️ ผู้แก้ไข (Editor)"
                                  : "👤 ผู้ใช้งาน (Viewer)"}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px]",
                                isBlocked
                                  ? "border-destructive text-destructive"
                                  : "border-emerald-500 text-emerald-600 dark:text-emerald-400",
                              )}
                            >
                              {isBlocked ? "⛔ ระงับชั่วคราว" : "✓ ใช้งานได้ (Active)"}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Passcode:</span>
                            <code className="font-mono text-sm font-bold bg-muted px-2 py-0.5 rounded text-foreground">
                              {item.key}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => handleCopyKey(item.key, item.id)}
                            >
                              {copiedKeyId === item.id ? (
                                <Check className="size-3 text-emerald-500" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </Button>
                          </div>

                          {item.notes && (
                            <p className="text-xs text-muted-foreground italic">
                              หมายเหตุ: {item.notes}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => {
                              setEditingKey(item);
                              setEditingPerms({ ...item.permissions });
                              setEditPermsModalOpen(true);
                            }}
                          >
                            <Sliders className="size-3.5" />
                            ปรับสิทธิ์ฟังก์ชัน
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-8 text-xs gap-1",
                              isBlocked
                                ? "border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                                : "border-destructive/40 text-destructive hover:bg-destructive/10",
                            )}
                            onClick={() => {
                              authStore.toggleKeyStatus(item.id);
                              toast.info(
                                isBlocked
                                  ? `เปิดใช้งาน ${item.name} เรียบร้อยแล้ว`
                                  : `ระงับการใช้งาน ${item.name} แล้ว`,
                              );
                            }}
                          >
                            {isBlocked ? (
                              <>
                                <CheckCircle2 className="size-3.5" /> ปลดบล็อก
                              </>
                            ) : (
                              <>
                                <Ban className="size-3.5" /> ระงับสิทธิ์
                              </>
                            )}
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>เพิกถอน Passcode นี้ถาวร?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  รหัส “{item.key}” ({item.name}) จะถูกลบออกจากระบบ
                                  และไม่สามารถนำมาใช้เข้าสู่ระบบได้อีก
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => {
                                    authStore.revokeAccessKey(item.id);
                                    toast.success(`ลบรหัส ${item.key} เรียบร้อยแล้ว`);
                                  }}
                                >
                                  ลบรหัสผ่าน
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {/* Active feature pills */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                        <span className="text-muted-foreground mr-1">ฟังก์ชันที่เปิดใช้งาน:</span>
                        {item.permissions.canSearch && (
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                            ค้นหาคำตอบ
                          </span>
                        )}
                        {item.permissions.canCopy && (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-medium">
                            คัดลอกข้อความ
                          </span>
                        )}
                        {item.permissions.canEditFaq && (
                          <span className="bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded font-medium">
                            เพิ่ม/แก้ไข FAQ
                          </span>
                        )}
                        {item.permissions.canDeleteFaq && (
                          <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-medium">
                            ลบ FAQ
                          </span>
                        )}
                        {item.permissions.canManageCategories && (
                          <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded font-medium">
                            หมวดหมู่
                          </span>
                        )}
                        {item.permissions.canManageGallery && (
                          <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-medium">
                            คลังรูปภาพ
                          </span>
                        )}
                        {item.permissions.canImportExport && (
                          <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-medium">
                            นำเข้า/ส่งออก
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 3: GENERAL SETTINGS */}
        <section className="surface space-y-5 p-5">
          <div className="border-b border-border pb-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              การตั้งค่าทั่วไป (General Settings)
            </h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sn">ชื่อระบบคลังคำถามคำตอบ</Label>
            <div className="flex gap-2 max-w-md">
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
          <div className="grid gap-5 sm:grid-cols-2 max-w-md">
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

        {/* SECTION 4: THEME CUSTOMIZATION */}
        <section className="surface space-y-4 p-5">
          <div className="border-b border-border pb-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Palette className="size-5 text-primary" /> ปรับแต่งธีมและรูปแบบอักษร
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              เลือกโทนสีของระบบ โหมดมืด/สว่าง และฟอนต์ภาษาไทยสำหรับหน้าเว็บ
            </p>
          </div>
          <ThemeCustomizerPanel />
        </section>

        {/* SECTION 5: RESET DATA */}
        <section className="surface space-y-3 p-5">
          <h2 className="flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle className="size-5" /> รีเซ็ตข้อมูลทดสอบ (Reset Store)
          </h2>
          <p className="text-xs text-muted-foreground">
            หากต้องการรีเซ็ต FAQ หมวดหมู่ และรูปภาพกลับเป็นค่าเริ่มต้น สามารถกดรีเซ็ตได้ที่นี่
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive text-xs">
                <RotateCcw className="size-3.5 mr-1" /> รีเซ็ตข้อมูลทดสอบทั้งหมด
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ยืนยันการรีเซ็ตข้อมูล?</AlertDialogTitle>
                <AlertDialogDescription>
                  ข้อมูล FAQ และหมวดหมู่ที่เพิ่มเข้ามาใหม่จะถูกลบ และคืนค่าเป็นข้อมูลชุดตั้งต้น
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    store.reset();
                    toast.success("รีเซ็ตข้อมูลเรียบร้อยแล้ว");
                  }}
                >
                  รีเซ็ตข้อมูล
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </div>

      {/* MODAL 1: CREATE ACCESS PASSCODE */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <PlusCircle className="size-5 text-primary" /> สร้างรหัสผ่านเข้าใช้งานใหม่ (Add
              Passcode)
            </DialogTitle>
            <DialogDescription>
              กำหนดชื่อผู้ถือรหัส บทบาท และเลือกฟังก์ชันที่อนุญาตให้ใช้งานได้
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateKey} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="key-name" className="text-xs font-semibold">
                ชื่อผู้ถือรหัสหรือทีมงาน *
              </Label>
              <Input
                id="key-name"
                placeholder="เช่น เจ้าหน้าที่ CS กะดึก (กานต์)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="key-code" className="text-xs font-semibold">
                  รหัสผ่าน (Passcode)
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  (เว้นว่างไว้เพื่อให้ระบบสุ่มให้อัตโนมัติ)
                </span>
              </div>
              <Input
                id="key-code"
                placeholder="เช่น CS-SUPPORT-99 หรือเว้นว่าง"
                value={customKeyCode}
                onChange={(e) => setCustomKeyCode(e.target.value)}
                className="font-mono text-xs uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">บทบาทหลัก (Role)</Label>
              <Select
                value={newKeyRole}
                onValueChange={(v) => handleRoleChangeForNewKey(v as Role)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">👤 ผู้ใช้งาน (Viewer - ก๊อปปี้คำตอบ)</SelectItem>
                  <SelectItem value="editor">✏️ ผู้แก้ไข (Editor - เพิ่ม/แก้ FAQ)</SelectItem>
                  <SelectItem value="admin">👑 ผู้ดูแล (Admin - สิทธิ์เทียบเท่าเจ้าของ)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Individual Feature Toggles */}
            <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
              <Label className="text-xs font-semibold text-foreground block mb-2">
                กำหนดสิทธิ์ฟังก์ชันรายบุคคล (Feature Flags):
              </Label>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>ค้นหาและดูคำตอบ (Search)</span>
                  <Switch
                    checked={newKeyPerms.canSearch}
                    onCheckedChange={(c) => setNewKeyPerms({ ...newKeyPerms, canSearch: c })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>คัดลอกคำตอบไปใช้ (Copy Answers)</span>
                  <Switch
                    checked={newKeyPerms.canCopy}
                    onCheckedChange={(c) => setNewKeyPerms({ ...newKeyPerms, canCopy: c })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>เพิ่มและแก้ไข FAQ (Create/Edit FAQ)</span>
                  <Switch
                    checked={newKeyPerms.canEditFaq}
                    onCheckedChange={(c) => setNewKeyPerms({ ...newKeyPerms, canEditFaq: c })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>ลบ FAQ (Delete FAQ)</span>
                  <Switch
                    checked={newKeyPerms.canDeleteFaq}
                    onCheckedChange={(c) => setNewKeyPerms({ ...newKeyPerms, canDeleteFaq: c })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>จัดการหมวดหมู่ (Categories)</span>
                  <Switch
                    checked={newKeyPerms.canManageCategories}
                    onCheckedChange={(c) =>
                      setNewKeyPerms({ ...newKeyPerms, canManageCategories: c })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>จัดการคลังรูปภาพ (Gallery)</span>
                  <Switch
                    checked={newKeyPerms.canManageGallery}
                    onCheckedChange={(c) => setNewKeyPerms({ ...newKeyPerms, canManageGallery: c })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>นำเข้า/ส่งออก Excel (Import/Export)</span>
                  <Switch
                    checked={newKeyPerms.canImportExport}
                    onCheckedChange={(c) => setNewKeyPerms({ ...newKeyPerms, canImportExport: c })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="key-notes" className="text-xs">
                บันทึกช่วยจำ (Notes)
              </Label>
              <Input
                id="key-notes"
                placeholder="เช่น ประจำทีม A กะดึก"
                value={newKeyNotes}
                onChange={(e) => setNewKeyNotes(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit">สร้างรหัสผ่าน</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: EDIT PERMISSIONS MODAL */}
      <Dialog open={editPermsModalOpen} onOpenChange={setEditPermsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sliders className="size-5 text-primary" /> ปรับสิทธิ์ฟังก์ชัน: {editingKey?.name}
            </DialogTitle>
            <DialogDescription>
              เปิดหรือปิดฟังก์ชันเฉพาะสำหรับรหัส <code>{editingKey?.key}</code>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b">
              <div>
                <p className="font-semibold text-foreground">ค้นหาและดูคำตอบ</p>
                <p className="text-[11px] text-muted-foreground">เข้าถึงและค้นหาข้อมูลในคลัง FAQ</p>
              </div>
              <Switch
                checked={editingPerms.canSearch}
                onCheckedChange={(c) => setEditingPerms({ ...editingPerms, canSearch: c })}
              />
            </div>

            <div className="flex items-center justify-between py-1 border-b">
              <div>
                <p className="font-semibold text-foreground">คัดลอกคำตอบ (Copy)</p>
                <p className="text-[11px] text-muted-foreground">
                  กดปุ่มคัดลอกคำตอบเพื่อนำไปตอบลูกค้า
                </p>
              </div>
              <Switch
                checked={editingPerms.canCopy}
                onCheckedChange={(c) => setEditingPerms({ ...editingPerms, canCopy: c })}
              />
            </div>

            <div className="flex items-center justify-between py-1 border-b">
              <div>
                <p className="font-semibold text-foreground">เพิ่มและแก้ไข FAQ</p>
                <p className="text-[11px] text-muted-foreground">
                  สร้าง FAQ ใหม่ และแก้ไขคำถาม/คำตอบเดิม
                </p>
              </div>
              <Switch
                checked={editingPerms.canEditFaq}
                onCheckedChange={(c) => setEditingPerms({ ...editingPerms, canEditFaq: c })}
              />
            </div>

            <div className="flex items-center justify-between py-1 border-b">
              <div>
                <p className="font-semibold text-foreground">ลบ FAQ (Delete)</p>
                <p className="text-[11px] text-muted-foreground">สิทธิ์ในการลบ FAQ ออกจากระบบ</p>
              </div>
              <Switch
                checked={editingPerms.canDeleteFaq}
                onCheckedChange={(c) => setEditingPerms({ ...editingPerms, canDeleteFaq: c })}
              />
            </div>

            <div className="flex items-center justify-between py-1 border-b">
              <div>
                <p className="font-semibold text-foreground">จัดการหมวดหมู่ (Categories)</p>
                <p className="text-[11px] text-muted-foreground">
                  เพิ่ม แก้ไข และเรียงลำดับหมวดหมู่
                </p>
              </div>
              <Switch
                checked={editingPerms.canManageCategories}
                onCheckedChange={(c) =>
                  setEditingPerms({ ...editingPerms, canManageCategories: c })
                }
              />
            </div>

            <div className="flex items-center justify-between py-1 border-b">
              <div>
                <p className="font-semibold text-foreground">คลังรูปภาพ (Gallery)</p>
                <p className="text-[11px] text-muted-foreground">
                  อัปโหลด ลบ และจัดการรูปภาพในคลัง
                </p>
              </div>
              <Switch
                checked={editingPerms.canManageGallery}
                onCheckedChange={(c) => setEditingPerms({ ...editingPerms, canManageGallery: c })}
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="font-semibold text-foreground">นำเข้า/ส่งออกข้อมูล (Import/Export)</p>
                <p className="text-[11px] text-muted-foreground">นำเข้าหรือส่งออกไฟล์ Excel/CSV</p>
              </div>
              <Switch
                checked={editingPerms.canImportExport}
                onCheckedChange={(c) => setEditingPerms({ ...editingPerms, canImportExport: c })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPermsModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSavePerms}>บันทึกสิทธิ์</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
