import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Camera, Crop, Move, RotateCw, ZoomIn, Image as ImageIcon, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { passportService } from "@/services/passportService";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/passport")({
  head: () => ({ meta: [{ title: "Passport Photos — Sora Print Hub" }] }),
  component: PassportPage,
});

type Template = "passport" | "visa" | "id";

const TEMPLATES: { id: Template; label: string; size: string }[] = [
  { id: "passport", label: "Passport Photo", size: "35×45 mm" },
  { id: "visa", label: "Visa Photo", size: "51×51 mm" },
  { id: "id", label: "ID Photo", size: "25×35 mm" },
];

function PassportPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [template, setTemplate] = useState<Template>("passport");
  const { data: sheets } = useQuery({
    queryKey: ["passport", user?.id],
    queryFn: () => passportService.list(user?.id),
    enabled: Boolean(user),
  });

  const save = useMutation({
    mutationFn: () =>
      passportService.save({
        userId: user!.id,
        template,
        photoUrl: photoUrl ?? undefined,
        photosPerSheet: 9,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["passport"] });
      toast.success("Sheet saved to your library");
    },
  });

  return (
    <>
      <PageHeader
        title="Passport photo creator"
        description="Upload a photo, pick a template and we'll lay out a print-ready sheet."
        actions={
          <Button asChild variant="outline">
            <Link to="/app/passport/saved">Saved sheets</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {/* Upload */}
          <Card>
            <CardContent className="p-5">
              <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-border bg-card p-6 text-center transition hover:border-primary/60">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setPhotoUrl(URL.createObjectURL(f));
                  }}
                />
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Camera className="h-6 w-6" />
                </div>
                <p className="mt-3 font-medium">{photoUrl ? "Replace photo" : "Upload your photo"}</p>
                <p className="text-xs text-muted-foreground">JPG or PNG, well-lit, plain background</p>
              </label>
            </CardContent>
          </Card>

          {/* Editor */}
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Editor</h3>
                <div className="flex gap-1">
                  {[
                    { icon: Crop, label: "Crop" },
                    { icon: ZoomIn, label: "Zoom" },
                    { icon: Move, label: "Move" },
                    { icon: RotateCw, label: "Rotate" },
                  ].map((t) => (
                    <Button
                      key={t.label}
                      type="button"
                      variant="ghost"
                      size="sm"
                      title={`${t.label} (coming soon)`}
                      onClick={() => toast.message(`${t.label} controls coming soon`)}
                    >
                      <t.icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-muted">
                {photoUrl ? (
                  <img src={photoUrl} alt="Uploaded preview" className="h-full w-full object-contain" />
                ) : (
                  <div className="text-center text-sm text-muted-foreground">
                    <ImageIcon className="mx-auto h-8 w-8" />
                    <p className="mt-2">Upload a photo to start editing</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Templates */}
          <Card>
            <CardContent className="space-y-3 p-5">
              <h3 className="font-semibold">Templates</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    className={cn(
                      "rounded-xl border bg-card p-4 text-left transition",
                      template === t.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <p className="font-medium">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.size}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview / actions */}
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-5">
              <div>
                <h3 className="font-semibold">Sheet preview</h3>
                <p className="text-xs text-muted-foreground">4×6 inch · 9 photos · cutting guides</p>
              </div>
              <SheetPreview photoUrl={photoUrl} />
            </CardContent>
          </Card>
          <div className="space-y-2">
            <Button className="w-full" disabled={!photoUrl || save.isPending} onClick={() => save.mutate()}>
              <Save className="mr-2 h-4 w-4" /> Save sheet
            </Button>
            <Button asChild variant="outline" className="w-full" disabled={!photoUrl}>
              <Link to="/app/orders/new"><Plus className="mr-2 h-4 w-4" /> Add to print order</Link>
            </Button>
          </div>
          {sheets && sheets.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              You have {sheets.length} saved {sheets.length === 1 ? "sheet" : "sheets"}.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function SheetPreview({ photoUrl }: { photoUrl: string | null }) {
  return (
    <div className="mx-auto aspect-[4/6] w-full max-w-[240px] rounded-md border-2 border-dashed border-muted-foreground/40 bg-card p-2">
      <div className="grid h-full grid-cols-3 grid-rows-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-sm border border-dashed border-muted-foreground/40 bg-muted"
          >
            {photoUrl ? (
              <img src={photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-[9px] text-muted-foreground">
                {i + 1}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
