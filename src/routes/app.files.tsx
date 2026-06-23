import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, File as FileIcon, Plus, Trash2, FolderOpen, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { fileService } from "@/services/fileService";
import { formatBytes, formatDate } from "@/lib/format";

export const Route = createFileRoute("/app/files")({
  head: () => ({ meta: [{ title: "My Files — Sora Print Hub" }] }),
  component: FilesPage,
});

function FilesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["files", user?.id],
    queryFn: () => fileService.list(user?.id),
    enabled: Boolean(user),
  });
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const del = useMutation({
    mutationFn: (id: string) => fileService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["files"] });
      toast.success("File deleted");
    },
  });

  return (
    <>
      <PageHeader
        title="My files"
        description="Files you've uploaded for previous orders."
        actions={
          <Button asChild>
            <Link to="/app/orders/new"><Plus className="mr-2 h-4 w-4" /> Upload</Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-5 w-5" />}
          title="No saved files yet"
          description="When you upload files for an order, they'll appear here."
          action={<Button asChild><Link to="/app/orders/new">Upload a file</Link></Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((f) => (
            <Card key={f.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <FileIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(f.sizeBytes)} · {formatDate(f.uploadedAt)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => toast.message(`Preview: ${f.name}`)}>
                      <Eye className="mr-1 h-3.5 w-3.5" /> View
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => toast.success("Download started")}>
                      <Download className="mr-1 h-3.5 w-3.5" /> Download
                    </Button>
                    <Button asChild size="sm" variant="ghost" className="h-8 px-2">
                      <Link to="/app/orders/new"><Printer className="mr-1 h-3.5 w-3.5" /> Reprint</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-destructive hover:text-destructive"
                      onClick={() => setPendingDelete(f.id)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) del.mutate(pendingDelete);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
