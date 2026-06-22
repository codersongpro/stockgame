import { describe, expect, it } from "vitest";
import { CAMPAIGN_MISSIONS_BY_LEVEL } from "./campaigns";

function campaignText(level: keyof typeof CAMPAIGN_MISSIONS_BY_LEVEL): string {
  return CAMPAIGN_MISSIONS_BY_LEVEL[level]
    .flatMap((mission) => [
      mission.title,
      mission.summary,
      mission.concept,
      mission.targetAction,
      mission.hint,
      mission.successText,
      mission.retryText,
      ...mission.objectives.map((objective) => objective.label),
    ])
    .join(" ");
}

describe("campaign grade-level language", () => {
  it("keeps elementary low campaign goals concrete and finance-term free", () => {
    const text = campaignText("elementary_low");
    const blocked = ["금리", "부채", "투자", "자본", "PER", "PBR", "현금흐름", "레버리지", "포트폴리오"];

    for (const term of blocked) {
      expect(text).not.toContain(term);
    }

    for (const mission of CAMPAIGN_MISSIONS_BY_LEVEL.elementary_low) {
      expect(mission.objectives.length).toBeLessThanOrEqual(2);
    }
  });

  it("keeps elementary middle campaign goals limited to simple budget language", () => {
    const text = campaignText("elementary_mid");
    const blocked = ["금리", "부채", "자본", "PER", "PBR", "현금흐름", "포트폴리오", "레버리지"];

    for (const term of blocked) {
      expect(text).not.toContain(term);
    }
  });

  it("lets elementary high use profit language without advanced market terms", () => {
    const text = campaignText("elementary_high");
    const blocked = ["PER", "PBR", "현금흐름", "포트폴리오", "레버리지"];

    for (const term of blocked) {
      expect(text).not.toContain(term);
    }
    expect(text).toContain("이익");
  });

  it("defines every campaign as a sandbox action instead of a detached quiz", () => {
    const missions = Object.values(CAMPAIGN_MISSIONS_BY_LEVEL).flat();

    expect(missions).toHaveLength(30);
    for (const mission of missions) {
      expect(mission.targetAction.length).toBeGreaterThan(5);
      expect(mission.objectives.length).toBeGreaterThan(0);
      expect(mission.objectives.every((objective) => objective.kind !== undefined)).toBe(true);
    }
  });
});
