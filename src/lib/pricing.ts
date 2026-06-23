import type {
  BindingOptions,
  LaminationItem,
  Order,
  PrintOptions,
  Pricing,
  StoredFile,
} from "@/types";

interface ComputeInput {
  files: Pick<StoredFile, "pages">[];
  printOptions: PrintOptions;
  lamination: LaminationItem[];
  binding: BindingOptions;
}

export interface PriceLine {
  label: string;
  amount: number;
}

export interface PriceBreakdown {
  lines: PriceLine[];
  total: number;
}

function totalPages(files: Pick<StoredFile, "pages">[]): number {
  return files.reduce((sum, f) => sum + (f.pages ?? 1), 0);
}

function pagesFromRange(range: string, max: number): number {
  // "1-40, 45, 50-52"
  let count = 0;
  for (const part of range.split(",").map((s) => s.trim()).filter(Boolean)) {
    const [a, b] = part.split("-").map((n) => parseInt(n, 10));
    if (!isNaN(a) && !isNaN(b)) count += Math.max(0, b - a + 1);
    else if (!isNaN(a)) count += 1;
  }
  return Math.min(count, max);
}

export function computePriceBreakdown(
  input: ComputeInput,
  pricing: Pricing,
): PriceBreakdown {
  const lines: PriceLine[] = [];
  const tp = totalPages(input.files);
  const selectedPages =
    input.printOptions.pages.mode === "custom" && input.printOptions.pages.range
      ? pagesFromRange(input.printOptions.pages.range, tp || 9999)
      : tp;

  const copies = Math.max(1, input.printOptions.copies);

  if (input.binding.mode !== "binding_only" && selectedPages > 0) {
    const perPage =
      input.printOptions.type === "color" ? pricing.colorPage : pricing.bwPage;
    const printing = perPage * selectedPages * copies;
    lines.push({
      label: `Printing (${selectedPages} pages × ${copies})`,
      amount: printing,
    });

    if (input.printOptions.frontCoverColor) {
      lines.push({ label: "Front cover (color)", amount: pricing.frontCoverColor * copies });
    }
    if (input.printOptions.backCoverColor) {
      lines.push({ label: "Back cover (color)", amount: pricing.backCoverColor * copies });
    }
  }

  for (const lam of input.lamination) {
    if (lam.quantity > 0) {
      const unit = pricing.lamination[lam.type];
      lines.push({
        label: `Lamination — ${lam.type.replace("_", " ")} × ${lam.quantity}`,
        amount: unit * lam.quantity,
      });
    }
  }

  if (input.binding.mode === "print_and_binding") {
    lines.push({ label: "Spiral binding", amount: pricing.spiralBinding * copies });
  } else if (input.binding.mode === "binding_only") {
    const docs = Math.max(1, input.binding.documentCount ?? 1);
    lines.push({
      label: `Spiral binding × ${docs}`,
      amount: pricing.spiralBinding * docs,
    });
  }

  const total = lines.reduce((s, l) => s + l.amount, 0);
  return { lines, total };
}

export function computeOrderTotal(order: Order, pricing: Pricing): number {
  return computePriceBreakdown(order, pricing).total;
}
