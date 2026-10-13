import { useState } from "react";
import {
  KeyRound,
  LogOut,
  Crown,
  Shield,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Settings,
  Eye,
  EyeOff,
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
import { Link } from "@tanstack/react-router";

export function AuthDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { session, role, isOwner, loading, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      toast.error("กรุณากรอกรหัสผ่านเข้าใช้งาน (Access Key)");
      return;
    }

    const res = await authStore.loginWithKey(keyInput);
    if (res.ok) {
      toast.success(`ยืนยันสิทธิ์สำเร็จ: ${res.name}`);
      setOpen(false);
      setKeyInput("");
    } else {
      toast.error(res.error || "รหัสผ่านไม่ถูกต้อง");
    }
  };

  const handleSignOut = async () => {
    await authStore.signOut();
    toast.success("ออกจากระบบและล็อกความปลอดภัยเรียบร้อย");
  };

  // If user is currently authenticated: Show Session Dropdown Menu
  if (isAuthenticated && session) {
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
                <KeyRound className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="max-w-[110px] truncate text-xs sm:max-w-[150px]">
                {session.name}
              </span>
              <Badge
                variant={isOwner ? "default" : "secondary"}
                className={cn(
                  "ml-1 text-[10px] px-1.5 py-0 h-4 font-normal",
                  isOwner
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {isOwner ? "เจ้าของ" : role === "editor" ? "แก้ไขได้" : "ก๊อปปี้"}
              </Badge>
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-xs font-semibold leading-none text-foreground truncate">
                {session.name}
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                {isOwner ? (
                  <Badge className="bg-amber-500 text-white text-[10px]">
                    <Crown className="mr-1 size-3" /> สิทธิ์: เจ้าของ (Master Owner)
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">
                    <Shield className="mr-1 size-3" /> สิทธิ์:{" "}
                    {role === "editor" ? "ผู้แก้ไข (Editor)" : "ผู้ใช้งาน (Viewer)"}
                  </Badge>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* If Owner: Quick link to Security & Keys settings */}
          {isOwner && (
            <DropdownMenuItem asChild className="text-xs cursor-pointer">
              <Link to="/settings">
                <Settings className="mr-2 size-3.5 text-primary" />
                จัดการความปลอดภัย & Access Keys
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-destructive text-xs focus:text-destructive cursor-pointer"
          >
            <LogOut className="mr-2 size-3.5" />
            ออกจากระบบ / ล็อกหน้าจอ (Sign Out)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Not authenticated: Show Login Dialog
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80 text-xs h-9"
          >
            <KeyRound className="size-4" />
            <span>ใส่รหัสผ่าน</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Lock className="size-5 text-primary" /> รหัสผ่านเข้าใช้งาน (Access Key)
          </DialogTitle>
          <DialogDescription>
            กรอก Access Key ที่ได้รับจากเจ้าของระบบเพื่อปลดล็อกการใช้งาน
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSignIn} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="dialog-key-input" className="text-xs font-medium">
              Access Key หรือ Master Key
            </Label>
            <div className="relative">
              <Input
                id="dialog-key-input"
                type={showKey ? "text" : "password"}
                placeholder="กรอกรหัสผ่าน"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                disabled={loading}
                className="pr-10 text-sm font-mono"
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

          <Button type="submit" disabled={loading || !keyInput.trim()} className="w-full text-xs">
            {loading ? "กำลังตรวจสอบ..." : "ยืนยันรหัสเข้าใช้งาน"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
