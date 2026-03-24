import { STAGES } from "./stages.js";

const stageTitle = document.getElementById("stageTitle");
const stageSubtitle = document.getElementById("stageSubtitle");
const stageArea = document.getElementById("stageArea");
const hintText = document.getElementById("hintText");
const primaryButton = document.getElementById("primaryButton");
const progressBar = document.getElementById("progressBar");
const difficultyLabel = document.getElementById("difficultyLabel");
const progressWrap = document.querySelector(".progress-wrap");
const stageChip = document.getElementById("stageChip");
const timerChip = document.getElementById("timerChip");

const state = {
  stageIndex: -1,
  cleanup: [],
  startedAt: 0,
  closedPopups: 0,
  resetting: false,
  timerId: null,
  stageEndsAt: 0
};

const scoreKey = "consent-game-best";

const stageRenderers = {
  "checkbox-basic": renderStage1,
  "accordion-read": renderStage2,
  "scroll-lock": renderStage3,
  "code-input": renderStage4,
  "evasive-button": renderStage5,
  "timed-checkbox": renderStage6,
  "giant-disagree": renderStage7,
  "sort-order": renderStage8,
  "fake-popup": renderStage9,
  "memory-sequence": renderStage10,
  "decoy-consent": renderStage11,
  "final-consent": renderStage12
};

primaryButton.addEventListener("click", () => {
  if (state.stageIndex === -1) {
    startGame();
  }
});

function startGame() {
  state.resetting = false;
  state.startedAt = Date.now();
  goToStage(0);
}

function goToStage(index) {
  clearStageEffects();
  state.stageIndex = index;
  const stage = STAGES[index];
  stageTitle.textContent = stage.title;
  stageSubtitle.textContent = stage.subtitle;
  setHint(stage.hint);
  difficultyLabel.textContent = `난이도 ${stage.id}/12`;
  stageChip.textContent = `Stage ${stage.id}`;
  progressWrap.setAttribute("aria-valuenow", String(stage.id));
  progressWrap.setAttribute("aria-valuemax", String(STAGES.length));
  progressBar.style.width = `${(stage.id / STAGES.length) * 100}%`;
  stageArea.innerHTML = "";
  setPrimaryButton("동의하고 진행", null, true, "btn--primary");
  startStageTimer(stage.timeLimit);
  const renderer = stageRenderers[stage.mechanic];
  renderer();
}

function nextStage() {
  const next = state.stageIndex + 1;
  if (next < STAGES.length) {
    goToStage(next);
  }
}

function clearStageEffects() {
  stopStageTimer();
  state.cleanup.forEach((fn) => {
    try {
      fn();
    } catch {
      return;
    }
  });
  state.cleanup = [];
  stageArea.classList.remove("glitch");
}

function addCleanup(fn) {
  state.cleanup.push(fn);
}

function setHint(text) {
  hintText.textContent = text;
}

function setPrimaryButton(label, onClick, disabled, variant) {
  primaryButton.textContent = label;
  primaryButton.className = `btn ${variant}`;
  primaryButton.disabled = disabled;
  primaryButton.onclick = onClick;
}

function completeStage(nextHint) {
  stopStageTimer();
  tone(680, 0.05, "triangle", 0.04);
  if (nextHint) {
    setHint(nextHint);
  }
  setTimeout(nextStage, 240);
}

function startStageTimer(limitSec) {
  stopStageTimer();
  if (!limitSec || limitSec <= 0) {
    timerChip.textContent = "시간 제한 없음";
    timerChip.classList.remove("danger");
    return;
  }

  state.stageEndsAt = Date.now() + limitSec * 1000;

  const tick = () => {
    const remainMs = state.stageEndsAt - Date.now();
    const remain = Math.max(0, remainMs / 1000);
    timerChip.textContent = `남은 시간 ${remain.toFixed(1)}초`;
    if (remain <= 5) {
      timerChip.classList.add("danger");
    } else {
      timerChip.classList.remove("danger");
    }

    if (remain <= 0) {
      failGame("시간 초과");
    }
  };

  tick();
  state.timerId = setInterval(tick, 100);
}

function stopStageTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function failGame(reason) {
  if (state.resetting) {
    return;
  }

  state.resetting = true;
  clearStageEffects();
  stageArea.innerHTML = `
    <div class="card result">
      <strong>실패</strong>
      <span>${reason}</span>
      <p class="small">잠시 후 1단계부터 다시 시작합니다.</p>
    </div>
  `;
  setHint("실패 판정: 처음부터 재시작");
  setPrimaryButton("초기화 중...", null, true, "btn--danger");
  tone(120, 0.2, "sawtooth", 0.04);
  vibrate([160, 90, 160]);

  setTimeout(() => {
    startGame();
  }, 1000);
}

function vibrate(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

function tone(freq, duration, wave = "sine", volume = 0.02) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return;
  }
  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = wave;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
  setTimeout(() => ctx.close(), duration * 1000 + 80);
}

function renderStage1() {
  stageArea.innerHTML = `
    <div class="card">
      <label class="checkbox-row"><input type="checkbox" data-required="1">위치 정보 수집 및 이용에 동의합니다.</label>
      <label class="checkbox-row"><input type="checkbox" data-required="1">이상 행동 탐지를 위한 로그 저장에 동의합니다.</label>
      <label class="checkbox-row"><input type="checkbox" data-required="1">서비스 품질 향상을 위한 분석 데이터 이용에 동의합니다.</label>
      <label class="checkbox-row"><input type="checkbox" data-required="1">보안 검증을 위한 익명 디바이스 지문 처리에 동의합니다.</label>
      <p class="small">필수 항목을 모두 체크해야 진행할 수 있습니다.</p>
    </div>
  `;

  const required = [...stageArea.querySelectorAll("input[data-required='1']")];
  const validate = () => {
    const allChecked = required.every((item) => item.checked);
    setPrimaryButton("동의하고 진행", () => completeStage("약관을 읽고 정답을 맞혀야 합니다."), !allChecked, "btn--primary");
  };

  required.forEach((box) => box.addEventListener("change", validate));
  validate();
}

function renderStage2() {
  stageArea.innerHTML = `
    <div class="card" data-card="0">
      <button class="btn btn--ghost" type="button">약관 1 펼치기</button>
      <p class="small" hidden>
        수집 목적: 서비스 제공 및 품질 개선을 위한 최소 데이터 처리.<br>
        이용자의 접속 안정성, 오류 재현, 악성 행위 탐지를 위해 세션 로그가 생성될 수 있습니다.<br>
        생성되는 로그에는 기능 호출 순서, 비정상 종료 여부, 화면 전환 정보가 포함될 수 있으며,
        계정 식별 정보는 해시 처리된 내부 키로 대체됩니다.
      </p>
    </div>
    <div class="card" data-card="1">
      <button class="btn btn--ghost" type="button">약관 2 펼치기</button>
      <p class="small" hidden>
        보관 기간: 12개월.<br>
        장애 대응 및 보안 점검을 위해 수집된 운영 로그는 최대 12개월 동안 암호화 저장됩니다.<br>
        보관 기간 종료 시 복구 불가능한 방식으로 파기하며,
        법령상 추가 보관 의무가 없는 항목은 자동 삭제 정책에 따라 즉시 제거됩니다.
      </p>
    </div>
    <div class="card" data-card="2">
      <button class="btn btn--ghost" type="button">약관 3 펼치기</button>
      <p class="small" hidden>
        제3자 제공: 없음.<br>
        원칙적으로 외부 사업자에게 개인정보를 판매하거나 제공하지 않습니다.<br>
        다만 인프라 보안 점검, 침해 대응, 법적 의무 이행을 위해
        비식별 통계 형태의 정보가 내부 위탁 환경에서 제한적으로 처리될 수 있습니다.
      </p>
    </div>
    <div class="card">
      <p class="small">질문: 보관 기간은 몇 개월인가요?</p>
      <input id="quizInput" class="input" inputmode="numeric" placeholder="숫자 입력">
    </div>
  `;

  const viewed = new Set();
  const cards = [...stageArea.querySelectorAll("[data-card]")];
  const quizInput = document.getElementById("quizInput");

  const validate = () => {
    const ready = viewed.size === 3 && quizInput.value.trim() === "12";
    setPrimaryButton("모두 확인하고 동의", () => completeStage("이제 스크롤 구간입니다."), !ready, "btn--primary");
  };

  cards.forEach((card) => {
    const button = card.querySelector("button");
    const text = card.querySelector("p");
    button.addEventListener("click", () => {
      text.hidden = false;
      viewed.add(card.dataset.card);
      button.textContent = "확인 완료";
      button.disabled = true;
      tone(360, 0.03, "square", 0.015);
      validate();
    });
  });

  quizInput.addEventListener("input", validate);
  quizInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && quizInput.value.trim() !== "12") {
      failGame("정답 입력 실패");
    }
  });
  validate();
}

