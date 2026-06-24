import { db, delay, persistDb, uid } from "@/lib/mockDb";
import type { StoredFile } from "@/types";

export const fileService = {
  async list(userId?: string): Promise<StoredFile[]> {
    const list = userId ? db.files.filter((f) => f.ownerId === userId) : db.files;
    return delay([...list].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)), 200);
  },
  async upload(file: File, userId: string): Promise<StoredFile> {
    const stored: StoredFile = {
      id: uid("f"),
      name: file.name,
      sizeBytes: file.size,
      mimeType: file.type || "application/octet-stream",
      pages: undefined,
      uploadedAt: new Date().toISOString(),
      ownerId: userId,
      url: typeof URL !== "undefined" ? URL.createObjectURL(file) : undefined,
    };
    db.files.unshift(stored);
    persistDb();
    return delay(stored, 300);
  },
  async delete(id: string): Promise<void> {
    const idx = db.files.findIndex((f) => f.id === id);
    if (idx >= 0) {
      db.files.splice(idx, 1);
      persistDb();
    }
    return delay(undefined, 150);
  },
};
