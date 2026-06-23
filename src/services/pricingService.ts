import { db, delay } from "@/lib/mockDb";
import type { Pricing } from "@/types";

export { computePriceBreakdown, computeOrderTotal } from "@/lib/pricing";
export type { PriceBreakdown, PriceLine } from "@/lib/pricing";

export const pricingService = {
  async get(): Promise<Pricing> {
    return delay({ ...db.pricing }, 100);
  },
  async update(next: Pricing): Promise<Pricing> {
    db.pricing = { ...next };
    return delay({ ...db.pricing }, 200);
  },
};
