import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, CheckCircle2, Printer as PrinterIcon, PackageCheck, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { orderService } from "@/services/orderService";
import { formatBytes, formatDateTime, formatINR } from "@/lib/format";
import { downloadInvoice } from "@/lib/invoice";
import type { OrderStatus } from "@/types";

export const Route = createFileRoute("/admin/orders/$id")({
  head: () => ({ meta: [{ title: "Order — Admin · Sora Print Hub" }] }),
  component: AdminOrderDetail,
});

const NEXT_STATUS: Partial<Record<OrderStatus, { next: OrderStatus; label: string; icon: typeof Check }>> = {
  pending: { next: "accepted", label: "Accept order", icon: Check },
  accepted: { next: "printing", label: "Start printing", icon: PrinterIcon },
  printing: { next: "ready", label: "Mark ready", icon: CheckCircle2 },
  ready: { next: "completed", label: "Complete order", icon: PackageCheck },
  awaiting_delivery: { next: "printing", label: "Pages received — start printing", icon: PrinterIcon },
};

function AdminOrderDetail() {
  const { id } = useParams({ from: "/admin/orders/$id" });
  const qc = useQueryClient();
  const { data: order, isLoading } = useQuery({
    queryKey: ["orders", "detail", id],
    queryFn: () => orderService.get(id),
  });
  const update = useMutation({
    mutationFn: (next: OrderStatus) => orderService.updateStatus(id, next),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order updated");
    },
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!order) return <p className="text-muted-foreground">Order not found.</p>;

  const next = NEXT_STATUS[order.status];

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/admin/orders"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link>
      </Button>
      <PageHeader
        title={`Order ${order.id}`}
        description={`Placed on ${formatDateTime(order.createdAt)}`}
        actions={<OrderStatusBadge status={order.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Customer</h3>
              <div className="mt-3 grid gap-1 text-sm">
                <p className="font-medium">{order.customer.name}</p>
                <p className="text-muted-foreground">{order.customer.phone}</p>
                <p className="text-muted-foreground">{order.customer.email}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Files</h3>
              {order.files.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Binding-only order — pages provided by customer.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {order.files.map((f) => (
                    <li key={f.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{f.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(f.sizeBytes)}{f.pages ? ` · ${f.pages} pages` : ""}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => toast.message(`Preview: ${f.name}`)}>
                        View
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5 text-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Print settings</h3>
              <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {[
                  ["Type", order.printOptions.type === "color" ? "Color" : "Black & White"],
                  ["Side", order.printOptions.side === "double" ? "Double-sided" : "Single-sided"],
                  ["Copies", String(order.printOptions.copies)],
                  ["Paper", order.printOptions.paperSize],
                  ["Pages", order.printOptions.pages.mode === "all" ? "All" : order.printOptions.pages.range ?? "Custom"],
                  ["Front cover color", order.printOptions.frontCoverColor ? "Yes" : "No"],
                  ["Back cover color", order.printOptions.backCoverColor ? "Yes" : "No"],
                  ["Remove blanks", order.printOptions.removeBlankPages ? "Yes" : "No"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-border/60 pb-1.5">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {(order.lamination.length > 0 || order.binding.mode !== "print_only") && (
            <Card>
              <CardContent className="space-y-3 p-5 text-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Services</h3>
                {order.lamination.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Lamination</p>
                    <ul>
                      {order.lamination.map((l, i) => (
                        <li key={i}>{l.type.replace("_", " ")} × {l.quantity}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {order.binding.mode !== "print_only" && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Binding</p>
                    <p>{order.binding.mode === "binding_only" ? "Spiral binding only" : "Print + spiral binding"}</p>
                    {order.binding.documentCount && (
                      <p className="text-xs text-muted-foreground">
                        {order.binding.documentCount} document(s) · {order.binding.estimatedPages ?? "—"} est. pages
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {order.specialInstructions && (
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Special instructions</h3>
                <p className="mt-2 whitespace-pre-line text-sm">{order.specialInstructions}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Summary</h3>
                <p className="mt-3 text-2xl font-bold text-primary">{formatINR(order.total)}</p>
              </div>
              <div className="space-y-2">
                {next && (
                  <Button className="w-full" disabled={update.isPending} onClick={() => update.mutate(next.next)}>
                    <next.icon className="mr-2 h-4 w-4" /> {next.label}
                  </Button>
                )}
                {order.status !== "completed" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={update.isPending}
                    onClick={() => update.mutate("completed")}
                  >
                    Force complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
