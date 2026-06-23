import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Printer as PrinterIcon, RotateCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { printerService } from "@/services/printerService";
import { cn } from "@/lib/utils";
import type { PrintJobStatus } from "@/types";

export const Route = createFileRoute("/admin/printers")({
  head: () => ({ meta: [{ title: "Printers — Admin · Sora Print Hub" }] }),
  component: PrintersPage,
});

function PrintersPage() {
  const qc = useQueryClient();
  const printers = useQuery({ queryKey: ["printers"], queryFn: () => printerService.listPrinters() });
  const queue = useQuery({ queryKey: ["printQueue"], queryFn: () => printerService.listQueue() });

  const send = useMutation({
    mutationFn: (input: { printerId: string; fileName: string }) => printerService.sendPrint(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["printQueue"] });
      toast.success("Job queued");
    },
  });

  const cancel = useMutation({
    mutationFn: (id: string) => printerService.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["printQueue"] });
      toast.success("Job cancelled");
    },
  });

  return (
    <>
      <PageHeader title="Printers" description="Direct printing & live queue." />

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Available printers</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {printers.isLoading ? (
          <>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </>
        ) : (
          printers.data?.map((p) => (
            <Card key={p.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                      <PrinterIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.color ? "Color" : "Monochrome"} · {p.model}</p>
                    </div>
                  </div>
                  <StatusDot status={p.status} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => toast.message(`Preview last file from ${p.name}`)}>
                    <Eye className="mr-1 h-4 w-4" /> View file
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => send.mutate({ printerId: p.id, fileName: "Current_Order.pdf" })}
                    disabled={send.isPending}
                  >
                    <PrinterIcon className="mr-1 h-4 w-4" /> Print
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => send.mutate({ printerId: p.id, fileName: "Reprint.pdf" })}>
                    <RotateCw className="mr-1 h-4 w-4" /> Reprint
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Print queue</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {queue.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
        ) : (
          queue.data?.map((j) => (
            <Card key={j.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-medium">{j.fileName}</p>
                  <JobBadge status={j.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {printers.data?.find((p) => p.id === j.printerId)?.name ?? j.printerId}
                </p>
                <div className="flex justify-end">
                  {j.status === "waiting" || j.status === "printing" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => cancel.mutate(j.id)}
                    >
                      <XCircle className="mr-1 h-4 w-4" /> Cancel
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => send.mutate({ printerId: j.printerId, fileName: j.fileName })}>
                      <RotateCw className="mr-1 h-4 w-4" /> Reprint
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}

function StatusDot({ status }: { status: "online" | "offline" | "busy" }) {
  const map = {
    online: { label: "Online", className: "bg-success/15 text-success border-success/30" },
    busy: { label: "Busy", className: "bg-warning/20 text-warning-foreground border-warning/30" },
    offline: { label: "Offline", className: "bg-muted text-muted-foreground border-border" },
  } as const;
  const m = map[status];
  return <Badge variant="outline" className={cn(m.className)}>{m.label}</Badge>;
}

function JobBadge({ status }: { status: PrintJobStatus }) {
  const map: Record<PrintJobStatus, { label: string; className: string }> = {
    waiting: { label: "Waiting", className: "bg-muted text-muted-foreground border-border" },
    printing: { label: "Printing", className: "bg-primary/15 text-primary border-primary/30" },
    printed: { label: "Printed", className: "bg-success/15 text-success border-success/30" },
    failed: { label: "Failed", className: "bg-destructive/15 text-destructive border-destructive/30" },
  };
  const m = map[status];
  return <Badge variant="outline" className={cn(m.className)}>{m.label}</Badge>;
}
