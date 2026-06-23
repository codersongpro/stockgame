import { describe, expect, it } from "vitest";
import { createGame } from "./index";
import { getOperationsGuide } from "./operations";
import { updateCityState } from "./city";

describe("operations guide", () => {
  it("summarizes city districts and assigned leaders from real game state", () => {
    const game = createGame({
      level: "middle",
      seed: 31,
      playerCompanyName: "Strategy Lab",
      industryId: "tech",
      countryId: "kr",
      campaignEnabled: true,
    });
    const player = game.companies.find((company) => company.id === game.playerCompanyId)!;
    player.buildings.push(
      { id: "rnd-a", type: "rnd", level: 1, x: 1, y: 1, turnsLeft: 0 },
      { id: "lab-a", type: "lab", level: 1, x: 2, y: 1, turnsLeft: 0 },
    );
    player.hired.push({
      id: "talent-cto",
      name: "민서",
      avatar: "🧑‍🔬",
      preferredRole: "cto",
      role: "cto",
      stats: {
        management: 60,
        tech: 90,
        creativity: 75,
        finance: 45,
        leadership: 58,
        marketing: 52,
      },
      trait: "innovator",
      traitName: "아이디어왕",
      traitDesc: "새 상품을 잘 떠올립니다.",
      rarity: "rare",
      salary: 7000,
      loyalty: 88,
    });
    updateCityState(game);

    const guide = getOperationsGuide(game);

    expect(guide.districtFocus[0]).toEqual(expect.objectContaining({
      id: "research",
      label: "연구 구역",
      status: "strong",
    }));
    expect(guide.talentFocus).toContainEqual(expect.objectContaining({
      name: "민서",
      role: "cto",
      label: "연구 책임자",
      status: "good",
    }));
  });

  it("keeps elementary low guidance concrete and finance-term free", () => {
    const game = createGame({
      level: "elementary_low",
      seed: 32,
      playerCompanyName: "Coin Shop",
      industryId: "food",
      countryId: "kr",
      campaignEnabled: true,
    });

    const guide = getOperationsGuide(game);
    const text = [
      ...guide.districtFocus.map((item) => `${item.label} ${item.message}`),
      ...guide.talentFocus.map((item) => `${item.label} ${item.message}`),
      guide.nextStep,
    ].join(" ");

    expect(text).not.toMatch(/R&D|레버리지|포트폴리오|시장 자유화|부채/);
    expect(guide.nextStep.length).toBeGreaterThan(0);
  });
});
