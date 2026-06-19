import type { LearningMission, LearningTurn } from "../../../learning/types";
import type { Level } from "../../../engine/types";

type MissionDraft = {
  title: string;
  summary: string;
  goal: string;
  concept: string;
  turns: LearningTurn[];
};

function option(id: string, label: string, result: string, score: number) {
  return { id, label, result, score };
}

function turn(
  id: string,
  title: string,
  body: string,
  hint: string,
  options: ReturnType<typeof option>[],
): LearningTurn {
  return { id, title, body, hint, options };
}

function missions(level: Level, prefix: string, drafts: MissionDraft[]): LearningMission[] {
  return drafts.map((draft, index) => ({
    id: `${prefix}-${index + 1}`,
    level,
    title: draft.title,
    summary: draft.summary,
    goal: draft.goal,
    concept: draft.concept,
    nextMissionId: index < drafts.length - 1 ? `${prefix}-${index + 2}` : undefined,
    turns: draft.turns,
  }));
}

export const elementaryMidMissions = missions("elementary_mid", "em-budget-shop", [
  {
    title: "수입과 지출",
    summary: "들어온 돈과 나간 돈을 나눠 봐요.",
    goal: "하루 장사 뒤 남은 돈을 확인하기",
    concept: "수입과 지출",
    turns: [
      turn("income", "판매 돈 세기", "오늘 물건을 팔아 3,000원을 벌었어요.", "수입은 들어온 돈이에요.", [
        option("write-income", "수입에 적기", "들어온 돈을 잘 분류했어요.", 2),
        option("write-cost", "지출에 적기", "들어온 돈과 나간 돈이 섞였어요.", 0),
      ]),
      turn("cost", "재료값 보기", "재료를 사느라 1,000원을 썼어요.", "지출은 나간 돈이에요.", [
        option("write-cost", "지출에 적기", "나간 돈을 잘 찾았어요.", 2),
        option("ignore", "적지 않기", "얼마를 썼는지 알기 어려워요.", 0),
      ]),
      turn("left", "남은 돈 고르기", "3,000원을 벌고 1,000원을 썼어요.", "번 돈에서 쓴 돈을 빼요.", [
        option("two", "2,000원", "남은 돈을 정확히 찾았어요.", 2),
        option("four", "4,000원", "수입과 지출을 더해 버렸어요.", 0),
      ]),
    ],
  },
  {
    title: "광고 예산",
    summary: "광고에 쓸 돈을 정해요.",
    goal: "예산 안에서 손님을 늘리기",
    concept: "예산",
    turns: [
      turn("budget", "오늘 예산", "오늘 쓸 수 있는 돈은 2,000원이에요.", "예산보다 많이 쓰면 안 돼요.", [
        option("small-ad", "광고 800원", "예산 안에서 광고했어요.", 2),
        option("big-ad", "광고 2,500원", "예산보다 많이 쓰게 돼요.", 0),
      ]),
      turn("poster", "포스터 만들기", "포스터를 붙이면 손님이 조금 늘어요.", "돈을 쓰면 얻는 것도 있어요.", [
        option("poster", "포스터 만들기", "손님이 가게를 더 잘 찾았어요.", 2),
        option("none", "아무것도 안 하기", "손님이 크게 늘지는 않았어요.", 1),
      ]),
      turn("check", "돈 확인", "광고 뒤에도 내일 쓸 돈이 필요해요.", "모두 쓰지 않는 선택이 안전해요.", [
        option("save", "남은 돈 확인", "다음 날 계획을 세울 수 있어요.", 2),
        option("skip", "확인 안 하기", "돈이 얼마나 남았는지 몰라요.", 0),
      ]),
    ],
  },
  {
    title: "예금 이자",
    summary: "저금하면 조금 더 받는 돈을 배워요.",
    goal: "예금과 소비를 비교하기",
    concept: "이자",
    turns: [
      turn("coin", "남은 돈", "가게에 1,000원이 남았어요.", "지금 쓰거나 저금할 수 있어요.", [
        option("deposit", "저금하기", "조금 더 받을 준비를 했어요.", 2),
        option("spend", "바로 쓰기", "필요한 물건은 샀지만 남는 돈은 줄었어요.", 1),
      ]),
      turn("wait", "하루 기다리기", "저금한 돈은 하루 뒤 조금 늘어요.", "기다리면 이자가 붙어요.", [
        option("wait", "기다리기", "돈이 조금 늘었어요.", 2),
        option("take", "바로 꺼내기", "이자가 거의 붙지 않았어요.", 0),
      ]),
      turn("use", "늘어난 돈 쓰기", "늘어난 돈으로 무엇을 할까요?", "먼저 필요한 곳에 써요.", [
        option("material", "재료 사기", "가게 운영에 도움이 됐어요.", 2),
        option("snack", "간식 모두 사기", "즐겁지만 가게에는 덜 도움이 돼요.", 0),
      ]),
    ],
  },
  {
    title: "재고 줄이기",
    summary: "남은 물건이 많을 때 계획을 바꿔요.",
    goal: "다음 생산 수량을 조절하기",
    concept: "재고",
    turns: [
      turn("leftover", "많이 남았어요", "오늘 물건 20개 중 8개가 남았어요.", "많이 남으면 다음에는 덜 만들어요.", [
        option("less", "덜 만들기", "남는 물건이 줄어들 거예요.", 2),
        option("more", "더 만들기", "남는 물건이 더 많아질 수 있어요.", 0),
      ]),
      turn("price", "가격도 살펴요", "손님이 가격이 조금 높다고 말했어요.", "가격과 수량을 함께 봐요.", [
        option("lower", "조금 낮추기", "손님이 다시 관심을 보였어요.", 2),
        option("raise", "더 올리기", "손님이 더 줄 수 있어요.", 0),
      ]),
      turn("record", "기록하기", "오늘 남은 수를 적어 둘까요?", "기록하면 다음 계획이 쉬워요.", [
        option("record", "기록하기", "다음 장사에 도움이 돼요.", 2),
        option("forget", "잊어버리기", "같은 실수를 반복할 수 있어요.", 0),
      ]),
    ],
  },
  {
    title: "첫 이익",
    summary: "수입에서 지출을 뺀 이익을 찾아요.",
    goal: "이익이 남는 선택 고르기",
    concept: "이익",
    turns: [
      turn("sell", "판매 계획", "물건 하나를 500원에 팔 수 있어요.", "가격은 재료값보다 높아야 해요.", [
        option("good-price", "500원", "재료값보다 높아서 이익이 남아요.", 2),
        option("low-price", "100원", "재료값보다 낮으면 손해예요.", 0),
      ]),
      turn("cost", "재료값", "물건 하나를 만들 때 300원이 들어요.", "이익은 판매가에서 재료값을 뺀 돈이에요.", [
        option("compare", "가격 비교", "500원과 300원을 비교했어요.", 2),
        option("ignore", "비교 안 하기", "이익을 알기 어려워요.", 0),
      ]),
      turn("profit", "남는 돈", "500원에 팔고 300원이 들었어요.", "500-300을 생각해요.", [
        option("profit-200", "200원", "이익을 잘 찾았어요.", 2),
        option("profit-800", "800원", "두 수를 더했어요.", 0),
      ]),
    ],
  },
]);

