import { STAGES } from "./stages.js";

const APP_VERSION = "v2026.03.24-02";

const appRoot = document.getElementById("appRoot");
const stageTitle = document.getElementById("stageTitle");
const stageSubtitle = document.getElementById("stageSubtitle");
const stageArea = document.getElementById("stageArea");
const hintText = document.getElementById("hintText");
const primaryButton = document.getElementById("primaryButton");
const progressBar = document.getElementById("progressBar");
const progressWrap = document.querySelector(".progress-wrap");
const liveBuildChip = document.getElementById("liveBuildChip");
const timerBadge = document.getElementById("timerBadge");
const splashScreen = document.getElementById("splashScreen");
const splashVersion = document.getElementById("splashVersion");
const installEyebrow = document.getElementById("installEyebrow");
const installHeadline = document.getElementById("installHeadline");
const installDescription = document.getElementById("installDescription");
const installMetaPrefix = document.getElementById("installMetaPrefix");
const installVersion = document.getElementById("installVersion");
const installSteps = document.getElementById("installSteps");
const installBanner = document.getElementById("installBanner");
const installButton = document.getElementById("installButton");
const dismissInstallButton = document.getElementById("dismissInstallButton");

const state = {
  stageIndex: -1,
  cleanup: [],
  stageCleared: false,
  startedAt: 0,
  closedPopups: 0,
  resetting: false,
  timerId: null,
  stageEndsAt: 0,
  deferredInstallPrompt: null,
  installBannerDismissed: false
};

const scoreKey = "consent-game-best";
const installStateKey = "consent-game-installed";

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
  state.stageCleared = false;
  state.startedAt = Date.now();
  goToStage(0);
}

