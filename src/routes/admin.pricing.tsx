import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { pricingService } from "@/services/pricingService";
import type { Pricing } from "@/types";

export const Route = createFileRoute("/admin/pricing")({
  head: () => ({ meta: [{ title: "Pricing — Admin · Sora Print Hub" }] }),
  component: PricingPage,
});

function PricingPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["pricing"], queryFn: () => pricingService.get() });
  const [draft, setDraft] = useState<Pricing | null>(null);

  useEffect(() => {
    if (data && !draft) setDraft(data);
  }, [data, draft]);

  const save = useMutation({
    mutationFn: (next: Pricing) => pricingService.update(next),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pricing"] });
      toast.success("Pricing updated");
    },
  });

  if (isLoading || !draft) {
    return (
      <>
        <PageHeader title="Pricing" description="Manage what customers are charged. All prices in ₹." />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  const numberField = (
    label: string,
    value: number,
    onChange: (n: number) => void,
    id: string,
  ) => (
    <div className="space-y-1.5" key={id}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-sm text-muted-foreground">₹</span>
        <Input
          id={id}
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value || "0")))}
          className="pl-7"
        />
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Pricing"
        description="All amounts in INR (₹). Changes apply to new orders only."
        actions={
          <Button onClick={() => save.mutate(draft)} disabled={save.isPending}>
            <Save className="mr-2 h-4 w-4" /> {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        }
      />

      <Card>
        <CardContent className="grid gap-6 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {numberField("B&W page", draft.bwPage, (n) => setDraft({ ...draft, bwPage: n }), "bw")}
          {numberField("Color page", draft.colorPage, (n) => setDraft({ ...draft, colorPage: n }), "color")}
          {numberField("Front cover color", draft.frontCoverColor, (n) => setDraft({ ...draft, frontCoverColor: n }), "fcc")}
          {numberField("Back cover color", draft.backCoverColor, (n) => setDraft({ ...draft, backCoverColor: n }), "bcc")}
          {numberField("Passport photo sheet", draft.passportSheet, (n) => setDraft({ ...draft, passportSheet: n }), "ps")}
          {numberField("Spiral binding", draft.spiralBinding, (n) => setDraft({ ...draft, spiralBinding: n }), "sb")}
        </CardContent>
      </Card>

      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Lamination</h2>
      <Card>
        <CardContent className="grid gap-6 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {numberField("ID Card", draft.lamination.id_card, (n) => setDraft({ ...draft, lamination: { ...draft.lamination, id_card: n } }), "lid")}
          {numberField("Aadhaar Card", draft.lamination.aadhaar, (n) => setDraft({ ...draft, lamination: { ...draft.lamination, aadhaar: n } }), "laad")}
          {numberField("PAN Card", draft.lamination.pan, (n) => setDraft({ ...draft, lamination: { ...draft.lamination, pan: n } }), "lpan")}
          {numberField("Certificate", draft.lamination.certificate, (n) => setDraft({ ...draft, lamination: { ...draft.lamination, certificate: n } }), "lcert")}
          {numberField("A4 Document", draft.lamination.a4, (n) => setDraft({ ...draft, lamination: { ...draft.lamination, a4: n } }), "la4")}
        </CardContent>
      </Card>
    </>
  );
}
