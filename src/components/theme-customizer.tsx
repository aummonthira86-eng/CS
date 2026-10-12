import { useState } from "react";
import { Sun, Moon, Monitor, Palette, Check, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useTheme,
  themeStore,
  COLOR_PRESETS,
  FONT_OPTIONS,
  type ThemeMode,
  type ColorPreset,
  type RadiusPreset,
} from "@/lib/theme/theme-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ThemeCustomizerProps {
  className?: string;
  isCompact?: boolean;
}

export function ThemeCustomizerPanel({ className }: ThemeCustomizerProps) {
  const theme = useTheme();

  return (
    <div className={cn("space-y-6", className)}>
      {/* 1. Theme Mode: Light, Dark, System */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">โหมดการแสดงผล (Theme Mode)</Label>
          <span className="text-xs text-muted-foreground">
            {theme.mode === "light"
              ? "โหมดสว่าง"
              : theme.mode === "dark"
                ? "โหมดมืด"
                : "ตามระบบปฏิบัติการ"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "light", label: "สว่าง (Light)", icon: Sun },
            { id: "dark", label: "มืด (Dark)", icon: Moon },
            { id: "system", label: "ตามระบบ (System)", icon: Monitor },
          ].map(({ id, label, icon: Icon }) => {
            const active = theme.mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  themeStore.setMode(id as ThemeMode);
                  toast.success(`เปลี่ยนโหมดเป็น: ${label}`);
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all",
                  active
                    ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary"
                    : "border-border bg-card hover:bg-accent/50 text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-4", active && "text-primary")} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Color Scheme / Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">ชุดสีธีมหลัก (Color Palette)</Label>
          <span className="text-xs text-muted-foreground">
            {COLOR_PRESETS.find((c) => c.id === theme.colorPreset)?.name}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {COLOR_PRESETS.map((preset) => {
            const active = theme.colorPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  themeStore.setColorPreset(preset.id as ColorPreset);
                  toast.success(`เปลี่ยนสีธีมเป็น: ${preset.name}`);
                }}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-xl border p-2.5 text-left text-xs transition-all",
                  active
                    ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                    : "border-border bg-card hover:bg-accent/40",
                )}
              >
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-full shadow-inner ring-1 ring-black/10"
                  style={{ backgroundColor: preset.hex }}
                >
                  {active && <Check className="size-3.5 stroke-[3] text-white drop-shadow" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{preset.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{preset.labelTh}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Typography Selection */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">แบบอักษรเนื้อหา (Body Font)</Label>
          <Select
            value={FONT_OPTIONS.find((f) => f.family === theme.fontSans)?.id ?? "ibm-plex"}
            onValueChange={(val) => {
              const opt = FONT_OPTIONS.find((f) => f.id === val);
              if (opt) {
                themeStore.setFontSans(opt.family);
                toast.success(`เปลี่ยนฟอนต์เนื้อหาเป็น: ${opt.name}`);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font.id} value={font.id}>
                  <span style={{ fontFamily: font.family }}>{font.name}</span>{" "}
                  <span className="text-xs text-muted-foreground">
                    ({font.labelTh.split(" ")[1] ?? ""})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            ใช้กับข้อความทั่วไป เนื้อหาคำตอบ และตาราง
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">แบบอักษรหัวเรื่อง (Heading Font)</Label>
          <Select
            value={FONT_OPTIONS.find((f) => f.family === theme.fontDisplay)?.id ?? "bai-jamjuree"}
            onValueChange={(val) => {
              const opt = FONT_OPTIONS.find((f) => f.id === val);
              if (opt) {
                themeStore.setFontDisplay(opt.family);
                toast.success(`เปลี่ยนฟอนต์หัวเรื่องเป็น: ${opt.name}`);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font.id} value={font.id}>
                  <span style={{ fontFamily: font.family }}>{font.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            ใช้กับชื่อหน้า หัวข้อคำถาม และตัวเลขสถิติ
          </p>
        </div>
      </div>

      {/* 4. Corner Radius */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">ความโค้งมนของการ์ดและปุ่ม (Corner Radius)</Label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: "sm", label: "คมเหลี่ยม (0.375rem)" },
            { id: "md", label: "ปานกลาง (0.5rem)" },
            { id: "lg", label: "มาตรฐาน (0.75rem)" },
            { id: "xl", label: "โค้งมนมาก (1.0rem)" },
          ].map(({ id, label }) => {
            const active = theme.radius === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  themeStore.setRadius(id as RadiusPreset);
                  toast.success(`ปรับความโค้งมน: ${label.split(" ")[0]}`);
                }}
                className={cn(
                  "rounded-lg border px-2 py-2 text-center text-xs font-medium transition-all",
                  active
                    ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {label.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Live Preview Sandbox */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" /> ตัวอย่างการแสดงผลทันที (Live Preview)
          </span>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
            Active Theme
          </span>
        </div>
        <div className="space-y-3 rounded-lg border border-border/80 bg-background/50 p-3.5">
          <h3 className="font-display text-lg font-bold text-foreground">
            คำถาม: เติมเงินผ่าน PromptPay แล้วไม่ได้รับเพชรในเกม?
          </h3>
          <p className="font-sans text-xs leading-relaxed text-muted-foreground">
            ระบบจะอัปเดตยอดภายใน 1-3 นาที หากยอดยังไม่ปรับ กรุณาเตรียมภาพสลิปการโอนและแจ้ง UID
            กับเจ้าหน้าที่ CS ผ่านหน้านี้
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button size="sm">
              <Check className="mr-1.5 size-3.5" /> บันทึกคำตอบ
            </Button>
            <Button variant="secondary" size="sm">
              คัดลอกข้อความ
            </Button>
            <span className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground font-medium">
              #การเงิน #PromptPay
            </span>
          </div>
        </div>
      </div>

      {/* 6. Reset button */}
      <div className="flex justify-end pt-1">
        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => {
            themeStore.reset();
            toast.success("คืนค่าธีมและรูปแบบอักษรเป็นค่าเริ่มต้นแล้ว");
          }}
        >
          <RotateCcw className="mr-1.5 size-3.5" /> คืนค่าเริ่มต้นทั้งหมด
        </Button>
      </div>
    </div>
  );
}

export function ThemeCustomizerDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80"
          >
            <Palette className="size-4" />
            <span className="hidden sm:inline">ปรับแต่งธีม & ฟอนต์</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            <Palette className="size-5 text-primary" /> ปรับแต่งธีมและรูปแบบอักษร
          </DialogTitle>
          <DialogDescription>
            ปรับแต่งโทนสี โหมดมืด/สว่าง และฟอนต์ภาษาไทยได้ตามต้องการ
            การตั้งค่าจะบันทึกในเบราว์เซอร์อัตโนมัติ
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <ThemeCustomizerPanel />
        </div>
      </DialogContent>
    </Dialog>
  );
}
