export type Role = "user" | "admin";

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

export type OrderStatus =
  | "pending"
  | "accepted"
  | "printing"
  | "ready"
  | "completed"
  | "awaiting_delivery";

export type PrintType = "bw" | "color";
export type PrintSide = "single" | "double";
export type BindingMode = "print_only" | "print_and_binding" | "binding_only";
export type LaminationType = "id_card" | "aadhaar" | "pan" | "certificate" | "a4";

export interface StoredFile {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  pages?: number;
  uploadedAt: string;
  ownerId: string;
  /** object URL for mock preview; not persisted on a real backend */
  url?: string;
}

export interface PrintOptions {
  type: PrintType;
  side: PrintSide;
  copies: number;
  paperSize: "A4";
  pages: { mode: "all" | "custom"; range?: string };
  frontCoverColor: boolean;
  backCoverColor: boolean;
  removeBlankPages: boolean;
}

export interface LaminationItem {
  type: LaminationType;
  quantity: number;
}

export interface BindingOptions {
  mode: BindingMode;
  /** for binding_only */
  documentCount?: number;
  estimatedPages?: number;
}

export interface Order {
  id: string;
  userId: string;
  customer: { name: string; phone: string; email: string };
  files: StoredFile[];
  printOptions: PrintOptions;
  lamination: LaminationItem[];
  binding: BindingOptions;
  specialInstructions?: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface Pricing {
  bwPage: number;
  colorPage: number;
  frontCoverColor: number;
  backCoverColor: number;
  passportSheet: number;
  lamination: Record<LaminationType, number>;
  spiralBinding: number;
}

export interface PassportSheet {
  id: string;
  userId: string;
  template: "passport" | "visa" | "id";
  photoUrl?: string;
  createdAt: string;
  photosPerSheet: number;
}

export type PrinterStatus = "online" | "offline" | "busy";
export type PrintJobStatus = "waiting" | "printing" | "printed" | "failed";

export interface Printer {
  id: string;
  name: string;
  model: string;
  color: boolean;
  status: PrinterStatus;
}

export interface PrintJob {
  id: string;
  fileName: string;
  printerId: string;
  status: PrintJobStatus;
  queuedAt: string;
}
