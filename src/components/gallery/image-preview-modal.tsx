import { useState } from "react";
import {
  Copy,
  Check,
  Download,
  ExternalLink,
  Code,
  FileText,
  Calendar,
  Layers,
  Maximize2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GalleryImage, CopyFormat } from "@/lib/gallery/types";
import { formatImageCopy } from "@/lib/gallery/types";
import { toast } from "sonner";

interface ImagePreviewModalProps {
  image: GalleryImage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImagePreviewModal({ image, open, onOpenChange }: ImagePreviewModalProps) {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  if (!image) return null;

  const handleCopy = async (format: CopyFormat) => {
    const text = formatImageCopy(image, format);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);

      if (format === "url") toast.success("คัดลอกลิงก์รูปภาพแล้ว!");
      else if (format === "markdown") toast.success("คัดลอก Markdown สำหรับแทรกใน FAQ แล้ว!");
      else if (format === "html") toast.success("คัดลอก HTML Tag แล้ว!");
    } catch {
      toast.error("ไม่สามารถคัดลอกได้");
    }
  };

  const handleDownload = () => {
    try {
      const link = document.createElement("a");
      link.href = image.url;
      link.download = image.file_name || "image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("กำลังดาวน์โหลดรูปภาพ");
    } catch {
      window.open(image.url, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <DialogTitle className="font-display text-xl">{image.title}</DialogTitle>
            <Badge variant="secondary">{image.category}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Main Full-Size Image Container */}
          <div className="relative flex min-h-[300px] max-h-[500px] w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/40 p-3">
            <img
              src={image.url}
              alt={image.title}
              className="max-h-[460px] w-auto max-w-full rounded-lg object-contain shadow-sm"
            />
          </div>

          {/* Action Buttons: Prominent Copy Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => handleCopy("url")} className="flex-1 min-w-[140px] gap-2">
              {copiedFormat === "url" ? (
                <>
                  <Check className="size-4 stroke-[3]" /> คัดลอกแล้ว!
                </>
              ) : (
                <>
                  <Copy className="size-4" /> คัดลอก Image URL
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              onClick={() => handleCopy("markdown")}
              className="flex-1 min-w-[150px] gap-2"
            >
              {copiedFormat === "markdown" ? (
                <>
                  <Check className="size-4 stroke-[3]" /> คัดลอกแล้ว!
                </>
              ) : (
                <>
                  <FileText className="size-4" /> คัดลอก Markdown
                </>
              )}
            </Button>

            <Button variant="outline" onClick={() => handleCopy("html")} className="gap-2">
              {copiedFormat === "html" ? <Check className="size-4" /> : <Code className="size-4" />}
              <span className="hidden sm:inline">คัดลอก HTML</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleDownload}
              className="gap-2"
              title="ดาวน์โหลดภาพลงคอมพิวเตอร์"
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">ดาวน์โหลด</span>
            </Button>
          </div>

          {/* Description & Usage Guide */}
          {image.description && (
            <div className="rounded-xl border border-border/80 bg-background/50 p-3.5">
              <p className="text-xs font-semibold text-foreground">คำอธิบายประกอบการใช้งาน:</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {image.description}
              </p>
            </div>
          )}

          {/* Markdown Snippet box for easy preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>โค้ด Markdown สำหรับนำไปวางในคำตอบ FAQ:</span>
              <button
                type="button"
                onClick={() => handleCopy("markdown")}
                className="hover:text-primary font-medium flex items-center gap-1"
              >
                <Copy className="size-3" /> คลิกเพื่อก็อปปี้
              </button>
            </div>
            <div className="rounded-lg border border-border bg-muted/60 p-2.5 font-mono text-xs text-foreground select-all break-all">
              {formatImageCopy(image, "markdown")}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-border p-3 text-xs">
            <div>
              <p className="text-muted-foreground">ชื่อไฟล์</p>
              <p className="mt-0.5 font-medium truncate">{image.file_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ขนาดรูปภาพ</p>
              <p className="mt-0.5 font-medium">{image.dimensions ?? "Vector"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ขนาดไฟล์</p>
              <p className="mt-0.5 font-medium">
                {image.size_bytes ? `${(image.size_bytes / 1024).toFixed(1)} KB` : "Vector SVG"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">วันที่นำเข้า</p>
              <p className="mt-0.5 font-medium">
                {new Date(image.created_at).toLocaleDateString("th-TH")}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
