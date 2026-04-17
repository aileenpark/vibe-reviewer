# Vibe Review

> AI 코딩 세션의 잔재 코드를 탐지하고 정리 방향을 제시하는 코드 리뷰어

**배포 주소 →** https://vibe-reviewer-nine.vercel.app

---

## 프로덕트 소개

Claude, Cursor 같은 AI 도구로 빠르게 코딩하다 보면 여러 번의 시도 끝에 쓰다 만 함수, 중복 로직, 주석 처리된 잔재 코드가 조용히 쌓입니다. Vibe Review는 코드를 붙여넣는 것만으로 이를 탐지하고, 각 이슈마다 맥락과 정리 방향을 제공합니다.

### 주요 기능

- **심각도 3단계 분류** — Critical (즉시 처리) / Warning (검토 후 처리) / Info (선택적 적용)
- **상세 분석 드로어** — 이 코드가 하는 일 / 지금도 필요한가요? / AI 권장 조치
- **리뷰 기록** — 로그인 없이 브라우저 localStorage에 자동 저장 (최대 50건)
- **파일 업로드** — 드래그&드롭 또는 파일 선택으로 소스 파일 직접 로드

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | HTML + Tailwind CSS (CDN) + Vanilla JS |
| 백엔드 | Vercel Serverless Function (Node.js) |
| AI 모델 | Groq API — `llama-3.3-70b-versatile` |
| 배포 | Vercel |
| 폰트 | Pretendard · Newsreader · Space Grotesk |

---

## 로컬 개발 환경 설정

### 1. 저장소 클론

```bash
git clone https://github.com/aileenpark/vibe-reviewer.git
cd vibe-reviewer
```

### 2. 환경 변수 설정

```bash
cp server/.env.example server/.env
# server/.env 파일에 GROQ_API_KEY 입력
```

Groq API 키는 [console.groq.com](https://console.groq.com)에서 무료 발급.

### 3. 서버 실행

```bash
cd server
npm install
npm run dev      # node --watch (자동 재시작)
```

### 4. 프론트엔드 서빙

```bash
# 프로젝트 루트에서
npx serve . -p 8080
```

브라우저에서 `http://localhost:8080` 접속.

---

## 프로젝트 구조

```
vibe-reviewer/
├── index.html          # 홈 / 코드 입력 화면
├── results.html        # 분석 결과 화면
├── history.html        # 리뷰 기록 화면
├── guide.html          # 서비스 가이드 화면
├── api/
│   └── analyze.js      # Vercel 서버리스 함수
├── server/
│   ├── index.js        # 로컬 개발용 Express 서버
│   ├── package.json
│   └── .env.example
├── vercel.json
└── package.json
```

---

## API

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/api/analyze` | 코드 분석 요청 |

**Request body**
```json
{ "code": "분석할 코드 문자열" }
```

**Response**
```json
{
  "issues": [
    {
      "severity": "critical | warning | info",
      "tag": "이슈 분류 레이블",
      "title": "이슈 제목",
      "category": "카테고리",
      "what": "이 코드가 하는 일",
      "needed": ["근거 1", "근거 2", "근거 3"],
      "actionDesc": "권장 조치 설명",
      "actionCode": "수정 예시 코드",
      "applyLabel": "버튼 레이블",
      "codeSnippet": "원본 코드 발췌"
    }
  ]
}
```

---

## 보안

- API 키는 서버리스 함수 내에서만 사용되며 클라이언트에 노출되지 않습니다.
- 분석 코드는 Groq API 처리 후 저장되지 않습니다.
- 리뷰 기록은 사용자 브라우저 localStorage에만 저장됩니다.

---

## 라이선스

MIT
