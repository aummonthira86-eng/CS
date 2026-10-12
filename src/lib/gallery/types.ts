export interface GalleryImage {
  id: string;
  title: string;
  url: string;
  file_name: string;
  category: string;
  tags: string[];
  dimensions?: string;
  size_bytes?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const GALLERY_CATEGORIES = [
  "ทั้งหมด",
  "การเงิน/เติมเงิน",
  "ปัญหาเทคนิค/Error",
  "บัญชีผู้ใช้/UID",
  "กิจกรรม/โปรโมชัน",
  "ไอคอน/แบรนด์",
  "ทั่วไป",
] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

export type CopyFormat = "url" | "markdown" | "html" | "bbcode";

export function formatImageCopy(img: GalleryImage, format: CopyFormat): string {
  switch (format) {
    case "url":
      return img.url;
    case "markdown":
      return `![${img.title}](${img.url})`;
    case "html":
      return `<img src="${img.url}" alt="${img.title}" loading="lazy" />`;
    case "bbcode":
      return `[img]${img.url}[/img]`;
    default:
      return img.url;
  }
}
