"use server";

import type { AustralianState, ChildcareIntention } from "@/types/content";

export type TestLookaheadInput = {
  mode: "pregnancy" | "baby";
  weekNumber: number;
  state: AustralianState;
  firstChild: boolean;
  childcare: ChildcareIntention;
  includeUnpublished: boolean;
  childName?: string;
};

/**
 * @deprecated Prefer POSTing to /api/admin/test-lookahead from the client so
 * Node runtime receives Vercel Sensitive env vars reliably.
 */
export async function sendTestLookaheadEmail(
  _input: TestLookaheadInput,
): Promise<{ error?: string; success?: string }> {
  return {
    error: "Use /api/admin/test-lookahead for test sends.",
  };
}
