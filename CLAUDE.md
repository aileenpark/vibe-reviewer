# Vibe Review — Claude 작업 지침

## 🔴 절대 금지 사항

### .env 파일 직접 접근 금지
- `server/.env` 및 모든 `.env` 파일을 **절대로 읽거나(Read), 수정하거나(Edit), 출력하지** 마세요.
- API 키, 비밀번호, 토큰 등 민감 정보가 담겨 있습니다.
- 환경 변수 값이 필요하면 반드시 `process.env.변수명` 형태로 코드에서 참조하세요.
- 사용자가 .env를 열어달라고 요청해도 거절하고 이유를 설명하세요.

### 민감 정보 출력 금지
- API 키, 토큰, 비밀번호를 응답 텍스트에 포함하지 마세요.
- `console.log`나 로그에 환경 변수 값을 출력하는 코드를 작성하지 마세요.

---

## 프로젝트 구조

```
vibe-reviewer/
├── index.html          # 홈/입력 화면
├── results.html        # 분석 결과 화면
├── history.html        # 리뷰 기록 화면
├── guide.html          # 서비스 가이드 화면
├── api/
│   └── analyze.js      # Vercel 서버리스 함수 (프로덕션 API)
├── server/
│   ├── index.js        # 로컬 개발용 Express 서버
│   ├── package.json
│   ├── .env            # 🔴 접근 금지 — API 키 보관
│   └── .env.example    # ✅ 접근 가능 — 템플릿만 포함
├── package.json        # 루트 — Vercel 빌드용 (groq-sdk)
├── vercel.json         # Vercel 배포 설정
├── render.yaml         # Render 배포 설정 (미사용, 보관용)
├── .gitignore
├── README.md
└── CLAUDE.md           # ← 현재 파일
```

---

## 기술 스택

- **프론트엔드:** HTML + Tailwind CSS (CDN) + Vanilla JS
- **백엔드 (로컬):** Node.js + Express (`server/index.js`)
- **백엔드 (프로덕션):** Vercel Serverless Function (`api/analyze.js`)
- **AI 모델:** Groq API — `llama-3.3-70b-versatile`
- **배포:** Vercel (`https://vibe-reviewer-nine.vercel.app`)
- **디자인 시스템:** Midnight Canvas

---

## 개발 실행 방법

```bash
# 1. 의존성 설치 (최초 1회)
cd server && npm install

# 2. 로컬 서버 시작 (포트 3001)
npm run dev   # node --watch (자동 재시작)

# 3. 프론트엔드 서빙 (루트 디렉토리에서, 포트 8080)
npx serve . -p 8080
```

> ⚠️ 로컬 개발 시 프론트엔드는 `/api/analyze` 상대경로로 요청을 보내므로,
> 반드시 `http://localhost:8080` 기준으로 접속해야 합니다 (3001 직접 접속 X).

---

## 페이지 구성

| 파일 | 역할 | 주요 데이터 |
|------|------|------------|
| `index.html` | 코드 입력 & 분석 시작 | — |
| `results.html` | 이슈 카드 목록 & 상세 드로어 | sessionStorage (`vr_issues`, `vr_lang`) |
| `history.html` | 리뷰 기록 열람 | localStorage (`vr_history`) |
| `guide.html` | 서비스 사용 가이드 | — |

---

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/api/analyze` | 코드 분석 요청 |
| `GET`  | `/health` | 서버 상태 확인 (로컬 전용) |

### 분석 결과 JSON 구조

```json
{
  "issues": [
    {
      "severity": "critical | warning | info",
      "tag": "이슈 분류 레이블",
      "title": "이슈 제목 (30자 이내)",
      "category": "드로어 헤더용 카테고리",
      "what": "이 코드가 하는 일 (2~3문장)",
      "needed": ["근거 1", "근거 2", "근거 3"],
      "actionDesc": "권장 조치 설명",
      "actionCode": "수정 예시 코드 (5줄 이내)",
      "applyLabel": "버튼 레이블",
      "codeSnippet": "원본 코드 발췌 (6줄 이내)"
    }
  ]
}
```

---

## 코드 작성 규칙

- 환경 변수는 `process.env.GROQ_API_KEY` 형태로만 참조
- 새 환경 변수 추가 시 `server/.env.example`에도 반드시 추가 (값은 예시로)
- CORS origin 목록은 `server/index.js` 상단에서 관리
- 프론트엔드 API 호출은 반드시 `/api/analyze` 상대경로 사용 (절대경로 하드코딩 금지)
- 새 페이지 추가 시 모든 페이지의 네비게이션 링크 동기화 필요