function goToStage(index) {
  clearStageEffects();
  state.stageIndex = index;
  state.stageCleared = false;
  const stage = STAGES[index];
  appRoot.dataset.screen = "stage";
  stageArea.dataset.mechanic = stage.mechanic;
  stageTitle.textContent = stage.title;
  stageSubtitle.textContent = stage.subtitle;
  setHint(stage.hint);
  liveBuildChip.textContent = `LIVE BUILD · 제${stage.id}조`;
  progressWrap.setAttribute("aria-valuenow", String(stage.id));
  progressWrap.setAttribute("aria-valuemax", String(STAGES.length));
  progressBar.style.width = `${(stage.id / STAGES.length) * 100}%`;
  stageArea.innerHTML = "";
  setThreat("active", stage.id >= 9 ? "Crimson" : "Amber");
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

function setThreat(level) {
  appRoot.dataset.threat = level;
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
  primaryButton.dataset.variant = variant;
  primaryButton.onclick = onClick;
}

function completeStage(nextHint) {
  if (state.stageCleared) {
    return;
  }

  state.stageCleared = true;
  stopStageTimer();
  setThreat("success", "Cleared");
  tone(680, 0.05, "triangle", 0.04);
  if (nextHint) {
    setHint(nextHint);
  }
  setTimeout(nextStage, 240);
}

function startStageTimer(limitSec) {
  stopStageTimer();
  if (!limitSec || limitSec <= 0) {
    timerBadge.textContent = "시간 제한 없음";
    timerBadge.classList.remove("danger");
    setThreat("idle", "Stable");
    return;
  }

  state.stageEndsAt = Date.now() + limitSec * 1000;

  const tick = () => {
    const remainMs = state.stageEndsAt - Date.now();
    const remain = Math.max(0, remainMs / 1000);
    timerBadge.textContent = `남은 시간 ${remain.toFixed(1)}초`;
    if (remain <= 5) {
      timerBadge.classList.add("danger");
      setThreat("danger", "Critical");
    } else {
      timerBadge.classList.remove("danger");
      setThreat("active", remain <= 9 ? "High" : "Amber");
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
  appRoot.dataset.screen = "failure";
  setThreat("failure", "Locked");
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

function renderIntro() {
  state.stageIndex = -1;
  state.stageCleared = false;
  appRoot.dataset.screen = "intro";
  stageArea.dataset.mechanic = "intro";
  stageTitle.textContent = "Consent Crisis";
  stageSubtitle.textContent = "12개의 기만적인 동의 절차를 제한 시간 안에 돌파하는 아케이드 서바이벌.";
  liveBuildChip.textContent = "LIVE BUILD · LOBBY";
  timerBadge.textContent = "시스템 대기 중";
  timerBadge.classList.remove("danger");
  progressWrap.setAttribute("aria-valuenow", "0");
  progressWrap.setAttribute("aria-valuemax", String(STAGES.length));
  progressBar.style.width = "0%";
  setThreat("idle", "Amber");
  setHint("시작 버튼을 누르면 12개의 동의 함정이 순서대로 활성화됩니다.");
  stageArea.innerHTML = `
    <div class="intro-screen">
      <div class="intro-screen__hero card card--hero">
        <p class="hero-kicker">MISSION BRIEFING</p>
        <h2>읽는 게임이 아니라, 버티는 게임.</h2>
        <p>
          체크박스, 약관 카드, 함정 버튼, 팝업 폭주가 연속으로 몰아칩니다.
          매 스테이지는 다른 방식으로 당신의 집중력을 흔들고, 한 번의 실수는 전체 리셋으로 이어집니다.
        </p>
        <div class="hero-tags">
          <span class="hero-tag">12 STAGES</span>
          <span class="hero-tag">TIME ATTACK</span>
          <span class="hero-tag">NO MERCY RESET</span>
        </div>
      </div>
      <div class="intro-screen__grid">
        <article class="card card--brief">
          <p class="hero-kicker">Objective</p>
          <strong>모든 동의 함정을 뚫고 최종 선택에 도달하세요.</strong>
          <p class="small">체크, 스크롤, 기억, 정렬, 회피, 홀드 입력까지 모든 감각을 사용해야 합니다.</p>
        </article>
        <article class="card card--brief">
          <p class="hero-kicker">Best Play</p>
          <strong>${Number(localStorage.getItem(scoreKey) || "0") ? `${Number(localStorage.getItem(scoreKey) || "0")}초` : "아직 기록 없음"}</strong>
          <p class="small">가장 빠른 기록은 좌측 패널에도 표시됩니다. 이번엔 더 날카롭게 통과해 보세요.</p>
        </article>
      </div>
    </div>
  `;
  setPrimaryButton("미션 시작", null, false, "btn--primary");
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

function shuffleArray(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function syncVersionLabels() {
  splashVersion.textContent = APP_VERSION;
  installVersion.textContent = APP_VERSION;
}

function hideSplashScreen() {
  splashScreen.classList.add("hidden");
  const removeTimer = setTimeout(() => {
    splashScreen.hidden = true;
  }, 420);
  addCleanup(() => clearTimeout(removeTimer));
}

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIPhoneDevice() {
  const userAgent = window.navigator.userAgent || "";
  return /iPhone/i.test(userAgent);
}

function isSafariBrowser() {
  const userAgent = window.navigator.userAgent || "";
  return /Safari/i.test(userAgent) && !/(CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|YaBrowser)/i.test(userAgent);
}

function isInstalledApp() {
  if (isStandaloneMode()) {
    localStorage.setItem(installStateKey, "1");
    return true;
  }

  return localStorage.getItem(installStateKey) === "1";
}

function setInstallSteps(items) {
  installSteps.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

function applyInstallBannerMode(mode) {
  installBanner.dataset.mode = mode;

  if (mode === "iphone") {
    installEyebrow.textContent = "IPHONE QUICK INSTALL";
    installHeadline.textContent = "홈 화면에 추가하면 앱처럼 바로 실행됩니다.";
    installDescription.textContent = "iPhone Safari에서는 설치 버튼 대신 공유 메뉴에서 홈 화면에 추가를 선택해야 합니다.";
    installMetaPrefix.textContent = "iPhone build";
    setInstallSteps([
      "Safari 하단의 공유 버튼을 누르세요.",
      "홈 화면에 추가를 선택하세요.",
      "추가를 누르면 다음 실행부터 배너가 사라집니다."
    ]);
    installSteps.hidden = false;
    installButton.hidden = true;
    dismissInstallButton.textContent = "닫기";
    return;
  }

  if (mode === "iphone-browser") {
    installEyebrow.textContent = "IPHONE INSTALL";
    installHeadline.textContent = "Safari에서 열어야 홈 화면 설치가 가능합니다.";
    installDescription.textContent = "현재 브라우저에서는 설치 메뉴가 제한됩니다. Safari로 연 뒤 홈 화면에 추가를 진행하세요.";
    installMetaPrefix.textContent = "iPhone build";
    setInstallSteps([
      "이 페이지를 Safari에서 다시 여세요.",
      "Safari 공유 버튼을 누르세요.",
      "홈 화면에 추가를 선택하세요."
    ]);
    installSteps.hidden = false;
    installButton.hidden = true;
    dismissInstallButton.textContent = "닫기";
    return;
  }

  installEyebrow.textContent = "설치 권장";
  installHeadline.textContent = "앱으로 설치하면 전체 화면으로 더 빠르게 실행됩니다.";
  installDescription.textContent = "오프라인 실행, 자동 업데이트, 홈 화면 바로가기를 지원합니다.";
  installMetaPrefix.textContent = "빌드";
  installSteps.hidden = true;
  installSteps.innerHTML = "";
  installButton.hidden = false;
  dismissInstallButton.textContent = "나중에";
}

function updateInstallBannerVisibility() {
  const installed = isInstalledApp();
  const iPhone = isIPhoneDevice();
  const safari = isSafariBrowser();

  let mode = "hidden";
  if (!installed) {
    if (iPhone && safari) {
      mode = "iphone";
    } else if (iPhone) {
      mode = "iphone-browser";
    } else if (state.deferredInstallPrompt) {
      mode = "prompt";
    }
  }

  const visible = mode !== "hidden" && !state.installBannerDismissed;
  applyInstallBannerMode(mode === "hidden" ? "prompt" : mode);
  installBanner.hidden = !visible;
  installBanner.classList.toggle("show", visible);
}

function setupInstallPrompt() {
  installButton.addEventListener("click", async () => {
    if (!state.deferredInstallPrompt || installButton.hidden) {
      return;
    }

    const promptEvent = state.deferredInstallPrompt;
    state.deferredInstallPrompt = null;
    promptEvent.prompt();
    await promptEvent.userChoice.catch(() => null);
    updateInstallBannerVisibility();
  });

  dismissInstallButton.addEventListener("click", () => {
    state.installBannerDismissed = true;
    updateInstallBannerVisibility();
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    state.installBannerDismissed = false;
    updateInstallBannerVisibility();
  });

  window.addEventListener("appinstalled", () => {
    state.deferredInstallPrompt = null;
    localStorage.setItem(installStateKey, "1");
    updateInstallBannerVisibility();
  });

  window.addEventListener("pageshow", updateInstallBannerVisibility);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      updateInstallBannerVisibility();
    }
  });

  updateInstallBannerVisibility();
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  let refreshing = false;

  const activateWaitingWorker = (worker) => {
    if (!worker) {
      return;
    }
    worker.postMessage({ type: "SKIP_WAITING" });
  };

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) {
      return;
    }
    refreshing = true;
    window.location.reload();
  });

  try {
    const registration = await navigator.serviceWorker.register("./service-worker.js", {
      scope: "./"
    });

    if (registration.waiting) {
      activateWaitingWorker(registration.waiting);
    }

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) {
        return;
      }

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          activateWaitingWorker(newWorker);
        }
      });
    });

    const refreshRegistration = () => registration.update().catch(() => {});
    setInterval(refreshRegistration, 60 * 1000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        refreshRegistration();
      }
    });
  } catch {
    return;
  }
}

