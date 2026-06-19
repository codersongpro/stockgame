import type { LearningMission } from "../../../learning/types";

export const elementaryLowMissions: LearningMission[] = [
  {
    id: "el-coin-shop-1",
    level: "elementary_low",
    title: "첫 손님을 만나요",
    summary: "가격, 수량, 저금을 차례로 골라요.",
    goal: "손님 10명을 만나고 코인 20개 이상 남기기",
    concept: "가격과 저금",
    nextMissionId: "el-coin-shop-2",
    turns: [
      {
        id: "price",
        title: "가격을 정해요",
        body: "빵 하나를 몇 코인에 팔까요?",
        hint: "너무 비싸면 손님이 줄어요.",
        options: [
          { id: "kind-price", label: "3코인", result: "손님들이 기분 좋게 샀어요.", score: 2 },
          { id: "high-price", label: "8코인", result: "손님들이 조금 놀랐어요.", score: 0 },
        ],
      },
      {
        id: "make",
        title: "빵을 만들어요",
        body: "오늘은 빵을 몇 개 만들까요?",
        hint: "손님 수와 비슷하게 만들면 좋아요.",
        options: [
          { id: "make-ten", label: "10개", result: "손님 수와 잘 맞았어요.", score: 2 },
          { id: "make-too-many", label: "30개", result: "남은 빵이 많았어요.", score: 0 },
        ],
      },
      {
        id: "save",
        title: "번 돈을 나눠요",
        body: "남은 코인을 어떻게 할까요?",
        hint: "조금은 다음 날을 위해 남겨요.",
        options: [
          { id: "save-some", label: "조금 저금", result: "내일 쓸 코인을 남겼어요.", score: 2 },
          { id: "spend-all", label: "모두 쓰기", result: "오늘은 즐거웠지만 내일 돈이 부족해요.", score: 0 },
        ],
      },
    ],
  },
  {
    id: "el-coin-shop-2",
    level: "elementary_low",
    title: "몇 개를 만들까요?",
    summary: "손님 수를 보고 만들 수를 골라요.",
    goal: "남는 물건을 줄이고 손님을 만족시키기",
    concept: "수량 선택",
    nextMissionId: "el-coin-shop-3",
    turns: [
      {
        id: "customers",
        title: "손님을 세어요",
        body: "오늘 손님은 12명쯤 올 것 같아요.",
        hint: "손님 수와 비슷하게 준비해요.",
        options: [
          { id: "near", label: "12개", result: "준비한 수가 잘 맞았어요.", score: 2 },
          { id: "few", label: "4개", result: "물건이 모자랐어요.", score: 0 },
        ],
      },
      {
        id: "helper",
        title: "도움을 받을까요?",
        body: "친구가 가게 정리를 도와줄 수 있어요.",
        hint: "바쁠 때 도움을 받으면 손님이 기다리지 않아요.",
        options: [
          { id: "ask-help", label: "도움 받기", result: "가게가 빨리 정리됐어요.", score: 2 },
          { id: "alone", label: "혼자 하기", result: "조금 늦어졌어요.", score: 1 },
        ],
      },
      {
        id: "leftover",
        title: "남은 물건이 있어요",
        body: "물건이 조금 남았어요. 어떻게 할까요?",
        hint: "다음에는 만드는 수를 줄이면 돼요.",
        options: [
          { id: "learn", label: "다음엔 줄이기", result: "다음 계획이 좋아졌어요.", score: 2 },
          { id: "ignore", label: "그냥 두기", result: "왜 남았는지 알기 어려워요.", score: 0 },
        ],
      },
    ],
  },
  {
    id: "el-coin-shop-3",
    level: "elementary_low",
    title: "안전한 가게",
    summary: "손님과 물건을 안전하게 지켜요.",
    goal: "안전한 선택으로 별 2개 이상 받기",
    concept: "안전과 신뢰",
    nextMissionId: "el-coin-shop-4",
    turns: [
      {
        id: "clean",
        title: "가게를 살펴요",
        body: "바닥에 물이 조금 있어요.",
        hint: "넘어지지 않게 먼저 닦아요.",
        options: [
          { id: "wipe", label: "먼저 닦기", result: "손님이 안전하게 걸었어요.", score: 2 },
          { id: "skip", label: "그냥 열기", result: "조금 위험했어요.", score: 0 },
        ],
      },
      {
        id: "check",
        title: "물건을 확인해요",
        body: "상자 하나가 찌그러져 있어요.",
        hint: "좋은 물건만 팔면 손님이 믿어요.",
        options: [
          { id: "check-box", label: "상자 확인", result: "좋은 물건만 골랐어요.", score: 2 },
          { id: "sell-all", label: "모두 팔기", result: "손님이 걱정했어요.", score: 0 },
        ],
      },
      {
        id: "thanks",
        title: "손님이 고마워해요",
        body: "손님이 다시 오겠다고 말했어요.",
        hint: "친절한 가게는 다음 손님도 와요.",
        options: [
          { id: "say-thanks", label: "고맙다고 말하기", result: "손님이 웃었어요.", score: 2 },
          { id: "no-answer", label: "대답 안 하기", result: "손님이 조금 서운했어요.", score: 0 },
        ],
      },
    ],
  },
  {
    id: "el-coin-shop-4",
    level: "elementary_low",
    title: "광고는 조금만",
    summary: "손님을 부르는 돈과 남길 돈을 골라요.",
    goal: "광고하고도 코인 남기기",
    concept: "광고와 저금",
    nextMissionId: "el-coin-shop-5",
    turns: [
      {
        id: "poster",
        title: "포스터를 만들어요",
        body: "포스터를 붙이면 손님이 더 올 수 있어요.",
        hint: "돈을 모두 쓰지는 않아요.",
        options: [
          { id: "small-poster", label: "작게 만들기", result: "손님도 오고 돈도 남았어요.", score: 2 },
          { id: "huge-poster", label: "아주 크게 만들기", result: "멋지지만 돈이 거의 안 남아요.", score: 0 },
        ],
      },
      {
        id: "place",
        title: "어디에 붙일까요?",
        body: "사람들이 잘 보는 곳을 골라요.",
        hint: "손님이 지나가는 곳이 좋아요.",
        options: [
          { id: "front", label: "가게 앞", result: "손님들이 잘 봤어요.", score: 2 },
          { id: "back", label: "창고 뒤", result: "보는 사람이 적었어요.", score: 0 },
        ],
      },
      {
        id: "left-money",
        title: "남은 코인",
        body: "광고 뒤에도 내일 쓸 코인이 필요해요.",
        hint: "조금은 꼭 남겨요.",
        options: [
          { id: "keep", label: "남겨 두기", result: "내일도 장사할 수 있어요.", score: 2 },
          { id: "spend", label: "다 쓰기", result: "내일 준비가 어려워요.", score: 0 },
        ],
      },
    ],
  },
  {
    id: "el-coin-shop-5",
    level: "elementary_low",
    title: "축제 준비",
    summary: "많은 손님이 올 때 준비할 수를 골라요.",
    goal: "손님과 물건 수를 비슷하게 맞추기",
    concept: "계획",
    turns: [
      {
        id: "count",
        title: "손님을 예상해요",
        body: "축제에는 손님 20명쯤 올 것 같아요.",
        hint: "손님 수를 먼저 생각해요.",
        options: [
          { id: "twenty", label: "20개 준비", result: "손님 수와 잘 맞았어요.", score: 2 },
          { id: "five", label: "5개 준비", result: "물건이 너무 적었어요.", score: 0 },
        ],
      },
      {
        id: "helper",
        title: "친구와 나눠요",
        body: "혼자 하면 바쁠 수 있어요.",
        hint: "도움을 나누면 빨라져요.",
        options: [
          { id: "share", label: "역할 나누기", result: "손님을 빨리 맞이했어요.", score: 2 },
          { id: "alone", label: "혼자 하기", result: "조금 늦어졌어요.", score: 0 },
        ],
      },
      {
        id: "finish",
        title: "끝나고 확인해요",
        body: "오늘 무엇이 잘됐는지 볼까요?",
        hint: "확인하면 다음 축제가 더 쉬워요.",
        options: [
          { id: "review", label: "함께 보기", result: "다음 계획이 좋아졌어요.", score: 2 },
          { id: "skip", label: "그만 보기", result: "배운 점을 놓쳤어요.", score: 0 },
        ],
      },
    ],
  },
];
