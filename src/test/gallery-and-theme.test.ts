import { describe, expect, it } from "vitest";
import { galleryStore } from "@/lib/gallery/store";
import { formatImageCopy } from "@/lib/gallery/types";
import { themeStore } from "@/lib/theme/theme-store";

describe("Image Gallery Store & Copy Formatter", () => {
  it("formats image copy into direct URL, markdown, and HTML correctly", () => {
    const mockImage = {
      id: "test-1",
      title: "วิธีดู UID",
      file_name: "uid.png",
      url: "https://example.com/uid.png",
      category: "บัญชีผู้ใช้/UID",
      tags: ["UID", "บัญชี"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(formatImageCopy(mockImage, "url")).toBe("https://example.com/uid.png");
    expect(formatImageCopy(mockImage, "markdown")).toBe(
      "![วิธีดู UID](https://example.com/uid.png)",
    );
    expect(formatImageCopy(mockImage, "html")).toBe(
      '<img src="https://example.com/uid.png" alt="วิธีดู UID" loading="lazy" />',
    );
  });

  it("can add, update, and delete an image in gallery store", () => {
    const newImg = galleryStore.addImage({
      title: "ใบเสร็จโอนเงินทดสอบ",
      file_name: "receipt.png",
      url: "data:image/png;base64,sample",
      category: "การเงิน/เติมเงิน",
      tags: ["สลิป", "ทดสอบ"],
      dimensions: "800 × 600",
    });

    expect(newImg.id).toBeDefined();
    let current = galleryStore.getSnapshot();
    expect(current.images.some((i) => i.id === newImg.id)).toBe(true);

    // Update
    galleryStore.updateImage(newImg.id, { title: "ใบเสร็จโอนเงินแก้ไขแล้ว" });
    current = galleryStore.getSnapshot();
    const updated = current.images.find((i) => i.id === newImg.id);
    expect(updated?.title).toBe("ใบเสร็จโอนเงินแก้ไขแล้ว");

    // Delete
    galleryStore.deleteImage(newImg.id);
    current = galleryStore.getSnapshot();
    expect(current.images.some((i) => i.id === newImg.id)).toBe(false);
  });
});

describe("Theme & Font Store", () => {
  it("updates theme mode, color preset, and font preferences", () => {
    themeStore.setMode("dark");
    expect(themeStore.getSnapshot().mode).toBe("dark");

    themeStore.setColorPreset("violet");
    expect(themeStore.getSnapshot().colorPreset).toBe("violet");

    themeStore.setFontSans('"Prompt", sans-serif');
    expect(themeStore.getSnapshot().fontSans).toBe('"Prompt", sans-serif');

    themeStore.reset();
    expect(themeStore.getSnapshot().mode).toBe("light");
    expect(themeStore.getSnapshot().colorPreset).toBe("teal");
  });
});

describe("Role-Based Access Control (RBAC) & Permissions", () => {
  it("enforces Owner can edit and Viewer can copy only", async () => {
    const { can } = await import("@/lib/faq/types");

    // Owner rights: Full control
    expect(can("owner", "edit")).toBe(true);
    expect(can("owner", "delete")).toBe(true);
    expect(can("owner", "manageCategories")).toBe(true);
    expect(can("owner", "manageGallery")).toBe(true);
    expect(can("owner", "import")).toBe(true);
    expect(can("owner", "settings")).toBe(true);
    expect(can("owner", "copy")).toBe(true);

    // Viewer rights: Copy only!
    expect(can("viewer", "copy")).toBe(true);
    expect(can("viewer", "edit")).toBe(false);
    expect(can("viewer", "delete")).toBe(false);
    expect(can("viewer", "manageCategories")).toBe(false);
    expect(can("viewer", "manageGallery")).toBe(false);
    expect(can("viewer", "import")).toBe(false);
    expect(can("viewer", "settings")).toBe(false);
  });

  it("handles instant role switching for Owner and Viewer", async () => {
    const { authStore } = await import("@/lib/auth/auth-store");

    await authStore.loginAs("owner");
    expect(authStore.getSnapshot().role).toBe("owner");

    await authStore.loginAs("viewer");
    expect(authStore.getSnapshot().role).toBe("viewer");

    // Setting multiple owner emails
    authStore.setOwnerEmail("aumaoyaoao@gmail.com, second.owner@gaming.com");
    expect(authStore.getSnapshot().ownerEmail).toContain("second.owner@gaming.com");

    await authStore.signOut();
    expect(authStore.getSnapshot().user).toBeNull();
  });
});