function lockViewportZoom() {
  let lastTouchEnd = 0;

  document.addEventListener("gesturestart", (event) => {
    event.preventDefault();
  }, { passive: false });

  document.addEventListener("gesturechange", (event) => {
    event.preventDefault();
  }, { passive: false });

  document.addEventListener("gestureend", (event) => {
    event.preventDefault();
  }, { passive: false });

  document.addEventListener("touchend", (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  window.addEventListener("wheel", (event) => {
    if (event.ctrlKey) {
      event.preventDefault();
    }
  }, { passive: false });
}

function renderStage1() {
  const onCount = randomInt(1, 4);
  const target = shuffleArray([
    ...Array.from({ length: onCount }, () => true),
    ...Array.from({ length: 4 - onCount }, () => false)
  ]);

  stageArea.innerHTML = `
    <div class="card">
      <p>시스템이 1.8초 동안 승인 패턴을 보여줍니다. 같은 상태로 스위치를 맞추세요.</p>
      <div class="badge" id="switchBrief">${target.map((value) => (value ? "ON" : "OFF")).join(" · ")}</div>
      <div class="switch-grid" id="switchGrid"></div>
      <p class="small" id="switchStateText">패턴을 기억한 뒤 스위치를 맞추면 자동으로 통과합니다.</p>
    </div>
  `;

  const switchGrid = document.getElementById("switchGrid");
  const switchBrief = document.getElementById("switchBrief");
  const switchStateText = document.getElementById("switchStateText");
  const current = Array.from({ length: 4 }, () => false);

  current.forEach((_, index) => {
    const button = document.createElement("button");
    button.className = "switch-tile";
    button.type = "button";
    button.textContent = `채널 ${index + 1} · OFF`;
    button.addEventListener("click", () => {
      current[index] = !current[index];
      button.classList.toggle("active", current[index]);
      button.textContent = `채널 ${index + 1} · ${current[index] ? "ON" : "OFF"}`;
      tone(current[index] ? 520 : 260, 0.03, "triangle", 0.025);
      const matched = current.every((value, currentIndex) => value === target[currentIndex]);
      switchStateText.textContent = `${current.filter(Boolean).length}/4 채널 활성화`;
      if (matched) {
        completeStage("숨겨진 승인 문서를 찾아야 합니다.");
      }
    });
    switchGrid.appendChild(button);
  });

  const briefTimer = setTimeout(() => {
    switchBrief.textContent = "패턴 숨김";
  }, 1800);
  addCleanup(() => clearTimeout(briefTimer));
  setPrimaryButton("스위치 패턴 일치 필요", null, true, "btn--ghost");
}

function renderStage2() {
  const dossierCount = 9;
  const targetId = randomInt(0, dossierCount - 1);
  let scanCount = 0;

  stageArea.innerHTML = `
    <div class="card">
      <p>봉인된 문서 9개 중 하나에만 진짜 승인 문서가 있습니다. 잘못 열면 위치가 다시 섞입니다.</p>
      <div class="dossier-grid" id="dossierGrid"></div>
      <p class="small" id="dossierHint">스캔 횟수 0회</p>
    </div>
  `;

  const dossierGrid = document.getElementById("dossierGrid");
  const dossierHint = document.getElementById("dossierHint");

  const renderDossiers = () => {
    const order = shuffleArray(Array.from({ length: dossierCount }, (_, index) => index));
    dossierGrid.innerHTML = "";
    order.forEach((id) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "dossier-card";
      button.innerHTML = `<span>문서 ${String(id + 1).padStart(2, "0")}</span><strong>SEALED</strong>`;
      button.addEventListener("click", () => {
        if (id === targetId) {
          button.classList.add("dossier-card--real");
          button.innerHTML = `<span>문서 ${String(id + 1).padStart(2, "0")}</span><strong>진짜 동의 발견</strong>`;
          tone(640, 0.06, "triangle", 0.03);
          completeStage("이제 타이밍 맞춰 시스템을 동기화하세요.");
          return;
        }

        scanCount += 1;
        dossierHint.textContent = `헛스캔 ${scanCount}회 · 위치 재배열 중`;
        tone(180, 0.05, "sawtooth", 0.03);
        button.classList.add("dossier-card--empty");
        button.innerHTML = `<span>문서 ${String(id + 1).padStart(2, "0")}</span><strong>빈 서류</strong>`;
        const reshuffleTimer = setTimeout(renderDossiers, 220);
        addCleanup(() => clearTimeout(reshuffleTimer));
      });
      dossierGrid.appendChild(button);
    });
  };

  renderDossiers();
  setPrimaryButton("문서 직접 스캔 필요", null, true, "btn--ghost");
}

function renderStage3() {
  stageArea.innerHTML = `
    <div class="card">
      <p>움직이는 마커가 초록 구간에 들어올 때 동기화 버튼을 눌러 3번 성공시키세요. 한 번이라도 빗나가면 실패입니다.</p>
      <div class="sync-console">
        <div class="sync-track">
          <div class="sync-zone" id="syncZone"></div>
          <div class="sync-marker" id="syncMarker"></div>
        </div>
        <div class="sync-status" id="syncStatus">동기화 성공 0/3</div>
      </div>
      <div class="action-row" style="margin-top:12px;">
        <button class="btn btn--primary" id="syncButton" type="button">동기화</button>
      </div>
    </div>
  `;

  const syncZone = document.getElementById("syncZone");
  const syncMarker = document.getElementById("syncMarker");
  const syncStatus = document.getElementById("syncStatus");
  const syncButton = document.getElementById("syncButton");
  let position = 0;
  let velocity = 1.5;
  let hitCount = 0;
  let zoneStart = 28;
  const zoneWidth = 18;

  const updateZone = () => {
    zoneStart = randomInt(12, 68);
    syncZone.style.left = `${zoneStart}%`;
    syncZone.style.width = `${zoneWidth}%`;
  };

  updateZone();

  const intervalId = setInterval(() => {
    position += velocity;
    if (position >= 96 || position <= 0) {
      velocity *= -1;
      position = Math.max(0, Math.min(96, position));
    }
    syncMarker.style.left = `${position}%`;
  }, 16);

  syncButton.addEventListener("click", () => {
    const inZone = position >= zoneStart && position <= zoneStart + zoneWidth;
    if (!inZone) {
      failGame("동기화 타이밍을 놓쳤습니다.");
      return;
    }

    hitCount += 1;
    syncStatus.textContent = `동기화 성공 ${hitCount}/3`;
    tone(520 + hitCount * 60, 0.04, "triangle", 0.03);
    if (hitCount >= 3) {
      completeStage("왜곡된 단어 조각을 복원하세요.");
      return;
    }
    updateZone();
  });

  addCleanup(() => clearInterval(intervalId));
  setPrimaryButton("패널 내부 버튼으로 진행", null, true, "btn--ghost");
}

function renderStage4() {
  const targets = shuffleArray([
    "필수",
    "로그",
    "암호화",
    "동의",
    "마케팅",
    "연락처",
    "상시",
    "공유",
    "광고"
  ]);
  const answer = ["필수", "로그", "암호화", "동의"];
  let progress = 0;

  stageArea.innerHTML = `
    <div class="card">
      <p>진짜 승인 문장을 복원하세요. 올바른 순서는 <strong>필수 → 로그 → 암호화 → 동의</strong> 입니다.</p>
      <div class="fragment-grid" id="fragmentGrid"></div>
      <p class="small" id="fragmentStatus">복원 진행 0/4</p>
    </div>
  `;

  const fragmentGrid = document.getElementById("fragmentGrid");
  const fragmentStatus = document.getElementById("fragmentStatus");
  targets.forEach((word) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fragment-chip";
    button.textContent = word;
    button.addEventListener("click", () => {
      if (word !== answer[progress]) {
        failGame("왜곡된 문장을 잘못 선택했습니다.");
        return;
      }

      progress += 1;
      button.disabled = true;
      button.classList.add("fragment-chip--ok");
      fragmentStatus.textContent = `복원 진행 ${progress}/4`;
      tone(420 + progress * 70, 0.04, "triangle", 0.03);
      if (progress >= answer.length) {
        completeStage("이제 동의 두더지를 잡아야 합니다.");
      }
    });
    fragmentGrid.appendChild(button);
  });

  setPrimaryButton("단어 조각 선택 필요", null, true, "btn--ghost");
}

