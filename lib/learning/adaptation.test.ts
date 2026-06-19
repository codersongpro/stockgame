import { describe, expect, it } from "vitest";
import { elementaryLowMissions } from "../data/learning/missions/elementary-low";
import { recommendSupportMode, rejectRecommendation } from "./adaptation";
import { createLearningProfile, startMission, chooseMissionOption } from "./missionEngine";
import { loadLearningProgress, saveLearningProgress } from "./progress";

describe("learning adaptation", () => {
  it("records concept mastery after mission results", () => {
    const profile = createLearningProfile("");
    const attempt = startMission(elementaryLowMissions[0], profile);

    let state = chooseMissionOption(attempt, "kind-price");
    state = chooseMissionOption(state.attempt, "make-ten");
    state = chooseMissionOption(state.attempt, "save-some");

    const mastery = state.profile.competencyByConcept["가격과 저금"];
    expect(mastery.attempts).toBe(1);
    expect(mastery.successes).toBe(1);
    expect(mastery.bestStars).toBe(3);
    expect(mastery.mastery).toBeGreaterThanOrEqual(0.9);
  });

  it("recommends support, default, or challenge without forcing it", () => {
    const supportProfile = {
      ...createLearningProfile(""),
      recentMissionResults: [
        { missionId: "a", concept: "가격", success: false, stars: 0, at: 1 },
        { missionId: "b", concept: "가격", success: false, stars: 1, at: 2 },
      ],
    };
    const challengeProfile = {
      ...createLearningProfile(""),
      recentMissionResults: [
        { missionId: "a", concept: "가격", success: true, stars: 3, at: 1 },
        { missionId: "b", concept: "수량", success: true, stars: 3, at: 2 },
      ],
    };

    expect(recommendSupportMode(supportProfile).mode).toBe("support");
    expect(recommendSupportMode(challengeProfile).mode).toBe("challenge");
    expect(recommendSupportMode(createLearningProfile("")).mode).toBe("default");

    const rejected = rejectRecommendation(supportProfile, "support");
    expect(rejected.declinedRecommendationModes).toContain("support");
    expect(recommendSupportMode(rejected).mode).toBe("default");
  });

  it("round-trips new progress fields and backfills older saves", () => {
    const profile = createLearningProfile("학습자");
    profile.competencyByConcept["가격"] = {
      attempts: 2,
      successes: 1,
      bestStars: 2,
      mastery: 0.5,
    };
    profile.recentMissionResults.push({ missionId: "x", concept: "가격", success: true, stars: 2, at: 3 });
    profile.declinedRecommendationModes.push("challenge");

    const loaded = loadLearningProgress(saveLearningProgress(profile));
    expect(loaded?.competencyByConcept["가격"].attempts).toBe(2);
    expect(loaded?.recentMissionResults).toHaveLength(1);
    expect(loaded?.declinedRecommendationModes).toEqual(["challenge"]);

    const older = loadLearningProgress(JSON.stringify({
      displayName: "예전",
      completedMissionIds: [],
      unlockedMissionIds: ["el-coin-shop-1"],
      bestStarsByMissionId: {},
      attemptsByMissionId: {},
    }));
    expect(older?.competencyByConcept).toEqual({});
    expect(older?.recentMissionResults).toEqual([]);
    expect(older?.declinedRecommendationModes).toEqual([]);
  });
});
