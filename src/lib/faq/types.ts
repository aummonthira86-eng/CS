export type FaqStatus = "published" | "draft" | "archived";
export type CategoryStatus = "active" | "inactive";
export type Role = "owner" | "admin" | "editor" | "viewer";

export interface Faq {
  faq_id: string;
  question: string;
  answer: string;
  category_id: string | null;
  keywords: string[];
  status: FaqStatus;
  created_at: string;
  updated_at: string;
}

export interface Category {
  category_id: string;
  category_name: string;
  parent_id: string | null;
  sort_order: number;
  status: CategoryStatus;
}

export interface Settings {
  site_name: string;
  default_search_mode: string;
  results_limit: string;
  mock_role: string;
  include_drafts: string;
}

export interface DataState {
  faqs: Faq[];
  categories: Category[];
  settings: Settings;
}

export const FAQ_STATUS_LABEL: Record<FaqStatus, string> = {
  published: "เผยแพร่",
  draft: "ฉบับร่าง",
  archived: "เก็บถาวร",
};

export const ROLE_LABEL: Record<Role, string> = {
  owner: "เจ้าของ (Owner)",
  admin: "ผู้ดูแล (Admin)",
  editor: "ผู้แก้ไข (Editor)",
  viewer: "ผู้ใช้งาน (Viewer - ก๊อปปี้อย่างเดียว)",
};

export type Action =
  | "edit"
  | "delete"
  | "manageCategories"
  | "manageGallery"
  | "import"
  | "export"
  | "settings"
  | "copy";

/** Permission matrix enforcing Owner full rights and Viewer copy-only rights */
export function can(role: Role, action: Action): boolean {
  if (role === "owner" || role === "admin") return true;
  if (role === "editor")
    return (
      action === "edit" ||
      action === "import" ||
      action === "manageGallery" ||
      action === "copy" ||
      action === "export"
    );
  if (role === "viewer") return action === "copy" || action === "export";
  return false;
}
