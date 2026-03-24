export const STAGES = [
  {
    id: 1,
    title: "Stage 1 · 시작 동의",
    subtitle: "필수 약관 4개를 모두 선택해야 합니다.",
    hint: "필수 항목 4개 체크",
    mechanic: "checkbox-basic",
    timeLimit: 24
  },
  {
    id: 2,
    title: "Stage 2 · 정밀 확인",
    subtitle: "약관을 펼친 뒤 질문의 정답을 입력하세요.",
    hint: "모든 카드를 열고 정답 입력",
    mechanic: "accordion-read",
    timeLimit: 20
  },
  {
    id: 3,
    title: "Stage 3 · 끝까지 스크롤",
    subtitle: "약관을 끝까지 읽어야 동의 버튼이 활성화됩니다.",
    hint: "스크롤 하단 도달 시 진행",
    mechanic: "scroll-lock",
    timeLimit: 18
  },
  {
    id: 4,
    title: "Stage 4 · 이중 확인 코드",
    subtitle: "흔들리는 문장 속에서 확인 코드를 찾아 입력하세요.",
    hint: "본문의 숫자 4자리를 입력",
    mechanic: "code-input",
    timeLimit: 15
  },
  {
    id: 5,
    title: "Stage 5 · 도망가는 동의",
    subtitle: "동의 버튼이 도망갑니다. 빠르게 눌러야 합니다.",
    hint: "버튼을 네 번 잡으면 통과",
    mechanic: "evasive-button",
    timeLimit: 14
  },
  {
    id: 6,
    title: "Stage 6 · 집중 확인",
    subtitle: "체크 항목이 순차적으로 사라지기 전에 모두 선택하세요.",
    hint: "항목이 사라지기 전에 전부 체크",
    mechanic: "timed-checkbox",
    timeLimit: 12
  },
  {
    id: 7,
    title: "Stage 7 · 선택의 함정",
    subtitle: "거대한 거절 버튼을 피하고 실제 동의 버튼을 찾으세요.",
    hint: "작은 동의 버튼은 화면 어딘가에 숨겨져 있음",
    mechanic: "giant-disagree",
    timeLimit: 11
  },
  {
    id: 8,
    title: "Stage 8 · 권한 정렬",
    subtitle: "요청 권한 5개를 올바른 우선순서로 정렬하세요.",
    hint: "드래그로 순서 변경",
    mechanic: "sort-order",
    timeLimit: 11
  },
  {
    id: 9,
    title: "Stage 9 · 시스템 팝업",
    subtitle: "가짜 시스템 팝업 4개를 정리한 뒤 동의를 완료하세요.",
    hint: "팝업 4개를 닫고 진행",
    mechanic: "fake-popup",
    timeLimit: 10
  },
  {
    id: 10,
    title: "Stage 10 · 기억 시퀀스",
    subtitle: "짧게 노출되는 순서를 기억해 동일하게 입력하세요.",
    hint: "숫자 시퀀스 기억",
    mechanic: "memory-sequence",
    timeLimit: 9
  },
  {
    id: 11,
    title: "Stage 11 · 위장 동의",
    subtitle: "진짜 항목만 체크해야 합니다. 미끼를 누르면 즉시 실패합니다.",
    hint: "진짜 동의 문구만 선택",
    mechanic: "decoy-consent",
    timeLimit: 9
  },
  {
    id: 12,
    title: "Final · 모든 것에 동의",
    subtitle: "최종 버튼을 눌러 결말을 확인하세요.",
    hint: "최종 선택은 한 번뿐",
    mechanic: "final-consent",
    timeLimit: 15
  }
];
