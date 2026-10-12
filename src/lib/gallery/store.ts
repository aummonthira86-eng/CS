import { useSyncExternalStore } from "react";
import type { GalleryImage } from "./types";
import { seedGalleryImages } from "./seed";

const GALLERY_STORAGE_KEY = "faq-mgmt:gallery-images:v1";

export interface GalleryState {
  loaded: boolean;
  images: GalleryImage[];
}

const SERVER_SNAPSHOT: GalleryState = {
  loaded: false,
  images: [],
};

let cachedState: GalleryState | null = null;
const listeners = new Set<() => void>();

function loadFromStorage(): GalleryImage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GALLERY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as GalleryImage[];
    return null;
  } catch {
    return null;
  }
}

function saveToStorage(images: GalleryImage[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(images));
  } catch (e) {
    console.error("Failed to save gallery to localStorage", e);
  }
}

function ensureState(): GalleryState {
  if (!cachedState) {
    const loaded = loadFromStorage();
    const images = loaded ?? seedGalleryImages();
    cachedState = {
      loaded: true,
      images,
    };
    if (!loaded) {
      saveToStorage(images);
    }
  }
  return cachedState;
}

function commit(nextImages: GalleryImage[]) {
  cachedState = {
    loaded: true,
    images: nextImages,
  };
  saveToStorage(nextImages);
  listeners.forEach((l) => l());
}

export const galleryStore = {
  subscribe(callback: () => void) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },
  getSnapshot(): GalleryState {
    return ensureState();
  },
  getServerSnapshot(): GalleryState {
    return SERVER_SNAPSHOT;
  },

  addImage(input: Omit<GalleryImage, "id" | "created_at" | "updated_at">): GalleryImage {
    const now = new Date().toISOString();
    const newImage: GalleryImage = {
      ...input,
      id: `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      created_at: now,
      updated_at: now,
    };
    const s = ensureState();
    commit([newImage, ...s.images]);
    return newImage;
  },

  updateImage(id: string, patch: Partial<Omit<GalleryImage, "id" | "created_at">>): void {
    const s = ensureState();
    const now = new Date().toISOString();
    const next = s.images.map((item) =>
      item.id === id
        ? {
            ...item,
            ...patch,
            updated_at: now,
          }
        : item,
    );
    commit(next);
  },

  deleteImage(id: string): void {
    const s = ensureState();
    commit(s.images.filter((img) => img.id !== id));
  },

  reset(): void {
    const initial = seedGalleryImages();
    commit(initial);
  },
};

export function useGallery(): GalleryState {
  return useSyncExternalStore(
    galleryStore.subscribe,
    galleryStore.getSnapshot,
    galleryStore.getServerSnapshot,
  );
}