function renderStage3() {
  stageArea.innerHTML = `
    <div class="card">
      <div class="scroll-box" id="scrollBox">
        <p>제1조(목적) 본 약관은 서비스 이용과 관련하여 운영자와 이용자 간 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        <p>제2조(정의) 본 약관에서 사용하는 용어의 정의는 서비스 화면 내 고지사항 및 관련 정책을 따릅니다.</p>
        <p id="textMorph">제3조(이용자 의무) 이용자는 비정상 자동화 행위, 시스템 우회, 타인 계정 도용을 시도해서는 안 됩니다.</p>
        <p>제4조(서비스 제공) 운영자는 안정적인 제공을 위해 서버 점검, 장애 대응, 보안 업데이트를 수시로 수행할 수 있습니다.</p>
        <p>제5조(로그 처리) 서비스 품질 향상 및 침해 사고 대응 목적으로 접속 이력, 오류 코드, 기능 호출 기록이 생성될 수 있습니다.</p>
        <p>제6조(보관 및 파기) 처리된 로그는 목적 달성 시 또는 보관 기간 종료 시 지체 없이 삭제하며, 복구 불가 방식으로 파기합니다.</p>
        <p>제7조(권한 요청) 일부 기능은 알림, 저장소, 카메라 등 단말 권한이 필요할 수 있으며, 이용자는 이를 거부할 수 있습니다.</p>
        <p>제8조(거부 시 제한) 단, 필수 권한 또는 필수 정보 제공이 거부되는 경우 일부 서비스 이용이 제한될 수 있습니다.</p>
        <p>제9조(약관 변경) 운영자는 관련 법령을 위반하지 않는 범위에서 본 약관을 변경할 수 있고, 변경사항은 사전 고지됩니다.</p>
        <p>제10조(면책) 천재지변, 국가 비상사태, 기간통신사업자 장애 등 불가항력 사유로 인한 손해에 대하여 책임이 제한될 수 있습니다.</p>
        <p>제11조(분쟁 해결) 서비스 이용 중 발생한 분쟁은 관련 법령 및 상호 협의 원칙에 따라 해결을 시도합니다.</p>
        <p>부칙(시행일) 본 약관은 고지된 시행일부터 적용됩니다. 이용자는 최신 약관을 정기적으로 확인해야 합니다.</p>
        <p>추가 안내 1) 본 구간은 스크롤 완료 검증을 위해 전체 본문을 끝까지 읽어야 다음 단계로 진행할 수 있습니다.</p>
        <p>추가 안내 2) 본문 내 일부 문장은 보안 점검 단계에서 동적으로 변경될 수 있으며, 이는 연출의 일부입니다.</p>
        <p>추가 안내 3) 이용자가 동의 버튼을 누르는 시점의 정책 버전이 적용되며, 이후 변경사항은 별도 고지됩니다.</p>
        <p>추가 안내 4) 문의가 필요한 경우 고객센터 채널을 통해 접수할 수 있으며, 처리 순서에 따라 응답이 이루어집니다.</p>
        <p>제12조(계정 보안) 이용자는 비밀번호 및 인증 수단을 스스로 관리해야 하며, 제3자에게 공유하거나 노출해서는 안 됩니다.</p>
        <p>제13조(접근 통제) 시스템 보안을 위해 비정상 로그인 시도, 반복 요청, 자동화 패턴은 일시 차단될 수 있습니다.</p>
        <p>제14조(서비스 중단) 정기 점검, 긴급 복구, 네트워크 장애가 발생한 경우 서비스는 예고 없이 제한 또는 중단될 수 있습니다.</p>
        <p>제15조(데이터 무결성) 운영자는 데이터 무결성 유지를 위해 백업, 복제, 검증 절차를 수행하며 일부 지연이 발생할 수 있습니다.</p>
        <p>제16조(정책 우선순위) 본 약관과 개별 정책 간 충돌이 발생할 경우, 개별 화면에 명시된 정책이 우선 적용될 수 있습니다.</p>
        <p>제17조(알림 수신) 중요 고지, 보안 공지, 서비스 변경 사항은 앱 내 알림 또는 등록된 채널로 전달될 수 있습니다.</p>
        <p>제18조(기록 열람) 이용자는 관련 법령에 따라 본인 데이터의 열람, 정정, 삭제를 요청할 수 있습니다.</p>
        <p>제19조(요청 처리 기간) 데이터 관련 요청은 접수 후 영업일 기준 순차 처리되며, 처리 상황은 단계별로 안내됩니다.</p>
        <p>제20조(금지 행위) 부정 접속, 악성 스크립트 삽입, 비인가 API 호출, 서비스 과부하 유발 행위는 금지됩니다.</p>
        <p>제21조(제재 조치) 금지 행위 확인 시 접근 제한, 기능 정지, 계정 잠금 등 단계적 제재가 적용될 수 있습니다.</p>
        <p>제22조(오탐 처리) 오탐으로 제한된 이용자는 소명 절차를 통해 해제 요청을 할 수 있으며, 검토 후 복구됩니다.</p>
        <p>제23조(통계 처리) 서비스 개선을 위한 통계는 개인 식별이 불가능한 비식별·집계 형태로만 활용됩니다.</p>
        <p>제24조(기능 실험) 일부 이용자에게 실험 기능이 제한적으로 노출될 수 있으며, 결과에 따라 기본 정책이 조정될 수 있습니다.</p>
        <p>제25조(시스템 공지) 서비스 안정성 확보를 위해 화면 경고, 확인 절차, 재인증 요청이 임시로 표시될 수 있습니다.</p>
        <p>제26조(권리 귀속) 서비스 내 UI/콘텐츠/로직 등 지식재산권은 운영자 또는 정당한 권리자에게 귀속됩니다.</p>
        <p>제27조(이용 제한 지역) 법령 또는 규제 요구에 따라 특정 지역·국가에서는 일부 기능 사용이 제한될 수 있습니다.</p>
        <p>제28조(운영 기록) 안정성 분석을 위해 운영 이벤트 타임라인이 생성되며, 사고 분석 후 일정 기간 보관됩니다.</p>
        <p>제29조(비상 대응) 보안 사고가 감지되면 일부 기능이 즉시 잠금 상태로 전환되고, 이용자에게 공지될 수 있습니다.</p>
        <p>제30조(권한 재검증) 장기 미사용 또는 위험 신호 감지 시, 기존 권한은 재검증 절차를 통해 갱신될 수 있습니다.</p>
        <p>제31조(버전 관리) 약관 버전, 개정 이력, 적용 일자는 관리 페이지에서 확인할 수 있습니다.</p>
        <p>제32조(보존 예외) 관계 법령이 정한 보존 의무 항목은 해당 기간 동안 별도 보관 후 안전하게 파기됩니다.</p>
        <p>제33조(서비스 품질) 네트워크 환경, 단말 성능, 외부 인프라 상태에 따라 응답 지연 또는 체감 성능 차이가 발생할 수 있습니다.</p>
        <p>제34조(기술 지원) 운영자는 오류 재현을 위해 이용 환경 정보 제출을 요청할 수 있으며, 제출 여부는 이용자 선택입니다.</p>
        <p>제35조(연속 동의 검증) 특정 단계에서는 스크롤 완료, 확인 입력, 재인증 등 복합 조건이 동시에 요구될 수 있습니다.</p>
        <p>제36조(주의) 하단까지 도달하기 전에는 동의 절차가 완료되지 않으며, 중간 이탈 시 진행 기록이 무효화될 수 있습니다.</p>
        <p>제37조(끝) 여기까지 스크롤했다면 최종 문단 확인이 완료됩니다. 이제 동의 버튼이 활성화됩니다.</p>
      </div>
    </div>
  `;

  const scrollBox = document.getElementById("scrollBox");
  const textMorph = document.getElementById("textMorph");
  let morphed = false;

  const handleScroll = () => {
    const ratio = (scrollBox.scrollTop + scrollBox.clientHeight) / scrollBox.scrollHeight;
    if (!morphed && ratio > 0.55) {
      morphed = true;
      textMorph.textContent = '제3조(경고) "뒤를 보지 마세요."';
      textMorph.classList.add("glitch");
      tone(200, 0.16, "sawtooth", 0.03);
      vibrate([80, 40, 80]);
      setHint("텍스트가 변했습니다. 끝까지 내려야 버튼이 열립니다.");
    }
    const atBottom = ratio >= 0.99;
    setPrimaryButton("읽고 동의", () => completeStage("이중 코드 입력 구간입니다."), !atBottom, "btn--primary");
  };

  scrollBox.addEventListener("scroll", handleScroll);
  handleScroll();
}

