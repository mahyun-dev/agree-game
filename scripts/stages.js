export const STAGES = [
  {
    id: 1,
    title: "제1조 · 승인 스위치보드",
    subtitle: "짧게 노출되는 승인 패턴과 동일하게 4개 채널을 맞추세요.",
    hint: "스위치 패턴을 기억해 일치시키기",
    mechanic: "checkbox-basic",
    timeLimit: 12
  },
  {
    id: 2,
    title: "제2조 · 봉인 문서 수색",
    subtitle: "9개의 봉인 문서 중 진짜 승인 문서를 찾아내세요.",
    hint: "가짜 문서를 피해 진짜 문서 찾기",
    mechanic: "accordion-read",
    timeLimit: 16
  },
  {
    id: 3,
    title: "제3조 · 싱크 임팩트",
    subtitle: "움직이는 마커가 안전 구간에 들어올 때만 동기화를 눌러야 합니다.",
    hint: "초록 구간에서만 타이밍 클릭",
    mechanic: "scroll-lock",
    timeLimit: 15
  },
  {
    id: 4,
    title: "제4조 · 파편 문장 복원",
    subtitle: "왜곡된 단어 조각 중 올바른 승인 문장을 순서대로 선택하세요.",
    hint: "필수 → 로그 → 암호화 → 동의 순서 복원",
    mechanic: "code-input",
    timeLimit: 8
  },
  {
    id: 5,
    title: "제5조 · 동의 두더지",
    subtitle: "튀어나오는 동의 버튼을 6번 잡으세요. 붉은 거절 버튼은 함정입니다.",
    hint: "나타난 동의만 빠르게 포착",
    mechanic: "evasive-button",
    timeLimit: 15
  },
  {
    id: 6,
    title: "제6조 · 와이어 컷",
    subtitle: "보안 와이어를 정확한 순서대로 끊어야 시스템이 잠기지 않습니다.",
    hint: "표시된 색 순서대로 절단",
    mechanic: "timed-checkbox",
    timeLimit: 7
  },
  {
    id: 7,
    title: "제7조 · 버튼 미로",
    subtitle: "수많은 가짜 버튼 사이에서 진짜 승인 버튼 하나를 찾아야 합니다.",
    hint: "가짜를 누르면 전부 재배치됨",
    mechanic: "giant-disagree",
    timeLimit: 13
  },
  {
    id: 8,
    title: "제8조 · 트리플 다이얼",
    subtitle: "세 개의 승인 다이얼을 목표 수치에 맞춰 동시 정렬하세요.",
    hint: "목표값에 ±3 안으로 맞추기",
    mechanic: "sort-order",
    timeLimit: 15
  },
  {
    id: 9,
    title: "제9조 · 팝업 스톰",
    subtitle: "폭주하는 팝업 10개를 정리하되, 함정 팝업의 '동의 안함' 버튼은 피해야 합니다.",
    hint: "함정 버튼은 누르지 말고 팝업 정리",
    mechanic: "fake-popup",
    timeLimit: 18
  },
  {
    id: 10,
    title: "제10조 · 메모리 펄스",
    subtitle: "짧게 점멸하는 숫자 시퀀스를 기억해 그대로 복원하세요.",
    hint: "숫자 시퀀스를 기억",
    mechanic: "memory-sequence",
    timeLimit: 9
  },  
  {
    id: 11,
    title: "제11조 · 위장 약관",
    subtitle: "진짜 항목만 선택해야 합니다. 미끼를 누르는 순간 시스템이 종료됩니다.",
    hint: "진짜 동의 문구만 선택",
    mechanic: "decoy-consent",
    timeLimit: 12
  },
  {
    id: 12,
    title: "제12조 · 오버라이드 씰",
    subtitle: "봉인 4개를 순서대로 해제하고, 이후 4초 동안 이동하는 최종 승인 버튼을 3번 연속 포착해야 합니다.",
    hint: "봉인 1→2→3→4 후 최종 승인 3번 연속 클릭",
    mechanic: "final-consent",
    timeLimit: 15
  }
];
