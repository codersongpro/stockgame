import { describe, expect, it } from "vitest";
import { incrementTradeQuantity } from "./tradeQuantity";

describe("incrementTradeQuantity", () => {
  it("adds quick quantity buttons to the current order size", () => {
    expect(incrementTradeQuantity(1, 1)).toBe(2);
    expect(incrementTradeQuantity(10, 10)).toBe(20);
    expect(incrementTradeQuantity(25, 100)).toBe(125);
  });

  it("never drops below one share or unit", () => {
    expect(incrementTradeQuantity(1, -10)).toBe(1);
  });
});
