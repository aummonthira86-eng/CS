import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Image as ImageIcon,
  Search,
  Upload,
  RotateCcw,
  Sparkles,
  Filter,
  Layers,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/app-shell";
import { ImageCard } from "@/components/gallery/image-card";
import { ImageUploadDialog } from "@/components/gallery/image-upload-dialog";
import { ImagePreviewModal } from "@/components/gallery/image-preview-modal";
import { useGallery, galleryStore } from "@/lib/gallery/store";
import { GALLERY_CATEGORIES, type GalleryImage } from "@/lib/gallery/types";
import { useRole } from "@/lib/faq/store";
import { can } from "@/lib/faq/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "คลังรูปภาพ — FAQ Management" },
      {
        name: "description",
        content:
          "คลังรูปภาพประกอบคำตอบ FAQ สลิปตัวอย่าง จุดตรวจสอบ UID และกราฟิกสำหรับเจ้าหน้าที่ CS พร้อมปุ่มคัดลอกลิงก์และ Markdown",
      },
      { property: "og:title", content: "คลังรูปภาพ — FAQ Management" },
      {
        property: "og:description",
        content: "คลังรูปภาพและคู่มือกราฟิกสำหรับทีม Customer Support",
      },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const { images, loaded } = useGallery();
  const role = useRole();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ทั้งหมด");
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null);

  // Filter images based on search query and category
  const filteredImages = useMemo(() => {
    let result = images;

    // Filter by Category
    if (selectedCategory !== "ทั้งหมด") {
      result = result.filter((img) => img.category === selectedCategory);
    }

    // Filter by Query
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (img) =>
          img.title.toLowerCase().includes(q) ||
          img.file_name.toLowerCase().includes(q) ||
          img.category.toLowerCase().includes(q) ||
          (img.description && img.description.toLowerCase().includes(q)) ||
          img.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [images, selectedCategory, query]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { ทั้งหมด: images.length };
    images.forEach((img) => {
      map[img.category] = (map[img.category] ?? 0) + 1;
    });
    return map;
  }, [images]);

  return (
    <>
      <PageHeader
        title="คลังรูปภาพ (Image Gallery)"
        description="ศูนย์รวมภาพคู่มือ สลิปการโอน จุดตรวจสอบ UID และกราฟิกช่วยเหลือผู้เล่น พร้อมปุ่มกดคัดลอกลิงก์และ Markdown สำหรับใส่ในคำตอบ FAQ"
        actions={
          can(role, "manageGallery") ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  galleryStore.reset();
                  toast.success("รีเซ็ตคลังรูปภาพเป็นตัวอย่างเริ่มต้นแล้ว");
                }}
                title="รีเซ็ตเป็นรูปภาพตัวอย่างเริ่มต้น"
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="mr-1.5 size-3.5" /> รีเซ็ตตัวอย่าง
              </Button>
              <ImageUploadDialog />
            </div>
          ) : (
            <Badge variant="secondary" className="text-xs py-1 px-2.5">
              โหมดผู้ใช้งาน: คัดลอกลิงก์และ Markdown ได้ทันที
            </Badge>
          )
        }
      />

      {/* Quick Summary Bar */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="surface flex items-center gap-3 p-3.5">
          <div className="grid size-10 place-items-center rounded-lg bg-secondary text-primary">
            <ImageIcon className="size-5" />
          </div>
          <div>
            <p className="font-display text-xl font-bold">{images.length}</p>
            <p className="text-xs text-muted-foreground">รูปภาพทั้งหมด</p>
          </div>
        </div>

        <div className="surface flex items-center gap-3 p-3.5">
          <div className="grid size-10 place-items-center rounded-lg bg-secondary text-primary">
            <Layers className="size-5" />
          </div>
          <div>
            <p className="font-display text-xl font-bold">
              {Object.keys(categoryCounts).length - 1}
            </p>
            <p className="text-xs text-muted-foreground">หมวดหมู่รูปภาพ</p>
          </div>
        </div>

        <div className="surface flex items-center gap-3 p-3.5">
          <div className="grid size-10 place-items-center rounded-lg bg-secondary text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="font-display text-xl font-bold">1-Click</p>
            <p className="text-xs text-muted-foreground">ปุ่มคัดลอกลิงก์ด่วน</p>
          </div>
        </div>

        <div className="surface flex items-center gap-3 p-3.5">
          <div className="grid size-10 place-items-center rounded-lg bg-secondary text-primary">
            <FolderOpen className="size-5" />
          </div>
          <div>
            <p className="font-display text-xl font-bold">Local Cache</p>
            <p className="text-xs text-muted-foreground">บันทึกบนเครื่อง 0 บาท</p>
          </div>
        </div>
      </div>

      {/* Search and Category Filter Controls */}
      <div className="mb-6 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหารูปภาพตามชื่อ แท็ก (เช่น เติมเงิน, UID, สลิป, Error) หรือคำอธิบาย..."
            className="h-11 pl-10 pr-24 text-sm rounded-xl bg-card shadow-sm"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              ล้างคำค้น
            </Button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          {GALLERY_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            const count = categoryCounts[cat] ?? 0;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-muted-foreground hover:bg-accent/60 hover:text-foreground border border-border",
                )}
              >
                <span>{cat}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px]",
                    active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Images */}
      {filteredImages.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredImages.map((image) => (
            <ImageCard key={image.id} image={image} onPreview={(img) => setPreviewImage(img)} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ImageIcon}
          title={query ? `ไม่พบรูปภาพที่ตรงกับ "${query}"` : "ยังไม่มีรูปภาพในหมวดหมู่นี้"}
        >
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {query && (
              <Button variant="outline" size="sm" onClick={() => setQuery("")}>
                ล้างการค้นหา
              </Button>
            )}
            {can(role, "manageGallery") && (
              <ImageUploadDialog
                trigger={
                  <Button size="sm" className="gap-1.5">
                    <Upload className="size-3.5" /> อัปโหลดรูปภาพใหม่
                  </Button>
                }
              />
            )}
          </div>
        </EmptyState>
      )}

      {/* Fullscreen Preview Modal */}
      <ImagePreviewModal
        image={previewImage}
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      />
    </>
  );
}
