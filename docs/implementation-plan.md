# 개별 학습 캠페인 구현 계획

## Phase 1

- 레벨을 6단계로 확장한다.
- 기존 저장값 `elementary`, `university`는 각각 `elementary_high`, `adult`로 변환한다.
- 저장 데이터는 로드 시 검증하고, 변환 전 원본은 백업 키에 한 번 보관한다.
- 기존 샌드박스 경로는 유지한다.

## Phase 2

- `/learn`에서 초등 1~2학년 학습 캠페인을 시작한다.
- `/learn/mission/[missionId]`에서 미션을 진행한다.
- 첫 버전은 미션 3개, 선택지 2개, 3턴 진행, 힌트, 성공/재도전, 별 1~3개만 제공한다.
- 학습 진행은 `learningStore`와 별도 localStorage 키로 관리한다.

## 검증

- `npm test`
- `npm run build`
- `npm run lint`

## 이후

- 초등 3~4학년부터 성인까지 미션을 단계적으로 확장한다.
- 적응형 도움과 보상 시스템은 미션 루프가 안정화된 뒤 추가한다.
