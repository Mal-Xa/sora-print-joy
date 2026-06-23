import { db, delay, mockUsers } from "@/lib/mockDb";
import type { User } from "@/types";

const STORAGE_KEY = "sora.session";

export interface Session {
  user: User;
  token: string;
}

function persist(session: Session | null) {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(STORAGE_KEY);
}

function read(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export const authService = {
  async getSession(): Promise<Session | null> {
    return delay(read(), 100);
  },
  async login(email: string, _password: string): Promise<Session> {
    const user =
      mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) ??
      mockUsers[0];
    const session: Session = { user, token: `mock_${user.id}` };
    persist(session);
    return delay(session, 300);
  },
  async loginAsAdmin(): Promise<Session> {
    const admin = mockUsers.find((u) => u.role === "admin")!;
    const session: Session = { user: admin, token: `mock_${admin.id}` };
    persist(session);
    return delay(session, 200);
  },
  async register(input: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
  }): Promise<Session> {
    const newUser: User = {
      id: `u_${Date.now()}`,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      role: "user",
    };
    db.users.push(newUser);
    const session: Session = { user: newUser, token: `mock_${newUser.id}` };
    persist(session);
    return delay(session, 400);
  },
  async logout(): Promise<void> {
    persist(null);
    return delay(undefined, 100);
  },
  async forgotPassword(_email: string): Promise<void> {
    return delay(undefined, 400);
  },
  async updateProfile(patch: Partial<Pick<User, "fullName" | "phone" | "email">>): Promise<User> {
    const session = read();
    if (!session) throw new Error("Not authenticated");
    const updated: User = { ...session.user, ...patch };
    persist({ ...session, user: updated });
    const idx = db.users.findIndex((u) => u.id === updated.id);
    if (idx >= 0) db.users[idx] = updated;
    return delay(updated, 250);
  },
};
