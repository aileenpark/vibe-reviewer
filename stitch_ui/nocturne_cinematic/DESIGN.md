```markdown
# 디자인 시스템 가이드: Vibe Review

이 디자인 시스템은 단순한 개발자 도구를 넘어, 코드 리뷰와 피드백의 과정을 하나의 예술적 경험으로 승화시키는 것을 목표로 합니다. 우리는 이를 **"심야의 캔버스(The Midnight Canvas)"**라고 명명합니다. 이 시스템은 정적인 그리드 시스템을 탈피하여, 깊이감 있는 어둠 속에서 빛나는 데이터와 우아한 타이포그래피가 조화를 이루는 시네마틱한 사용자 경험을 지향합니다.

---

## 1. 디자인 철학 및 크리에이티브 노스 스타 (Creative North Star)
**"심야의 캔버스(The Midnight Canvas)"**
우리의 디자인은 표준적인 관리자 페이지의 문법을 거부합니다. 의도적인 비대칭성, 중첩된 레이어, 그리고 공기 중에 퍼지는 듯한 부드러운 그라데이션을 통해 개발자가 도구와 상호작용하는 것이 아니라, 작품을 감상하는 듯한 몰입감을 제공합니다.

- **의도적 비대칭:** 완벽한 좌우 대칭보다는 여백(Negative Space)을 대담하게 사용하여 시선의 흐름을 유도합니다.
- **톤의 깊이:** 평면적인 UI가 아닌, 안개가 낀 듯한 층층이 쌓인 레이어 구조를 통해 공간감을 형성합니다.

---

## 2. 컬러 시스템 (Colors)

배경은 우주의 심연처럼 깊으며, 그 위에서 티일(Teal), 인디고(Indigo), 바이올렛(Violet)의 빛이 부드럽게 번져나갑니다.

### 핵심 원칙
- **The "No-Line" Rule:** 구역을 나눌 때 1px의 딱딱한 실선을 사용하는 것을 금지합니다. 오직 배경색의 미묘한 변화(`surface-container-low`와 `surface`의 대비)만으로 경계를 구분합니다.
- **Surface Hierarchy:** UI를 여러 겹의 반투명한 유리판이 겹쳐진 것으로 간주합니다. 안쪽 컨테이너일수록 더 높은 티어의 Surface 컬러를 사용하여 자연스럽게 시각적 우선순위를 부여합니다.

### 주요 팔레트
- **Base Background:** `#0e0e13` (Deep Dark)
- **Primary Accent:** `#58e7fb` (Vibrant Teal)
- **Secondary Accent:** `#b78efe` (Soft Violet)
- **Tertiary Accent:** `#a8b4ff` (Indigo Glow)
- **Severity Colors:**
  - 에러(High): `#ff716c`
  - 경고(Medium): `Amber` (on-secondary-container 기반 변형)
  - 통과(Low): `Emerald` (primary-dim 기반 변형)

---

## 3. 타이포그래피 (Typography)

우아한 에디토리얼 감각과 코드의 정밀함이 공존해야 합니다.

| Role | Font Family | Size | Character |
| :--- | :--- | :--- | :--- |
| **Display** | Newsreader | 2.25rem ~ 3.5rem | 이탤릭체와 라이트 웨이트를 혼용하여 시적 분위기 연출 |
| **Headline** | Newsreader | 1.5rem ~ 2rem | 섹션의 시작을 알리는 우아한 지표 |
| **Title** | Manrope | 1rem ~ 1.375rem | 현대적이고 기하학적인 산세리프 |
| **Body** | Manrope | 0.75rem ~ 1rem | 높은 가독성을 가진 본문 텍스트 |
| **Label** | Space Grotesk | 0.6875rem ~ 0.75rem | **전체 대문자(Uppercase)** 적용, 메타데이터용 |
| **Code** | Monospace | - | 코드 리뷰의 핵심, 정밀한 등간격 폰트 |

---

## 4. 깊이감과 입체감 (Elevation & Depth)

그림자가 아닌 '빛의 중첩'으로 깊이를 표현합니다.

