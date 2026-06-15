# 투자 자산 클래스 아이콘 프롬프트 (8종)

> 투자 데스크(`components/InvestmentDesk.tsx`)에서 각 자산 클래스를 현재 이모지로 표시 중입니다.
> 아래 8종 아이콘을 제작하면 주식/대시보드와 동일한 그래픽 퀄리티로 통일할 수 있습니다.
> 자산 정의 출처: `lib/engine/assets.ts` (`ASSET_DEFS`).

## 공통 규칙
- 사이즈: **256×256px**, **투명 배경** (또는 흰 배경 → 전처리로 투명화)
- 스타일: 기존 재무/경영 아이콘(`MGMT_ICONS`, `FINANCE_ICONS`)과 동일한 **플랫 2-톤 게임 UI 아이콘**
- 각 아이콘 뒤에 부드러운 원형 배지(soft circular badge)를 두어 톤을 통일
- 8개를 **하나의 일관된 세트**로 제작 (스트로크 두께·채도 동일)
- 제작 후 `scripts/process-assets.py`로 전처리(흰 배경 임계값 235 → 투명)

## 세트 통합 프롬프트
```
A set of 8 flat round investment-asset icons (256x256 each, transparent background),
consistent cute game-UI style, two-tone with a soft circular badge behind each,
matching existing finance icons:
- deposit (예금·적금): a bank building / piggy bank, safe calm blue
- bond (채권): a rolled certificate scroll with a ribbon, steady teal-green
- etf (ETF·펀드): a woven basket holding several mini coins/charts, balanced purple
- realestate (부동산): a house with a small rent/key tag, warm orange
- gold (금): a stack of gold bars, bright gold
- oil (원유): an oil barrel with a single drop, dark amber
- fx (외환·달러): a US dollar bill / $ coin, green
- crypto (암호화폐): a coin with a chain-link / circuit motif, vivid purple-blue
Minimalist, clean, consistent stroke weight, matching the existing economy/finance icons
```

## 파일명 & 매핑
배치: `public/assets/icons/`

| 자산 ID | 한글명 | 현재 이모지 | 제작 파일명 |
|---------|--------|------------|------------|
| `deposit` | 예금·적금 | 🏦 | `asset_deposit.png` |
| `bond` | 채권 | 📜 | `asset_bond.png` |
| `etf` | ETF·펀드 | 🧺 | `asset_etf.png` |
| `realestate` | 부동산 | 🏠 | `asset_realestate.png` |
| `gold` | 금 | 🥇 | `asset_gold.png` |
| `oil` | 원유 | 🛢️ | `asset_oil.png` |
| `fx` | 외환(달러) | 💵 | `asset_fx.png` |
| `crypto` | 암호화폐 | 🪙 | `asset_crypto.png` |

## 처리 & 반영

```bash
# 예시: 단일 아이콘 전처리(흰 배경 → 투명, 트림, 256 리사이즈)
python3 scripts/process-assets.py --input raw_bond.png \
  --output public/assets/icons/asset_bond.png --size 256
```

반영 절차:
1. `lib/assetMap.ts`에 `ASSET_ICONS` 상수 추가
   ```ts
   export const ASSET_ICONS: Record<string, string> = {
     deposit:    "/assets/icons/asset_deposit.png",
     bond:       "/assets/icons/asset_bond.png",
     etf:        "/assets/icons/asset_etf.png",
     realestate: "/assets/icons/asset_realestate.png",
     gold:       "/assets/icons/asset_gold.png",
     oil:        "/assets/icons/asset_oil.png",
     fx:         "/assets/icons/asset_fx.png",
     crypto:     "/assets/icons/asset_crypto.png",
   };
   ```
2. `components/InvestmentDesk.tsx`에서 자산 이모지 표시부를 `<img src={ASSET_ICONS[asset.id]} ... />`로 교체
   (`MGMT_ICONS`/`FINANCE_ICONS` 사용 패턴 참고)
