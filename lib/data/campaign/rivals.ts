import type { RivalDefinition } from "@/lib/engine/types";

export const PRICE_WAR_RIVAL_ID = "barry-price";
export const PRICE_WAR_CHAPTER_ID = "price-war-1";

export const RIVALS: RivalDefinition[] = [
  {
    id: PRICE_WAR_RIVAL_ID,
    name: "배리 프라이스",
    title: "가격 파괴자",
    emoji: "🏷️",
    archetype: "price_destroyer",
    chapterId: PRICE_WAR_CHAPTER_ID,
    chapterTitle: "5분기 가격 전쟁",
    intro: "경쟁자가 낮은 가격으로 손님을 빼앗으려 합니다.",
    taunts: [
      "가격만 낮추면 손님은 우리 쪽으로 올 겁니다.",
      "이번 분기에는 우리 매장이 더 붐빌 것 같군요.",
      "값만 보지 않는 손님도 있다는 걸 보여 줄 수 있나요?",
    ],
    victoryText: "가격 압박 속에서도 회사를 안정적으로 지켜냈습니다.",
    defeatText: "이번 가격 전쟁은 버거웠습니다. 같은 장을 다시 정비해 보세요.",
  },
];

export function getRival(id: string): RivalDefinition | undefined {
  return RIVALS.find((rival) => rival.id === id);
}
