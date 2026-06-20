import { describe, expect, it } from "vitest";
import { CAMPAIGN_MISSIONS_BY_LEVEL } from "./campaigns";

function campaignText(level: keyof typeof CAMPAIGN_MISSIONS_BY_LEVEL): string {
  return CAMPAIGN_MISSIONS_BY_LEVEL[level]
    .flatMap((mission) => [
      mission.title,
      mission.summary,
      mission.concept,
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
    const blocked = ["생산", "손익", "금리", "부채", "투자", "자본", "PER", "PBR", "현금흐름"];

    for (const term of blocked) {
      expect(text).not.toContain(term);
    }
  });

  it("keeps elementary middle campaign goals limited to budget language", () => {
    const text = campaignText("elementary_mid");
    const blocked = ["금리", "부채", "자본", "PER", "PBR", "현금흐름", "포트폴리오"];

    for (const term of blocked) {
      expect(text).not.toContain(term);
    }
  });

  it("lets elementary high use profit language without advanced market terms", () => {
    const text = campaignText("elementary_high");
    const blocked = ["PER", "PBR", "현금흐름", "포트폴리오", "자본 배분"];

    for (const term of blocked) {
      expect(text).not.toContain(term);
    }
    expect(text).toContain("이익");
  });
});
