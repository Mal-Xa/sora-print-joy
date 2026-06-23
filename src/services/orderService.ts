import { db, delay, uid } from "@/lib/mockDb";
import type { Order, OrderStatus } from "@/types";

export const orderService = {
  async list(userId?: string): Promise<Order[]> {
    const list = userId ? db.orders.filter((o) => o.userId === userId) : db.orders;
    return delay([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), 200);
  },
  async get(id: string): Promise<Order | undefined> {
    return delay(db.orders.find((o) => o.id === id), 150);
  },
  async create(input: Omit<Order, "id" | "createdAt" | "updatedAt" | "status">): Promise<Order> {
    const now = new Date().toISOString();
    const order: Order = {
      ...input,
      id: `SPH-${1000 + db.orders.length + 1}`,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    db.orders.unshift(order);
    return delay(order, 400);
  },
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const idx = db.orders.findIndex((o) => o.id === id);
    if (idx < 0) throw new Error("Order not found");
    db.orders[idx] = { ...db.orders[idx], status, updatedAt: new Date().toISOString() };
    return delay(db.orders[idx], 200);
  },
  async stats(userId?: string) {
    const list = userId ? db.orders.filter((o) => o.userId === userId) : db.orders;
    const active = list.filter((o) =>
      ["pending", "accepted", "printing", "awaiting_delivery"].includes(o.status),
    ).length;
    const completed = list.filter((o) => o.status === "completed").length;
    return delay({ active, completed, total: list.length }, 100);
  },
  // unused but keeps `uid` referenced for future mock writes
  _uid: uid,
};
