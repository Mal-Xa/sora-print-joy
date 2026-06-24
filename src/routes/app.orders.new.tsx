import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CreditCard, Smartphone, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WizardStepper } from "@/components/orders/WizardStepper";
import { FileDropzone } from "@/components/orders/FileDropzone";
import { PrintOptionsForm } from "@/components/orders/PrintOptionsForm";
import { ServicesForm } from "@/components/orders/ServicesForm";
import { PriceBreakdownCard } from "@/components/orders/PriceBreakdownCard";
import { useOrderWizard } from "@/hooks/useOrderWizard";
import { useAuth } from "@/hooks/useAuth";
import { pricingService } from "@/services/pricingService";
import { computePriceBreakdown } from "@/lib/pricing";
import { formatINR } from "@/lib/format";
import { orderService } from "@/services/orderService";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/orders/new")({
  head: () => ({ meta: [{ title: "New order — Sora Print Hub" }] }),
  component: NewOrderPage,
});

function NewOrderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { state, update, step, setStep, reset } = useOrderWizard();
  const { data: pricing } = useQuery({ queryKey: ["pricing"], queryFn: () => pricingService.get() });
  const [payment, setPayment] = useState<"upi" | "card" | "cod" | null>(null);
  const [upiId, setUpiId] = useState("");
  const [cardLast4, setCardLast4] = useState("");

  const breakdown = useMemo(() => {
    if (!pricing) return { lines: [], total: 0 };
    return computePriceBreakdown(
      {
        files: state.files.map(() => ({ pages: 10 })), // mock: assume 10 pages each
        printOptions: state.printOptions,
        lamination: state.laminationEnabled ? state.lamination : [],
        binding: state.binding,
      },
      pricing,
    );
  }, [pricing, state]);

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      return orderService.create({
        userId: user.id,
        customer: { name: user.fullName, phone: user.phone, email: user.email },
        files: state.files.map((f) => ({
          id: f.id,
          name: f.name,
          sizeBytes: f.sizeBytes,
          mimeType: f.mimeType,
          pages: 10,
          uploadedAt: new Date().toISOString(),
          ownerId: user.id,
        })),
        printOptions: state.printOptions,
        lamination: state.laminationEnabled ? state.lamination : [],
        binding: state.binding,
        specialInstructions: state.specialInstructions,
        total: breakdown.total,
      });
    },
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order placed!");
      reset();
      navigate({ to: "/app/orders/$id", params: { id: order.id } });
    },
    onError: () => toast.error("Couldn't place order. Try again."),
  });

  const canNext = () => {
    if (step === 1) return state.binding.mode === "binding_only" || state.files.length > 0;
    return true;
  };

  return (
    <>
      <PageHeader title="New order" description="Build your order in a few quick steps." />

      <WizardStepper step={step} onStep={(n) => n < step && setStep(n)} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-5">
          {step === 1 && (
            <Card>
              <CardContent className="space-y-4 p-5">
                <SectionTitle title="Upload files" subtitle="PDF, DOCX, PPTX, JPG, PNG" />
                <FileDropzone value={state.files} onChange={(files) => update({ files })} />
                {state.binding.mode === "binding_only" && (
                  <p className="text-xs text-muted-foreground">
                    You selected <span className="font-medium text-foreground">Spiral Binding Only</span> — no file upload needed.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <SectionTitle title="Printing options" subtitle="Choose how your documents should be printed." />
              <PrintOptionsForm
                value={state.printOptions}
                onChange={(printOptions) => update({ printOptions })}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <SectionTitle title="Additional services" subtitle="Add lamination or spiral binding." />
              <ServicesForm
                laminationEnabled={state.laminationEnabled}
                onLaminationEnabledChange={(laminationEnabled) => update({ laminationEnabled })}
                lamination={state.lamination}
                onLaminationChange={(lamination) => update({ lamination })}
                binding={state.binding}
                onBindingChange={(binding) => update({ binding })}
              />
            </div>
          )}

          {step === 4 && (
            <Card>
              <CardContent className="space-y-3 p-5">
                <SectionTitle title="Special instructions" subtitle="Anything else we should know?" />
                <Textarea
                  rows={8}
                  value={state.specialInstructions}
                  onChange={(e) => update({ specialInstructions: e.target.value })}
                  placeholder={`Front page should be color.\nPrint only pages 1-40.\nEnsure pages are in correct order.`}
                />
              </CardContent>
            </Card>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <SectionTitle title="Review your order" subtitle="Make sure everything looks right." />
              <Card>
                <CardContent className="space-y-4 p-5 text-sm">
                  <ReviewBlock title="Files">
                    {state.files.length === 0 ? (
                      <p className="text-muted-foreground">No files (binding only).</p>
                    ) : (
                      <ul className="space-y-0.5">
                        {state.files.map((f) => <li key={f.id} className="truncate">• {f.name}</li>)}
                      </ul>
                    )}
                  </ReviewBlock>
                  <Separator />
                  <ReviewBlock title="Printing">
                    <p>
                      {state.printOptions.type === "color" ? "Color" : "Black & White"} ·{" "}
                      {state.printOptions.side === "double" ? "Double-sided" : "Single-sided"} ·{" "}
                      {state.printOptions.copies} {state.printOptions.copies > 1 ? "copies" : "copy"} ·{" "}
                      {state.printOptions.paperSize}
                    </p>
                    <p className="text-muted-foreground">
                      Pages: {state.printOptions.pages.mode === "all" ? "All" : state.printOptions.pages.range ?? "—"}
                    </p>
                  </ReviewBlock>
                  {state.laminationEnabled && state.lamination.length > 0 && (
                    <>
                      <Separator />
                      <ReviewBlock title="Lamination">
                        <ul className="space-y-0.5">
                          {state.lamination.map((l, i) => (
                            <li key={i}>{l.type.replace("_", " ")} × {l.quantity}</li>
                          ))}
                        </ul>
                      </ReviewBlock>
                    </>
                  )}
                  {state.binding.mode !== "print_only" && (
                    <>
                      <Separator />
                      <ReviewBlock title="Binding">
                        <p>{state.binding.mode === "binding_only" ? "Spiral binding only" : "Print + spiral binding"}</p>
                      </ReviewBlock>
                    </>
                  )}
                  {state.specialInstructions && (
                    <>
                      <Separator />
                      <ReviewBlock title="Instructions">
                        <p className="whitespace-pre-line">{state.specialInstructions}</p>
                      </ReviewBlock>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < 5 ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
              >
                Continue <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
                <Check className="mr-1 h-4 w-4" />
                {submit.isPending ? "Placing…" : "Submit order"}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <PriceBreakdownCard breakdown={breakdown} />
          <Card>
            <CardContent className="space-y-1 p-5 text-xs text-muted-foreground">
              <p className="font-semibold uppercase tracking-wider">Pickup</p>
              <p>You'll be notified when your order is ready. Most orders are ready within 2 hours.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
