import type { Level } from "../engine/types";

// Opening narrative scenes, differentiated by level. Kept as data so teachers
// can swap or customise them for a lesson context.

export interface StoryScene {
  emoji: string;
  title: string;
  body: string;
}

export const STORY: Record<Level, StoryScene[]> = {
  elementary_low: [
    {
      emoji: "🏪",
      title: "나는 사장님!",
      body: "작은 회사의 사장님이 되었어요. 물건을 만들어 팔면 돈이 모여요!",
    },
    {
      emoji: "🐷",
      title: "돈을 모아요",
      body: "번 돈은 저금통(예금)에 차곡차곡. 회사를 점점 크게 키워봐요!",
    },
  ],
  elementary_mid: [
    {
      emoji: "🏪",
      title: "우리 가게를 열어요",
      body: "수입과 지출을 살펴보며 예산 안에서 가게를 운영해요.",
    },
    {
      emoji: "🧮",
      title: "계획이 필요해요",
      body: "돈을 어디에 쓸지 정하면 가게가 더 안정적으로 자라요.",
    },
  ],
  elementary_high: [
    {
      emoji: "🏪",
      title: "작은 가게에서 시작해요",
      body: "여러분은 이제 사장님이에요! 작은 회사를 큰 회사로 키워볼까요?",
    },
    {
      emoji: "💰",
      title: "돈을 벌고, 투자도 해요",
      body: "물건을 만들어 팔고, 번 돈으로 다른 회사 주식도 사보며 부자가 되어 봐요!",
    },
  ],
  middle: [
    {
      emoji: "🚀",
      title: "창업가의 길",
      body: "여러분은 유망한 스타트업의 새 CEO입니다. 회사를 성장시키고 시장을 정복하세요.",
    },
    {
      emoji: "📈",
      title: "경영과 투자, 두 날개",
      body: "제품을 만들어 이익을 내고(경영), 그 돈으로 주식·자산에 투자(투자)해 자본을 불립니다.",
    },
    {
      emoji: "🌍",
      title: "세상은 끊임없이 변합니다",
      body: "금리, 경기, 뉴스, 경쟁사… 다양한 사건이 시장을 흔듭니다. 현명하게 대응하세요.",
    },
  ],
  high: [
    {
      emoji: "📊",
      title: "전략 경영자의 시야",
      body: "현금, 부채, 수익률을 나눠 보고 경기 변화에 대응합니다.",
    },
    {
      emoji: "⚖️",
      title: "선택에는 비용이 있습니다",
      body: "성장과 안정 사이에서 근거 있는 결정을 내려 보세요.",
    },
  ],
  adult: [
    {
      emoji: "🏛️",
      title: "시장 브리핑",
      body: "당신은 신임 CEO다. 거시경제 국면, 금리 정책, 환율, 지정학 리스크가 모두 변수다.",
    },
    {
      emoji: "🎯",
      title: "목표: 순자산 극대화",
      body: "기업가치(경영) + 투자 포트폴리오 + 현금 − 부채. 순자산(net worth) 1위가 목표다.",
    },
    {
      emoji: "⚖️",
      title: "선택에는 결과가 따른다",
      body: "안전 투자를 소홀히 하면 사고가, 과도한 부채는 신용 위기를 부른다. 모든 결정이 확률을 바꾼다.",
    },
  ],
};