export const elementaryHighMissions = missions("elementary_high", "eh-growth-lab", [
  {
    title: "원가와 판매가",
    summary: "물건 하나의 원가와 판매가를 비교해요.",
    goal: "손해 보지 않는 가격 정하기",
    concept: "원가와 판매가",
    turns: [
      turn("cost", "원가 확인", "새 상품 하나의 원가는 700원이에요.", "판매가는 원가보다 높아야 해요.", [
        option("check", "원가 먼저 확인", "가격을 정할 기준을 잡았어요.", 2),
        option("guess", "감으로 정하기", "손해를 볼 수 있어요.", 0),
        option("copy", "친구 가격 따라 하기", "상황이 다르면 맞지 않을 수 있어요.", 1),
      ]),
      turn("price", "판매가 선택", "손님은 900원 정도까지 살 것 같아요.", "너무 높으면 수요가 줄어요.", [
        option("price-900", "900원", "원가보다 높고 손님도 납득해요.", 2),
        option("price-600", "600원", "팔수록 손해예요.", 0),
        option("price-2000", "2,000원", "손님이 거의 사지 않을 수 있어요.", 0),
      ]),
      turn("review", "결과 확인", "가격을 정한 뒤 팔린 수를 봐요.", "매출과 남은 물건을 함께 봐요.", [
        option("review", "함께 보기", "다음 가격을 더 잘 정할 수 있어요.", 2),
        option("sales-only", "매출만 보기", "남은 물건을 놓칠 수 있어요.", 1),
        option("skip", "안 보기", "배운 점을 찾기 어려워요.", 0),
      ]),
    ],
  },
  {
    title: "재고 100개 줄이기",
    summary: "재고가 많을 때 생산과 가격을 조절해요.",
    goal: "재고를 줄이면서 이익 지키기",
    concept: "재고 관리",
    turns: [
      turn("inventory", "재고 확인", "창고에 물건이 100개 남았어요.", "먼저 남은 수를 확인해요.", [
        option("count", "재고 세기", "문제를 정확히 봤어요.", 2),
        option("produce", "더 만들기", "재고가 더 많아져요.", 0),
        option("ignore", "모른 척하기", "창고 비용이 늘 수 있어요.", 0),
      ]),
      turn("discount", "판매 방법", "조금 할인하면 더 팔릴 수 있어요.", "할인은 이익도 줄일 수 있어요.", [
        option("small-discount", "작게 할인", "재고와 이익을 함께 지켰어요.", 2),
        option("free", "거의 공짜", "재고는 줄지만 이익이 사라져요.", 0),
        option("no-sale", "가격 그대로", "재고가 천천히 줄어요.", 1),
      ]),
      turn("next", "다음 생산", "다음 주에는 얼마나 만들까요?", "남은 물건이 많으면 생산을 줄여요.", [
        option("less", "줄여 만들기", "창고 부담이 줄어요.", 2),
        option("same", "같게 만들기", "문제가 이어질 수 있어요.", 1),
        option("more", "더 만들기", "재고가 늘 수 있어요.", 0),
      ]),
    ],
  },
  {
    title: "연구개발 선택",
    summary: "품질을 높이는 투자를 경험해요.",
    goal: "지금 이익과 다음 성장 비교하기",
    concept: "연구개발",
    turns: [
      turn("idea", "새 상품 아이디어", "더 튼튼한 상품을 만들 수 있어요.", "연구개발은 미래 품질을 높여요.", [
        option("research", "연구하기", "다음 상품 품질이 좋아져요.", 2),
        option("ads", "광고만 하기", "지금 손님은 늘 수 있지만 품질은 그대로예요.", 1),
        option("nothing", "아무것도 안 하기", "변화가 적어요.", 0),
      ]),
      turn("money", "돈 배분", "가게 돈은 한정되어 있어요.", "모든 돈을 한 곳에 쓰지 않아요.", [
        option("balanced", "조금씩 나누기", "위험을 줄였어요.", 2),
        option("all-research", "모두 연구", "다른 비용이 부족할 수 있어요.", 1),
        option("all-cash", "모두 남기기", "안전하지만 성장 기회가 작아요.", 1),
      ]),
      turn("result", "다음 상품", "품질이 오른 상품은 더 좋은 평가를 받아요.", "결과가 바로 오지 않아도 의미가 있어요.", [
        option("continue", "꾸준히 개선", "장기 성장을 만들었어요.", 2),
        option("stop", "바로 중단", "효과를 보기 전에 멈췄어요.", 0),
        option("check", "평가 확인", "고객 반응을 배웠어요.", 2),
      ]),
    ],
  },
  {
    title: "분산 투자",
    summary: "예금과 ETF를 나눠 담아요.",
    goal: "한 곳에 몰아넣지 않는 선택하기",
    concept: "분산",
    turns: [
      turn("cash", "남은 돈", "남은 돈 10만 원을 투자할 수 있어요.", "안전성과 성장성을 나눠 봐요.", [
        option("split", "예금+ETF", "위험을 나눴어요.", 2),
        option("all-etf", "ETF만", "오를 수도 있지만 흔들릴 수 있어요.", 1),
        option("all-spend", "모두 쓰기", "투자할 돈이 없어져요.", 0),
      ]),
      turn("drop", "ETF가 내려요", "ETF 가격이 잠깐 내려갔어요.", "투자는 오르내림이 있어요.", [
        option("check-goal", "목표 확인", "처음 계획을 다시 봤어요.", 2),
        option("panic", "바로 포기", "흔들림에 급하게 반응했어요.", 0),
        option("all-in", "더 몰아넣기", "위험이 커졌어요.", 0),
      ]),
      turn("record", "투자 기록", "어디에 얼마 넣었는지 적을까요?", "기록은 판단을 도와요.", [
        option("record", "기록하기", "다음 선택이 쉬워져요.", 2),
        option("memory", "기억만 하기", "헷갈릴 수 있어요.", 1),
        option("ignore", "안 보기", "비교가 어려워요.", 0),
      ]),
    ],
  },
  {
    title: "책임 있는 리콜",
    summary: "문제가 있는 상품을 어떻게 처리할지 골라요.",
    goal: "신뢰를 지키는 선택하기",
    concept: "책임",
    turns: [
      turn("problem", "상품 문제", "상품 일부에 문제가 생겼어요.", "숨기면 신뢰가 떨어져요.", [
        option("tell", "알리고 고치기", "손님 신뢰를 지켰어요.", 2),
        option("hide", "숨기기", "나중에 더 큰 문제가 돼요.", 0),
        option("delay", "조금 미루기", "걱정이 커질 수 있어요.", 1),
      ]),
      turn("cost", "수리 비용", "고치려면 돈이 들어요.", "비용과 신뢰를 함께 봐요.", [
        option("repair", "수리하기", "비용은 들지만 안전해요.", 2),
        option("cheap", "대충 고치기", "문제가 반복될 수 있어요.", 0),
        option("ask", "도움 요청", "해결 방법을 넓혔어요.", 2),
      ]),
      turn("learn", "다음 계획", "같은 문제가 다시 생기지 않게 해야 해요.", "원인을 찾아요.", [
        option("cause", "원인 찾기", "다음 위험을 줄였어요.", 2),
        option("forget", "끝났다고 생각", "반복될 수 있어요.", 0),
        option("checklist", "점검표 만들기", "예방 방법이 생겼어요.", 2),
      ]),
    ],
  },
]);

