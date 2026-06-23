import { db, delay, uid } from "@/lib/mockDb";
import type { PassportSheet } from "@/types";

export const passportService = {
  async list(userId?: string): Promise<PassportSheet[]> {
    const list = userId ? db.passportSheets.filter((p) => p.userId === userId) : db.passportSheets;
    return delay([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), 200);
  },
  async save(input: Omit<PassportSheet, "id" | "createdAt">): Promise<PassportSheet> {
    const sheet: PassportSheet = {
      ...input,
      id: uid("ps"),
      createdAt: new Date().toISOString(),
    };
    db.passportSheets.unshift(sheet);
    return delay(sheet, 300);
  },
  async delete(id: string): Promise<void> {
    const idx = db.passportSheets.findIndex((p) => p.id === id);
    if (idx >= 0) db.passportSheets.splice(idx, 1);
    return delay(undefined, 150);
  },
};