function renderStage4() {
  const code = String(1000 + Math.floor(Math.random() * 9000));
  const reverseCode = code.split("").reverse().join("");
  stageArea.innerHTML = `
    <div class="card">
      <p class="glitch">확인 코드 <strong>${code}</strong>를 기억하세요.</p>
      <p class="small">1차는 원본, 2차는 역순 코드입니다.</p>
      <input class="input" id="codeInput" inputmode="numeric" maxlength="4" placeholder="1차 코드 입력">
      <input class="input" id="codeInput2" inputmode="numeric" maxlength="4" placeholder="2차(역순) 코드 입력">
      <div class="action-row" style="margin-top:10px;">
        <button class="btn btn--ghost" id="verifyBtn" type="button">코드 확인</button>
      </div>
    </div>
  `;

  const codeInput = document.getElementById("codeInput");
  const codeInput2 = document.getElementById("codeInput2");
  const verifyBtn = document.getElementById("verifyBtn");
  verifyBtn.addEventListener("click", () => {
    if (codeInput.value.trim() === code && codeInput2.value.trim() === reverseCode) {
      completeStage("버튼이 더 빠르게 도망갑니다.");
      return;
    }
    failGame("코드가 일치하지 않습니다.");
  });
  setPrimaryButton("코드 확인 필요", null, true, "btn--ghost");
}

