import { describe, expect, it } from "vitest";
import { GAME_VERSION } from "./index";
import { LEVEL_CONFIGS } from "./levels";
import { createGame } from "./index";
import { migrateSavedGame, normalizeLevel } from "./saveMigration";

describe("level save migration", () => {
  it("defines the six supported learning levels", () => {
    expect(Object.keys(LEVEL_CONFIGS)).toEqual([
      "elementary_low",
      "elementary_mid",
      "elementary_high",
      "middle",
      "high",
      "adult",
    ]);
  });

  it("maps legacy levels to the new level set", () => {
    expect(normalizeLevel("elementary_low")).toBe("elementary_low");
    expect(normalizeLevel("elementary")).toBe("elementary_high");
    expect(normalizeLevel("middle")).toBe("middle");
    expect(normalizeLevel("university")).toBe("adult");
    expect(normalizeLevel("unknown")).toBeNull();
  });

  it("migrates a legacy sandbox save without changing the run identity", () => {
    const game = createGame({
      level: "elementary_low",
      seed: 123,
      playerCompanyName: "테스트 상점",
      industryId: "food",
      countryId: "kr",
    });
    const legacy = {
      ...game,
      version: 1,
      level: "elementary",
      config: { ...game.config, level: "elementary" },
    };

    const migrated = migrateSavedGame(legacy);

    expect(migrated).not.toBeNull();
    expect(migrated?.version).toBe(GAME_VERSION);
    expect(migrated?.seed).toBe(123);
    expect(migrated?.level).toBe("elementary_high");
    expect(migrated?.config.level).toBe("elementary_high");
    expect(migrated?.config).toEqual(LEVEL_CONFIGS.elementary_high);
  });

  it("rejects malformed saved data instead of trusting localStorage", () => {
    expect(migrateSavedGame(null)).toBeNull();
    expect(migrateSavedGame({ level: "adult" })).toBeNull();
    expect(migrateSavedGame({ version: 1, level: "not-real", companies: [] })).toBeNull();
  });

  it("drops malformed campaign progress while keeping the sandbox save", () => {
    const game = createGame({
      level: "elementary_low",
      seed: 777,
      playerCompanyName: "테스트 상점",
      industryId: "food",
      countryId: "kr",
      campaignEnabled: true,
    });

    const migrated = migrateSavedGame({
      ...game,
      campaign: {
        enabled: true,
        activeMissionId: 123,
      },
    });

    expect(migrated).not.toBeNull();
    expect(migrated?.campaign).toBeUndefined();
  });
});
