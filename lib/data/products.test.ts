import { describe, expect, it } from "vitest";
import { getIndustryProducts, productDisplayName } from "./products";

describe("productDisplayName", () => {
  it("uses kid-friendly product names in simplified elementary mode", () => {
    const products = getIndustryProducts("finance");

    expect(productDisplayName(products[0], true)).toBe("저금통 상품");
    expect(productDisplayName(products[1], true)).toBe("돈 불리기 도움");
    expect(productDisplayName(products[2], true)).toBe("부자 손님 관리");
    expect(productDisplayName(products[3], true)).toBe("디지털 돈 관리");
  });

  it("keeps original product names outside simplified mode", () => {
    const products = getIndustryProducts("tech");

    expect(productDisplayName(products[2], false)).toBe("엔터프라이즈 솔루션");
  });
});