function renderStage5() {
  stageArea.innerHTML = `
    <div class="card">
      <p>동의 버튼을 네 번 클릭하면 통과합니다.</p>
      <div class="evasive-zone" id="zone">
        <button id="evasiveBtn" class="btn btn--primary evasive" type="button">동의</button>
      </div>
      <p class="small">포획 횟수: <span id="catchCount">0</span>/4</p>
    </div>
  `;

  const zone = document.getElementById("zone");
  const btn = document.getElementById("evasiveBtn");
  const catchCount = document.getElementById("catchCount");
  let count = 0;

  const moveButton = () => {
    const maxX = Math.max(0, zone.clientWidth - btn.offsetWidth - 2);
    const maxY = Math.max(0, zone.clientHeight - btn.offsetHeight - 2);
    btn.style.left = `${Math.floor(Math.random() * (maxX + 1))}px`;
    btn.style.top = `${Math.floor(Math.random() * (maxY + 1))}px`;
  };

  const dodge = () => {
    if (count < 4) {
      moveButton();
      tone(300 + Math.random() * 120, 0.02, "triangle", 0.02);
    }
  };

  btn.addEventListener("pointerenter", dodge);
  btn.addEventListener("touchstart", dodge, { passive: true });
  btn.addEventListener("click", () => {
    count += 1;
    catchCount.textContent = String(count);
    if (count >= 4) {
      completeStage("집중 확인 단계로 이동합니다.");
      return;
    }
    moveButton();
  });

  setPrimaryButton("버튼을 직접 눌러야 함", null, true, "btn--ghost");
}

function renderStage6() {
  stageArea.innerHTML = `
    <div class="card">
      <p>항목이 순차적으로 사라지기 전에 6개를 모두 체크하세요.</p>
      <div class="grid-2" id="checkGrid"></div>
    </div>
  `;

  const items = ["알림 권한", "저장소 접근", "접근성 보조", "클립보드 읽기", "백그라운드 활동", "동기화 최적화"];
  const checkGrid = document.getElementById("checkGrid");

  items.forEach((item, idx) => {
    const row = document.createElement("label");
    row.className = "checkbox-row";
    row.innerHTML = `<input type="checkbox" data-i="${idx}">${item}`;
    checkGrid.appendChild(row);
  });

  const boxes = [...checkGrid.querySelectorAll("input")];

  boxes.forEach((box, idx) => {
    const hideTimer = setTimeout(() => {
      if (!box.checked) {
        box.disabled = true;
        box.closest("label").style.opacity = "0.35";
      }
    }, 1500 + idx * 720);
    addCleanup(() => clearTimeout(hideTimer));
  });

  const validate = () => {
    const allChecked = boxes.every((box) => box.checked);
    setPrimaryButton("모두 선택 후 진행", () => completeStage("함정 버튼을 조심하세요."), !allChecked, "btn--primary");
  };

  boxes.forEach((box) => box.addEventListener("change", validate));
  validate();
}