function renderStage5() {
  stageArea.innerHTML = `
    <div class="card">
      <p>동의 버튼이 구멍 사이를 튑니다. 6번 포착하면 통과하지만, 붉은 "거절"을 누르면 즉시 실패합니다.</p>
      <div class="mole-grid" id="moleGrid"></div>
      <p class="small" id="moleStatus">포착 0/6</p>
    </div>
  `;

  const moleGrid = document.getElementById("moleGrid");
  const moleStatus = document.getElementById("moleStatus");
  const holes = [];
  let hits = 0;
  let agreeIndex = -1;
  let trapIndex = -1;

  for (let index = 0; index < 9; index += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mole-hole";
    button.textContent = "대기";
    button.addEventListener("click", () => {
      if (index === agreeIndex) {
        hits += 1;
        moleStatus.textContent = `포착 ${hits}/6`;
        tone(520 + hits * 20, 0.03, "triangle", 0.03);
        if (hits >= 6) {
          completeStage("이제 절단 순서를 지켜 와이어를 끊으세요.");
          return;
        }
        rotateHoles();
        return;
      }

      if (index === trapIndex) {
        failGame("거절 버튼을 눌렀습니다.");
      }
    });
    holes.push(button);
    moleGrid.appendChild(button);
  }

  const paintHoles = () => {
    holes.forEach((hole, index) => {
      hole.className = "mole-hole";
      hole.textContent = "대기";
      if (index === agreeIndex) {
        hole.classList.add("mole-hole--agree");
        hole.textContent = "동의";
      }
      if (index === trapIndex) {
        hole.classList.add("mole-hole--trap");
        hole.textContent = "거절";
      }
    });
  };

  const rotateHoles = () => {
    agreeIndex = randomInt(0, holes.length - 1);
    trapIndex = Math.random() > 0.55 ? randomInt(0, holes.length - 1) : -1;
    while (trapIndex === agreeIndex) {
      trapIndex = randomInt(0, holes.length - 1);
    }
    paintHoles();
  };

  const moleTimer = setInterval(rotateHoles, 620);
  rotateHoles();
  addCleanup(() => clearInterval(moleTimer));
  setPrimaryButton("패널 내부 버튼으로 진행", null, true, "btn--ghost");
}

