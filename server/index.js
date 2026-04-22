import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 환경 변수 검증 ────────────────────────────────────────────────────────────
if (!process.env.GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY가 설정되지 않았습니다. server/.env 파일을 확인하세요.');
  process.exit(1);
}

const PORT = process.env.PORT || 3001;
const app = express();

// ── 청킹 유틸 ─────────────────────────────────────────────────────────────────
const CHUNK_MAX_CHARS = 10_000;  // ≈ 2,500 tokens for code
const CHUNK_DELAY_MS  = 30_000; // 30s between chunks (12,000 TPM 한도 준수)
const CHUNK_MAX_COUNT = 6;      // 최대 6청크 = 60,000자

/** 코드를 줄 단위로 maxChars 이하 청크로 분할 */
function splitIntoChunks(code, maxChars = CHUNK_MAX_CHARS) {
  if (code.length <= maxChars) return [code];
  const chunks = [];
  const lines  = code.split('\n');
  let current  = [];
  let len      = 0;
  for (const line of lines) {
    const lineLen = line.length + 1;
    if (len + lineLen > maxChars && current.length > 0) {
      chunks.push(current.join('\n'));
      current = [line];
      len     = lineLen;
    } else {
      current.push(line);
      len += lineLen;
    }
  }
  if (current.length > 0) chunks.push(current.join('\n'));
  return chunks;
}

const delay = ms => new Promise(r => setTimeout(r, ms));

// ── Groq 에러 파서 ───────────────────────────────────────────────────────────────
/**
 * Groq SDK 에러를 분석해 한도 종류별 명확한 안내 메시지를 반환합니다.
 * llama-3.3-70b-versatile 무료 티어 기준:
 *   RPM 30, RPD 1K, TPM 12K, TPD 100K
 */
function parseGroqRateLimit(err) {
  const msg = (err.message || '').toLowerCase();

  if (err.status === 401) {
    return { httpStatus: 401, error: 'API 키가 유효하지 않습니다. server/.env의 GROQ_API_KEY를 확인하세요.' };
  }

  if (err.status === 429) {
    // 일일 토큰 한도 (TPD 100K)
    if (msg.includes('tokens per day') || msg.includes('tpd')) {
      return { httpStatus: 429, error: '오늘의 일일 토큰 한도(100K TPD)에 도달했습니다. UTC 0시(KST 09:00) 이후에 다시 시도해주세요.' };
    }
    // 일일 요청 한도 (RPD 1K)
    if (msg.includes('requests per day') || msg.includes('rpd')) {
      return { httpStatus: 429, error: '오늘의 일일 요청 한도(1,000 RPD)에 도달했습니다. UTC 0시(KST 09:00) 이후에 다시 시도해주세요.' };
    }
    // 분당 토큰 한도 (TPM 12K)
    if (msg.includes('tokens per minute') || msg.includes('tpm')) {
      return { httpStatus: 429, error: '분당 토큰 한도(12K TPM)에 도달했습니다. 1분 후 다시 시도해주세요.' };
    }
    // 분당 요청 한도 (RPM 30)
    if (msg.includes('requests per minute') || msg.includes('rpm')) {
      return { httpStatus: 429, error: '분당 요청 한도(30 RPM)에 도달했습니다. 1분 후 다시 시도해주세요.' };
    }
    // 기타 429
    return { httpStatus: 429, error: 'Groq API 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요.' };
  }

  return null; // 기타 에러는 호츠가 직접 처리
}

// ── 코드 전처리 ───────────────────────────────────────────────────────────────
/**
 * API 전송 전 불필요한 부분을 제거해 토큰을 절약합니다.
 *  - 블록 주석 제거: /* ... *\/ (JSDoc 포함)
 *  - HTML 주석 제거: <!-- ... -->
 *  - 단일행 // 주석 제거: 줄 전체가 주석인 경우만 (인라인 // 는 문자열 보호를 위해 유지)
 *  - Python/Shell # 주석 제거: 줄 전체가 '# comment' 형태인 경우만
 *    (#identifier, #!shebang, CSS #hex 는 건드리지 않음)
 *  - 연속 빈 줄 3개 이상 → 1개로 축소
 */
function preprocessCode(code) {
  // 1. 블록 주석 제거 /* ... */  (/** ... */ 포함)
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');

  // 2. HTML/템플릿 주석 제거 <!-- ... -->
  code = code.replace(/<!--[\s\S]*?-->/g, '');

  // 3. 전체 행 // 주석 제거 (들여쓰기 후 // 로 시작하는 줄)
  //    인라인 후행 주석(단, url 등 포함 가능)은 건드리지 않아 문자열 안전 보장
  code = code.replace(/^[ \t]*\/\/[^\n]*/gm, '');

  // 4. Python/Shell 전체 행 # 주석 제거
  //    "# 텍스트" 또는 "## 텍스트" 형태만 제거
  //    → #identifier (JS private fields), #!shebang, #333 (CSS hex) 는 보호
  code = code.replace(/^[ \t]*##?(?=[ \t])[^\n]*/gm, '');  // # comment, ## comment
  code = code.replace(/^[ \t]*#$/gm, '');                   // 홀로 있는 # 줄

  // 5. 연속 빈 줄 축소 (3개 이상 → 1개)
  code = code.replace(/\n{3,}/g, '\n\n');

  return code.trim();
}

// ── 미들웨어 ──────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
  ],
  methods: ['POST'],
}));
app.use(express.json({ limit: '512kb' }));

