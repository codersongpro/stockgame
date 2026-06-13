// Motif templates inspired by well-known listed companies worldwide. Names are
// lightly fictionalised; values are balanced game profiles, NOT real financials.
// Selecting a preset pre-fills industry, country, starting scale and brand color.

export interface CompanyPreset {
  id: string;
  name: string;
  industryId: string;
  countryId: string;
  logoColor: string;
  /** Relative starting scale multiplier applied to cash/quality/reputation. */
  scale: number;
  blurb: string;
}

export const COMPANY_PRESETS: CompanyPreset[] = [
  // Korea
  { id: "samsong", name: "삼송전자", industryId: "ai", countryId: "kr", logoColor: "#1428a0", scale: 1.6, blurb: "반도체·전자 거인" },
  { id: "hyundo", name: "현도자동차", industryId: "ev", countryId: "kr", logoColor: "#002c5f", scale: 1.4, blurb: "글로벌 완성차" },
  { id: "naber", name: "네버", industryId: "tech", countryId: "kr", logoColor: "#03c75a", scale: 1.2, blurb: "검색·플랫폼" },
  { id: "kakdo", name: "카카도", industryId: "tech", countryId: "kr", logoColor: "#ffcd00", scale: 1.1, blurb: "메신저·핀테크" },
  // USA
  { id: "pear", name: "페어", industryId: "ai", countryId: "us", logoColor: "#555555", scale: 1.8, blurb: "프리미엄 디바이스" },
  { id: "softmax", name: "소프트맥스", industryId: "tech", countryId: "us", logoColor: "#00a4ef", scale: 1.7, blurb: "소프트웨어·클라우드" },
  { id: "voltra", name: "볼트라", industryId: "ev", countryId: "us", logoColor: "#cc0000", scale: 1.5, blurb: "전기차·에너지" },
  { id: "nvidcondor", name: "엔비콘", industryId: "ai", countryId: "us", logoColor: "#76b900", scale: 1.6, blurb: "AI 가속 칩" },
  { id: "amazonia", name: "아마조니아", industryId: "tech", countryId: "us", logoColor: "#ff9900", scale: 1.7, blurb: "전자상거래·클라우드" },
  { id: "starflix", name: "스타플릭스", industryId: "entertainment", countryId: "us", logoColor: "#e50914", scale: 1.2, blurb: "스트리밍" },
  { id: "starlinkr", name: "스타링커", industryId: "space", countryId: "us", logoColor: "#111827", scale: 1.4, blurb: "민간 우주" },
  // Japan
  { id: "tonota", name: "토노타", industryId: "ev", countryId: "jp", logoColor: "#eb0a1e", scale: 1.5, blurb: "하이브리드·완성차" },
  { id: "sany", name: "사니", industryId: "entertainment", countryId: "jp", logoColor: "#000000", scale: 1.3, blurb: "전자·게임·엔터" },
  { id: "nintondo", name: "닌텐도우", industryId: "entertainment", countryId: "jp", logoColor: "#e60012", scale: 1.2, blurb: "게임 콘솔" },
  // Europe
  { id: "benzwerk", name: "벤츠베르크", industryId: "ev", countryId: "de", logoColor: "#00adef", scale: 1.4, blurb: "프리미엄 자동차" },
  { id: "siemann", name: "지멘", industryId: "robotics", countryId: "de", logoColor: "#009999", scale: 1.4, blurb: "산업 자동화" },
  { id: "sapphire", name: "사파이어", industryId: "tech", countryId: "de", logoColor: "#0faaff", scale: 1.3, blurb: "기업용 소프트웨어" },
  // China / India
  { id: "alibobo", name: "알리보보", industryId: "tech", countryId: "cn", logoColor: "#ff6a00", scale: 1.6, blurb: "전자상거래" },
  { id: "tencube", name: "텐큐브", industryId: "entertainment", countryId: "cn", logoColor: "#1296db", scale: 1.5, blurb: "게임·메신저" },
  { id: "byvolt", name: "비볼트", industryId: "ev", countryId: "cn", logoColor: "#d81e06", scale: 1.4, blurb: "전기차·배터리" },
  { id: "infobyte", name: "인포바이트", industryId: "tech", countryId: "in", logoColor: "#007cc3", scale: 1.1, blurb: "IT 서비스" },
];

export const PRESET_MAP: Record<string, CompanyPreset> = Object.fromEntries(
  COMPANY_PRESETS.map((p) => [p.id, p]),
);