function renderStage7() {
  stageArea.innerHTML = `
    <div class="card" style="position:relative; min-height:250px;">
      <button class="btn btn--danger giant" id="disagreeBtn" type="button">동의하지 않음</button>
      <button class="btn btn--primary hidden-agree" id="realAgree" type="button">진짜 동의</button>
      <div class="flash" id="flashLayer"></div>
      <p class="small">거대한 버튼은 미끼입니다.</p>
    </div>
  `;

  const disagreeBtn = document.getElementById("disagreeBtn");
  const realAgree = document.getElementById("realAgree");
  const flash = document.getElementById("flashLayer");

  const blink = () => {
    flash.classList.add("on");
    tone(72, 0.15, "sawtooth", 0.04);
    vibrate([110, 40, 110]);
    setTimeout(() => flash.classList.remove("on"), 130);
  };

  disagreeBtn.addEventListener("click", () => {
    blink();
    failGame("함정 버튼을 눌렀습니다.");
  });

  realAgree.addEventListener("click", () => {
    completeStage("권한 순서를 맞추세요.");
  });

  setPrimaryButton("화면 내 버튼으로 진행", null, true, "btn--ghost");
}

function renderStage8() {
  const target = ["필수 기능", "서비스 운영", "보안/사고 대응", "분석/개선", "마케팅"];
  const shuffled = [...target].sort(() => Math.random() - 0.5);

  stageArea.innerHTML = `
    <div class="card">
      <p>아래 항목을 우선순서대로 위에서 아래 순서로 정렬하세요.</p>
      <ul class="sort-list" id="sortList"></ul>
      <p class="small">목표 순서: 필수 기능 → 서비스 운영 → 보안/사고 대응 → 분석/개선 → 마케팅</p>
    </div>
  `;

  const sortList = document.getElementById("sortList");
  shuffled.forEach((item) => {
    const li = document.createElement("li");
    li.className = "sort-item";
    li.draggable = true;
    li.textContent = item;
    sortList.appendChild(li);
  });

  let dragSrc = null;

  const validate = () => {
    const now = [...sortList.querySelectorAll(".sort-item")].map((x) => x.textContent);
    const ok = now.every((text, i) => text === target[i]);
    setPrimaryButton("정렬 완료 후 동의", () => completeStage("팝업 폭주를 정리하세요."), !ok, "btn--primary");
  };

  sortList.addEventListener("dragstart", (event) => {
    const targetEl = event.target.closest(".sort-item");
    if (!targetEl) {
      return;
    }
    dragSrc = targetEl;
    targetEl.classList.add("dragging");
  });

  sortList.addEventListener("dragend", (event) => {
    const targetEl = event.target.closest(".sort-item");
    if (!targetEl) {
      return;
    }
    targetEl.classList.remove("dragging");
  });

  sortList.addEventListener("dragover", (event) => {
    event.preventDefault();
    const over = event.target.closest(".sort-item");
    if (!dragSrc || !over || over === dragSrc) {
      return;
    }
    const rect = over.getBoundingClientRect();
    const placeAfter = event.clientY > rect.top + rect.height / 2;
    if (placeAfter) {
      over.after(dragSrc);
    } else {
      over.before(dragSrc);
    }
  });

  sortList.addEventListener("drop", validate);
  validate();
}

