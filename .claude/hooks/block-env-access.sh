#!/usr/bin/env bash
# ============================================================
# Vibe Review — .env 파일 접근 자동 차단 Hook
# 트리거: PreToolUse (모든 도구 호출 전)
# 역할:   tool_input에 .env 파일 경로가 포함되면 즉시 차단
# ============================================================

# Claude Code는 tool_input을 JSON 형태로 stdin에 전달합니다.
input=$(cat)

# .env 파일을 직접 대상으로 하는 패턴 감지
# - "server/.env", "path/to/.env" 형태
# - .env.example, .env.local 등 파생 파일은 허용 (.env 뒤에 알파벳이 없는 경우만 차단)
if echo "$input" | grep -qE '(^|["/])\\.env(["\s,}]|$)' 2>/dev/null; then
  echo "🚫 [Vibe Review 보안 정책] .env 파일 직접 접근이 차단되었습니다." >&2
  echo "   API 키 등 민감 정보는 process.env.변수명 으로만 참조하세요." >&2
  echo "   템플릿 확인이 필요하면 .env.example 을 사용하세요." >&2
  exit 2  # exit 2 = Claude Code 하드 차단 (작업 중단)
fi

exit 0
