import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Search,
  PlusCircle,
  FolderTree,
  Upload,
  Download,
  Settings,
  FlaskConical,
  MoreHorizontal,
  BookOpenCheck,
  Image as ImageIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeCustomizerDialog } from "@/components/theme-customizer";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { useAuth } from "@/lib/auth/auth-store";
import { store, useData, useRole } from "@/lib/faq/store";
import { ROLE_LABEL, can, type Role } from "@/lib/faq/types";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "แดชบอร์ด", icon: LayoutDashboard },
  { to: "/search", label: "ค้นหา FAQ", icon: Search },
  { to: "/faqs/new", label: "เพิ่ม FAQ", icon: PlusCircle },
  { to: "/categories", label: "หมวดหมู่", icon: FolderTree },
  { to: "/gallery", label: "คลังรูปภาพ", icon: ImageIcon },
  { to: "/import", label: "นำเข้า Excel/CSV", icon: Upload },
  { to: "/export", label: "ส่งออก / สำรอง", icon: Download },
  { to: "/evaluation", label: "ทดสอบการค้นหา", icon: FlaskConical },
  { to: "/settings", label: "ตั้งค่า", icon: Settings },
] as const;

const MOBILE_MAIN = ["/", "/search", "/faqs/new", "/categories"];

function useActive() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (to: string) => (to === "/" ? path === "/" : path.startsWith(to));
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const isActive = useActive();
  const role = useRole();

  return (
    <nav className="space-y-1">
      {NAV.map(({ to, label, icon: Icon }) => {
        const isRestricted =
          (to === "/faqs/new" && !can(role, "edit")) ||
          (to === "/import" && !can(role, "import")) ||
          (to === "/settings" && !can(role, "settings"));

        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
              isActive(to)
                ? "bg-sidebar-primary font-semibold text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <div className="flex items-center gap-2.5">
              <Icon className="size-4 shrink-0" />
              <span>{label}</span>
            </div>
            {isRestricted ? (
              <span className="text-[10px] opacity-60 font-normal">จำกัดสิทธิ์</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  const { settings } = useData();
  const { isOwner, session } = useAuth();

  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <BookOpenCheck className="size-5" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-base font-semibold text-sidebar-accent-foreground">
          {settings.site_name || "FAQ Management"}
        </p>
        <p className="text-[11px] uppercase tracking-wider text-sidebar-primary font-medium">
          {session ? (isOwner ? "👑 เจ้าของระบบ (Owner)" : `🔑 ${session.name}`) : "ระบบคลัง FAQ"}
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const isActive = useActive();
  const { isOwner } = useAuth();

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-5 bg-sidebar p-4 text-sidebar-foreground lg:flex">
        <Brand />
        <NavList />
        <div className="mt-auto space-y-3 pt-2">
          {/* Supabase Email Auth & Role Badge */}
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-sidebar-foreground/80">
                บัญชีผู้ใช้งาน
              </span>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                  isOwner ? "bg-amber-500/20 text-amber-400" : "bg-muted text-muted-foreground",
                )}
              >
                {isOwner ? "แก้ไขได้" : "ก๊อปปี้เท่านั้น"}
              </span>
            </div>
            <AuthDialog />
          </div>

          <div className="flex items-center gap-2">
            <ThemeCustomizerDialog />
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between bg-sidebar px-4 py-3 lg:hidden">
        <Brand />
        <div className="flex items-center gap-2">
          <AuthDialog />
          <ThemeCustomizerDialog />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-sidebar-border bg-sidebar lg:hidden">
        {NAV.filter((n) => MOBILE_MAIN.includes(n.to)).map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[11px]",
              isActive(to) ? "text-sidebar-primary" : "text-sidebar-foreground",
            )}
          >
            <Icon className="size-5" />
            {label.replace(" FAQ", "")}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function MoreSheet() {
  return (
    <Sheet>
      <SheetTrigger className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-sidebar-foreground">
        <MoreHorizontal className="size-5" />
        เพิ่มเติม
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 border-sidebar-border bg-sidebar text-sidebar-foreground"
      >
        <SheetHeader>
          <SheetTitle className="text-sidebar-accent-foreground">เมนู</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-6">
          <NavList />
          <div className="pt-2">
            <ThemeCustomizerDialog />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function LoadingBlock() {
  return (
    <div className="space-y-3" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon = Search,
  title,
  children,
}: {
  icon?: typeof Search;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-full bg-secondary text-secondary-foreground">
        <Icon className="size-6" />
      </div>
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <div className="mt-2 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
