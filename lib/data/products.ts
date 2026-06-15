export interface IndustryProductDef {
  id: string;
  name: string;
  emoji: string;
  demandShare: number;  // fraction of total demand (sums to ~1 for first 3)
  priceRatio: number;   // default price relative to industry.basePrice
  qualityRequired: number; // minimum company quality to offer this tier
  isRndUnlock: boolean; // if true, requires rndUnlockDone on company
}

export const INDUSTRY_PRODUCTS: Record<string, IndustryProductDef[]> = {
  tech: [
    { id: "p1", name: "기본 앱",          emoji: "📱", demandShare: 0.50, priceRatio: 0.6, qualityRequired: 0,  isRndUnlock: false },
    { id: "p2", name: "프로 소프트웨어",   emoji: "💻", demandShare: 0.35, priceRatio: 1.0, qualityRequired: 25, isRndUnlock: false },
    { id: "p3", name: "엔터프라이즈 솔루션",emoji: "🖥️", demandShare: 0.15, priceRatio: 2.0, qualityRequired: 55, isRndUnlock: false },
    { id: "p4", name: "AI 플랫폼",         emoji: "🤖", demandShare: 0.10, priceRatio: 3.5, qualityRequired: 75, isRndUnlock: true  },
  ],
  manufacturing: [
    { id: "p1", name: "표준 부품",    emoji: "⚙️",  demandShare: 0.50, priceRatio: 0.7, qualityRequired: 0,  isRndUnlock: false },
    { id: "p2", name: "정밀 기계",    emoji: "🔧",  demandShare: 0.35, priceRatio: 1.1, qualityRequired: 25, isRndUnlock: false },
    { id: "p3", name: "산업용 장비",  emoji: "🏗️",  demandShare: 0.15, priceRatio: 2.2, qualityRequired: 55, isRndUnlock: false },
    { id: "p4", name: "스마트 팩토리",emoji: "🤖",  demandShare: 0.08, priceRatio: 4.0, qualityRequired: 75, isRndUnlock: true  },
  ],
  food: [
    { id: "p1", name: "일반 식품",    emoji: "🥫",  demandShare: 0.55, priceRatio: 0.7, qualityRequired: 0,  isRndUnlock: false },
    { id: "p2", name: "간편식·HMR",   emoji: "🍱",  demandShare: 0.30, priceRatio: 1.1, qualityRequired: 20, isRndUnlock: false },
    { id: "p3", name: "프리미엄 식품", emoji: "🍽️", demandShare: 0.15, priceRatio: 1.8, qualityRequired: 50, isRndUnlock: false },
    { id: "p4", name: "기능성 식품",  emoji: "💊",  demandShare: 0.08, priceRatio: 3.0, qualityRequired: 70, isRndUnlock: true  },
  ],
  fashion: [
    { id: "p1", name: "베이직 라인",      emoji: "👕", demandShare: 0.50, priceRatio: 0.6, qualityRequired: 0,  isRndUnlock: false },
    { id: "p2", name: "트렌드 컬렉션",    emoji: "👗", demandShare: 0.35, priceRatio: 1.2, qualityRequired: 25, isRndUnlock: false },
    { id: "p3", name: "럭셔리 라인",      emoji: "💎", demandShare: 0.15, priceRatio: 2.5, qualityRequired: 60, isRndUnlock: false },
    { id: "p4", name: "시그니처 에디션", emoji: "✨",  demandShare: 0.08, priceRatio: 5.0, qualityRequired: 80, isRndUnlock: true  },
  ],
  energy: [
    { id: "p1", name: "기본 에너지",  emoji: "⚡",  demandShare: 0.55, priceRatio: 0.8, qualityRequired: 0,  isRndUnlock: false },
    { id: "p2", name: "산업용 에너지",emoji: "🔌",  demandShare: 0.30, priceRatio: 1.1, qualityRequired: 20, isRndUnlock: false },
    { id: "p3", name: "청정 에너지",  emoji: "🌱",  demandShare: 0.15, priceRatio: 1.7, qualityRequired: 50, isRndUnlock: false },
    { id: "p4", name: "수소 에너지",  emoji: "💧",  demandShare: 0.08, priceRatio: 3.0, qualityRequired: 75, isRndUnlock: true  },
  ],
  finance: [
    { id: "p1", name: "기본 금융상품",   emoji: "🏧", demandShare: 0.50, priceRatio: 0.7, qualityRequired: 0,  isRndUnlock: false },
    { id: "p2", name: "투자 서비스",     emoji: "📈", demandShare: 0.35, priceRatio: 1.2, qualityRequired: 25, isRndUnlock: false },
    { id: "p3", name: "프라이빗 뱅킹",  emoji: "💰", demandShare: 0.15, priceRatio: 2.5, qualityRequired: 60, isRndUnlock: false },
    { id: "p4", name: "디지털 자산 관리",emoji: "📊", demandShare: 0.08, priceRatio: 3.5, qualityRequired: 75, isRndUnlock: true  },
  ],
  entertainment: [
    { id: "p1", name: "기본 게임",   emoji: "🎮", demandShare: 0.50, priceRatio: 0.6, qualityRequired: 0,  isRndUnlock: false },
    { id: "p2", name: "콘솔·PC 게임",emoji: "🕹️", demandShare: 0.35, priceRatio: 1.2, qualityRequired: 25, isRndUnlock: false },
    { id: "p3", name: "AAA 타이틀", emoji: "🏆",  demandShare: 0.15, priceRatio: 2.0, qualityRequired: 55, isRndUnlock: false },
    { id: "p4", name: "VR 메타버스", emoji: "🥽", demandShare: 0.10, priceRatio: 3.5, qualityRequired: 75, isRndUnlock: true  },
  ],
  bio: [
    { id: "p1", name: "일반 의약품",   emoji: "💊", demandShare: 0.50, priceRatio: 0.7, qualityRequired: 0,  isRndUnlock: false },
    { id: "p2", name: "처방 의약품",   emoji: "🩺", demandShare: 0.35, priceRatio: 1.5, qualityRequired: 30, isRndUnlock: false },
    { id: "p3", name: "바이오의약품",  emoji: "🧬", demandShare: 0.15, priceRatio: 3.0, qualityRequired: 60, isRndUnlock: false },
    { id: "p4", name: "신약 개발 성공",emoji: "✨", demandShare: 0.08, priceRatio: 6.0, qualityRequired: 80, isRndUnlock: true  },
  ],
  ai: [
    { id: "p1", name: "AI API 서비스",  emoji: "🔌", demandShare: 0.50, priceRatio: 0.6, qualityRequired: 0,  isRndUnlock: false },
    { id: "p2", name: "AI 솔루션",      emoji: "🤖", demandShare: 0.35, priceRatio: 1.3, qualityRequired: 25, isRndUnlock: false },
    { id: "p3", name: "맞춤형 AI 모델", emoji: "🧠", demandShare: 0.15, priceRatio: 3.0, qualityRequired: 60, isRndUnlock: false },
    { id: "p4", name: "AGI 플랫폼",     emoji: "💫", demandShare: 0.10, priceRatio: 8.0, qualityRequired: 85, isRndUnlock: true  },
  ],
  robotics: [
    { id: "p1", name: "산업용 로봇팔", emoji: "🦾", demandShare: 0.50, priceRatio: 0.8, qualityRequired: 0,  isRndUnlock: false },
    { id: "p2", name: "협동 로봇",     emoji: "🤝", demandShare: 0.35, priceRatio: 1.3, qualityRequired: 25, isRndUnlock: false },
    { id: "p3", name: "자율주행 로봇", emoji: "🚗", demandShare: 0.15, priceRatio: 2.5, qualityRequired: 60, isRndUnlock: false },
    { id: "p4", name: "인간형 로봇",   emoji: "🦿", demandShare: 0.08, priceRatio: 5.0, qualityRequired: 80, isRndUnlock: true  },
  ],
  space: [
    { id: "p1", name: "위성 서비스",  emoji: "📡", demandShare: 0.50, priceRatio: 0.8, qualityRequired: 0,  isRndUnlock: false },
    { id: "p2", name: "발사체 서비스",emoji: "🚀", demandShare: 0.35, priceRatio: 1.5, qualityRequired: 30, isRndUnlock: false },
    { id: "p3", name: "우주 관광",    emoji: "🌌", demandShare: 0.15, priceRatio: 3.0, qualityRequired: 60, isRndUnlock: false },
    { id: "p4", name: "우주 정거장",  emoji: "🛸", demandShare: 0.08, priceRatio: 7.0, qualityRequired: 85, isRndUnlock: true  },
  ],
  ev: [
    { id: "p1", name: "보급형 EV",    emoji: "🚗", demandShare: 0.50, priceRatio: 0.7, qualityRequired: 0,  isRndUnlock: false },
    { id: "p2", name: "중형 전기차",  emoji: "🚙", demandShare: 0.35, priceRatio: 1.2, qualityRequired: 25, isRndUnlock: false },
    { id: "p3", name: "프리미엄 전기차",emoji: "🏎️",demandShare: 0.15, priceRatio: 2.5, qualityRequired: 60, isRndUnlock: false },
    { id: "p4", name: "자율주행 EV",  emoji: "✨", demandShare: 0.08, priceRatio: 4.5, qualityRequired: 80, isRndUnlock: true  },
  ],
  crypto_co: [
    { id: "p1", name: "거래소 서비스", emoji: "💹", demandShare: 0.50, priceRatio: 0.6, qualityRequired: 0,  isRndUnlock: false },
    { id: "p2", name: "DeFi 플랫폼",  emoji: "⛓️", demandShare: 0.35, priceRatio: 1.2, qualityRequired: 25, isRndUnlock: false },
    { id: "p3", name: "NFT·토큰 서비스",emoji: "🎨",demandShare: 0.15, priceRatio: 2.0, qualityRequired: 50, isRndUnlock: false },
    { id: "p4", name: "Web3 솔루션",  emoji: "🌐", demandShare: 0.10, priceRatio: 3.5, qualityRequired: 75, isRndUnlock: true  },
  ],
};

export function getIndustryProducts(industryId: string): IndustryProductDef[] {
  return INDUSTRY_PRODUCTS[industryId] ?? INDUSTRY_PRODUCTS.tech;
}