export const middleMissions = missions("middle", "mi-strategy-market", [
  {
    title: "수요와 가격",
    summary: "가격 변화가 수요에 주는 영향을 봐요.",
    goal: "매출과 고객 수의 균형 찾기",
    concept: "수요",
    turns: [
      turn("demand", "고객 반응", "가격을 올리면 한 개당 이익은 늘 수 있어요.", "가격이 오르면 수요가 줄 수 있어요.", [
        option("small-rise", "조금 올리기", "수요 변화를 살필 수 있어요.", 2),
        option("big-rise", "크게 올리기", "고객이 빠르게 줄 수 있어요.", 0),
        option("same", "그대로 두기", "안정적이지만 실험은 적어요.", 1),
      ]),
      turn("compare", "결과 비교", "매출은 늘었지만 고객 수는 줄었어요.", "한 지표만 보지 않아요.", [
        option("both", "매출과 고객 함께 보기", "균형을 판단했어요.", 2),
        option("revenue-only", "매출만 보기", "고객 이탈을 놓칠 수 있어요.", 1),
        option("ignore", "확인 안 함", "다음 전략이 흐려져요.", 0),
      ]),
      turn("adjust", "다음 가격", "고객 수가 너무 줄었어요.", "조금 되돌리는 선택이 필요해요.", [
        option("lower-little", "조금 낮추기", "고객을 다시 모을 수 있어요.", 2),
        option("raise-more", "더 올리기", "수요가 더 줄 수 있어요.", 0),
        option("coupon", "쿠폰 제공", "가격 부담을 줄였어요.", 2),
      ]),
    ],
  },
  {
    title: "금리 인상기",
    summary: "금리가 오를 때 투자와 대출을 조절해요.",
    goal: "이자 부담을 줄이는 선택하기",
    concept: "금리",
    turns: [
      turn("rate", "금리 소식", "은행 금리가 올랐어요.", "대출 이자가 더 부담될 수 있어요.", [
        option("check-debt", "대출 먼저 확인", "부담을 파악했어요.", 2),
        option("borrow-more", "대출 늘리기", "이자 부담이 커져요.", 0),
        option("ignore", "뉴스 무시", "위험을 놓칠 수 있어요.", 0),
      ]),
      turn("cash", "현금 계획", "현금이 조금 남아 있어요.", "급한 빚부터 줄이면 안정적이에요.", [
        option("repay", "일부 상환", "이자 부담이 줄어요.", 2),
        option("spend", "모두 지출", "안전 자금이 줄어요.", 0),
        option("hold", "일부 보유", "급한 상황에 대비해요.", 2),
      ]),
      turn("invest", "투자 선택", "시장이 흔들리고 있어요.", "위험 자산 비중을 확인해요.", [
        option("rebalance", "비중 조절", "위험을 낮췄어요.", 2),
        option("all-risk", "위험 자산만", "변동이 커질 수 있어요.", 0),
        option("deposit", "일부 예금", "안정성을 높였어요.", 2),
      ]),
    ],
  },
  {
    title: "기회비용",
    summary: "하나를 선택하면 포기하는 것도 있음을 배워요.",
    goal: "선택의 대가 설명하기",
    concept: "기회비용",
    turns: [
      turn("choice", "두 가지 제안", "광고와 연구개발 중 하나를 크게 늘릴 수 있어요.", "선택하지 않은 쪽도 비용이에요.", [
        option("rnd", "연구개발", "미래 품질을 택했어요.", 2),
        option("ad", "광고", "현재 고객 증가를 택했어요.", 2),
        option("random", "아무거나", "근거가 부족해요.", 0),
      ]),
      turn("explain", "포기한 것", "연구개발을 고르면 광고 효과는 줄어요.", "포기한 이익을 말해 봐요.", [
        option("explain", "포기한 효과 적기", "기회비용을 이해했어요.", 2),
        option("no-cost", "비용 없음", "선택에는 대가가 있어요.", 0),
        option("delay", "나중에 생각", "판단 근거가 약해져요.", 1),
      ]),
      turn("review", "결과 정리", "선택 결과를 다음 전략에 반영해요.", "좋고 나쁨보다 이유가 중요해요.", [
        option("record", "이유 기록", "다음 선택이 좋아져요.", 2),
        option("score-only", "점수만 보기", "왜 그런지 놓칠 수 있어요.", 1),
        option("skip", "넘기기", "학습이 남지 않아요.", 0),
      ]),
    ],
  },
  {
    title: "경쟁사의 할인",
    summary: "경쟁사가 가격을 내릴 때 대응해요.",
    goal: "무조건 따라 내리지 않기",
    concept: "경쟁",
    turns: [
      turn("news", "할인 뉴스", "경쟁사가 20% 할인을 시작했어요.", "가격 말고 품질과 서비스도 봐요.", [
        option("analyze", "이유 분석", "상황을 먼저 파악했어요.", 2),
        option("copy", "바로 할인", "이익이 줄 수 있어요.", 1),
        option("ignore", "무시", "고객을 잃을 수 있어요.", 0),
      ]),
      turn("response", "대응 선택", "우리 품질 평가는 좋은 편이에요.", "강점을 살리는 방법도 있어요.", [
        option("bundle", "묶음 혜택", "가격 부담을 줄이고 가치를 지켰어요.", 2),
        option("deep-discount", "큰 할인", "이익이 크게 줄어요.", 0),
        option("quality-message", "품질 알리기", "강점을 설명했어요.", 2),
      ]),
      turn("watch", "고객 변화", "일부 고객이 돌아왔어요.", "대응 뒤에도 지표를 봐요.", [
        option("track", "고객 수 추적", "효과를 확인했어요.", 2),
        option("stop", "확인 중단", "대응 효과를 알기 어려워요.", 0),
        option("ask", "고객 의견 듣기", "다음 개선점을 찾았어요.", 2),
      ]),
    ],
  },
  {
    title: "위험 분산",
    summary: "투자와 운영 위험을 나눠요.",
    goal: "한 가지 결과에만 기대지 않기",
    concept: "위험",
    turns: [
      turn("portfolio", "투자 구성", "예금, 채권, ETF를 고를 수 있어요.", "위험과 안정성을 섞어요.", [
        option("mix", "세 가지 나누기", "위험이 분산됐어요.", 2),
        option("single", "한 가지 몰기", "결과가 크게 흔들릴 수 있어요.", 0),
        option("safe-only", "예금만", "안정적이지만 성장 가능성은 작아요.", 1),
      ]),
      turn("operation", "공급 문제", "재료 공급이 늦어질 수 있어요.", "대체 공급처를 준비해요.", [
        option("backup", "대체처 찾기", "운영 위험이 줄었어요.", 2),
        option("wait", "기다리기", "문제가 커질 수 있어요.", 0),
        option("stock", "안전 재고", "급한 상황에 대비했어요.", 2),
      ]),
      turn("report", "위험 기록", "어떤 위험이 있었는지 정리해요.", "기록은 다음 결정을 도와요.", [
        option("report", "위험표 작성", "대응 방법이 보였어요.", 2),
        option("memory", "기억만 하기", "놓칠 수 있어요.", 1),
        option("skip", "정리 안 함", "반복 위험을 막기 어려워요.", 0),
      ]),
    ],
  },
]);