- **Layering Principle:** `surface-container-lowest` 카드를 `surface-container-low` 섹션 위에 배치하여, 별도의 그림자 없이도 부드러운 부유감을 만듭니다.
- **Glassmorphism:** 플로팅 요소(모달, 팝오버)에는 `surface` 컬러에 60~80% 투명도를 적용하고 `backdrop-blur` 효과를 주어 배경의 컬러 블리드가 비쳐 보이게 합니다.
- **Ghost Border:** 접근성을 위해 경계가 꼭 필요한 경우, `outline-variant` 토큰의 불투명도를 10~20%로 낮추어 "유령처럼 희미한" 선을 사용합니다. 100% 불투명한 고대비 선은 지양합니다.

---

## 5. 컴포넌트 전략 (Components)

### 버튼 (Buttons)
- **Pill Shape:** 모든 버튼은 완전한 라운드(`rounded-full`) 형태를 유지합니다.
- **Primary:** `primary` 배경에 `on-primary` 텍스트. 화살표 아이콘(`→`)을 우측에 배치하여 진행 방향성을 제시합니다.
- **Secondary (Outlined):** `Ghost Border`를 적용한 외곽선 버튼. 호버 시 미묘한 글로우(Glow) 효과가 나타납니다.

### 카드 & 리스트 (Cards & Lists)
- **No Divider Rule:** 리스트 아이템 사이에 구분선을 넣지 마십시오. 대신 `spacing` 스케일을 활용한 수직 여백이나, 미묘한 배경색 변화로 구분합니다.
- **Glow Effect:** 강조가 필요한 카드는 테두리에 아쿠아 혹은 바이올렛 계열의 매우 부드러운 외부 광채(Outer Glow)를 적용합니다.

### 심각도 배지 (Severity Badges)
- **형태:** 작고 정교한 캡슐 형태.
- **레이블:** 한국어로 표기합니다.
  - 고위험: `치명적` (`error` 컬러)
  - 중위험: `주의` (`amber` 계열)
  - 저위험: `정상` (`emerald` 계열)

### 입력 필드 (Input Fields)
- **Style:** 밑줄만 있는 스타일 혹은 매우 어두운 `surface-container-highest` 배경의 필드. 포커스 시 테두리가 아닌 하단에 `primary` 컬러의 글로우 라인이 나타납니다.

---

## 6. Do's and Don'ts

### Do
- **한국어의 미학:** "코드 리뷰를 시작하세요" 대신 "새로운 코드 리뷰의 시작"과 같은 명사형 어미나 정중한 문체를 사용하여 에디토리얼 톤을 유지하십시오.
- **여백의 미:** 정보 밀도를 너무 높이지 마십시오. 중요한 데이터 주위에는 충분한 `surface` 영역을 확보하십시오.
- **그라데이션 활용:** 배경의 특정 구석에 `tertiary-container` 컬러를 아주 큰 반경(500px 이상)으로 흐리게 배치하여 대기감(Atmospheric)을 형성하십시오.

### Don't
- **순수 블랙 사용 금지:** 배경에 `#000000`을 사용하지 마십시오. 반드시 시스템에서 정의한 `#0a0a0f` 혹은 `#0e0e13`을 사용해야 깊이감이 유지됩니다.
- **표준 그림자 금지:** 불투명도가 높은 검은색 드롭 섀도우를 지양하십시오. 대신 배경색보다 약간 밝은 톤의 그림자나 블러를 사용하십시오.
- **딱딱한 직각형태 지양:** 시스템의 유연함을 위해 `rounded-md`(1.5rem) 이상의 둥근 모서리를 기본값으로 사용하십시오.

---

**디렉터의 메모:**
이 시스템의 핵심은 "어둠 속의 빛"입니다. 모든 UI 요소는 스스로 빛을 내는 것이 아니라, 심연 위에 떠 있는 섬세한 오브제처럼 느껴져야 합니다. 가이드라인을 엄격히 준수하되, 사용자의 시선이 머무는 곳에 우아한 타이포그래피의 변주를 주는 것을 두려워하지 마십시오.