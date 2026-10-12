import { useState, type ReactNode } from "react";
import {
  Lock,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus,
  Mail,
  KeyRound,
  Sparkles,
  Crown,
  User,
  LogOut,
  RefreshCw,
  Send,
  BookOpenCheck,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, authStore } from "@/lib/auth/auth-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AccessGate({ children }: { children: ReactNode }) {
  const { user, isApproved, accessStatus, loading, initialized, gateEnabled } = useAuth();

  // If gate is disabled, allow all
  if (!gateEnabled) {
    return <>{children}</>;
  }

  // Initial loading state
  if (!initialized && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary animate-pulse">
            <BookOpenCheck className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">
            กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...
          </p>
        </div>
      </div>
    );
  }

  // Not signed in at all: Must log in first
  if (!user) {
    return <UnauthenticatedGate />;
  }

  // Signed in, but NOT approved
  if (!isApproved) {
    return <PendingApprovalGate status={accessStatus} />;
  }

  // Signed in and approved!
  return <>{children}</>;
}

/**
 * Screen 1: Unauthenticated user (คนที่ไม่ล็อกอิน)
 * Strictly blocks all access until signed in.
 */
function UnauthenticatedGate() {
  const [activeTab, setActiveTab] = useState<"signin" | "signup" | "otp">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    setIsSubmitting(true);
    const res = await authStore.signInWithEmail(email, password);
    setIsSubmitting(false);

    if (res.ok) {
      if (res.isApproved) {
        toast.success("เข้าสู่ระบบเรียบร้อยแล้ว ยินดีต้อนรับ!");
      } else {
        toast.info("เข้าสู่ระบบสำเร็จ กรุณารอผู้ดูแลระบบอนุมัติสิทธิ์เข้าใช้งาน");
      }
    } else {
      toast.error(res.error || "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลหรือรหัสผ่าน");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    if (password.length < 6) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("รหัสผ่านยืนยันไม่ตรงกัน");
      return;
    }

    setIsSubmitting(true);
    const res = await authStore.signUpWithEmail(email, password, name);
    setIsSubmitting(false);

    if (res.ok) {
      toast.success(res.message || "ลงทะเบียนสำเร็จ!");
    } else {
      toast.error(res.error || "ไม่สามารถลงทะเบียนได้");
    }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail.trim()) {
      toast.error("กรุณาระบุอีเมล");
      return;
    }
    setIsSubmitting(true);
    const res = await authStore.signInWithOtp(otpEmail);
    setIsSubmitting(false);

    if (res.ok) {
      toast.success("ส่ง Magic Link ไปยังอีเมลเรียบร้อยแล้ว");
    } else {
      toast.error(res.error || "ไม่สามารถส่ง Magic Link ได้");
    }
  };

  const handleQuickLogin = (type: "owner" | "viewer" | "unapproved") => {
    authStore.loginAs(type);
    if (type === "owner") {
      toast.success("เข้าสู่ระบบในฐานะ: เจ้าของระบบ (Owner) — อนุมัติสิทธิ์เต็ม");
    } else if (type === "viewer") {
      toast.success("เข้าสู่ระบบในฐานะ: เจ้าหน้าที่ CS (Viewer) — ได้รับอนุญาตแล้ว");
    } else {
      toast.info("จำลองเข้าสู่ระบบ: บัญชีใหม่ (รออนุมัติสิทธิ์) — ไม่สามารถเข้าเว็บได้");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand & Security Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 ring-4 ring-primary/10">
            <Lock className="size-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
            คลังคำถามคำตอบ CS Support
          </h1>
          <p className="text-sm text-muted-foreground">
            พื้นที่ปิดเฉพาะเจ้าหน้าที่และผู้ที่ได้รับอนุญาตเท่านั้น
          </p>
          <div className="pt-1 flex items-center justify-center gap-1.5">
            <Badge
              variant="outline"
              className="text-xs gap-1 border-primary/30 text-primary bg-primary/5"
            >
              <ShieldCheck className="size-3.5" /> ระบบปิด: บังคับยืนยันตัวตนและอนุมัติสิทธิ์
            </Badge>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "signin" | "signup" | "otp")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="signin" className="text-xs sm:text-sm">
                เข้าสู่ระบบ
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-xs sm:text-sm">
                ลงทะเบียน
              </TabsTrigger>
              <TabsTrigger value="otp" className="text-xs sm:text-sm">
                Magic Link
              </TabsTrigger>
            </TabsList>

            {/* Tab: Sign In */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gate-email">อีเมล (Email)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="gate-email"
                      type="email"
                      placeholder="your.email@company.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gate-pwd">รหัสผ่าน (Password)</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="gate-pwd"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                  <LogIn className="size-4" />
                  {isSubmitting ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบเพื่อใช้งาน"}
                </Button>
              </form>
            </TabsContent>

            {/* Tab: Sign Up */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="gate-reg-name">ชื่อ - นามสกุล หรือชื่อเรียกในทีม CS</Label>
                  <Input
                    id="gate-reg-name"
                    placeholder="เช่น แอดมินมิว (CS กะเช้า)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gate-reg-email">อีเมลสำหรับขอสิทธิ์</Label>
                  <Input
                    id="gate-reg-email"
                    type="email"
                    placeholder="cs.agent@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gate-reg-pwd">ตั้งรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)</Label>
                  <Input
                    id="gate-reg-pwd"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gate-reg-confirm">ยืนยันรหัสผ่าน</Label>
                  <Input
                    id="gate-reg-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                  <UserPlus className="size-4" />
                  {isSubmitting ? "กำลังส่งคำขอ..." : "ลงทะเบียนและส่งคำขออนุมัติ"}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  * เมื่อลงทะเบียนเสร็จ ระบบจะส่งคำขอไปยังเจ้าของระบบเพื่ออนุมัติสิทธิ์เข้าใช้งาน
                </p>
              </form>
            </TabsContent>

            {/* Tab: Magic Link OTP */}
            <TabsContent value="otp">
              <form onSubmit={handleOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gate-otp-email">อีเมลของคุณ</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="gate-otp-email"
                      type="email"
                      placeholder="agent@company.com"
                      className="pl-9"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ระบบจะส่งลิงก์เข้าสู่ระบบไปยังกล่องจดหมายของคุณโดยไม่ต้องใช้รหัสผ่าน
                  </p>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                  <Send className="size-4" />
                  {isSubmitting ? "กำลังส่ง..." : "ส่งลิงก์เข้าสู่ระบบทางอีเมล"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Quick Demo Access Bar */}
          <div className="border-t border-border pt-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>ปุ่มทดสอบระบบจำลอง (Quick Test Mode):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                onClick={() => handleQuickLogin("owner")}
              >
                <Crown className="size-3.5 mr-1 text-amber-500" />
                เจ้าของ (Owner)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                onClick={() => handleQuickLogin("viewer")}
              >
                <User className="size-3.5 mr-1 text-emerald-500" />
                จนท. อนุมัติแล้ว
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                onClick={() => handleQuickLogin("unapproved")}
              >
                <Clock className="size-3.5 mr-1 text-rose-500" />
                ผู้ใช้รออนุมัติ
              </Button>
            </div>
          </div>
        </div>

        {/* Security Footer Notice */}
        <p className="text-xs text-center text-muted-foreground leading-relaxed">
          ความปลอดภัยระดับองค์กร: การเข้าถึงข้อมูลคำถามคำตอบทั้งหมดถูกจำกัดสิทธิ์
          <br />
          ติดต่อผู้ดูแลระบบหากต้องการสิทธิ์เข้าใช้งานด่วน
        </p>
      </div>
    </div>
  );
}

/**
 * Screen 2: Authenticated user who is PENDING or REJECTED (ล็อกอินแล้ว แต่ยังไม่ได้รับอนุญาต)
 * Blocks user from entering until an Owner approves them.
 */
function PendingApprovalGate({ status }: { status: "pending" | "rejected" | string }) {
  const { user, pendingRequests } = useAuth();
  const userEmail = user?.email || "ผู้ใช้งาน";
  const [note, setNote] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const existingRequest = pendingRequests.find(
    (r) => r.email.toLowerCase() === userEmail.toLowerCase(),
  );

  const handleUpdateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      toast.error("กรุณากรอกข้อความขอสิทธิ์");
      return;
    }
    authStore.requestAccess(userEmail, note.trim(), user?.user_metadata?.full_name);
    setIsSaved(true);
    toast.success("บันทึกและส่งข้อมูลคำขอเพิ่มเติมเรียบร้อยแล้ว");
  };

  const handleRefresh = () => {
    authStore.refreshStatus();
    toast.info("ตรวจสอบสถานะการอนุมัติล่าสุดเรียบร้อย");
  };

  const handleSignOut = async () => {
    await authStore.signOut();
    toast.success("ออกจากระบบเรียบร้อยแล้ว");
  };

  const isRejected = status === "rejected";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-amber-500/5 to-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Status Header */}
        <div className="text-center space-y-2">
          <div
            className={cn(
              "inline-flex size-16 items-center justify-center rounded-2xl ring-4 shadow-xl",
              isRejected
                ? "bg-rose-500/10 text-rose-500 ring-rose-500/20"
                : "bg-amber-500/10 text-amber-500 ring-amber-500/20 animate-pulse",
            )}
          >
            {isRejected ? <ShieldAlert className="size-8" /> : <Clock className="size-8" />}
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            {isRejected ? "คำขอถูกปฏิเสธ (Access Denied)" : "รอการอนุมัติสิทธิ์เข้าใช้งาน"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRejected
              ? "ผู้ดูแลระบบได้ปฏิเสธการเข้าถึงสำหรับบัญชีนี้"
              : "บัญชีของคุณยังไม่ได้รับอนุญาตให้เข้าถึงเนื้อหาคลังคำตอบ"}
          </p>
        </div>

        {/* Info Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5">
          {/* User Account Info */}
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                บัญชีที่เข้าสู่ระบบ:
              </span>
              <Badge
                className={cn(
                  "text-xs font-semibold",
                  isRejected ? "bg-rose-500 text-white" : "bg-amber-500 text-white",
                )}
              >
                {isRejected ? "⛔ ไม่ได้รับอนุญาต" : "⏳ รออนุมัติ (Pending)"}
              </Badge>
            </div>
            <p className="font-mono text-sm font-semibold text-foreground break-all">{userEmail}</p>
            {existingRequest?.requestedAt && (
              <p className="text-[11px] text-muted-foreground">
                ส่งคำขอเมื่อ: {new Date(existingRequest.requestedAt).toLocaleString("th-TH")}
              </p>
            )}
          </div>

          {/* Explanation Message */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-muted-foreground space-y-2 leading-relaxed">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <AlertCircle className="size-4 text-amber-500" />
              เหตุผลที่ยังไม่สามารถเข้าใช้งานได้:
            </p>
            <p>
              ระบบนี้มีมาตรการรักษาความปลอดภัยข้อมูลคำตอบของลูกค้า
              ผู้ใช้งานทุกคนต้องผ่านการอนุมัติสิทธิ์จาก <strong>เจ้าของระบบ (Owner)</strong>{" "}
              หรือผู้ดูแลระบบก่อนเท่านั้น
            </p>
            <p>
              คำขอของคุณได้ถูกบันทึกลงในระบบเรียบร้อยแล้ว เมื่อเจ้าของระบบกดอนุมัติ
              คุณจะสามารถเข้าค้นหาและคัดลอกคำตอบได้ทันที
            </p>
          </div>

          {/* Optional Note Form */}
          {!isRejected && (
            <form onSubmit={handleUpdateNote} className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="gate-note" className="text-xs font-medium">
                  แจ้งข้อมูลเพิ่มเติมให้ผู้ดูแลระบบ (เช่น ตำแหน่ง / กะทำงาน / เหตุผลขอสิทธิ์):
                </Label>
                <Input
                  id="gate-note"
                  placeholder="เช่น เจ้าหน้าที่ CS เกม Ragnarok กะดึก ทีม A"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                className="w-full gap-1.5 text-xs"
              >
                <Send className="size-3.5" />
                {isSaved ? "ส่งข้อมูลแล้ว ✓" : "ส่งข้อมูลระบุตัวตนเพิ่มเติม"}
              </Button>
            </form>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button onClick={handleRefresh} className="flex-1 gap-2">
              <RefreshCw className="size-4" />
              ตรวจสอบสถานะอีกครั้ง
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="size-4" />
              ออกจากระบบ
            </Button>
          </div>

          {/* Owner Quick Test Note */}
          <div className="border-t border-border pt-4 text-center">
            <p className="text-[11px] text-muted-foreground">
              หากคุณคือเจ้าของระบบ กรุณาออกจากระบบแล้วล็อกอินด้วยอีเมลเจ้าของ (เช่น{" "}
              <code>peepoo3682@gmail.com</code>)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