export const highMissions = missions("high", "hi-finance-board", [
  {
    title: "이익과 현금흐름",
    summary: "장부상 이익과 실제 현금을 구분해요.",
    goal: "흑자지만 현금 부족인 상황 판단하기",
    concept: "현금흐름",
    turns: [
      turn("profit", "이익 보고", "이번 달 이익은 났지만 아직 돈을 못 받은 매출이 있어요.", "이익과 현금은 다를 수 있어요.", [
        option("cash-check", "현금 잔액 확인", "지급 능력을 먼저 봤어요.", 2),
        option("profit-only", "이익만 보기", "현금 부족을 놓칠 수 있어요.", 0),
        option("borrow-now", "바로 대출", "필요성 확인이 먼저예요.", 1),
      ]),
      turn("payment", "지급 일정", "다음 주에 임금과 재료비를 내야 해요.", "나갈 돈의 날짜를 확인해요.", [
        option("schedule", "일정표 작성", "현금 부족 시점을 찾았어요.", 2),
        option("delay", "모두 미루기", "신뢰가 떨어질 수 있어요.", 0),
        option("ask-pay", "일부 조기 회수", "현금 유입을 앞당겼어요.", 2),
      ]),
      turn("decision", "대응", "짧은 현금 공백이 예상돼요.", "작고 빠른 대응이 좋아요.", [
        option("short-loan", "단기 자금", "운영을 안정화했어요.", 2),
        option("big-loan", "큰 대출", "이자 부담이 커져요.", 0),
        option("cut-all", "모든 투자 중단", "성장까지 멈출 수 있어요.", 1),
      ]),
    ],
  },
  {
    title: "부채비율 낮추기",
    summary: "빚이 너무 많을 때 재무 안정성을 높여요.",
    goal: "부채를 줄이거나 자본을 늘리는 선택하기",
    concept: "부채비율",
    turns: [
      turn("ratio", "재무 상태", "부채가 자본보다 많이 늘었어요.", "부채비율이 높으면 위험해져요.", [
        option("check-ratio", "비율 확인", "재무 위험을 숫자로 봤어요.", 2),
        option("ignore", "매출만 보기", "빚 부담을 놓쳐요.", 0),
        option("more-debt", "대출 추가", "비율이 더 나빠질 수 있어요.", 0),
      ]),
      turn("plan", "개선 방법", "현금 일부로 빚을 갚을 수 있어요.", "상환과 투자 여력을 함께 봐요.", [
        option("partial-repay", "일부 상환", "위험을 줄이고 여유도 남겼어요.", 2),
        option("all-repay", "전부 상환", "운영 현금이 부족할 수 있어요.", 1),
        option("no-repay", "상환 안 함", "위험이 계속돼요.", 0),
      ]),
      turn("future", "다음 투자", "새 설비 투자가 필요해요.", "빚을 더 내기 전 회수 가능성을 봐요.", [
        option("roi-check", "회수 기간 계산", "근거를 세웠어요.", 2),
        option("borrow-fast", "바로 차입", "위험 검토가 부족해요.", 0),
        option("stage", "나눠 투자", "위험을 낮췄어요.", 2),
      ]),
    ],
  },
  {
    title: "시장 국면 읽기",
    summary: "호황과 침체에 따라 전략을 바꿔요.",
    goal: "국면별 비용과 투자 판단하기",
    concept: "시장 국면",
    turns: [
      turn("phase", "경기 둔화", "소비 심리가 약해지고 있어요.", "수요 감소를 예상해요.", [
        option("forecast", "수요 예측 낮추기", "무리한 생산을 줄였어요.", 2),
        option("expand", "공격 확장", "재고 부담이 커질 수 있어요.", 0),
        option("same", "계획 유지", "상황 반영이 부족할 수 있어요.", 1),
      ]),
      turn("cost", "비용 점검", "고정비가 계속 나가요.", "줄일 수 있는 비용과 지켜야 할 비용을 나눠요.", [
        option("separate", "비용 분류", "핵심 비용을 지켰어요.", 2),
        option("cut-rnd", "연구 전부 삭감", "미래 경쟁력이 줄 수 있어요.", 0),
        option("cut-waste", "낭비 줄이기", "효율을 높였어요.", 2),
      ]),
      turn("recovery", "회복 준비", "경기가 좋아질 때도 대비해야 해요.", "너무 줄이면 회복기에 늦어요.", [
        option("keep-core", "핵심 인력 유지", "회복에 대비했어요.", 2),
        option("fire-all", "대규모 감축", "회복 때 생산이 어려워요.", 0),
        option("scenario", "시나리오 작성", "다음 대응이 빨라져요.", 2),
      ]),
    ],
  },
  {
    title: "기업 가치",
    summary: "주가보다 넓게 기업 가치를 봐요.",
    goal: "이익, 성장, 위험을 함께 평가하기",
    concept: "기업가치",
    turns: [
      turn("value", "가치 평가", "주가가 올랐지만 이익은 줄었어요.", "가격과 실적을 함께 봐요.", [
        option("metrics", "지표 함께 보기", "과열 가능성을 살폈어요.", 2),
        option("price-only", "주가만 보기", "실적 악화를 놓쳐요.", 0),
        option("profit", "이익 확인", "기초 체력을 봤어요.", 2),
      ]),
      turn("growth", "성장 투자", "새 시장 진출은 성장 가능성이 있어요.", "성장에는 비용과 위험이 있어요.", [
        option("pilot", "작게 시험", "위험을 낮춰 검증했어요.", 2),
        option("all-in", "전면 진출", "실패 때 손실이 커요.", 0),
        option("research", "시장 조사", "근거를 더 모았어요.", 2),
      ]),
      turn("report", "투자자 설명", "왜 이 전략이 가치 있는지 설명해야 해요.", "숫자와 이유를 함께 말해요.", [
        option("balanced", "숫자+이유", "설득력이 높아졌어요.", 2),
        option("story-only", "이야기만", "근거가 약해요.", 1),
        option("hide-risk", "위험 숨기기", "신뢰를 잃을 수 있어요.", 0),
      ]),
    ],
  },
  {
    title: "윤리와 수익",
    summary: "단기 이익과 신뢰를 비교해요.",
    goal: "장기 신뢰를 해치지 않는 선택하기",
    concept: "기업 윤리",
    turns: [
      turn("issue", "품질 문제", "결함 가능성을 알고도 출하하면 이익은 남아요.", "윤리 문제는 장기 가치와 연결돼요.", [
        option("stop", "출하 보류", "단기 매출은 줄지만 신뢰를 지켰어요.", 2),
        option("ship", "그대로 출하", "큰 위험을 만들었어요.", 0),
        option("test-more", "추가 검사", "근거를 확인했어요.", 2),
      ]),
      turn("stakeholder", "이해관계자", "고객, 직원, 투자자가 모두 영향을 받아요.", "누가 영향을 받는지 넓게 봐요.", [
        option("map", "영향 지도", "결정의 범위를 파악했어요.", 2),
        option("owner-only", "회사만 보기", "중요한 영향을 놓쳐요.", 0),
        option("customer", "고객 안전 우선", "핵심 위험을 줄였어요.", 2),
      ]),
      turn("policy", "재발 방지", "같은 문제가 반복되지 않게 해야 해요.", "규칙과 점검을 남겨요.", [
        option("policy", "점검 규칙", "예방 체계를 만들었어요.", 2),
        option("promise", "말로만 약속", "실행력이 약해요.", 0),
        option("audit", "외부 점검", "신뢰를 높였어요.", 2),
      ]),
    ],
  },
]);