// ── 정적 파일 서빙 (프로젝트 루트의 HTML 파일들) ────────────────────────────────
app.use(express.static(join(__dirname, '..')));

// ── Groq 클라이언트 ───────────────────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── 분석 프롬프트 ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
당신은 바이브 코딩(AI와 함께 하는 코딩) 세션의 코드를 분석하는 전문 리뷰어입니다.
아래 코드를 분석하고 반드시 순수 JSON만 반환하세요. 마크다운 코드블록이나 설명 텍스트를 절대 포함하지 마세요.

반환 형식:
{
  "issues": [
    {
      "severity": "critical" | "warning" | "info",
      "tag": "이슈 분류 레이블 (예: 잔재 코드 / 미사용 함수)",
      "title": "이슈 제목 (한국어, 30자 이내)",
      "category": "드로어 헤더용 카테고리 (한국어, 예: 치명적 보안 취약점)",
      "what": "이 코드가 하는 일을 평문으로 설명 (2~3문장, 한국어)",
      "needed": [
        "지금도 필요한가요? 근거 1 (한국어)",
        "근거 2 (한국어)",
        "근거 3 (한국어)"
      ],
      "actionDesc": "권장 조치 설명 (한국어, 1~2문장)",
      "actionCode": "수정 예시 코드 스니펫 (실제 코드, 5줄 이내)",
      "applyLabel": "버튼 레이블 (예: 해당 블록 삭제)",
      "codeSnippet": "문제가 되는 원본 코드 발췌 (최대 6줄)"
    }
  ]
}

심각도 기준:
- critical : 하드코딩된 비밀값, 보안 취약점, 어디서도 호출되지 않는 함수/클래스
- warning  : 중복 로직, 대량 주석 잔재, 이전 시도의 잔재 코드
- info     : 개선 가능한 패턴, 성능 최적화 가능 지점, 미사용 import

이슈가 없으면 { "issues": [] } 를 반환하세요.
이슈는 최대 10개까지만 반환하세요. 중요도 순으로 정렬하세요.
`.trim();

// ── 라우트 ────────────────────────────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  let { code } = req.body ?? {};

  if (!code || typeof code !== 'string' || code.trim().length < 20) {
    return res.status(400).json({ error: '분석할 코드가 너무 짧거나 비어있습니다.' });
  }

  // ── 전처리: 주석 등 불필요한 부분 제거 ────────────────────────────────────────
  const originalLen = code.length;
  code = preprocessCode(code);
  const savedLen = originalLen - code.length;
  console.log(`[preprocess] ${originalLen.toLocaleString()}자 → ${code.length.toLocaleString()}자 (${savedLen.toLocaleString()}자 / ${Math.round(savedLen / originalLen * 100)}% 절약)`);

  if (code.trim().length < 20) {
    return res.status(400).json({ error: '주석 제거 후 분석할 코드가 너무 짧습니다.' });
  }

  // 무료 티어: 전처리 후 최대 6청크(60,000자)까지 허용
  if (code.length > CHUNK_MAX_CHARS * CHUNK_MAX_COUNT) {
    return res.status(413).json({ error: `주석 제거 후에도 코드가 너무 큽니다. 6만 자 이하로 줄여주세요. (현재: ${code.length.toLocaleString()}자)` });
  }

  try {
    const chunks      = splitIntoChunks(code);
    const totalChunks = chunks.length;
    const allIssues   = [];

    for (let i = 0; i < totalChunks; i++) {
      if (i > 0) {
        console.log(`[analyze] ⏱ ${CHUNK_DELAY_MS / 1000}초 대기 중 (TPM 한도 준수)...`);
        await delay(CHUNK_DELAY_MS);
      }
      console.log(`[analyze] 청크 ${i + 1}/${totalChunks} 분석 중... (${chunks[i].length}자)`);

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: totalChunks > 1
              ? `분석할 코드 (파트 ${i + 1}/${totalChunks}):\n\`\`\`\n${chunks[i]}\n\`\`\``
              : `분석할 코드:\n\`\`\`\n${code}\n\`\`\``,
          },
        ],
        temperature: 0.2,
        max_tokens: 2048, // 응답 토큰 절약 (4096 → 2048)
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(completion.choices[0].message.content);
      if (Array.isArray(parsed.issues)) allIssues.push(...parsed.issues);
    }

    // 심각도 순 정렬 후 최대 10개 반환
    const ORDER = { critical: 0, warning: 1, info: 2 };
    allIssues.sort((a, b) => (ORDER[a.severity] ?? 2) - (ORDER[b.severity] ?? 2));

    return res.json({ issues: allIssues.slice(0, 10), totalChunks });

  } catch (err) {
    console.error('[analyze error]', err.status, err.message);

    const rateLimitErr = parseGroqRateLimit(err);
    if (rateLimitErr) {
      return res.status(rateLimitErr.httpStatus).json({ error: rateLimitErr.error });
    }

    return res.status(500).json({ error: `분석 중 오류: ${err.message}` });
  }
});

// 헬스체크
app.get('/health', (_, res) => res.json({ status: 'ok', model: 'llama-3.3-70b-versatile' }));

// ── 서버 시작 ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ Vibe Review 서버 실행 중`);
  console.log(`   http://localhost:${PORT}/health\n`);
});
