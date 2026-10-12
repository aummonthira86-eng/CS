import { useState } from "react";
import {
  LogIn,
  LogOut,
  User,
  Crown,
  KeyRound,
  Mail,
  Shield,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, authStore } from "@/lib/auth/auth-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AuthDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { user, role, isOwner, ownerEmail, loading } = useAuth();
  const [open, setOpen] = useState(false);

  // Forms
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [activeTab, setActiveTab] = useState("signin");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    const res = await authStore.signInWithEmail(email, password);
    if (res.ok) {
      toast.success("เข้าสู่ระบบเรียบร้อยแล้ว!");
      setOpen(false);
      setEmail("");
      setPassword("");
    } else {
      toast.error(res.error || "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูล");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    if (password.length < 6) {
      toast.error("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      toast.error("รหัสผ่านยืนยันไม่ตรงกัน");
      return;
    }

    const res = await authStore.signUpWithEmail(email, password);
    if (res.ok) {
      toast.success(res.message || "ลงทะเบียนสำเร็จและเข้าสู่ระบบเรียบร้อย!");
      setOpen(false);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } else {
      toast.error(res.error || "ไม่สามารถลงทะเบียนได้");
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail.trim()) {
      toast.error("กรุณาระบุอีเมลสำหรับรับ Magic Link");
      return;
    }

    const res = await authStore.signInWithOtp(otpEmail);
    if (res.ok) {
      toast.success("ส่ง Magic Link ไปยังอีเมลเรียบร้อยแล้ว กรุณาตรวจสอบกล่องจดหมาย");
      setOpen(false);
      setOtpEmail("");
    } else {
      toast.error(res.error || "ไม่สามารถส่ง Magic Link ได้");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error("กรุณาระบุอีเมลสำหรับรีเซ็ตรหัสผ่าน");
      return;
    }

    const res = await authStore.resetPasswordForEmail(resetEmail);
    if (res.ok) {
      toast.success("ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลแล้ว กรุณาตรวจสอบกล่องจดหมาย");
      setActiveTab("signin");
      setResetEmail("");
    } else {
      toast.error(res.error || "ไม่สามารถส่งคำขอรีเซ็ตรหัสผ่านได้");
    }
  };

  const handleQuickLogin = (targetRole: "owner" | "viewer") => {
    authStore.loginAs(targetRole);
    if (targetRole === "owner") {
      toast.success("เข้าสู่ระบบในฐานะ: เจ้าของ (Owner) — มีสิทธิ์แก้ไขเว็บไซต์ได้ทั้งหมด");
    } else {
      toast.success("เข้าสู่ระบบในฐานะ: ผู้ใช้งาน (Viewer) — มีสิทธิ์ก๊อปปี้ข้อความได้อย่างเดียว");
    }
    setOpen(false);
  };

  const handleSignOut = async () => {
    await authStore.signOut();
    toast.success("ออกจากระบบเรียบร้อยแล้ว");
  };

  // If user is already logged in, show User Profile Dropdown
  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger ?? (
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 gap-2 border-sidebar-border bg-sidebar-accent text-sidebar-foreground",
                isOwner && "border-amber-500/50 text-amber-600 dark:text-amber-400 font-semibold",
              )}
            >
              {isOwner ? (
                <Crown className="size-4 text-amber-500 shrink-0" />
              ) : (
                <User className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="max-w-[110px] truncate text-xs sm:max-w-[150px]">{user.email}</span>
              <Badge
                variant={isOwner ? "default" : "secondary"}
                className={cn(
                  "ml-1 text-[10px] px-1.5 py-0 h-4 font-normal",
                  isOwner
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {isOwner ? "เจ้าของ" : "ผู้ใช้งาน"}
              </Badge>
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-xs font-semibold leading-none text-foreground truncate">
                {user.email}
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                {isOwner ? (
                  <Badge className="bg-amber-500 text-white text-[10px]">
                    <Crown className="mr-1 size-3" /> สิทธิ์: เจ้าของ (แก้ไขได้)
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">
                    <Shield className="mr-1 size-3" /> สิทธิ์: ผู้ใช้งาน (ก๊อปปี้อย่างเดียว)
                  </Badge>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleQuickLogin(isOwner ? "viewer" : "owner")}
            className="text-xs"
          >
            <Sparkles className="mr-2 size-3.5 text-primary" />
            สลับเป็น {isOwner ? "ผู้ใช้งาน (Viewer)" : "เจ้าของ (Owner)"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-destructive text-xs focus:text-destructive"
          >
            <LogOut className="mr-2 size-3.5" />
            ออกจากระบบ (Sign Out)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Guest / Unauthenticated: Show Login Dialog
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80 text-xs h-9"
          >
            <LogIn className="size-4" />
            <span>เข้าสู่ระบบ</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Lock className="size-5 text-primary" /> ระบบเข้าสู่ระบบ (Email Login)
          </DialogTitle>
          <DialogDescription>
            เข้าสู่ระบบด้วย Supabase Authentication เพื่อกำหนดสิทธิ์การใช้งาน
          </DialogDescription>
        </DialogHeader>

        {/* Roles explanation card */}
        <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <Crown className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">สิทธิ์เจ้าของ (Owner):</span>{" "}
              <span className="text-muted-foreground">
                แก้ไขเว็บไซต์ได้ทั้งหมด (เพิ่ม/แก้ไข/ลบ FAQ, จัดการหมวดหมู่, อัปโหลดรูปภาพ,
                นำเข้าข้อมูล, ตั้งค่าระบบ)
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 border-t border-border/50 pt-2">
            <User className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">สิทธิ์ผู้ใช้งาน (Viewer):</span>{" "}
              <span className="text-muted-foreground">
                ค้นหาคำตอบในระบบ และ
                <strong className="text-foreground">ก๊อปปี้ข้อความไปใช้งานได้เท่านั้น</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Login tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-4 w-full h-9">
            <TabsTrigger value="signin" className="text-xs px-1">
              เข้าสู่ระบบ
            </TabsTrigger>
            <TabsTrigger value="signup" className="text-xs px-1">
              สมัครสมาชิก
            </TabsTrigger>
            <TabsTrigger value="otp" className="text-xs px-1">
              Magic Link
            </TabsTrigger>
            <TabsTrigger value="reset" className="text-xs px-1">
              รีเซ็ตรหัส
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Password Sign In */}
          <TabsContent value="signin" className="space-y-4 pt-3">
            <form onSubmit={handleSignIn} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="signin-email" className="text-xs">
                  อีเมล (Email)
                </Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="aumaoyaoao@gmail.com หรือ email ของคุณ"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signin-pw" className="text-xs">
                    รหัสผ่าน (Password)
                  </Label>
                  <button
                    type="button"
                    onClick={() => setActiveTab("reset")}
                    className="text-[11px] text-primary hover:underline"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>
                <Input
                  id="signin-pw"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="pt-1 flex gap-2">
                <Button type="submit" disabled={loading} className="w-full text-xs">
                  {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ (Sign In)"}
                </Button>
              </div>

              <p className="text-center text-[11px] text-muted-foreground">
                ยังไม่มีบัญชี?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("signup")}
                  className="text-primary font-medium hover:underline"
                >
                  คลิกที่นี่เพื่อสมัครสมาชิก
                </button>
              </p>
            </form>
          </TabsContent>

          {/* Tab 2: Sign Up */}
          <TabsContent value="signup" className="space-y-4 pt-3">
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="signup-email" className="text-xs">
                  อีเมลสำหรับใช้งาน (Email)
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-pw" className="text-xs">
                  ตั้งรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
                </Label>
                <Input
                  id="signup-pw"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-confirm-pw" className="text-xs">
                  ยืนยันรหัสผ่านอีกครั้ง
                </Label>
                <Input
                  id="signup-confirm-pw"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full text-xs">
                {loading ? "กำลังสมัครสมาชิก..." : "ลงทะเบียนใช้งาน (Sign Up)"}
              </Button>
            </form>
          </TabsContent>

          {/* Tab 3: Magic Link OTP */}
          <TabsContent value="otp" className="space-y-4 pt-3">
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="otp-email" className="text-xs">
                  ระบุอีเมลสำหรับรับลิงก์ล็อกอินด่วน
                </Label>
                <Input
                  id="otp-email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full text-xs">
                {loading ? "กำลังส่งลิงก์..." : "ส่ง Magic Link เข้าอีเมล"}
              </Button>
            </form>
          </TabsContent>

          {/* Tab 4: Reset Password */}
          <TabsContent value="reset" className="space-y-4 pt-3">
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="reset-email" className="text-xs">
                  ระบุอีเมลที่ต้องการรีเซ็ตรหัสผ่าน
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full text-xs">
                {loading ? "กำลังส่งคำขอ..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Instant Evaluation / Test Mode Buttons */}
        <div className="border-t border-border pt-4 mt-2">
          <p className="text-[11px] font-medium text-muted-foreground text-center mb-2.5">
            ⚡ หรือคลิกทดสอบสลับสิทธิ์การใช้งานทันที (Instant Quick Switch):
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickLogin("owner")}
              className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs h-9"
            >
              <Crown className="mr-1.5 size-3.5 text-amber-500" /> เป็นเจ้าของ (แก้ไขได้)
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickLogin("viewer")}
              className="text-xs h-9 hover:bg-muted"
            >
              <User className="mr-1.5 size-3.5 text-muted-foreground" /> เป็นผู้ใช้
              (ก๊อปปี้อย่างเดียว)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
