import { describe, expect, it } from "vitest";
import { getRecruitmentNegotiationProfile } from "./recruitment";

describe("getRecruitmentNegotiationProfile", () => {
  it("gives every rarity a hiring negotiation", () => {
    expect(getRecruitmentNegotiationProfile("common").stepLabels).toContain("조건 보기");
    expect(getRecruitmentNegotiationProfile("rare").minPct).toBeGreaterThan(100);
  });

  it("adds more interesting negotiation elements for epic and legendary talent", () => {
    const epic = getRecruitmentNegotiationProfile("epic");
    const legendary = getRecruitmentNegotiationProfile("legendary");

    expect(epic.perks.length).toBeGreaterThan(getRecruitmentNegotiationProfile("rare").perks.length);
    expect(legendary.requiresReputation).toBe(true);
    expect(legendary.perks.length).toBeGreaterThan(epic.perks.length);
  });
});