function renderStage6() {
  const order = shuffleArray([
    { id: "red", label: "RED" },
    { id: "blue", label: "BLUE" },
    { id: "yellow", label: "YELLOW" },
    { id: "green", label: "GREEN" }
  ]);
  let step = 0;

  stageArea.innerHTML = `
    <div class="card">
      <p>보안 와이어를 순서대로 절단하세요. 잘못 자르면 즉시 시스템이 잠깁니다.</p>
      <div class="badge">절단 순서: ${order.map((wire) => wire.label).join(" → ")}</div>
      <div class="wire-stack" id="wireStack"></div>
      <p class="small" id="wireStatus">절단 진행 0/4</p>
    </div>
  `;

  const wireStack = document.getElementById("wireStack");
  const wireStatus = document.getElementById("wireStatus");
  const wires = shuffleArray(order);

  wires.forEach((wire) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `wire wire--${wire.id}`;
    button.textContent = `${wire.label} CUT`;
    button.addEventListener("click", () => {
      if (wire.id !== order[step].id) {
        failGame("와이어 절단 순서가 틀렸습니다.");
        return;
      }

      button.disabled = true;
      button.classList.add("wire--cut");
      step += 1;
      wireStatus.textContent = `절단 진행 ${step}/4`;
      tone(300 + step * 120, 0.04, "square", 0.03);
      if (step >= order.length) {
        completeStage("숨겨진 승인 버튼을 버튼 미로에서 찾으세요.");
      }
    });
    wireStack.appendChild(button);
  });

  setPrimaryButton("패널 내부 버튼으로 진행", null, true, "btn--ghost");
}

