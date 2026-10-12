import { useState } from "react";
import {
  Copy,
  Check,
  MoreVertical,
  ExternalLink,
  Edit2,
  Trash2,
  Code,
  FileText,
  Eye,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GalleryImage, CopyFormat } from "@/lib/gallery/types";
import { GALLERY_CATEGORIES, formatImageCopy } from "@/lib/gallery/types";
import { galleryStore } from "@/lib/gallery/store";
import { useRole } from "@/lib/faq/store";
import { can } from "@/lib/faq/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageCardProps {
  image: GalleryImage;
  onPreview: (image: GalleryImage) => void;
}

export function ImageCard({ image, onPreview }: ImageCardProps) {
  const role = useRole();
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Edit form states
  const [title, setTitle] = useState(image.title);
  const [category, setCategory] = useState(image.category);
  const [tagsStr, setTagsStr] = useState(image.tags.join(", "));
  const [description, setDescription] = useState(image.description ?? "");

  const handleCopy = async (format: CopyFormat = "url") => {
    const text = formatImageCopy(image, format);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      if (format === "url") {
        toast.success("คัดลอกลิงก์รูปภาพแล้ว! (Copied to clipboard)");
      } else if (format === "markdown") {
        toast.success("คัดลอกโค้ด Markdown สำหรับใส่ใน FAQ แล้ว!");
      } else if (format === "html") {
        toast.success("คัดลอกโค้ด HTML Tag แล้ว!");
      } else {
        toast.success("คัดลอกแล้ว!");
      }
    } catch {
      toast.error("ไม่สามารถคัดลอกได้");
    }
  };

  const handleSaveEdit = () => {
    if (!title.trim()) {
      toast.error("กรุณาระบุชื่อรูปภาพ");
      return;
    }
    const tags = tagsStr
      .split(/[,،]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    galleryStore.updateImage(image.id, {
      title: title.trim(),
      category,
      tags,
      description: description.trim() || undefined,
    });
    setEditOpen(false);
    toast.success("บันทึกข้อมูลรูปภาพเรียบร้อย");
  };

  const handleDelete = () => {
    galleryStore.deleteImage(image.id);
    toast.success("ลบรูปภาพเรียบร้อยแล้ว");
    setDeleteOpen(false);
  };

  return (
    <>
      <div className="surface group relative flex flex-col overflow-hidden rounded-2xl border border-border transition-all hover:border-primary/50 hover:shadow-md">
        {/* Thumbnail Container */}
        <div
          onClick={() => onPreview(image)}
          className="relative aspect-video w-full cursor-pointer overflow-hidden bg-muted/60"
        >
          <img
            src={image.url}
            alt={image.title}
            loading="lazy"
            className="size-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
          />

          {/* Category Badge overlay */}
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
            <Badge
              variant="secondary"
              className="bg-background/90 text-foreground backdrop-blur-sm shadow-sm text-[10px] font-medium"
            >
              {image.category}
            </Badge>
          </div>

          {/* Hover Overlay preview button */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
            <span className="flex items-center gap-1.5 rounded-lg bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow-md">
              <Eye className="size-3.5" /> ดูภาพขนาดเต็ม
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="flex flex-1 flex-col p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3
                onClick={() => onPreview(image)}
                title={image.title}
                className="cursor-pointer truncate font-display text-sm font-semibold text-foreground hover:text-primary transition-colors"
              >
                {image.title}
              </h3>
              <p className="truncate text-[11px] text-muted-foreground">{image.file_name}</p>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onPreview(image)}>
                  <Eye className="mr-2 size-4" /> ดูภาพขนาดเต็ม
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCopy("markdown")}>
                  <FileText className="mr-2 size-4" /> คัดลอก Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCopy("html")}>
                  <Code className="mr-2 size-4" /> คัดลอก HTML Tag
                </DropdownMenuItem>
                {can(role, "manageGallery") && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                      <Edit2 className="mr-2 size-4" /> แก้ไขข้อมูล
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 size-4" /> ลบรูปภาพ
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description snippet if any */}
          {image.description && (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground/90">
              {image.description}
            </p>
          )}

          {/* Tags */}
          {image.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {image.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  <Tag className="size-2.5 opacity-60" /> {tag}
                </span>
              ))}
              {image.tags.length > 3 && (
                <span className="rounded-md bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                  +{image.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Metadata & Actions row */}
          <div className="mt-auto pt-3">
            <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{image.dimensions ?? "Vector"}</span>
              <span>
                {image.size_bytes ? `${(image.size_bytes / 1024).toFixed(1)} KB` : "SVG Graphic"}
              </span>
            </div>

            {/* PRIMARY COPY BUTTON */}
            <div className="flex items-center gap-1.5">
              <Button
                variant={copied ? "default" : "secondary"}
                size="sm"
                onClick={() => handleCopy("url")}
                className={cn(
                  "flex-1 font-medium transition-all",
                  copied
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "hover:bg-primary hover:text-primary-foreground",
                )}
              >
                {copied ? (
                  <>
                    <Check className="mr-1.5 size-4 stroke-[3]" /> คัดลอกแล้ว!
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 size-3.5" /> คัดลอกลิงก์
                  </>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2"
                    title="ตัวเลือกคัดลอกเพิ่มเติม"
                  >
                    <Code className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleCopy("url")}>
                    <Copy className="mr-2 size-4" /> คัดลอก Image URL
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCopy("markdown")}>
                    <FileText className="mr-2 size-4" /> คัดลอก Markdown (![...](...))
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCopy("html")}>
                    <Code className="mr-2 size-4" /> คัดลอก HTML (&lt;img /&gt;)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลรูปภาพ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">ชื่อรูปภาพ</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น จุดตรวจสอบใบเสร็จเติมเงิน"
              />
            </div>
            <div className="space-y-1.5">
              <Label>หมวดหมู่</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GALLERY_CATEGORIES.filter((c) => c !== "ทั้งหมด").map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tags">แท็ก (คั่นด้วยเครื่องหมายจุลภาค ,)</Label>
              <Input
                id="tags"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                placeholder="เติมเงิน, สลิป, PromptPay"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">คำอธิบายเพิ่มเติม</Label>
              <Textarea
                id="desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ระบุข้อความอธิบายเพื่อช่วยค้นหา..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveEdit}>บันทึกข้อมูล</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบรูปภาพนี้ออกจากคลัง?</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบรูปภาพ "{image.title}" ใช่หรือไม่ การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบรูปภาพ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
