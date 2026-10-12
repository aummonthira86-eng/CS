import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { EmptyState, LoadingBlock, PageHeader } from "@/components/app-shell";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { flatTree, sortCats } from "@/lib/faq/categories";
import { store, useData, useRole } from "@/lib/faq/store";
import { can, type Category } from "@/lib/faq/types";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "จัดการหมวดหมู่ — FAQ Management" },
      {
        name: "description",
        content: "เพิ่ม แก้ไข จัดลำดับ และเปิด/ปิดหมวดหมู่หลักและหมวดหมู่ย่อยของ FAQ",
      },
      { property: "og:title", content: "จัดการหมวดหมู่ — FAQ Management" },
      { property: "og:description", content: "จัดการหมวดหมู่หลักและหมวดหมู่ย่อยของ FAQ" },
    ],
  }),
  component: CategoriesPage,
});

type Edit = { id?: string; name: string; parent: string };

function CategoriesPage() {
  const { loaded, categories, faqs } = useData();
  const role = useRole();
  const [edit, setEdit] = useState<Edit | null>(null);
  const [del, setDel] = useState<Category | null>(null);
  const [moveTo, setMoveTo] = useState("none");

  if (!loaded) return <LoadingBlock />;
  if (!can(role, "manageCategories"))
    return (
      <>
        <PageHeader title="หมวดหมู่" />
        <EmptyState icon={Lock} title="เฉพาะ เจ้าของระบบ (Owner) เท่านั้นที่จัดการหมวดหมู่ได้">
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            คุณอยู่ในบทบาท <strong>ผู้ใช้งาน (Viewer)</strong>{" "}
            ซึ่งมีสิทธิ์ค้นหาคำตอบและก๊อปปี้ข้อความไปตอบลูกค้าเท่านั้น หากคุณเป็นเจ้าของเว็บไซต์
            กรุณาเข้าสู่ระบบด้วยอีเมลเจ้าของเพื่อจัดการหมวดหมู่
          </p>
          <div className="mt-4 flex justify-center">
            <AuthDialog />
          </div>
        </EmptyState>
      </>
    );

  const mains = sortCats(categories.filter((c) => !c.parent_id));
  const count = (id: string) => faqs.filter((f) => f.category_id === id).length;

  function move(c: Category, dir: -1 | 1) {
    const sibs = sortCats(categories.filter((x) => x.parent_id === c.parent_id));
    const i = sibs.findIndex((x) => x.category_id === c.category_id);
    const j = i + dir;
    if (j < 0 || j >= sibs.length) return;
    const reordered = [...sibs];
    [reordered[i], reordered[j]] = [reordered[j]!, reordered[i]!];
    reordered.forEach((x, k) => store.updateCategory(x.category_id, { sort_order: k + 1 }));
  }

  function save(): void {
    if (!edit) return;
    const name = edit.name.trim();
    if (name.length < 2 || name.length > 60) {
      toast.error("ชื่อหมวดหมู่ต้องยาว 2–60 ตัวอักษร");
      return;
    }
    const parent = edit.parent === "none" ? null : edit.parent;
    const dup = categories.some(
      (c) => c.category_name === name && c.parent_id === parent && c.category_id !== edit.id,
    );
    if (dup) {
      toast.error("มีหมวดหมู่ชื่อนี้อยู่แล้วในระดับเดียวกัน");
      return;
    }
    if (edit.id) {
      store.updateCategory(edit.id, { category_name: name, parent_id: parent });
      toast.success("บันทึกหมวดหมู่แล้ว");
    } else {
      const order = categories.filter((c) => c.parent_id === parent).length + 1;
      store.addCategory({
        category_name: name,
        parent_id: parent,
        sort_order: order,
        status: "active",
      });
      toast.success("เพิ่มหมวดหมู่แล้ว");
    }
    setEdit(null);
  }

  function confirmDelete() {
    if (!del) return;
    if (count(del.category_id) > 0)
      store.moveFaqs(del.category_id, moveTo === "none" ? null : moveTo);
    const r = store.deleteCategory(del.category_id);
    if (r.ok) toast.success("ลบหมวดหมู่แล้ว");
    else toast.error(r.reason);
    setDel(null);
  }

  const editingHasChildren = edit?.id ? categories.some((c) => c.parent_id === edit.id) : false;

  return (
    <>
      <PageHeader
        title="หมวดหมู่"
        description="หมวดหมู่ที่ปิดใช้งานยังเก็บ FAQ ไว้ครบ ไม่มีข้อมูลสูญหาย"
        actions={
          <Button onClick={() => setEdit({ name: "", parent: "none" })}>
            <Plus /> เพิ่มหมวดหมู่
          </Button>
        }
      />
      <div className="surface divide-y divide-border">
        {flatTree(categories).map(({ cat, depth }) => {
          const sibs = categories.filter((x) => x.parent_id === cat.parent_id);
          const idx = sortCats(sibs).findIndex((x) => x.category_id === cat.category_id);
          return (
            <div
              key={cat.category_id}
              className={`flex flex-wrap items-center gap-3 p-3 sm:p-4 ${depth ? "bg-muted/40 pl-8 sm:pl-12" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <p className={depth ? "text-sm" : "font-semibold"}>{cat.category_name}</p>
                <p className="text-xs text-muted-foreground">{count(cat.category_id)} FAQ</p>
              </div>
              {cat.status === "inactive" && <Badge variant="muted">ปิดใช้งาน</Badge>}
              <Switch
                aria-label="เปิด/ปิดใช้งาน"
                checked={cat.status === "active"}
                onCheckedChange={(on) =>
                  store.updateCategory(cat.category_id, { status: on ? "active" : "inactive" })
                }
              />
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={idx === 0}
                  onClick={() => move(cat, -1)}
                  aria-label="เลื่อนขึ้น"
                >
                  <ArrowUp />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={idx === sibs.length - 1}
                  onClick={() => move(cat, 1)}
                  aria-label="เลื่อนลง"
                >
                  <ArrowDown />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setEdit({
                      id: cat.category_id,
                      name: cat.category_name,
                      parent: cat.parent_id ?? "none",
                    })
                  }
                  aria-label="แก้ไข"
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    setMoveTo("none");
                    setDel(cat);
                  }}
                  aria-label="ลบ"
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          );
        })}
        {categories.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">ยังไม่มีหมวดหมู่</p>
        )}
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit?.id ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cn">ชื่อหมวดหมู่</Label>
              <Input
                id="cn"
                value={edit?.name ?? ""}
                onChange={(e) => setEdit((s) => s && { ...s, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>อยู่ภายใต้</Label>
              <Select
                value={edit?.parent ?? "none"}
                disabled={editingHasChildren}
                onValueChange={(p) => setEdit((s) => s && { ...s, parent: p })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— เป็นหมวดหมู่หลัก —</SelectItem>
                  {mains
                    .filter((m) => m.category_id !== edit?.id)
                    .map((m) => (
                      <SelectItem key={m.category_id} value={m.category_id}>
                        {m.category_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {editingHasChildren && (
                <p className="text-xs text-muted-foreground">
                  หมวดนี้มีหมวดย่อยอยู่ จึงต้องเป็นหมวดหลัก
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>
              ยกเลิก
            </Button>
            <Button onClick={save}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบหมวดหมู่ “{del?.category_name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {del && categories.some((c) => c.parent_id === del.category_id)
                ? "หมวดนี้ยังมีหมวดย่อย กรุณาลบหรือย้ายหมวดย่อยก่อน"
                : del && count(del.category_id) > 0
                  ? `มี FAQ ${count(del.category_id)} รายการในหมวดนี้ เลือกหมวดที่จะย้าย FAQ ไป (FAQ จะไม่ถูกลบ)`
                  : "หมวดนี้ไม่มี FAQ ลบได้อย่างปลอดภัย"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {del && count(del.category_id) > 0 && (
            <Select value={moveTo} onValueChange={setMoveTo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ไม่ระบุหมวด</SelectItem>
                {flatTree(categories)
                  .filter(({ cat }) => cat.category_id !== del.category_id)
                  .map(({ cat, depth }) => (
                    <SelectItem key={cat.category_id} value={cat.category_id}>
                      {depth ? "　└ " : ""}
                      {cat.category_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              ลบหมวดหมู่
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
