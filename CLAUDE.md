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
├── index.html          # 홈/입력 화면 (Page 1)
├── results.html        # 분석 결과 화면 (Page 2)
├── .gitignore
├── CLAUDE.md           # ← 현재 파일
└── server/
    ├── index.js        # Express + Gemini API 프록시
    ├── package.json
    ├── .env            # 🔴 접근 금지 — API 키 보관
    └── .env.example    # ✅ 접근 가능 — 템플릿만 포함
```

## 기술 스택

- **프론트엔드:** HTML + Tailwind CSS (CDN) + Vanilla JS
- **백엔드:** Node.js + Express + `@google/generative-ai`
- **AI 모델:** Gemini 2.0 Flash (무료 티어)
- **디자인 시스템:** Midnight Canvas (DESIGN.md 참고)

## 개발 실행 방법

```bash
# 1. 의존성 설치 (최초 1회)
cd server && npm install

# 2. 서버 시작
npm run dev   # node --watch (자동 재시작)

# 3. 프론트엔드 서빙 (루트 디렉토리에서)
npx serve . -p 8080
```

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/analyze` | 코드 분석 요청 |
| GET  | `/health` | 서버 상태 확인 |

## 코드 작성 규칙

- 환경 변수는 `process.env.GEMINI_API_KEY` 형태로만 참조
- 새 환경 변수 추가 시 `.env.example`에도 반드시 추가 (값은 예시로)
- CORS origin 목록은 `server/index.js` 상단에서 관리