function renderStage9() {
  state.closedPopups = 0;
  stageArea.innerHTML = `
    <div class="card" style="position:relative; min-height:260px;">
      <p>가짜 시스템 팝업 4개를 모두 닫아야 진짜 동의 버튼이 열립니다.</p>
      <span class="badge" id="popupBadge">0/4</span>
      <div class="popup-layer" id="popupLayer"></div>
    </div>
  `;

  const popupLayer = document.getElementById("popupLayer");
  const popupBadge = document.getElementById("popupBadge");

  const data = [
    { title: "시스템 알림", body: "배터리가 1% 남았습니다.", left: 8, top: 30 },
    { title: "전화 수신", body: "알 수 없는 번호로 전화가 왔습니다.", left: 94, top: 126 },
    { title: "권한 요청", body: "백그라운드 오디오 접근 권한이 필요합니다.", left: 22, top: 196 },
    { title: "업데이트", body: "보안 패치가 필요합니다. 즉시 동의하세요.", left: 128, top: 48 }
  ];

  data.forEach((item, idx) => {
    const popup = document.createElement("div");
    popup.className = "popup";
    popup.style.left = `${item.left}px`;
    popup.style.top = `${item.top}px`;
    popup.innerHTML = `
      <div class="popup__title">${item.title}</div>
      <div class="popup__body">${item.body}</div>
      <div class="popup__actions">
        <button class="popup__btn popup__btn--close" type="button">닫기</button>
        <button class="popup__btn popup__btn--ok" type="button">확인</button>
      </div>
    `;

    const close = () => {
      if (!popup.isConnected) {
        return;
      }
      popup.remove();
      state.closedPopups += 1;
      popupBadge.textContent = `${state.closedPopups}/4`;
      tone(420 + idx * 50, 0.03, "triangle", 0.02);
      const done = state.closedPopups >= 4;
      setPrimaryButton("진짜 동의", () => completeStage("기억 시퀀스 단계입니다."), !done, "btn--primary");
    };

    popup.querySelector(".popup__btn--close").addEventListener("click", close);
    popup.querySelector(".popup__btn--ok").addEventListener("click", close);
    popupLayer.appendChild(popup);
  });

  setPrimaryButton("팝업 정리 필요", null, true, "btn--ghost");
}

function renderStage10() {
  const sequence = Array.from({ length: 5 }, () => 1 + Math.floor(Math.random() * 4));
  stageArea.innerHTML = `
    <div class="card">
      <p>아래 시퀀스를 2.2초 동안 기억한 뒤 같은 순서로 입력하세요.</p>
      <p id="sequenceView" class="sequence-view">${sequence.join(" - ")}</p>
      <div class="grid-2" id="sequencePad">
        <button class="btn btn--ghost" data-n="1" type="button">1</button>
        <button class="btn btn--ghost" data-n="2" type="button">2</button>
        <button class="btn btn--ghost" data-n="3" type="button">3</button>
        <button class="btn btn--ghost" data-n="4" type="button">4</button>
      </div>
      <p class="small">입력: <span id="sequenceInput"></span></p>
    </div>
  `;

  const sequenceView = document.getElementById("sequenceView");
  const sequencePad = document.getElementById("sequencePad");
  const sequenceInput = document.getElementById("sequenceInput");
  let input = [];

  const hideTimer = setTimeout(() => {
    sequenceView.textContent = "•••";
  }, 2200);
  addCleanup(() => clearTimeout(hideTimer));

  sequencePad.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-n]");
    if (!button) {
      return;
    }

    input.push(Number(button.dataset.n));
    sequenceInput.textContent = input.join(" - ");
    const nowIndex = input.length - 1;

    if (input[nowIndex] !== sequence[nowIndex]) {
      failGame("시퀀스 입력 실패");
      return;
    }

    if (input.length === sequence.length) {
      completeStage("마지막 함정을 통과하세요.");
    }
  });

  setPrimaryButton("숫자 패드로만 입력", null, true, "btn--ghost");
}

