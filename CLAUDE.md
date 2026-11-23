# 프로젝트 메모

## YouTube 스킬 팩 (`.claude/skills/yt-*`)

[Jakeschincariol/youtube-agent-skill](https://github.com/Jakeschincariol/youtube-agent-skill) @ `a2feb21` (MIT)을 그대로 복사해 둔 것이다.
아래 작업을 요청받으면 해당 스킬을 먼저 불러서 쓴다.

| 이런 요청이 오면 | 쓸 스킬 |
|---|---|
| 썸네일 문구, 제목, "뭐라고 제목 달지", 클릭률이 낮음 | `/yt-package` |
| 대본, 훅, 첫 15초, "무슨 말 하지" | `/yt-script` |
| 긴 영상에서 쇼츠 뽑기, 클립 | `/yt-shorts` |
| 컷 편집, 정적·군말 제거 (자막 파일 기준) | `/yt-edit` |
| 설명란, 태그, 검색 노출 | `/yt-seo` |
| 챕터, 타임스탬프 | `/yt-chapters` |
| 댓글 답글 | `/yt-comment` |
| 업로드 계획, 콘텐츠 캘린더 | `/yt-plan` |
| 시청 지속률, 이탈 구간 분석 | `/yt-retention` |
| 내 분야에서 잘된 영상 찾기, 경쟁 채널 조사 | `/yt-viral` |
| 채널 전체 점검 | `/yt-audit` |

- 모든 스킬은 말투 프로필 `~/.claude/youtube/voice.md`를 읽는다. 클라우드 세션에서는 `~/.claude`가 매 세션 초기화되므로
  프로필은 이 저장소의 `.claude/youtube/voice.md`에 두고 (`shorts-project/voice/`는 내레이션 음성 파일 폴더라 별개), 없으면 사용자에게 영상 3개를 받아 만든 뒤
  `~/.claude/youtube/voice.md`로 복사해서 쓴다.
- 이 채널 대본은 `shorts-project/우리대본.md`에 있다. 말투 프로필을 만들 때 참고한다.
- 스킬은 글만 쓴다. 업로드는 사용자가 직접 한다.
