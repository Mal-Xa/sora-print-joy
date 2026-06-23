import { db, delay, uid } from "@/lib/mockDb";
import type { PrintJob, PrintJobStatus, Printer } from "@/types";

export const printerService = {
  async listPrinters(): Promise<Printer[]> {
    return delay([...db.printers], 150);
  },
  async listQueue(): Promise<PrintJob[]> {
    return delay([...db.printQueue], 150);
  },
  async sendPrint(input: { printerId: string; fileName: string }): Promise<PrintJob> {
    const job: PrintJob = {
      id: uid("j"),
      printerId: input.printerId,
      fileName: input.fileName,
      status: "waiting",
      queuedAt: new Date().toISOString(),
    };
    db.printQueue.unshift(job);
    return delay(job, 200);
  },
  async setJobStatus(id: string, status: PrintJobStatus): Promise<PrintJob> {
    const idx = db.printQueue.findIndex((j) => j.id === id);
    if (idx < 0) throw new Error("Job not found");
    db.printQueue[idx] = { ...db.printQueue[idx], status };
    return delay(db.printQueue[idx], 150);
  },
  async cancel(id: string): Promise<void> {
    const idx = db.printQueue.findIndex((j) => j.id === id);
    if (idx >= 0) db.printQueue.splice(idx, 1);
    return delay(undefined, 150);
  },
};