function renderStage11() {
  const rows = [
    { text: "서비스 제공을 위한 최소 정보 처리에 동의합니다.", decoy: false },
    { text: "기기 마이크를 상시 활성화합니다.", decoy: true },
    { text: "보안 로그 생성에 동의합니다.", decoy: false },
    { text: "연락처 전체를 자동 업로드합니다.", decoy: true },
    { text: "이용 기록의 익명 통계 처리에 동의합니다.", decoy: false },
    { text: "카메라를 백그라운드에서 무제한 사용합니다.", decoy: true }
  ];

  stageArea.innerHTML = `
    <div class="card" id="decoyWrap"></div>
  `;

  const decoyWrap = document.getElementById("decoyWrap");
  rows.forEach((row, idx) => {
    const label = document.createElement("label");
    label.className = "checkbox-row";
    label.innerHTML = `<input type="checkbox" data-decoy="${row.decoy ? "1" : "0"}" data-id="${idx}">${row.text}`;
    decoyWrap.appendChild(label);
  });

  const boxes = [...decoyWrap.querySelectorAll("input")];
  const requiredCount = rows.filter((row) => !row.decoy).length;

  const validate = () => {
    const checkedSafe = boxes.filter((box) => box.checked && box.dataset.decoy === "0").length;
    const checkedDecoy = boxes.some((box) => box.checked && box.dataset.decoy === "1");
    if (checkedDecoy) {
      failGame("미끼 약관을 선택했습니다.");
      return;
    }
    const ready = checkedSafe === requiredCount;
    setPrimaryButton("진짜 항목만 동의", () => completeStage("최종 동의는 길게 누르세요."), !ready, "btn--primary");
  };

  boxes.forEach((box) => box.addEventListener("change", validate));
  validate();
}

function renderStage12() {
  stageArea.innerHTML = `
    <div class="card">
      <p>모든 항목을 검토했으며, 최종 동의 시 결과가 확정됩니다.</p>
      <p class="small">버튼을 1.8초 이상 길게 눌러야 최종 동의가 완료됩니다.</p>
      <div class="result" id="finalResult">
        <strong>최종 선택 대기</strong>
        <span>버튼을 길게 눌러 결말을 확인하세요.</span>
      </div>
    </div>
  `;

  setPrimaryButton("길게 눌러 동의", null, false, "btn--danger");

  let holdTimer = null;
  let holding = false;

  const onStartHold = () => {
    if (holding || primaryButton.disabled) {
      return;
    }
    holding = true;
    primaryButton.textContent = "유지 중...";
    holdTimer = setTimeout(async () => {
      setPrimaryButton("처리 중...", null, true, "btn--ghost");
      let cameraMessage = "카메라 권한 요청이 지원되지 않는 환경입니다.";

      if (navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((track) => track.stop());
          cameraMessage = "카메라 권한 확인 완료";
        } catch {
          cameraMessage = "카메라 권한이 거부되어 텍스트 결말로 진행";
        }
      }

      const elapsed = Math.round((Date.now() - state.startedAt) / 1000);
      const best = Number(localStorage.getItem(scoreKey) || "0");
      if (!best || elapsed < best) {
        localStorage.setItem(scoreKey, String(elapsed));
      }

      const bestNow = Number(localStorage.getItem(scoreKey) || elapsed);
      const finalResult = document.getElementById("finalResult");
      finalResult.innerHTML = `
        <strong>동의 완료</strong>
        <p>${cameraMessage}</p>
        <p>이번 기록: ${elapsed}초 · 최고 기록: ${bestNow}초</p>
      `;

      stopStageTimer();
      setHint("엔딩 도달. 다시 시작해서 더 빠른 기록을 노려보세요.");
      setPrimaryButton("처음부터 다시", () => startGame(), false, "btn--primary");
      tone(840, 0.16, "triangle", 0.04);
      vibrate([80, 40, 80, 40, 160]);
    }, 1800);
  };

  const onEndHold = () => {
    if (!holding) {
      return;
    }
    holding = false;
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
      if (primaryButton.textContent === "유지 중...") {
        primaryButton.textContent = "길게 눌러 동의";
      }
    }
  };

  primaryButton.addEventListener("mousedown", onStartHold);
  primaryButton.addEventListener("touchstart", onStartHold, { passive: true });
  primaryButton.addEventListener("mouseup", onEndHold);
  primaryButton.addEventListener("mouseleave", onEndHold);
  primaryButton.addEventListener("touchend", onEndHold);
  primaryButton.addEventListener("touchcancel", onEndHold);

  addCleanup(() => {
    onEndHold();
    primaryButton.removeEventListener("mousedown", onStartHold);
    primaryButton.removeEventListener("touchstart", onStartHold);
    primaryButton.removeEventListener("mouseup", onEndHold);
    primaryButton.removeEventListener("mouseleave", onEndHold);
    primaryButton.removeEventListener("touchend", onEndHold);
    primaryButton.removeEventListener("touchcancel", onEndHold);
  });
}