export const adultMissions = missions("adult", "ad-founder-lab", [
  {
    title: "단위경제성",
    summary: "고객 한 명을 얻는 비용과 남는 이익을 비교해요.",
    goal: "성장 전에 사업 구조 확인하기",
    concept: "단위경제성",
    turns: [
      turn("cac", "고객 획득 비용", "광고로 고객 1명을 얻는 데 12,000원이 들어요.", "고객당 남는 이익과 비교해요.", [
        option("compare-ltv", "고객가치와 비교", "성장 가능성을 판단했어요.", 2),
        option("spend-more", "광고비 확대", "구조 확인 전 확장은 위험해요.", 0),
        option("pause", "전체 중단", "검증 기회도 줄어요.", 1),
      ]),
      turn("margin", "마진 확인", "한 고객에게서 평균 18,000원이 남아요.", "획득 비용보다 충분히 커야 해요.", [
        option("positive", "양수 구조 확인", "기초 구조를 봤어요.", 2),
        option("ignore-cost", "매출만 보기", "수익성을 놓쳐요.", 0),
        option("segment", "고객군 나누기", "더 좋은 고객군을 찾을 수 있어요.", 2),
      ]),
      turn("scale", "확장 판단", "일부 채널만 수익성이 좋아요.", "좋은 채널부터 키워요.", [
        option("scale-good", "좋은 채널 확대", "효율적으로 성장했어요.", 2),
        option("all-channel", "모든 채널 확대", "손실 채널도 커져요.", 0),
        option("test", "작게 추가 실험", "근거를 더 모았어요.", 2),
      ]),
    ],
  },
  {
    title: "자본 배분",
    summary: "현금을 성장, 안정, 투자로 나눠요.",
    goal: "한 번의 선택으로 회사 전체 균형 잡기",
    concept: "자본 배분",
    turns: [
      turn("cash", "현금 10억", "투자 가능한 현금이 생겼어요.", "성장과 안전을 함께 고려해요.", [
        option("balanced", "성장+안전+투자", "자본을 균형 있게 나눴어요.", 2),
        option("all-growth", "성장에 전부", "위기 대응력이 낮아져요.", 1),
        option("all-cash", "전부 보유", "기회비용이 생겨요.", 1),
      ]),
      turn("constraint", "병목 찾기", "매출보다 생산 능력이 부족해요.", "가장 막힌 곳에 먼저 배분해요.", [
        option("bottleneck", "생산 병목 투자", "효율이 올랐어요.", 2),
        option("brand", "브랜드만 투자", "병목은 남아 있어요.", 0),
        option("hire", "핵심 인력 채용", "실행력을 보강했어요.", 2),
      ]),
      turn("review", "성과 점검", "투자 뒤 지표를 봐야 해요.", "배분은 반복해서 조정해요.", [
        option("dashboard", "지표 점검", "다음 배분 근거가 생겼어요.", 2),
        option("wait", "오래 방치", "변화를 놓칠 수 있어요.", 0),
        option("rebalance", "재조정", "상황에 맞게 바꿨어요.", 2),
      ]),
    ],
  },
  {
    title: "가격 실험",
    summary: "A/B 실험으로 가격과 전환율을 비교해요.",
    goal: "감이 아니라 실험으로 가격 정하기",
    concept: "실험",
    turns: [
      turn("hypothesis", "가설", "가격을 5% 올려도 고객 이탈이 작을지 궁금해요.", "먼저 가설을 세워요.", [
        option("hypothesis", "가설 기록", "실험 기준이 생겼어요.", 2),
        option("change-all", "전체 가격 변경", "검증 없이 위험을 키워요.", 0),
        option("copy", "경쟁사 모방", "우리 고객과 다를 수 있어요.", 1),
      ]),
      turn("sample", "실험 범위", "전체 고객 중 일부에게만 시험할 수 있어요.", "작게 시작하면 위험이 낮아요.", [
        option("small-test", "일부 실험", "위험을 제한했어요.", 2),
        option("all", "전체 적용", "실패 영향이 커요.", 0),
        option("segment", "고객군 분리", "더 정확히 비교했어요.", 2),
      ]),
      turn("decision", "결과 해석", "가격은 올랐지만 전환율은 조금 떨어졌어요.", "총이익으로 비교해요.", [
        option("profit", "총이익 비교", "올바른 기준을 봤어요.", 2),
        option("price-only", "가격만 보기", "전환율 하락을 놓쳐요.", 0),
        option("iterate", "다음 실험", "학습을 이어 갔어요.", 2),
      ]),
    ],
  },
  {
    title: "구조조정",
    summary: "현금 위기에서 비용과 역량을 함께 봐요.",
    goal: "생존과 회복 가능성을 동시에 지키기",
    concept: "구조조정",
    turns: [
      turn("runway", "런웨이", "현재 현금으로 4개월 버틸 수 있어요.", "남은 시간을 먼저 계산해요.", [
        option("runway", "런웨이 계산", "위기 크기를 파악했어요.", 2),
        option("hope", "매출 회복 기대", "근거 없는 기대는 위험해요.", 0),
        option("raise", "자금 조달 검토", "선택지를 넓혔어요.", 2),
      ]),
      turn("cost", "비용 절감", "모든 비용을 같은 비율로 줄일 수는 없어요.", "핵심 역량을 남겨야 해요.", [
        option("priority", "우선순위 절감", "핵심 기능을 지켰어요.", 2),
        option("flat-cut", "전부 동일 삭감", "중요한 팀도 약해져요.", 0),
        option("vendor", "외주 비용 재협상", "고정비를 낮췄어요.", 2),
      ]),
      turn("communication", "소통", "직원과 투자자에게 계획을 설명해야 해요.", "투명한 소통은 신뢰를 지켜요.", [
        option("clear", "명확히 공유", "불확실성이 줄었어요.", 2),
        option("hide", "숨기기", "불신이 커질 수 있어요.", 0),
        option("milestone", "마일스톤 제시", "회복 기준을 세웠어요.", 2),
      ]),
    ],
  },
  {
    title: "글로벌 확장",
    summary: "새 나라에 진출할 때 시장과 환율을 함께 봐요.",
    goal: "진출 전 검증 항목 고르기",
    concept: "글로벌 전략",
    turns: [
      turn("market", "시장 매력", "새 시장은 크지만 규제가 달라요.", "시장 크기와 규제를 함께 봐요.", [
        option("research", "시장 조사", "진출 근거를 모았어요.", 2),
        option("rush", "바로 진출", "숨은 비용을 놓칠 수 있어요.", 0),
        option("partner", "현지 파트너 탐색", "실행 위험을 낮췄어요.", 2),
      ]),
      turn("currency", "환율 변동", "매출과 비용의 통화가 달라요.", "환율이 이익을 흔들 수 있어요.", [
        option("hedge", "환위험 관리", "수익 변동을 줄였어요.", 2),
        option("ignore", "환율 무시", "예상 이익이 바뀔 수 있어요.", 0),
        option("local-cost", "현지 비용 검토", "비용 구조를 봤어요.", 2),
      ]),
      turn("launch", "진출 방식", "전면 진출과 파일럿 중 선택해야 해요.", "작게 검증하면 학습이 빨라요.", [
        option("pilot", "파일럿 출시", "위험을 낮추고 배웠어요.", 2),
        option("full", "전면 출시", "실패 비용이 큽니다.", 0),
        option("milestone", "단계별 목표", "확장 기준이 생겼어요.", 2),
      ]),
    ],
  },
]);