function renderStage7() {
  const labels = shuffleArray([
    { text: "계속", real: false },
    { text: "확인", real: false },
    { text: "허용", real: false },
    { text: "보류", real: false },
    { text: "차단", real: false },
    { text: "취소", real: false },
    { text: "승인", real: true },
    { text: "유지", real: false },
    { text: "무시", real: false },
    { text: "삭제", real: false }
  ]);
  let scrambleCount = 0;

  stageArea.innerHTML = `
    <div class="card">
      <p>버튼 미로 어딘가에 있는 진짜 승인 버튼을 찾으세요. 가짜를 누르면 전부 다시 섞입니다.</p>
      <div class="button-maze" id="buttonMaze"></div>
      <p class="small" id="mazeStatus">허수 클릭 0회</p>
    </div>
  `;

  const buttonMaze = document.getElementById("buttonMaze");
  const mazeStatus = document.getElementById("mazeStatus");
  const slots = [
    { x: 4, y: 8 }, { x: 35, y: 10 }, { x: 68, y: 8 },
    { x: 10, y: 34 }, { x: 42, y: 30 }, { x: 72, y: 38 },
    { x: 2, y: 62 }, { x: 34, y: 62 }, { x: 63, y: 66 }, { x: 76, y: 84 }
  ];

  const buttons = labels.map((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `maze-button${item.real ? " maze-button--real" : ""}`;
    button.textContent = item.text;
    button.addEventListener("click", () => {
      if (item.real) {
        completeStage("세 개의 다이얼을 목표 수치에 맞추세요.");
        return;
      }

      scrambleCount += 1;
      mazeStatus.textContent = `허수 클릭 ${scrambleCount}회 · 버튼 재배치`;
      tone(160, 0.05, "sawtooth", 0.03);
      layoutButtons();
    });
    buttonMaze.appendChild(button);
    return button;
  });

  const layoutButtons = () => {
    const nextSlots = shuffleArray(slots);
    buttons.forEach((button, index) => {
      const slot = nextSlots[index % nextSlots.length];
      button.style.left = `${slot.x}%`;
      button.style.top = `${slot.y}%`;
    });
  };

  requestAnimationFrame(layoutButtons);
  setPrimaryButton("패널 내부 버튼으로 진행", null, true, "btn--ghost");
}

function renderStage8() {
  const targets = [randomInt(15, 30), randomInt(48, 68), randomInt(70, 88)];
  const values = [randomInt(0, 100), randomInt(0, 100), randomInt(0, 100)];

  stageArea.innerHTML = `
    <div class="card">
      <p>세 개의 승인 다이얼을 목표 수치에 맞추세요. 각 수치에서 ±3 안이면 잠금이 해제됩니다.</p>
      <div class="slider-bank" id="sliderBank"></div>
      <p class="small" id="dialStatus">세 다이얼 모두 목표값에 맞춰야 합니다.</p>
    </div>
  `;

  const sliderBank = document.getElementById("sliderBank");
  const dialStatus = document.getElementById("dialStatus");

  const validate = () => {
    const ok = values.every((value, index) => Math.abs(value - targets[index]) <= 3);
    dialStatus.textContent = `현재 값: ${values.join(" / ")} · 목표: ${targets.join(" / ")}`;
    if (ok) {
      completeStage("팝업 폭주 속 함정 버튼을 피해 정리하세요.");
    }
  };

  values.forEach((value, index) => {
    const card = document.createElement("div");
    card.className = "slider-card";
    card.innerHTML = `
      <span class="hero-kicker">Dial ${index + 1}</span>
      <strong>Target ${targets[index]}</strong>
      <input class="dial-input" type="range" min="0" max="100" value="${value}">
      <span class="small" id="dialValue${index}">${value}</span>
    `;
    const input = card.querySelector("input");
    const valueText = card.querySelector(`#dialValue${index}`);
    input.addEventListener("input", () => {
      values[index] = Number(input.value);
      valueText.textContent = input.value;
      validate();
    });
    sliderBank.appendChild(card);
  });

  validate();
  setPrimaryButton("다이얼 정렬 필요", null, true, "btn--ghost");
}

