"use server";

import { trackOrderByCode, type TrackingResult } from "@/lib/tracking";

export type { TrackingResult };

export async function trackOrder(code: string): Promise<TrackingResult> {
  return trackOrderByCode(code);
}
