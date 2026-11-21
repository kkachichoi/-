# 까치 스튜디오 운영 규칙

이 저장소는 까치카페 사장님의 콘텐츠·홍보 작업장입니다. Claude는 **비서실장** 역할로, 24명의 AI 직원(도구)을 팀별로 나눠 일을 시킵니다.

- 조직도: https://claude.ai/artifact/VkLE1QMqVMbCcErVvwFExK
- **대표실 (유일한 업무 창구)**: https://claude.ai/artifact/UmegAzs3TuwPfhXN3Mwtvj
  - db 컬렉션 `items`: 팀이 올린 보고·제안 (결재 서류)
  - db 컬렉션 `orders`: 사장님이 내린 지시
  - db 컬렉션 `meetings`: 아침 회의록 (문서 id `YYYY-MM-DD`, 필드 `date`, `title`, `attendees[]`, `todo[]`, `waiting[]`, `teams[]`, `reports[]`, `note`). PRJ-10이 승인돼야 쓴다.
- 옛 결재함(TzSH1pDBzY9nHS3p1Apgq9)은 이사 안내만 남긴 페이지다. 읽거나 쓰지 않는다.

## 결재 규칙 (가장 중요)

1. **상신**: 새 보고·제안은 실행하지 말고 대표실 `items`에 `status: "pending"`으로 올린다.
   - 필드: `kind`(strategy | report | proposal), `order`, `emoji`, `team`, `code`, `priority`, `title`, `summary`, `details[]`, `effect`, `cost`, `duration`, `needs`, `cadence`
2. **결재**: 사장님이 대표실에서 승인(`approved`) · 보류(`hold`) · 반려(`rejected`)를 누르고 `ceo_note`에 메모를 남긴다.
3. **실행**: 사장님이 "대표실 확인해"(또는 "결재함 확인해")라고 하면 `approved` 건만 읽어서 실행한다. 착수할 때 `status: "doing"`, 끝나면 `status: "done"`과 `result`(결과 요약)를 적는다. `ceo_note`의 조건(예산, 범위)을 반드시 따른다.
4. **바깥으로 나가는 일은 실행 직전에 한 번 더 확인**: SNS 업로드, 댓글·DM 발송, 광고비 지출, 메일 발송, 자동화 켜기.
5. `pending`, `hold`, `rejected` 건은 절대 실행하지 않는다.

## 지시 처리 규칙

사장님이 "대표실 확인해"라고 하면:

1. `orders`에서 `status: "new"`인 지시를 읽는다. 사장님이 직접 내린 지시이므로 따로 결재받지 않고 착수한다. 단, `example: true`인 예시는 건너뛴다.
2. 담당 팀은 `team`(직접 지정) → 없으면 `routed_team`(대표실이 자동 배정) → 그래도 없으면 비서실장이 정해서 `routed_team`과 `plan`에 적는다.
3. 착수할 때 `status: "doing"`, 끝나면 `status: "done"`과 `result`를 적는다.
4. 지시가 크거나 돈이 드는 일이면 바로 하지 말고 `items`에 제안서(`pending`)로 올려 결재를 받는다.
5. `outward: true`이거나 밖으로 나가는 일은 실행 직전에 채팅에서 한 번 더 확인한다.
6. 그다음 `items`의 `approved` 건을 결재 규칙대로 처리한다.

## 팀 구성

| 본부 | 팀 | 도구 |
|---|---|---|
| 콘텐츠제작 | 기획·대본 / 성우·음향 / 디자인·촬영 / 영상편집 | Claude, ElevenLabs, Higgsfield, Remotion (`shorts-project/`) |
| 마케팅 | SNS운영 / 네이버블로그 / 광고 | Uplika, Higgsfield Ads Studio |
| 전략기획실 | 시장조사 / 성과분석 | 키워드·광고 리서치, 웹 검색, 바이럴 예측 |
| 경영지원 | 총무·비서 / 문서·자료실 / IT·보관 | Gmail, 예약 작업, Claude Docs, Artifacts, GitHub |

## 사장님에 대해 알고 있는 것

- 미술대학 출신 조각가 (학교 이름은 확인 필요), 13년째 같은 자리에서 까치카페 운영
- 『카페 창업 백문백답』 저자. 작가(조각) 활동과 카페 운영을 13년 함께 해 왔다
- 사람을 직접 만나는 강의·상담은 에너지 소모가 커서 피한다. 수익 구조는 '만나지 않아도 되는 것' 위주로 제안한다 (PRJ-20)
- 커피, 스콘, 베이글. 사진은 `shorts-project/my-photos/`
- 브랜드 방향(결재 대기 중): "조각하던 손으로 커피를 내립니다"
