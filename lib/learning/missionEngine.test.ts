import { describe, expect, it } from "vitest";
import { elementaryLowMissions } from "../data/learning/missions/elementary-low";
import {
  createLearningProfile,
  getMissionState,
  startMission,
  chooseMissionOption,
} from "./missionEngine";
import { loadLearningProgress, saveLearningProgress } from "./progress";

describe("elementary low learning missions", () => {
  it("ships five short missions with no advanced finance terms", () => {
    const blockedTerms = ["PER", "PBR", "부채비율", "현금흐름", "환율", "암호화폐"];

    expect(elementaryLowMissions).toHaveLength(5);
    for (const mission of elementaryLowMissions) {
      expect(mission.level).toBe("elementary_low");
      expect(mission.turns.length).toBeGreaterThanOrEqual(3);
      expect(mission.turns.length).toBeLessThanOrEqual(5);
      for (const turn of mission.turns) {
        expect(turn.options).toHaveLength(2);
        const text = [turn.title, turn.body, turn.hint, ...turn.options.map((o) => `${o.label} ${o.result}`)].join(" ");
        for (const term of blockedTerms) {
          expect(text).not.toContain(term);
        }
      }
    }
  });

  it("unlocks the next mission after a successful attempt", () => {
    const profile = createLearningProfile(" 우리반 ");
    const attempt = startMission(elementaryLowMissions[0], profile);

    let state = chooseMissionOption(attempt, "kind-price");
    state = chooseMissionOption(state.attempt, "make-ten");
    state = chooseMissionOption(state.attempt, "save-some");

    expect(state.result?.success).toBe(true);
    expect(state.result?.stars).toBe(3);
    expect(state.profile.completedMissionIds).toContain("el-coin-shop-1");
    expect(state.profile.unlockedMissionIds).toContain("el-coin-shop-2");
  });

  it("keeps failed attempts retryable instead of ending the campaign", () => {
    const profile = createLearningProfile("");
    const attempt = startMission(elementaryLowMissions[0], profile);

    let state = chooseMissionOption(attempt, "high-price");
    state = chooseMissionOption(state.attempt, "make-too-many");
    state = chooseMissionOption(state.attempt, "spend-all");

    expect(state.result?.success).toBe(false);
    expect(state.result?.canRetry).toBe(true);
    expect(state.profile.completedMissionIds).not.toContain("el-coin-shop-1");
    expect(getMissionState(profile, "el-coin-shop-1")).toBe("available");
  });

  it("round-trips progress through validated JSON", () => {
    const profile = createLearningProfile(" 1234567890123456789012345 ");
    profile.completedMissionIds.push("el-coin-shop-1");
    profile.unlockedMissionIds.push("el-coin-shop-2");
    const raw = saveLearningProgress(profile);
    const loaded = loadLearningProgress(raw);

    expect(loaded?.displayName).toBe("123456789012");
    expect(loaded?.completedMissionIds).toEqual(["el-coin-shop-1"]);
    expect(loaded?.unlockedMissionIds).toContain("el-coin-shop-1");
    expect(loaded?.unlockedMissionIds).toContain("el-coin-shop-2");
    expect(loadLearningProgress("{bad json")).toBeNull();
    expect(loadLearningProgress(JSON.stringify({ displayName: "x" }))).toBeNull();
  });
});
