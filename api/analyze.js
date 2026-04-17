import Groq from 'groq-sdk';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body ?? {};

  if (!code || typeof code !== 'string' || code.trim().length < 20) {
    return res.status(400).json({ error: '분석할 코드가 너무 짧거나 비어있습니다.' });
  }

  if (code.length > 400_000) {
    return res.status(413).json({ error: '코드가 너무 큽니다. 40만 자 이하로 줄여주세요.' });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `분석할 코드:\n\`\`\`\n${code}\n\`\`\`` },
      ],
      temperature: 0.2,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    const text = completion.choices[0].message.content;
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed.issues)) parsed.issues = [];
    return res.json(parsed);
  } catch (err) {
    console.error('[analyze error]', err.message);
    if (err.status === 401) return res.status(401).json({ error: 'API 키가 유효하지 않습니다.' });
    if (err.status === 429) return res.status(429).json({ error: '무료 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요.' });
    return res.status(500).json({ error: `분석 중 오류: ${err.message}` });
  }
}
