import { describe, expect, it } from "vitest";
import {
  ACTION_CARD_CATEGORY_ART,
  DISTRICT_ART,
  RIVAL_ART,
  STATUS_BANNER_ART,
  STRATEGY_EVENT_ART,
  UNICORN_CITY_SHEETS,
} from "./assetMap";

describe("unicorn city visual assets", () => {
  it("maps new campaign art to public asset paths", () => {
    const crops = [
      ...Object.values(DISTRICT_ART),
      ...Object.values(RIVAL_ART),
      ...Object.values(STRATEGY_EVENT_ART),
      ...Object.values(ACTION_CARD_CATEGORY_ART),
      ...Object.values(STATUS_BANNER_ART),
    ];

    expect(Object.values(UNICORN_CITY_SHEETS)).toHaveLength(6);
    for (const crop of crops) {
      expect(crop.src).toMatch(/^\/assets\/unicorn-city\/unicorn_city_assets\//);
      expect(crop.alt.length).toBeGreaterThan(0);
      expect(crop.col).toBeGreaterThanOrEqual(0);
      expect(crop.row).toBeGreaterThanOrEqual(0);
      expect(crop.col).toBeLessThan(crop.cols);
      expect(crop.row).toBeLessThan(crop.rows);
    }
  });
});