function renderStage9() {
  state.closedPopups = 0;
  stageArea.innerHTML = `
    <div class="card card--popup-stage" style="position:relative; min-height:360px;">
      <p>팝업을 빠르게 정리하세요. 대부분은 확인 버튼이지만, 한 개는 같은 모양의 함정 버튼이 섞여 있습니다. 함정 팝업은 본문 버튼 대신 ×로 닫아야 합니다.</p>
      <span class="badge" id="popupBadge">0/10</span>
      <div class="popup-layer" id="popupLayer"></div>
    </div>
  `;

  const popupLayer = document.getElementById("popupLayer");
  const popupBadge = document.getElementById("popupBadge");

  const trapIndex = randomInt(0, 9);
  const availableLayers = shuffleArray([1, 2, 3, 4, 6, 7, 8, 9, 10]);
  const data = Array.from({ length: 10 }, (_, index) => ({
    title: index === trapIndex ? randomChoice(["권한 확인", "세션 확인", "상태 확인"]) : randomChoice(["시스템 알림", "업데이트", "오류 보고", "권한 요청"]),
    body: index === trapIndex ? randomChoice([
      "승인 상태를 다시 확인합니다.",
      "세션 유지를 위해 버튼을 눌러 주세요.",
      "채널 점검을 위해 즉시 응답해 주세요."
    ]) : randomChoice([
      "임시 캐시 정리가 필요합니다.",
      "세션 무결성 확인 중입니다.",
      "백그라운드 점검이 진행 중입니다.",
      "알림 채널 상태를 재동기화합니다."
    ]),
    left: index === trapIndex ? randomInt(42, 92) : randomInt(4, 146),
    top: index === trapIndex ? randomInt(78, 150) : randomInt(18, 228),
    zIndex: index === trapIndex ? 5 : availableLayers.pop(),
    trap: index === trapIndex
  }));

  data.forEach((item, idx) => {
    const popup = document.createElement("div");
    popup.className = "popup";
    popup.style.left = `${item.left}px`;
    popup.style.top = `${item.top}px`;
    popup.style.zIndex = String(item.zIndex);
    popup.innerHTML = `
      <div class="popup__title">${item.title}</div>
      <div class="popup__body">${item.body}</div>
      <div class="popup__actions">
        <button class="popup__btn popup__btn--close" type="button">×</button>
        <button class="popup__btn ${item.trap ? "popup__btn--trap" : "popup__btn--ok"}" type="button">${item.trap ? "거부" : "확인"}</button>
      </div>
    `;

    const close = () => {
      if (!popup.isConnected) {
        return;
      }
      popup.remove();
      state.closedPopups += 1;
      popupBadge.textContent = `${state.closedPopups}/10`;
      tone(420 + idx * 50, 0.03, "triangle", 0.02);
      if (state.closedPopups >= 10) {
        completeStage("기억 시퀀스 단계입니다.");
      }
    };

    popup.querySelector(".popup__btn--close").addEventListener("click", () => {
      if (item.trap) {
        close();
        return;
      }
      failGame("정상 팝업에서 × 버튼을 눌렀습니다.");
    });
    popup.querySelector(`.${item.trap ? "popup__btn--trap" : "popup__btn--ok"}`).addEventListener("click", () => {
      if (item.trap) {
        failGame("함정 팝업의 '동의 안함' 버튼을 눌렀습니다.");
        return;
      }
      close();
    });
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
  const rows = shuffleArray([
    { text: "서비스 제공을 위한 최소한의 계정 정보 처리에 동의합니다.", decoy: false },
    { text: "기기 마이크를 상시 활성화하고 모든 음성을 수집합니다.", decoy: true },
    { text: "장애 대응 및 보안 점검을 위한 운영 로그 저장에 동의합니다.", decoy: false },
    { text: "연락처 전체를 주기적으로 서버에 자동 업로드합니다.", decoy: true },
    { text: "서비스 개선을 위한 이용 기록의 익명 통계 처리에 동의합니다.", decoy: false },
    { text: "카메라를 백그라운드에서 제한 없이 계속 사용합니다.", decoy: true }
  ]);

  stageArea.innerHTML = `
    <div class="card" id="decoyWrap">
      <p class="small">정상적인 서비스 운영 범위의 동의 3개만 선택하세요. 과도한 상시 수집 문구는 미끼입니다.</p>
    </div>
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
      <p>최종 승인 봉인을 1 → 2 → 3 → 4 순으로 해제하세요. 이후 4초 동안 이동하는 최종 승인 버튼을 3번 연속 포착해야 합니다.</p>
      <div class="seal-field" id="sealField"></div>
      <div class="result" id="finalResult">
        <strong>최종 선택 대기</strong>
        <span>봉인을 순서대로 해제하세요.</span>
      </div>
    </div>
  `;

  setPrimaryButton("봉인 해제 필요", null, true, "btn--ghost");

  const sealField = document.getElementById("sealField");
  const finalResult = document.getElementById("finalResult");
  const slots = [
    { x: 8, y: 16 },
    { x: 58, y: 14 },
    { x: 24, y: 48 },
    { x: 68, y: 54 },
    { x: 14, y: 78 },
    { x: 56, y: 78 }
  ];
  let sequence = 1;
  let finalTimer = null;
  let moveTimer = null;
  let finalHits = 0;

  const finishRun = async () => {
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
    appRoot.dataset.screen = "complete";
    setThreat("success", "Cleared");
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
  };

  const renderSeal = () => {
    sealField.innerHTML = "";
    const nextSlots = shuffleArray(slots);

    if (sequence <= 4) {
      const correctSlot = nextSlots[0];
      const decoySlots = nextSlots.slice(1, 3);
      const correctButton = document.createElement("button");
      correctButton.type = "button";
      correctButton.className = "seal-button";
      correctButton.textContent = `봉인 ${sequence}`;
      correctButton.style.left = `${correctSlot.x}%`;
      correctButton.style.top = `${correctSlot.y}%`;
      correctButton.addEventListener("click", () => {
        tone(500 + sequence * 90, 0.04, "triangle", 0.03);
        sequence += 1;
        finalResult.innerHTML = `
          <strong>봉인 해제 ${sequence - 1}/4</strong>
          <span>${sequence <= 4 ? `${sequence}번째 봉인을 찾으세요.` : "최종 승인 추적 단계가 시작됩니다."}</span>
        `;
        renderSeal();
      });
      sealField.appendChild(correctButton);

      decoySlots.forEach((slot, index) => {
        const decoy = document.createElement("button");
        decoy.type = "button";
        decoy.className = "seal-button seal-button--decoy";
        decoy.textContent = `오류 ${index + 1}`;
        decoy.style.left = `${slot.x}%`;
        decoy.style.top = `${slot.y}%`;
        decoy.addEventListener("click", () => failGame("가짜 봉인을 눌렀습니다."));
        sealField.appendChild(decoy);
      });
      return;
    }

    finalHits = 0;
    finalResult.innerHTML = `
      <strong>최종 승인 추적 0/3</strong>
      <span>움직이는 승인 버튼을 3번 연속 포착하세요.</span>
    `;

    const finalButton = document.createElement("button");
    finalButton.type = "button";
    finalButton.className = "seal-button seal-button--final";
    finalButton.textContent = "승인";

    const decoys = ["취소", "거부"].map((label) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "seal-button seal-button--decoy";
      button.textContent = label;
      button.addEventListener("click", () => failGame("최종 승인 단계에서 함정을 눌렀습니다."));
      sealField.appendChild(button);
      return button;
    });

    const placeFinalButtons = () => {
      const positions = shuffleArray(slots).slice(0, 3);
      [finalButton, ...decoys].forEach((button, index) => {
        button.style.left = `${positions[index].x}%`;
        button.style.top = `${positions[index].y}%`;
      });
    };

    finalButton.addEventListener("click", () => {
      finalHits += 1;
      tone(720 + finalHits * 40, 0.04, "triangle", 0.03);
      finalResult.innerHTML = `
        <strong>최종 승인 추적 ${finalHits}/3</strong>
        <span>${finalHits >= 3 ? "승인 완료 처리 중" : "계속 추적하세요."}</span>
      `;
      if (finalHits >= 3) {
        if (finalTimer) {
          clearTimeout(finalTimer);
        }
        if (moveTimer) {
          clearInterval(moveTimer);
        }
        finishRun();
        return;
      }
      placeFinalButtons();
    });

    sealField.appendChild(finalButton);
    placeFinalButtons();
    moveTimer = setInterval(placeFinalButtons, 420);
    finalTimer = setTimeout(() => failGame("최종 승인 추적에 실패했습니다."), 4000);
    addCleanup(() => {
      if (moveTimer) {
        clearInterval(moveTimer);
      }
      if (finalTimer) {
        clearTimeout(finalTimer);
      }
    });
  };

  renderSeal();
}

renderIntro();
registerServiceWorker();
lockViewportZoom();
syncVersionLabels();
setupInstallPrompt();

window.addEventListener("load", () => {
  setTimeout(hideSplashScreen, 900);
});
