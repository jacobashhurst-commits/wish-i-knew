import { describe, expect, it, vi } from "vitest";
import { isAuthRequired, isBetaInviteOnly, isPublicPath } from "@/lib/launch/config";
import { normalizeLookaheadTime, lookaheadTimeForUi } from "@/lib/launch/timezone";

describe("launch config", () => {
  it("treats explicit WIK_REQUIRE_AUTH=true as required", () => {
    vi.stubEnv("WIK_REQUIRE_AUTH", "true");
    expect(isAuthRequired()).toBe(true);
    vi.unstubAllEnvs();
  });

  it("allows preview when WIK_REQUIRE_AUTH=false", () => {
    vi.stubEnv("WIK_REQUIRE_AUTH", "false");
    expect(isAuthRequired()).toBe(false);
    vi.unstubAllEnvs();
  });

  it("recognises public paths", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/privacy")).toBe(true);
    expect(isPublicPath("/api/cron/weekly-lookahead")).toBe(true);
    expect(isPublicPath("/")).toBe(false);
  });

  it("defaults beta invite only to false in test env", () => {
    expect(isBetaInviteOnly()).toBe(false);
  });
});

describe("lookahead time helpers", () => {
  it("normalises times to the hour for cron matching", () => {
    expect(normalizeLookaheadTime("08:30")).toBe("08:00:00");
    expect(normalizeLookaheadTime("8")).toBe("08:00:00");
  });

  it("formats db times for the UI", () => {
    expect(lookaheadTimeForUi("08:00:00")).toBe("08:00");
    expect(lookaheadTimeForUi(null)).toBe("08:00");
  });
});
