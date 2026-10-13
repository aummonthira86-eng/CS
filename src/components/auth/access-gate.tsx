import { useState, useEffect, type ReactNode } from "react";
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Clock,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth, authStore } from "@/lib/auth/auth-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AccessGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, initialized } = useAuth();

  // Initial loading state before client hydration / session check
  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary animate-pulse">
            <Lock className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">
            กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated: Strictly show minimalist Key Access Portal
  if (!isAuthenticated) {
    return <KeyAccessPortal />;
  }

  // Authenticated: Render app content
  return <>{children}</>;
}

/**
 * Minimalist Access Portal
 * Requires valid Access Key / Passcode (or Master Key).
 * Completely eliminates email sign-up, registration, and quick demo mode buttons.
 */
function KeyAccessPortal() {
  const { rateLimit, loading } = useAuth();
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  // Lockout countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      if (rateLimit.lockoutUntil > now) {
        setSecondsRemaining(Math.ceil((rateLimit.lockoutUntil - now) / 1000));
      } else {
        setSecondsRemaining(0);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [rateLimit.lockoutUntil]);

  const isLockedOut = secondsRemaining > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) {
      toast.error(`ระบบถูกระงับชั่วคราว กรุณารออีก ${secondsRemaining} วินาที`);
      return;
    }

    if (!keyInput.trim()) {
      toast.error("กรุณากรอกรหัสผ่านเข้าใช้งาน (Access Key)");
      return;
    }

    const res = await authStore.loginWithKey(keyInput);
    if (res.ok) {
      if (res.role === "owner") {
        toast.success(`ยินดีต้อนรับ ${res.name}! เข้าสู่ระบบในฐานะเจ้าของระบบ (Owner)`);
      } else {
        toast.success(`ยินดีต้อนรับ ${res.name}! ตรวจสอบสิทธิ์ผ่านเรียบร้อย`);
      }
    } else {
      toast.error(res.error || "รหัสผ่านไม่ถูกต้อง");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/40 to-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand & Security Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 ring-4 ring-primary/10">
            <KeyRound className="size-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
            CS FAQ Management
          </h1>
          <p className="text-sm text-muted-foreground">
            ระบบคลังคำตอบปิด — เฉพาะเจ้าหน้าที่ที่มีรหัสเข้าใช้งานเท่านั้น
          </p>
          <div className="pt-1 flex items-center justify-center gap-1.5">
            <Badge
              variant="outline"
              className="text-xs gap-1 border-primary/30 text-primary bg-primary/5 px-2.5 py-0.5"
            >
              <ShieldCheck className="size-3.5" /> ระบบป้องกันสิทธิ์: เจ้าของระบบควบคุมรหัสผ่าน
            </Badge>
          </div>
        </div>

        {/* Access Key Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5">
          {/* Lockout Warning Banner */}
          {isLockedOut ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5">
              <Clock className="size-4 shrink-0 mt-0.5 animate-spin" />
              <div>
                <p className="font-semibold">ระบบถูกล็อกชั่วคราวเพื่อความปลอดภัย</p>
                <p className="mt-0.5">
                  ใส่รหัสผิดเกินจำนวนที่กำหนด กรุณารออีก{" "}
                  <span className="font-mono font-bold text-sm">{secondsRemaining}</span> วินาที
                </p>
              </div>
            </div>
          ) : rateLimit.failedAttempts > 0 ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <ShieldAlert className="size-4 shrink-0" />
              <span>
                คำเตือน: ใส่รหัสผิด {rateLimit.failedAttempts}/5 ครั้ง (หากเกินจะถูกระงับ 3 นาที)
              </span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-key-input" className="text-xs font-semibold text-foreground">
                รหัสผ่านเข้าใช้งาน (Access Key / Master Key)
              </Label>
              <div className="relative">
                <Input
                  id="access-key-input"
                  type={showKey ? "text" : "password"}
                  placeholder="กรอก Access Key หรือ Master Key ที่ได้รับ"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  disabled={loading || isLockedOut}
                  autoComplete="current-password"
                  autoFocus
                  className="pr-10 h-11 text-sm font-mono tracking-wide rounded-xl"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || isLockedOut || !keyInput.trim()}
              className="w-full h-11 rounded-xl text-sm font-medium gap-2 shadow-md transition-all"
            >
              {loading ? (
                "กำลังตรวจสอบรหัส..."
              ) : isLockedOut ? (
                `กรุณารอ (${secondsRemaining}s)`
              ) : (
                <>
                  เข้าสู่ระบบ <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          {/* Secure Policy Notice */}
          <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 space-y-1.5 text-xs text-muted-foreground leading-relaxed">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Lock className="size-3.5 text-primary" />
              นโยบายความปลอดภัยของระบบ:
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
              <li>
                ไม่มีการเปิดรับสมัครสมาชิกทั่วไป บัญชีทั้งหมดต้องได้รับรหัสจากเจ้าของระบบ (Owner)
              </li>
              <li>เจ้าของระบบสามารถเพิ่ม, แก้ไขสิทธิ์, และเพิกถอนรหัสผ่านได้ทันที</li>
              <li>หากยังไม่มีรหัส กรุณาติดต่อหัวหน้าทีม CS หรือผู้ดูแลระบบเพื่อขอรับ Access Key</li>
            </ul>
          </div>
        </div>

        {/* Security Footer */}
        <p className="text-[11px] text-center text-muted-foreground">
          ระบบรักษาความปลอดภัยระดับองค์กร • ป้องกันการ Brute-force อัตโนมัติ
        </p>
      </div>
    </div>
  );
}
