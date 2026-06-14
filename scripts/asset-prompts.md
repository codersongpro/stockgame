# 유니콘 시티 — 그래픽 에셋 제작 프롬프트 가이드

아래 프롬프트들을 이미지 생성 AI(Midjourney, DALL·E, Stable Diffusion 등)에 붙여 넣어 에셋을 제작하세요.
모든 이미지는 **흰 배경 또는 투명 배경**, **정사각형(512×512 또는 256×256)** 으로 제작하면 자동 전처리가 됩니다.

---

## 1. 건물 에셋 (아직 미제작 5종)

현재 없는 건물 타입: `warehouse`, `power`, `hr`, `park`, `dorm`, `lab`

### 공통 스타일 가이드
```
Isometric pixel-art building icon, cute cartoon style, vibrant colors,
white background, no shadow, top-down 45-degree isometric view,
clean lines, game asset style similar to [이미 제작된 건물들과 같은 스타일]
```

### 창고 (warehouse)
```
Isometric cartoon warehouse building icon, large gray industrial storage
building with loading docks, forklift nearby, boxes stacked outside,
orange accent details, white background, cute game asset style
```

### 발전소 (power)
```
Isometric cartoon power plant / electrical substation icon, yellow and blue
colors, lightning bolt symbol on the wall, energy meter, white background,
cute chibi game building style
```

### 인사센터 / HR 건물 (hr)
```
Isometric cartoon HR office building icon, warm beige/cream colors,
people silhouettes in windows, "HR" or person icon on signboard,
welcoming entrance, white background, cute game asset style
```

### 공원 (park)
```
Isometric cartoon park / green space icon, lush trees, benches, flower beds,
winding path, bright greens, white background, cute chibi game art style,
top-down isometric view
```

### 기숙사 / 사원 숙소 (dorm)
```
Isometric cartoon dormitory / apartment building icon, multiple floors,
small windows with warm light, cozy feel, pastel colors,
white background, cute game asset style
```

### 고급 연구소 (lab)
```
Isometric cartoon advanced research laboratory icon, sleek modern design,
glass and steel, glowing blue accents, science equipment visible,
different from the R&D building (which is purple), white background,
cute chibi game building style
```

---

## 2. UI 아이콘 (추가 필요)

아이콘은 128×128px, 투명 배경 PNG로 제작하세요.

### 경영 결정 아이콘
```
Simple flat icon set (128×128 each, transparent background):
- 판매가격 아이콘: price tag with Korean won symbol ₩
- 생산량 아이콘: factory gear + box
- 마케팅 아이콘: megaphone with colorful stars
- R&D 아이콘: microscope / flask / lightbulb
- 복지 아이콘: heart with people inside
- 안전 아이콘: hard hat / shield with checkmark
Cute, colorful, minimal line-art icons, game UI style
```

### 경제 지표 아이콘
```
Simple flat icon set for economic indicators (128×128, transparent bg):
- GDP 성장률: rising arrow with bar chart
- 물가/인플레이션: price tag going up with flame
- 기준금리: percentage symbol with bank building
- 시장심리: heart pulse graph / sentiment meter
Minimalist, clean, single color or two-tone, game UI style
```

### 게임 내 통화/자산 아이콘
```
Simple flat icons (128×128, transparent):
- 현금: stack of Korean won coins (₩)
- 투자자산: pie chart with growth arrow
- 기업가치: building with star rating
- 부채: chain / weight with negative symbol
Cute cartoon style, game UI asset
```

---

## 3. 캐릭터 — 임원진 (CharacterRole 6종 추가 스타일)

현재 6종의 역할 이미지가 있지만 다양한 외모로 더 제작 가능합니다.
아래 프롬프트로 각 역할별 **대안 이미지 2세트**를 추가 제작하면 게임에서 
더 다양한 임원 얼굴이 나타납니다.

각 역할별 스타일 가이드 (4×2 그리드, 512×512):
```
4 columns × 2 rows grid of chibi anime-style character portraits,
Korean webtoon art style, clean white background, circular colorful badge
behind each character, diverse characters (different genders, skin tones, hair),

Row 1 (CEO variants): executive suit, confident pose, with leadership props
Row 2 (CTO variants): tech/developer look, glasses optional, with tech props
- similar to existing talent character grid style
- each portrait 256×256px within the grid
```

---

## 4. 특수 이벤트 배경 / 씬 카드

분기 보고서나 특수 이벤트에 사용할 와이드 일러스트:

### 분기 보고서 배경
```
Wide landscape illustration (16:9 ratio, 1280×720px), Korean corporate office
interior, floor-to-ceiling windows with city view, conference room with
presentation screen showing charts, warm professional atmosphere,
cartoon/webtoon style, light blue and cream color palette
```

### 주가 상승 이벤트
```
Wide banner illustration (1280×320px), bull market celebration scene,
cartoon stock chart going up with gold coins raining, confetti,
happy cartoon business people, green and gold color palette, game banner style
```

### 주가 하락 이벤트
```
Wide banner illustration (1280×320px), bear market scene, cartoon stock chart
going down with worried cartoon business person, blue/gray rainy mood,
game banner style, not too dark (still cartoon fun)
```

### 방문자 환영 배경
```
Wide banner illustration (1280×320px), company lobby reception scene,
red carpet entrance, banner reading "환영합니다", smiling staff,
bright cheerful colors, cartoon/webtoon style
```

---

## 5. 로딩 화면 / 스플래시

```
Game splash screen illustration (1080×1920 mobile or 1920×1080 desktop),
"유니콘 시티" logo prominently displayed, cityscape background with
isometric buildings and a unicorn mascot character, Korean business game,
colorful and exciting, cartoon style, vibrant gradient sky background
```

---

## 6. 마스코트 캐릭터 제안

```
Cute unicorn mascot character (transparent background, 512×512),
wearing a business suit and CEO badge, holding a stock chart tablet,
chibi style, rainbow horn, smiling, game mascot style,
Korean educational game character design
```

---

## 처리 방법

에셋을 생성한 후 `/scripts/process-assets.py` 스크립트로 전처리하세요:

```bash
# 건물 에셋 처리 (단일 파일)
python3 scripts/process-assets.py --input image.png --output public/assets/buildings/warehouse.png --size 300

# 그리드 이미지 분할 (4×2 그리드)
python3 scripts/process-assets.py --input grid.png --cols 4 --rows 2 --output-dir public/assets/characters/ --names "name1,name2,..."
```

현재 완성된 에셋:
- ✅ 건물 9종 (factory, rnd, office, store, cafeteria, gym, daycare, clinic, warehouse)
- ✅ 캐릭터 32종 (talent_01~32) - 인재시장 다양한 얼굴
- ✅ 유명인 32종 (famous_01~32) - 방문 이벤트 초상화
- ✅ 역할 이미지 6종 (ceo, cto, cmo, cfo, coo, chro)
- ✅ 아이콘 2종 (stock, news)
- ⬜ 건물 5종 (warehouse 신형, power, hr, park, dorm, lab)
- ⬜ UI 아이콘 세트
- ⬜ 이벤트 배경 일러스트
- ⬜ 마스코트 캐릭터
