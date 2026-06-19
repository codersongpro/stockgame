import { describe, expect, it } from "vitest";
import { LEARNING_MISSIONS, MISSIONS_BY_LEVEL } from "./chapters";
import { LEVEL_CONFIGS } from "../../engine/levels";
import type { Level } from "../../engine/types";

const LEVELS: Level[] = [
  "elementary_low",
  "elementary_mid",
  "elementary_high",
  "middle",
  "high",
  "adult",
];

describe("learning content coverage", () => {
  it("provides five missions for each of the six levels", () => {
    expect(LEARNING_MISSIONS).toHaveLength(30);

    for (const level of LEVELS) {
      expect(MISSIONS_BY_LEVEL[level]).toHaveLength(5);
      expect(MISSIONS_BY_LEVEL[level].every((mission) => mission.level === level)).toBe(true);
    }
  });

  it("keeps mission choices within each level setting", () => {
    for (const mission of LEARNING_MISSIONS) {
      const config = LEVEL_CONFIGS[mission.level];
      expect(mission.turns.length).toBeGreaterThanOrEqual(3);
      expect(mission.turns.length).toBeLessThanOrEqual(5);
      expect(mission.goal.length).toBeGreaterThan(0);
      expect(mission.concept.length).toBeGreaterThan(0);

      for (const turn of mission.turns) {
        expect(turn.options.length).toBeGreaterThanOrEqual(2);
        expect(turn.options.length).toBeLessThanOrEqual(config.maxChoices);
      }
    }
  });

  it("chains missions inside each level without crossing into another level", () => {
    for (const level of LEVELS) {
      const missions = MISSIONS_BY_LEVEL[level];
      for (let index = 0; index < missions.length; index += 1) {
        const mission = missions[index];
        if (index < missions.length - 1) {
          expect(mission.nextMissionId).toBe(missions[index + 1].id);
        } else {
          expect(mission.nextMissionId).toBeUndefined();
        }
      }
    }
  });

  it("keeps elementary low content free of advanced finance terms", () => {
    const blockedTerms = ["PER", "PBR", "부채비율", "현금흐름", "환율", "암호화폐"];
    const text = MISSIONS_BY_LEVEL.elementary_low
      .flatMap((mission) => [
        mission.title,
        mission.summary,
        mission.goal,
        mission.concept,
        ...mission.turns.flatMap((turn) => [
          turn.title,
          turn.body,
          turn.hint,
          ...turn.options.flatMap((option) => [option.label, option.result]),
        ]),
      ])
      .join(" ");

    for (const term of blockedTerms) {
      expect(text).not.toContain(term);
    }
  });
});
