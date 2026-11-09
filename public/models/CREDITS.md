# 3D 모델 출처

## 건물 (`buildings/`)
- 원본: **City Kit Industrial 1.0**(`ind-*`), **City Kit Commercial 2.1**(`com-*`) — Kenney (https://www.kenney.nl)
- 라이선스: **CC0 1.0** (퍼블릭 도메인)
- 가공: 텍스처를 파일 안에 넣고 정리·양자화 + meshopt 압축 (33종, 합계 약 1.3MB, 모델당 약 40KB)
- 색: 원본은 회색·남색 단색이라 게임 코드(`components/campus/GltfBuilding.tsx`)의 셰이더가
  밝은 벽 → 밝은 종류 색, 짙은 띠·지붕 → 진한 종류 색으로 칠함 (창문은 원래 색 유지)

## 인물 (`people/`)

| 파일 (`people/`) | 원본 (Ultimate Animated Character Pack) |
|---|---|
| `suit-male.glb` / `suit-female.glb` | Suit_Male / Suit_Female |
| `casual-male.glb` / `casual-female.glb` | Casual_Male / Casual_Female |
| `worker-male.glb` / `worker-female.glb` | Worker_Male / Worker_Female |
| `kid-boy.glb` / `kid-girl.glb` | Casual2_Male / Casual2_Female (게임에서 작게 축소) |

- 제작자: Quaternius (https://quaternius.com)
- 라이선스: **CC0 1.0** (퍼블릭 도메인, 출처 표기 의무 없음 — 감사의 뜻으로 기록)

## 가공 내용 (gltf-transform)
1. 동작 3개(Idle·Walk·Victory)만 남김
2. 원본은 신발과 피부가 같은 `Skin` 재질 → 발목 아래 삼각형을 `Shoes` 재질(검정)로 분리
3. 정점 양자화 + meshopt 압축 (모델당 1.0~1.3MB → 115~150KB, 8종 합계 약 1.1MB)

피부·머리·옷 색은 게임 코드(`components/campus/GltfPerson.tsx`, `CompanyMap3D.tsx`의 `CampusPerson`)에서 사람마다 지정합니다.
