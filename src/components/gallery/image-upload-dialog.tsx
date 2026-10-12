import { useState, useRef } from "react";
import { Upload, Link as LinkIcon, Image as ImageIcon, X, FileImage, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { GALLERY_CATEGORIES, type GalleryCategory } from "@/lib/gallery/types";
import { galleryStore } from "@/lib/gallery/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadDialogProps {
  trigger?: React.ReactNode;
}

export function ImageUploadDialog({ trigger }: ImageUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");

  // Form states
  const [fileDataUrl, setFileDataUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [dimensions, setDimensions] = useState<string>("");
  const [urlInput, setUrlInput] = useState<string>("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("การเงิน/เติมเงิน");
  const [tagsStr, setTagsStr] = useState("");
  const [description, setDescription] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFileDataUrl("");
    setFileName("");
    setFileSize(0);
    setDimensions("");
    setUrlInput("");
    setTitle("");
    setCategory("การเงิน/เติมเงิน");
    setTagsStr("");
    setDescription("");
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น (PNG, JPG, SVG, WebP)");
      return;
    }
    // Limit to 4MB for client storage safety
    if (file.size > 4 * 1024 * 1024) {
      toast.error("ขนาดไฟล์เกิน 4MB กรุณาลดขนาดไฟล์ก่อนอัปโหลด");
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFileDataUrl(result);

      // Measure dimensions
      const img = new Image();
      img.onload = () => {
        setDimensions(`${img.naturalWidth} × ${img.naturalHeight}`);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = () => {
    const activeUrl = uploadMode === "file" ? fileDataUrl : urlInput.trim();

    if (!activeUrl) {
      toast.error(
        uploadMode === "file"
          ? "กรุณาเลือกไฟล์รูปภาพเพื่ออัปโหลด"
          : "กรุณาระบุ URL รูปภาพที่ถูกต้อง",
      );
      return;
    }

    if (!title.trim()) {
      toast.error("กรุณาระบุชื่อรูปภาพ");
      return;
    }

    const tags = tagsStr
      .split(/[,،]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    galleryStore.addImage({
      title: title.trim(),
      file_name: fileName || (uploadMode === "url" ? "web-image.jpg" : "uploaded-image"),
      url: activeUrl,
      category,
      tags,
      dimensions: dimensions || "Web Image",
      size_bytes: fileSize || undefined,
      description: description.trim() || undefined,
    });

    toast.success("เพิ่มรูปภาพลงในคลังเรียบร้อยแล้ว!");
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Upload className="size-4" />
            <span>อัปโหลดรูปภาพ</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Upload className="size-5 text-primary" /> เพิ่มรูปภาพเข้าคลัง (Image Storage)
          </DialogTitle>
          <DialogDescription>
            อัปโหลดไฟล์ภาพจากเครื่องหรือใส่ลิงก์รูปภาพเพื่อนำไปใช้งานร่วมกับ FAQ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Upload Method Switcher */}
          <div className="flex rounded-lg border border-border p-1 bg-muted/40">
            <button
              type="button"
              onClick={() => setUploadMode("file")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-md py-1.5 text-xs font-medium transition-all",
                uploadMode === "file"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <FileImage className="size-3.5" /> อัปโหลดจากคอมพิวเตอร์
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("url")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-md py-1.5 text-xs font-medium transition-all",
                uploadMode === "url"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LinkIcon className="size-3.5" /> ระบุ Direct URL
            </button>
          </div>

          {/* Upload Dropzone */}
          {uploadMode === "file" ? (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) processFile(e.target.files[0]);
                }}
              />

              {fileDataUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-border bg-muted/30 p-2">
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/5">
                    <img src={fileDataUrl} alt="Preview" className="size-full object-contain" />
                    <button
                      type="button"
                      onClick={() => {
                        setFileDataUrl("");
                        setFileName("");
                        setFileSize(0);
                        setDimensions("");
                      }}
                      className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/70 text-white hover:bg-black"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between px-1 text-xs text-muted-foreground">
                    <span className="truncate max-w-[200px] font-medium text-foreground">
                      {fileName}
                    </span>
                    <span>
                      {dimensions} • {(fileSize / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-7 text-center cursor-pointer transition-colors",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30",
                  )}
                >
                  <div className="grid size-12 place-items-center rounded-full bg-secondary text-primary">
                    <Upload className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      ลากไฟล์รูปภาพมาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      รองรับ PNG, JPG, WebP, SVG (ขนาดสูงสุด 4MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="image-url"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (!title && e.target.value) {
                      setTitle("ภาพจากเว็บไซค์");
                    }
                  }}
                  placeholder="https://example.com/images/screenshot.png"
                />
              </div>
              {urlInput && (
                <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted/20">
                  <img
                    src={urlInput}
                    alt="Preview"
                    className="size-full object-contain"
                    onError={() => toast.error("ไม่สามารถโหลดภาพจาก URL นี้ได้")}
                  />
                </div>
              )}
            </div>
          )}

          {/* Metadata Fields */}
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="img-title">
                ชื่อรูปภาพ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="img-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น จุดตรวจสลิปโอนเงิน PromptPay"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
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
                <Label htmlFor="img-tags">แท็ก (คั่นด้วยเครื่องหมายจุลภาค ,)</Label>
                <Input
                  id="img-tags"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  placeholder="เติมเงิน, สลิป, บัญชี"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="img-desc">คำอธิบายเพิ่มเติม (สำหรับทีม CS)</Label>
              <Textarea
                id="img-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="อธิบายวิธีนำภาพนี้ไปใช้ตอบลูกค้า..."
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} className="gap-2">
            <Check className="size-4" /> บันทึกรูปภาพ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
